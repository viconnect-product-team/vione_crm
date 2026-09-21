ALTER TABLE public.attendees REPLICA IDENTITY FULL;
ALTER TABLE public.checkin_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendees;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checkin_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_logs;
  END IF;
END $$;