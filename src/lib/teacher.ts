import { supabase } from "@/integrations/supabase/client";

const TEACHER_MODE_KEY = "teacherMode";

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

export async function recordCompletion(row: Omit<CompletionRow, "id" | "completed_at"> & { profile_id?: string }) {
  const profile_id = row.profile_id || getStoredProfileId();
  try {
    await supabase.from("challenge_completions").insert({ ...row, profile_id });
  } catch {}
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
  const [{ data: comps }, { data: lookups }] = await Promise.all([
    supabase.from("challenge_completions").select("*").order("completed_at", { ascending: false }),
    supabase.from("vocabulary_lookups").select("profile_id"),
  ]);

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

  (comps || []).forEach((c: any) => {
    const p = ensure(c.profile_id);
    p.completions.push(c);
    p.total_score += c.score || 0;
    p.total_time += c.duration_seconds || 0;
    if (!p.last_active || c.completed_at > p.last_active) p.last_active = c.completed_at;
  });
  (lookups || []).forEach((l: any) => {
    ensure(l.profile_id).vocab_count += 1;
  });

  return Array.from(byProfile.values()).sort((a, b) =>
    (b.last_active || "").localeCompare(a.last_active || ""),
  );
}

export async function fetchVocabForProfileId(profile_id: string) {
  const { data } = await supabase
    .from("vocabulary_lookups")
    .select("*, entry:vocabulary_entries(*)")
    .eq("profile_id", profile_id)
    .order("last_looked_up_at", { ascending: false });
  return data || [];
}
