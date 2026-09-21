# BC-6.6 — Outcome Event Consumer Architecture

Consumes `introduction_outcome_*` events produced by BC-6.5 and fans them
out to internal adapters. Infrastructure only — no business semantics.

```
introduction_outcomes  (BC-6.4)
        │
        ▼  (BC-6.5 trigger)
graph_outbox_events (aggregate_type='introduction_outcome')
        │
        ▼  (SKIP LOCKED, bounded)
OutcomeEventConsumer.consumeBatch()
        │
        ▼  fan-out
Adapters:  analytics (required) │ audit (required) │ notification (optional)
        │
        ▼  per-adapter receipts
public.outcome_event_dispatches
        │
        ▼  when all required = delivered|dead_lettered
graph_outbox_events.processed_at
```

## Ownership

- Worker: `OutcomeEventConsumer` (src/lib/graph/introduction/outcome/consumer)
- Trigger: `POST /api/public/hooks/outcome-consumer` invoked by `pg_cron` every minute
- Executes under service_role via `supabaseAdmin`
- No client SDK surface

## Files

- `types.ts` — envelope, kinds, statuses, backoff
- `registry.server.ts` — frozen adapter registry
- `adapters.server.ts` — analytics / audit / notification
- `repository.server.ts` — thin RPC wrapper
- `consumer.service.server.ts` — claim ▶ validate ▶ dispatch ▶ finalize
- `src/routes/api/public/hooks/outcome-consumer.ts` — scheduler entry
