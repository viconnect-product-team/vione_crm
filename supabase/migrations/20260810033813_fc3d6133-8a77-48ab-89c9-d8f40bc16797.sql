CREATE OR REPLACE FUNCTION public.saved_card_collections_normalize_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_name := lower(btrim(COALESCE(NEW.name, '')));
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.saved_card_collections_normalize_name() FROM anon;
REVOKE ALL ON FUNCTION public.saved_card_collections_normalize_name() FROM authenticated;

DROP TRIGGER IF EXISTS trg_saved_card_collections_normalize_name ON public.saved_card_collections;
CREATE TRIGGER trg_saved_card_collections_normalize_name
BEFORE INSERT OR UPDATE OF name ON public.saved_card_collections
FOR EACH ROW EXECUTE FUNCTION public.saved_card_collections_normalize_name();

UPDATE public.saved_card_collections
SET normalized_name = lower(btrim(name))
WHERE normalized_name IS NULL OR normalized_name <> lower(btrim(name));