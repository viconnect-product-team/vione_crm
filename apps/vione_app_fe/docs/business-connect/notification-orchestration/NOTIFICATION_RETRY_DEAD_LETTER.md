# Retry & Dead Letter

## Backoff

`NOTIFICATION_RETRY_BACKOFF_MINUTES = [1, 5, 15, 60, 360]`. After attempt 5,
dispatches transition to `dead_lettered`. `computeNextRetryAt` returns the ISO
timestamp; `isMaxAttemptsReached` gates the terminal transition.

## Classification

`classifyNotificationDispatchError` maps every error to a stable internal
code. Raw provider messages are **never** persisted — only the canonical code.

| Class                  | Action                                           |
| ---------------------- | ------------------------------------------------ |
| `retryable`            | Set `retry_scheduled`, `next_retry_at`           |
| `permanent`            | `dead_lettered`                                  |
| `provider_unavailable` | `dead_lettered` (email/push today)               |
| `malformed`            | `dead_lettered`                                  |
| `unknown`              | `retry_scheduled` (bounded — capped by attempts) |

## Replay

`replayDeadLetterDispatch(id)` — admin-only. Resets to `pending` with
immediate `next_retry_at`. Not exposed to the public SDK.
