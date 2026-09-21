-- BC-Mobile-3B — Guest Contact canonical domain + anonymous share pipeline + guest moment targets

CREATE TABLE public.guest_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  source_card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  phone text,
  email text,
  company_name text,
  title text,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'public_card_exchange',
  client_token text NOT NULL,
  first_shared_at timestamptz NOT NULL DEFAULT now(),
  last_shared_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guest_contacts_name_len CHECK (char_length(display_name) BETWEEN 1 AND 160),
  CONSTRAINT guest_contacts_contact_method CHECK (phone IS NOT NULL OR email IS NOT NULL),
  CONSTRAINT guest_contacts_phone_len CHECK (phone IS NULL OR char_length(phone) <= 40),
  CONSTRAINT guest_contacts_email_len CHECK (email IS NULL OR char_length(email) <= 160),
  CONSTRAINT guest_contacts_company_len CHECK (company_name IS NULL OR char_length(company_name) <= 200),
  CONSTRAINT guest_contacts_title_len CHECK (title IS NULL OR char_length(title) <= 160),
  CONSTRAINT guest_contacts_card_token_uq UNIQUE (source_card_id, client_token)
);

CREATE INDEX guest_contacts_owner_recent_idx ON public.guest_contacts (owner_user_id, last_shared_at DESC);
CREATE INDEX guest_contacts_owner_email_idx ON public.guest_contacts (owner_user_id, email) WHERE email IS NOT NULL;
CREATE INDEX guest_contacts_owner_phone_idx ON public.guest_contacts (owner_user_id, phone) WHERE phone IS NOT NULL;

GRANT SELECT, DELETE ON public.guest_contacts TO authenticated;
GRANT ALL ON public.guest_contacts TO service_role;

ALTER TABLE public.guest_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their guest contacts" ON public.guest_contacts
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Owners can delete their guest contacts" ON public.guest_contacts
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid());

ALTER TABLE public.member_business_cards
  ADD COLUMN IF NOT EXISTS allow_contact_exchange boolean NOT NULL DEFAULT true;

-- Anonymous, consent-gated submission. SECURITY DEFINER: resolves slug →
-- published+public card → owner independently; the caller never supplies
-- owner/card ids. Response carries no internal identifiers.
CREATE OR REPLACE FUNCTION public.share_guest_contact(
  p_slug text,
  p_display_name text,
  p_phone text,
  p_email text,
  p_company_name text,
  p_title text,
  p_consent_version text,
  p_client_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_card_id uuid;
  v_owner uuid;
  v_exchange boolean;
  v_name text;
  v_phone text;
  v_email text;
  v_company text;
  v_title text;
  v_digits text;
  v_email_match uuid;
  v_phone_match uuid;
  v_target uuid;
  v_new_id uuid;
BEGIN
  -- Consent is a hard gate (versioned, explicit).
  IF p_consent_version IS NULL OR p_consent_version <> 'bc-guest-exchange-v1' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'consent_required');
  END IF;
  IF p_client_token IS NULL OR p_client_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_client_token');
  END IF;

  -- Card availability resolved server-side; all unavailable states collapse
  -- into one error (no slug enumeration signal).
  SELECT id, owner_user_id, allow_contact_exchange
    INTO v_card_id, v_owner, v_exchange
    FROM public.member_business_cards
   WHERE slug = p_slug AND status = 'published' AND public_mode = 'public';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'card_unavailable');
  END IF;
  IF NOT v_exchange THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exchange_disabled');
  END IF;

  -- Normalize + re-validate (defense in depth; route validates too).
  v_name := regexp_replace(btrim(regexp_replace(coalesce(p_display_name, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g');
  IF v_name = '' OR char_length(v_name) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'name_required');
  END IF;

  v_phone := NULL;
  IF p_phone IS NOT NULL AND btrim(p_phone) <> '' THEN
    v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF char_length(v_digits) < 6 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_phone');
    END IF;
    v_phone := CASE WHEN btrim(p_phone) LIKE '+%' THEN '+' || v_digits ELSE v_digits END;
    IF char_length(v_phone) > 40 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_phone');
    END IF;
  END IF;

  v_email := NULL;
  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    v_email := lower(btrim(p_email));
    IF char_length(v_email) > 160 OR v_email !~ '^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_email');
    END IF;
  END IF;

  IF v_phone IS NULL AND v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'contact_method_required');
  END IF;

  v_company := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_company_name, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 200), '');
  v_title := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_title, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 160), '');

  -- Idempotent replay: same card + same client token.
  SELECT id INTO v_new_id FROM public.guest_contacts
   WHERE source_card_id = v_card_id AND client_token = lower(p_client_token);
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'result', 'replay');
  END IF;

  -- Dedupe: email beats phone; conflicting matches are ambiguous → never merge.
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_email_match FROM public.guest_contacts
     WHERE owner_user_id = v_owner AND email = v_email
     ORDER BY first_shared_at ASC LIMIT 1;
  END IF;
  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_phone_match FROM public.guest_contacts
     WHERE owner_user_id = v_owner AND phone = v_phone
     ORDER BY first_shared_at ASC LIMIT 1;
  END IF;

  IF v_email_match IS NOT NULL AND v_phone_match IS NOT NULL AND v_email_match <> v_phone_match THEN
    v_target := NULL;
  ELSE
    v_target := coalesce(v_email_match, v_phone_match);
  END IF;

  IF v_target IS NOT NULL THEN
    UPDATE public.guest_contacts SET
      display_name = v_name,
      phone = coalesce(v_phone, phone),
      email = coalesce(v_email, email),
      company_name = coalesce(v_company, company_name),
      title = coalesce(v_title, title),
      consent_version = p_consent_version,
      consented_at = now(),
      last_shared_at = now(),
      updated_at = now()
    WHERE id = v_target;
    RETURN jsonb_build_object('ok', true, 'result', 'merged');
  END IF;

  INSERT INTO public.guest_contacts (
    owner_user_id, source_card_id, display_name, phone, email, company_name, title,
    consent_version, client_token
  ) VALUES (
    v_owner, v_card_id, v_name, v_phone, v_email, v_company, v_title,
    p_consent_version, lower(p_client_token)
  )
  ON CONFLICT (source_card_id, client_token) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'result', 'replay');
  END IF;
  RETURN jsonb_build_object('ok', true, 'result', 'created');
