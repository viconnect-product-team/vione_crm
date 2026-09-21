# GRAPH_READ_SERVICE.md — BC-4.1

`RelationshipGraphService` owns registry validation, DTO mapping, redaction,
traversal limits, and telemetry. It requires a viewer id (from
`requireSupabaseAuth`) — anonymous access raises `UNAUTHENTICATED`.

## Read surface

- `getNode(nodeId) → GraphNodeDTO`
- `neighbors(q) → GraphCursorPage<GraphNeighborDTO>`
- `mutualConnections(q) → GraphCursorPage<GraphMutualDTO>`
- `sharedCompanies(q)` / `sharedAssociations(q)` / `sharedCommunities(q)`
- `shortestPath(q) → GraphPathDTO`

## Semantics

- Validates all `edgeKinds` / `nodeKinds` / `direction` against the registry.
- Applies redaction via `mapNode` / `mapEdge` (metadata allowlists per
  registry entry).
- Hidden nodes/edges collapse to `NODE_NOT_FOUND` / `PATH_NOT_FOUND` — the
  service never signals that a hidden thing exists.
- `shortestPath` uses bounded BFS (depth ≤ 4, fan-out ≤ 50) with cycle
  protection via visited map. Fan-out over the cap is truncated (telemetry:
  `graph_query_truncated`) and never leaked to callers.
- Telemetry never carries names/emails/PII/raw metadata.

## Deferred

`connect`, `disconnect`, `recommend`, `strength`, timeline writes — BC-4.2+.
