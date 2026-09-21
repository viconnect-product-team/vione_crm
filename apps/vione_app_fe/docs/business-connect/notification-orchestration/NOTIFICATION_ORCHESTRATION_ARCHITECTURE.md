# Notification Orchestration — Architecture (BC-8.1)

Turn A froze policy, contracts, preferences.
Turn B (this turn) adds runtime persistence, workers, dispatch, and reconciliation.
Turn C will build the Notification Center + Preferences UI.

## Public SDK (frozen)

`NotificationOrchestrationSDK` exposes:

- `listNotifications` — recipient-scoped, paginated with policy-versioned cursor.
- `getUnreadCount` — recipient unread count.
- `markRead` / `markUnread` / `archiveNotification` / `archiveAllRead` — recipient mutations only.
- `getPreferences` / `updatePreferences` / `updateOverride` / `clearOverride` — preferences.

No `create`, `consume`, `dispatch`, `retry`, `escalate`, `reconcile`, or
`replay` methods are exposed to the client. Those live in
`runtime/internal-api.server.ts` and are only callable by service-role code
(cron endpoints, admin tools).

## Turn B modules

- `runtime/types.ts` — internal DTOs + bounded-batch defaults.
- `runtime/error-classifier.ts` — pure classifier.
- `runtime/retry-policy.ts` — pure backoff.
- `runtime/adapters.server.ts` — provider registry + in-app / stub adapters.
- `runtime/persistence.server.ts` — idempotent notification / schedule writer.
- `runtime/consumer.server.ts` — outbox consumer.
- `runtime/scheduler.server.ts` — reminder scheduling + claim + fulfillment.
- `runtime/dispatcher.server.ts` — dispatch claim + send + retry.
- `runtime/escalation.server.ts` — bounded escalation seeding + cancellation.
- `runtime/reconciliation.server.ts` — stuck recovery + expiry.
- `runtime/internal-api.server.ts` — service-role barrel.
- `runtime/index.ts` — types + pure helpers (safe for client bundles).

## Cron endpoint

`POST /api/public/hooks/notification-runtime?action=<consume|dispatch|schedule|reconcile>`
gated by anon `apikey` header.

## Activation

- in_app: live.
- email: contract only; deferred.
- push: contract only; deferred.

See `NOTIFICATION_PROVIDER_ACTIVATION.md` to activate.
