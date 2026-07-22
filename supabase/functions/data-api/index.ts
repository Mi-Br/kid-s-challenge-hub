// Server-side proxy for challenge_completions and vocabulary_lookups.
// The underlying tables have no client-role RLS policies, so all reads/writes
// must go through this function (which uses the service role and validates input).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const MAX_STR = 500;
function s(v: unknown, max = MAX_STR): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}
function optS(v: unknown, max = MAX_STR): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return null;
  if (t.length > max) return null;
  return t;
}
function optN(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return v;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = s((body as any).action, 64);
    if (!action) return json({ error: "Missing action" }, 400);

    switch (action) {
      case "record_completion": {
        const profile_id = s(body.profile_id, 200);
        const challenge_type = s(body.challenge_type, 100);
        const challenge_id = s(body.challenge_id, 200);
        if (!profile_id || !challenge_type || !challenge_id) {
          return json({ error: "Missing required fields" }, 400);
        }
        const row = {
          profile_id,
          challenge_type,
          challenge_id,
          challenge_title: optS(body.challenge_title) ?? null,
          groep_level: optS(body.groep_level, 50) ?? null,
          score: typeof body.score === "number" && Number.isFinite(body.score) ? body.score : 0,
          total_questions: optN(body.total_questions) ?? null,
          correct_count: optN(body.correct_count) ?? null,
          partial_count: optN(body.partial_count) ?? null,
          duration_seconds: optN(body.duration_seconds) ?? null,
        };
        const { error } = await supabase.from("challenge_completions").insert(row);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "profile_stats": {
        const profile_id = s(body.profile_id, 200);
        if (!profile_id) return json({ error: "Missing profile_id" }, 400);
        const { data: rows, error } = await supabase
          .from("challenge_completions")
          .select("score,duration_seconds,correct_count,completed_at")
          .eq("profile_id", profile_id)
          .order("completed_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        const todayKey = new Date().toISOString().slice(0, 10);
        let dailyScore = 0, timeToday = 0, starsToday = 0;
        const daysSet = new Set<string>();
        (rows || []).forEach((r: any) => {
          const day = (r.completed_at || "").slice(0, 10);
          daysSet.add(day);
          if (day === todayKey) {
            dailyScore += r.score || 0;
            timeToday += r.duration_seconds || 0;
            starsToday += r.correct_count || 0;
          }
        });
        // Compute streak of consecutive days ending today (or yesterday if none today)
        let streak = 0;
        const d = new Date();
        // if no activity today, start counting from yesterday
        if (!daysSet.has(todayKey)) d.setDate(d.getDate() - 1);
        while (daysSet.has(d.toISOString().slice(0, 10))) {
          streak += 1;
          d.setDate(d.getDate() - 1);
        }
        return json({
          daily_score: dailyScore,
          time_today_seconds: timeToday,
          stars_today: starsToday,
          streak,
        });
      }

      case "teacher_overview": {
        const [{ data: comps, error: e1 }, { data: lookups, error: e2 }] = await Promise.all([
          supabase.from("challenge_completions").select("*").order("completed_at", { ascending: false }),
          supabase.from("vocabulary_lookups").select("profile_id"),
        ]);
        if (e1 || e2) return json({ error: (e1 || e2)?.message }, 500);
        return json({ completions: comps || [], lookups: lookups || [] });
      }

      case "fetch_profile_vocab": {
        const profile_id = s(body.profile_id, 200);
        if (!profile_id) return json({ error: "Missing profile_id" }, 400);
        const { data, error } = await supabase
          .from("vocabulary_lookups")
          .select("*, entry:vocabulary_entries(*)")
          .eq("profile_id", profile_id)
          .order("last_looked_up_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        return json({ rows: data || [] });
      }

      case "delete_lookup": {
        const profile_id = s(body.profile_id, 200);
        const lookup_id = s(body.lookup_id, 100);
        if (!profile_id || !lookup_id) return json({ error: "Missing fields" }, 400);
        const { error } = await supabase
          .from("vocabulary_lookups")
          .delete()
          .eq("id", lookup_id)
          .eq("profile_id", profile_id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "delete_all_lookups": {
        const profile_id = s(body.profile_id, 200);
        if (!profile_id) return json({ error: "Missing profile_id" }, 400);
        const { error } = await supabase
          .from("vocabulary_lookups")
          .delete()
          .eq("profile_id", profile_id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "track_lookup": {
        const profile_id = s(body.profile_id, 200);
        const entry_id = s(body.entry_id, 100);
        if (!profile_id || !entry_id) return json({ error: "Missing fields" }, 400);
        const story_id = optS(body.story_id);
        const { data: existing } = await supabase
          .from("vocabulary_lookups")
          .select("id, lookup_count")
          .eq("profile_id", profile_id)
          .eq("entry_id", entry_id)
          .maybeSingle();
        if (existing) {
          const patch: Record<string, unknown> = {
            lookup_count: existing.lookup_count + 1,
            last_looked_up_at: new Date().toISOString(),
          };
          if (story_id !== undefined) patch.story_id = story_id;
          const { error } = await supabase
            .from("vocabulary_lookups")
            .update(patch)
            .eq("id", existing.id);
          if (error) return json({ error: error.message }, 500);
        } else {
          const { error } = await supabase.from("vocabulary_lookups").insert({
            profile_id,
            entry_id,
            story_id: story_id ?? null,
          });
          if (error) return json({ error: error.message }, 500);
        }
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
