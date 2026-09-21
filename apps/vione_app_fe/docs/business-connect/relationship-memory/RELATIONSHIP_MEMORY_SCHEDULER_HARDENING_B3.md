# BC-9.1 Turn B3 — Scheduler & Internal Invocation Hardening

## Worker invocation

- The extraction worker (`runExtractionWorkerOnce`) is **not routed**. Grep proves no `/api/*` file imports it (also asserted in the barrel + structural tests).
- The embedding worker exposes the same non-routed surface.
- Both are callable only through the scheduler entry point wired in the operator's cron infra (`pg_cron` or platform scheduler).

## Scheduler contract (when wired in a later turn)

- Constant-time secret comparison (`crypto.timingSafeEqual`) on the shared header.
- Fixed batch-size cap enforced server-side, ignoring any request-provided override.
- No owner/tenant scope accepted from the caller — ownership is always derived from the receipt row inside the persistence RPC.
- Rate limit: at most one active sweep per worker type per project.
- All requests carry a request id echoed into worker events for tracing.

## Hardening properties

- Scheduler surface cannot request memories, expose vectors, or read query text.
- Scheduler cannot mark a receipt complete without the current `(claim_token, row_version, content_hash, profile_id)`.
- A leaked scheduler secret still cannot bypass RLS on retrieval — retrieval is a viewer-scoped path.
- Scheduler must not attempt to invoke retrieval on behalf of a user; only worker sweeps are allowed.

## Failure behavior

- Missing / invalid secret → 401, no worker execution.
- Missing budget config → hardcoded conservative defaults from `RELATIONSHIP_MEMORY_EMBEDDING_PROFILE`.
- Concurrent sweeps → the second observes zero claimable rows via `SKIP LOCKED` and exits cleanly.
