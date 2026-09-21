# GRAPH_WRITE_RLS.md — BC-4.2

## Table grants (post-BC-4.2)

| Table                   | anon | authenticated  | service_role |
| ----------------------- | ---- | -------------- | ------------ |
| `graph_nodes`           | none | `SELECT` (RLS) | ALL          |
| `graph_edges`           | none | `SELECT` (RLS) | ALL          |
| `graph_timeline_events` | none | `SELECT` (RLS) | ALL          |
| `graph_outbox_events`   | none | none           | ALL          |

FORCE ROW LEVEL SECURITY remains on for every table.

## Read policies

- `graph_nodes` → `graph_can_read_node(row)`
- `graph_edges` → both endpoints readable AND edge visibility satisfied
- `graph_timeline_events` → active, non-system, subject readable, related (if any) readable

## Write

No `INSERT/UPDATE/DELETE` privileges exist for `authenticated`. All mutations
go through the RPCs listed in `GRAPH_WRITE_RPCS.md`.
