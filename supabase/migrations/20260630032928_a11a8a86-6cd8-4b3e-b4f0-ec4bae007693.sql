-- attendees: restrict phone visibility to admins/platform admins
DROP POLICY IF EXISTS attendees_select_assoc ON public.attendees;
CREATE POLICY attendees_select_assoc ON public.attendees
FOR SELECT USING (
  has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin()
);

-- event_registrations: restrict to admins or own registration
DROP POLICY IF EXISTS event_registrations_select_assoc ON public.event_registrations;
CREATE POLICY event_registrations_select_assoc ON public.event_registrations
FOR SELECT USING (
  has_assoc_role(association_id, 'admin'::app_role)
  OR is_platform_admin()
  OR member_code = current_member_id()
);

-- opportunity_interests: restrict to submitter, opportunity poster, admins
DROP POLICY IF EXISTS opportunity_interests_select_assoc ON public.opportunity_interests;
CREATE POLICY opportunity_interests_select_assoc ON public.opportunity_interests
FOR SELECT USING (
  has_assoc_role(association_id, 'admin'::app_role)
  OR is_platform_admin()
  OR member_id = current_member_id()
  OR EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_interests.opportunity_id
      AND o.poster_id = current_member_id()
  )
);

-- sponsors: restrict full row (with contact details) to admins/platform admins
DROP POLICY IF EXISTS sponsors_select_assoc ON public.sponsors;
CREATE POLICY sponsors_select_assoc ON public.sponsors
FOR SELECT USING (
  has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin()
);

-- product-media storage: restrict reads to same-association members
DROP POLICY IF EXISTS "Authenticated can read product media" ON storage.objects;
CREATE POLICY "Authenticated can read product media" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'product-media'
  AND (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = (storage.foldername(name))[1]
        AND is_member_of(m.association_id)
    )
  )
);