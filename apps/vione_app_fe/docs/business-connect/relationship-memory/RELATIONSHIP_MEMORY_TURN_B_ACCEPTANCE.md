# BC-9.1 Turn B — Final Acceptance Report

**Status:** CLOSED / GO ✅

## Scope delivered

- **B1** — extraction domain skeleton, receipts, deterministic normalization, entity resolution, worker skeleton (STOP + GO).
- **B2a** — atomic claim RPCs (`SKIP LOCKED`, `claim_token`, `row_version`).
- **B2b-i** — safe source DTOs + loaders + deterministic extractors, private-note structural gate.
- **B2b-ii** — candidate persistence, merge classifier, provenance, links, supersession.
- **B2b-iii** — full deterministic worker + receipt finalization.
- **B2c** — embeddings (1536-dim OpenAI small via provider adapter), hybrid retrieval, graph context, BC-9.0 integration adapter.
- **B3** — final security / provider failure / concurrency / leakage / prompt-injection / query-privacy / performance / observability / scheduler / operations verification.

## Test totals

- 275 tests passing across 10 files (`src/__tests__/relationship-memory-*`).
- B3 adds 92 focused proofs:
  - 52 structural / security proofs (`b3-structural`)
  - 27 runtime / failure / bounds proofs (`b3-runtime`)
  - 13 authorization / context / leakage proofs (`b3-security`)

## Frozen bounds re-confirmed

- Search: default 20, max 100, candidate pool 200, min similarity 0.55.
- Graph: depth 2, nodes 100.
- BC-9.0 context: ≤ 20 candidates, ≤ 8 facts per capability.
- Worker: batch 50, claim TTL 5 min, attempts 5, provider timeout 15 s.
- Embedding: 1536 dims, frozen profile `relationship_memory_semantic_v1`.

## Hard guarantees re-verified

- Private notes structurally excluded (allowlist regex over every RM `.ts` + DB CHECK).
- Public SDK is 5 read-only methods; no worker/apply/persistence symbols leaked from the barrel.
- No RM runtime writes to canonical business tables; no send/submit/schedule/approve/introduce/notify RPCs.
- Retrieval never returns vectors, distances, owner ids, tokens, or raw source content.
- Every server function uses `requireSupabaseAuth`; viewer identity cannot be widened by input.
- Failures degrade closed; sibling surfaces + tenants remain isolated.

## Non-blocking debt

- Live-PostgreSQL RLS + HNSW proofs are NOT RUN in this turn (JS-only sandbox). Runbook + expected plans documented in `RELATIONSHIP_MEMORY_POSTGRES_VERIFICATION_B3.md` and `RELATIONSHIP_MEMORY_QUERY_PLANS_B3.md`.

## Gate

**BC-9.1 Turn B — CLOSED / GO ✅**
