# BC-2.0 — Card Data Classification

Every `member_business_cards` row must resolve to exactly one category.
Classifier: `docs/business-connect/sql/business-card-ownership-preflight.sql`
(read-only, idempotent, rerunnable, platform-admin/service-role only).

## Categories

| Code | Category                    | Definition                                                                                                                               | Disposition                               |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| A    | `RESOLVABLE_UNIQUE`         | member exists; `member.user_id` non-null (FK guarantees auth user exists); `card.association_id = member.association_id`; mapping unique | **Eligible** for `owner_user_id` backfill |
| B    | `MEMBER_WITHOUT_USER`       | member exists; `member.user_id IS NULL`                                                                                                  | Remain legacy-member-owned                |
| C    | `ORPHAN_MEMBER_REFERENCE`   | `member_id` does not resolve to a member row                                                                                             | **Block** auto backfill                   |
| D    | `AMBIGUOUS_USER_MAPPING`    | same `user_id` maps to >1 member in same association → ownership not provably unique                                                     | **Block** — manual resolution             |
| E    | `ASSOCIATION_MISMATCH`      | `card.association_id <> member.association_id`                                                                                           | **Block** — security blocker              |
| F    | `ALREADY_GLOBAL_COMPATIBLE` | `owner_user_id` present and valid (post-column)                                                                                          | Already migrated; no action               |
| G    | `UNKNOWN`                   | matches none of the above                                                                                                                | **Block** — investigate                   |

## Rules

- FK `members.user_id → auth.users(id)` guarantees referenced auth user exists,
  so a non-null `user_id` implies a live user (no cross-schema `auth.users` read
  is required — `psql` cannot read the `auth` schema).
- Blocking categories: **C, D, E, G**. `eligibleBackfillCount = |A|`.
  `blockingCount = |C| + |D| + |E| + |G|`.
- No PII columns projected in the exception report — only `card_id`, `slug`,
  `status`, `category`, and association IDs.

## Current measurement (2026-07-13)

All categories = **0** (totalCards = 0). Clean slate; backfill is a no-op.
Re-run immediately before BC-2.1.
