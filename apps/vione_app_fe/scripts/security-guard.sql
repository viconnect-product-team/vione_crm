-- Security regression guard.
-- Fails (RAISE EXCEPTION) if any previously-fixed security finding reappears.
-- Mapped 1:1 to the internal_ids that were remediated and must stay fixed.
-- Run in CI against the database: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/security-guard.sql
\set ON_ERROR_STOP on

DO $$
DECLARE
  n int;
  fail text[] := '{}';
BEGIN
  -- realtime_messages_broadcast_open
  -- realtime.messages must not expose any policy to anon/public.
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'realtime' AND tablename = 'messages'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles));
  IF n > 0 THEN
    fail := fail || format('realtime_messages_broadcast_open: %s anon/public realtime.messages policy(ies)', n);
  END IF;

  -- messages_realtime_bypass_insert / messages_realtime_bypass_select
  -- public.messages must never be reachable by anon/public.
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'messages'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles));
  IF n > 0 THEN
    fail := fail || format('messages_realtime_bypass_*: %s anon/public policy(ies) on public.messages', n);
  END IF;
  -- INSERT must pin from_id to the caller's member id.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages' AND cmd='INSERT'
      AND with_check ILIKE '%from_id = current_member_id()%'
  ) THEN
    fail := fail || 'messages_realtime_bypass_insert: INSERT WITH CHECK no longer pins from_id = current_member_id()';
  END IF;
  -- SELECT must be membership + participant scoped.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages' AND cmd='SELECT'
      AND qual ILIKE '%is_member_of(association_id)%'
      AND qual ILIKE '%current_member_id()%'
  ) THEN
    fail := fail || 'messages_realtime_bypass_select: SELECT no longer scoped to member/participant';
  END IF;

  -- opportunity_interests_insert_no_owner_check
  -- INSERT WITH CHECK must bind member_id to the caller.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='opportunity_interests' AND cmd='INSERT'
      AND with_check ILIKE '%member_id = current_member_id()%'
  ) THEN
    fail := fail || 'opportunity_interests_insert_no_owner_check: INSERT WITH CHECK missing member_id = current_member_id()';
  END IF;

  -- quote_requests_all_members_readable
  -- SELECT must NOT be a blanket is_member_of(association_id); it must scope to buyer/seller/admin.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='quote_requests' AND cmd='SELECT'
      AND qual ILIKE '%is_member_of(association_id)%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='quote_requests' AND cmd='SELECT'
      AND qual ILIKE '%buyer_id = current_member_id()%'
  ) THEN
    fail := fail || 'quote_requests_all_members_readable: SELECT no longer restricted to buyer/seller/admin';
  END IF;

  -- product_media_storage_no_ownership
  -- product-media write policies (INSERT/UPDATE/DELETE) must enforce per-member folder ownership.
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects' AND cmd IN ('INSERT','UPDATE','DELETE')
    AND (qual ILIKE '%product-media%' OR with_check ILIKE '%product-media%')
    AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%current_member_id()%';
  IF n < 3 THEN
    fail := fail || format('product_media_storage_no_ownership: only %s/3 product-media write policies enforce member ownership', n);
  END IF;

  -- =====================================================================
  -- GENERIC ANON EXPOSURE GUARD (two layers, whitelist-based)
  -- ---------------------------------------------------------------------
  -- Whitelist of public.<table> allowed to be reachable by anon at all.
  -- Initial whitelist: ONLY `associations`
  --   (landing is public by slug, rows exposed only when landing_published = true).
  -- Any new anon-reachable surface MUST be added here deliberately.
  -- =====================================================================

  -- Layer 1 (POLICY): no public table outside the whitelist may have a policy
  -- whose roles include anon or public.
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename <> 'associations'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles));
  IF n > 0 THEN
    fail := fail || format(
      'generic_anon_policy_exposure: %s policy(ies) on non-whitelisted public table(s) grant anon/public role: %s',
      n,
      (SELECT string_agg(DISTINCT tablename || '/' || policyname, ', ')
       FROM pg_policies
       WHERE schemaname='public' AND tablename <> 'associations'
         AND ('anon' = ANY(roles) OR 'public' = ANY(roles)))
    );
  END IF;

  -- Layer 2 (GRANT): no public table outside the whitelist may have any
  -- SELECT/INSERT/UPDATE/DELETE grant to anon in information_schema.
  -- This is the layer that actually saved the system: PostgREST reachability
  -- depends on table GRANTs, not policies alone.
  SELECT count(*) INTO n
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND table_name <> 'associations'
    AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');
  IF n > 0 THEN
    fail := fail || format(
      'generic_anon_grant_exposure: %s anon table-grant(s) on non-whitelisted public table(s): %s',
      n,
      (SELECT string_agg(DISTINCT table_name || '/' || privilege_type, ', ')
       FROM information_schema.role_table_grants
       WHERE table_schema='public' AND grantee='anon' AND table_name <> 'associations'
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE'))
    );
  END IF;

  -- Layer 3 (FUNCTION EXECUTE): no SECURITY DEFINER function in public may be
  -- EXECUTE-able by anon. SECURITY DEFINER runs with the owner's rights and
  -- bypasses RLS, so anon EXECUTE is a direct data-exposure path regardless of
  -- table policies/grants. Directly guards the F1 fix (is_assoc_manager).
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public' AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF n > 0 THEN
    fail := fail || format(
      'generic_anon_definer_execute_exposure: %s SECURITY DEFINER fn(s) EXECUTE-able by anon: %s',
      n,
      (SELECT string_agg(DISTINCT p.proname, ', ')
       FROM pg_proc p
       JOIN pg_namespace ns ON ns.oid = p.pronamespace
       WHERE ns.nspname='public' AND p.prosecdef
         AND has_function_privilege('anon', p.oid, 'EXECUTE'))
    );
  END IF;



  IF array_length(fail, 1) > 0 THEN
    RAISE EXCEPTION E'Security regression detected:\n  - %', array_to_string(fail, E'\n  - ');
  END IF;

  RAISE NOTICE 'Security guard passed: all targeted findings remain fixed.';
END $$;
