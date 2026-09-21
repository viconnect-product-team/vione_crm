# BC-2.0 — Additive Schema & Deterministic Backfill Design

**Design only. Do not apply in BC-2.0.** Applied in BC-2.1 after Gate C.

## Schema (additive)

```sql
-- Additive column, nullable. NEVER NOT NULL in this phase.
ALTER TABLE public.member_business_cards
  ADD COLUMN IF NOT EXISTS owner_user_id uuid NULL;

-- FK strategy: match project convention (members.user_id → auth.users ON DELETE ...).
-- Recommend NO hard FK to auth.users from an app table where cross-schema FK adds
-- coupling; instead validate via trigger/RLS. If project convention prefers FK,
-- use: REFERENCES auth.users(id) ON DELETE SET NULL  (never CASCADE — a deleted
-- user must not delete a card that association moderation may still need).

-- Indexes (assess & create in BC-2.1):
CREATE INDEX IF NOT EXISTS mbc_owner_idx            ON public.member_business_cards (owner_user_id);
CREATE INDEX IF NOT EXISTS mbc_owner_status_idx     ON public.member_business_cards (owner_user_id, status);
CREATE INDEX IF NOT EXISTS mbc_owner_assoc_idx      ON public.member_business_cards (owner_user_id, association_id);
-- Public slug/status path already covered by unique(slug); add partial if needed:
-- CREATE INDEX mbc_pub_idx ON public.member_business_cards (slug)
--   WHERE status='published' AND public_mode='public';
```

**Do NOT** add `NOT NULL`, remove `member_id`, or remove `association_id`.

### Additive moderation columns — **DEFERRED** to BC-2.x

`association_moderation_status`, `association_moderation_reason`,
`association_moderated_at`, `association_moderated_by`. Ownership and moderation
must remain separate (ADR-BC-006). Not required for the ownership cutover, so
defer to keep BC-2.1 minimal.

### `ownership_mode` column — **NOT stored**

Derived at read time from `owner_user_id` presence (see dual-read resolver).
Storing it would create a second source of truth that can drift. Deriving is
strictly better here.

## Migration-run record

Create `bc_ownership_migration_runs` (or reuse existing migration-run pattern) to
mark which `owner_user_id` values were written by the automated backfill, so
rollback can isolate them from later manual remediation:

```sql
CREATE TABLE public.bc_ownership_migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- GRANT SELECT, INSERT ON ... TO service_role; RLS: platform-admin only.
```

## Deterministic backfill (BC-2.1)

```sql
-- Backfill ONLY category A (RESOLVABLE_UNIQUE). Idempotent, no overwrite.
WITH eligible AS (
  SELECT c.id AS card_id, m.user_id
  FROM public.member_business_cards c
  JOIN public.members m ON m.id = c.member_id
  WHERE c.owner_user_id IS NULL                 -- no overwrite
    AND m.user_id IS NOT NULL                   -- valid user
    AND c.association_id = m.association_id      -- assoc match required
    AND NOT EXISTS (                            -- uniqueness: not ambiguous
      SELECT 1 FROM public.members d
      WHERE d.user_id = m.user_id
        AND d.association_id = m.association_id
        AND d.id <> m.id
    )
)
UPDATE public.member_business_cards c
SET owner_user_id = e.user_id, updated_at = now()
FROM eligible e
WHERE c.id = e.card_id
RETURNING c.id, e.user_id;  -- capture affected rows → insert into migration-run record
```

Properties: **idempotent** (`owner_user_id IS NULL` guard), **no overwrite**,
**association match required**, **unique user required**, **exact affected count**
via `RETURNING`, **no created_by/admin fallback**, **no guessed owner**.
Run the preflight before and after; store pre/post exception reports.

## Rollback (isolated)

```sql
-- Clears ONLY values written by this migration; never touches manual remediation.
UPDATE public.member_business_cards c
SET owner_user_id = NULL, updated_at = now()
FROM public.bc_ownership_migration_runs r
WHERE c.id = r.card_id
  AND c.owner_user_id = r.owner_user_id;   -- unchanged since write → safe to clear
DELETE FROM public.bc_ownership_migration_runs;  -- or mark rolled_back_at
```

If `owner_user_id` was changed after the run (manual remediation), the
`c.owner_user_id = r.owner_user_id` predicate skips it — remediation preserved.
