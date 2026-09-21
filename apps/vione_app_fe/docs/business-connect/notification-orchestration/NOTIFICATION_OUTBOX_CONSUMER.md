# Notification Outbox Consumer

- Reads `graph_outbox_events` where `event_kind` is mapped in
  `NOTIFICATION_EVENT_TO_KIND`.
- Skips any event that already has a receipt for the current `policy_version`.
- Suppresses events with no `recipientUserIds` in the payload.
- Enforces actor self-suppression per `NOTIFICATION_KIND_REGISTRY`.
- Applies preferences + quiet hours per recipient via `computeChannelPlan`.
- Writes notification + dispatch rows via `writeNotificationIdempotent` — the
  underlying UNIQUE constraint on `dedupe_key` guarantees single-row semantics
  even under concurrent consumers.
- Writes a receipt in the same batch; one failure isolates to a single event.

## Concurrency

Two concurrent consumers cannot double-write a notification: the unique
`dedupe_key` raises `23505` and the second write resolves the existing id.
Two concurrent claim workers cannot double-process the same schedule: the
`bnotif_claim_schedules` RPC uses `FOR UPDATE SKIP LOCKED`.

## Batch bounds

Default 100, hard maximum 500 (`NOTIFICATION_BATCH_DEFAULTS`).
