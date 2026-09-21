# BC-6.8 — Smart Introduction Ops UI

Route: `/platform/introduction-operations`
File: `src/routes/platform.introduction-operations.tsx`

## Structure

1. **Scope switcher** — Platform / Association picker driven by
   `useIntroOpsAccess()`. Hidden if the caller has no scope.
2. **Health strip** — 4 subsystem tiles (outbox, consumer, scheduler,
   requests) with status badge and key counters. Auto-refresh 30s.
3. **Alerts panel** — open alerts first, acknowledge/resolve actions from
   `useAcknowledgeIntroOpsAlert` / `useResolveIntroOpsAlert`. Filters by state.
4. **Throughput tabs** — Requests, Deliveries, Outcomes stats by status over
   selectable range (24h / 7d / 30d).
5. **Outbox & Adapters** — pending / lag gauges + per-adapter table.
6. **Scheduler & Consumer runs** — recent runs (last 25) with status,
   duration, and JSON context peek.

## Data Rules

- No direct `useServerFn`. Only hooks from `src/hooks/use-introduction-ops.ts`.
- Query keys are scope-encoded (`introductionOpsKeys`) so switching scope
  never leaks cached data.
- Refresh intervals: health 30s, alerts 45s, throughput 60s.

## i18n

All strings under `bc.introOps.*`. Verified by build-time i18n check.

## Accessibility

- Status tiles expose `role="status"` + `aria-live="polite"` on the badge.
- Alert acknowledge/resolve buttons include `aria-describedby` pointing at the
  alert code + observed context.
- Tables use `role="table"` with sortable column headers where applicable.
