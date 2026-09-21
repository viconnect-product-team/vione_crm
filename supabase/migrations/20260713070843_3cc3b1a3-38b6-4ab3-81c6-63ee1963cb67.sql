-- ============================================================
-- BC-2.1B — Deterministic Business Card Ownership Backfill
-- Additive infrastructure only. No card behavior / RLS / public change.
-- ============================================================

-- 1. Run tracker -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_card_ownership_backfill_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_version text NOT NULL,
  status            text NOT NULL DEFAULT 'running',
  preflight_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  eligible_count    integer NOT NULL DEFAULT 0,
  updated_count     integer NOT NULL DEFAULT 0,
  skipped_count     integer NOT NULL DEFAULT 0,
  exception_count   integer NOT NULL DEFAULT 0,
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_card_ownership_backfill_runs TO authenticated;
GRANT ALL ON public.business_card_ownership_backfill_runs TO service_role;

ALTER TABLE public.business_card_ownership_backfill_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins read backfill runs" ON public.business_card_ownership_backfill_runs;
CREATE POLICY "Platform admins read backfill runs"
  ON public.business_card_ownership_backfill_runs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- 2. Item tracker (row-level, for isolated rollback) -------------------------
CREATE TABLE IF NOT EXISTS public.business_card_ownership_backfill_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                 uuid NOT NULL REFERENCES public.business_card_ownership_backfill_runs(id) ON DELETE CASCADE,
  card_id                uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  prior_owner_user_id    uuid NULL,
  assigned_owner_user_id uuid NULL,
  classification         text NOT NULL,
  action                 text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bcobi_run_idx  ON public.business_card_ownership_backfill_items (run_id);
CREATE INDEX IF NOT EXISTS bcobi_card_idx ON public.business_card_ownership_backfill_items (card_id);

GRANT SELECT ON public.business_card_ownership_backfill_items TO authenticated;
GRANT ALL ON public.business_card_ownership_backfill_items TO service_role;

