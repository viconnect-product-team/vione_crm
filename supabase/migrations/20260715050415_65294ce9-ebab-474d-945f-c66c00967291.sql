
-- =========================================================================
-- BC-6.8 Wave 1 — Operational Observability Foundation
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) TABLES
-- -------------------------------------------------------------------------

CREATE TABLE public.introduction_ops_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('platform','association')),
  association_id UUID NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  rule_key TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open','acknowledged','resolved')),
  acknowledged_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ NULL,
  resolved_at TIMESTAMPTZ NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT intro_ops_alert_scope_shape CHECK (
    (scope = 'platform' AND association_id IS NULL) OR
    (scope = 'association' AND association_id IS NOT NULL)
  )
);
CREATE INDEX idx_intro_ops_alerts_state_severity ON public.introduction_ops_alerts (state, severity, last_seen_at DESC);
CREATE INDEX idx_intro_ops_alerts_scope ON public.introduction_ops_alerts (scope, association_id, last_seen_at DESC);
CREATE UNIQUE INDEX uq_intro_ops_alerts_open_rule ON public.introduction_ops_alerts (scope, COALESCE(association_id, '00000000-0000-0000-0000-000000000000'::uuid), rule_key) WHERE state = 'open';

GRANT SELECT, UPDATE ON public.introduction_ops_alerts TO authenticated;
GRANT ALL ON public.introduction_ops_alerts TO service_role;
ALTER TABLE public.introduction_ops_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_ops_alerts FORCE ROW LEVEL SECURITY;
-- No direct policies: reads/writes go through SECURITY DEFINER RPCs.
CREATE POLICY "intro_ops_alerts_service_all" ON public.introduction_ops_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.introduction_ops_job_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  rows_processed INTEGER NOT NULL DEFAULT 0,
  error_code TEXT NULL,
  error_message TEXT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_intro_ops_job_runs_job_started ON public.introduction_ops_job_runs (job_name, started_at DESC);
CREATE INDEX idx_intro_ops_job_runs_status ON public.introduction_ops_job_runs (status, started_at DESC);

GRANT SELECT ON public.introduction_ops_job_runs TO authenticated;
GRANT ALL ON public.introduction_ops_job_runs TO service_role;
ALTER TABLE public.introduction_ops_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_ops_job_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY "intro_ops_job_runs_service_all" ON public.introduction_ops_job_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.introduction_ops_consumer_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NULL,
  adapter_name TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','partial','failed')),
  events_claimed INTEGER NOT NULL DEFAULT 0,
  events_delivered INTEGER NOT NULL DEFAULT 0,
  events_failed INTEGER NOT NULL DEFAULT 0,
  events_deadlettered INTEGER NOT NULL DEFAULT 0,
  error_code TEXT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_intro_ops_consumer_runs_started ON public.introduction_ops_consumer_runs (started_at DESC);
CREATE INDEX idx_intro_ops_consumer_runs_adapter ON public.introduction_ops_consumer_runs (adapter_name, started_at DESC);

GRANT SELECT ON public.introduction_ops_consumer_runs TO authenticated;
GRANT ALL ON public.introduction_ops_consumer_runs TO service_role;
ALTER TABLE public.introduction_ops_consumer_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_ops_consumer_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY "intro_ops_consumer_runs_service_all" ON public.introduction_ops_consumer_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 2) THRESHOLD REGISTRY
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.intro_ops_thresholds()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'outbox_pending_warn', 100,
    'outbox_pending_crit', 500,
    'outbox_oldest_lag_warn_min', 10,
    'outbox_oldest_lag_crit_min', 30,
    'consumer_failure_ratio_warn', 0.05,
    'consumer_failure_ratio_crit', 0.20,
    'consumer_dead_letter_warn', 1,
    'consumer_dead_letter_crit', 10,
    'scheduler_stale_warn_min', 15,
    'scheduler_stale_crit_min', 60,
    'request_failure_ratio_warn', 0.10,
    'request_failure_ratio_crit', 0.30,
    'window_short_min', 15,
    'window_long_hours', 24
  );
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_thresholds() TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 3) VIEW PERMISSION HELPER
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.intro_ops_can_view(_scope TEXT, _association_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;
  -- Platform admins see everything.
  IF public.is_platform_admin() THEN RETURN TRUE; END IF;
  -- Association-scope requires association admin membership.
  IF _scope = 'association' AND _association_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = uid
        AND m.association_id = _association_id
        AND m.role = 'admin'
    );
  END IF;
  RETURN FALSE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_can_view(TEXT, UUID) TO authenticated, service_role;

