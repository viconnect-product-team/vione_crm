# BC-6.8 — Smart Introduction Threshold Registry

Frozen at `INTRODUCTION_OPS_VERSION = 1.0.0`. Changes require version bump.

## Outbox

| Metric                     | Warn  | Critical |
| -------------------------- | ----- | -------- |
| pending events             | ≥ 250 | ≥ 500    |
| oldest event lag (minutes) | ≥ 15  | ≥ 60     |

## Consumer (last 60 minutes)

| Metric              | Warn   | Critical |
| ------------------- | ------ | -------- |
| failure_ratio       | ≥ 0.10 | ≥ 0.25   |
| dead_lettered_count | —      | ≥ 1      |

## Scheduler

| Metric                                                 | Warn | Critical |
| ------------------------------------------------------ | ---- | -------- |
| minutes since last successful `outcome_consumer_batch` | ≥ 10 | ≥ 30     |

## Requests (last 24h)

| Metric                                                          | Warn | Critical |
| --------------------------------------------------------------- | ---- | -------- |
| failure_ratio = (expired + cancelled) / total (when total ≥ 20) | —    | ≥ 0.40   |

## Rules

- Ratios computed only when the denominator meets a minimum sample size
  (≥ 20 for requests, ≥ 10 for consumer). Below that: `healthy` by policy.
- Every threshold is emitted inside `OpsHealthSummary.thresholds` for UI
  transparency — the dashboard never hard-codes numbers.
