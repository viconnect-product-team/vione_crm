
-- Helper: map current auth user to their member id (text code like 'vba-0002')
CREATE OR REPLACE FUNCTION public.current_member_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.members WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM anon;

-- ============ MEMBERS (PII) ============
DROP POLICY IF EXISTS members_select_assoc ON public.members;
CREATE POLICY members_select_assoc ON public.members
FOR SELECT TO authenticated
USING (
  has_assoc_role(association_id, 'admin'::app_role)
  OR is_platform_admin()
  OR user_id = auth.uid()
);

-- ============ INVOICES ============
DROP POLICY IF EXISTS invoices_select_auth ON public.invoices;
CREATE POLICY invoices_select_auth ON public.invoices
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR member_id = current_member_id()
);

-- ============ TRANSACTIONS (admin only) ============
DROP POLICY IF EXISTS transactions_select_auth ON public.transactions;
CREATE POLICY transactions_select_auth ON public.transactions
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ SPONSORS (admin only) ============
DROP POLICY IF EXISTS sponsors_select_auth ON public.sponsors;
CREATE POLICY sponsors_select_auth ON public.sponsors
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ ACTIVITY LOG (admin only) ============
DROP POLICY IF EXISTS activity_log_select_auth ON public.activity_log;
CREATE POLICY activity_log_select_auth ON public.activity_log
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ INVOICE REMINDERS (admin only) ============
DROP POLICY IF EXISTS invoice_reminders_select_auth ON public.invoice_reminders;
CREATE POLICY invoice_reminders_select_auth ON public.invoice_reminders
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ ATTENDEES (admin only) ============
DROP POLICY IF EXISTS attendees_select_auth ON public.attendees;
CREATE POLICY attendees_select_auth ON public.attendees
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ EVENT REGISTRATIONS ============
DROP POLICY IF EXISTS event_registrations_select_auth ON public.event_registrations;
CREATE POLICY event_registrations_select_auth ON public.event_registrations
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

DROP POLICY IF EXISTS event_registrations_member_update ON public.event_registrations;
CREATE POLICY event_registrations_member_update ON public.event_registrations
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

DROP POLICY IF EXISTS event_registrations_member_delete ON public.event_registrations;
CREATE POLICY event_registrations_member_delete ON public.event_registrations
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- ============ MESSAGES (scope to sender/recipient) ============
DROP POLICY IF EXISTS messages_select_auth ON public.messages;
CREATE POLICY messages_select_auth ON public.messages
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR from_id = current_member_id()
  OR to_id = current_member_id()
);

DROP POLICY IF EXISTS messages_member_update ON public.messages;
CREATE POLICY messages_member_update ON public.messages
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR from_id = current_member_id()
  OR to_id = current_member_id()
);

DROP POLICY IF EXISTS messages_member_delete ON public.messages;
CREATE POLICY messages_member_delete ON public.messages
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR from_id = current_member_id()
);

-- ============ QUOTE REQUESTS (buyer or product seller) ============
DROP POLICY IF EXISTS quote_requests_select_auth ON public.quote_requests;
CREATE POLICY quote_requests_select_auth ON public.quote_requests
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR buyer_id = current_member_id()
  OR EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = quote_requests.product_id AND p.seller_id = current_member_id()
  )
);

DROP POLICY IF EXISTS quote_requests_member_update ON public.quote_requests;
CREATE POLICY quote_requests_member_update ON public.quote_requests
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR buyer_id = current_member_id()
  OR EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = quote_requests.product_id AND p.seller_id = current_member_id()
  )
);

DROP POLICY IF EXISTS quote_requests_member_delete ON public.quote_requests;
CREATE POLICY quote_requests_member_delete ON public.quote_requests
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR buyer_id = current_member_id()
);

-- ============ OPPORTUNITY INTERESTS (submitter or opportunity poster) ============
DROP POLICY IF EXISTS opportunity_interests_select_auth ON public.opportunity_interests;
CREATE POLICY opportunity_interests_select_auth ON public.opportunity_interests
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR member_id = current_member_id()
  OR EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_interests.opportunity_id AND o.poster_id = current_member_id()
  )
);

DROP POLICY IF EXISTS opportunity_interests_member_update ON public.opportunity_interests;
CREATE POLICY opportunity_interests_member_update ON public.opportunity_interests
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR member_id = current_member_id()
);

DROP POLICY IF EXISTS opportunity_interests_member_delete ON public.opportunity_interests;
CREATE POLICY opportunity_interests_member_delete ON public.opportunity_interests
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_platform_admin()
  OR member_id = current_member_id()
);

-- ============ MEMBER CHECKINS (no policies existed) ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_checkins TO authenticated;
GRANT ALL ON public.member_checkins TO service_role;

DROP POLICY IF EXISTS member_checkins_select_admin ON public.member_checkins;
CREATE POLICY member_checkins_select_admin ON public.member_checkins
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

DROP POLICY IF EXISTS member_checkins_insert_auth ON public.member_checkins;
CREATE POLICY member_checkins_insert_auth ON public.member_checkins
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS member_checkins_update_admin ON public.member_checkins;
CREATE POLICY member_checkins_update_admin ON public.member_checkins
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

DROP POLICY IF EXISTS member_checkins_delete_admin ON public.member_checkins;
CREATE POLICY member_checkins_delete_admin ON public.member_checkins
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());
