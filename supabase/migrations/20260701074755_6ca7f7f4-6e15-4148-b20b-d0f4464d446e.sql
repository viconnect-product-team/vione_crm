
ALTER TABLE public.card_settings
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_address boolean NOT NULL DEFAULT false;

-- Scope sensitive SELECT policies to authenticated role only (was public).
ALTER POLICY attendees_select_assoc ON public.attendees TO authenticated;
ALTER POLICY event_registrations_select_assoc ON public.event_registrations TO authenticated;
ALTER POLICY opportunity_interests_select_assoc ON public.opportunity_interests TO authenticated;
ALTER POLICY sponsors_select_assoc ON public.sponsors TO authenticated;

-- Fix product-media read policy: join on the object path, not the member name column.
DROP POLICY IF EXISTS "Authenticated can read product media" ON storage.objects;
CREATE POLICY "Authenticated can read product media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-media'
  AND (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = (storage.foldername(storage.objects.name))[1]
        AND is_member_of(m.association_id)
    )
  )
);
