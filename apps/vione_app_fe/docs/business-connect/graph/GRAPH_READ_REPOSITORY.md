# GRAPH_READ_REPOSITORY.md — BC-4.1

`RelationshipGraphRepository` is the SOLE persistence gateway.

## Surface

- `getNode(id)`
- `getNodes(ids)`
- `findNodeByExternalRef(kind, refType, refId)`
- `getEdge(id)`
- `listNeighbors({ nodeId, edgeKinds?, nodeKinds?, direction, cursor?, limit? })`
- `neighborIds(nodeId, { edgeKinds?, nodeKinds? })` — bounded helper used by
  mutuals / shared-node / shortest-path service methods.

## Rules

- No business visibility decisions (RLS + Service handle that).
- No product-specific semantics.
- Cursor pagination uses opaque base64(`{ after: <id> }`); invalid cursors
  raise `INVALID_CURSOR`.
- Stable ordering by `id ASC`.
- Limits clamped to `REPO_LIMITS.maxLimit = 100`.
- Fan-out for traversal helpers bounded by `maxPathFanOut = 50`.
- SQL and constraint errors normalized to `GraphError("INTERNAL_ERROR")` —
  no leakage of table names, RLS details, or constraint identifiers.
