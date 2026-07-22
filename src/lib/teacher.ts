const TEACHER_MODE_KEY = "teacherMode";

async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

export function isTeacherMode(): boolean {
  try { return localStorage.getItem(TEACHER_MODE_KEY) === "true"; } catch { return false; }
}
export function setTeacherMode(on: boolean) {
  try { localStorage.setItem(TEACHER_MODE_KEY, on ? "true" : "false"); } catch {}
}

export interface CompletionRow {
  id: string;
  profile_id: string;
  challenge_type: string;
  challenge_id: string;
  challenge_title: string | null;
  groep_level: string | null;
  score: number;
  total_questions: number | null;
  correct_count: number | null;
  partial_count: number | null;
  duration_seconds: number | null;
  completed_at: string;
}

export async function recordCompletion(row: Omit<CompletionRow, "id" | "completed_at" | "profile_id"> & { profile_id?: string }) {
  const profile_id = row.profile_id || getStoredProfileId();
  try {
    const supabase = await getSupabase();
    await supabase.functions.invoke("data-api", {
      body: { action: "record_completion", ...row, profile_id },
    });
  } catch {}
}

export interface ProfileStats {
  daily_score: number;
  time_today_seconds: number;
  stars_today: number;
  streak: number;
  vocab_count: number;
  dutch_reading_done: number;
  vocab_practice_done: number;
}

export async function fetchProfileStats(profile_id?: string): Promise<ProfileStats> {
  const pid = profile_id || getStoredProfileId();
  const empty: ProfileStats = {
    daily_score: 0, time_today_seconds: 0, stars_today: 0, streak: 0,
    vocab_count: 0, dutch_reading_done: 0, vocab_practice_done: 0,
  };
  try {
    const supabase = await getSupabase();
    const { data } = await supabase.functions.invoke("data-api", {
      body: { action: "profile_stats", profile_id: pid },
    });
    if (data && !data.error) {
      return {
        daily_score: data.daily_score || 0,
        time_today_seconds: data.time_today_seconds || 0,
        stars_today: data.stars_today || 0,
        streak: data.streak || 0,
        vocab_count: data.vocab_count || 0,
        dutch_reading_done: data.dutch_reading_done || 0,
        vocab_practice_done: data.vocab_practice_done || 0,
      };
    }
  } catch {}
  return empty;
}


export function getStoredProfileId(): string {
  try {
    const raw = sessionStorage.getItem("currentProfile");
    if (!raw) return "guest";
    const p = JSON.parse(raw);
    return p?.name ? `profile:${p.name}` : "guest";
  } catch { return "guest"; }
}

export interface ProfileSummary {
  profile_id: string;
  label: string;
  completions: CompletionRow[];
  vocab_count: number;
  total_score: number;
  total_time: number;
  last_active: string | null;
}

export async function fetchTeacherOverview(): Promise<ProfileSummary[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("data-api", {
    body: { action: "teacher_overview" },
  });
  if (error) return [];
  const comps: any[] = data?.completions || [];
  const lookups: any[] = data?.lookups || [];

  const byProfile = new Map<string, ProfileSummary>();
  const ensure = (pid: string): ProfileSummary => {
    if (!byProfile.has(pid)) {
      byProfile.set(pid, {
        profile_id: pid,
        label: pid.startsWith("profile:") ? pid.slice(8) : "Gast",
        completions: [],
        vocab_count: 0,
        total_score: 0,
        total_time: 0,
        last_active: null,
      });
    }
    return byProfile.get(pid)!;
  };

  comps.forEach((c: any) => {
    const p = ensure(c.profile_id);
    p.completions.push(c);
    p.total_score += c.score || 0;
    p.total_time += c.duration_seconds || 0;
    if (!p.last_active || c.completed_at > p.last_active) p.last_active = c.completed_at;
  });
  lookups.forEach((l: any) => {
    ensure(l.profile_id).vocab_count += 1;
  });

  return Array.from(byProfile.values()).sort((a, b) =>
    (b.last_active || "").localeCompare(a.last_active || ""),
  );
}

export async function fetchVocabForProfileId(profile_id: string) {
  const supabase = await getSupabase();
  const { data } = await supabase.functions.invoke("data-api", {
    body: { action: "fetch_profile_vocab", profile_id },
  });
  return (data?.rows as any[]) || [];
}
