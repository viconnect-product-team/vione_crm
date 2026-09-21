# BC-9.1 Turn B3 — Graph Traversal Security

Implementation: `graph-context.server.ts`.

## Frozen bounds

- `RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH = 2`
- `RELATIONSHIP_MEMORY_GRAPH_MAX_NODES = 100`
- Caller-supplied `maxDepth` / `maxNodes` clamped via `Math.min(...)` before traversal.
- Per-node edge fetches use a bounded `SELECT ... LIMIT` derived from remaining node budget.

## Authorization

- Every read passes through the request-scoped Supabase client — RLS scopes to `owner_user_id = auth.uid()`.
- Root memory not visible → traversal returns `{ nodes: [], nodeCount: 0 }` (fail-closed without leaking existence).
- Cross-owner edges cannot cross the RLS boundary; they are silently dropped.
- No caller-controlled SQL / Cypher / recursive CTE / graph DSL.

## Structural guarantees

- BFS with visited set → cycles and self-loops terminate.
- Duplicate edges deduplicated per `(source_memory_id, target_memory_id, kind)` — cannot inflate score.
- Depth 0 = root; depth > `maxDepth` short-circuited.

## Errors

- Root fetch error → `RELATIONSHIP_MEMORY_RETRIEVAL_FAILED`.
- Invalid input → `RELATIONSHIP_MEMORY_INVALID_INPUT` / Zod rejection at server function.
- Any budget breach maps to `RELATIONSHIP_MEMORY_GRAPH_LIMIT_EXCEEDED`.

## Advisory-only

Graph traversal is read-only. No mutation is possible through this path.
