# GRAPH_TELEMETRY.md — BC-4.1

Structured events emitted by the service layer:

- `graph_node_read`
- `graph_neighbors_queried`
- `graph_mutuals_queried`
- `graph_shared_nodes_queried`
- `graph_path_queried`
- `graph_query_denied`
- `graph_query_truncated`
- `graph_registry_mismatch`

Payload fields are strictly limited (`event`, `viewerHash?`, `nodeKind?`,
`edgeKind?`, `count?`, `depth?`, `errorCode?`, `truncated?`). NO raw metadata,
node names, emails, phones, notes, hidden identifiers, full path payloads, or
SQL errors are permitted. `emitGraphTelemetry` swallows all sink errors —
telemetry can never affect query success.
