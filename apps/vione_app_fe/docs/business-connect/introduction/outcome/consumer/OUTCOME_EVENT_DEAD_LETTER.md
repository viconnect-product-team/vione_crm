# BC-6.6 — Dead Letter

Terminal `dead_lettered` state on `outcome_event_dispatches` when:

- retryable attempts exhausted (>5), OR
- adapter returns permanent_failure, OR
- envelope rejected before dispatch (`UNSUPPORTED_SCHEMA_VERSION`,
  `MALFORMED_PAYLOAD`).

Fields captured:

- `outbox_event_id`, `adapter_name`
- `last_error_code`
- `attempt_count`
- `dead_lettered_at`

No sensitive payload duplication — envelope stays in `graph_outbox_events`.

## Recovery

Use `outcome_consumer_replay(_outbox_event_id, _adapter_name)`. Resets
matching receipts to `pending`, clears `dead_lettered_at`, reopens the
outbox row.

## Alerts

Recommended: alert when `count(status='dead_lettered')` grows >0/hour for
a required adapter.
