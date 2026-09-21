
-- BC-6.7 INTRODUCTION ANALYTICS AGGREGATE + RPCS + TRIGGERS + BACKFILL
-- =====================================================================

-- 1. AGGREGATE TABLES ------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.introduction_analytics_daily (
  id BIGSERIAL PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id UUID,
  metric_date DATE NOT NULL,
  path_depth SMALLINT NOT NULL,
  confidence_bucket TEXT NOT NULL,
  requested_count INT NOT NULL DEFAULT 0,
  accepted_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  acknowledged_count INT NOT NULL DEFAULT 0,
  connected_count INT NOT NULL DEFAULT 0,
  progressed_count INT NOT NULL DEFAULT 0,
  not_connected_count INT NOT NULL DEFAULT 0,
  closed_no_outcome_count INT NOT NULL DEFAULT 0,
  expired_count INT NOT NULL DEFAULT 0,
  total_accept_seconds BIGINT NOT NULL DEFAULT 0,
  total_delivery_seconds BIGINT NOT NULL DEFAULT 0,
  total_ack_seconds BIGINT NOT NULL DEFAULT 0,
  total_connect_seconds BIGINT NOT NULL DEFAULT 0,
  total_progressed_seconds BIGINT NOT NULL DEFAULT 0,
  analytics_version TEXT NOT NULL DEFAULT '1.0.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_iad_bucket
  ON public.introduction_analytics_daily
  (scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
   metric_date, path_depth, confidence_bucket);

CREATE INDEX IF NOT EXISTS idx_iad_scope_date
  ON public.introduction_analytics_daily (scope_type, scope_id, metric_date DESC);

GRANT SELECT ON public.introduction_analytics_daily TO authenticated;
GRANT ALL ON public.introduction_analytics_daily TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.introduction_analytics_daily_id_seq TO service_role;

ALTER TABLE public.introduction_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_analytics_daily FORCE ROW LEVEL SECURITY;
-- No policies: authenticated users can only read via SECURITY DEFINER RPCs.

CREATE TABLE IF NOT EXISTS public.introduction_analytics_durations (
  id BIGSERIAL PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id UUID,
  metric_date DATE NOT NULL,
  path_depth SMALLINT NOT NULL,
  confidence_bucket TEXT NOT NULL,
  metric_kind TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  source_event_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_iadur_event
  ON public.introduction_analytics_durations
  (scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
   metric_kind, source_event_id, path_depth, confidence_bucket);

CREATE INDEX IF NOT EXISTS idx_iadur_scope_kind_date
  ON public.introduction_analytics_durations
  (scope_type, scope_id, metric_kind, metric_date DESC);

GRANT SELECT ON public.introduction_analytics_durations TO authenticated;
GRANT ALL ON public.introduction_analytics_durations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.introduction_analytics_durations_id_seq TO service_role;

ALTER TABLE public.introduction_analytics_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_analytics_durations FORCE ROW LEVEL SECURITY;

-- 2. INTERNAL HELPERS ------------------------------------------------------

CREATE OR REPLACE FUNCTION public.intro_analytics_confidence_from_snapshot(snap JSONB)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN snap ? 'confidence' AND (snap->>'confidence') IN ('low','medium','high')
      THEN snap->>'confidence'
    ELSE 'medium'
  END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_depth_from_snapshot(snap JSONB)
RETURNS SMALLINT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN snap ? 'depth' AND (snap->>'depth')::INT IN (2,3)
      THEN (snap->>'depth')::SMALLINT
    ELSE 2::SMALLINT
  END;
$$;

-- Bump one counter column for a set of (scope, path_depth × {exact,all}) × (conf × {exact,all}) buckets.
CREATE OR REPLACE FUNCTION public._intro_analytics_bump(
  p_scopes JSONB,             -- array of {scope_type, scope_id}
  p_metric_date DATE,
  p_path_depth SMALLINT,
  p_confidence_bucket TEXT,
  p_counter TEXT,             -- column name to increment
  p_delta INT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s JSONB;
  d SMALLINT;
  c TEXT;
  sql_text TEXT;
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;
  IF p_counter NOT IN (
    'requested_count','accepted_count','delivered_count','acknowledged_count',
    'connected_count','progressed_count','not_connected_count',
    'closed_no_outcome_count','expired_count'
  ) THEN
    RAISE EXCEPTION 'invalid counter %', p_counter;
  END IF;

  FOR s IN SELECT jsonb_array_elements(p_scopes) LOOP
    FOR d IN SELECT unnest(ARRAY[p_path_depth, 0::SMALLINT]) LOOP
      FOR c IN SELECT unnest(ARRAY[p_confidence_bucket, 'all']) LOOP
        sql_text := format(
          $f$INSERT INTO public.introduction_analytics_daily
              (scope_type, scope_id, metric_date, path_depth, confidence_bucket, %I, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, now())
             ON CONFLICT (scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
                          metric_date, path_depth, confidence_bucket)
             DO UPDATE SET %I = public.introduction_analytics_daily.%I + EXCLUDED.%I,
                           updated_at = now()$f$,
          p_counter, p_counter, p_counter, p_counter
        );
        EXECUTE sql_text USING (s->>'scope_type'),
                                NULLIF(s->>'scope_id','')::uuid,
                                p_metric_date, d, c, p_delta;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public._intro_analytics_bump_seconds(
  p_scopes JSONB,
  p_metric_date DATE,
  p_path_depth SMALLINT,
  p_confidence_bucket TEXT,
  p_seconds_col TEXT,
  p_delta BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s JSONB;
  d SMALLINT;
  c TEXT;
  sql_text TEXT;
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;
  IF p_seconds_col NOT IN (
    'total_accept_seconds','total_delivery_seconds','total_ack_seconds',
    'total_connect_seconds','total_progressed_seconds'
  ) THEN
    RAISE EXCEPTION 'invalid seconds col %', p_seconds_col;
  END IF;

  FOR s IN SELECT jsonb_array_elements(p_scopes) LOOP
    FOR d IN SELECT unnest(ARRAY[p_path_depth, 0::SMALLINT]) LOOP
      FOR c IN SELECT unnest(ARRAY[p_confidence_bucket, 'all']) LOOP
        sql_text := format(
          $f$INSERT INTO public.introduction_analytics_daily
              (scope_type, scope_id, metric_date, path_depth, confidence_bucket, %I, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, now())
             ON CONFLICT (scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
                          metric_date, path_depth, confidence_bucket)
             DO UPDATE SET %I = public.introduction_analytics_daily.%I + EXCLUDED.%I,
                           updated_at = now()$f$,
          p_seconds_col, p_seconds_col, p_seconds_col, p_seconds_col
        );
        EXECUTE sql_text USING (s->>'scope_type'),
                                NULLIF(s->>'scope_id','')::uuid,
                                p_metric_date, d, c, p_delta;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public._intro_analytics_add_duration(
  p_scopes JSONB,
  p_metric_date DATE,
  p_path_depth SMALLINT,
  p_confidence_bucket TEXT,
  p_metric_kind TEXT,
  p_duration_seconds INT,
  p_source_event_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s JSONB;
  d SMALLINT;
  c TEXT;
BEGIN
  IF p_duration_seconds IS NULL OR p_duration_seconds < 0 THEN RETURN; END IF;
  FOR s IN SELECT jsonb_array_elements(p_scopes) LOOP
    FOR d IN SELECT unnest(ARRAY[p_path_depth, 0::SMALLINT]) LOOP
      FOR c IN SELECT unnest(ARRAY[p_confidence_bucket, 'all']) LOOP
        INSERT INTO public.introduction_analytics_durations
          (scope_type, scope_id, metric_date, path_depth, confidence_bucket,
           metric_kind, duration_seconds, source_event_id)
        VALUES ((s->>'scope_type'), NULLIF(s->>'scope_id','')::uuid,
                p_metric_date, d, c, p_metric_kind, p_duration_seconds, p_source_event_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public._intro_analytics_scopes(
  p_requester_uid UUID,
  p_intermediary_uid UUID
)
RETURNS JSONB
LANGUAGE sql IMMUTABLE
AS $$
  SELECT jsonb_build_array(
    jsonb_build_object('scope_type','self_requester','scope_id',p_requester_uid::text),
    jsonb_build_object('scope_type','self_intermediary','scope_id',p_intermediary_uid::text),
    jsonb_build_object('scope_type','platform','scope_id','')
  );
$$;

-- 3. LIFECYCLE APPLY FUNCTIONS --------------------------------------------

CREATE OR REPLACE FUNCTION public.intro_analytics_on_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  scopes JSONB;
  depth SMALLINT;
  conf TEXT;
BEGIN
  scopes := public._intro_analytics_scopes(NEW.requester_user_id, NEW.intermediary_user_id);
  depth := public.intro_analytics_depth_from_snapshot(NEW.path_snapshot);
  conf := public.intro_analytics_confidence_from_snapshot(NEW.path_snapshot);

  IF (TG_OP = 'INSERT') THEN
    PERFORM public._intro_analytics_bump(
      scopes, (NEW.created_at AT TIME ZONE 'UTC')::date, depth, conf, 'requested_count', 1);
  END IF;

  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'accepted') THEN
    PERFORM public._intro_analytics_bump(
      scopes, (COALESCE(NEW.responded_at, now()) AT TIME ZONE 'UTC')::date,
      depth, conf, 'accepted_count', 1);
    IF NEW.responded_at IS NOT NULL AND NEW.created_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (NEW.responded_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_accept_seconds',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at))::BIGINT));
      PERFORM public._intro_analytics_add_duration(
        scopes, (NEW.responded_at AT TIME ZONE 'UTC')::date, depth, conf,
        'accept',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at))::INT),
        NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  scopes JSONB;
  depth SMALLINT;
  conf TEXT;
  req RECORD;
BEGIN
  scopes := public._intro_analytics_scopes(NEW.requester_user_id, NEW.intermediary_user_id);
  SELECT path_snapshot, responded_at, created_at
    INTO req FROM public.introduction_requests WHERE id = NEW.introduction_request_id;
  depth := public.intro_analytics_depth_from_snapshot(COALESCE(req.path_snapshot,'{}'::jsonb));
  conf := public.intro_analytics_confidence_from_snapshot(COALESCE(req.path_snapshot,'{}'::jsonb));

  IF (TG_OP = 'INSERT') THEN
    PERFORM public._intro_analytics_bump(
      scopes, (COALESCE(NEW.delivered_at, NEW.created_at) AT TIME ZONE 'UTC')::date,
      depth, conf, 'delivered_count', 1);
    IF req.responded_at IS NOT NULL AND NEW.delivered_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (NEW.delivered_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_delivery_seconds',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.delivered_at - req.responded_at))::BIGINT));
      PERFORM public._intro_analytics_add_duration(
        scopes, (NEW.delivered_at AT TIME ZONE 'UTC')::date, depth, conf,
        'deliver',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.delivered_at - req.responded_at))::INT),
        NEW.id);
    END IF;
  END IF;

  IF (TG_OP = 'UPDATE') AND (OLD.acknowledged_at IS NULL) AND (NEW.acknowledged_at IS NOT NULL) THEN
    PERFORM public._intro_analytics_bump(
      scopes, (NEW.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf, 'acknowledged_count', 1);
    IF NEW.delivered_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (NEW.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_ack_seconds',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.delivered_at))::BIGINT));
      PERFORM public._intro_analytics_add_duration(
        scopes, (NEW.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf,
        'ack',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.delivered_at))::INT),
        NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_on_outcome()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  scopes JSONB;
  depth SMALLINT;
  conf TEXT;
  req RECORD;
  bucket TEXT;
BEGIN
  scopes := public._intro_analytics_scopes(NEW.requester_user_id, NEW.intermediary_user_id);
  SELECT path_snapshot INTO req FROM public.introduction_requests WHERE id = NEW.introduction_request_id;
  depth := public.intro_analytics_depth_from_snapshot(COALESCE(req.path_snapshot,'{}'::jsonb));
  conf := public.intro_analytics_confidence_from_snapshot(COALESCE(req.path_snapshot,'{}'::jsonb));

  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status IN ('resolved','expired')) THEN
    CASE
      WHEN NEW.status = 'expired' THEN bucket := 'expired_count';
      WHEN NEW.outcome_type = 'connected' THEN bucket := 'connected_count';
      WHEN NEW.outcome_type = 'progressed' THEN bucket := 'progressed_count';
      WHEN NEW.outcome_type = 'not_connected' THEN bucket := 'not_connected_count';
      WHEN NEW.outcome_type = 'closed_no_outcome' THEN bucket := 'closed_no_outcome_count';
      ELSE bucket := NULL;
    END CASE;

    IF bucket IS NOT NULL THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(NEW.resolved_at, now()) AT TIME ZONE 'UTC')::date,
        depth, conf, bucket, 1);
    END IF;

    IF NEW.outcome_type = 'connected' AND NEW.connection_observed_at IS NOT NULL AND NEW.acknowledged_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (NEW.connection_observed_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_connect_seconds',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.connection_observed_at - NEW.acknowledged_at))::BIGINT));
      PERFORM public._intro_analytics_add_duration(
        scopes, (NEW.connection_observed_at AT TIME ZONE 'UTC')::date, depth, conf,
        'connect',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.connection_observed_at - NEW.acknowledged_at))::INT),
        NEW.id);
    END IF;

    IF NEW.outcome_type = 'progressed' AND NEW.progressed_at IS NOT NULL AND NEW.acknowledged_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (NEW.progressed_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_progressed_seconds',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.progressed_at - NEW.acknowledged_at))::BIGINT));
      PERFORM public._intro_analytics_add_duration(
        scopes, (NEW.progressed_at AT TIME ZONE 'UTC')::date, depth, conf,
        'progressed',
        GREATEST(0, EXTRACT(EPOCH FROM (NEW.progressed_at - NEW.acknowledged_at))::INT),
        NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. TRIGGERS --------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_ir_analytics ON public.introduction_requests;
CREATE TRIGGER trg_ir_analytics
  AFTER INSERT OR UPDATE ON public.introduction_requests
  FOR EACH ROW EXECUTE FUNCTION public.intro_analytics_on_request();

DROP TRIGGER IF EXISTS trg_id_analytics ON public.introduction_deliveries;
CREATE TRIGGER trg_id_analytics
  AFTER INSERT OR UPDATE ON public.introduction_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.intro_analytics_on_delivery();

DROP TRIGGER IF EXISTS trg_io_analytics ON public.introduction_outcomes;
CREATE TRIGGER trg_io_analytics
  AFTER UPDATE ON public.introduction_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.intro_analytics_on_outcome();

-- 5. AUTHORITY ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.intro_analytics_authorize(
  p_scope_type TEXT,
  p_scope_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;
  IF p_scope_type IN ('self_requester','self_intermediary') THEN
    RETURN p_scope_id = uid;
  ELSIF p_scope_type = 'platform' THEN
    RETURN public.has_role(uid, 'admin'::app_role);
  END IF;
  RETURN FALSE;
END;
$$;

-- 6. READ RPCS ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.intro_analytics_overview(
  p_scope_type TEXT,
  p_scope_id UUID,
  p_from DATE,
  p_to DATE,
  p_path_depth SMALLINT DEFAULT 0,
  p_confidence TEXT DEFAULT 'all'
)
RETURNS TABLE(
  requested_count BIGINT, accepted_count BIGINT, delivered_count BIGINT,
  acknowledged_count BIGINT, connected_count BIGINT, progressed_count BIGINT,
  not_connected_count BIGINT, closed_no_outcome_count BIGINT, expired_count BIGINT,
  total_accept_seconds BIGINT, total_delivery_seconds BIGINT,
  total_ack_seconds BIGINT, total_connect_seconds BIGINT, total_progressed_seconds BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_analytics_authorize(p_scope_type, p_scope_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF (p_to - p_from) > 366 THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT
      COALESCE(SUM(d.requested_count),0)::BIGINT,
      COALESCE(SUM(d.accepted_count),0)::BIGINT,
      COALESCE(SUM(d.delivered_count),0)::BIGINT,
      COALESCE(SUM(d.acknowledged_count),0)::BIGINT,
      COALESCE(SUM(d.connected_count),0)::BIGINT,
      COALESCE(SUM(d.progressed_count),0)::BIGINT,
      COALESCE(SUM(d.not_connected_count),0)::BIGINT,
      COALESCE(SUM(d.closed_no_outcome_count),0)::BIGINT,
      COALESCE(SUM(d.expired_count),0)::BIGINT,
      COALESCE(SUM(d.total_accept_seconds),0)::BIGINT,
      COALESCE(SUM(d.total_delivery_seconds),0)::BIGINT,
      COALESCE(SUM(d.total_ack_seconds),0)::BIGINT,
      COALESCE(SUM(d.total_connect_seconds),0)::BIGINT,
      COALESCE(SUM(d.total_progressed_seconds),0)::BIGINT
    FROM public.introduction_analytics_daily d
    WHERE d.scope_type = p_scope_type
      AND (d.scope_id IS NOT DISTINCT FROM p_scope_id)
      AND d.metric_date BETWEEN p_from AND p_to
      AND d.path_depth = p_path_depth
      AND d.confidence_bucket = p_confidence;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_trend(
  p_scope_type TEXT, p_scope_id UUID, p_from DATE, p_to DATE,
  p_path_depth SMALLINT DEFAULT 0, p_confidence TEXT DEFAULT 'all'
)
RETURNS TABLE(
  metric_date DATE, requested_count BIGINT, accepted_count BIGINT,
  delivered_count BIGINT, acknowledged_count BIGINT,
  connected_count BIGINT, progressed_count BIGINT,
  not_connected_count BIGINT, closed_no_outcome_count BIGINT, expired_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_analytics_authorize(p_scope_type, p_scope_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF (p_to - p_from) > 366 THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT d.metric_date,
           SUM(d.requested_count)::BIGINT, SUM(d.accepted_count)::BIGINT,
           SUM(d.delivered_count)::BIGINT, SUM(d.acknowledged_count)::BIGINT,
           SUM(d.connected_count)::BIGINT, SUM(d.progressed_count)::BIGINT,
           SUM(d.not_connected_count)::BIGINT, SUM(d.closed_no_outcome_count)::BIGINT,
           SUM(d.expired_count)::BIGINT
    FROM public.introduction_analytics_daily d
    WHERE d.scope_type = p_scope_type
      AND (d.scope_id IS NOT DISTINCT FROM p_scope_id)
      AND d.metric_date BETWEEN p_from AND p_to
      AND d.path_depth = p_path_depth
      AND d.confidence_bucket = p_confidence
    GROUP BY d.metric_date
    ORDER BY d.metric_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_time_to_outcome(
  p_scope_type TEXT, p_scope_id UUID, p_from DATE, p_to DATE,
  p_path_depth SMALLINT DEFAULT 0, p_confidence TEXT DEFAULT 'all'
)
RETURNS TABLE(
  metric_kind TEXT, sample_size BIGINT,
  p50_seconds BIGINT, p75_seconds BIGINT, p90_seconds BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_analytics_authorize(p_scope_type, p_scope_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF (p_to - p_from) > 366 THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT u.metric_kind, COUNT(*)::BIGINT AS sample_size,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY u.duration_seconds)::BIGINT,
           PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY u.duration_seconds)::BIGINT,
           PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY u.duration_seconds)::BIGINT
    FROM public.introduction_analytics_durations u
    WHERE u.scope_type = p_scope_type
      AND (u.scope_id IS NOT DISTINCT FROM p_scope_id)
      AND u.metric_date BETWEEN p_from AND p_to
      AND u.path_depth = p_path_depth
      AND u.confidence_bucket = p_confidence
    GROUP BY u.metric_kind
    ORDER BY u.metric_kind;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_path_performance(
  p_scope_type TEXT, p_scope_id UUID, p_from DATE, p_to DATE,
  p_confidence TEXT DEFAULT 'all'
)
RETURNS TABLE(
  path_depth SMALLINT,
  requested_count BIGINT, accepted_count BIGINT, delivered_count BIGINT,
  acknowledged_count BIGINT, connected_count BIGINT, progressed_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_analytics_authorize(p_scope_type, p_scope_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF (p_to - p_from) > 366 THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT d.path_depth,
           SUM(d.requested_count)::BIGINT, SUM(d.accepted_count)::BIGINT,
           SUM(d.delivered_count)::BIGINT, SUM(d.acknowledged_count)::BIGINT,
           SUM(d.connected_count)::BIGINT, SUM(d.progressed_count)::BIGINT
    FROM public.introduction_analytics_daily d
    WHERE d.scope_type = p_scope_type
      AND (d.scope_id IS NOT DISTINCT FROM p_scope_id)
      AND d.metric_date BETWEEN p_from AND p_to
      AND d.path_depth IN (2,3)
      AND d.confidence_bucket = p_confidence
    GROUP BY d.path_depth
    ORDER BY d.path_depth;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_confidence_performance(
  p_scope_type TEXT, p_scope_id UUID, p_from DATE, p_to DATE,
  p_path_depth SMALLINT DEFAULT 0
)
RETURNS TABLE(
  confidence_bucket TEXT,
  requested_count BIGINT, accepted_count BIGINT, delivered_count BIGINT,
  acknowledged_count BIGINT, connected_count BIGINT, progressed_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.intro_analytics_authorize(p_scope_type, p_scope_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF (p_to - p_from) > 366 THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT d.confidence_bucket,
           SUM(d.requested_count)::BIGINT, SUM(d.accepted_count)::BIGINT,
           SUM(d.delivered_count)::BIGINT, SUM(d.acknowledged_count)::BIGINT,
           SUM(d.connected_count)::BIGINT, SUM(d.progressed_count)::BIGINT
    FROM public.introduction_analytics_daily d
    WHERE d.scope_type = p_scope_type
      AND (d.scope_id IS NOT DISTINCT FROM p_scope_id)
      AND d.metric_date BETWEEN p_from AND p_to
      AND d.path_depth = p_path_depth
      AND d.confidence_bucket IN ('low','medium','high')
    GROUP BY d.confidence_bucket
    ORDER BY d.confidence_bucket;
END;
$$;

CREATE OR REPLACE FUNCTION public.intro_analytics_intermediary_impact(
  p_from DATE, p_to DATE
)
RETURNS TABLE(
  requested_count BIGINT, accepted_count BIGINT, delivered_count BIGINT,
  acknowledged_count BIGINT, connected_count BIGINT, progressed_count BIGINT,
  median_deliver_seconds BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF (p_to - p_from) > 366 THEN RAISE EXCEPTION 'range_too_large' USING ERRCODE = '22023'; END IF;
  RETURN QUERY
    WITH counts AS (
      SELECT
        COALESCE(SUM(d.requested_count),0)::BIGINT AS requested_count,
        COALESCE(SUM(d.accepted_count),0)::BIGINT AS accepted_count,
        COALESCE(SUM(d.delivered_count),0)::BIGINT AS delivered_count,
        COALESCE(SUM(d.acknowledged_count),0)::BIGINT AS acknowledged_count,
        COALESCE(SUM(d.connected_count),0)::BIGINT AS connected_count,
        COALESCE(SUM(d.progressed_count),0)::BIGINT AS progressed_count
      FROM public.introduction_analytics_daily d
      WHERE d.scope_type = 'self_intermediary' AND d.scope_id = uid
        AND d.metric_date BETWEEN p_from AND p_to
        AND d.path_depth = 0 AND d.confidence_bucket = 'all'
    ),
    med AS (
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY u.duration_seconds)::BIGINT AS m
      FROM public.introduction_analytics_durations u
      WHERE u.scope_type = 'self_intermediary' AND u.scope_id = uid
        AND u.metric_date BETWEEN p_from AND p_to
        AND u.metric_kind = 'deliver'
        AND u.path_depth = 0 AND u.confidence_bucket = 'all'
    )
    SELECT c.requested_count, c.accepted_count, c.delivered_count,
           c.acknowledged_count, c.connected_count, c.progressed_count,
           COALESCE(med.m, 0)::BIGINT
    FROM counts c, med;
END;
$$;

GRANT EXECUTE ON FUNCTION public.intro_analytics_overview(TEXT,UUID,DATE,DATE,SMALLINT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_analytics_trend(TEXT,UUID,DATE,DATE,SMALLINT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_analytics_time_to_outcome(TEXT,UUID,DATE,DATE,SMALLINT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_analytics_path_performance(TEXT,UUID,DATE,DATE,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_analytics_confidence_performance(TEXT,UUID,DATE,DATE,SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_analytics_intermediary_impact(DATE,DATE) TO authenticated;

-- 7. BACKFILL --------------------------------------------------------------

DO $$
DECLARE r RECORD; scopes JSONB; depth SMALLINT; conf TEXT; secs INT;
BEGIN
  -- requests: requested + accepted
  FOR r IN SELECT * FROM public.introduction_requests LOOP
    scopes := public._intro_analytics_scopes(r.requester_user_id, r.intermediary_user_id);
    depth := public.intro_analytics_depth_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    conf := public.intro_analytics_confidence_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    PERFORM public._intro_analytics_bump(
      scopes, (r.created_at AT TIME ZONE 'UTC')::date, depth, conf, 'requested_count', 1);
    IF r.status IN ('accepted','delivered','acknowledged','completed','resolved','expired') AND r.responded_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump(
        scopes, (r.responded_at AT TIME ZONE 'UTC')::date, depth, conf, 'accepted_count', 1);
      secs := GREATEST(0, EXTRACT(EPOCH FROM (r.responded_at - r.created_at))::INT);
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (r.responded_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_accept_seconds', secs::BIGINT);
      PERFORM public._intro_analytics_add_duration(
        scopes, (r.responded_at AT TIME ZONE 'UTC')::date, depth, conf,
        'accept', secs, r.id);
    END IF;
  END LOOP;

  -- deliveries
  FOR r IN SELECT d.*, ir.path_snapshot, ir.responded_at AS req_responded_at
           FROM public.introduction_deliveries d
           JOIN public.introduction_requests ir ON ir.id = d.introduction_request_id LOOP
    scopes := public._intro_analytics_scopes(r.requester_user_id, r.intermediary_user_id);
    depth := public.intro_analytics_depth_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    conf := public.intro_analytics_confidence_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    IF r.delivered_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump(
        scopes, (r.delivered_at AT TIME ZONE 'UTC')::date, depth, conf, 'delivered_count', 1);
      IF r.req_responded_at IS NOT NULL THEN
        secs := GREATEST(0, EXTRACT(EPOCH FROM (r.delivered_at - r.req_responded_at))::INT);
        PERFORM public._intro_analytics_bump_seconds(
          scopes, (r.delivered_at AT TIME ZONE 'UTC')::date, depth, conf,
          'total_delivery_seconds', secs::BIGINT);
        PERFORM public._intro_analytics_add_duration(
          scopes, (r.delivered_at AT TIME ZONE 'UTC')::date, depth, conf,
          'deliver', secs, r.id);
      END IF;
    END IF;
    IF r.acknowledged_at IS NOT NULL AND r.delivered_at IS NOT NULL THEN
      PERFORM public._intro_analytics_bump(
        scopes, (r.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf, 'acknowledged_count', 1);
      secs := GREATEST(0, EXTRACT(EPOCH FROM (r.acknowledged_at - r.delivered_at))::INT);
      PERFORM public._intro_analytics_bump_seconds(
        scopes, (r.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf,
        'total_ack_seconds', secs::BIGINT);
      PERFORM public._intro_analytics_add_duration(
        scopes, (r.acknowledged_at AT TIME ZONE 'UTC')::date, depth, conf,
        'ack', secs, r.id);
    END IF;
  END LOOP;

  -- outcomes
  FOR r IN SELECT o.*, ir.path_snapshot
           FROM public.introduction_outcomes o
           JOIN public.introduction_requests ir ON ir.id = o.introduction_request_id
           WHERE o.status IN ('resolved','expired') LOOP
    scopes := public._intro_analytics_scopes(r.requester_user_id, r.intermediary_user_id);
    depth := public.intro_analytics_depth_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    conf := public.intro_analytics_confidence_from_snapshot(COALESCE(r.path_snapshot,'{}'::jsonb));
    IF r.status = 'expired' THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(r.resolved_at, r.updated_at) AT TIME ZONE 'UTC')::date, depth, conf, 'expired_count', 1);
    ELSIF r.outcome_type = 'connected' THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(r.resolved_at, r.updated_at) AT TIME ZONE 'UTC')::date, depth, conf, 'connected_count', 1);
      IF r.connection_observed_at IS NOT NULL AND r.acknowledged_at IS NOT NULL THEN
        secs := GREATEST(0, EXTRACT(EPOCH FROM (r.connection_observed_at - r.acknowledged_at))::INT);
        PERFORM public._intro_analytics_bump_seconds(
          scopes, (r.connection_observed_at AT TIME ZONE 'UTC')::date, depth, conf, 'total_connect_seconds', secs::BIGINT);
        PERFORM public._intro_analytics_add_duration(
          scopes, (r.connection_observed_at AT TIME ZONE 'UTC')::date, depth, conf, 'connect', secs, r.id);
      END IF;
    ELSIF r.outcome_type = 'progressed' THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(r.resolved_at, r.updated_at) AT TIME ZONE 'UTC')::date, depth, conf, 'progressed_count', 1);
      IF r.progressed_at IS NOT NULL AND r.acknowledged_at IS NOT NULL THEN
        secs := GREATEST(0, EXTRACT(EPOCH FROM (r.progressed_at - r.acknowledged_at))::INT);
        PERFORM public._intro_analytics_bump_seconds(
          scopes, (r.progressed_at AT TIME ZONE 'UTC')::date, depth, conf, 'total_progressed_seconds', secs::BIGINT);
        PERFORM public._intro_analytics_add_duration(
          scopes, (r.progressed_at AT TIME ZONE 'UTC')::date, depth, conf, 'progressed', secs, r.id);
      END IF;
    ELSIF r.outcome_type = 'not_connected' THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(r.resolved_at, r.updated_at) AT TIME ZONE 'UTC')::date, depth, conf, 'not_connected_count', 1);
    ELSIF r.outcome_type = 'closed_no_outcome' THEN
      PERFORM public._intro_analytics_bump(
        scopes, (COALESCE(r.resolved_at, r.updated_at) AT TIME ZONE 'UTC')::date, depth, conf, 'closed_no_outcome_count', 1);
    END IF;
  END LOOP;
END $$;
