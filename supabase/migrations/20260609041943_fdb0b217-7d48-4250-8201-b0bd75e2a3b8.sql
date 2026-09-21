CREATE TABLE public.votes (
  id text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'policy',
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  eligible integer NOT NULL DEFAULT 0,
  voted integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage votes" ON public.votes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();