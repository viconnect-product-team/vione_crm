-- BC-Mobile-4B — paper-card OCR save: guest provenance generalization,
-- owner-scoped deterministic duplicate resolver, and the canonical save RPC.

ALTER TABLE public.guest_contacts ALTER COLUMN source_card_id DROP NOT NULL;
ALTER TABLE public.guest_contacts ALTER COLUMN consent_version DROP NOT NULL;
ALTER TABLE public.guest_contacts ALTER COLUMN consented_at DROP NOT NULL;
ALTER TABLE public.guest_contacts ALTER COLUMN consented_at DROP DEFAULT;

ALTER TABLE public.guest_contacts ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.guest_contacts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.guest_contacts ADD COLUMN IF NOT EXISTS first_captured_at timestamptz;
ALTER TABLE public.guest_contacts ADD COLUMN IF NOT EXISTS capture_scan_id uuid;

ALTER TABLE public.guest_contacts
  ADD CONSTRAINT guest_contacts_website_len CHECK (website IS NULL OR char_length(website) <= 200);
ALTER TABLE public.guest_contacts
  ADD CONSTRAINT guest_contacts_address_len CHECK (address IS NULL OR char_length(address) <= 240);

ALTER TABLE public.guest_contacts
  ADD CONSTRAINT guest_contacts_consent_coherence CHECK (
    (
      source = 'public_card_exchange'
      AND consent_version IS NOT NULL
      AND consented_at IS NOT NULL
      AND source_card_id IS NOT NULL
    )
    OR (
      source <> 'public_card_exchange'
      AND consent_version IS NULL
      AND consented_at IS NULL
    )
  );

CREATE UNIQUE INDEX guest_contacts_scan_token_uq
  ON public.guest_contacts (owner_user_id, client_token)
  WHERE source_card_id IS NULL;

