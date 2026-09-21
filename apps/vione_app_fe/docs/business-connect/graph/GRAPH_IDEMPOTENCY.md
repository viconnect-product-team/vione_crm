# GRAPH_IDEMPOTENCY.md — BC-4.2

Every write RPC supports deterministic idempotency:

- `graph_register_node` — natural key `(node_kind, external_ref_type, external_ref_id)`.
- `graph_create_edge` — client-supplied `idempotency_key` **plus** `created_by_user_id`
  **plus** `edge_kind` (unique partial index `graph_edges_idem_idx`). Replays return
  the original `edge_id` without additional timeline or outbox rows.
- Active-duplicate collapse — even without an idempotency key, an active
  `(edge_kind, source, target)` triple is unique and the RPC returns the existing id.
- `graph_record_timeline_event` — `dedupe_key = 'edge:<edge_id>'` uniqueness
  ensures one timeline event per edge write, replay-safe.
- `graph_emit_outbox_event` — `idempotency_key` UNIQUE ensures one outbox row
  per logical event. Replays reuse the existing row.

## Retention

- Idempotency keys live for the life of the row (edge or outbox). There is no
  separate short-lived idempotency store.
- Callers should scope keys to their operation (e.g. `save_card:<target_id>`);
  reusing a key with different endpoints or edge kinds produces a fresh
  active edge — the uniqueness is per `(actor, kind, key)`.

## Collision behavior

- Duplicate insert during concurrent identical writes → the second caller
  observes the winning row's id via the retry path.
- Constraint violations are collapsed to stable graph errors; constraint
  names never appear in `GraphError.message`.
