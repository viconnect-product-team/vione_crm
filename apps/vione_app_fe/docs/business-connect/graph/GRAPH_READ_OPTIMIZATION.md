# GRAPH_READ_OPTIMIZATION — BC-4.4

## What changed

- **`RelationshipGraphRepository.batchNeighborIds(nodeIds, opts)`**
  Bulk neighbor lookup for many source nodes in one round trip, RLS
  preserved. Result is a `Map<nodeId, string[]>` with per-node fan-out
  capped by `perNodeCap` (default `REPO_LIMITS.maxPathFanOut = 50`).
- **`RelationshipGraphService.shortestPath`** now runs BFS _per depth
  level_ using `batchNeighborIds`, replacing the previous N+1 loop over
  the queue. Cycle protection, depth cap, and fan-out truncation
  telemetry are unchanged.
- **`RecommendationService`** uses `batchNeighborIds` for both mutual
  candidate generation (second-degree) and shared-context expansion
  (people in each shared company / association / community).

## What is deliberately NOT changed

- Mutual-connections and shared-node reads still perform a two-side
  neighbor fetch + in-memory intersection. The intersection is bounded
  by `REPO_LIMITS.maxLimit` and the current queries already return
  under one round trip per side; a DB-side intersection would require a
  new RPC and is deferred until measurements justify it.

## Guardrails preserved

- All queries remain viewer-scoped and RLS-filtered.
- Total row fetch per `batchNeighborIds` call is bounded by
  `min(2000, nodeIds.length * perNodeCap * 2)`.
- Errors are still normalized to `GraphError("INTERNAL_ERROR")`; no
  SQL or RLS detail leaks.
