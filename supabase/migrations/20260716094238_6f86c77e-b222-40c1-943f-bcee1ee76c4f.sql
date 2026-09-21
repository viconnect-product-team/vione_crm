
-- ────────────────────────────────────────────────────────────────────────────
-- BC-8.1 Turn A — Notification preferences foundation
-- ────────────────────────────────────────────────────────────────────────────

-- 1. business_notification_preferences ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  global_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  digest_mode TEXT NOT NULL DEFAULT 'immediate'
    CHECK (digest_mode IN ('immediate','hourly','daily','weekly','off')),
  digest_time TEXT NOT NULL DEFAULT '09:00'
    CHECK (digest_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  quiet_hours_start TEXT
    CHECK (quiet_hours_start IS NULL OR quiet_hours_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  quiet_hours_end TEXT
    CHECK (quiet_hours_end IS NULL OR quiet_hours_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  critical_bypass_quiet_hours BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_notification_preferences TO authenticated;
GRANT ALL ON public.business_notification_preferences TO service_role;

ALTER TABLE public.business_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_self_select"
  ON public.business_notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "prefs_self_insert"
  ON public.business_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_self_update"
  ON public.business_notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_self_delete"
  ON public.business_notification_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. business_notification_preference_overrides ────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_preference_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_kind TEXT NOT NULL,
  in_app_enabled BOOLEAN,
  email_enabled BOOLEAN,
  push_enabled BOOLEAN,
  reminder_enabled BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_kind)
);

CREATE INDEX IF NOT EXISTS idx_bn_pref_overrides_user
  ON public.business_notification_preference_overrides(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_notification_preference_overrides TO authenticated;
GRANT ALL ON public.business_notification_preference_overrides TO service_role;

ALTER TABLE public.business_notification_preference_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_override_self_select"
  ON public.business_notification_preference_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "prefs_override_self_insert"
  ON public.business_notification_preference_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_override_self_update"
  ON public.business_notification_preference_overrides FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_override_self_delete"
  ON public.business_notification_preference_overrides FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bn_prefs_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bn_prefs_touch ON public.business_notification_preferences;
CREATE TRIGGER trg_bn_prefs_touch
  BEFORE UPDATE ON public.business_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.bn_prefs_touch_updated_at();

DROP TRIGGER IF EXISTS trg_bn_prefs_override_touch ON public.business_notification_preference_overrides;
CREATE TRIGGER trg_bn_prefs_override_touch
  BEFORE UPDATE ON public.business_notification_preference_overrides
  FOR EACH ROW EXECUTE FUNCTION public.bn_prefs_touch_updated_at();

-- 4. Version bump on preference change ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bn_prefs_bump_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version = COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bn_prefs_version ON public.business_notification_preferences;
CREATE TRIGGER trg_bn_prefs_version
  BEFORE UPDATE ON public.business_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.bn_prefs_bump_version();
