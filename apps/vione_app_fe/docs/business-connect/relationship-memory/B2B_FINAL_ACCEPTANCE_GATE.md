# BC-9.1 Turn B2b — Final Acceptance Gate

**Decision: GO ✅**

Turn B2b (i + ii + iii) delivers the complete deterministic candidate
extraction runtime for the Relationship Memory & Knowledge Graph domain,
without any embedding / semantic retrieval / model-assisted / UI work.

## Slices closed

| Slice   | Focus                                                                 | Tests |
| ------- | --------------------------------------------------------------------- | ----- |
| B2b-i   | source loaders, seven frozen extractors, candidate pipeline           | 28    |
| B2b-ii  | persistence RPC, merge classification, provenance/links, supersession | 31    |
| B2b-iii | worker integration, receipt finalization, structural gates            | 31    |

## Combined Relationship-Memory test totals

| Suite             | Count                                      |
| ----------------- | ------------------------------------------ |
| Turn A — policy   | 17                                         |
| Turn A — security | 9                                          |
| B1                | 22                                         |
| B2a               | (folded into B1 + policy) — 0 net-new file |
| B2b-i             | 28                                         |
| B2b-ii            | 31                                         |
| B2b-iii           | 31                                         |
| **Total**         | **138**                                    |

All 138 green. Typecheck clean.

## Guarantees

- Extraction runtime is server-only, service-role-only, and never
  reachable from the client bundle.
- Private notes cannot enter the runtime — enforced by the source-domain
  allowlist in the runtime AND the `bc_rm_source_reject_private_notes`
  CHECK constraint in the DB.
- Every persistence path is claim-token guarded; stale workers cannot
  overwrite reclaimed receipts.
- No AI provider, no embedding, no external HTTP call inside the runtime.
- Canonical business tables are never mutated by extraction.
- Worker enforces bounded batch (25 receipts), bounded candidates
  (100 per batch, 20 per source), bounded wall clock (25s default),
  bounded per-source extractor timeout.
- Deterministic error → status/retry mapping via
  `classifyReceiptFailure`.
- Events/audit/metrics carry only safe references and low-cardinality
  labels — enforced by `assertSafeWorkerEvent` at emit time.

## Blocking defects

None.

## Non-blocking debt

- Scheduler wiring (cron/internal-invocation) is not delivered in Turn B —
  the worker is a pure server-only function today. Adding a scheduler is
  additive and requires shared-secret authentication + batch-size cap per
  the security document.
- Full multi-worker DB-integration proof (real Postgres) is deferred; the
  concurrency invariants are proven structurally against migration SQL
  (SKIP LOCKED, claim-token equality, active-canonical uniqueness,
  provenance uniqueness).

## Readiness for B2c

Ready. The frozen contracts B2c depends on — extractor registry,
candidate DTO, canonical-key normalization, safe apply result DTO, and
worker outcome counters — are stable and covered by the regression
suite.
