# BC-2.0 — Migration Runbook (BC-2.1 execution)

Design only in BC-2.0. Execute in BC-2.1 after Gate C.

## Preconditions

1. Re-run `docs/business-connect/sql/business-card-ownership-preflight.sql`.
2. Confirm `blockingCount = 0` (else CONDITIONAL GO: migrate only category A).
3. Snapshot pre-migration exception report.

## Steps

1. **Additive schema** — add `owner_user_id uuid NULL` + indexes
   (`mbc_owner_idx`, `mbc_owner_status_idx`, `mbc_owner_assoc_idx`). No NOT NULL.
2. **Migration-run table** — create `bc_ownership_migration_runs` (platform-admin RLS).
3. **Owner RLS** — add owner-priority policies ALONGSIDE legacy; add
   `owner_user_id IS NULL` guard to legacy write policies.
4. **Backfill** — run the deterministic category-A update; insert affected rows
   into `bc_ownership_migration_runs`.
5. **Post-check** — re-run preflight; assert `alreadyGlobalCompatible` == prior
   `eligibleBackfillCount`; store post exception report.
6. **Dual-read** — extend `resolveBusinessCardOwnerContext` to prefer `owner_user_id`.
7. **Security tests** — run BC2_0_SECURITY_TEST_PLAN (15 cases).

## Rollback

Run isolated rollback from `BC2_0_BACKFILL_DESIGN.md` — clears only
migration-written values; drop owner policies; drop column last (only if fully
reverting). Legacy policies and public policy remain intact throughout.

## Performance preflight

| Query path       | Index used                           | N+1 risk                                        |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| my cards         | `mbc_owner_idx` / legacy `member_id` | none (single query)                             |
| card detail      | PK                                   | children fetched in parallel (existing pattern) |
| slug lookup      | `member_business_cards_slug_key`     | none                                            |
| admin moderation | `member_business_cards_assoc_idx`    | none                                            |
| analytics        | interactions.card_id                 | aggregate per card — OK                         |
| leads            | leads.card_id                        | list per owner — OK                             |
| child relations  | child `card_id` FKs                  | parallelized (`Promise.all`) — no N+1           |

Recommended new indexes are additive; no query regression expected. Current data
volume is 0 rows → negligible impact on first run.

## BC-2.1B execution note (2026-07-13)

Steps 1–4 realized as SQL functions instead of one-shot inline SQL:

- Tracker tables `business_card_ownership_backfill_runs` + `_items` (platform-admin RLS).
- `run_business_card_ownership_backfill(_version)` performs preflight snapshot,
  category-A eligibility, atomic update with `owner_user_id IS NULL` guard + exact
  row-count assertion, and run bookkeeping.
- `rollback_business_card_ownership_backfill(_run_id)` = isolated down-path.
  Production is 0 cards → proven no-op. See BC2*1B*\* reports. Gate result: **GO**.
