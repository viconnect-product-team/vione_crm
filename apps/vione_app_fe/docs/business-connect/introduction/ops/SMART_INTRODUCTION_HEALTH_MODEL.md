# BC-6.8 — Smart Introduction Health Model

Rule-based, deterministic. No ML, no anomaly detection.

## Subsystems (frozen: 4)

1. **outbox** — pending event count + oldest lag (minutes).
2. **consumer** — delivered / failed / dead-lettered in last hour, failure ratio.
3. **scheduler** — minutes since most recent successful `outcome_consumer_batch`.
4. **requests** — 24h request volume, expired/cancelled count, failure ratio.

## Status Values

`healthy` · `degraded` · `unhealthy`

## Derivation

Each subsystem is evaluated independently against the thresholds registry
(see `SMART_INTRODUCTION_THRESHOLD_REGISTRY`). Overall status = worst of
the four subsystems, ordered `unhealthy > degraded > healthy`.

## DTO Shape

```ts
type OpsHealthSummary = {
  scope: "platform" | "association";
  association_id: string | null;
  evaluated_at: string; // ISO
  overall: OpsSubsystemStatus;
  subsystems: {
    outbox: { status; pending; oldest_lag_minutes };
    consumer: {
      status;
      delivered_last_hour;
      failed_last_hour;
      dead_lettered_last_hour;
      failure_ratio;
    };
    scheduler: { status; stale_minutes };
    requests: { status; total_24h; expired_or_cancelled_24h; failure_ratio };
  };
  thresholds: Record<string, number>;
};
```

## Contract

- Ratios are `[0..1]`, rounded to 4 dp.
- `evaluated_at` is server-side `now()`.
- Missing series (e.g. zero runs) yield `healthy` with zero counters — never
  `null`.
- The `subsystems` object keys are exactly `["consumer","outbox","requests","scheduler"]`
  and guarded by `src/__tests__/ops-health.bc68.test.ts`.
