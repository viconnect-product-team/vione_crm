# BC-9.1 Turn B3 — BC-9.0 Context Safety

Adapter: `intelligence/relationship-memory-context.server.ts`.

## Per-capability limits (frozen)

- Retrieval candidates ≤ 20.
- Final memories per capability ≤ 8 (deduped, sensitivity-filtered).
- Deterministic ordering: `relevanceScore DESC`, then `lastObservedAt DESC`, then `id ASC`.

## Authority

- Viewer identity flows from `requireSupabaseAuth` into the underlying `RelationshipMemorySDK` — the adapter does not accept a `viewerUserId` argument and cannot widen scope.
- Capability + sensitivity ceiling are chosen by the calling capability builder (server-side), never by user input.
- Adapter is read-only (no `.insert/.update/.delete/.upsert/.rpc` — verified structurally in `relationship-memory-b3-security` test).

## Data envelope

Facts emitted contain: `factId`, `sourceDomain=relationship_memory`, `sourceRef`, `summary`, `confidence`, `recordedAt`, `subjectType`, `subjectRef`, `memoryKind`, `relevanceScore`, `relevanceBand`, `freshness`, `historical`.

Facts NEVER contain: raw vectors, provider metadata, `ownerUserId`, `tenantId`, `claimToken`, raw source body, hidden source id.

## Failure semantics

Retrieval failure fails **closed**: builders receive an empty facts array + `omitted` counters — never a fallback to unrestricted repository reads.

## Labels

- Superseded / expired facts are excluded from the current-mode envelope.
- Historical facts (when explicitly requested) carry `historical: true`.
- Low-confidence facts remain but retain their raw confidence for downstream policy.
- Unresolved conflicts stay labeled via the search result's `conflictState`.
