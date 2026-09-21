# BC-9.1 Turn B2b-i — Acceptance Gate

**Recommendation:** CLOSED / GO ✅
**Scope shipped:** source & extraction foundation only.

## Files changed / added

- `src/lib/business-connect/relationship-memory/source-dtos.ts` (new)
- `src/lib/business-connect/relationship-memory/source-loaders.server.ts` (new)
- `src/lib/business-connect/relationship-memory/extractors.ts` (new)
- `src/lib/business-connect/relationship-memory/extraction-pipeline.server.ts` (new)
- `src/lib/business-connect/relationship-memory/errors.ts` (+5 codes)
- `src/__tests__/relationship-memory-b2b-i.bc91.test.ts` (new)
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_SOURCE_LOADERS_B2B.md` (new)
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_EXTRACTORS_B2B.md` (new)
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_B2B_I_ACCEPTANCE_GATE.md` (this file)

## Migrations / RPCs

None. Persistence RPCs land in B2b-ii.

## What ships

1. **Seven safe source DTOs** — one Zod schema per approved source domain,
   projecting only extractor-safe fields (no owner id, tenant id, auth ids,
   raw private fields, internal hashes, audit metadata, provider payloads).
2. **Seven authorization-safe loaders** — explicit static queries, ownership
   checks, source-version freshness gate, stable error contract, exhaustive
   dispatcher (`loadSourceForReceipt`).
3. **Seven deterministic extractors** — pure functions with stable ordering
   and per-source candidate cap; explicit facts only; no AI provider I/O.
4. **Extraction pipeline** — validates each candidate against the frozen
   contract, enforces the extractor's declared visibility ceiling, resolves
   subjects through the existing RLS-scoped `resolveSubject`, and returns
   `{ processed, rejected, hadPartialFailure }`. Never persists.

## Contract discipline

| Rule                                                          | Status                          |
| ------------------------------------------------------------- | ------------------------------- |
| Private-note domain unreachable in runtime path               | ✅ regex-guarded test           |
| Client barrel excludes loaders / pipeline / entity-resolution | ✅ regex-guarded test           |
| Extractor id/version integrity enforced                       | ✅ pipeline gate                |
| Memory kind allowlist enforced                                | ✅ pipeline gate                |
| Source domain match required                                  | ✅ dispatcher + pipeline        |
| Visibility ceiling never broadened                            | ✅ pipeline gate                |
| Unresolved subject cannot activate                            | ✅ pipeline drops to `rejected` |
| No autonomous business mutation                               | ✅ pipeline is read-only        |
| No AI / model provider dependency                             | ✅ zero provider imports        |

## Test coverage (this sub-turn)

`src/__tests__/relationship-memory-b2b-i.bc91.test.ts` — 25 assertions across
11 describe blocks covering each extractor, dispatcher exhaustiveness,
candidate contract compliance, pipeline ceiling gate, and structural gates.

## Blocking defects

None.

## Non-blocking debt (tracked for B2b-ii)

- Manual source loader currently emits a minimal placeholder DTO; the
  manual-entry server function (B2b-ii) will populate real payload fields
  during receipt upsert.
- Agenda freshness uses summed item versions — sufficient for B2b-i
  correctness but B2b-ii may swap for an explicit `agenda_revision` counter.
- Business-card loader restricts extraction to the owner in B2b-i; B2b-ii
  extends to authorized viewers via `saved_business_cards`.

## Readiness for B2b-ii

Green. B2b-ii can consume `PipelineResult.processed[]` verbatim under a
claim-token-guarded persistence RPC that owns creates_new / duplicate /
support / enrichment / conflict / supersession.
