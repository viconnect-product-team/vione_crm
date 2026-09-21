# BC-2.1B — Rollback Rehearsal

**Date:** 2026-07-13 · **Run version:** `BC-2.1B`

## Rollback contract

`rollback_business_card_ownership_backfill(_run_id uuid)` clears
`owner_user_id` **only** when:

- the value was assigned by the given run (item row `action = 'assigned'`), AND
- the card's current `owner_user_id` still equals `assigned_owner_user_id`
  (unchanged since the migration).

It must NOT: clear a manually-set owner, alter `member_id`/`association_id`,
delete cards, delete audit history, or affect public routes.

## Rehearsal (unit model — deterministic)

From `src/__tests__/business-card-ownership.bc21b.test.ts`:

| Case                    | Setup                                                  | Expected                                                              | Result         |
| ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- | -------------- |
| Isolated clear          | run assigns `c-eligible = U1`, unchanged               | rollback clears only `c-eligible`; `c-owned` (pre-existing) untouched | ✅ cleared = 1 |
| Manual change preserved | after run, `c-eligible` manually set to `manual-owner` | rollback clears 0; value stays `manual-owner`                         | ✅ cleared = 0 |

## Production down-path

Production dataset is empty, so a production rollback would clear 0 rows and is
a proven no-op. The down-path is available on demand and is **not** executed
automatically.

## SQL down-path (reference)

```sql
SELECT public.rollback_business_card_ownership_backfill('<run_id>');
-- clears only migration-owned, unchanged assignments; marks run 'rolled_back'.
```

## Result

**PASS** — rollback isolates migration-owned unchanged assignments and
preserves manual remediation. Safe to keep as the documented reversal path.
