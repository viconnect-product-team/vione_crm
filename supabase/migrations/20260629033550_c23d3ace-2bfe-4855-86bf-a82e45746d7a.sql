-- ============================================================
-- Multi-tenant: add association_id + association-scoped RLS
-- to all business tables. Tables are empty so no backfill needed.
-- ============================================================

-- Helper expressions used below:
--   admin of association OR platform admin  -> write/admin access
--   member of association OR platform admin -> view access

-- ---------- Add association_id columns ----------
ALTER TABLE public.invoices            ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.documents           ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.transactions        ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.votes               ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.meetings            ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.sponsors            ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.sponsor_packages    ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.perks               ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.email_campaigns     ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.notifications       ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.activity_log        ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.attendees           ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.member_checkins     ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.checkin_logs        ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.products            ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.opportunities       ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.opportunity_interests ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.reviews             ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.quote_requests      ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.connections         ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();
ALTER TABLE public.messages            ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id) NOT NULL DEFAULT current_association_id();

-- ============================================================
-- ADMIN-ONLY SENSITIVE TABLES
-- (view: assoc admin or platform admin; invoices also member self)
-- ============================================================

-- invoices
DROP POLICY IF EXISTS invoices_select_auth   ON public.invoices;
DROP POLICY IF EXISTS invoices_admin_insert  ON public.invoices;
DROP POLICY IF EXISTS invoices_admin_update  ON public.invoices;
DROP POLICY IF EXISTS invoices_admin_delete  ON public.invoices;
CREATE POLICY invoices_select_assoc ON public.invoices FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR member_id = current_member_id());
CREATE POLICY invoices_admin_insert ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY invoices_admin_update ON public.invoices FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY invoices_admin_delete ON public.invoices FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- documents
DROP POLICY IF EXISTS documents_select_auth  ON public.documents;
DROP POLICY IF EXISTS documents_admin_insert ON public.documents;
DROP POLICY IF EXISTS documents_admin_update ON public.documents;
DROP POLICY IF EXISTS documents_admin_delete ON public.documents;
CREATE POLICY documents_select_assoc ON public.documents FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY documents_admin_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY documents_admin_update ON public.documents FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY documents_admin_delete ON public.documents FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- transactions
DROP POLICY IF EXISTS transactions_select_auth  ON public.transactions;
DROP POLICY IF EXISTS transactions_admin_insert ON public.transactions;
DROP POLICY IF EXISTS transactions_admin_update ON public.transactions;
DROP POLICY IF EXISTS transactions_admin_delete ON public.transactions;
CREATE POLICY transactions_select_assoc ON public.transactions FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY transactions_admin_insert ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY transactions_admin_update ON public.transactions FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY transactions_admin_delete ON public.transactions FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- email_campaigns
DROP POLICY IF EXISTS email_campaigns_admin_select ON public.email_campaigns;
DROP POLICY IF EXISTS email_campaigns_admin_insert ON public.email_campaigns;
DROP POLICY IF EXISTS email_campaigns_admin_update ON public.email_campaigns;
DROP POLICY IF EXISTS email_campaigns_admin_delete ON public.email_campaigns;
CREATE POLICY email_campaigns_admin_select ON public.email_campaigns FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY email_campaigns_admin_insert ON public.email_campaigns FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY email_campaigns_admin_update ON public.email_campaigns FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY email_campaigns_admin_delete ON public.email_campaigns FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- notifications
DROP POLICY IF EXISTS notifications_member_sent_select ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_select ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_update ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_delete ON public.notifications;
CREATE POLICY notifications_admin_select ON public.notifications FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY notifications_admin_update ON public.notifications FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY notifications_admin_delete ON public.notifications FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- activity_log
DROP POLICY IF EXISTS activity_log_select_auth  ON public.activity_log;
DROP POLICY IF EXISTS activity_log_admin_insert ON public.activity_log;
DROP POLICY IF EXISTS activity_log_admin_update ON public.activity_log;
DROP POLICY IF EXISTS activity_log_admin_delete ON public.activity_log;
CREATE POLICY activity_log_select_assoc ON public.activity_log FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY activity_log_admin_insert ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY activity_log_admin_update ON public.activity_log FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY activity_log_admin_delete ON public.activity_log FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- ============================================================
-- MEMBER-VIEWABLE ADMIN-MANAGED TABLES
-- (view: member of association; write: assoc admin)
-- ============================================================

