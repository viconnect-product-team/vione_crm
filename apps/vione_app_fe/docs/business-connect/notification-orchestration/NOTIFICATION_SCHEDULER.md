# Notification Scheduler

Schedules are persisted rows in `business_notification_schedules`. Only the
runtime writes them (service-role).

## Reminder offsets

Frozen in `NOTIFICATION_REMINDER_SCHEDULE`:

- Meeting: `-24h`, `-1h`
- Follow-up due-soon: `-24h`
- Follow-up overdue: `0`
- Meeting outcome missing: `+24h`
- Introduction delivery required: `+48h`

## Claim + fulfillment

1. `bnotif_claim_schedules` claims a bounded batch (SKIP LOCKED).
2. For each row, the runtime **revalidates canonical authority** before
   creating the resulting notification (`ReminderRevalidation`). Stale
   schedules self-cancel (`status='cancelled'`, `last_error_code` set).
3. On successful revalidation, `writeNotificationIdempotent` produces the
   canonical row + dispatches, then the schedule row is marked `delivered`.

## Past-time policy

`computeReminderSchedule` accepts `suppress_past` (default) or `catch_up`.
Turn A froze the default; runtime callers can opt in to `catch_up` when the
domain requires it.
