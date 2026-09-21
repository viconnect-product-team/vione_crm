ALTER TABLE public.community_invitations
  ADD COLUMN IF NOT EXISTS invited_role TEXT NOT NULL DEFAULT 'member'
  CHECK (invited_role IN ('admin','member'));