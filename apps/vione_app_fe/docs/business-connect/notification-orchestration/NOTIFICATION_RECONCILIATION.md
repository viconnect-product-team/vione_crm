# Reconciliation

`reconcileNotificationRuntime` = bounded pass over:

1. **Stuck recovery** — `bnotif_recover_stuck(threshold_minutes)` releases
   dispatches stuck in `processing` and schedules stuck in `claimed` beyond
   15 minutes back into the queue.
2. **Expiry** — informational notifications aged past their policy horizon
   transition to `expired` (bounded batches).

Reconciliation is admin-only. It is idempotent — repeated runs converge.

## What reconciliation is NOT

- Not a source of truth for canonical state.
- Not a compensating writer for user-visible content.
- Not a substitute for the outbox consumer.
