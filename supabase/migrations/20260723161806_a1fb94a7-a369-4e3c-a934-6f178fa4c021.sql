CREATE TABLE public.member_checkin_rejections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id uuid NOT NULL,
  association_id uuid NULL REFERENCES public.associations(id),
  attempted_event_id text NULL,
  reason_code text NOT NULL,
  payload_hash text NOT NULL,
  method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_checkin_rejections_actor ON public.member_checkin_rejections (actor_user_id, created_at DESC);
CREATE INDEX idx_member_checkin_rejections_assoc ON public.member_checkin_rejections (association_id, created_at DESC);

GRANT SELECT ON public.member_checkin_rejections TO authenticated;
GRANT ALL ON public.member_checkin_rejections TO service_role;

ALTER TABLE public.member_checkin_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_checkin_rejections_self_select
  ON public.member_checkin_rejections
  FOR SELECT
  TO authenticated
  USING (actor_user_id = auth.uid());

CREATE POLICY member_checkin_rejections_admin_select
  ON public.member_checkin_rejections
  FOR SELECT
  TO authenticated
  USING (
    association_id IS NOT NULL
    AND (has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin())
  );