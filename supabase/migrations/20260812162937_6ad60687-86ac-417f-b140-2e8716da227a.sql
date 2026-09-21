CREATE TABLE public.community_opportunity_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  remind_at DATE NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, opportunity_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_opportunity_followups TO authenticated;
GRANT ALL ON public.community_opportunity_followups TO service_role;

ALTER TABLE public.community_opportunity_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own followups select" ON public.community_opportunity_followups
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own followups insert" ON public.community_opportunity_followups
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own followups update" ON public.community_opportunity_followups
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own followups delete" ON public.community_opportunity_followups
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_community_opportunity_followups_user_due
  ON public.community_opportunity_followups (user_id, status, remind_at);

CREATE TRIGGER trg_community_opportunity_followups_updated_at
  BEFORE UPDATE ON public.community_opportunity_followups
  FOR EACH ROW EXECUTE FUNCTION public.bc5a_touch_updated_at();