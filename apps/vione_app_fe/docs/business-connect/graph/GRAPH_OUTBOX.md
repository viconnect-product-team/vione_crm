# GRAPH_OUTBOX.md — BC-4.2

Table `graph_outbox_events` (FORCE RLS; no `authenticated` privileges).

| Field             | Type             | Notes                           |
| ----------------- | ---------------- | ------------------------------- |
| `id`              | uuid PK          |                                 |
| `event_kind`      | text             | see `GRAPH_ENGINE_EVENTS.md`    |
| `aggregate_type`  | text             |                                 |
| `aggregate_id`    | uuid             |                                 |
| `payload`         | jsonb            | allowlisted scalars only        |
| `idempotency_key` | text UNIQUE      | deterministic per logical event |
| `occurred_at`     | timestamptz      | when produced                   |
| `available_at`    | timestamptz      | earliest delivery attempt       |
| `processed_at`    | timestamptz NULL | set by consumer                 |
| `attempt_count`   | integer          | consumer-managed                |
| `last_error_code` | text NULL        | consumer-managed                |

## Consumer

Deferred. Any future worker runs under `service_role`, updates
`attempt_count`/`processed_at`, and must be idempotent by `idempotency_key`.

## Indexes

- `(processed_at, available_at) WHERE processed_at IS NULL` — pending scan
- `(aggregate_type, aggregate_id)`
- `(event_kind)`

## Failure semantics

- Outbox emission is inside the same transaction as the graph mutation. A
  failed insert (unique_violation on replay) is silently swallowed by
  `graph_emit_outbox_event` — the existing row is returned.
- No user-facing error text is ever stored in `payload` or `last_error_code`.
