CREATE TABLE public.reply_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  label_vi text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  subject_vi text,
  subject_en text,
  body_vi text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reply_templates_assoc ON public.reply_templates(association_id, priority);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reply_templates TO authenticated;
GRANT ALL ON public.reply_templates TO service_role;

ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read active templates in their association"
ON public.reply_templates FOR SELECT TO authenticated
USING (public.is_member_of(association_id) AND (is_active OR public.is_assoc_manager(association_id)));

CREATE POLICY "Assoc managers insert templates"
ON public.reply_templates FOR INSERT TO authenticated
WITH CHECK (public.is_assoc_manager(association_id));

CREATE POLICY "Assoc managers update templates"
ON public.reply_templates FOR UPDATE TO authenticated
USING (public.is_assoc_manager(association_id))
WITH CHECK (public.is_assoc_manager(association_id));

CREATE POLICY "Assoc managers delete templates"
ON public.reply_templates FOR DELETE TO authenticated
USING (public.is_assoc_manager(association_id));

CREATE TRIGGER update_reply_templates_updated_at
BEFORE UPDATE ON public.reply_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();