# BC-6.6 — Operations

## Scheduler

`pg_cron` job `outcome_event_consumer_minutely` runs every minute:

```
POST https://project--<id>.lovable.app/api/public/hooks/outcome-consumer
Header: apikey=<publishable key>
Body: {"batch": 100}
```

## Batch policy

- default: 100
- max: 500 (clamped by `outcome_consumer_claim_batch`)

## Metrics (`OutcomeEventConsumer.metrics()`)

- `pending` — outbox rows awaiting processing
- `oldestPendingAgeSec`
- `retryScheduled`
- `deadLettered`

## Backpressure

- Sustained backlog → increase cron frequency or batch size (≤500).
- Never remove SKIP LOCKED or the aggregate order guard.

## Alerts (recommended)

| Signal                   | Threshold               |
| ------------------------ | ----------------------- |
| oldest pending age       | >10 min                 |
| dead-letter count / hour | >0 for required adapter |
| retry rate / hour        | >20% of claimed         |
| adapter failure rate     | >5% sustained           |

## Retention

- `graph_outbox_events` processed rows: 30–90 days (existing platform policy).
- `outcome_event_dispatches`: retained as operational metadata; no hard-delete of unprocessed or dead-lettered rows.
