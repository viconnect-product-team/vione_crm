# BC-3.1A — Concurrency & Idempotency

Architecture Version: **Business Connect v1 (FROZEN)**.

## Idempotency

Every public mutation accepts a client `mutation_key` (`mkey`). The function first
`INSERT ... ON CONFLICT (actor_user_id, mutation_key) DO NOTHING` into
`global_connection_mutations`:

- **First call** wins → performs the transition and records the resulting row id.
- **Retry with same key** → conflict → the function returns the previously recorded result
  without re-applying the transition.

This makes retries (network drop, double-tap, at-least-once callers) safe: a resend never
produces a duplicate request or a double state change.

## Concurrency / race safety

1. **Duplicate & reverse-duplicate pairs** — prevented by the partial unique index
   `user_connections_active_pair_uq` on `(pair_user_low, pair_user_high)` for
   `status IN ('pending','accepted','blocked')`. Two simultaneous `send_request` calls on the
   same pair: one commits, the other hits a unique violation and is mapped to
   `NETWORK_ALREADY_CONNECTED_OR_PENDING`.
2. **Row-level transitions** — mutation functions `SELECT ... FOR UPDATE` the target row before
   applying, serializing accept/decline/cancel/disconnect against each other. Losing txn
   re-reads the new status and fails the state-machine guard (e.g. "accept a non-pending row").
3. **Generated pair columns** — `pair_user_low/high` are `GENERATED ALWAYS ... STORED`, so the
   uniqueness key is computed identically regardless of request direction and cannot be spoofed.
4. **Trigger defence** — `guard_user_connection_transition` re-validates OLD→NEW status on every
   UPDATE even if a function path is bypassed; `guard_user_connection_immutable` freezes the
   participant pair.

## Failure mapping

SQL errors are translated to stable `NETWORK_*` codes (`errors.ts`) so no raw SQLSTATE or
constraint text leaks to clients. Unique-violation → `ALREADY_CONNECTED_OR_PENDING`;
missing row → `NOT_FOUND`; bad transition → `INVALID_TRANSITION`; null auth → `AUTH_REQUIRED`;
suspended/deactivated account → `ACCOUNT_INACTIVE`.