-- Internal guard used by RPCs.
CREATE OR REPLACE FUNCTION public.intro_ops_assert_view(_scope TEXT, _association_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_ops_can_view(_scope, _association_id) THEN
    RAISE EXCEPTION 'ops.forbidden' USING ERRCODE = '42501';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_assert_view(TEXT, UUID) TO authenticated, service_role;

-- Reusable predicate to filter tenant rows by association scope.
-- Each introduction table stores requester/target user ids; we join via memberships.
CREATE OR REPLACE FUNCTION public.intro_ops_user_in_association(_user_id UUID, _association_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = _user_id
      AND m.association_id = _association_id
  );
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_user_in_association(UUID, UUID) TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 4) READ RPCs (scoped)
-- -------------------------------------------------------------------------

-- 4.1 Requests stats
CREATE OR REPLACE FUNCTION public.intro_ops_requests_stats(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _range_hours INT DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since TIMESTAMPTZ := now() - make_interval(hours => GREATEST(_range_hours, 1));
  result JSONB;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  WITH rows AS (
    SELECT r.status, r.created_at
    FROM public.introduction_requests r
    WHERE r.created_at >= since
      AND (
        _scope = 'platform'
        OR public.intro_ops_user_in_association(r.requester_user_id, _association_id)
      )
  ),
  by_status AS (
    SELECT status, COUNT(*)::INT AS c FROM rows GROUP BY status
  )
  SELECT jsonb_build_object(
    'range_hours', _range_hours,
    'total', COALESCE((SELECT SUM(c) FROM by_status), 0),
    'by_status', COALESCE((SELECT jsonb_object_agg(status, c) FROM by_status), '{}'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_requests_stats(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.2 Deliveries stats
CREATE OR REPLACE FUNCTION public.intro_ops_deliveries_stats(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _range_hours INT DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since TIMESTAMPTZ := now() - make_interval(hours => GREATEST(_range_hours, 1));
  result JSONB;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  WITH rows AS (
    SELECT d.status
    FROM public.introduction_deliveries d
    WHERE d.created_at >= since
      AND (
        _scope = 'platform'
        OR public.intro_ops_user_in_association(d.target_user_id, _association_id)
      )
  ),
  by_status AS (SELECT status, COUNT(*)::INT AS c FROM rows GROUP BY status)
  SELECT jsonb_build_object(
    'range_hours', _range_hours,
    'total', COALESCE((SELECT SUM(c) FROM by_status), 0),
    'by_status', COALESCE((SELECT jsonb_object_agg(status, c) FROM by_status), '{}'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_deliveries_stats(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.3 Outcomes stats
CREATE OR REPLACE FUNCTION public.intro_ops_outcomes_stats(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _range_hours INT DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since TIMESTAMPTZ := now() - make_interval(hours => GREATEST(_range_hours, 1));
  result JSONB;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  WITH rows AS (
    SELECT o.status, o.outcome_type
    FROM public.introduction_outcomes o
    WHERE o.created_at >= since
      AND (
        _scope = 'platform'
        OR public.intro_ops_user_in_association(o.target_user_id, _association_id)
      )
  ),
  by_status AS (SELECT status, COUNT(*)::INT AS c FROM rows GROUP BY status),
  by_type AS (SELECT COALESCE(outcome_type, 'unresolved') AS t, COUNT(*)::INT AS c FROM rows GROUP BY 1)
  SELECT jsonb_build_object(
    'range_hours', _range_hours,
    'total', COALESCE((SELECT SUM(c) FROM by_status), 0),
    'by_status', COALESCE((SELECT jsonb_object_agg(status, c) FROM by_status), '{}'::jsonb),
    'by_type', COALESCE((SELECT jsonb_object_agg(t, c) FROM by_type), '{}'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_outcomes_stats(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.4 Outbox stats (platform-only signal; still gated by view helper)
CREATE OR REPLACE FUNCTION public.intro_ops_outbox_stats(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  SELECT jsonb_build_object(
    'pending', COALESCE(SUM(CASE WHEN processed_at IS NULL THEN 1 ELSE 0 END), 0)::INT,
    'processed_last_hour', COALESCE(SUM(CASE WHEN processed_at >= now() - interval '1 hour' THEN 1 ELSE 0 END), 0)::INT,
    'failed_last_hour', COALESCE(SUM(CASE WHEN processed_at IS NULL AND attempt_count > 0 AND last_error_code IS NOT NULL AND created_at >= now() - interval '1 hour' THEN 1 ELSE 0 END), 0)::INT,
    'oldest_pending_seconds', COALESCE(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN processed_at IS NULL THEN available_at END))), 0)::INT
  ) INTO result
  FROM public.graph_outbox_events
  WHERE event_kind LIKE 'introduction.%';
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_outbox_stats(TEXT, UUID) TO authenticated, service_role;

-- 4.5 Scheduler runs
CREATE OR REPLACE FUNCTION public.intro_ops_scheduler_runs(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _limit INT DEFAULT 50
) RETURNS SETOF public.introduction_ops_job_runs
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  RETURN QUERY
    SELECT * FROM public.introduction_ops_job_runs
    ORDER BY started_at DESC
    LIMIT GREATEST(LEAST(_limit, 500), 1);
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_scheduler_runs(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.6 Consumer runs
CREATE OR REPLACE FUNCTION public.intro_ops_consumer_runs(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _limit INT DEFAULT 50
) RETURNS SETOF public.introduction_ops_consumer_runs
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  RETURN QUERY
    SELECT * FROM public.introduction_ops_consumer_runs
    ORDER BY started_at DESC
    LIMIT GREATEST(LEAST(_limit, 500), 1);
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_consumer_runs(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.7 Adapter stats
CREATE OR REPLACE FUNCTION public.intro_ops_adapter_stats(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _range_hours INT DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since TIMESTAMPTZ := now() - make_interval(hours => GREATEST(_range_hours, 1));
  result JSONB;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  WITH per AS (
    SELECT adapter_name,
      COUNT(*) FILTER (WHERE status = 'delivered')::INT AS delivered,
      COUNT(*) FILTER (WHERE status = 'failed')::INT AS failed,
      COUNT(*) FILTER (WHERE status = 'dead_lettered')::INT AS dead_lettered,
      COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending,
      COUNT(*)::INT AS total
    FROM public.outcome_event_dispatches
    WHERE created_at >= since
    GROUP BY adapter_name
  )
  SELECT jsonb_build_object(
    'range_hours', _range_hours,
    'adapters', COALESCE(jsonb_agg(to_jsonb(per) ORDER BY adapter_name), '[]'::jsonb)
  ) INTO result
  FROM per;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_adapter_stats(TEXT, UUID, INT) TO authenticated, service_role;

-- 4.8 Alerts list
CREATE OR REPLACE FUNCTION public.intro_ops_alerts_list(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _limit INT DEFAULT 100
) RETURNS SETOF public.introduction_ops_alerts
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);
  RETURN QUERY
    SELECT a.* FROM public.introduction_ops_alerts a
    WHERE
      (_state IS NULL OR a.state = _state)
      AND (
        _scope = 'platform'
        OR (a.scope = 'association' AND a.association_id = _association_id)
      )
    ORDER BY
      CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
      a.last_seen_at DESC
    LIMIT GREATEST(LEAST(_limit, 500), 1);
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_alerts_list(TEXT, UUID, TEXT, INT) TO authenticated, service_role;

-- 4.9 Alert acknowledge / resolve
CREATE OR REPLACE FUNCTION public.intro_ops_alert_acknowledge(_alert_id UUID)
RETURNS public.introduction_ops_alerts
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.introduction_ops_alerts;
BEGIN
  SELECT * INTO a FROM public.introduction_ops_alerts WHERE id = _alert_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ops.alert_not_found' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.intro_ops_assert_view(a.scope, a.association_id);
  UPDATE public.introduction_ops_alerts
    SET state = 'acknowledged',
        acknowledged_by = auth.uid(),
        acknowledged_at = now(),
        updated_at = now()
    WHERE id = _alert_id
    RETURNING * INTO a;
  RETURN a;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_alert_acknowledge(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intro_ops_alert_resolve(_alert_id UUID)
RETURNS public.introduction_ops_alerts
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.introduction_ops_alerts;
BEGIN
  SELECT * INTO a FROM public.introduction_ops_alerts WHERE id = _alert_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ops.alert_not_found' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.intro_ops_assert_view(a.scope, a.association_id);
  UPDATE public.introduction_ops_alerts
    SET state = 'resolved',
        resolved_at = now(),
        updated_at = now()
    WHERE id = _alert_id
    RETURNING * INTO a;
  RETURN a;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_alert_resolve(UUID) TO authenticated, service_role;

-- 4.10 Health summary — combines all subsystem signals into one JSONB blob.
CREATE OR REPLACE FUNCTION public.intro_ops_health_summary(
  _scope TEXT DEFAULT 'platform',
  _association_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  th JSONB := public.intro_ops_thresholds();
  outbox JSONB;
  consumer JSONB;
  scheduler JSONB;
  requests JSONB;
  outbox_pending INT;
  outbox_lag_min NUMERIC;
  consumer_delivered INT;
  consumer_failed INT;
  consumer_dead INT;
  consumer_ratio NUMERIC;
  sched_stale_min NUMERIC;
  req_total INT;
  req_expired INT;
  req_ratio NUMERIC;
  outbox_status TEXT;
  consumer_status TEXT;
  scheduler_status TEXT;
  requests_status TEXT;
  overall TEXT;
BEGIN
  PERFORM public.intro_ops_assert_view(_scope, _association_id);

  -- Outbox signals (platform-wide; only meaningful at platform scope).
  SELECT
    COALESCE(SUM(CASE WHEN processed_at IS NULL THEN 1 ELSE 0 END), 0)::INT,
    COALESCE(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN processed_at IS NULL THEN available_at END))) / 60, 0)::NUMERIC
  INTO outbox_pending, outbox_lag_min
  FROM public.graph_outbox_events
  WHERE event_kind LIKE 'introduction.%';

  IF outbox_pending >= (th->>'outbox_pending_crit')::INT OR outbox_lag_min >= (th->>'outbox_oldest_lag_crit_min')::INT THEN
    outbox_status := 'unhealthy';
  ELSIF outbox_pending >= (th->>'outbox_pending_warn')::INT OR outbox_lag_min >= (th->>'outbox_oldest_lag_warn_min')::INT THEN
    outbox_status := 'degraded';
  ELSE
    outbox_status := 'healthy';
  END IF;

  outbox := jsonb_build_object(
    'status', outbox_status,
    'pending', outbox_pending,
    'oldest_lag_minutes', ROUND(outbox_lag_min, 2)
  );

  -- Consumer signals (last hour of dispatches).
  SELECT
    COUNT(*) FILTER (WHERE status = 'delivered')::INT,
    COUNT(*) FILTER (WHERE status = 'failed')::INT,
    COUNT(*) FILTER (WHERE status = 'dead_lettered')::INT
  INTO consumer_delivered, consumer_failed, consumer_dead
  FROM public.outcome_event_dispatches
  WHERE created_at >= now() - interval '1 hour';

  consumer_ratio := CASE
    WHEN (consumer_delivered + consumer_failed) = 0 THEN 0
    ELSE consumer_failed::NUMERIC / (consumer_delivered + consumer_failed)
  END;

  IF consumer_dead >= (th->>'consumer_dead_letter_crit')::INT OR consumer_ratio >= (th->>'consumer_failure_ratio_crit')::NUMERIC THEN
    consumer_status := 'unhealthy';
  ELSIF consumer_dead >= (th->>'consumer_dead_letter_warn')::INT OR consumer_ratio >= (th->>'consumer_failure_ratio_warn')::NUMERIC THEN
    consumer_status := 'degraded';
  ELSE
    consumer_status := 'healthy';
  END IF;

  consumer := jsonb_build_object(
    'status', consumer_status,
    'delivered_last_hour', consumer_delivered,
    'failed_last_hour', consumer_failed,
    'dead_lettered_last_hour', consumer_dead,
    'failure_ratio', ROUND(consumer_ratio, 4)
  );

  -- Scheduler freshness.
  SELECT COALESCE(EXTRACT(EPOCH FROM (now() - MAX(finished_at))) / 60, 999999)::NUMERIC
  INTO sched_stale_min
  FROM public.introduction_ops_job_runs
  WHERE status = 'success';

  IF sched_stale_min >= (th->>'scheduler_stale_crit_min')::INT THEN
    scheduler_status := 'unhealthy';
  ELSIF sched_stale_min >= (th->>'scheduler_stale_warn_min')::INT THEN
    scheduler_status := 'degraded';
  ELSE
    scheduler_status := 'healthy';
  END IF;

  scheduler := jsonb_build_object(
    'status', scheduler_status,
    'stale_minutes', ROUND(sched_stale_min, 2)
  );

  -- Request pipeline (scoped).
  SELECT COUNT(*)::INT,
         COUNT(*) FILTER (WHERE status IN ('expired','cancelled'))::INT
  INTO req_total, req_expired
  FROM public.introduction_requests r
  WHERE r.created_at >= now() - make_interval(hours => (th->>'window_long_hours')::INT)
    AND (
      _scope = 'platform'
      OR public.intro_ops_user_in_association(r.requester_user_id, _association_id)
    );

  req_ratio := CASE WHEN req_total = 0 THEN 0 ELSE req_expired::NUMERIC / req_total END;
  IF req_ratio >= (th->>'request_failure_ratio_crit')::NUMERIC THEN
    requests_status := 'unhealthy';
  ELSIF req_ratio >= (th->>'request_failure_ratio_warn')::NUMERIC THEN
    requests_status := 'degraded';
  ELSE
    requests_status := 'healthy';
  END IF;

  requests := jsonb_build_object(
    'status', requests_status,
    'total_24h', req_total,
    'expired_or_cancelled_24h', req_expired,
    'failure_ratio', ROUND(req_ratio, 4)
  );

  -- Overall = worst of all subsystems.
  overall := CASE
    WHEN 'unhealthy' IN (outbox_status, consumer_status, scheduler_status, requests_status) THEN 'unhealthy'
    WHEN 'degraded'  IN (outbox_status, consumer_status, scheduler_status, requests_status) THEN 'degraded'
    ELSE 'healthy'
  END;

  RETURN jsonb_build_object(
    'scope', _scope,
    'association_id', _association_id,
    'evaluated_at', now(),
    'overall', overall,
    'subsystems', jsonb_build_object(
      'outbox', outbox,
      'consumer', consumer,
      'scheduler', scheduler,
      'requests', requests
    ),
    'thresholds', th
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_health_summary(TEXT, UUID) TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 5) WRITE RPCs — SERVICE-ROLE ONLY RECORDERS
-- -------------------------------------------------------------------------

-- Alert upsert: raises a new open alert or bumps occurrence_count on existing open one.
CREATE OR REPLACE FUNCTION public.intro_ops_raise_alert(
  _scope TEXT,
  _association_id UUID,
  _category TEXT,
  _severity TEXT,
  _rule_key TEXT,
  _message TEXT,
  _details JSONB DEFAULT '{}'::jsonb
) RETURNS public.introduction_ops_alerts
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.introduction_ops_alerts;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'ops.forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.introduction_ops_alerts (
    scope, association_id, category, severity, rule_key, message, details
  ) VALUES (
    _scope, _association_id, _category, _severity, _rule_key, _message, COALESCE(_details, '{}'::jsonb)
  )
  ON CONFLICT (scope, COALESCE(association_id, '00000000-0000-0000-0000-000000000000'::uuid), rule_key)
    WHERE state = 'open'
  DO UPDATE SET
    last_seen_at = now(),
    occurrence_count = public.introduction_ops_alerts.occurrence_count + 1,
    severity = EXCLUDED.severity,
    message = EXCLUDED.message,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING * INTO a;
  RETURN a;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_raise_alert(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.intro_ops_record_job_run(
  _job_name TEXT,
  _started_at TIMESTAMPTZ,
  _finished_at TIMESTAMPTZ,
  _status TEXT,
  _rows_processed INT DEFAULT 0,
  _error_code TEXT DEFAULT NULL,
  _error_message TEXT DEFAULT NULL,
  _details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'ops.forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.introduction_ops_job_runs (
    job_name, started_at, finished_at, status, rows_processed, error_code, error_message, details
  ) VALUES (
    _job_name, _started_at, _finished_at, _status, COALESCE(_rows_processed, 0), _error_code, _error_message, COALESCE(_details, '{}'::jsonb)
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_record_job_run(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT, TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.intro_ops_record_consumer_run(
  _batch_id TEXT,
  _adapter_name TEXT,
  _started_at TIMESTAMPTZ,
  _finished_at TIMESTAMPTZ,
  _status TEXT,
  _events_claimed INT DEFAULT 0,
  _events_delivered INT DEFAULT 0,
  _events_failed INT DEFAULT 0,
  _events_deadlettered INT DEFAULT 0,
  _error_code TEXT DEFAULT NULL,
  _details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'ops.forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.introduction_ops_consumer_runs (
    batch_id, adapter_name, started_at, finished_at, status,
    events_claimed, events_delivered, events_failed, events_deadlettered,
    error_code, details
  ) VALUES (
    _batch_id, _adapter_name, _started_at, _finished_at, _status,
    COALESCE(_events_claimed, 0), COALESCE(_events_delivered, 0),
    COALESCE(_events_failed, 0), COALESCE(_events_deadlettered, 0),
    _error_code, COALESCE(_details, '{}'::jsonb)
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.intro_ops_record_consumer_run(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT, INT, INT, INT, TEXT, JSONB) TO service_role;

-- -------------------------------------------------------------------------
-- 6) UPDATED_AT TRIGGER
-- -------------------------------------------------------------------------
CREATE TRIGGER trg_intro_ops_alerts_updated_at
BEFORE UPDATE ON public.introduction_ops_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
