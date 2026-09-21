CREATE TABLE public.sponsors (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'bronze',
  contact text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  amount bigint NOT NULL DEFAULT 0,
  events integer NOT NULL DEFAULT 0,
  since date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage sponsors" ON public.sponsors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sponsor_packages (
  id text NOT NULL PRIMARY KEY,
  tier text NOT NULL DEFAULT 'bronze',
  price bigint NOT NULL DEFAULT 0,
  benefits text[] NOT NULL DEFAULT '{}',
  available integer NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsor_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_packages TO authenticated;
GRANT ALL ON public.sponsor_packages TO service_role;

ALTER TABLE public.sponsor_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sponsor_packages" ON public.sponsor_packages FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage sponsor_packages" ON public.sponsor_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_sponsor_packages_updated_at BEFORE UPDATE ON public.sponsor_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();