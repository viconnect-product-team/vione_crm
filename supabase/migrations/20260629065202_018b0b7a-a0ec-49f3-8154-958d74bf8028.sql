ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS ssl_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS ssl_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_active_at timestamptz;

ALTER TABLE public.associations
  DROP CONSTRAINT IF EXISTS associations_ssl_status_check;
ALTER TABLE public.associations
  ADD CONSTRAINT associations_ssl_status_check
  CHECK (ssl_status IN ('none','provisioning','active','failed'));