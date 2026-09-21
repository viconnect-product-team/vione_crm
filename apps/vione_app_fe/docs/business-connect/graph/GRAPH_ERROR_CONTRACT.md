# GRAPH_ERROR_CONTRACT.md — BC-4.1

All engine errors are `GraphError` with a stable `code`:

```
UNAUTHENTICATED · FORBIDDEN · NODE_NOT_FOUND · EDGE_NOT_FOUND
KIND_NOT_REGISTERED · INVALID_NODE_KIND · INVALID_EDGE_KIND
INVALID_DIRECTION · INVALID_CURSOR · LIMIT_EXCEEDED · DEPTH_EXCEEDED
PATH_NOT_FOUND · CROSS_TENANT_FORBIDDEN · REGISTRY_VERSION_MISMATCH
INTERNAL_ERROR
```

Rules:

- `message` never carries SQL, table names, RLS details, or hidden identifiers.
- Hidden nodes → `NODE_NOT_FOUND` (indistinguishable from truly missing).
- Hidden path → `PATH_NOT_FOUND` (no forbidden-topology leakage).
- Cross-tenant denial → `CROSS_TENANT_FORBIDDEN` only when both endpoints are
  visible; otherwise degrades to `NODE_NOT_FOUND`.
