# Notification Dispatch Runtime

## Claim

`bnotif_claim_dispatches(batch, token)` — `FOR UPDATE SKIP LOCKED`, sets
`status='processing'`, `claimed_at=now()`, increments `attempt_count`.

## Send

`dispatchNotificationBatch` iterates claimed rows:

1. Reload the notification. If archived/expired/cancelled → dispatch is
   cancelled without send.
2. Resolve the adapter via `NotificationProviderRegistry`.
3. Missing/disabled adapter → dispatch is dead-lettered with
   `last_error_code='unsupported_channel'`. No fake delivery.
4. Adapter runs. Result kinds: `delivered`, `retryable`, `permanent`,
   `unsupported`, `suppressed`.
5. Update dispatch atomically. One failure isolates to that row.

## Adapters

- **In-app** — enabled, provider `internal`. Canonical persistence itself
  counts as delivery; the adapter marks the dispatch `delivered`.
- **Email** — provider `unavailable`. Returns `unsupported`. Activation
  deferred — see `NOTIFICATION_PROVIDER_ACTIVATION.md`.
- **Push** — provider `unavailable`. Returns `unsupported`. Activation
  deferred — see `NOTIFICATION_PROVIDER_ACTIVATION.md`.
