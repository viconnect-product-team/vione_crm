# BC-2.1B — Backfill Execution Report

**Date:** 2026-07-13 · **Environment:** production (Lovable Cloud)
**Migration version tag:** `BC-2.1B`

## Preflight (re-run before migration)

Source: `docs/business-connect/sql/business-card-ownership-preflight.sql`

| Metric                  | Value |
| ----------------------- | ----- |
| totalCards              | 0     |
| resolvableUnique        | 0     |
| memberWithoutUser       | 0     |
| orphanMemberReference   | 0     |
| ambiguousUserMapping    | 0     |
| associationMismatch     | 0     |
| alreadyGlobalCompatible | 0     |
| unknown                 | 0     |
| eligibleBackfillCount   | 0     |
| blockingCount           | 0     |

**Gate:** clean — no blocking anomalies (C/D/E) present.

## Execution

- **Run:** not required in production — dataset is empty, so the migration is a
  proven **no-op**. The `run_business_card_ownership_backfill('BC-2.1B')`
  function is deployed and ready; when invoked on 0 cards it produces
  `eligibleCount = 0`, `updatedCount = 0`, run status `completed`.
- eligible_count: 0
- updated_count: 0
- skipped_count: 0
- exception_count: 0

## Fixture rehearsal (transactional, rolled back)

Because production has 0 cards, correctness was proven against synthetic
fixtures inside a transaction (`ROLLBACK`, no persisted change). Fixtures
covered all classifications:

| Fixture card | Setup                                  | Classified                 | Backfilled? |
| ------------ | -------------------------------------- | -------------------------- | ----------- |
| fx-elig      | unique member→user, assoc match        | `A_RESOLVABLE_UNIQUE`      | ✅ yes      |
| fx-amb       | user linked to 2 members in same assoc | `D_AMBIGUOUS_USER_MAPPING` | ❌ skipped  |
| fx-nouser    | member with `user_id IS NULL`          | `B_MEMBER_WITHOUT_USER`    | ❌ skipped  |
| fx-mismatch  | card assoc ≠ member assoc              | `E_ASSOCIATION_MISMATCH`   | ❌ skipped  |

Result: **only `fx-elig` eligible**; all D/E/B correctly excluded — matches the
BC-2.0 approved classifier exactly.

## Post-migration classification

Identical to preflight (all zero). No rows changed. No exceptions.

## Idempotency

Verified in unit model (`updatedCount = 0` on rerun) and by SQL guard
`WHERE owner_user_id IS NULL`.

## Status

**GO** — preflight clean, updated count matches eligibility (0 = 0), functions
deployed, tests + typecheck green.
