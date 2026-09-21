# BC-6.5 — Outcome Lifecycle Wiring & Scheduler

Turns BC-6.4 outcome primitives into a live signal flow. No new domain, no new
public SDK surface, no messaging / AI / CRM automation.

## Signal flow

```
Delivery.acknowledged  ──trigger──▶  intro_outcome_create_on_ack()
                                          │
                                          ▼
Outcome (pending)  ──emit──▶  introduction_outcome_created (outbox)

user_connections.accepted (requester ↔ target, after ack)
                       ──trigger──▶  intro_outcome_observe_connection()
                                          │
                                          ▼
Outcome (resolved / connected) ──emit──▶ introduction_outcome_connected

pg_cron hourly
   └─▶ intro_outcome_expire_sweep(200)
        └─▶ pending & expires_at ≤ now ──▶ expired / closed_no_outcome
                                               │
                                               ▼
                                     introduction_outcome_expired
```

## Guarantees

- **Idempotent**: `intro_outcome_create_on_ack` returns the existing row if the
  outcome already exists; `intro_outcome_observe_connection` no-ops on
  non-pending outcomes.
- **Failure-isolated**: acknowledgment and connection-accept triggers wrap
  wiring in `EXCEPTION WHEN OTHERS` so acknowledgment / accept never fail
  because of an outcome-side error. Reconciliation heals missed writes.
- **Exactly-once events**: outbox `idempotency_key` =
  `io:<outcomeId>:<eventKind>:<status>:<outcomeType>`. Duplicate transitions
  collapse to one row via the unique constraint on `graph_outbox_events`.
- **No full scans**: pair observation uses
  `idx_io_pair_pending(requester_user_id, target_user_id, status)` filtered
  to `pending`; sweep uses `idx_io_pending_expiry` with `FOR UPDATE SKIP LOCKED`
  and a bounded batch.

## Multi-outcome pair policy

When requester ↔ target become connected, every still-`pending` outcome for the
pair with `acknowledged_at ≤ connection_accepted_at` and `expires_at > now`
resolves to `connected`. Outcomes acknowledged after the connection, or
already terminal, are untouched. Bounded to 50 per event.

## Scheduler

`pg_cron` job `intro_outcome_expire_sweep_hourly` runs `SELECT
public.intro_outcome_expire_sweep(200)` every hour. Batch size ≤ 1000
(clamped by the RPC).

## Reconciliation

`SELECT * FROM public.intro_outcome_reconcile(100)` — bounded, idempotent
safety net. Returns `(created, observed, expired)` counts. Run manually or on
a low-frequency cron for backfill/repair.

## Service boundaries

- Delivery service `acknowledgeDelivery()` — unchanged. DB trigger
  `trg_id_wire_outcome` handles outcome creation.
- Connection service `accept()` — unchanged. DB trigger
  `trg_uc_wire_outcome` handles observation.
- `IntroductionOutcomeSDK` — frozen. `createOnAcknowledged`, `observeConnection`,
  `expireOutcome` and `reconcile` remain **system-only** on the server service
  and are NOT exposed to UI.

## Operations

- Owner: platform on-call.
- Cadence: hourly sweep, manual reconcile as needed.
- Alerts (recommended): acknowledged deliveries with no outcome (via
  reconcile.created > threshold), pending outcomes past expiry, wiring
  failure rate. No PII in alerts.
- Recovery command: `SELECT * FROM public.intro_outcome_reconcile(500);`

## BC-6.6 addendum — Consumer

Outbox events are consumed by `OutcomeEventConsumer`
(`src/lib/graph/introduction/outcome/consumer/`) via
`POST /api/public/hooks/outcome-consumer`, scheduled by `pg_cron` every
minute. Consumer dispatches to frozen adapters
(`analytics`, `audit`, `notification`), records per-adapter receipts in
`outcome_event_dispatches`, and only sets `graph_outbox_events.processed_at`
when all _required_ adapters are terminal.

See `consumer/OUTCOME_EVENT_CONSUMER_ARCHITECTURE.md`.
