# BC-6.8 — Smart Introduction Consumer Metrics

Complements `SMART_INTRODUCTION_JOB_OBSERVABILITY` with consumer-specific
counters used by the health model and alerts.

## Per-batch fields (recorded by `intro_ops_record_consumer_run`)

- `claimed` — events claimed via SKIP LOCKED
- `delivered` — adapter dispatch succeeded
- `failed` — adapter dispatch failed (retry scheduled)
- `dead_lettered` — moved to DLQ after max attempts
- `duration_ms`
- `adapter_breakdown` (jsonb): `{ analytics: {ok, fail}, audit: {...}, notification: {...} }`

## Derived aggregates (RPCs)

- `get_intro_ops_consumer_stats(scope, range_hours)` — sum of delivered /
  failed / dead_lettered over window; failure_ratio = failed / (delivered + failed).
- `get_intro_ops_adapter_stats(scope, range_hours)` — per-adapter rows for the
  Adapters table in the UI.

## Backoff

Exponential with jitter (documented in BC-6.6). Consumer metrics DO NOT
include per-event retry counts — only aggregate deliveries and terminal DLQ
transitions.

## Privacy

No event payload contents are recorded. `adapter_breakdown` only carries
integer counters keyed by adapter name.
