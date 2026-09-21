# BC-6.0 — Smart Introduction Privacy Model

## Invariants

1. **Viewer-derived source.** `sourcePersonNodeId` is resolved server-side from
   the authenticated `userId` via `graph_nodes(person, user_profile, userId)`.
   Client-supplied source ids are refused.
2. **RLS-only visibility.** Path discovery uses
   `RelationshipGraphRepository.neighborIds` / `batchNeighborIds`, both
   already RLS-filtered. Hidden edges/nodes are never returned.
3. **Zero hidden-topology influence.** The pure engine only receives
   viewer-safe inputs. Its output DTO chain is a subset of the input
   `nodeChain`; the engine cannot reference hidden ids.
4. **Block-first filter.** Person nodes blocked in either direction are
   removed from source neighbours, target neighbours, and 3-hop mid nodes
   before scoring.
5. **Topology indistinguishability.** Hidden target, absent target, and
   target-blocked-by-viewer collapse into `TARGET_NOT_FOUND` /
   `INTRODUCTION_NOT_AVAILABLE`. No error leaks the block direction.
6. **Cursor privacy.** Cursors carry `(version, target, depth, ranking key)`
   only — never a hidden intermediary id.
7. **Reason safety.** Reason DTOs expose `code`, `summaryKey`, `priority`,
   optional viewer-visible `count`/`examples`. Never raw edge ids, node ids
   beyond the resolved path, strengths, or private metadata.

## Errors

`TARGET_NOT_FOUND`, `INTRODUCTION_NOT_AVAILABLE`, `NO_INTRODUCTION_PATH`,
`TARGET_ALREADY_CONNECTED`, `INTRODUCTION_PRIVACY_RESTRICTED`,
`INTRODUCTION_QUERY_INVALID`, `INTRODUCTION_CURSOR_INVALID`,
`INTRODUCTION_VERSION_UNSUPPORTED`, `INTERNAL_ERROR`.
