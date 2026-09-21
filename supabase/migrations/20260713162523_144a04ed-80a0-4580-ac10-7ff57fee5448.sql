
-- ============================================================================
-- BC-3.1F — Global Networking notifications, abuse controls & production hardening
-- Additive only. Does NOT alter the frozen BC-3.1A connection state machine RPCs.
-- ============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.gn_notification_type AS ENUM (
    'connection_request', 'connection_accepted', 'connection_status_update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gn_report_category AS ENUM (
    'spam', 'harassment', 'impersonation', 'inappropriate', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gn_report_status AS ENUM (
    'open', 'reviewing', 'actioned', 'dismissed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Notification preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gn_notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_request boolean NOT NULL DEFAULT true,
  connection_accepted boolean NOT NULL DEFAULT true,
  connection_status_update boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.gn_notification_prefs TO authenticated;
GRANT ALL ON public.gn_notification_prefs TO service_role;
ALTER TABLE public.gn_notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gn_prefs_own_select" ON public.gn_notification_prefs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "gn_prefs_own_upsert" ON public.gn_notification_prefs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "gn_prefs_own_update" ON public.gn_notification_prefs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_gn_prefs_updated BEFORE UPDATE ON public.gn_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Notifications center (per recipient) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gn_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.gn_notification_type NOT NULL,
  connection_id uuid REFERENCES public.user_connections(id) ON DELETE CASCADE,
  origin_event_id uuid REFERENCES public.user_connection_events(id) ON DELETE CASCADE,
  -- privacy-safe snapshot of the actor's PUBLIC business card only
  actor_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- one notification per underlying lifecycle event (idempotent emission)
CREATE UNIQUE INDEX IF NOT EXISTS gn_notifications_origin_uq
  ON public.gn_notifications(origin_event_id) WHERE origin_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS gn_notifications_recipient_idx
  ON public.gn_notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gn_notifications_unread_idx
  ON public.gn_notifications(recipient_user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.gn_notifications TO authenticated;
GRANT ALL ON public.gn_notifications TO service_role;
ALTER TABLE public.gn_notifications ENABLE ROW LEVEL SECURITY;
-- Recipients read only their own; system (SECURITY DEFINER trigger) inserts.
CREATE POLICY "gn_notif_own_select" ON public.gn_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
-- Recipients may only flip read_at on their own rows.
CREATE POLICY "gn_notif_own_update" ON public.gn_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
-- No INSERT/DELETE policy => clients cannot forge or delete notifications.

-- ── Abuse reports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gn_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.user_connections(id) ON DELETE SET NULL,
  category public.gn_report_category NOT NULL,
  details text,
  status public.gn_report_status NOT NULL DEFAULT 'open',
  resolution_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gn_reports_not_self CHECK (reporter_user_id <> reported_user_id)
);
CREATE INDEX IF NOT EXISTS gn_reports_reporter_idx ON public.gn_reports(reporter_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gn_reports_reported_idx ON public.gn_reports(reported_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gn_reports_status_idx ON public.gn_reports(status, created_at DESC);

GRANT SELECT ON public.gn_reports TO authenticated;
GRANT ALL ON public.gn_reports TO service_role;
ALTER TABLE public.gn_reports ENABLE ROW LEVEL SECURITY;
-- Reporter sees own; platform admins see all. Reported user sees nothing.
CREATE POLICY "gn_reports_reporter_select" ON public.gn_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR public.is_platform_admin());
-- Only platform admins may triage (status/resolution). Reports are created via RPC.
CREATE POLICY "gn_reports_admin_update" ON public.gn_reports
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
-- No INSERT policy => created only through the controlled SECURITY DEFINER RPC.
CREATE TRIGGER trg_gn_reports_updated BEFORE UPDATE ON public.gn_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Privacy-safe actor snapshot helper ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gn_actor_public_summary(_uid uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
        'userId', c.owner_user_id,
        'displayName', c.display_name,
        'avatarUrl', c.avatar_url,
        'headline', COALESCE(c.headline, c.professional_title),
        'companyName', c.company_name,
        'primaryCardSlug', c.slug
      )
      FROM public.member_business_cards c
      WHERE c.owner_user_id = _uid
        AND c.status = 'published'
        AND c.public_mode = 'public'
      ORDER BY (c.card_kind = 'primary') DESC, c.updated_at DESC
      LIMIT 1),
    jsonb_build_object('userId', _uid)
  );
$$;

-- ── Notification emission trigger (idempotent, honors prefs) ──────────────────
CREATE OR REPLACE FUNCTION public.gn_emit_notification_from_event()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _recipient uuid;
  _actor uuid;
  _type public.gn_notification_type;
  _pref_ok boolean;
BEGIN
  IF NEW.transition = 'connection_requested' THEN
    _recipient := NEW.counterpart_user_id;  -- the person receiving the request
    _actor := NEW.actor_user_id;
    _type := 'connection_request';
  ELSIF NEW.transition = 'connection_accepted' THEN
    _recipient := NEW.counterpart_user_id;  -- the original requester
    _actor := NEW.actor_user_id;
    _type := 'connection_accepted';
  ELSE
    RETURN NEW; -- decline/cancel/disconnect/block do not notify the counterpart
  END IF;

  IF _recipient IS NULL OR _recipient = _actor THEN RETURN NEW; END IF;

  -- Preference gate (default = allowed when no row exists).
  SELECT CASE _type
    WHEN 'connection_request' THEN COALESCE(p.connection_request, true)
    WHEN 'connection_accepted' THEN COALESCE(p.connection_accepted, true)
    ELSE COALESCE(p.connection_status_update, true)
  END INTO _pref_ok
  FROM (SELECT 1) s
  LEFT JOIN public.gn_notification_prefs p ON p.user_id = _recipient;

  IF NOT COALESCE(_pref_ok, true) THEN RETURN NEW; END IF;

  INSERT INTO public.gn_notifications
    (recipient_user_id, actor_user_id, type, connection_id, origin_event_id, actor_summary)
  VALUES
    (_recipient, _actor, _type, NEW.connection_id, NEW.id,
     public.gn_actor_public_summary(_actor))
  ON CONFLICT (origin_event_id) WHERE origin_event_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_gn_emit_notification ON public.user_connection_events;
CREATE TRIGGER trg_gn_emit_notification
  AFTER INSERT ON public.user_connection_events
  FOR EACH ROW EXECUTE FUNCTION public.gn_emit_notification_from_event();

-- ── Mark notifications read ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gn_mark_notifications_read(_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _uid uuid := public.gn_require_user(); _n integer;
BEGIN
  UPDATE public.gn_notifications
    SET read_at = now()
    WHERE recipient_user_id = _uid
      AND read_at IS NULL
      AND (_ids IS NULL OR id = ANY(_ids));
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

-- ── Rate-limited / cooldown-guarded send request ─────────────────────────────
-- Wraps the frozen state-machine RPC without changing its semantics.
CREATE OR REPLACE FUNCTION public.global_connection_send_request_guarded(
  _target_user_id uuid,
  _source_type text DEFAULT 'manual',
  _source_id uuid DEFAULT NULL,
  _mutation_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := public.gn_require_user();
  _cached jsonb;
  _hourly integer;
  _daily integer;
  _last public.user_connections%ROWTYPE;
  _hour_cap constant integer := 20;
  _day_cap constant integer := 100;
BEGIN
  -- Idempotent replay: never counts against limits.
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.global_connection_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  -- Pair cooldown after a prior decline (7d) or cancel (24h).
  SELECT * INTO _last FROM public.user_connections
    WHERE pair_user_low = least(_uid, _target_user_id)
      AND pair_user_high = greatest(_uid, _target_user_id)
      AND status IN ('declined', 'cancelled')
    ORDER BY updated_at DESC LIMIT 1;
  IF FOUND THEN
    IF _last.status = 'declined'
       AND now() < COALESCE(_last.responded_at, _last.updated_at) + interval '7 days' THEN
      RAISE EXCEPTION 'NETWORK_PAIR_COOLDOWN';
    END IF;
    IF _last.status = 'cancelled'
       AND now() < _last.updated_at + interval '24 hours' THEN
      RAISE EXCEPTION 'NETWORK_PAIR_COOLDOWN';
    END IF;
  END IF;

  -- Hourly / daily caps on outgoing requests (counted from authoritative events).
  SELECT count(*) INTO _hourly FROM public.user_connection_events
    WHERE actor_user_id = _uid AND transition = 'connection_requested'
      AND created_at > now() - interval '1 hour';
  IF _hourly >= _hour_cap THEN RAISE EXCEPTION 'NETWORK_RATE_LIMITED'; END IF;

  SELECT count(*) INTO _daily FROM public.user_connection_events
    WHERE actor_user_id = _uid AND transition = 'connection_requested'
      AND created_at > now() - interval '24 hours';
  IF _daily >= _day_cap THEN RAISE EXCEPTION 'NETWORK_RATE_LIMITED'; END IF;

  RETURN public.global_connection_send_request(_target_user_id, _source_type, _source_id, _mutation_key);
END $$;

-- ── Report a user (rate-limited) ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gn_report_user(
  _reported_user_id uuid,
  _category text,
  _details text DEFAULT NULL,
  _connection_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := public.gn_require_user();
  _recent integer;
  _cat public.gn_report_category;
  _id uuid;
BEGIN
  IF _reported_user_id = _uid THEN RAISE EXCEPTION 'NETWORK_SELF_CONNECTION'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _reported_user_id) THEN
    RAISE EXCEPTION 'NETWORK_TARGET_NOT_FOUND';
  END IF;

  BEGIN
    _cat := _category::public.gn_report_category;
  EXCEPTION WHEN invalid_text_representation THEN
    _cat := 'other';
  END;

  -- Max 5 reports per reporter per hour.
  SELECT count(*) INTO _recent FROM public.gn_reports
    WHERE reporter_user_id = _uid AND created_at > now() - interval '1 hour';
  IF _recent >= 5 THEN RAISE EXCEPTION 'NETWORK_REPORT_RATE_LIMITED'; END IF;

  INSERT INTO public.gn_reports
    (reporter_user_id, reported_user_id, connection_id, category, details)
  VALUES (_uid, _reported_user_id, _connection_id, _cat, left(COALESCE(_details, ''), 2000))
  RETURNING id INTO _id;

  RETURN _id;
END $$;

-- ── Admin triage ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gn_report_set_status(
  _report_id uuid, _status text, _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _st public.gn_report_status;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'NETWORK_NOT_PARTICIPANT'; END IF;
  _st := _status::public.gn_report_status;
  UPDATE public.gn_reports
    SET status = _st,
        resolution_note = COALESCE(_note, resolution_note),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = _report_id;
END $$;

GRANT EXECUTE ON FUNCTION public.gn_mark_notifications_read(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_send_request_guarded(uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gn_report_user(uuid, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gn_report_set_status(uuid, text, text) TO authenticated;
