# BC-2.1B — Exception Report

**Date:** 2026-07-13 · **Run version:** `BC-2.1B`

Safe, PII-free listing of cards that could NOT be backfilled and the required
remediation. No names, emails, phones, tax codes or private card fields.

## Production exceptions

**None.** Production contains 0 cards; there are no exceptions to report.

## Reason code reference

| Reason code                 | Meaning                                          | Required remediation                        |
| --------------------------- | ------------------------------------------------ | ------------------------------------------- |
| `MEMBER_WITHOUT_USER`       | Card's member has no linked platform user        | Link member → user, then re-run backfill    |
| `ORPHAN_MEMBER_REFERENCE`   | Card `member_id` points to a missing member      | Repair/repoint `member_id`, then re-run     |
| `AMBIGUOUS_USER_MAPPING`    | User linked to >1 member in the same association | Deduplicate member records, then re-run     |
| `ASSOCIATION_MISMATCH`      | Card association ≠ member association            | Correct association assignment, then re-run |
| `UNKNOWN`                   | Uncategorized anomaly                            | Manual investigation                        |
| `EXISTING_OWNER_PRESERVED`  | `owner_user_id` already set                      | None — intentionally never overwritten      |
| `CONCURRENT_CHANGE_SKIPPED` | Row changed during the run                       | Re-run backfill (idempotent)                |

## Notes

Exceptions remain **legacy** or **unresolved** and continue to work unchanged.
No ownership is ever guessed. Remediation is manual and out of scope for
BC-2.1B; a backlog entry is tracked in the Risk Register.