CREATE OR REPLACE FUNCTION public.resolve_card_scan_duplicates(
  p_email text,
  p_phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner uuid := auth.uid();
  v_email text;
  v_phone_digits text;
  v_candidates jsonb;
  v_state text;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  v_email := NULL;
  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    v_email := lower(btrim(p_email));
    IF char_length(v_email) > 160 OR v_email !~ '^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$' THEN
      v_email := NULL;
    END IF;
  END IF;

  v_phone_digits := NULL;
  IF p_phone IS NOT NULL AND btrim(p_phone) <> '' THEN
    v_phone_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF char_length(v_phone_digits) < 6 THEN
      v_phone_digits := NULL;
    END IF;
  END IF;

  IF v_email IS NULL AND v_phone_digits IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'state', 'none', 'candidates', '[]'::jsonb);
  END IF;

  WITH matches AS (
    SELECT
      'g:' || g.id::text AS person_id,
      'guest'::text AS kind,
      g.display_name AS display_name,
      g.title AS title,
      g.company_name AS company_name,
      (v_email IS NOT NULL AND g.email = v_email) AS email_hit,
      (v_phone_digits IS NOT NULL AND g.phone IS NOT NULL
        AND regexp_replace(g.phone, '[^0-9]', '', 'g') = v_phone_digits) AS phone_hit
    FROM public.guest_contacts g
    WHERE g.owner_user_id = v_owner
      AND (
        (v_email IS NOT NULL AND g.email = v_email)
        OR (v_phone_digits IS NOT NULL AND g.phone IS NOT NULL
            AND regexp_replace(g.phone, '[^0-9]', '', 'g') = v_phone_digits)
      )

    UNION ALL

    SELECT
      'c:' || c.id::text,
      'saved_card'::text,
      c.display_name,
      c.professional_title,
      c.company_name,
      (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email),
      (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
        AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
    FROM public.saved_business_cards s
    JOIN public.member_business_cards c ON c.id = s.target_card_id
    WHERE s.owner_user_id = v_owner
      AND s.archived = false
      AND (
        (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email)
        OR (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
      )

    UNION ALL

    SELECT
      'u:' || cp.counterpart::text,
      'connection'::text,
      c.display_name,
      c.professional_title,
      c.company_name,
      (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email),
      (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
        AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
    FROM (
      SELECT DISTINCT
        CASE WHEN uc.pair_user_low = v_owner THEN uc.pair_user_high ELSE uc.pair_user_low END AS counterpart
      FROM public.user_connections uc
      WHERE uc.status = 'accepted'
        AND uc.blocked_by_user_id IS NULL
        AND (uc.pair_user_low = v_owner OR uc.pair_user_high = v_owner)
    ) cp
    JOIN public.member_business_cards c
      ON c.owner_user_id = cp.counterpart AND c.status = 'published'
    WHERE (
      (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email)
      OR (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
          AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
    )
  ),
  dedup AS (
    SELECT
      person_id,
      min(kind) AS kind,
      max(display_name) AS display_name,
      max(title) AS title,
      max(company_name) AS company_name,
      bool_or(email_hit) AS email_hit,
      bool_or(phone_hit) AS phone_hit
    FROM matches
    GROUP BY person_id
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'personId', person_id,
        'kind', kind,
        'displayName', display_name,
        'title', title,
        'companyName', company_name,
        'reason', CASE
          WHEN email_hit AND phone_hit THEN 'phone_email'
          WHEN email_hit THEN 'email'
          ELSE 'phone'
        END
      )
      ORDER BY (email_hit AND phone_hit) DESC, display_name ASC
    ),
    '[]'::jsonb
  )
  INTO v_candidates
  FROM dedup;

  v_state := CASE jsonb_array_length(v_candidates)
    WHEN 0 THEN 'none'
    WHEN 1 THEN 'exact'
    ELSE 'ambiguous'
  END;

  RETURN jsonb_build_object('ok', true, 'state', v_state, 'candidates', v_candidates);
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_card_scan_duplicates(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_card_scan_duplicates(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_scanned_guest_contact(
  p_client_token uuid,
  p_scan_id uuid,
  p_display_name text,
  p_phone text,
  p_email text,
  p_company_name text,
  p_title text,
  p_website text,
  p_address text,
  p_resolution text,
  p_target_guest_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner uuid := auth.uid();
  v_name text;
  v_phone text;
  v_phone_digits text;
  v_email text;
  v_company text;
  v_title text;
  v_website text;
  v_address text;
  v_replay record;
  v_email_match uuid;
  v_phone_match uuid;
  v_guest_match_count int;
  v_card_match_count int;
  v_target record;
  v_new_id uuid;
  v_out record;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;
  IF p_scan_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_scan');
  END IF;
  IF p_resolution IS NULL OR p_resolution NOT IN ('new', 'update') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_resolution');
  END IF;

  SELECT id, display_name, title, company_name INTO v_replay
    FROM public.guest_contacts
   WHERE owner_user_id = v_owner
     AND source_card_id IS NULL
     AND client_token = p_client_token::text;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'result', 'replay',
      'personId', 'g:' || v_replay.id::text,
      'displayName', v_replay.display_name,
      'title', v_replay.title,
      'companyName', v_replay.company_name
    );
  END IF;

  v_name := regexp_replace(btrim(regexp_replace(coalesce(p_display_name, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g');
  IF v_name = '' OR char_length(v_name) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'name_required');
  END IF;

  v_phone := NULL;
  v_phone_digits := NULL;
  IF p_phone IS NOT NULL AND btrim(p_phone) <> '' THEN
    v_phone_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF char_length(v_phone_digits) < 6 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_phone');
    END IF;
    v_phone := CASE WHEN btrim(p_phone) LIKE '+%' THEN '+' || v_phone_digits ELSE v_phone_digits END;
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

  v_website := NULL;
  IF p_website IS NOT NULL AND btrim(p_website) <> '' THEN
    v_website := lower(btrim(p_website));
    IF char_length(v_website) > 200 OR v_website !~ '^https?://[^\s]+$' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'invalid_website');
    END IF;
  END IF;

  v_company := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_company_name, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 200), '');
  v_title := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_title, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 160), '');
  v_address := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_address, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 240), '');

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_email_match
      FROM public.guest_contacts
     WHERE owner_user_id = v_owner AND email = v_email
     ORDER BY first_shared_at ASC
     LIMIT 1;
  END IF;
  IF v_phone_digits IS NOT NULL THEN
    SELECT id INTO v_phone_match
      FROM public.guest_contacts
     WHERE owner_user_id = v_owner AND phone IS NOT NULL
       AND regexp_replace(phone, '[^0-9]', '', 'g') = v_phone_digits
     ORDER BY first_shared_at ASC
     LIMIT 1;
  END IF;
  v_guest_match_count :=
    (CASE WHEN v_email_match IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN v_phone_match IS NOT NULL AND v_phone_match IS DISTINCT FROM v_email_match THEN 1 ELSE 0 END);

  SELECT count(DISTINCT person_id) INTO v_card_match_count
  FROM (
    SELECT 'c:' || c.id::text AS person_id
    FROM public.saved_business_cards s
    JOIN public.member_business_cards c ON c.id = s.target_card_id
    WHERE s.owner_user_id = v_owner AND s.archived = false
      AND (
        (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email)
        OR (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
      )
    UNION
    SELECT 'u:' || (CASE WHEN uc.pair_user_low = v_owner THEN uc.pair_user_high ELSE uc.pair_user_low END)::text
    FROM public.user_connections uc
    JOIN public.member_business_cards c
      ON c.owner_user_id = (CASE WHEN uc.pair_user_low = v_owner THEN uc.pair_user_high ELSE uc.pair_user_low END)
     AND c.status = 'published'
    WHERE uc.status = 'accepted'
      AND uc.blocked_by_user_id IS NULL
      AND (uc.pair_user_low = v_owner OR uc.pair_user_high = v_owner)
      AND (
        (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email)
        OR (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
      )
  ) hits;

  IF p_resolution = 'update' THEN
    IF p_target_guest_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'target_required');
    END IF;
    SELECT id, display_name, title, company_name INTO v_target
      FROM public.guest_contacts
     WHERE id = p_target_guest_id AND owner_user_id = v_owner
     FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;
    IF v_target.id IS DISTINCT FROM v_email_match AND v_target.id IS DISTINCT FROM v_phone_match THEN
      RETURN jsonb_build_object('ok', false, 'error', 'match_conflict');
    END IF;

    UPDATE public.guest_contacts SET
      display_name = v_name,
      phone = coalesce(v_phone, phone),
      email = coalesce(v_email, email),
      company_name = coalesce(v_company, company_name),
      title = coalesce(v_title, title),
      website = coalesce(v_website, website),
      address = coalesce(v_address, address),
      first_captured_at = coalesce(first_captured_at, now()),
      capture_scan_id = p_scan_id,
      last_shared_at = now(),
      updated_at = now()
    WHERE id = v_target.id;

    RETURN jsonb_build_object(
      'ok', true,
      'result', 'updated',
      'personId', 'g:' || v_target.id::text,
      'displayName', v_name,
      'title', coalesce(v_title, v_target.title),
      'companyName', coalesce(v_company, v_target.company_name)
    );
  END IF;

  IF v_guest_match_count + v_card_match_count = 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'match_conflict');
  END IF;

  INSERT INTO public.guest_contacts (
    owner_user_id, source_card_id, display_name, phone, email, company_name, title,
    website, address, consent_version, consented_at, source, client_token,
    first_captured_at, capture_scan_id
  ) VALUES (
    v_owner, NULL, v_name, v_phone, v_email, v_company, v_title,
    v_website, v_address, NULL, NULL, 'business_card_scan', p_client_token::text,
    now(), p_scan_id
  )
  ON CONFLICT (owner_user_id, client_token) WHERE source_card_id IS NULL DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    SELECT id, display_name, title, company_name INTO v_out
      FROM public.guest_contacts
     WHERE owner_user_id = v_owner
       AND source_card_id IS NULL
       AND client_token = p_client_token::text;
    RETURN jsonb_build_object(
      'ok', true,
      'result', 'replay',
      'personId', 'g:' || v_out.id::text,
      'displayName', v_out.display_name,
      'title', v_out.title,
      'companyName', v_out.company_name
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'result', 'created',
    'personId', 'g:' || v_new_id::text,
    'displayName', v_name,
    'title', v_title,
    'companyName', v_company
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_scanned_guest_contact(uuid, uuid, text, text, text, text, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_scanned_guest_contact(uuid, uuid, text, text, text, text, text, text, text, text, uuid) TO authenticated;