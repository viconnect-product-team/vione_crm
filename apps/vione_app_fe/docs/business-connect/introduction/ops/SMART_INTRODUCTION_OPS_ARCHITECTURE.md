# BC-6.8 — Smart Introduction Ops Architecture

**Version:** `INTRODUCTION_OPS_VERSION = 1.0.0`
**Scope:** Read-only operational observability for the Smart Introduction
subsystem (requests → deliveries → outcomes → outbox → consumer → scheduler).
**Non-goals:** No product analytics (see BC-6.7), no PII, no AI scoring, no
mutation of introduction domain state.

## Layered Boundaries

| Layer      | Module                                                                     | Responsibility                                                                 |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Database   | `intro_ops_*` RPCs, `introduction_ops_alerts`, `introduction_ops_job_runs` | SECURITY DEFINER scope enforcement, aggregate reads, alert evaluation.         |
| Recorders  | `intro_ops_record_job_run`, `intro_ops_record_consumer_run`                | Called by scheduler jobs (consumer, expire sweep, reconcile, alerts evaluate). |
| Service    | `src/lib/graph/introduction/ops/ops.service.server.ts`                     | Server boundary; delegates to RPCs; scope-guarded.                             |
| Server fns | `src/lib/graph/introduction/ops/ops.functions.ts`                          | `createServerFn` adapters with `requireSupabaseAuth` + platform role check.    |
| SDK        | `src/lib/graph/introduction/ops/ops.sdk.ts` (`SmartIntroductionOpsSDK`)    | Client-safe façade — the only surface the UI imports.                          |
| Hooks      | `src/hooks/use-introduction-ops.ts`                                        | Centralized React Query bindings, scope-encoded query keys.                    |
| UI         | `src/routes/platform.introduction-operations.tsx`                          | Platform-scope dashboard. Consumes hooks only.                                 |

## Invariants

1. UI never imports server functions or Supabase directly — SDK/hooks only.
2. Every DTO is an aggregate (counts, ratios, durations). No node ids, no
   request ids, no user identifiers except alert ownership metadata.
3. Scope is server-derived: `platform` requires platform-admin role;
   `association` requires association-admin membership. Client-supplied scope
   is re-validated inside every RPC.
4. Frozen registries (alert codes, job names, subsystems) can only change via
   a version bump of `INTRODUCTION_OPS_VERSION`.

## Data Flow

```
scheduler job ──► recorder RPC ──► introduction_ops_job_runs / consumer_runs
                                        │
outbox / requests / deliveries / outcomes└─► ops read RPCs ──► SDK ──► hooks ──► UI
                                        │
                            intro_ops_alerts_evaluate ──► introduction_ops_alerts
```

Related cards: `SMART_INTRODUCTION_HEALTH_MODEL`, `SMART_INTRODUCTION_ALERT_MODEL`,
`SMART_INTRODUCTION_OPS_SECURITY`.
