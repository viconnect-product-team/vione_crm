CREATE TABLE public.events (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL,
  location text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 0,
  registered integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  type text NOT NULL DEFAULT 'forum',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_registrations (
  id text NOT NULL PRIMARY KEY,
  event_id text NOT NULL,
  member_code text NOT NULL,
  member_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  registered_at date NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'confirmed',
  ticket_type text NOT NULL DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage registrations" ON public.event_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();