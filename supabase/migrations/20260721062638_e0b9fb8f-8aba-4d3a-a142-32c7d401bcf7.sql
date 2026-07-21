
ALTER TABLE public.vocabulary_entries ADD COLUMN IF NOT EXISTS verb_forms jsonb;

CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id text NOT NULL,
  challenge_type text NOT NULL,
  challenge_id text NOT NULL,
  challenge_title text,
  groep_level text,
  score integer NOT NULL DEFAULT 0,
  total_questions integer,
  correct_count integer,
  partial_count integer,
  duration_seconds integer,
  completed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_completions TO anon, authenticated;
GRANT ALL ON public.challenge_completions TO service_role;

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions readable by all" ON public.challenge_completions FOR SELECT USING (true);
CREATE POLICY "completions insertable by all" ON public.challenge_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "completions updatable by all" ON public.challenge_completions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "completions deletable by all" ON public.challenge_completions FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_profile ON public.challenge_completions(profile_id, completed_at DESC);
