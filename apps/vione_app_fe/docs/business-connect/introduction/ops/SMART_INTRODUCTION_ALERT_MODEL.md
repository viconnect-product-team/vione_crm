# BC-6.8 — Smart Introduction Alert Model

## Frozen Alert Registry (10 codes)

| Code                            | Severity | Category  |
| ------------------------------- | -------- | --------- |
| outbox.pending.warn             | warning  | outbox    |
| outbox.pending.critical         | critical | outbox    |
| outbox.lag.warn                 | warning  | outbox    |
| outbox.lag.critical             | critical | outbox    |
| consumer.failure_ratio.warn     | warning  | consumer  |
| consumer.failure_ratio.critical | critical | consumer  |
| consumer.dead_letter.critical   | critical | consumer  |
| scheduler.stale.warn            | warning  | scheduler |
| scheduler.stale.critical        | critical | scheduler |
| requests.failure_ratio.critical | critical | requests  |

Source of truth: `src/lib/graph/introduction/ops/types.ts` — additions require
`INTRODUCTION_OPS_VERSION` bump.

## Lifecycle

`open` → `acknowledged` → `resolved`. `resolved` is terminal.

Auto-resolution: `intro_ops_alerts_evaluate` closes any `open` alert whose
underlying condition no longer holds. Human acknowledgement never masks
reopen: if the condition recurs after resolve, a NEW alert row is created.

## Evaluation

- Job: `intro_ops_alerts_evaluate` (pg_cron, every minute).
- Deterministic mapping from health snapshot → alert set.
- Recorded via `intro_ops_record_job_run` for observability of the evaluator
  itself.

## DTO Shape

```ts
type OpsAlert = {
  id: string;
  code: OpsAlertCode;
  severity: "warning" | "critical";
  category: "outbox" | "consumer" | "scheduler" | "requests";
  state: "open" | "acknowledged" | "resolved";
  scope: "platform" | "association";
  association_id: string | null;
  opened_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  context: Record<string, number | string>; // observed values only
};
```

`context` never contains PII — only observed metric values that triggered
the code (e.g. `{ pending: 812, threshold: 500 }`).
