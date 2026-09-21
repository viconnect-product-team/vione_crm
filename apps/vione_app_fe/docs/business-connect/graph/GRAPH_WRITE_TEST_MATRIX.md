# GRAPH_WRITE_TEST_MATRIX.md — BC-4.2

## Registry / metadata

- ✅ allowlisted scalar keep, non-scalar drop, over-length truncate
- ✅ null/undefined metadata safe
- ✅ deterministic timeline dedupe key
- ✅ CONNECTED_TO edge registered, undirected, timeline-emitting

## SDK surface

- ✅ registerNode, createEdge, connect, disconnect, archiveEdge, restoreEdge,
  updateEdgeMetadata, timeline, pairTimeline, history present
- ✅ read methods (getNode, neighbors, mutuals, shared\*, shortestPath) preserved

## Error contract

- ✅ SELF_EDGE_FORBIDDEN mapped from Postgres message
- ✅ unique_violation → EDGE_ALREADY_EXISTS
- ✅ permission denied → WRITE_FORBIDDEN
- ✅ unknown errors → INTERNAL_ERROR (no message leak)

## Telemetry

- ✅ new events registered: graph_node_registered, graph_edge_created,
  graph_edge_archived/restored/metadata_updated, graph_timeline_emitted,
  graph_timeline_queried, graph_write_replayed, graph_write_denied
- ✅ payload keys remain within the documented allowlist

## Migration / DB

- ✅ tables created: graph_timeline_events, graph_outbox_events
- ✅ graph_edges gains idempotency_key + partial-unique index + active-triple
  partial-unique index + self-edge CHECK constraint
- ✅ connected visibility helper switched to real CONNECTED_TO edges
- ✅ authenticated INSERT/UPDATE/DELETE revoked on all graph tables
- ✅ BC-4.1V synthetic fixtures removed
