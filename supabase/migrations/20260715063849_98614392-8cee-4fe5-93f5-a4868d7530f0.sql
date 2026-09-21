
-- BC-6.8R — Alerts evaluator + recorded scheduler wrappers.

-- Helper: raise-or-refresh, preserving acknowledgment.
CREATE OR REPLACE FUNCTION public.intro_ops_alerts_raise_or_refresh(
  _rule_key text, _category text, _severity text, _message text, _details jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM public.introduction_ops_alerts
  WHERE scope = 'platform' AND association_id IS NULL AND rule_key = _rule_key
    AND state IN ('open','acknowledged')
  ORDER BY last_seen_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.introduction_ops_alerts
       SET last_seen_at = now(),
           occurrence_count = occurrence_count + 1,
           severity = _severity,
           message = _message,
           details = COALESCE(_details, '{}'::jsonb),
           updated_at = now()
     WHERE id = existing_id;
  ELSE
    INSERT INTO public.introduction_ops_alerts
      (scope, association_id, category, severity, rule_key, message, details)
    VALUES ('platform', NULL, _category, _severity, _rule_key, _message,
            COALESCE(_details, '{}'::jsonb));
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.intro_ops_alerts_raise_or_refresh(text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_ops_alerts_raise_or_refresh(text,text,text,text,jsonb) TO service_role;

-- Canonical evaluator over the frozen 10-code registry.
CREATE OR REPLACE FUNCTION public.intro_ops_alerts_evaluate()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  th jsonb := public.intro_ops_thresholds();
  s  jsonb := public.intro_ops_health_summary('platform', NULL);
  ob jsonb := s->'subsystems'->'outbox';
  co jsonb := s->'subsystems'->'consumer';
  sc jsonb := s->'subsystems'->'scheduler';
  rq jsonb := s->'subsystems'->'requests';
  active text[] := ARRAY[]::text[];
  raised int := 0; resolved int := 0;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'ops.forbidden' USING ERRCODE = '42501';
  END IF;

  -- outbox.pending {warn,critical}
  IF COALESCE((ob->>'pending')::int,0) >= COALESCE((th->>'outbox_pending_crit')::int, 200) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('outbox.pending.critical','outbox','critical',
      'Outbox pending count above critical threshold', jsonb_build_object('pending', ob->'pending'));
    raised := raised+1; active := active || 'outbox.pending.critical';
  ELSIF COALESCE((ob->>'pending')::int,0) >= COALESCE((th->>'outbox_pending_warn')::int, 50) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('outbox.pending.warn','outbox','warning',
      'Outbox pending count above warning threshold', jsonb_build_object('pending', ob->'pending'));
    raised := raised+1; active := active || 'outbox.pending.warn';
  END IF;

  -- outbox.lag {warn,critical}
  IF COALESCE((ob->>'oldest_lag_minutes')::numeric,0) >= COALESCE((th->>'outbox_oldest_lag_crit_min')::numeric, 30) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('outbox.lag.critical','outbox','critical',
      'Oldest outbox lag above critical threshold', jsonb_build_object('lag_min', ob->'oldest_lag_minutes'));
    raised := raised+1; active := active || 'outbox.lag.critical';
  ELSIF COALESCE((ob->>'oldest_lag_minutes')::numeric,0) >= COALESCE((th->>'outbox_oldest_lag_warn_min')::numeric, 10) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('outbox.lag.warn','outbox','warning',
      'Oldest outbox lag above warning threshold', jsonb_build_object('lag_min', ob->'oldest_lag_minutes'));
    raised := raised+1; active := active || 'outbox.lag.warn';
  END IF;

  -- consumer.failure_ratio {warn,critical}
  IF COALESCE((co->>'failure_ratio')::numeric,0) >= COALESCE((th->>'consumer_failure_ratio_crit')::numeric, 0.25) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('consumer.failure_ratio.critical','consumer','critical',
      'Consumer failure ratio above critical threshold', jsonb_build_object('ratio', co->'failure_ratio'));
    raised := raised+1; active := active || 'consumer.failure_ratio.critical';
  ELSIF COALESCE((co->>'failure_ratio')::numeric,0) >= COALESCE((th->>'consumer_failure_ratio_warn')::numeric, 0.10) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('consumer.failure_ratio.warn','consumer','warning',
      'Consumer failure ratio above warning threshold', jsonb_build_object('ratio', co->'failure_ratio'));
    raised := raised+1; active := active || 'consumer.failure_ratio.warn';
  END IF;

  -- consumer.dead_letter.critical
  IF COALESCE((co->>'dead_lettered_last_hour')::int,0) >= COALESCE((th->>'consumer_dead_letter_crit')::int, 5) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('consumer.dead_letter.critical','consumer','critical',
      'Consumer dead-letters above critical threshold in last hour',
      jsonb_build_object('dead', co->'dead_lettered_last_hour'));
    raised := raised+1; active := active || 'consumer.dead_letter.critical';
  END IF;

  -- scheduler.stale {warn,critical}
  IF COALESCE((sc->>'stale_minutes')::numeric,0) >= COALESCE((th->>'scheduler_stale_crit_min')::numeric, 60) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('scheduler.stale.critical','scheduler','critical',
      'Scheduler last run older than critical threshold', jsonb_build_object('stale_min', sc->'stale_minutes'));
    raised := raised+1; active := active || 'scheduler.stale.critical';
  ELSIF COALESCE((sc->>'stale_minutes')::numeric,0) >= COALESCE((th->>'scheduler_stale_warn_min')::numeric, 15) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('scheduler.stale.warn','scheduler','warning',
      'Scheduler last run older than warning threshold', jsonb_build_object('stale_min', sc->'stale_minutes'));
    raised := raised+1; active := active || 'scheduler.stale.warn';
  END IF;

  -- requests.failure_ratio.critical
  IF COALESCE((rq->>'failure_ratio')::numeric,0) >= COALESCE((th->>'request_failure_ratio_crit')::numeric, 0.30) THEN
    PERFORM public.intro_ops_alerts_raise_or_refresh('requests.failure_ratio.critical','requests','critical',
      'Introduction-request failure ratio above critical threshold',
      jsonb_build_object('ratio', rq->'failure_ratio'));
    raised := raised+1; active := active || 'requests.failure_ratio.critical';
  END IF;

  -- Auto-resolve any frozen-registry alert not currently active.
  UPDATE public.introduction_ops_alerts
     SET state = 'resolved', resolved_at = now(), updated_at = now()
   WHERE scope = 'platform'
     AND association_id IS NULL
     AND state IN ('open','acknowledged')
     AND rule_key = ANY(ARRAY[
       'outbox.pending.warn','outbox.pending.critical',
       'outbox.lag.warn','outbox.lag.critical',
       'consumer.failure_ratio.warn','consumer.failure_ratio.critical',
       'consumer.dead_letter.critical',
       'scheduler.stale.warn','scheduler.stale.critical',
       'requests.failure_ratio.critical'
     ])
     AND NOT (rule_key = ANY(active));
  GET DIAGNOSTICS resolved = ROW_COUNT;

  RETURN jsonb_build_object('raised', raised, 'auto_resolved', resolved, 'active', to_jsonb(active));
END; $$;
REVOKE ALL ON FUNCTION public.intro_ops_alerts_evaluate() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_ops_alerts_evaluate() TO service_role;

-- Recorded scheduler wrappers so expire sweep + reconcile emit job-run rows.
CREATE OR REPLACE FUNCTION public.intro_outcome_expire_sweep_recorded(p_limit int DEFAULT 200)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE started timestamptz := now(); n int := 0;
BEGIN
  BEGIN
    n := public.intro_outcome_expire_sweep(p_limit);
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, rows_processed, details)
    VALUES ('outcome_expire_sweep', started, now(), 'success', n,
            jsonb_build_object('limit', p_limit));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, error_code, error_message)
    VALUES ('outcome_expire_sweep', started, now(), 'failed', SQLSTATE, SQLERRM);
    RAISE;
  END;
  RETURN n;
