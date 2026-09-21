-- Function to generate per-association sequential member codes
CREATE OR REPLACE FUNCTION public.set_member_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _seq int;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' OR NEW.code LIKE 'HV-%' THEN
    SELECT upper(coalesce(nullif(slug, ''), left(regexp_replace(name, '\s', '', 'g'), 12)))
      INTO _prefix
    FROM public.associations
    WHERE id = NEW.association_id;

    _prefix := coalesce(_prefix, 'HV');

    SELECT coalesce(max((regexp_replace(code, '^.*-', ''))::int), 0) + 1
      INTO _seq
    FROM public.members
    WHERE association_id = NEW.association_id
      AND code ~ ('^' || _prefix || '-[0-9]+$');

    NEW.code := _prefix || '-' || lpad(_seq::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_member_code ON public.members;
CREATE TRIGGER trg_set_member_code
BEFORE INSERT ON public.members
FOR EACH ROW EXECUTE FUNCTION public.set_member_code();

-- Backfill existing members with the new code structure, sequential per association
WITH ordered AS (
  SELECT
    m.id,
    upper(coalesce(nullif(a.slug, ''), left(regexp_replace(a.name, '\s', '', 'g'), 12), 'HV')) AS prefix,
    row_number() OVER (
      PARTITION BY m.association_id
      ORDER BY m.created_at ASC, m.id ASC
    ) AS seq
  FROM public.members m
  JOIN public.associations a ON a.id = m.association_id
)
UPDATE public.members m
SET code = o.prefix || '-' || lpad(o.seq::text, 6, '0')
FROM ordered o
WHERE m.id = o.id;