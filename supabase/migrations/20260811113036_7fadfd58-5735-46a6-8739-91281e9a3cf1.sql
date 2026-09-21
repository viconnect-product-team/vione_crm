-- BC-RC1 (S2-01): the timeline-projection internal hook no longer accepts the
-- anon key (it now requires `Authorization: Bearer <TIMELINE_PROJECTION_CRON_SECRET>`,
-- fail-closed). Unschedule the pg_cron job that called it with the anon key —
-- leaving it scheduled would produce a 401 every minute.
-- Re-arming is a deployment requirement: configure pg_cron (or an external
-- scheduler) with the dedicated TIMELINE_PROJECTION_CRON_SECRET secret.
SELECT cron.unschedule('relationship_timeline_projection_minutely');