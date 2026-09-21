# BC-9.1 Turn B2b-iii — Receipt Finalization

Every receipt claimed in a tick reaches exactly one terminal status via
the B2a claim-token guarded finalize RPCs.

## Deterministic status classification

Let `V` = validated+resolved candidates, `R` = rejected candidates,
`S` = candidates that reached any successful merge outcome
(`creates_new | duplicate | supports_existing | enriches_existing |
conflicts_existing | superseded`), `F` = candidates whose apply RPC threw.

| Condition                                                                                      | Final status             | Finalize RPC                                  |
| ---------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------- |
| Source loader / extractor threw a `SOURCE_*` / `EXTRACTOR_NOT_FOUND` / `EXCLUDED_SOURCE`       | `skipped`                | `skip_relationship_memory_extraction_receipt` |
| Source loader / extractor threw a `CANDIDATE_INVALID` / `EXTRACTOR_OUTPUT_INVALID` / invariant | `failed` (non-retryable) | `fail_relationship_memory_extraction_receipt` |
| Source loader / extractor threw a transient / infra code                                       | `failed` (retryable)     | `fail_…`                                      |
| `V = 0` and `R = 0` (nothing to emit)                                                          | `skipped`                | `skip_…`                                      |
| `S > 0` and (`F > 0` or `R > 0`)                                                               | `partial`                | `complete_…` with `partial=true`              |
| `S = V` and no failures                                                                        | `completed`              | `complete_…` with `partial=false`             |
| `S = 0` and `V > 0` (all candidates failed)                                                    | `failed` (retryable)     | `fail_…`                                      |

## Claim-token contract

- Every finalize call passes `(receiptId, claimToken)`.
- If `applied=false`, the runtime raises
  `RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM` and **never** retries with a
  different token — the lease is left to expire.
- Terminal receipts cannot be reclaimed: the claim RPC filters
  `status = 'pending'` (or expired-lease equivalents).

## Attempt policy

Attempt increments live on the DB row (`attempt_count`) and are updated
inside the finalize RPC. The worker does not manage its own attempt
counter; it only reports the effective attempt as `receipt.attemptCount + 1`
for observability. Attempt-cap terminality is enforced by the finalize RPC
per B2a policy.
