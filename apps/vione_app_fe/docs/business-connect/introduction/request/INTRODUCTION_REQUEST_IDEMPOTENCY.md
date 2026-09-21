# BC-6.2 — Idempotency

**Send** uses two keys:

1. Optional client-supplied `idempotencyKey` — unique per
   `(requester_user_id, idempotency_key)` (partial index `ir_unique_idem`).
   Replays return the original row without inserting.
2. Structural key — active pending is unique per
   `(requester_user_id, intermediary_user_id, target_person_node_id)`
   (partial index `ir_unique_pending_tuple`). A duplicate send during the
   pending window collapses to the existing request.

**Accept / decline / cancel** are naturally idempotent: replay of the same
transition on a row already in that terminal state returns the row without
raising. Any _other_ attempted transition after terminal raises
`INTRO_REQUEST_NOT_PENDING`.

On unique-index race, the RPC catches `unique_violation` and returns the
winning row.
