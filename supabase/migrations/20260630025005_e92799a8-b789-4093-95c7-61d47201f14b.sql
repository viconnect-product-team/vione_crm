
-- 1. messages: drop realtime override policies (scoped policies already exist)
DROP POLICY IF EXISTS authenticated_can_use_realtime ON public.messages;
DROP POLICY IF EXISTS authenticated_can_send_realtime ON public.messages;

-- 2. realtime.messages: drop open broadcast policies
DROP POLICY IF EXISTS authenticated_can_use_realtime ON realtime.messages;
DROP POLICY IF EXISTS authenticated_can_send_realtime ON realtime.messages;

-- 3. opportunity_interests: require member ownership on insert
DROP POLICY IF EXISTS opportunity_interests_member_insert ON public.opportunity_interests;
CREATE POLICY opportunity_interests_member_insert ON public.opportunity_interests
  FOR INSERT TO authenticated
  WITH CHECK (association_id = current_association_id() AND member_id = current_member_id());

-- 4. quote_requests: restrict select to admins, buyer, and product seller
DROP POLICY IF EXISTS quote_requests_select_assoc ON public.quote_requests;
CREATE POLICY quote_requests_select_assoc ON public.quote_requests
  FOR SELECT TO authenticated
  USING (
    is_platform_admin()
    OR has_assoc_role(association_id, 'admin'::app_role)
    OR buyer_id = current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = quote_requests.product_id
        AND p.seller_id = current_member_id()
    )
  );

-- 5. product-media storage: ownership-scoped writes, authenticated reads
DROP POLICY IF EXISTS "Public can read product media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product media" ON storage.objects;

CREATE POLICY "Authenticated can read product media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-media');

CREATE POLICY "Members can upload own product media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-media'
    AND (storage.foldername(name))[1] = current_member_id()
  );

CREATE POLICY "Members can update own product media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-media'
    AND (storage.foldername(name))[1] = current_member_id()
  )
  WITH CHECK (
    bucket_id = 'product-media'
    AND (storage.foldername(name))[1] = current_member_id()
  );

CREATE POLICY "Members can delete own product media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-media'
    AND (storage.foldername(name))[1] = current_member_id()
  );

-- 6. Revoke public/anon execute on internal security-definer functions
REVOKE EXECUTE ON FUNCTION public.add_member_notification(text, uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.net_decline_request(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.net_decline_request(text) TO authenticated;
