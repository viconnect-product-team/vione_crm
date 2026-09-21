CREATE TABLE IF NOT EXISTS public.community_invite_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('vi','en')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (association_id, locale)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_invite_templates TO authenticated;
GRANT ALL ON public.community_invite_templates TO service_role;

ALTER TABLE public.community_invite_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cit_select_members" ON public.community_invite_templates;
CREATE POLICY "cit_select_members" ON public.community_invite_templates
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.memberships m WHERE m.association_id = community_invite_templates.association_id AND m.user_id = auth.uid()));

DROP POLICY IF EXISTS "cit_write_admins" ON public.community_invite_templates;
CREATE POLICY "cit_write_admins" ON public.community_invite_templates
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.memberships m WHERE m.association_id = community_invite_templates.association_id AND m.user_id = auth.uid() AND m.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.memberships m WHERE m.association_id = community_invite_templates.association_id AND m.user_id = auth.uid() AND m.role = 'admin'));

CREATE TRIGGER cit_set_updated_at BEFORE UPDATE ON public.community_invite_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_invitations
  ADD COLUMN IF NOT EXISTS locale TEXT,
  ADD COLUMN IF NOT EXISTS email_subject TEXT,
  ADD COLUMN IF NOT EXISTS email_body TEXT;