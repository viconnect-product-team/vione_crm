
-- BC-8.1 Turn B — Notification runtime persistence
-- Canonical inbox + schedules + dispatches + escalations + receipts.

-- ─────────────────────────────────────────────────────────────
-- 1. business_notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  source_domain text NOT NULL,
  source_record_id text NOT NULL,
  source_event_id uuid,
  event_kind text NOT NULL,
  notification_kind text NOT NULL,
  title_key text NOT NULL,
  body_key text NOT NULL,
  action_label_key text,
  safe_display_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_kind text,
  action_target jsonb,
  priority text NOT NULL CHECK (priority IN ('critical','high','normal','informational')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','scheduled','delivered','read','archived','expired','cancelled')),
  scheduled_for timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  archived_at timestamptz,
  expired_at timestamptz,
  dedupe_key text NOT NULL,
  schema_version text NOT NULL DEFAULT '1',
  policy_version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_notifications_dedupe_key_unique UNIQUE (dedupe_key)
);
CREATE INDEX IF NOT EXISTS bnotif_recipient_created_idx
  ON public.business_notifications (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bnotif_recipient_unread_idx
  ON public.business_notifications (recipient_user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL AND expired_at IS NULL;
CREATE INDEX IF NOT EXISTS bnotif_source_idx
  ON public.business_notifications (source_domain, source_record_id);
CREATE INDEX IF NOT EXISTS bnotif_kind_idx
  ON public.business_notifications (notification_kind);

REVOKE ALL ON public.business_notifications FROM PUBLIC;
REVOKE ALL ON public.business_notifications FROM anon;
GRANT SELECT ON public.business_notifications TO authenticated;
GRANT ALL ON public.business_notifications TO service_role;
ALTER TABLE public.business_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_notifications FORCE ROW LEVEL SECURITY;

CREATE POLICY "bnotif_recipient_read"
  ON public.business_notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

-- All mutation goes through SECURITY DEFINER RPCs — no direct UPDATE grant.

-- ─────────────────────────────────────────────────────────────
-- 2. business_notification_schedules
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_kind text NOT NULL,
  source_domain text NOT NULL,
  source_record_id text NOT NULL,
  recipient_user_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','claimed','delivered','cancelled','expired','failed')),
  claim_token text,
  claimed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  dedupe_key text NOT NULL,
  policy_version text NOT NULL DEFAULT '1.0.0',
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bnotif_schedule_dedupe_unique UNIQUE (dedupe_key)
);
CREATE INDEX IF NOT EXISTS bnotif_schedule_claim_idx
  ON public.business_notification_schedules (scheduled_for)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS bnotif_schedule_retry_idx
  ON public.business_notification_schedules (next_retry_at)
  WHERE status IN ('claimed','failed') AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS bnotif_schedule_source_idx
  ON public.business_notification_schedules (source_domain, source_record_id);

REVOKE ALL ON public.business_notification_schedules FROM PUBLIC;
REVOKE ALL ON public.business_notification_schedules FROM anon;
REVOKE ALL ON public.business_notification_schedules FROM authenticated;
GRANT ALL ON public.business_notification_schedules TO service_role;
ALTER TABLE public.business_notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_notification_schedules FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3. business_notification_dispatches
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.business_notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app','email','push')),
  provider text NOT NULL DEFAULT 'internal',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','delivered','retry_scheduled','failed','dead_lettered','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  claimed_at timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  external_reference text,
  payload_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bnotif_dispatch_unique UNIQUE (notification_id, channel)
);
CREATE INDEX IF NOT EXISTS bnotif_dispatch_claim_idx
  ON public.business_notification_dispatches (next_retry_at)
  WHERE status IN ('pending','retry_scheduled');
CREATE INDEX IF NOT EXISTS bnotif_dispatch_processing_idx
  ON public.business_notification_dispatches (claimed_at)
  WHERE status = 'processing';

REVOKE ALL ON public.business_notification_dispatches FROM PUBLIC;
REVOKE ALL ON public.business_notification_dispatches FROM anon;
REVOKE ALL ON public.business_notification_dispatches FROM authenticated;
GRANT ALL ON public.business_notification_dispatches TO service_role;
ALTER TABLE public.business_notification_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_notification_dispatches FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 4. business_notification_escalations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_domain text NOT NULL,
  source_record_id text NOT NULL,
  recipient_user_id uuid NOT NULL,
  policy_key text NOT NULL,
  escalation_level integer NOT NULL,
  next_run_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','claimed','completed','cancelled','expired','failed')),
  claim_token text,
  claimed_at timestamptz,
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bnotif_escalation_dedupe_unique UNIQUE (dedupe_key)
);
CREATE INDEX IF NOT EXISTS bnotif_escalation_claim_idx
  ON public.business_notification_escalations (next_run_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS bnotif_escalation_source_idx
  ON public.business_notification_escalations (source_domain, source_record_id);

REVOKE ALL ON public.business_notification_escalations FROM PUBLIC;
REVOKE ALL ON public.business_notification_escalations FROM anon;
REVOKE ALL ON public.business_notification_escalations FROM authenticated;
GRANT ALL ON public.business_notification_escalations TO service_role;
ALTER TABLE public.business_notification_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_notification_escalations FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 5. business_notification_event_receipts (outbox dedupe)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_notification_event_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id text NOT NULL,
  policy_version text NOT NULL DEFAULT '1.0.0',
  processed_at timestamptz NOT NULL DEFAULT now(),
  result text NOT NULL,
  notification_count integer NOT NULL DEFAULT 0,
  suppression_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bnotif_receipt_unique UNIQUE (source_event_id, policy_version)
);