-- meetings
DROP POLICY IF EXISTS meetings_select_auth  ON public.meetings;
DROP POLICY IF EXISTS meetings_admin_insert ON public.meetings;
DROP POLICY IF EXISTS meetings_admin_update ON public.meetings;
DROP POLICY IF EXISTS meetings_admin_delete ON public.meetings;
CREATE POLICY meetings_select_assoc ON public.meetings FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY meetings_admin_insert ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY meetings_admin_update ON public.meetings FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY meetings_admin_delete ON public.meetings FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- sponsors
DROP POLICY IF EXISTS sponsors_select_auth  ON public.sponsors;
DROP POLICY IF EXISTS sponsors_admin_insert ON public.sponsors;
DROP POLICY IF EXISTS sponsors_admin_update ON public.sponsors;
DROP POLICY IF EXISTS sponsors_admin_delete ON public.sponsors;
CREATE POLICY sponsors_select_assoc ON public.sponsors FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY sponsors_admin_insert ON public.sponsors FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY sponsors_admin_update ON public.sponsors FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY sponsors_admin_delete ON public.sponsors FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- sponsor_packages
DROP POLICY IF EXISTS sponsor_packages_select_auth  ON public.sponsor_packages;
DROP POLICY IF EXISTS sponsor_packages_admin_insert ON public.sponsor_packages;
DROP POLICY IF EXISTS sponsor_packages_admin_update ON public.sponsor_packages;
DROP POLICY IF EXISTS sponsor_packages_admin_delete ON public.sponsor_packages;
CREATE POLICY sponsor_packages_select_assoc ON public.sponsor_packages FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY sponsor_packages_admin_insert ON public.sponsor_packages FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY sponsor_packages_admin_update ON public.sponsor_packages FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY sponsor_packages_admin_delete ON public.sponsor_packages FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- perks
DROP POLICY IF EXISTS "Admins manage perks" ON public.perks;
DROP POLICY IF EXISTS "Authenticated can view active perks" ON public.perks;
CREATE POLICY perks_select_assoc ON public.perks FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY perks_admin_insert ON public.perks FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY perks_admin_update ON public.perks FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY perks_admin_delete ON public.perks FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- votes
DROP POLICY IF EXISTS votes_select_auth  ON public.votes;
DROP POLICY IF EXISTS votes_admin_insert ON public.votes;
DROP POLICY IF EXISTS votes_admin_update ON public.votes;
DROP POLICY IF EXISTS votes_admin_delete ON public.votes;
CREATE POLICY votes_select_assoc ON public.votes FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY votes_admin_insert ON public.votes FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY votes_admin_update ON public.votes FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY votes_admin_delete ON public.votes FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- attendees
DROP POLICY IF EXISTS attendees_select_auth  ON public.attendees;
DROP POLICY IF EXISTS attendees_admin_insert ON public.attendees;
DROP POLICY IF EXISTS attendees_admin_update ON public.attendees;
DROP POLICY IF EXISTS attendees_admin_delete ON public.attendees;
CREATE POLICY attendees_select_assoc ON public.attendees FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY attendees_admin_insert ON public.attendees FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY attendees_admin_update ON public.attendees FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY attendees_admin_delete ON public.attendees FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- event_registrations
DROP POLICY IF EXISTS event_registrations_select_auth   ON public.event_registrations;
DROP POLICY IF EXISTS event_registrations_member_insert ON public.event_registrations;
DROP POLICY IF EXISTS event_registrations_member_update ON public.event_registrations;
DROP POLICY IF EXISTS event_registrations_member_delete ON public.event_registrations;
CREATE POLICY event_registrations_select_assoc ON public.event_registrations FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY event_registrations_admin_insert ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY event_registrations_admin_update ON public.event_registrations FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY event_registrations_admin_delete ON public.event_registrations FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- member_checkins
DROP POLICY IF EXISTS member_checkins_select_admin ON public.member_checkins;
DROP POLICY IF EXISTS member_checkins_insert_admin ON public.member_checkins;
DROP POLICY IF EXISTS member_checkins_update_admin ON public.member_checkins;
DROP POLICY IF EXISTS member_checkins_delete_admin ON public.member_checkins;
CREATE POLICY member_checkins_select_assoc ON public.member_checkins FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY member_checkins_admin_insert ON public.member_checkins FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY member_checkins_admin_update ON public.member_checkins FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY member_checkins_admin_delete ON public.member_checkins FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- checkin_logs
DROP POLICY IF EXISTS checkin_logs_select_auth  ON public.checkin_logs;
DROP POLICY IF EXISTS checkin_logs_admin_insert ON public.checkin_logs;
DROP POLICY IF EXISTS checkin_logs_admin_update ON public.checkin_logs;
DROP POLICY IF EXISTS checkin_logs_admin_delete ON public.checkin_logs;
CREATE POLICY checkin_logs_select_assoc ON public.checkin_logs FOR SELECT TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY checkin_logs_admin_insert ON public.checkin_logs FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY checkin_logs_admin_update ON public.checkin_logs FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin());
CREATE POLICY checkin_logs_admin_delete ON public.checkin_logs FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin());