ALTER TABLE public.business_card_ownership_backfill_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins read backfill items" ON public.business_card_ownership_backfill_items;
CREATE POLICY "Platform admins read backfill items"
  ON public.business_card_ownership_backfill_items
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- 3. Deterministic backfill function ----------------------------------------
CREATE OR REPLACE FUNCTION public.run_business_card_ownership_backfill(_version text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _run_id uuid;
  _eligible int;
  _updated int;
  _preflight jsonb;
  _rec record;
BEGIN
  -- Authorization: platform admins only.
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized: platform admin required';
  END IF;

  -- Preflight summary snapshot (matches BC-2.0 classifier).
  WITH member_map AS (
    SELECT m.id AS member_id, m.user_id, m.association_id FROM public.members m
  ),
  user_dupes AS (
    SELECT user_id, association_id, count(*) AS n
    FROM public.members
    WHERE user_id IS NOT NULL
    GROUP BY user_id, association_id
    HAVING count(*) > 1
  ),
  classified AS (
    SELECT c.id AS card_id, mm.user_id, mm.association_id AS member_assoc,
      CASE
        WHEN mm.member_id IS NULL THEN 'C_ORPHAN_MEMBER_REFERENCE'
        WHEN c.association_id <> mm.association_id THEN 'E_ASSOCIATION_MISMATCH'
        WHEN mm.user_id IS NULL THEN 'B_MEMBER_WITHOUT_USER'
        WHEN ud.user_id IS NOT NULL THEN 'D_AMBIGUOUS_USER_MAPPING'
        WHEN c.owner_user_id IS NOT NULL THEN 'F_ALREADY_GLOBAL_COMPATIBLE'
        ELSE 'A_RESOLVABLE_UNIQUE'
      END AS category
    FROM public.member_business_cards c
    LEFT JOIN member_map mm ON mm.member_id = c.member_id
    LEFT JOIN user_dupes ud ON ud.user_id = mm.user_id AND ud.association_id = mm.association_id
  )
  SELECT jsonb_build_object(
    'totalCards',            (SELECT count(*) FROM public.member_business_cards),
    'resolvableUnique',      (SELECT count(*) FROM classified WHERE category='A_RESOLVABLE_UNIQUE'),
    'memberWithoutUser',     (SELECT count(*) FROM classified WHERE category='B_MEMBER_WITHOUT_USER'),
    'orphanMemberReference', (SELECT count(*) FROM classified WHERE category='C_ORPHAN_MEMBER_REFERENCE'),
    'ambiguousUserMapping',  (SELECT count(*) FROM classified WHERE category='D_AMBIGUOUS_USER_MAPPING'),
    'associationMismatch',   (SELECT count(*) FROM classified WHERE category='E_ASSOCIATION_MISMATCH'),
    'alreadyGlobalCompatible',(SELECT count(*) FROM classified WHERE category='F_ALREADY_GLOBAL_COMPATIBLE'),
    'eligibleBackfillCount', (SELECT count(*) FROM classified WHERE category='A_RESOLVABLE_UNIQUE'),
    'blockingCount',         (SELECT count(*) FROM classified WHERE category IN
                              ('C_ORPHAN_MEMBER_REFERENCE','D_AMBIGUOUS_USER_MAPPING','E_ASSOCIATION_MISMATCH'))
  ) INTO _preflight;

  -- Eligible set (category A only).
  CREATE TEMP TABLE _bc_eligible ON COMMIT DROP AS
  SELECT c.id AS card_id, m.user_id AS assigned_owner
  FROM public.member_business_cards c
  JOIN public.members m ON m.id = c.member_id
  WHERE c.owner_user_id IS NULL
    AND m.user_id IS NOT NULL
    AND c.association_id = m.association_id
    AND NOT EXISTS (
      SELECT 1 FROM public.members d
      WHERE d.user_id = m.user_id
        AND d.association_id = m.association_id
        AND d.id <> m.id
    );

  SELECT count(*) INTO _eligible FROM _bc_eligible;

  INSERT INTO public.business_card_ownership_backfill_runs
    (migration_version, status, preflight_summary, eligible_count, started_at)
  VALUES (_version, 'running', _preflight, _eligible, now())
  RETURNING id INTO _run_id;

  -- Deterministic update with no-overwrite + association re-check inside txn.
  WITH upd AS (
    UPDATE public.member_business_cards c
    SET owner_user_id = e.assigned_owner, updated_at = now()
    FROM _bc_eligible e
    WHERE c.id = e.card_id
      AND c.owner_user_id IS NULL
    RETURNING c.id AS card_id, e.assigned_owner
  )
  INSERT INTO public.business_card_ownership_backfill_items
    (run_id, card_id, prior_owner_user_id, assigned_owner_user_id, classification, action)
  SELECT _run_id, upd.card_id, NULL, upd.assigned_owner, 'A_RESOLVABLE_UNIQUE', 'assigned'
  FROM upd;

  GET DIAGNOSTICS _updated = ROW_COUNT;

  -- Exact row-count assertion: updates must equal eligibility.
  IF _updated <> _eligible THEN
    RAISE EXCEPTION 'Row-count mismatch: eligible=% updated=% (aborting)', _eligible, _updated;
  END IF;

  UPDATE public.business_card_ownership_backfill_runs
  SET status = 'completed', updated_count = _updated,
      skipped_count = 0, exception_count = 0, completed_at = now()
  WHERE id = _run_id;

  RETURN jsonb_build_object(
    'runId', _run_id, 'version', _version, 'preflight', _preflight,
    'eligibleCount', _eligible, 'updatedCount', _updated
  );
END;
$$;

-- 4. Isolated rollback function ---------------------------------------------
CREATE OR REPLACE FUNCTION public.rollback_business_card_ownership_backfill(_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _cleared int;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized: platform admin required';
  END IF;

  WITH cleared AS (
    UPDATE public.member_business_cards c
    SET owner_user_id = i.prior_owner_user_id, updated_at = now()
    FROM public.business_card_ownership_backfill_items i
    WHERE i.run_id = _run_id
      AND c.id = i.card_id
      AND i.action = 'assigned'
      AND c.owner_user_id = i.assigned_owner_user_id  -- unchanged since migration
    RETURNING c.id
  )
  SELECT count(*) INTO _cleared FROM cleared;

  UPDATE public.business_card_ownership_backfill_runs
  SET status = 'rolled_back'
  WHERE id = _run_id;

  RETURN jsonb_build_object('runId', _run_id, 'clearedCount', _cleared);
END;
$$;

REVOKE ALL ON FUNCTION public.run_business_card_ownership_backfill(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rollback_business_card_ownership_backfill(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_business_card_ownership_backfill(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rollback_business_card_ownership_backfill(uuid) TO authenticated, service_role;