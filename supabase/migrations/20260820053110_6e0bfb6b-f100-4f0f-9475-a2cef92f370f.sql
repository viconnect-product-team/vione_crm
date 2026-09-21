CREATE TABLE public.bc_customer_needs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.bc_customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pain','need')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bc_customer_needs_customer_idx ON public.bc_customer_needs (owner_user_id, customer_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_customer_needs TO authenticated;
GRANT ALL ON public.bc_customer_needs TO service_role;

ALTER TABLE public.bc_customer_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bc_customer_needs_owner_all" ON public.bc_customer_needs
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE TRIGGER bc_customer_needs_touch
  BEFORE UPDATE ON public.bc_customer_needs
  FOR EACH ROW EXECUTE FUNCTION public.bc5a_touch_updated_at();