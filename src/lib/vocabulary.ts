import { supabase } from "@/integrations/supabase/client";

export interface VocabEntry {
  id: string;
  dutch_text: string;
  type: "word" | "sentence";
  translation: string;
  part_of_speech: string | null;
  lemma: string | null;
  explanation: string | null;
  example: string | null;
  created_at: string;
}

export interface VocabLookup {
  id: string;
  profile_id: string;
  entry_id: string;
  story_id: string | null;
  lookup_count: number;
  first_looked_up_at: string;
  last_looked_up_at: string;
  entry?: VocabEntry;
}

export function getCurrentProfileId(): string {
  try {
    const raw = sessionStorage.getItem("currentProfile");
    if (!raw) return "guest";
    const p = JSON.parse(raw);
    return p?.name ? `profile:${p.name}` : "guest";
  } catch {
    return "guest";
  }
}

export async function translateAndSave(params: {
  text: string;
  type: "word" | "sentence";
  context?: string;
  storyId?: string;
}): Promise<VocabEntry> {
  const profile_id = getCurrentProfileId();
  const { data, error } = await supabase.functions.invoke("translate-word", {
    body: {
      text: params.text,
      type: params.type,
      context: params.context,
      profile_id,
      story_id: params.storyId,
    },
  });
  if (error) throw error;
  if (!data?.entry) throw new Error("No translation returned");
  return data.entry as VocabEntry;
}

export async function fetchVocabForProfile(): Promise<VocabLookup[]> {
  const profile_id = getCurrentProfileId();
  const { data, error } = await supabase
    .from("vocabulary_lookups")
    .select("*, entry:vocabulary_entries(*)")
    .eq("profile_id", profile_id)
    .order("last_looked_up_at", { ascending: false });
  if (error) throw error;
  return (data as VocabLookup[]) || [];
}