-- ============================================================
-- MEMBER-OWNED TABLES (marketplace / networking)
-- view: member of association; write: owner within own association
-- ============================================================

-- products
DROP POLICY IF EXISTS products_select_auth   ON public.products;
DROP POLICY IF EXISTS products_member_insert ON public.products;
DROP POLICY IF EXISTS products_member_update ON public.products;
DROP POLICY IF EXISTS products_member_delete ON public.products;
CREATE POLICY products_select_assoc ON public.products FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY products_member_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK (seller_id = current_member_id() AND association_id = current_association_id());
CREATE POLICY products_member_update ON public.products FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR seller_id = current_member_id())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin() OR seller_id = current_member_id());
CREATE POLICY products_member_delete ON public.products FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR seller_id = current_member_id());

-- opportunities
DROP POLICY IF EXISTS opportunities_select_auth   ON public.opportunities;
DROP POLICY IF EXISTS opportunities_member_insert ON public.opportunities;
DROP POLICY IF EXISTS opportunities_member_update ON public.opportunities;
DROP POLICY IF EXISTS opportunities_member_delete ON public.opportunities;
CREATE POLICY opportunities_select_assoc ON public.opportunities FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY opportunities_member_insert ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (poster_id = current_member_id() AND association_id = current_association_id());
CREATE POLICY opportunities_member_update ON public.opportunities FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR poster_id = current_member_id())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin() OR poster_id = current_member_id());
CREATE POLICY opportunities_member_delete ON public.opportunities FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR poster_id = current_member_id());

-- opportunity_interests
DROP POLICY IF EXISTS opportunity_interests_select_auth   ON public.opportunity_interests;
DROP POLICY IF EXISTS opportunity_interests_member_insert ON public.opportunity_interests;
DROP POLICY IF EXISTS opportunity_interests_member_update ON public.opportunity_interests;
DROP POLICY IF EXISTS opportunity_interests_member_delete ON public.opportunity_interests;
CREATE POLICY opportunity_interests_select_assoc ON public.opportunity_interests FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY opportunity_interests_member_insert ON public.opportunity_interests FOR INSERT TO authenticated
  WITH CHECK (association_id = current_association_id());
