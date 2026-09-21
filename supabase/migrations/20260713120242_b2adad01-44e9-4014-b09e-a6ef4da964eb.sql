
-- ========== companies ==========
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  cover_url text,
  industry text,
  size text,
  country text,
  city text,
  website text,
  email text,
  phone text,
  description text,
  verified boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX idx_companies_slug ON public.companies(slug);

GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_company_members_user ON public.company_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;

-- ========== helpers ==========
CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.owner_user_id = auth.uid()
  ) OR public.is_platform_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = _company_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  ) OR public.owns_company(_company_id);
$$;

CREATE OR REPLACE FUNCTION public.is_company_manager(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = _company_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner','admin')
  ) OR public.owns_company(_company_id);
$$;

-- ========== companies RLS ==========
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public active companies"
  ON public.companies FOR SELECT TO anon
  USING (visibility = 'public' AND status = 'active');

CREATE POLICY "Members and public can view companies"
  ON public.companies FOR SELECT TO authenticated
  USING (
    (visibility = 'public' AND status = 'active')
    OR public.is_company_member(id)
  );

CREATE POLICY "Owner can insert companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can update companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.owns_company(id))
  WITH CHECK (public.owns_company(id));

CREATE POLICY "Owner can delete companies"
  ON public.companies FOR DELETE TO authenticated
  USING (public.owns_company(id));

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_company()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.visibility NOT IN ('public','members_only','private') THEN
    RAISE EXCEPTION 'Invalid company visibility: %', NEW.visibility;
  END IF;
  IF NEW.status NOT IN ('draft','active','suspended','archived') THEN
    RAISE EXCEPTION 'Invalid company status: %', NEW.status;
  END IF;
  NEW.slug := trim(both '-' from lower(regexp_replace(coalesce(NEW.slug,''), '[^a-zA-Z0-9-]+', '-', 'g')));
  IF NEW.slug = '' THEN RAISE EXCEPTION 'Company slug cannot be empty'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER validate_company_trg
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company();

-- ========== company_members RLS ==========
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company roster"
  ON public.company_members FOR SELECT TO authenticated
  USING (public.is_company_member(company_id) OR user_id = auth.uid());

CREATE POLICY "Managers can add members"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (public.is_company_manager(company_id));

CREATE POLICY "Managers can update members"
  ON public.company_members FOR UPDATE TO authenticated
  USING (public.is_company_manager(company_id))
  WITH CHECK (public.is_company_manager(company_id));

CREATE POLICY "Managers can remove members"
  ON public.company_members FOR DELETE TO authenticated
  USING (public.is_company_manager(company_id));

CREATE TRIGGER update_company_members_updated_at
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_company_member()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role NOT IN ('owner','admin','manager','member','viewer') THEN
    RAISE EXCEPTION 'Invalid company member role: %', NEW.role;
  END IF;
  IF NEW.status NOT IN ('active','invited') THEN
    RAISE EXCEPTION 'Invalid company member status: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER validate_company_member_trg
  BEFORE INSERT OR UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_member();

-- ========== optional company references (additive) ==========
ALTER TABLE public.saved_business_cards
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.business_interactions
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
