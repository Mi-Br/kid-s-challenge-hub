export interface VerbForms {
  infinitive?: string;
  present?: Record<string, string>;
  past?: Record<string, string>;
  perfect?: string;
}

export interface VocabEntry {
  id: string;
  dutch_text: string;
  type: "word" | "sentence";
  translation: string;
  part_of_speech: string | null;
  lemma: string | null;
  explanation: string | null;
  example: string | null;
  verb_forms: VerbForms | null;
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

async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

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

export function evictLocal(text: string, type: "word" | "sentence") {
  const key = cacheKey(text, type);
  memCache.delete(key);
  try { localStorage.removeItem(key); } catch {}
}

export async function deleteLookup(lookupId: string, entry?: VocabEntry | null): Promise<void> {
  const profile_id = getCurrentProfileId();
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("data-api", {
    body: { action: "delete_lookup", lookup_id: lookupId, profile_id },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (entry) evictLocal(entry.dutch_text, entry.type);
}

export async function deleteAllLookupsForProfile(): Promise<void> {
  const profile_id = getCurrentProfileId();
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("data-api", {
    body: { action: "delete_all_lookups", profile_id },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  // Clear local caches — collective dictionary in vocabulary_entries is preserved.
  memCache.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("vocab:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Track lookup without waiting (fire-and-forget) — via edge function (service role)
async function trackLookup(entryId: string, storyId?: string) {
  const profile_id = getCurrentProfileId();
  try {
    const supabase = await getSupabase();
    await supabase.functions.invoke("data-api", {
      body: { action: "track_lookup", profile_id, entry_id: entryId, story_id: storyId ?? null },
    });
  } catch {}
}

export async function translateAndSave(params: {
  text: string;
  type: "word" | "sentence";
  context?: string;
  storyId?: string;
  source?: "nl" | "en";
}): Promise<VocabEntry> {
  const source = params.source === "en" ? "en" : "nl";
  const key = `${source}:${cacheKey(params.text, params.type)}`;

  // Local/shared cache only for Dutch input (keyed by dutch_text)
  if (source === "nl") {
    const local = readLocal(params.text, params.type);
    if (local) {
      trackLookup(local.id, params.storyId);
      return local;
    }
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const supabase = await getSupabase();

    if (source === "nl") {
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
    }

    const profile_id = getCurrentProfileId();
    const { data, error } = await supabase.functions.invoke("translate-word", {
      body: {
        text: params.text,
        type: params.type,
        context: params.type === "word" ? params.context : undefined,
        profile_id,
        story_id: params.storyId,
        source,
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
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("data-api", {
    body: { action: "fetch_profile_vocab", profile_id },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  const rows = ((data?.rows as VocabLookup[]) || []);
  // Warm the local cache from the profile's own history
  for (const r of rows) if (r.entry) writeLocal(r.entry);
  return rows;
}
