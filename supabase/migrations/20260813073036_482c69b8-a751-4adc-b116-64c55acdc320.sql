CREATE TABLE public.community_member_role_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  invitation_id uuid REFERENCES public.community_invitations(id) ON DELETE SET NULL,
  target_user_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  old_role text NOT NULL,
  new_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cmre_invitation ON public.community_member_role_events(invitation_id, created_at DESC);
CREATE INDEX idx_cmre_association ON public.community_member_role_events(association_id, created_at DESC);

GRANT SELECT ON public.community_member_role_events TO authenticated;
GRANT ALL ON public.community_member_role_events TO service_role;

ALTER TABLE public.community_member_role_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can read role history"
ON public.community_member_role_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.association_id = community_member_role_events.association_id
    AND m.user_id = auth.uid()
));