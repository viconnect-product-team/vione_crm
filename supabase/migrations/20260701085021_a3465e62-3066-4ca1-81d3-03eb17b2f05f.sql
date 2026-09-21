-- Performance: index association_id on all tenant-scoped tables (RLS filters by current_association_id())
CREATE INDEX IF NOT EXISTS idx_attendees_association ON public.attendees(association_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_association ON public.checkin_logs(association_id);
CREATE INDEX IF NOT EXISTS idx_connections_association ON public.connections(association_id);
CREATE INDEX IF NOT EXISTS idx_connections_peer ON public.connections(peer_id);
CREATE INDEX IF NOT EXISTS idx_documents_association ON public.documents(association_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_association ON public.email_campaigns(association_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_association ON public.event_registrations(association_id);
CREATE INDEX IF NOT EXISTS idx_invoices_association ON public.invoices(association_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member ON public.invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_meetings_association ON public.meetings(association_id);
CREATE INDEX IF NOT EXISTS idx_member_checkins_association ON public.member_checkins(association_id);
CREATE INDEX IF NOT EXISTS idx_messages_association ON public.messages(association_id);
CREATE INDEX IF NOT EXISTS idx_notifications_association ON public.notifications(association_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_association ON public.opportunities(association_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_association ON public.opportunity_interests(association_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_member ON public.opportunity_interests(member_id);
CREATE INDEX IF NOT EXISTS idx_perks_association ON public.perks(association_id);
CREATE INDEX IF NOT EXISTS idx_products_association ON public.products(association_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_association ON public.quote_requests(association_id);
CREATE INDEX IF NOT EXISTS idx_reviews_association ON public.reviews(association_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_packages_association ON public.sponsor_packages(association_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_association ON public.sponsors(association_id);
CREATE INDEX IF NOT EXISTS idx_transactions_association ON public.transactions(association_id);
CREATE INDEX IF NOT EXISTS idx_votes_association ON public.votes(association_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_association ON public.activity_log(association_id);
CREATE INDEX IF NOT EXISTS idx_member_notifications_association ON public.member_notifications(association_id);

-- Composite indexes for hot dashboard filters (status/type scoped per association)
CREATE INDEX IF NOT EXISTS idx_members_assoc_status ON public.members(association_id, status);
CREATE INDEX IF NOT EXISTS idx_members_assoc_type ON public.members(association_id, type);
CREATE INDEX IF NOT EXISTS idx_members_assoc_joined ON public.members(association_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_invoices_assoc_status ON public.invoices(association_id, status);
CREATE INDEX IF NOT EXISTS idx_events_assoc_date ON public.events(association_id, date);