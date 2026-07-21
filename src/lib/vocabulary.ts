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

function normalize(text: string, type: "word" | "sentence"): string {
  return type === "word"
    ? text.trim().toLowerCase().replace(/[.,!?;:"'()]/g, "")
    : text.trim();
}

function cacheKey(text: string, type: "word" | "sentence") {
  return `vocab:${type}:${normalize(text, type)}`;
}

// In-memory cache (fastest) + localStorage (persists across reloads)
const memCache = new Map<string, VocabEntry>();
const inflight = new Map<string, Promise<VocabEntry>>();

function readLocal(text: string, type: "word" | "sentence"): VocabEntry | null {
  const key = cacheKey(text, type);
  if (memCache.has(key)) return memCache.get(key)!;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as VocabEntry;
    memCache.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

function writeLocal(entry: VocabEntry) {
  const key = cacheKey(entry.dutch_text, entry.type);
  memCache.set(key, entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function getCachedEntry(text: string, type: "word" | "sentence"): VocabEntry | null {
  return readLocal(text, type);
}

// Track lookup without waiting (fire-and-forget) — direct DB write via edge function
async function trackLookup(entryId: string, storyId?: string) {
  const profile_id = getCurrentProfileId();
  try {
    const { data: existing } = await supabase
      .from("vocabulary_lookups")
      .select("id, lookup_count")
      .eq("profile_id", profile_id)
      .eq("entry_id", entryId)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("vocabulary_lookups")
        .update({
          lookup_count: existing.lookup_count + 1,
          last_looked_up_at: new Date().toISOString(),
          story_id: storyId ?? undefined,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("vocabulary_lookups").insert({
        profile_id,
        entry_id: entryId,
        story_id: storyId ?? null,
      });
    }
  } catch {}
}

export async function translateAndSave(params: {
  text: string;
  type: "word" | "sentence";
  context?: string;
  storyId?: string;
}): Promise<VocabEntry> {
  const key = cacheKey(params.text, params.type);

  // 1. Local cache hit — instant, still track lookup in background
  const local = readLocal(params.text, params.type);
  if (local) {
    trackLookup(local.id, params.storyId);
    return local;
  }

  // 2. Deduplicate concurrent requests for the same text
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    // 3. Shared DB dictionary check (skip AI entirely if another user already looked it up)
    const normalized = normalize(params.text, params.type);
    const { data: shared } = await supabase
      .from("vocabulary_entries")
      .select("*")
      .eq("dutch_text", normalized)
      .eq("type", params.type)
      .maybeSingle();

    if (shared) {
      const entry = shared as VocabEntry;
      writeLocal(entry);
      trackLookup(entry.id, params.storyId);
      return entry;
    }

    // 4. Fall back to edge function (calls AI + saves)
    const profile_id = getCurrentProfileId();
    const { data, error } = await supabase.functions.invoke("translate-word", {
      body: {
        text: params.text,
        type: params.type,
        context: params.type === "word" ? params.context : undefined,
        profile_id,
        story_id: params.storyId,
      },
    });
    if (error) throw error;
    if (!data?.entry) throw new Error("No translation returned");
    const entry = data.entry as VocabEntry;
    writeLocal(entry);
    return entry;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

export async function fetchVocabForProfile(): Promise<VocabLookup[]> {
  const profile_id = getCurrentProfileId();
  const { data, error } = await supabase
    .from("vocabulary_lookups")
    .select("*, entry:vocabulary_entries(*)")
    .eq("profile_id", profile_id)
    .order("last_looked_up_at", { ascending: false });
  if (error) throw error;
  const rows = (data as VocabLookup[]) || [];
  // Warm the local cache from the profile's own history
  for (const r of rows) if (r.entry) writeLocal(r.entry);
  return rows;
}
