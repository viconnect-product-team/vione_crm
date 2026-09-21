ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS org_name text,
  ADD COLUMN IF NOT EXISTS org_email text,
  ADD COLUMN IF NOT EXISTS lang text,
  ADD COLUMN IF NOT EXISTS email_notif boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notif boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa boolean NOT NULL DEFAULT true;