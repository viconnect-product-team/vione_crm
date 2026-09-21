-- 1. Lock down internal SECURITY DEFINER functions that should not be callable
--    directly by API roles (triggers + server-only helpers). RLS-helper functions
--    (has_role, current_member_id, etc.) keep EXECUTE because policies require it.
REVOKE EXECUTE ON FUNCTION public.set_member_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_sync_rate(text, integer, integer) FROM anon, authenticated;
-- set_active_association is an RPC for signed-in users only; anon must not call it.
REVOKE EXECUTE ON FUNCTION public.set_active_association(uuid) FROM anon;

-- 2. sync_rate_limits has RLS enabled but no policy (deny-all). It is only ever
--    touched through the SECURITY DEFINER rate-limit function, so remove it from
--    the Data API surface entirely for anon/authenticated.
REVOKE ALL ON TABLE public.sync_rate_limits FROM anon, authenticated;

-- 3. Realtime channel authorization: without policies any signed-in user can
--    subscribe to any topic. Restrict realtime.messages to authenticated users.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_use_realtime" ON realtime.messages;
CREATE POLICY "authenticated_can_use_realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_send_realtime" ON realtime.messages;
CREATE POLICY "authenticated_can_send_realtime"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);