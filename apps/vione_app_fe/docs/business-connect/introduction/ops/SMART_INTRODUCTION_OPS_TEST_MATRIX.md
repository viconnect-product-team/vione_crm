# BC-6.8 — Smart Introduction Ops Test Matrix

## Suites

| File                                    | Focus                                             |
| --------------------------------------- | ------------------------------------------------- |
| `src/__tests__/ops-health.bc68.test.ts` | Frozen registries + `OpsHealthSummary` DTO shape. |
| `src/__tests__/ops-alerts.bc68.test.ts` | Alert evaluation, severity map, auto-resolve.     |
| `src/__tests__/ops-scope.bc68.test.ts`  | Scope guard: platform vs. association access.     |
| `src/__tests__/ops-ui.bc68.test.tsx`    | UI consumes only SDK hooks; no direct server-fn.  |

## Guaranteed Assertions

- `OPS_ALERT_CODES` length = 10, unique.
- Every code has severity + category mapping.
- `OPS_JOB_NAMES` = `["outcome_consumer_batch","outcome_expire_sweep","outcome_reconcile","intro_ops_alerts_evaluate"]`.
- `OpsHealthSummary.subsystems` keys = exactly `["consumer","outbox","requests","scheduler"]`.
- All subsystem statuses ∈ `{healthy, degraded, unhealthy}`.
- Alert transitions: `open → acknowledged → resolved`; reopen creates new row.
- Scope guard: platform RPC called with association scope by non-admin →
  `insufficient_privilege`.
- Route file `platform.introduction-operations.tsx` imports SDK/hooks only
  (regex-guarded: no `useServerFn`, no `@/integrations/supabase/client`).

## Structural Guarantees (not fixture-tested)

- RLS `FORCE ENABLE` on all `introduction_ops_*` tables + deny-all base
  policies.
- SECURITY DEFINER RPCs re-check scope via `intro_ops_assert_scope`.
- Recorder RPCs wired into: consumer batch, expire sweep, reconcile, alerts
  evaluate. Verified by BC-6.8R migration diff.

## Regressions kept green

BC-4.x, BC-5.x, BC-6.0 → BC-6.7. Typecheck + lint + i18n gates unchanged.
