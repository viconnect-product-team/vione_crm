CREATE INDEX IF NOT EXISTS idx_messages_from_to_created ON public.messages (from_id, to_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_from_created ON public.messages (to_id, from_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_owner_peer ON public.connections (owner_id, peer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_buyer_created ON public.quote_requests (buyer_id, created_at DESC);