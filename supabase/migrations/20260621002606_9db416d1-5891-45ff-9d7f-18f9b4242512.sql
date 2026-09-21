
-- PRODUCTS
DROP POLICY IF EXISTS products_member_update ON public.products;
CREATE POLICY products_member_update ON public.products
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR seller_id = current_member_id());

DROP POLICY IF EXISTS products_member_delete ON public.products;
CREATE POLICY products_member_delete ON public.products
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR seller_id = current_member_id());

-- REVIEWS
DROP POLICY IF EXISTS reviews_member_update ON public.reviews;
CREATE POLICY reviews_member_update ON public.reviews
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR reviewer_id = current_member_id());

DROP POLICY IF EXISTS reviews_member_delete ON public.reviews;
CREATE POLICY reviews_member_delete ON public.reviews
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR reviewer_id = current_member_id());

-- OPPORTUNITIES
DROP POLICY IF EXISTS opportunities_member_update ON public.opportunities;
CREATE POLICY opportunities_member_update ON public.opportunities
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR poster_id = current_member_id());

DROP POLICY IF EXISTS opportunities_member_delete ON public.opportunities;
CREATE POLICY opportunities_member_delete ON public.opportunities
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR poster_id = current_member_id());

-- CONNECTIONS (single party: peer_id)
DROP POLICY IF EXISTS connections_member_update ON public.connections;
CREATE POLICY connections_member_update ON public.connections
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR peer_id = current_member_id());

DROP POLICY IF EXISTS connections_member_delete ON public.connections;
CREATE POLICY connections_member_delete ON public.connections
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR is_platform_admin() OR peer_id = current_member_id());