END; $$;
REVOKE ALL ON FUNCTION public.intro_outcome_expire_sweep_recorded(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_expire_sweep_recorded(int) TO service_role;

CREATE OR REPLACE FUNCTION public.intro_outcome_reconcile_recorded(p_limit int DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE started timestamptz := now(); r record;
BEGIN
  BEGIN
    SELECT * INTO r FROM public.intro_outcome_reconcile(p_limit);
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, rows_processed, details)
    VALUES ('outcome_reconcile', started, now(), 'success',
            COALESCE(r.created,0) + COALESCE(r.observed,0) + COALESCE(r.expired,0),
            jsonb_build_object('created', r.created, 'observed', r.observed, 'expired', r.expired));
    RETURN jsonb_build_object('created', r.created, 'observed', r.observed, 'expired', r.expired);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, error_code, error_message)
    VALUES ('outcome_reconcile', started, now(), 'failed', SQLSTATE, SQLERRM);
    RAISE;
  END;
END; $$;
REVOKE ALL ON FUNCTION public.intro_outcome_reconcile_recorded(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_reconcile_recorded(int) TO service_role;

CREATE OR REPLACE FUNCTION public.intro_ops_alerts_evaluate_recorded()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE started timestamptz := now(); res jsonb;
BEGIN
  BEGIN
    res := public.intro_ops_alerts_evaluate();
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, rows_processed, details)
    VALUES ('intro_ops_alerts_evaluate', started, now(), 'success',
            COALESCE((res->>'raised')::int,0) + COALESCE((res->>'auto_resolved')::int,0), res);
    RETURN res;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.introduction_ops_job_runs
      (job_name, started_at, finished_at, status, error_code, error_message)
    VALUES ('intro_ops_alerts_evaluate', started, now(), 'failed', SQLSTATE, SQLERRM);
    RAISE;
  END;
END; $$;
REVOKE ALL ON FUNCTION public.intro_ops_alerts_evaluate_recorded() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_ops_alerts_evaluate_recorded() TO service_role;

-- Re-schedule the sweep to go through the recorded wrapper; add reconcile + alerts evaluator.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='intro_outcome_expire_sweep_hourly') THEN
    PERFORM cron.unschedule('intro_outcome_expire_sweep_hourly');
  END IF;
  PERFORM cron.schedule(
    'intro_outcome_expire_sweep_hourly', '0 * * * *',
    'SELECT public.intro_outcome_expire_sweep_recorded(200);'
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='intro_outcome_reconcile_hourly') THEN
    PERFORM cron.unschedule('intro_outcome_reconcile_hourly');
  END IF;
  PERFORM cron.schedule(
    'intro_outcome_reconcile_hourly', '15 * * * *',
    'SELECT public.intro_outcome_reconcile_recorded(200);'
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='intro_ops_alerts_evaluate_5min') THEN
    PERFORM cron.unschedule('intro_ops_alerts_evaluate_5min');
  END IF;
  PERFORM cron.schedule(
    'intro_ops_alerts_evaluate_5min', '*/5 * * * *',
    'SELECT public.intro_ops_alerts_evaluate_recorded();'
  );
END; $$;
