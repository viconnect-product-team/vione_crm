-- BC-2.0 Business Card Ownership Preflight (READ-ONLY, idempotent, rerunnable)
-- Purpose: measure & classify every member_business_cards row for a future,
-- additive migration to platform-user ownership (owner_user_id).
-- Safe: pure SELECT. No writes, no DDL. Run as platform admin / service role.
-- NOTE: owner_user_id may not exist yet (pre BC-2.1). The classifier degrades
-- gracefully: ALREADY_GLOBAL_COMPATIBLE resolves to 0 until the column exists.

WITH has_owner AS (
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='member_business_cards'
      AND column_name='owner_user_id'
  ) AS present
),
-- unique member->user mappings within the same association
member_map AS (
  SELECT m.id AS member_id, m.user_id, m.association_id
  FROM public.members m
),
-- detect ambiguity: same user_id linked to >1 member in the same association
user_dupes AS (
  SELECT user_id, association_id, count(*) AS n
  FROM public.members
  WHERE user_id IS NOT NULL
  GROUP BY user_id, association_id
  HAVING count(*) > 1
),
classified AS (
  SELECT
    c.id AS card_id,
    c.slug,
    c.status,
    c.public_mode,
    c.association_id AS card_assoc,
    c.member_id,
    mm.user_id,
    mm.association_id AS member_assoc,
    (mm.user_id IS NOT NULL) AS auth_user_exists,  -- members.user_id FK->auth.users guarantees existence
    CASE
      WHEN mm.member_id IS NULL THEN 'C_ORPHAN_MEMBER_REFERENCE'
      WHEN c.association_id <> mm.association_id THEN 'E_ASSOCIATION_MISMATCH'
      WHEN mm.user_id IS NULL THEN 'B_MEMBER_WITHOUT_USER'
      WHEN ud.user_id IS NOT NULL THEN 'D_AMBIGUOUS_USER_MAPPING'
      ELSE 'A_RESOLVABLE_UNIQUE'
    END AS category
  FROM public.member_business_cards c
  LEFT JOIN member_map mm ON mm.member_id = c.member_id
  LEFT JOIN user_dupes ud
    ON ud.user_id = mm.user_id AND ud.association_id = mm.association_id
)
SELECT jsonb_pretty(jsonb_build_object(
  'totalCards',              (SELECT count(*) FROM public.member_business_cards),
  'resolvableUnique',        (SELECT count(*) FROM classified WHERE category='A_RESOLVABLE_UNIQUE'),
  'memberWithoutUser',       (SELECT count(*) FROM classified WHERE category='B_MEMBER_WITHOUT_USER'),
  'orphanMemberReference',   (SELECT count(*) FROM classified WHERE category='C_ORPHAN_MEMBER_REFERENCE'),
  'ambiguousUserMapping',    (SELECT count(*) FROM classified WHERE category='D_AMBIGUOUS_USER_MAPPING'),
  'associationMismatch',     (SELECT count(*) FROM classified WHERE category='E_ASSOCIATION_MISMATCH'),
  'alreadyGlobalCompatible', 0,  -- resolves >0 only after owner_user_id exists (see has_owner)
  'unknown',                 (SELECT count(*) FROM classified WHERE category NOT IN
                               ('A_RESOLVABLE_UNIQUE','B_MEMBER_WITHOUT_USER','C_ORPHAN_MEMBER_REFERENCE',
                                'D_AMBIGUOUS_USER_MAPPING','E_ASSOCIATION_MISMATCH','F_ALREADY_GLOBAL_COMPATIBLE')),
  'eligibleBackfillCount',   (SELECT count(*) FROM classified WHERE category='A_RESOLVABLE_UNIQUE'),
  'blockingCount',           (SELECT count(*) FROM classified WHERE category IN
                               ('C_ORPHAN_MEMBER_REFERENCE','D_AMBIGUOUS_USER_MAPPING','E_ASSOCIATION_MISMATCH'))
)) AS summary;

-- Row-level exception report (safe metadata only; NO PII columns projected).
-- Uncomment to inspect blocking rows during remediation.
-- SELECT card_id, slug, status, category, card_assoc, member_assoc
-- FROM classified WHERE category IN
--   ('C_ORPHAN_MEMBER_REFERENCE','D_AMBIGUOUS_USER_MAPPING','E_ASSOCIATION_MISMATCH')
-- ORDER BY category, card_id;
