CREATE TABLE public.association_logo_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name text,
  old_logo_url text,
  new_logo_url text,
  action text NOT NULL DEFAULT 'change',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.association_logo_history TO authenticated;
GRANT ALL ON public.association_logo_history TO service_role;

ALTER TABLE public.association_logo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view logo history"
ON public.association_logo_history
FOR SELECT
TO authenticated
USING (public.is_member_of(association_id));

CREATE POLICY "Admins can add logo history"
ON public.association_logo_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_assoc_role(association_id, 'admin') AND changed_by = auth.uid());

CREATE INDEX idx_logo_history_assoc ON public.association_logo_history (association_id, created_at DESC);