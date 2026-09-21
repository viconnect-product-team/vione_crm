# BC-9.1 Turn B2b-iii — Retry Policy

`classifyReceiptFailure(code)` in `extraction-worker.server.ts` is the
single mapping from an error code to `{ status, retryable }`.

## Non-retryable → `skipped`

Source is deterministically ineligible for this extractor/version.

- `RELATIONSHIP_MEMORY_EXCLUDED_SOURCE`
- `RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND`
- `RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN`
- `RELATIONSHIP_MEMORY_SOURCE_STALE`
- `RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND`

## Non-retryable → `failed`

Deterministic content / invariant violation. Retrying would recreate the
same failure.

- `RELATIONSHIP_MEMORY_CANDIDATE_INVALID`
- `RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID`
- `RELATIONSHIP_MEMORY_INVALID_MERGE`
- `RELATIONSHIP_MEMORY_UNKNOWN_KIND`
- `RELATIONSHIP_MEMORY_UNKNOWN_SUBJECT`
- `RELATIONSHIP_MEMORY_VISIBILITY_ESCALATION`
- `RELATIONSHIP_MEMORY_SENSITIVITY_DOWNGRADE`
- `RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED`

## Retryable → `failed`

Transient / infra / concurrency conflict. Attempt-cap enforced by the
finalize RPC.

- `RELATIONSHIP_MEMORY_INTERNAL_ERROR`
- `RELATIONSHIP_MEMORY_RECEIPT_CLAIM_CONFLICT`
- `RELATIONSHIP_MEMORY_VERSION_CONFLICT`
- `RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT`
- `RELATIONSHIP_MEMORY_PROVENANCE_CONFLICT`
- `RELATIONSHIP_MEMORY_LINK_CONFLICT`

## Unknown codes

Any unknown code is mapped conservatively to `{ status: "failed",
retryable: true }` so an infrastructure hiccup never becomes permanent —
but the attempt cap in the finalize RPC still terminates repeat failures.

## Stale claim (special)

`RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM` is never retried by the same
worker. It emits a safe metric and the receipt is left to the next
worker that claims it.
