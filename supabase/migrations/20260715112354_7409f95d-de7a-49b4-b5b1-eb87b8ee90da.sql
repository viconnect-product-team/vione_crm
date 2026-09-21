-- BC-7.5B.1 — Timeline Projection Scheduler Activation
-- Idempotent pg_cron registration for the Relationship Timeline projection consumer.
-- No schema changes. No new secrets. Reuses the existing anon-apikey pattern.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_job_name   text := 'relationship_timeline_projection_minutely';
  v_endpoint   text := 'https://project--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app/api/public/hooks/timeline-projection';
  v_anon_key   text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGJyenZxeXllZ2t0aHR6Z2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTI4ODAsImV4cCI6MjA5NjUyODg4MH0.OVvzoBFFORuc7eVpK4cko-_VSZg0MwvsrOFQ_G2880s';
  v_command    text;
BEGIN
  -- Guard: unschedule any prior registration with the same name (idempotent).
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job_name) THEN
    PERFORM cron.unschedule(v_job_name);
  END IF;

  v_command := format(
    $cmd$SELECT net.http_post(
      url     := %L,
      headers := %L::jsonb,
      body    := %L::jsonb
    );$cmd$,
    v_endpoint,
    json_build_object(
      'Content-Type', 'application/json',
      'apikey',       v_anon_key
    )::text,
    '{"batch":100}'
  );

  PERFORM cron.schedule(v_job_name, '* * * * *', v_command);
END; $$;