CREATE POLICY opportunity_interests_member_update ON public.opportunity_interests FOR UPDATE TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin())
  WITH CHECK (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY opportunity_interests_member_delete ON public.opportunity_interests FOR DELETE TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());

-- reviews
DROP POLICY IF EXISTS reviews_select_auth   ON public.reviews;
DROP POLICY IF EXISTS reviews_member_insert ON public.reviews;
DROP POLICY IF EXISTS reviews_member_update ON public.reviews;
DROP POLICY IF EXISTS reviews_member_delete ON public.reviews;
CREATE POLICY reviews_select_assoc ON public.reviews FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY reviews_member_insert ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = current_member_id() AND association_id = current_association_id());
CREATE POLICY reviews_member_update ON public.reviews FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR reviewer_id = current_member_id())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin() OR reviewer_id = current_member_id());
CREATE POLICY reviews_member_delete ON public.reviews FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR reviewer_id = current_member_id());

-- quote_requests
DROP POLICY IF EXISTS quote_requests_select_auth   ON public.quote_requests;
DROP POLICY IF EXISTS quote_requests_member_insert ON public.quote_requests;
DROP POLICY IF EXISTS quote_requests_member_update ON public.quote_requests;
DROP POLICY IF EXISTS quote_requests_member_delete ON public.quote_requests;
CREATE POLICY quote_requests_select_assoc ON public.quote_requests FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY quote_requests_member_insert ON public.quote_requests FOR INSERT TO authenticated
  WITH CHECK (buyer_id = current_member_id() AND association_id = current_association_id());
CREATE POLICY quote_requests_member_update ON public.quote_requests FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR buyer_id = current_member_id())
  WITH CHECK (has_assoc_role(association_id,'admin') OR is_platform_admin() OR buyer_id = current_member_id());
CREATE POLICY quote_requests_member_delete ON public.quote_requests FOR DELETE TO authenticated
  USING (has_assoc_role(association_id,'admin') OR is_platform_admin() OR buyer_id = current_member_id());

-- connections
DROP POLICY IF EXISTS connections_select_auth   ON public.connections;
DROP POLICY IF EXISTS connections_member_insert ON public.connections;
DROP POLICY IF EXISTS connections_member_update ON public.connections;
DROP POLICY IF EXISTS connections_member_delete ON public.connections;
CREATE POLICY connections_select_assoc ON public.connections FOR SELECT TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY connections_member_insert ON public.connections FOR INSERT TO authenticated
  WITH CHECK (association_id = current_association_id());
CREATE POLICY connections_member_update ON public.connections FOR UPDATE TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin())
  WITH CHECK (is_member_of(association_id) OR is_platform_admin());
CREATE POLICY connections_member_delete ON public.connections FOR DELETE TO authenticated
  USING (is_member_of(association_id) OR is_platform_admin());

-- messages
DROP POLICY IF EXISTS messages_select_auth   ON public.messages;
DROP POLICY IF EXISTS messages_member_insert ON public.messages;
DROP POLICY IF EXISTS messages_member_update ON public.messages;
DROP POLICY IF EXISTS messages_member_delete ON public.messages;
CREATE POLICY messages_select_assoc ON public.messages FOR SELECT TO authenticated
  USING ((is_member_of(association_id) AND (from_id = current_member_id() OR to_id = current_member_id())) OR is_platform_admin());
CREATE POLICY messages_member_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (from_id = current_member_id() AND association_id = current_association_id());
CREATE POLICY messages_member_update ON public.messages FOR UPDATE TO authenticated
  USING (from_id = current_member_id() OR to_id = current_member_id())
  WITH CHECK (from_id = current_member_id() OR to_id = current_member_id());
CREATE POLICY messages_member_delete ON public.messages FOR DELETE TO authenticated
  USING (from_id = current_member_id() OR is_platform_admin());