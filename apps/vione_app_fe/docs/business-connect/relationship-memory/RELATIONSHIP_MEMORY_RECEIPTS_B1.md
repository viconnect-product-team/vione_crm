# BC-9.1 Turn B1 — Extraction Receipts

## Table

`public.business_relationship_memory_extraction_receipts`

| Column                               | Purpose                                                               |
| ------------------------------------ | --------------------------------------------------------------------- |
| `owner_user_id`                      | Owner scope (FK `auth.users`).                                        |
| `source_domain`                      | CHECK-restricted to allowlisted safe domains.                         |
| `source_record_id`                   | Source identity within the domain.                                    |
| `source_version`                     | Bumps drive re-extraction.                                            |
| `extractor_id` / `extractor_version` | Which extractor ran.                                                  |
| `status`                             | `pending`, `processing`, `completed`, `partial`, `failed`, `skipped`. |
| `candidate_count`                    | Number of validated candidates persisted.                             |
| `attempt_count`                      | Bounded by `MAX_ATTEMPTS_PER_RECEIPT` (3).                            |
| `last_error`                         | Redacted failure summary.                                             |
| `claimed_at` / `completed_at`        | Lifecycle audit trail.                                                |

Unique on `(owner_user_id, source_domain, source_record_id, extractor_version)`.

## Idempotency identity

`extractionIdempotencySignature({...})` is the deterministic string signature
used for logging and metrics. The DB unique index is the enforcement point:
replayed sources converge on the same receipt row.

## Access

- Owners can read their own receipts.
- Only `service_role` can insert/update/delete (extraction worker).

## Lifecycle

`pending → processing → { completed | partial | failed | skipped }`

- `failed` is set when `attempt_count` reaches the cap.
- `skipped` is used for structurally excluded sources or invalid candidates;
  it is a terminal, no-retry state.
- The Turn B2 SECURITY DEFINER RPC replaces the update-based claim with
  `SELECT ... FOR UPDATE SKIP LOCKED` so multi-worker deployment is safe.
