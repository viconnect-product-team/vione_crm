-- Audit logging for member-initiated business card actions.
-- SECURITY DEFINER so owners can write audit rows without a broad INSERT policy,
-- while the function verifies the caller actually owns the target card.
CREATE OR REPLACE FUNCTION public.log_business_card_member_event(
  _card_id uuid,
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _assoc uuid;
  _owner text;
BEGIN
  IF _event_type NOT IN ('create','update','set_primary','delete') THEN
    RAISE EXCEPTION 'Invalid member event type: %', _event_type;
  END IF;

  SELECT association_id, member_id INTO _assoc, _owner
  FROM public.member_business_cards
  WHERE id = _card_id;

  IF _assoc IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Only the owner may write member-event audit rows for their card.
  IF _owner IS DISTINCT FROM public.current_member_id() THEN
    RAISE EXCEPTION 'Not card owner';
  END IF;

  INSERT INTO public.business_card_audit
    (association_id, card_id, event_type, actor_user_id, metadata)
  VALUES (_assoc, _card_id, _event_type, auth.uid(), COALESCE(_metadata, '{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_business_card_member_event(uuid, text, jsonb) TO authenticated;