
-- Drop all existing permissive public policies
DROP POLICY IF EXISTS "completions deletable by all" ON public.challenge_completions;
DROP POLICY IF EXISTS "completions insertable by all" ON public.challenge_completions;
DROP POLICY IF EXISTS "completions readable by all" ON public.challenge_completions;
DROP POLICY IF EXISTS "completions updatable by all" ON public.challenge_completions;

DROP POLICY IF EXISTS "vocab entries insertable by all" ON public.vocabulary_entries;
DROP POLICY IF EXISTS "vocab entries readable by all" ON public.vocabulary_entries;
DROP POLICY IF EXISTS "vocab entries updatable by all" ON public.vocabulary_entries;

DROP POLICY IF EXISTS "lookups deletable by all" ON public.vocabulary_lookups;
DROP POLICY IF EXISTS "lookups insertable by all" ON public.vocabulary_lookups;
DROP POLICY IF EXISTS "lookups readable by all" ON public.vocabulary_lookups;
DROP POLICY IF EXISTS "lookups updatable by all" ON public.vocabulary_lookups;

-- Revoke default grants from client roles for all three tables
REVOKE ALL ON public.challenge_completions FROM anon, authenticated;
REVOKE ALL ON public.vocabulary_entries FROM anon, authenticated;
REVOKE ALL ON public.vocabulary_lookups FROM anon, authenticated;

-- Ensure service_role retains full access (used by edge functions)
GRANT ALL ON public.challenge_completions TO service_role;
GRANT ALL ON public.vocabulary_entries TO service_role;
GRANT ALL ON public.vocabulary_lookups TO service_role;

-- Shared dictionary: allow public read only (still used as a client-side cache lookup)
GRANT SELECT ON public.vocabulary_entries TO anon, authenticated;
CREATE POLICY "Shared dictionary is publicly readable"
  ON public.vocabulary_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- challenge_completions and vocabulary_lookups: no client-role policies.
-- RLS remains enabled; access is only possible through edge functions using the service role.
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_lookups ENABLE ROW LEVEL SECURITY;
