# GRAPH_TIMELINE_SCHEMA.md — BC-4.2

Table `graph_timeline_events` (append-only, FORCE RLS).

| Field               | Type                    | Notes                                         |
| ------------------- | ----------------------- | --------------------------------------------- |
| `id`                | uuid PK                 |                                               |
| `event_kind`        | text                    | matches `edge_kind` when derived from an edge |
| `subject_node_id`   | uuid → graph_nodes      | primary subject                               |
| `related_node_id`   | uuid → graph_nodes NULL | counterpart if any                            |
| `edge_id`           | uuid → graph_edges NULL | provenance link                               |
| `actor_node_id`     | uuid → graph_nodes NULL | actor's person node                           |
| `actor_user_id`     | uuid                    | actor's `auth.uid()` at write time            |
| `tenant_scope_type` | text                    | `global`/`association`/`community`/`tenant`   |
| `tenant_scope_id`   | uuid NULL               |                                               |
| `visibility_class`  | text                    | see contract                                  |
| `summary_key`       | text                    | i18n key — no free-text authority             |
| `metadata`          | jsonb                   | registry-allowlisted scalars only             |
| `registry_version`  | integer                 | frozen manifest version                       |
| `occurred_at`       | timestamptz             | ordering axis                                 |
| `dedupe_key`        | text NULL               | UNIQUE where NOT NULL AND archived_at IS NULL |
| `collapse_key`      | text NULL               | read-side collapse                            |
| `archived_at`       | timestamptz NULL        | soft-delete tombstone                         |

## Indexes

- `(subject_node_id, occurred_at DESC, id DESC)` — timeline listing
- `(related_node_id, occurred_at DESC, id DESC)` — pair listing
- `(edge_id)` — cascade archive
- `(tenant_scope_type, tenant_scope_id)`
- `(visibility_class)`
- `(dedupe_key)` UNIQUE partial
- `(archived_at)`

## Partitioning

Not partitioned. Threshold to revisit: 100M rows or > 6 months of active data.
