CREATE POLICY "Public can read product media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

CREATE POLICY "Authenticated can upload product media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Authenticated can update product media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-media');

CREATE POLICY "Authenticated can delete product media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-media');