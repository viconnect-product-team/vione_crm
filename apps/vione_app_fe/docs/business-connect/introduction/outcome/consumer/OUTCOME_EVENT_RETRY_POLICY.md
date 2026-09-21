# BC-6.6 — Retry Policy

Classification (`AdapterResult.kind`):

- **success** → receipt `delivered`.
- **retryable_failure** → receipt `retry_scheduled` with `next_attempt_at`.
- **permanent_failure** → receipt `dead_lettered` immediately.

Retryable: timeout, transient network, 429, 5xx, dependency unavailable.
Permanent: unsupported schema version, invalid contract, unknown/disabled adapter, malformed payload.

## Backoff (`RETRY_BACKOFF_MINUTES`)

| Attempt | Delay       |
| ------- | ----------- |
| 1       | 1 min       |
| 2       | 5 min       |
| 3       | 15 min      |
| 4       | 1 h         |
| 5       | 6 h         |
| >5      | dead-letter |

Bounded jitter (±15%) via `computeNextAttemptAt`. Operational only — never
affects business semantics.

Max attempts per adapter = 5. `attempt_count` tracked on the per-adapter
receipt (`outcome_event_dispatches.attempt_count`) and on
`graph_outbox_events.attempt_count`.
