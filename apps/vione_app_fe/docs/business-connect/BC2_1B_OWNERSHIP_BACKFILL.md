# BC-2.1B — Deterministic Business Card Ownership Backfill

**Slice:** BC-2.1B · **Architecture:** Business Connect v1 (Frozen)
**Type:** Data migration + verification only. No cutover, no RLS/UI/public change.

## Objective

Populate `member_business_cards.owner_user_id` **only** for cards whose
ownership is provable via a unique, valid, association-consistent
member → user mapping. Everything else stays legacy/unresolved.

## What shipped

### Schema (BC-2.1A, already present)

- `member_business_cards.owner_user_id uuid NULL` (FK `auth.users ON DELETE SET NULL`)
- Indexes: `mbc_owner_idx`, `mbc_owner_status_idx`, `mbc_owner_assoc_idx`, `mbc_pub_slug_status_idx`

### Tracker tables (BC-2.1B)

- `business_card_ownership_backfill_runs` — one row per execution:
  `migration_version, status, preflight_summary(jsonb), eligible_count,
updated_count, skipped_count, exception_count, started_at, completed_at`.
- `business_card_ownership_backfill_items` — per-card assignment record for
  isolated rollback: `run_id, card_id, prior_owner_user_id,
assigned_owner_user_id, classification, action`.
- **RLS:** platform-admin read only (`is_platform_admin()`); no anon; ordinary
  authenticated users cannot read. `service_role` full. Append-only in practice.

### Functions (SECURITY DEFINER, platform-admin guarded, `EXECUTE` revoked from PUBLIC)

- `run_business_card_ownership_backfill(_version text) → jsonb`
  1. Authorizes caller (`is_platform_admin()`).
  2. Snapshots preflight summary (BC-2.0 classifier).
  3. Selects eligible cards (category A only) into a temp table.
  4. Creates the run record.
  5. Updates `owner_user_id = members.user_id` with `WHERE owner_user_id IS NULL`
     - association match; records each assignment as an item row.
  6. Asserts `updated == eligible` — otherwise `RAISE EXCEPTION` aborts the txn.
  7. Completes the run with final counters.
- `rollback_business_card_ownership_backfill(_run_id uuid) → jsonb`
  Clears `owner_user_id` only where the run assigned it AND the current value
  still equals the assigned value (unchanged since migration). Marks run
  `rolled_back`. Never touches manual reassignments, `member_id`, or
  `association_id`.

## Eligibility (category A — RESOLVABLE_UNIQUE)

All must hold:

- `card.owner_user_id IS NULL`
- `card.member_id` non-null and member exists
- `member.user_id` non-null (FK guarantees the auth user exists)
- `card.association_id = member.association_id`
- the (`user_id`, `association_id`) mapping is **unique** (no other member)

Never weakened to raise migrated counts. C/D/E/unknown are never backfilled.

## Resolver (unchanged from BC-2.1A)

Priority `owner_user_id → unique legacy member → unresolved`. Populated rows
resolve `global_user`; valid legacy rows resolve `legacy_member`; ambiguous/
unlinked resolve `unresolved`. No association-admin fallback. Public DTO forces
`ownerUserId: null`.

## RLS

No owner-priority RLS in this slice. Legacy policies remain authoritative;
`owner_user_id` grants no access on its own. Deferred to BC-2.1C/D.

## Idempotency

Rerun changes nothing already populated, creates no duplicate assignment rows
for unchanged cards, and returns `updatedCount = 0` on a clean rerun.

## Tests

- `src/__tests__/business-card-ownership.bc21b.test.ts` — 18 cases covering
  classification (A–F), backfill, no-overwrite, idempotency, rollback isolation,
  manual-change preservation, resolver priority, DTO guarantee, no fabrication.
- Plus BC-2.1A (5) and identity-bridge contract (14) remain green.
- SQL classifier verified against transactional fixtures (see execution report).

## Known limitations / deferred to BC-2.1C

- Owner-priority RLS policies (owner-based authorization).
- `createBusinessCardFn` populating `owner_user_id` on new cards.
- Legacy `member_id`/`association_id` path removal (BC-11).
