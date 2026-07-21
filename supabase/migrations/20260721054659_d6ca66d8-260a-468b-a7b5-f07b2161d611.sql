CREATE TABLE public.vocabulary_entries (
  id uuid primary key default gen_random_uuid(),
  dutch_text text not null,
  type text not null check (type in ('word','sentence')),
  translation text not null,
  part_of_speech text,
  lemma text,
  explanation text,
  example text,
  created_at timestamptz not null default now(),
  unique(dutch_text, type)
);

GRANT SELECT, INSERT, UPDATE ON public.vocabulary_entries TO anon, authenticated;
GRANT ALL ON public.vocabulary_entries TO service_role;
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab entries readable by all" ON public.vocabulary_entries FOR SELECT USING (true);
CREATE POLICY "vocab entries insertable by all" ON public.vocabulary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "vocab entries updatable by all" ON public.vocabulary_entries FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.vocabulary_lookups (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  entry_id uuid not null references public.vocabulary_entries(id) on delete cascade,
  story_id text,
  lookup_count int not null default 1,
  first_looked_up_at timestamptz not null default now(),
  last_looked_up_at timestamptz not null default now(),
  unique(profile_id, entry_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocabulary_lookups TO anon, authenticated;
GRANT ALL ON public.vocabulary_lookups TO service_role;
ALTER TABLE public.vocabulary_lookups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lookups readable by all" ON public.vocabulary_lookups FOR SELECT USING (true);
CREATE POLICY "lookups insertable by all" ON public.vocabulary_lookups FOR INSERT WITH CHECK (true);
CREATE POLICY "lookups updatable by all" ON public.vocabulary_lookups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "lookups deletable by all" ON public.vocabulary_lookups FOR DELETE USING (true);

CREATE INDEX vocab_lookups_profile_idx ON public.vocabulary_lookups(profile_id, last_looked_up_at DESC);