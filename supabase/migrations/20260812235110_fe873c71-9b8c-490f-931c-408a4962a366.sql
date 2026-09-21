CREATE TABLE public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  message text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, association_id)
);

GRANT SELECT, INSERT, UPDATE ON public.community_join_requests TO authenticated;
GRANT ALL ON public.community_join_requests TO service_role;

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cjr_select_own" ON public.community_join_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "cjr_insert_own" ON public.community_join_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cjr_update_own_cancel" ON public.community_join_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER community_join_requests_updated_at
  BEFORE UPDATE ON public.community_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cjr_assoc_status ON public.community_join_requests (association_id, status);