REVOKE ALL ON public.business_notification_event_receipts FROM PUBLIC;
REVOKE ALL ON public.business_notification_event_receipts FROM anon;
REVOKE ALL ON public.business_notification_event_receipts FROM authenticated;
GRANT ALL ON public.business_notification_event_receipts TO service_role;
ALTER TABLE public.business_notification_event_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_notification_event_receipts FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 6. updated_at triggers (shared function likely exists)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bnotif_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS bnotif_touch_notifications ON public.business_notifications;
CREATE TRIGGER bnotif_touch_notifications BEFORE UPDATE ON public.business_notifications
  FOR EACH ROW EXECUTE FUNCTION public.bnotif_touch_updated_at();
DROP TRIGGER IF EXISTS bnotif_touch_schedules ON public.business_notification_schedules;
CREATE TRIGGER bnotif_touch_schedules BEFORE UPDATE ON public.business_notification_schedules
  FOR EACH ROW EXECUTE FUNCTION public.bnotif_touch_updated_at();
DROP TRIGGER IF EXISTS bnotif_touch_dispatches ON public.business_notification_dispatches;
CREATE TRIGGER bnotif_touch_dispatches BEFORE UPDATE ON public.business_notification_dispatches
  FOR EACH ROW EXECUTE FUNCTION public.bnotif_touch_updated_at();
DROP TRIGGER IF EXISTS bnotif_touch_escalations ON public.business_notification_escalations;
CREATE TRIGGER bnotif_touch_escalations BEFORE UPDATE ON public.business_notification_escalations
  FOR EACH ROW EXECUTE FUNCTION public.bnotif_touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. User-facing RPCs: mark_read / mark_unread / archive / archive_all_read
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bnotif_mark_read(_id uuid)
RETURNS public.business_notifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.business_notifications;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  UPDATE public.business_notifications
  SET status = CASE WHEN status IN ('delivered','pending','scheduled') THEN 'read' ELSE status END,
      read_at = COALESCE(read_at, now())
  WHERE id = _id AND recipient_user_id = auth.uid()
    AND archived_at IS NULL AND expired_at IS NULL
  RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_mark_unread(_id uuid)
RETURNS public.business_notifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.business_notifications;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  UPDATE public.business_notifications
  SET status = 'delivered', read_at = NULL
  WHERE id = _id AND recipient_user_id = auth.uid()
    AND status = 'read' AND archived_at IS NULL
  RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_archive(_id uuid)
RETURNS public.business_notifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.business_notifications;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  UPDATE public.business_notifications
  SET status = 'archived', archived_at = now()
  WHERE id = _id AND recipient_user_id = auth.uid()
  RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_archive_all_read()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  WITH upd AS (
    UPDATE public.business_notifications
    SET status = 'archived', archived_at = now()
    WHERE recipient_user_id = auth.uid() AND status = 'read' AND archived_at IS NULL
    RETURNING 1
  ) SELECT count(*) INTO n FROM upd;
  RETURN COALESCE(n, 0);
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_unread_count()
RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT count(*)::int
  FROM public.business_notifications
  WHERE recipient_user_id = auth.uid()
    AND read_at IS NULL AND archived_at IS NULL AND expired_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.bnotif_mark_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_mark_unread(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_archive(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_archive_all_read() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_unread_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bnotif_mark_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bnotif_mark_unread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bnotif_archive(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bnotif_archive_all_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bnotif_unread_count() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. Service-role runtime RPCs (SKIP LOCKED claim + updates)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bnotif_claim_schedules(_batch integer, _token text)
RETURNS SETOF public.business_notification_schedules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id FROM public.business_notification_schedules
    WHERE status = 'scheduled' AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(_batch, 1), 500)
  )
  UPDATE public.business_notification_schedules s
  SET status = 'claimed', claim_token = _token, claimed_at = now(),
      attempt_count = s.attempt_count + 1
  FROM picked WHERE s.id = picked.id
  RETURNING s.*;
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_claim_dispatches(_batch integer, _token text)
RETURNS SETOF public.business_notification_dispatches
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id FROM public.business_notification_dispatches
    WHERE (status = 'pending' OR (status = 'retry_scheduled' AND next_retry_at <= now()))
    ORDER BY COALESCE(next_retry_at, created_at) ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(_batch, 1), 500)
  )
  UPDATE public.business_notification_dispatches d
  SET status = 'processing', claimed_at = now(),
      attempt_count = d.attempt_count + 1
  FROM picked WHERE d.id = picked.id
  RETURNING d.*;
END; $$;

CREATE OR REPLACE FUNCTION public.bnotif_recover_stuck(_threshold_minutes integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0; k integer;
BEGIN
  WITH d AS (
    UPDATE public.business_notification_dispatches
    SET status = 'retry_scheduled', next_retry_at = now(), claimed_at = NULL
    WHERE status = 'processing' AND claimed_at < now() - make_interval(mins => GREATEST(_threshold_minutes,1))
    RETURNING 1
  ) SELECT count(*) INTO k FROM d; n := n + COALESCE(k,0);
  WITH s AS (
    UPDATE public.business_notification_schedules
    SET status = 'scheduled', claim_token = NULL, claimed_at = NULL
    WHERE status = 'claimed' AND claimed_at < now() - make_interval(mins => GREATEST(_threshold_minutes,1))
    RETURNING 1
  ) SELECT count(*) INTO k FROM s; n := n + COALESCE(k,0);
  RETURN n;
END; $$;

REVOKE ALL ON FUNCTION public.bnotif_claim_schedules(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_claim_dispatches(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bnotif_recover_stuck(integer) FROM PUBLIC;
-- No authenticated grant — service_role only (bypasses REVOKE via role).
