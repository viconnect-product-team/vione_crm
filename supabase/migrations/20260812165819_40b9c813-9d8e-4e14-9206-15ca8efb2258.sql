CREATE TABLE public.community_opportunity_followup_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('note','progress','scheduled','done','cancelled')),
  progress TEXT CHECK (progress IN ('planned','messaged','replied','closed')),
  status TEXT CHECK (status IN ('pending','done','cancelled')),
  remind_at DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.community_opportunity_followup_events TO authenticated;
GRANT ALL ON public.community_opportunity_followup_events TO service_role;

ALTER TABLE public.community_opportunity_followup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own followup events select" ON public.community_opportunity_followup_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own followup events insert" ON public.community_opportunity_followup_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_community_opportunity_followup_events_lookup
  ON public.community_opportunity_followup_events (user_id, opportunity_id, created_at DESC);