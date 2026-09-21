CREATE TABLE public.sync_rate_limits (
  ip text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.sync_rate_limits TO service_role;

ALTER TABLE public.sync_rate_limits ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: this table is only touched by the
-- SECURITY DEFINER function below, invoked via the service role.

CREATE OR REPLACE FUNCTION public.check_and_increment_sync_rate(
  _ip text,
  _max integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _count integer;
BEGIN
  INSERT INTO public.sync_rate_limits (ip, window_start, count, updated_at)
  VALUES (_ip, _now, 1, _now)
  ON CONFLICT (ip) DO UPDATE SET
    count = CASE
      WHEN public.sync_rate_limits.window_start < _now - make_interval(secs => _window_seconds)
        THEN 1
      ELSE public.sync_rate_limits.count + 1
    END,
    window_start = CASE
      WHEN public.sync_rate_limits.window_start < _now - make_interval(secs => _window_seconds)
        THEN _now
      ELSE public.sync_rate_limits.window_start
    END,
    updated_at = _now
  RETURNING count INTO _count;

  RETURN _count <= _max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_sync_rate(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_sync_rate(text, integer, integer) TO service_role;