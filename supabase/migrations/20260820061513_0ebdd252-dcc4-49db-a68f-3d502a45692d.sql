CREATE TABLE public.bc_customer_tag_suggestion_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.bc_customers(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.bc_customer_tag_suggestion_runs(id) ON DELETE SET NULL,
  tag_name TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('good','bad')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, customer_id, tag_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_customer_tag_suggestion_feedback TO authenticated;
GRANT ALL ON public.bc_customer_tag_suggestion_feedback TO service_role;
ALTER TABLE public.bc_customer_tag_suggestion_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc_tag_suggestion_feedback_owner" ON public.bc_customer_tag_suggestion_feedback
  FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);