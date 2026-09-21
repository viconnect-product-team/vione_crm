# Notification Runtime Architecture (BC-8.1 Turn B)

**Status:** Turn B — GO.

The runtime layer executes deterministic, policy-driven notification delivery.
It is **strictly separated** from the policy layer (frozen in Turn A) and from
the UI layer (Turn C).

## Layers

| Layer     | Ownership                                        | Files                                                 |
| --------- | ------------------------------------------------ | ----------------------------------------------------- |
| Policy    | Pure rules — kinds, priorities, channels, dedupe | `policy.ts`, `registry.ts`, `template-resolver.ts`    |
| Runtime   | Persistence, claim/dispatch, retries, escalation | `runtime/*.server.ts`, `runtime/*.ts`                 |
| Read SDK  | Authenticated user reads + mutations             | `sdk.ts`, `list-functions.ts`, `functions.ts`         |
| Internal  | Service-role only worker API                     | `runtime/internal-api.server.ts`                      |
| Endpoints | Cron / admin entrypoints                         | `src/routes/api/public/hooks/notification-runtime.ts` |

## Data flow

```
graph_outbox_events ─▶ consumer.server (SKIP LOCKED, receipts)
                        │
                        ▼
                  writeNotificationIdempotent
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
   business_notifications   business_notification_dispatches
             │                     │
             │                     ▼
             │              dispatcher.server (SKIP LOCKED)
             │                     │
             ▼                     ▼
         Recipient           channel adapter
         reads via SDK       (in_app / email / push)
```

Reminders are seeded into `business_notification_schedules`; the scheduler
worker claims + revalidates + fulfills. Escalations follow the same shape via
`business_notification_escalations`.

## Non-goals (unchanged from Turn A)

No AI prioritization, no autonomous actions, no marketing broadcast, no
workflow DSL, no fake email/push delivery.
