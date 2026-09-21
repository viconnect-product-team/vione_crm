# BC-6.6 — Replay

Controlled, bounded, admin/service-only.

## Surfaces

- SQL: `SELECT public.outcome_consumer_replay(<outbox_event_id>, <adapter_name?>);`
- Service: `OutcomeEventConsumer.replay(outboxEventId, adapterName?)`

## Guarantees

- Idempotent — replaying an already-delivered event just resets receipts;
  adapters must dedupe on `eventId`.
- Bounded — one event (or one event × one adapter) per call.
- Auditable — receipts retain `attempt_count` and previous `last_error_code`
  history via `updated_at`.

## NOT exposed

- Public SDK
- `IntroductionOutcomeSDK`
- Authenticated user routes

## Bulk replay

Use ad-hoc SQL against `outcome_event_dispatches` (`WHERE dead_lettered_at
BETWEEN ...`) then loop `outcome_consumer_replay` per event. Bound the loop.
