# BC-9.1 Turn B2c — Embeddings, Hybrid Retrieval, Graph Context, BC-9.0 Wiring

**Status: CLOSED / GO ✅**

## Scope

- Frozen embedding profile `relationship_memory_semantic_v1` (1536 dims, cosine).
- Deterministic safe embedding input builder + FNV-1a content hash.
- Server-only provider abstraction with strict allowlist and private-first policy.
- Async lifecycle (enqueue → generate → stale-sweep) via service role.
- Hybrid retrieval combining structured predicates, semantic candidate pool,
  and deterministic ranking (semantic + subject/scope specificity + freshness
  - verification + graph support).
- Owner-scoped graph traversal (depth ≤ 2, ≤ 100 nodes).
- BC-9.0 context adapter emitting `relationship_memory` safe facts only.
- Public SDK extended read-only surface: `searchMemories`,
  `listRelevantMemories`, `getMemoryGraphContext`.

## Frozen constants

| Constant                      | Value                             |
| ----------------------------- | --------------------------------- |
| `EMBEDDING_PROFILE_ID`        | `relationship_memory_semantic_v1` |
| `DIMENSIONS`                  | 1536                              |
| `METRIC`                      | cosine                            |
| `INPUT_VERSION`               | 1.0.0                             |
| `MAX_INPUT_CHARS`             | 4000                              |
| `PROVIDER_TIMEOUT_MS`         | 15000                             |
| `MAX_ATTEMPTS`                | 5                                 |
| `SEARCH_LIMIT_DEFAULT`        | 20                                |
| `SEARCH_LIMIT_MAX`            | 100                               |
| `SEMANTIC_CANDIDATE_POOL_MAX` | 200                               |
| `SEMANTIC_MIN_SIMILARITY`     | 0.55                              |
| `QUERY_MAX_CHARS`             | 400                               |
| `GRAPH_MAX_DEPTH`             | 2                                 |
| `GRAPH_MAX_NODES`             | 100                               |

## Files

Client-safe:

- `embedding-profile.ts`, `embedding-input.ts`, `embedding-eligibility.ts`
- `search-dto.ts`, `retrieval-hybrid.ts`
- `sdk.ts` (extended), `index.ts` (barrel updated)

Server-only:

- `embedding-provider.server.ts`
- `embedding-lifecycle.server.ts`
- `retrieval.server.ts`
- `graph-context.server.ts`
- `query-embedder.server.ts`
- `search.functions.ts` (authenticated server functions)
- `intelligence/relationship-memory-context.server.ts` (BC-9.0 adapter)

Migration: `business_relationship_memory_embeddings` table with
`vector(1536)`, HNSW cosine index, `FORCE ROW LEVEL SECURITY`, owner-only
metadata reads, service-role-only writes, and identity-tuple unique index.

## Security guarantees

- Vectors and raw source content never surface in DTOs.
- Client-safe barrel exports no `.server` / `.functions` modules.
- Structural block on `business_meeting_private_notes` outside the frozen
  eligibility/registry allowlist (enforced by test).
- Protected data requires a `local_private` adapter (or explicit managed
  approval flag).
- Query text truncated to 400 chars; dimension mismatches raise typed errors.

## Tests

`src/__tests__/relationship-memory-b2c.bc91.test.ts` — 45 tests covering:
frozen registry, deterministic input hashing, eligibility, staleness,
provider abstraction, hybrid ranking, retrieval boundaries, graph limits,
BC-9.0 context adapter, SDK freeze, and structural security gates.

All 183 relationship-memory tests pass. `tsgo --noEmit` clean.
