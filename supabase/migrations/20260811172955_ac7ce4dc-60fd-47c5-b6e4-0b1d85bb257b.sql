CREATE TABLE public.user_device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key text NOT NULL,
  device_label text,
  platform text,
  browser text,
  is_standalone boolean NOT NULL DEFAULT false,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_device_sessions TO authenticated;
GRANT ALL ON public.user_device_sessions TO service_role;

ALTER TABLE public.user_device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own device sessions"
ON public.user_device_sessions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_device_sessions_user ON public.user_device_sessions (user_id, last_seen_at DESC);

CREATE TRIGGER update_user_device_sessions_updated_at
BEFORE UPDATE ON public.user_device_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();