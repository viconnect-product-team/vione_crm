CREATE TABLE public.bc_customer_tag_suggestion_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.bc_customers(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.bc_customer_tag_suggestion_runs TO authenticated;
GRANT ALL ON public.bc_customer_tag_suggestion_runs TO service_role;
ALTER TABLE public.bc_customer_tag_suggestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc_tag_suggestion_runs_owner" ON public.bc_customer_tag_suggestion_runs
  FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE INDEX bc_tag_suggestion_runs_customer_idx ON public.bc_customer_tag_suggestion_runs (owner_user_id, customer_id, created_at DESC);