END;
$function$;

REVOKE ALL ON FUNCTION public.share_guest_contact(text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.share_guest_contact(text, text, text, text, text, text, text, text) TO anon, authenticated;

-- Meeting Moments: guest contact targets
ALTER TABLE public.business_relationship_moments
  ADD COLUMN IF NOT EXISTS target_guest_id uuid REFERENCES public.guest_contacts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS brm_target_guest_idx
  ON public.business_relationship_moments (owner_user_id, target_guest_id)
  WHERE target_guest_id IS NOT NULL;

ALTER TABLE public.business_relationship_moments DROP CONSTRAINT brm_target_xor;
ALTER TABLE public.business_relationship_moments ADD CONSTRAINT brm_target_xor CHECK (
  (target_kind = 'connection' AND target_user_id IS NOT NULL AND target_card_id IS NULL AND target_guest_id IS NULL) OR
  (target_kind = 'saved_card' AND target_card_id IS NOT NULL AND target_user_id IS NULL AND target_guest_id IS NULL) OR
  (target_kind = 'guest_contact' AND target_guest_id IS NOT NULL AND target_user_id IS NULL AND target_card_id IS NULL)
);

ALTER TABLE public.business_relationship_moments DROP CONSTRAINT business_relationship_moments_target_kind_check;
ALTER TABLE public.business_relationship_moments ADD CONSTRAINT business_relationship_moments_target_kind_check
  CHECK (target_kind = ANY (ARRAY['connection'::text, 'saved_card'::text, 'guest_contact'::text]));

CREATE OR REPLACE FUNCTION public.brm_validate_moment_target()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.target_kind = 'connection' then
    if not exists (
      select 1 from public.user_connections
      where status = 'accepted'
        and pair_user_low = least(NEW.owner_user_id, NEW.target_user_id)
        and pair_user_high = greatest(NEW.owner_user_id, NEW.target_user_id)
    ) then
      raise exception 'MOMENT_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  elsif NEW.target_kind = 'guest_contact' then
    if not exists (
      select 1 from public.guest_contacts
      where id = NEW.target_guest_id
        and owner_user_id = NEW.owner_user_id
    ) then
      raise exception 'MOMENT_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  else
    if not exists (
      select 1 from public.saved_business_cards
      where owner_user_id = NEW.owner_user_id
        and target_card_id = NEW.target_card_id
        and archived = false
    ) then
      raise exception 'MOMENT_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  end if;
  return NEW;
end
$function$;