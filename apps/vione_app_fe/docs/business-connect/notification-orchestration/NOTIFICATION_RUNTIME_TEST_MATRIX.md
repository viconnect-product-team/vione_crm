# Runtime Test Matrix

## Covered by `notification-runtime.bc81.test.ts`

| #   | Case                                                | Assertion source                             |
| --- | --------------------------------------------------- | -------------------------------------------- |
| 1   | Retry backoff schedule (5 attempts, ISO timestamps) | `computeNextRetryAt`, `isMaxAttemptsReached` |
| 2   | Error classification (retryable / permanent / etc.) | `classifyNotificationDispatchError`          |
| 3   | Effective channels — defaults, global-off, critical | `computeChannelPlan`                         |
| 4   | Per-kind override disables channel                  | `computeChannelPlan`                         |
| 5   | Quiet hours defer external channels; keep in-app    | `computeChannelPlan`                         |
| 6   | Meeting reminder schedule (-24h, -1h)               | `computeReminderSchedule`                    |
| 7   | Past-time suppress vs catch-up policy               | `computeReminderSchedule`                    |
| 8   | Follow-up due-soon schedule                         | `computeReminderSchedule`                    |
| 9   | Escalation ladder for `follow_up_overdue`           | `computeEscalationSteps`                     |
| 10  | Empty ladder for non-escalating kinds               | `computeEscalationSteps`                     |
| 11  | Dedupe key stability + per-recipient uniqueness     | `buildDedupeKey`                             |
| 12  | In-app adapter enabled, delivered result            | `InAppNotificationAdapter`                   |
| 13  | Email adapter disabled, unsupported result          | `UnsupportedEmailAdapter`                    |
| 14  | Push adapter disabled, unsupported result           | `UnsupportedPushAdapter`                     |
| 15  | Provider registry activation status                 | `defaultProviderRegistry.activationStatus`   |
| 16  | Template privacy — hidden counterpart               | `resolveNotificationTemplate`                |
| 17  | Template scalars drop non-primitives                | `resolveNotificationTemplate`                |
| 18  | Body key is a translation key, not raw content      | `resolveNotificationTemplate`                |

## Covered by `notification-security.bc81.test.ts`

- Public SDK freeze — exact method set, `Object.isFrozen` guard.
- Runtime worker methods absent from public SDK.
- Public barrel contains no server-only symbols.
- Internal error codes are lowercase snake-case and short (no leaked PII).

## Enforced by database contracts

- Concurrent consumers cannot double-create a notification: unique on
  `dedupe_key`.
- Concurrent dispatchers cannot double-send a channel: unique on
  `(notification_id, channel)` + SKIP LOCKED claim.
- Concurrent schedule workers: SKIP LOCKED claim RPC.
- Recipient cannot forge `recipient_user_id`: no direct UPDATE grant; RPCs
  scope by `auth.uid()`.

## Limitation

Real multi-session concurrency is not exercised in the unit suite. Structural
proof is provided by (a) the DB UNIQUE constraints, (b) `FOR UPDATE SKIP LOCKED`
in the claim RPCs, and (c) receipt-based idempotency in the consumer.
