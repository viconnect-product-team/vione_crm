# BC-9.1 Turn B3 — Embedding Concurrency

## DB-enforced guarantees

- Extraction receipt + embedding job claims use `FOR UPDATE SKIP LOCKED` inside `SECURITY DEFINER` RPCs (`claim_relationship_memory_extraction_receipts`, `claim_relationship_memory_embedding_jobs`).
- `claim_token` + `row_version` stamped atomically inside the same statement.
- Every lifecycle-mutating RPC verifies `(row_version, claim_token, content_hash, profile_id)` before transitioning — stale workers cannot complete or fail a reclaimed job.
- `attempt_count` incremented under the same row lock as the transition.
- Terminal states (`archived`) are non-reclaimable — enforced by DB CHECK + RPC.
- Unique `(memory_id, profile_id, input_version, content_hash)` guarantees one logical embedding per memory/profile generation.
- `active_canonical_identity` unique index on `business_relationship_memories` prevents duplicate current-active rows during concurrent apply.

## Invalidation rules

- Memory update → `content_hash` mismatch → completion rejected → embedding forced to `stale`.
- Supersession → `nonCurrentStatuses` filter removes it from retrieval regardless of embedding state.
- Archival → embedding transitions to `archived`; cannot re-enter `ready`.

## Application-side helpers

Application code adds defence-in-depth only. It cannot substitute the DB guarantees.
