# GRAPH_ENGINE_EVENTS.md — BC-4.2

Deterministic events emitted from `graph_create_edge`, `graph_archive_edge`,
`graph_restore_edge`. Written to `graph_outbox_events` inside the same
transaction as the graph mutation.

## Canonical events

- `graph_node_registered`
- `graph_node_archived`
- `graph_node_restored`
- `graph_edge_created`
- `graph_edge_archived`
- `graph_edge_restored`
- `graph_edge_metadata_updated`
- `graph_timeline_emitted`
- `graph_write_replayed`
- `graph_write_denied`

## Payload contract

- `event_kind`: one of the above
- `aggregate_type`: `graph_node` or `graph_edge`
- `aggregate_id`: the affected id
- `payload`: allowlisted scalars — no private metadata, no PII, no SQL text
- `idempotency_key`: deterministic (`edge_created:<id>`, `edge_archived:<id>:<ts>` etc.)

## Delivery

At-least-once. Consumers must be idempotent by `idempotency_key`. Consumer
runtime is deferred; the outbox rows are the source of truth until a worker
lands. No external broker is introduced in BC-4.2.
