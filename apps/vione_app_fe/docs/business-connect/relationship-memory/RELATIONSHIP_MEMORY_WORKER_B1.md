# BC-9.1 Turn B1 — Extraction Worker Skeleton

Service-role only. Not exported to any client-safe barrel.

## Guarantees

- Bounded per-tick batch (`MAX_SOURCES_PER_CLAIM = 25`).
- Bounded per-batch candidates (`MAX_CANDIDATES_PER_BATCH = 100`).
- Bounded per-source candidates (`MAX_CANDIDATES_PER_SOURCE = 20`, capped
  further by the extractor's `maxCandidates`).
- Per-source failure does not block the batch — each receipt is updated in
  isolation.
- Executor calls run with a wall-clock timeout (extractor-declared).
- No provider I/O inside a DB transaction — receipts are claimed, the
  executor runs outside the transaction, and lifecycle updates are separate
  statements.
- Candidates above the extractor's declared visibility ceiling are dropped
  before persistence.

## SKIP LOCKED

B1 ships the TypeScript worker + receipts repository. The actual
`SELECT ... FOR UPDATE SKIP LOCKED` runs inside a SECURITY DEFINER RPC that
lands in Turn B2, letting multi-worker deployment be a config change instead
of a code change. The Turn B1 claim path is safe for single-worker
deployment.

## Failure modes

| Cause                                     | Receipt result                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Excluded source domain / hard-blocked ref | `skipped`                                                                            |
| Candidate fails validation                | dropped; receipt `partial` if any candidate remains, else `completed` with count `0` |
| Executor throws / times out               | `attempt_count += 1`; `failed` after cap                                             |
| Structurally invalid extractor id         | throws before claim                                                                  |

## What B1 does NOT include

- Persistence of validated candidates into `business_relationship_memories`
  (Turn B2 — merge classification decides create/support/enrich/conflict).
- Model-assisted extractor bodies.
- Embedding generation.
- Semantic / hybrid retrieval.
- BC-9.0 memory context integration.
- UI.
