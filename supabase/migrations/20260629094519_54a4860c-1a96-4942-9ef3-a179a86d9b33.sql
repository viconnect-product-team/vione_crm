
-- Redesign connections: owner/peer member ids
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_peer_id_key;
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS owner_id text;

-- table is empty; enforce ownership
UPDATE public.connections SET owner_id = peer_id WHERE owner_id IS NULL;
ALTER TABLE public.connections ALTER COLUMN owner_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS connections_owner_peer_key ON public.connections (owner_id, peer_id);

-- Replace association-wide policies with owner-scoped ones
DROP POLICY IF EXISTS connections_select_assoc ON public.connections;
DROP POLICY IF EXISTS connections_member_insert ON public.connections;
DROP POLICY IF EXISTS connections_member_update ON public.connections;
DROP POLICY IF EXISTS connections_member_delete ON public.connections;

CREATE POLICY connections_owner_select ON public.connections
  FOR SELECT TO authenticated
  USING (owner_id = public.current_member_id() OR public.is_platform_admin());

CREATE POLICY connections_owner_insert ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.current_member_id() AND association_id = public.current_association_id());

CREATE POLICY connections_owner_update ON public.connections
  FOR UPDATE TO authenticated
  USING (owner_id = public.current_member_id())
  WITH CHECK (owner_id = public.current_member_id());

CREATE POLICY connections_owner_delete ON public.connections
  FOR DELETE TO authenticated
  USING (owner_id = public.current_member_id());

-- Secure RPCs that keep both directions in sync
CREATE OR REPLACE FUNCTION public.net_send_request(_peer text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me text := public.current_member_id();
  _assoc uuid := public.current_association_id();
  _peer_assoc uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'No member profile'; END IF;
  IF _peer = _me THEN RAISE EXCEPTION 'Cannot connect to self'; END IF;
  SELECT association_id INTO _peer_assoc FROM public.members WHERE id = _peer;
  IF _peer_assoc IS NULL OR _peer_assoc <> _assoc THEN
    RAISE EXCEPTION 'Peer not in association';
  END IF;

  INSERT INTO public.connections (owner_id, peer_id, status, association_id)
  VALUES (_me, _peer, 'pending_outgoing', _assoc)
  ON CONFLICT (owner_id, peer_id) DO UPDATE SET status = 'pending_outgoing', updated_at = now();

  INSERT INTO public.connections (owner_id, peer_id, status, association_id)
  VALUES (_peer, _me, 'pending_incoming', _assoc)
  ON CONFLICT (owner_id, peer_id) DO UPDATE SET status = 'pending_incoming', updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.net_accept_request(_peer text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me text := public.current_member_id();
  _assoc uuid := public.current_association_id();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'No member profile'; END IF;
  -- only accept if there is a pending incoming request to me
  IF NOT EXISTS (
    SELECT 1 FROM public.connections
    WHERE owner_id = _me AND peer_id = _peer AND status = 'pending_incoming'
  ) THEN
    RAISE EXCEPTION 'No incoming request';
  END IF;

  INSERT INTO public.connections (owner_id, peer_id, status, association_id)
  VALUES (_me, _peer, 'connected', _assoc)
  ON CONFLICT (owner_id, peer_id) DO UPDATE SET status = 'connected', updated_at = now();

  INSERT INTO public.connections (owner_id, peer_id, status, association_id)
  VALUES (_peer, _me, 'connected', _assoc)
  ON CONFLICT (owner_id, peer_id) DO UPDATE SET status = 'connected', updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.net_remove_connection(_peer text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me text := public.current_member_id();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'No member profile'; END IF;
  DELETE FROM public.connections WHERE owner_id = _me AND peer_id = _peer;
  DELETE FROM public.connections WHERE owner_id = _peer AND peer_id = _me;
END;
$$;

REVOKE ALL ON FUNCTION public.net_send_request(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.net_accept_request(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.net_remove_connection(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.net_send_request(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.net_accept_request(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.net_remove_connection(text) TO authenticated;
