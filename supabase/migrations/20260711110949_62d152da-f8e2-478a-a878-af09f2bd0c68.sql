-- Link personal notifications to their source record (e.g. a business card lead)
ALTER TABLE public.member_notifications
  ADD COLUMN IF NOT EXISTS ref_type text,
  ADD COLUMN IF NOT EXISTS ref_id text;

-- Populate the reference when a new lead notification is created
CREATE OR REPLACE FUNCTION public.notify_business_card_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner text;
  _card_name text;
BEGIN
  SELECT c.member_id, c.display_name
    INTO _owner, _card_name
  FROM public.member_business_cards c
  WHERE c.id = NEW.card_id;

  IF _owner IS NOT NULL THEN
    INSERT INTO public.member_notifications
      (recipient_id, association_id, type, title, body, ref_type, ref_id)
    VALUES (
      _owner,
      NEW.association_id,
      'business_card_lead',
      'Yêu cầu liên hệ mới từ danh thiếp',
      COALESCE(NEW.requester_name, 'Một khách') ||
      ' vừa gửi yêu cầu liên hệ' ||
      COALESCE(' đến "' || _card_name || '"', '') || '.',
      'business_card_lead',
      NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$function$;