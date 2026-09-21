CREATE TABLE public.members (
  id text PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  type text NOT NULL,
  level text NOT NULL,
  industry text NOT NULL,
  region text NOT NULL,
  status text NOT NULL,
  joined_at date NOT NULL,
  fee_year int NOT NULL,
  fee_paid boolean NOT NULL DEFAULT false,
  address text NOT NULL DEFAULT '',
  website text,
  tax_code text,
  employees int,
  about text NOT NULL DEFAULT '',
  term_end date,
  reminder_count int NOT NULL DEFAULT 0,
  last_reminder date,
  renewed_at date,
  new_term_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.members TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();