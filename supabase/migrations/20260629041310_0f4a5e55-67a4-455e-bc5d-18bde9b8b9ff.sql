ALTER TABLE public.associations ADD COLUMN IF NOT EXISTS logo_url text;

DROP POLICY IF EXISTS "association_logos_member_read" ON storage.objects;
CREATE POLICY "association_logos_member_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'association-logos'
    AND public.is_member_of((split_part(name, '/', 1))::uuid)
  );

DROP POLICY IF EXISTS "association_logos_admin_insert" ON storage.objects;
CREATE POLICY "association_logos_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'association-logos'
    AND public.has_assoc_role((split_part(name, '/', 1))::uuid, 'admin'::app_role)
  );

DROP POLICY IF EXISTS "association_logos_admin_update" ON storage.objects;
CREATE POLICY "association_logos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'association-logos'
    AND public.has_assoc_role((split_part(name, '/', 1))::uuid, 'admin'::app_role)
  );

DROP POLICY IF EXISTS "association_logos_admin_delete" ON storage.objects;
CREATE POLICY "association_logos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'association-logos'
    AND public.has_assoc_role((split_part(name, '/', 1))::uuid, 'admin'::app_role)
  );