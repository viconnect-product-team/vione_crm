# GRAPH_WRITE_RPCS.md — BC-4.2

All RPCs are `SECURITY DEFINER`, `SET search_path = public`,
`REVOKE ALL FROM PUBLIC, anon`.

| RPC                                       | Executor grants             | Purpose                                    |
| ----------------------------------------- | --------------------------- | ------------------------------------------ |
| `graph_register_node(...)`                | authenticated, service_role | Idempotent node upsert                     |
| `graph_archive_node(uuid)`                | authenticated, service_role | Owner-only soft-delete                     |
| `graph_restore_node(uuid)`                | authenticated, service_role | Owner-only restore                         |
| `graph_create_edge(...)`                  | authenticated, service_role | Atomic edge + timeline + outbox            |
| `graph_archive_edge(uuid)`                | authenticated, service_role | Endpoint-owner archive                     |
| `graph_restore_edge(uuid)`                | authenticated, service_role | Endpoint-owner restore                     |
| `graph_update_edge_metadata(uuid, jsonb)` | authenticated, service_role | Endpoint-owner metadata patch              |
| `graph_record_timeline_event(...)`        | service_role ONLY           | Internal (called from `graph_create_edge`) |
| `graph_emit_outbox_event(...)`            | service_role ONLY           | Internal (called from `graph_create_edge`) |
| `graph_viewer_connected_to(uuid)`         | authenticated, service_role | RLS helper for `connected` visibility      |

## Guarantees

- Actor is derived from `auth.uid()`; no actor parameter is accepted.
- No unrestricted JSON merge — metadata is stored, not merged.
- Errors raise stable identifiers (`WRITE_FORBIDDEN`, `SOURCE_NODE_NOT_FOUND`,
  etc.); no SQL, table, or constraint names leak.
- Duplicate active edges collapse to an id return, not an error.
