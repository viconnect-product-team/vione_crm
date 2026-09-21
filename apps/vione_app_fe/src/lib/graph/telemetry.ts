// BC-4.1 — Relationship Graph Engine — Safe read telemetry.
// Emits structured events only. Never contains raw metadata, PII, node names,
// or SQL. Telemetry failure must never affect query success.

export type GraphTelemetryEvent =
  | "graph_node_read"
  | "graph_neighbors_queried"
  | "graph_mutuals_queried"
  | "graph_shared_nodes_queried"
  | "graph_path_queried"
  | "graph_query_denied"
  | "graph_query_truncated"
  | "graph_registry_mismatch"
  // BC-4.2 write & timeline
  | "graph_node_registered"
  | "graph_node_archived"
  | "graph_node_restored"
  | "graph_edge_created"
  | "graph_edge_archived"
  | "graph_edge_restored"
  | "graph_edge_metadata_updated"
  | "graph_timeline_emitted"
  | "graph_timeline_queried"
  | "graph_write_replayed"
  | "graph_write_denied"
  // BC-4.3 strength
  | "graph_strength_computed"
  | "graph_strength_cache_hit"
  | "graph_strength_recomputed"
  | "graph_strength_invalidated"
  | "graph_strength_version_mismatch"
  | "graph_strength_query_denied"
  // BC-4.4 recommendations
  | "graph_recommendations_queried"
  | "graph_recommendations_denied";

export interface GraphTelemetryPayload {
  event: GraphTelemetryEvent;
  viewerHash?: string; // opaque hash, never raw uid
  nodeKind?: string;
  edgeKind?: string;
  count?: number;
  depth?: number;
  errorCode?: string;
  truncated?: boolean;
}

export function emitGraphTelemetry(payload: GraphTelemetryPayload): void {
  try {
    // Structured log; sinks are attached at the infra layer.

    console.info("[graph.telemetry]", JSON.stringify(payload));
  } catch {
    // Swallow: telemetry never affects query success.
  }
}
