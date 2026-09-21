# BC-6.8 — Smart Introduction Job Observability

## Frozen Job Registry (4)

1. `outcome_consumer_batch` — dispatches outbox events to adapters.
2. `outcome_expire_sweep` — terminates outcomes past 60-day window.
3. `outcome_reconcile` — repairs drift vs. domain state.
4. `intro_ops_alerts_evaluate` — evaluates alert conditions.

Registry: `OPS_JOB_NAMES` in `src/lib/graph/introduction/ops/types.ts`.

## Recorder Contract

Every job invocation MUST call `intro_ops_record_job_run(job_name, status,
duration_ms, context jsonb)` — success and failure paths both record.

`status ∈ { success, failure, partial }`. `context` is aggregate only
(counts, batch size, error class) — never row ids or PII.

## Storage

Table: `introduction_ops_job_runs` (append-only, retained 30d).
Columns: `id, job_name, status, started_at, finished_at, duration_ms, context jsonb`.

## Read Surface

- `list_intro_ops_scheduler_runs(scope, limit)` → last N runs per job.
- Consumer runs mirrored via `introduction_ops_consumer_runs`
  (`intro_ops_record_consumer_run`) with per-batch delivered/failed counts.

## Failure semantics

- A job that throws MUST wrap the call in a `try/catch` and record `failure`
  with the error class in `context.error_class`.
- Missing recorder call is a bug — enforced by the sweep/reconcile wrappers
  introduced in BC-6.8R.
