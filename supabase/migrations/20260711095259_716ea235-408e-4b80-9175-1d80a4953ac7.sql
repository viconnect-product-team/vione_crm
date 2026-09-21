ALTER TABLE public.member_business_cards
  ADD COLUMN card_kind text NOT NULL DEFAULT 'primary',
  ADD COLUMN status text NOT NULL DEFAULT 'draft',
  ADD COLUMN public_mode text NOT NULL DEFAULT 'members_only',
  ADD COLUMN display_name text,
  ADD COLUMN professional_title text,
  ADD COLUMN company_id uuid,
  ADD COLUMN company_name text,
  ADD COLUMN company_logo_url text,
  ADD COLUMN avatar_url text,
  ADD COLUMN cover_url text,
  ADD COLUMN headline text,
  ADD COLUMN bio text,
  ADD COLUMN website text,
  ADD COLUMN work_email text,
  ADD COLUMN work_phone text,
  ADD COLUMN zalo_url text,
  ADD COLUMN linkedin_url text,
  ADD COLUMN facebook_url text,
  ADD COLUMN youtube_url text,
  ADD COLUMN tiktok_url text,
  ADD COLUMN address text,
  ADD COLUMN map_url text,
  ADD COLUMN theme_id text DEFAULT 'executive',
  ADD COLUMN custom_brand_color text,
  ADD COLUMN branding_settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN visibility_settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN cta_settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN seo_settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN published_at timestamptz,
  ADD COLUMN last_viewed_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX member_business_cards_one_primary
  ON public.member_business_cards (member_id, association_id)
  WHERE card_kind = 'primary';
CREATE INDEX member_business_cards_assoc_idx ON public.member_business_cards (association_id);

CREATE POLICY "Manager reads assoc cards" ON public.member_business_cards
  FOR SELECT TO authenticated USING (public.is_assoc_manager(association_id));
CREATE POLICY "Owner inserts own card" ON public.member_business_cards
  FOR INSERT TO authenticated
  WITH CHECK (member_id = public.current_member_id() AND association_id = public.current_association_id());
CREATE POLICY "Owner updates own card" ON public.member_business_cards
  FOR UPDATE TO authenticated
  USING (member_id = public.current_member_id())
  WITH CHECK (member_id = public.current_member_id());
CREATE POLICY "Manager moderates assoc cards" ON public.member_business_cards
  FOR UPDATE TO authenticated
  USING (public.is_assoc_manager(association_id))
  WITH CHECK (public.is_assoc_manager(association_id));
CREATE POLICY "Owner deletes own card" ON public.member_business_cards
  FOR DELETE TO authenticated USING (member_id = public.current_member_id());

CREATE TRIGGER trg_business_card_updated
  BEFORE UPDATE ON public.member_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();