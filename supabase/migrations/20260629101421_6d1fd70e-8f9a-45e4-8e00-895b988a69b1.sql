
CREATE TABLE IF NOT EXISTS public.member_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id text NOT NULL,
  association_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.member_notifications TO authenticated;
GRANT ALL ON public.member_notifications TO service_role;

ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_notifications_select_own ON public.member_notifications
  FOR SELECT TO authenticated
  USING (recipient_id = public.current_member_id());

CREATE POLICY member_notifications_update_own ON public.member_notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = public.current_member_id())
  WITH CHECK (recipient_id = public.current_member_id());

CREATE INDEX IF NOT EXISTS idx_member_notifications_recipient
  ON public.member_notifications (recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.add_member_notification(
  _recipient text, _assoc uuid, _type text, _title text, _body text
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.member_notifications (recipient_id, association_id, type, title, body)
  VALUES (_recipient, _assoc, _type, _title, _body);
$$;
REVOKE EXECUTE ON FUNCTION public.add_member_notification(text, uuid, text, text, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.net_accept_request(_peer text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _me text := public.current_member_id();
  _assoc uuid := public.current_association_id();
  _my_name text;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'No member profile'; END IF;
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

  SELECT name INTO _my_name FROM public.members WHERE id = _me;
  PERFORM public.add_member_notification(
    _peer, _assoc, 'network',
    'Lời mời kết nối được chấp nhận',
    COALESCE(_my_name, 'Một hội viên') || ' đã chấp nhận lời mời kết nối của bạn.'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.net_decline_request(_peer text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _me text := public.current_member_id();
  _assoc uuid := public.current_association_id();
  _my_name text;
  _was_incoming boolean;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'No member profile'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE owner_id = _me AND peer_id = _peer AND status = 'pending_incoming'
  ) INTO _was_incoming;

  DELETE FROM public.connections WHERE owner_id = _me AND peer_id = _peer;
  DELETE FROM public.connections WHERE owner_id = _peer AND peer_id = _me;

  IF _was_incoming THEN
    SELECT name INTO _my_name FROM public.members WHERE id = _me;
    PERFORM public.add_member_notification(
      _peer, _assoc, 'network',
      'Lời mời kết nối bị từ chối',
      COALESCE(_my_name, 'Một hội viên') || ' đã từ chối lời mời kết nối của bạn.'
    );
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.net_decline_request(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.net_decline_request(text) TO authenticated;
