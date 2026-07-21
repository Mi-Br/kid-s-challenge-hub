// Evaluates a student's open-ended Dutch answer using GPT via Lovable AI Gateway.
// Returns a 3-state judgement (correct/partial/incorrect) with Dutch feedback.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvalRequest {
  question: string;
  studentAnswer: string;
  storyText?: string;
  exampleAnswer?: string;
  rubric?: string;
  keyElements?: string[];
  groepLevel?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EvalRequest = await req.json();
    const { question, studentAnswer, storyText, exampleAnswer, rubric, keyElements, groepLevel } = body;

    if (!question || !studentAnswer) {
      return new Response(
        JSON.stringify({ error: "Missing question or studentAnswer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const levelHint = groepLevel
      ? `De leerling zit in ${groepLevel} (NT2 — Nederlands als tweede taal).`
      : "De leerling is een NT2-leerder.";

    const contextBlock = storyText
      ? `\n\nDe originele tekst waarover de vraag gaat:\n"""${storyText}"""\n`
      : "";

    const rubricBlock = rubric ? `\nBeoordelingscriteria: ${rubric}` : "";
    const exampleBlock = exampleAnswer ? `\nVoorbeeld van een goed antwoord: ${exampleAnswer}` : "";
    const keyBlock = keyElements && keyElements.length > 0
      ? `\nKernelementen die genoemd zouden moeten worden: ${keyElements.join("; ")}`
      : "";

    const prompt = `Je beoordeelt het antwoord van een leerling op een Nederlandse begrijpend-lezen vraag.

${levelHint}${contextBlock}
Vraag: ${question}${rubricBlock}${exampleBlock}${keyBlock}

Antwoord van de leerling: "${studentAnswer}"

Beoordeel het antwoord in drie categorieën:
- "correct": het kernidee is begrepen (spelling/grammatica hoeven niet perfect te zijn)
- "partial": deels goed maar mist iets belangrijks of is te vaag
- "incorrect": niet juist, verkeerd begrepen, of geen betekenisvol antwoord

Geef terug als geldige JSON in dit formaat:
{"judgement":"correct"|"partial"|"incorrect","feedback":"<1-2 korte zinnen in eenvoudig Nederlands. Als correct: bemoedig. Als partial of incorrect: leg vriendelijk uit WAAROM en geef een hint zonder het antwoord te verklappen.>"}

Alleen JSON, geen andere tekst.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: "Je bent een vriendelijke Nederlandse leraar die kinderen begeleidt bij begrijpend lezen. Antwoord altijd in geldige JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gateway error:", res.status, errText);
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Te veel aanvragen, probeer het zo weer." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", message: "AI-tegoed op." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "gateway_error", status: res.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: { judgement: string; feedback: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object substring
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    const judgement = ["correct", "partial", "incorrect"].includes(parsed.judgement)
      ? parsed.judgement
      : "incorrect";
    const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";

    return new Response(
      JSON.stringify({ judgement, feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("evaluate-answer error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
