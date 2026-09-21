-- profiles: restrict SELECT to owner or admin
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- event_registrations: prevent impersonation on insert
DROP POLICY IF EXISTS event_registrations_member_insert ON public.event_registrations;
CREATE POLICY event_registrations_member_insert ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (member_code = current_member_id());

-- products
DROP POLICY IF EXISTS products_member_insert ON public.products;
CREATE POLICY products_member_insert ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (seller_id = current_member_id());

-- opportunities
DROP POLICY IF EXISTS opportunities_member_insert ON public.opportunities;
CREATE POLICY opportunities_member_insert ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (poster_id = current_member_id());

-- reviews
DROP POLICY IF EXISTS reviews_member_insert ON public.reviews;
CREATE POLICY reviews_member_insert ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = current_member_id());

-- opportunity_interests
DROP POLICY IF EXISTS opportunity_interests_member_insert ON public.opportunity_interests;
CREATE POLICY opportunity_interests_member_insert ON public.opportunity_interests
  FOR INSERT TO authenticated
  WITH CHECK (member_id = current_member_id());

-- quote_requests
DROP POLICY IF EXISTS quote_requests_member_insert ON public.quote_requests;
CREATE POLICY quote_requests_member_insert ON public.quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = current_member_id());

-- messages
DROP POLICY IF EXISTS messages_member_insert ON public.messages;
CREATE POLICY messages_member_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (from_id = current_member_id());

-- connections
DROP POLICY IF EXISTS connections_member_insert ON public.connections;
CREATE POLICY connections_member_insert ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (peer_id = current_member_id());