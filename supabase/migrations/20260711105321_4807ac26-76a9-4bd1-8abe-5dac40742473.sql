
CREATE OR REPLACE FUNCTION public.notify_business_card_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner text;
  _card_name text;
BEGIN
  SELECT c.member_id, c.display_name
    INTO _owner, _card_name
  FROM public.member_business_cards c
  WHERE c.id = NEW.card_id;

  IF _owner IS NOT NULL THEN
    PERFORM public.add_member_notification(
      _owner,
      NEW.association_id,
      'business_card_lead',
      'Yêu cầu liên hệ mới từ danh thiếp',
      COALESCE(NEW.requester_name, 'Một khách') ||
      ' vừa gửi yêu cầu liên hệ' ||
      COALESCE(' đến "' || _card_name || '"', '') || '.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_business_card_lead ON public.business_card_leads;
CREATE TRIGGER trg_notify_business_card_lead
AFTER INSERT ON public.business_card_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_business_card_lead();
