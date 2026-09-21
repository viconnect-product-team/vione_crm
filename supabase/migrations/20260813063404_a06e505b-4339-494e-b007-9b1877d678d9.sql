ALTER TABLE public.community_invitations
  ADD COLUMN IF NOT EXISTS token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS community_invitations_token_key
  ON public.community_invitations (token);