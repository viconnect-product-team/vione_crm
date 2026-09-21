# BC-7.5B.1 — Relationship Timeline Projection Operations

## Scheduler

`pg_cron` job **`relationship_timeline_projection_minutely`** runs every minute:

```
Cadence : * * * * *
Endpoint: POST https://project--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app/api/public/hooks/timeline-projection
Header  : apikey=<Lovable Cloud publishable/anon key>
Body    : {"batch": 100}
```

Registered via a migration (`DO $$ ... $$` block) that first checks
`cron.job` for an existing job of the same name and unschedules it before
re-registering — the wiring is fully idempotent across re-runs.

## Authentication

Same mechanism already used by `outcome_event_consumer_minutely`:

- The public route `/api/public/hooks/timeline-projection` bypasses edge
  auth (matching all `/api/public/*` routes) but requires the Lovable
  Cloud anon/publishable key in the `apikey` header.
- The key is supplied in the cron body via the standard project publishable
  key; no new secret is introduced. If the key ever rotates, only this cron
  registration and the outcome-consumer registration need to be re-applied.

## Batch policy

- Default: 100 events per invocation (`batch=100`).
- Max: 500 (clamped inside the route handler).
- The consumer only claims rows whose `available_at <= now()` and
  `processed_at IS NULL`, in `available_at` ASC order.

## Idempotency & concurrency

- **Idempotency (outbox emission):** trigger functions
  (`tg_intro_delivery_outbox`, `tg_intro_outcome_outbox`,
  `tg_meeting_outbox`) build a deterministic
  `<aggregate>:<row_id>:<event_kind>` idempotency key. Duplicate emissions
  hit the UNIQUE constraint on `graph_outbox_events.idempotency_key` and
  are swallowed by `graph_emit_outbox_event`.
- **Idempotency (projection):** each projected row carries
  `dedupe_key = 'outbox:<event_id>'`; `graph_record_timeline_event`
  silently drops duplicates on that key.
- **Concurrency:** overlapping cron invocations are safe. Each consumer
  run processes a bounded batch, marks rows via `processed_at`, and
  the dedupe key on the timeline write prevents double insertion even
  if two workers observe the same row (worst case: one succeeds, the
  other is a no-op).
- **Retry:** failed rows are released with exponential backoff
  (`available_at = now() + min(60s * 2^attempts, 1h)`) and
  `attempt_count` is incremented. Because writes are dedupe-keyed,
  retried rows never produce duplicate timeline events.

## Manual invocation

```bash
curl -X POST \
  "https://project--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app/api/public/hooks/timeline-projection" \
  -H "apikey: <publishable-anon-key>" \
  -H "content-type: application/json" \
  -d '{"batch": 100}'
```

Or via SQL (uses `pg_net` from within Postgres, same wiring as the cron):

```sql
SELECT net.http_post(
  url     := 'https://project--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app/api/public/hooks/timeline-projection',
  headers := '{"Content-Type":"application/json","apikey":"<publishable-anon-key>"}'::jsonb,
  body    := '{"batch":100}'::jsonb
);
```

## Managing the job

```sql
-- Inspect
SELECT * FROM cron.job WHERE jobname = 'relationship_timeline_projection_minutely';

-- Recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname='relationship_timeline_projection_minutely')
ORDER BY start_time DESC LIMIT 20;

-- Unschedule (only if disabling projection)
SELECT cron.unschedule('relationship_timeline_projection_minutely');
```

## Contracts preserved

- `graph_timeline_events` schema — unchanged.
- `RelationshipTimelineSDK` public contract — unchanged.
- `graph_timeline_event_get` contract — unchanged.
- BC-7.5B mapping semantics — unchanged.
