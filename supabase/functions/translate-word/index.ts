// Translates a Dutch word or sentence via GPT and stores it in the student's vocabulary.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  text: string;
  type: "word" | "sentence";
  context?: string;
  profile_id: string;
  story_id?: string;
  source?: "nl" | "en";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const text = (body.text || "").trim();
    const type = body.type;
    const source = body.source === "en" ? "en" : "nl";
    if (!text || (type !== "word" && type !== "sentence") || !body.profile_id) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const normalized = type === "word" ? text.toLowerCase().replace(/[.,!?;:"'()]/g, "") : text;

    // Only cache-lookup for NL source (dutch_text is the key)
    let cached: any = null;
    if (source === "nl") {
      const { data } = await supabase
        .from("vocabulary_entries")
        .select("*")
        .eq("dutch_text", normalized)
        .eq("type", type)
        .maybeSingle();
      cached = data;
    }

    let entry = cached;

    if (!entry) {
      const systemPromptNL = type === "word"
        ? `You are a Dutch-to-English tutor for kids. Given a Dutch word, respond ONLY with JSON: {"dutch":"the Dutch word as given","translation":"English translation","part_of_speech":"noun|verb|adjective|...","lemma":"base form (infinitive for verbs) in Dutch","explanation":"short kid-friendly English explanation (1-2 sentences)","example":"one short Dutch example sentence using the word","verb_forms": null OR (only if it is a verb) {"infinitive":"...","present":{"ik":"...","jij":"...","hij":"...","wij":"...","jullie":"...","zij":"..."},"past":{"ik":"...","jij":"...","hij":"...","wij":"...","jullie":"...","zij":"..."},"perfect":"heb/is + voltooid deelwoord (e.g. heb gewerkt)"}}. Only include verb_forms when part_of_speech is verb. No extra text.`
        : `You are a Dutch-to-English tutor for kids. Given a Dutch sentence, respond ONLY with JSON: {"dutch":"the Dutch sentence as given","translation":"natural English translation","explanation":"short kid-friendly English note about meaning/grammar (1-2 sentences)"}. No extra text.`;

      const systemPromptEN = type === "word"
        ? `You are an English-to-Dutch tutor for kids. Given an English word, respond ONLY with JSON: {"dutch":"the most natural Dutch translation (single word, lowercase, no article)","translation":"the original English word","part_of_speech":"noun|verb|adjective|...","lemma":"base form (infinitive for verbs) in Dutch","explanation":"short kid-friendly English explanation of the Dutch word (1-2 sentences)","example":"one short Dutch example sentence using the Dutch word","verb_forms": null OR (only if it is a verb) {"infinitive":"...","present":{"ik":"...","jij":"...","hij":"...","wij":"...","jullie":"...","zij":"..."},"past":{"ik":"...","jij":"...","hij":"...","wij":"...","jullie":"...","zij":"..."},"perfect":"heb/is + voltooid deelwoord"}}. Only include verb_forms when part_of_speech is verb. No extra text.`
        : `You are an English-to-Dutch tutor for kids. Given an English sentence, respond ONLY with JSON: {"dutch":"natural Dutch translation","translation":"the original English sentence","explanation":"short kid-friendly English note about the Dutch translation (1-2 sentences)"}. No extra text.`;

      const systemPrompt = source === "en" ? systemPromptEN : systemPromptNL;


      const userPrompt = body.context
        ? `Dutch ${type}: "${text}"\nContext (surrounding sentence): "${body.context}"`
        : `Dutch ${type}: "${text}"`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
        return new Response(JSON.stringify({ error: "AI error", status: aiResp.status, detail: errText }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiJson = await aiResp.json();
      const content = aiJson?.choices?.[0]?.message?.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch { parsed = {}; }


      const insert = {
        dutch_text: normalized,
        type,
        translation: parsed.translation || "",
        part_of_speech: parsed.part_of_speech || null,
        lemma: parsed.lemma || null,
        explanation: parsed.explanation || null,
        example: parsed.example || null,
        verb_forms: parsed.verb_forms || null,
      };


      const { data: inserted, error: insErr } = await supabase
        .from("vocabulary_entries")
        .upsert(insert, { onConflict: "dutch_text,type" })
        .select("*")
        .single();

      if (insErr) throw insErr;
      entry = inserted;
    }

    const { data: existing } = await supabase
      .from("vocabulary_lookups")
      .select("id, lookup_count")
      .eq("profile_id", body.profile_id)
      .eq("entry_id", entry!.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("vocabulary_lookups")
        .update({
          lookup_count: existing.lookup_count + 1,
          last_looked_up_at: new Date().toISOString(),
          story_id: body.story_id ?? undefined,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("vocabulary_lookups").insert({
        profile_id: body.profile_id,
        entry_id: entry!.id,
        story_id: body.story_id ?? null,
      });
    }

    return new Response(JSON.stringify({ entry }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
