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
  p_target_guest_id uuid DEFAULT NULL,
  p_confirmed_new boolean DEFAULT false,
  p_field_choices jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner uuid := auth.uid();
  v_name text;
  v_name_norm text;
  v_phone text;
  v_phone_digits text;
  v_email text;
  v_company text;
  v_company_norm text;
  v_title text;
  v_title_norm text;
  v_website text;
  v_address text;
  v_address_norm text;
  v_choice jsonb;
  v_replay record;
  v_email_match uuid;
  v_phone_match uuid;
  v_soft_guest_ids uuid[];
  v_guest_total int;
  v_card_exact_count int;
  v_card_total_count int;
  v_target record;
  v_new_id uuid;
  v_out record;
  v_final_name text;
  v_final_phone text;
  v_final_email text;
  v_final_company text;
  v_final_title text;
  v_final_website text;
  v_final_address text;
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
  v_name_norm := lower(v_name);

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
  v_company_norm := CASE WHEN v_company IS NOT NULL THEN lower(v_company) END;
  v_title := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_title, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 160), '');
  v_title_norm := CASE WHEN v_title IS NOT NULL THEN lower(v_title) END;
  v_address := NULLIF(left(regexp_replace(btrim(regexp_replace(coalesce(p_address, ''), '[[:cntrl:]]', '', 'g')), '\s+', ' ', 'g'), 240), '');
  v_address_norm := CASE WHEN v_address IS NOT NULL THEN lower(v_address) END;

  v_choice := CASE WHEN jsonb_typeof(p_field_choices) = 'object' THEN p_field_choices ELSE NULL END;

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

  SELECT coalesce(array_agg(id), '{}'::uuid[]) INTO v_soft_guest_ids
    FROM public.guest_contacts
   WHERE owner_user_id = v_owner
     AND (
       (v_name_norm IS NOT NULL
         AND lower(regexp_replace(btrim(display_name), '\s+', ' ', 'g')) = v_name_norm)
       OR (v_company_norm IS NOT NULL AND company_name IS NOT NULL
         AND lower(regexp_replace(btrim(company_name), '\s+', ' ', 'g')) = v_company_norm)
     );

  v_guest_total := cardinality(v_soft_guest_ids)
    + (CASE WHEN v_email_match IS NOT NULL AND NOT (v_email_match = ANY(v_soft_guest_ids)) THEN 1 ELSE 0 END)
    + (CASE WHEN v_phone_match IS NOT NULL AND v_phone_match IS DISTINCT FROM v_email_match
             AND NOT (v_phone_match = ANY(v_soft_guest_ids)) THEN 1 ELSE 0 END);

  WITH card_hits AS (
    SELECT person_id,
           bool_or(email_hit) AS e,
           bool_or(phone_hit) AS p,
           bool_or(name_hit) AS n,
           bool_or(company_hit) AS c
    FROM (
      SELECT 'c:' || c.id::text AS person_id,
             (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email) AS email_hit,
             (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
               AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits) AS phone_hit,
             (v_name_norm IS NOT NULL
               AND lower(regexp_replace(btrim(c.display_name), '\s+', ' ', 'g')) = v_name_norm) AS name_hit,
             (v_company_norm IS NOT NULL AND c.company_name IS NOT NULL
               AND lower(regexp_replace(btrim(c.company_name), '\s+', ' ', 'g')) = v_company_norm) AS company_hit
        FROM public.saved_business_cards s
        JOIN public.member_business_cards c ON c.id = s.target_card_id
       WHERE s.owner_user_id = v_owner AND s.archived = false
         AND (
           (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email)
           OR (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
               AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits)
           OR (v_name_norm IS NOT NULL
               AND lower(regexp_replace(btrim(c.display_name), '\s+', ' ', 'g')) = v_name_norm)
           OR (v_company_norm IS NOT NULL AND c.company_name IS NOT NULL
               AND lower(regexp_replace(btrim(c.company_name), '\s+', ' ', 'g')) = v_company_norm)
         )
      UNION ALL
      SELECT 'u:' || (CASE WHEN uc.pair_user_low = v_owner THEN uc.pair_user_high ELSE uc.pair_user_low END)::text,
             (v_email IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = v_email),
             (v_phone_digits IS NOT NULL AND c.work_phone IS NOT NULL
               AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = v_phone_digits),
             (v_name_norm IS NOT NULL
               AND lower(regexp_replace(btrim(c.display_name), '\s+', ' ', 'g')) = v_name_norm),
             (v_company_norm IS NOT NULL AND c.company_name IS NOT NULL
               AND lower(regexp_replace(btrim(c.company_name), '\s+', ' ', 'g')) = v_company_norm)
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
           OR (v_name_norm IS NOT NULL
               AND lower(regexp_replace(btrim(c.display_name), '\s+', ' ', 'g')) = v_name_norm)
           OR (v_company_norm IS NOT NULL AND c.company_name IS NOT NULL
               AND lower(regexp_replace(btrim(c.company_name), '\s+', ' ', 'g')) = v_company_norm)
         )
    ) raw_hits
    GROUP BY person_id
  )
  SELECT count(*) FILTER (WHERE e OR p), count(*)
    INTO v_card_exact_count, v_card_total_count
    FROM card_hits;

  IF p_resolution = 'update' THEN
    IF p_target_guest_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_payload', 'detail', 'target_required');
    END IF;
    SELECT id, display_name, phone, email, company_name, title, website, address
      INTO v_target
      FROM public.guest_contacts
     WHERE id = p_target_guest_id AND owner_user_id = v_owner
     FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;
    IF v_target.id IS DISTINCT FROM v_email_match
       AND v_target.id IS DISTINCT FROM v_phone_match
       AND NOT (v_target.id = ANY(v_soft_guest_ids)) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'match_conflict');
    END IF;

    v_final_name := CASE
      WHEN btrim(coalesce(v_target.display_name, '')) = '' THEN v_name
      WHEN lower(regexp_replace(btrim(v_target.display_name), '\s+', ' ', 'g')) = v_name_norm
        THEN v_target.display_name
      WHEN v_choice ? 'displayName' AND v_choice->>'displayName' = 'card' THEN v_name
      ELSE v_target.display_name END;

    v_final_phone := CASE
      WHEN v_phone IS NULL THEN v_target.phone
      WHEN v_target.phone IS NULL OR btrim(v_target.phone) = '' THEN v_phone
      WHEN regexp_replace(v_target.phone, '[^0-9]', '', 'g') = v_phone_digits THEN v_target.phone
      WHEN v_choice ? 'phone' AND v_choice->>'phone' = 'card' THEN v_phone
      ELSE v_target.phone END;

    v_final_email := CASE
      WHEN v_email IS NULL THEN v_target.email
      WHEN v_target.email IS NULL OR btrim(v_target.email) = '' THEN v_email
      WHEN v_target.email = v_email THEN v_target.email
      WHEN v_choice ? 'email' AND v_choice->>'email' = 'card' THEN v_email
      ELSE v_target.email END;

    v_final_company := CASE
      WHEN v_company IS NULL THEN v_target.company_name
      WHEN v_target.company_name IS NULL OR btrim(v_target.company_name) = '' THEN v_company
      WHEN v_company_norm IS NOT NULL
           AND lower(regexp_replace(btrim(v_target.company_name), '\s+', ' ', 'g')) = v_company_norm
        THEN v_target.company_name
      WHEN v_choice ? 'companyName' AND v_choice->>'companyName' = 'card' THEN v_company
      ELSE v_target.company_name END;

    v_final_title := CASE
      WHEN v_title IS NULL THEN v_target.title
      WHEN v_target.title IS NULL OR btrim(v_target.title) = '' THEN v_title
      WHEN v_title_norm IS NOT NULL
           AND lower(regexp_replace(btrim(v_target.title), '\s+', ' ', 'g')) = v_title_norm
        THEN v_target.title
      WHEN v_choice ? 'title' AND v_choice->>'title' = 'card' THEN v_title
      ELSE v_target.title END;

    v_final_website := CASE
      WHEN v_website IS NULL THEN v_target.website
      WHEN v_target.website IS NULL OR btrim(v_target.website) = '' THEN v_website
      WHEN lower(btrim(v_target.website)) = v_website THEN v_target.website
      WHEN v_choice ? 'website' AND v_choice->>'website' = 'card' THEN v_website
      ELSE v_target.website END;

    v_final_address := CASE
      WHEN v_address IS NULL THEN v_target.address
      WHEN v_target.address IS NULL OR btrim(v_target.address) = '' THEN v_address
      WHEN v_address_norm IS NOT NULL
           AND lower(regexp_replace(btrim(v_target.address), '\s+', ' ', 'g')) = v_address_norm
        THEN v_target.address
      WHEN v_choice ? 'address' AND v_choice->>'address' = 'card' THEN v_address
      ELSE v_target.address END;

    UPDATE public.guest_contacts SET
      display_name = v_final_name,
      phone = v_final_phone,
      email = v_final_email,
      company_name = v_final_company,
      title = v_final_title,
      website = v_final_website,
      address = v_final_address,
      first_captured_at = coalesce(first_captured_at, now()),
      capture_scan_id = p_scan_id,
      last_shared_at = now(),
      updated_at = now()
    WHERE id = v_target.id;

    RETURN jsonb_build_object(
      'ok', true,
      'result', 'updated',
      'personId', 'g:' || v_target.id::text,
      'displayName', v_final_name,
      'title', v_final_title,
      'companyName', v_final_company
    );
  END IF;

  IF NOT p_confirmed_new AND (v_guest_total + v_card_total_count) > 0 THEN
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

REVOKE ALL ON FUNCTION public.save_scanned_guest_contact(uuid, uuid, text, text, text, text, text, text, text, text, uuid, boolean, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_scanned_guest_contact(uuid, uuid, text, text, text, text, text, text, text, text, uuid, boolean, jsonb) TO authenticated;