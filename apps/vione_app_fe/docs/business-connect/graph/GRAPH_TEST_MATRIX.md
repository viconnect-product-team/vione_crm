# GRAPH_TEST_MATRIX.md — BC-4.1

## Deterministic unit

- `src/__tests__/graph-registry.bc41.test.ts`
  - Manifest loads, stable hash, all frozen v1 kinds present
  - Every inverse is symmetric
  - Edge kinds reference only registered node kinds
  - Registry entries are frozen (no runtime mutation)
  - Node metadata allowlist enforced (`displayName` kept, `email`/`secretNote` dropped)
  - Edge metadata allowlist enforced (`role`/`isCurrent` kept, `salary`/`privateNote` dropped)
  - `GraphError` carries stable code and never leaks SQL keywords

## RLS (asserted at the migration level)

- `graph_nodes` / `graph_edges` — RLS enabled + FORCED, no `anon` grants,
  no authenticated write policies.
- Helper functions revoke PUBLIC EXECUTE.
- `graph_can_read_node` fails closed on: missing viewer, archived,
  `system` visibility, unknown kind, cross-tenant.

## Regression (already green pre-slice)

- Business Card BC-2.x suites
- Saved Card BC-3.x suites
- Identity + Bridge suites
- Business Connect UI shards (5)
- Anon-exposure / RLS ownership suites
