# GRAPH_WRITE_ERROR_CONTRACT.md — BC-4.2

All write errors surface as `GraphError` with a stable `code`. Unknown DB
messages collapse to `INTERNAL_ERROR` — never leaked verbatim.

## Codes

`UNAUTHENTICATED`, `WRITE_FORBIDDEN`, `PRODUCER_CAPABILITY_REQUIRED`,
`SOURCE_NODE_NOT_FOUND`, `TARGET_NODE_NOT_FOUND`, `EDGE_ALREADY_EXISTS`,
`EDGE_NOT_FOUND`, `EDGE_ARCHIVED`, `CARDINALITY_VIOLATION`,
`SELF_EDGE_FORBIDDEN`, `SCOPE_MISMATCH`, `VISIBILITY_INVALID`,
`IDEMPOTENCY_CONFLICT`, `METADATA_INVALID`, `EVENT_EMISSION_FAILED`,
`REGISTRY_VERSION_MISMATCH`, `INTERNAL_ERROR`.

## Hidden-topology safety

- Hidden endpoints collapse to `SOURCE_NODE_NOT_FOUND` / `TARGET_NODE_NOT_FOUND`
  (indistinguishable from truly missing).
- `graph_user_owns_node` returning false on a hidden endpoint yields
  `WRITE_FORBIDDEN`; the caller cannot distinguish "not owned" from "hidden".
- Constraint violation strings, table names, and search paths never appear in
  `GraphError.message`.
