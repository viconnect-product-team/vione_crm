# BC-6.6 — Dispatch Registry

Frozen at module load in `registry.server.ts`. Duplicate names throw.

| Adapter        | Required | Subscribes                           | Timeout | Max attempts |
| -------------- | -------- | ------------------------------------ | ------- | ------------ |
| `analytics`    | ✅       | all 5 kinds                          | 5s      | 5            |
| `audit`        | ✅       | all 5 kinds                          | 3s      | 5            |
| `notification` | ❌       | `connected`, `progressed`, `expired` | 5s      | 5            |

## Rules

- Required adapters must reach `delivered` or `dead_lettered` before the outbox row is marked `processed_at`.
- Optional adapters may fail independently without blocking finalization.
- Adapters must be PII-free and idempotent by `eventId`.

## Extension policy

Adding an adapter is additive:

1. Implement `OutcomeEventDispatchAdapter`.
2. Register in `BUILT_IN` list.
3. Document here + freeze required/optional.
   No dynamic code execution.
