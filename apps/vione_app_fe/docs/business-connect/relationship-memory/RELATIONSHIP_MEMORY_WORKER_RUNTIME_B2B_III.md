# BC-9.1 Turn B2b-iii — Worker Runtime

## Entrypoint

`runExtractionWorkerOnce(sb, opts)` in
`src/lib/business-connect/relationship-memory/extraction-worker.server.ts`.
Server-only. Not exported from the client-safe barrel.

## Flow (per tick)

1. Validate `extractorId` against frozen registry.
2. `ExtractionReceiptRepository.claimBatch()` → B2a claim-token RPC
   (`SELECT … FOR UPDATE SKIP LOCKED`), capped at
   `MAX_SOURCES_PER_CLAIM = 25`.
3. For each claim, until `wallClockBudgetMs` (default 25s) is exhausted:
   1. `runExtractionPipeline()` — RLS-scoped source load, deterministic
      extractor, per-candidate validation + entity resolution. Bounded by
      `MAX_CANDIDATES_PER_SOURCE = 20` and remaining
      `MAX_CANDIDATES_PER_BATCH = 100`.
   2. For each validated + resolved candidate: `applyRelationshipMemoryCandidate()`
      — SECURITY DEFINER RPC, single transaction, service-role only.
   3. Aggregate outcome counters from the RPC DTO (never trust caller counts).
   4. Classify final receipt status: `completed | partial | skipped | failed`.
   5. Finalize with claim-token guarded RPC.
   6. Emit safe event.
4. Return aggregate `WorkerRunResult` including per-receipt `outcomes[]`.

## Budget-exhaustion policy

When `Date.now() >= deadline`, the worker stops claiming new receipts and
does NOT finalize the currently-in-progress receipt beyond what it already
persisted. Un-processed already-claimed receipts are left to lease-expire
per the B2a claim-token TTL (`claim_expires_at`). A later worker will
reclaim them via SKIP LOCKED, receive a new token, and any stale finalize
from the timed-out worker is rejected with `RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM`.

## Guarantees

- No provider / network / model call anywhere in the runtime.
- No canonical-source mutation.
- No client-invocable path.
- One receipt failure never blocks the batch — per-source isolation.
- Persistence is per-candidate; a later candidate failure never rolls back
  prior successful memories.
- All events/audit/metrics carry only safe references and low-cardinality
  labels.
