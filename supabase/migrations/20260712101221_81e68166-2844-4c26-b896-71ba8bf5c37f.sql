-- Allow the new 'rejected' status
CREATE OR REPLACE FUNCTION public.validate_business_card()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('draft','published','hidden','suspended','archived','rejected') THEN
    RAISE EXCEPTION 'Invalid card status';
  END IF;
  IF NEW.public_mode NOT IN ('public','members_only','private') THEN
    RAISE EXCEPTION 'Invalid public_mode';
  END IF;
  IF NEW.card_kind NOT IN ('primary','secondary') THEN
    RAISE EXCEPTION 'Invalid card_kind';
  END IF;
  NEW.slug := trim(both '-' from lower(regexp_replace(coalesce(NEW.slug,''), '[^a-zA-Z0-9-]+', '-', 'g')));
  IF NEW.slug = '' THEN RAISE EXCEPTION 'Slug cannot be empty'; END IF;
  RETURN NEW;
END $function$;

-- Log status changes into the audit trail
CREATE OR REPLACE FUNCTION public.log_business_card_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.business_card_audit
      (association_id, card_id, event_type, actor_user_id, metadata)
    VALUES (
      NEW.association_id, NEW.id, 'status_change', auth.uid(),
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_log_business_card_status_change ON public.member_business_cards;
CREATE TRIGGER trg_log_business_card_status_change
  AFTER UPDATE ON public.member_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.log_business_card_status_change();