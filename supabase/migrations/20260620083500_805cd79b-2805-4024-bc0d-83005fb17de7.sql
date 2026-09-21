-- ============ MULTI-TENANT PHASE 1: associations + memberships ============

-- 1. associations table
CREATE TABLE public.associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.associations TO authenticated;
GRANT ALL ON public.associations TO service_role;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_associations_updated_at
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. memberships table (user <-> association <-> role)
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, association_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_member_of(_association_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND association_id = _association_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_assoc_role(_association_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND association_id = _association_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_association_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT association_id FROM public.memberships
  WHERE user_id = auth.uid()
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1;
$$;

-- 4. RLS for associations / memberships
CREATE POLICY associations_select_members ON public.associations
  FOR SELECT TO authenticated USING (public.is_member_of(id));
CREATE POLICY associations_admin_update ON public.associations
  FOR UPDATE TO authenticated USING (public.has_assoc_role(id, 'admin'))
  WITH CHECK (public.has_assoc_role(id, 'admin'));

CREATE POLICY memberships_select_self ON public.memberships
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_assoc_role(association_id, 'admin'));
CREATE POLICY memberships_admin_insert ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY memberships_admin_update ON public.memberships
  FOR UPDATE TO authenticated USING (public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY memberships_admin_delete ON public.memberships
  FOR DELETE TO authenticated USING (public.has_assoc_role(association_id, 'admin'));

-- 5. Seed a default association and backfill existing users into it
DO $$
DECLARE _assoc uuid;
BEGIN
  INSERT INTO public.associations (name, slug) VALUES ('Hiệp hội mặc định', 'default')
  RETURNING id INTO _assoc;

  -- migrate every existing user_roles entry into memberships of the default association
  INSERT INTO public.memberships (user_id, association_id, role, is_default)
  SELECT ur.user_id, _assoc, ur.role, true
  FROM public.user_roles ur
  ON CONFLICT (user_id, association_id) DO NOTHING;

  -- 6. add association_id to first business-table group, backfill, enforce NOT NULL
  ALTER TABLE public.members ADD COLUMN association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE;
  ALTER TABLE public.events  ADD COLUMN association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE;
  ALTER TABLE public.news    ADD COLUMN association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE;

  UPDATE public.members SET association_id = _assoc WHERE association_id IS NULL;
  UPDATE public.events  SET association_id = _assoc WHERE association_id IS NULL;
  UPDATE public.news    SET association_id = _assoc WHERE association_id IS NULL;
END $$;

ALTER TABLE public.members ALTER COLUMN association_id SET NOT NULL;
ALTER TABLE public.events  ALTER COLUMN association_id SET NOT NULL;
ALTER TABLE public.news    ALTER COLUMN association_id SET NOT NULL;

ALTER TABLE public.members ALTER COLUMN association_id SET DEFAULT public.current_association_id();
ALTER TABLE public.events  ALTER COLUMN association_id SET DEFAULT public.current_association_id();
ALTER TABLE public.news    ALTER COLUMN association_id SET DEFAULT public.current_association_id();

CREATE INDEX idx_members_association ON public.members(association_id);
CREATE INDEX idx_events_association  ON public.events(association_id);
CREATE INDEX idx_news_association    ON public.news(association_id);

-- 7. Replace RLS on the first group to scope by association
DROP POLICY members_select_auth   ON public.members;
DROP POLICY members_admin_insert  ON public.members;
DROP POLICY members_admin_update  ON public.members;
DROP POLICY members_admin_delete  ON public.members;

CREATE POLICY members_select_assoc ON public.members
  FOR SELECT TO authenticated USING (public.is_member_of(association_id));
CREATE POLICY members_admin_insert ON public.members
  FOR INSERT TO authenticated WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY members_admin_update ON public.members
  FOR UPDATE TO authenticated USING (public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY members_admin_delete ON public.members
  FOR DELETE TO authenticated USING (public.has_assoc_role(association_id, 'admin'));

DROP POLICY events_select_auth   ON public.events;
DROP POLICY events_admin_insert  ON public.events;
DROP POLICY events_admin_update  ON public.events;
DROP POLICY events_admin_delete  ON public.events;

CREATE POLICY events_select_assoc ON public.events
  FOR SELECT TO authenticated USING (public.is_member_of(association_id));
CREATE POLICY events_admin_insert ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY events_admin_update ON public.events
  FOR UPDATE TO authenticated USING (public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY events_admin_delete ON public.events
  FOR DELETE TO authenticated USING (public.has_assoc_role(association_id, 'admin'));

DROP POLICY news_select_auth   ON public.news;
DROP POLICY news_admin_insert  ON public.news;
DROP POLICY news_admin_update  ON public.news;
DROP POLICY news_admin_delete  ON public.news;

CREATE POLICY news_select_assoc ON public.news
  FOR SELECT TO authenticated USING (public.is_member_of(association_id));
CREATE POLICY news_admin_insert ON public.news
  FOR INSERT TO authenticated WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY news_admin_update ON public.news
  FOR UPDATE TO authenticated USING (public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.has_assoc_role(association_id, 'admin'));
CREATE POLICY news_admin_delete ON public.news
  FOR DELETE TO authenticated USING (public.has_assoc_role(association_id, 'admin'));

-- 8. Keep new signups joining the default association as members
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _is_first boolean; _assoc uuid; _role app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO _is_first;
  _role := CASE WHEN _is_first THEN 'admin'::app_role ELSE 'member'::app_role END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  SELECT id INTO _assoc FROM public.associations WHERE slug = 'default' LIMIT 1;
  IF _assoc IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, association_id, role, is_default)
    VALUES (NEW.id, _assoc, _role, true)
    ON CONFLICT (user_id, association_id) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;