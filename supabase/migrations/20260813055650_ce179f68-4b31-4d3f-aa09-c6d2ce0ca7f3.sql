CREATE TABLE public.community_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  note text,
  invite_url text,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_invitations_status_chk CHECK (status IN ('pending','accepted','cancelled','expired')),
  CONSTRAINT community_invitations_email_chk CHECK (char_length(email) BETWEEN 3 AND 255 AND position('@' in email) > 1)
);

CREATE UNIQUE INDEX community_invitations_unique_pending
  ON public.community_invitations (association_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX community_invitations_assoc_created_idx
  ON public.community_invitations (association_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.community_invitations TO authenticated;
GRANT ALL ON public.community_invitations TO service_role;

ALTER TABLE public.community_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters can view their own invitations"
  ON public.community_invitations FOR SELECT TO authenticated
  USING (auth.uid() = invited_by);

CREATE POLICY "Inviters can create invitations"
  ON public.community_invitations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Inviters can update their own invitations"
  ON public.community_invitations FOR UPDATE TO authenticated
  USING (auth.uid() = invited_by)
  WITH CHECK (auth.uid() = invited_by);

CREATE TRIGGER update_community_invitations_updated_at
  BEFORE UPDATE ON public.community_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();