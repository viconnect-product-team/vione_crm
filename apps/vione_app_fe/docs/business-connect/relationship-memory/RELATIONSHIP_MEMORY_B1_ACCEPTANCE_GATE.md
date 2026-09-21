# BC-9.1 Turn B1 — Acceptance Gate

## 1. Gate recommendation

**GO ✅** — foundation for extraction, receipts, entity resolution, and
worker orchestration is in place with tests + typecheck green. Embeddings,
retrieval, graph traversal, BC-9.0 integration, and UI are intentionally
deferred (per B1 scope).

## 2. Files changed

Added:

- `src/lib/business-connect/relationship-memory/extractor-registry.ts`
- `src/lib/business-connect/relationship-memory/candidate.ts`
- `src/lib/business-connect/relationship-memory/normalizers.ts`
- `src/lib/business-connect/relationship-memory/entity-resolution.server.ts`
- `src/lib/business-connect/relationship-memory/receipts.server.ts`
- `src/lib/business-connect/relationship-memory/extraction-worker.server.ts`
- `src/__tests__/relationship-memory-b1.bc91.test.ts`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_EXTRACTION_B1.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_B1.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_ENTITY_RESOLUTION_B1.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_RECEIPTS_B1.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_WORKER_B1.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_B1_ACCEPTANCE_GATE.md` (this file)

Modified:

- `src/lib/business-connect/relationship-memory/errors.ts` — added B1 error codes
- `src/lib/business-connect/relationship-memory/index.ts` — barrel exports for
  client-safe B1 pieces (registry, candidate, normalizers)

## 3. Migrations

- `business_relationship_memory_extraction_receipts` table with:
  - Unique `(owner_user_id, source_domain, source_record_id, extractor_version)`
  - CHECK on `source_domain` allowlist + explicit rejection of
    `private_meeting_notes`
  - CHECK on `status` ∈ `{pending, processing, completed, partial, failed, skipped}`
  - `FORCE ROW LEVEL SECURITY` + owner-read policy
  - Writes gated to `service_role`
  - `updated_at` trigger

## 4. Extractor registry

Frozen `RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION = b1.0.0`. Seven
extractors registered (six deterministic, one manual). See
`RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_B1.md`.

## 5. Candidate schema

`RelationshipMemoryCandidate` frozen shape + Zod validator. Rejects raw
UUIDs, hard-blocked table references, and forbidden
`structuredValue` keys (auth/tenant/secret/private_note).

## 6. Normalization

Whitespace / casing / channel / organization / ISO-date / stable
structured-value / `candidateCanonicalKey`. All pure, deterministic.

## 7. Entity resolution

Owner-scoped resolver for `person`, `organization`, `relationship`,
`opportunity`. Exact canonical IDs only; scoped meeting participant lookup
for persons; slug lookup for orgs. Never mints new hidden entities.

## 8. Ambiguous-entity behavior

- Zero matches → `RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED`
- Future multi-match path → `RELATIONSHIP_MEMORY_ENTITY_AMBIGUOUS` (code
  reserved). B1 lookups are exact-only, so ambiguous surfaces as unresolved.
- Candidates with unresolved subjects are dropped or persisted with
  `subjectResolved = false` (never linked to active memory).

## 9. Receipts / idempotency

- DB unique index is the enforcement point.
- `extractionIdempotencySignature()` provides a deterministic string
  identity for logs/metrics.
- Lifecycle: `pending → processing → {completed | partial | failed | skipped}`.
- `MAX_ATTEMPTS_PER_RECEIPT = 3` before terminal `failed`.

## 10. Worker skeleton

- Bounded batch (`MAX_SOURCES_PER_CLAIM = 25`, `MAX_CANDIDATES_PER_BATCH = 100`).
- Per-source failure isolated.
- Extractor timeout enforced (extractor-declared `timeoutMs`).
- Visibility ceiling enforced pre-persistence.
- SKIP LOCKED reserved for a SECURITY DEFINER RPC in Turn B2 — the
  TypeScript worker + repository shape is stable so the swap is drop-in.

## 11. Private-note exclusion

Three-layer gate preserved and extended to B1 files:

- DB CHECK constraint on `source_domain`.
- Runtime `assertSourceDomainEligible` / `assertSourceRefNotBlocked`.
- Structural grep test (both existing Turn A security suite and new B1
  suite) scans every domain source file except `eligibility.ts` /
  `registry.ts` for the forbidden strings. All new B1 files pass.

## 12. Tests

- `relationship-memory-b1.bc91.test.ts` — 22 tests (registry integrity,
  candidate contract, deterministic normalization, receipt idempotency
  identity, structural private-note gate over B1 files).
- `relationship-memory-policy.bc91.test.ts` (Turn A) — 17 tests, green.
- `relationship-memory-security.bc91.test.ts` (Turn A) — 9 tests, green.
- **Total 48/48 passing.**

## 13. Typecheck

`bunx tsgo --noEmit` — clean.

## 14. Documentation

Five B1 docs published under `docs/business-connect/relationship-memory/`
(extraction, extractor registry, entity resolution, receipts, worker) +
this acceptance gate. Turn A docs unchanged.

## 15. Blocking defects

None.

## 16. Non-blocking debt (for B2)

1. Replace update-based `claimBatch` with `SELECT ... FOR UPDATE SKIP LOCKED`
   inside a SECURITY DEFINER RPC (`bc_rm_claim_receipts`).
2. Add `bc_rm_receipt_increment_failure` RPC (fallback path already handles
   its absence gracefully).
3. Actual deterministic extractor bodies (currently `ExtractorExecutor` is
   an abstract shape — B2 wires the concrete implementations).
4. Merge classification writer (`duplicate | supports | enriches | conflicts
| creates_new`) into `business_relationship_memories`.
5. Ambiguous-match resolution path that emits
   `RELATIONSHIP_MEMORY_ENTITY_AMBIGUOUS` from multi-hit lookups.

## 17. B1 gate decision

**CLOSED / GO ✅**.

## 18. Readiness for B2

- Persistence identity is frozen — safe to layer merge classification on top
  of `business_relationship_memories` without schema churn.
- Extractor contract (`ExtractorExecutor`) is stable — B2 concrete extractors
  and model-assisted extractors slot into `runExtractionWorkerOnce` without
  touching the worker skeleton.
- Idempotency identity is DB-enforced — safe to enable multi-worker rollout
  once the SKIP LOCKED RPC ships.
- All B2 additions (embeddings, retrieval, graph traversal, BC-9.0
  integration, runtime/security matrix, UI) remain out of scope until this
  gate is confirmed accepted.
