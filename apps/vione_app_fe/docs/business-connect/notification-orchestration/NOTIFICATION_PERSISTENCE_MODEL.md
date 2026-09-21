# Notification Persistence Model

## Tables

- **`business_notifications`** — canonical inbox row. Unique on `dedupe_key`.
  Statuses: `pending`, `scheduled`, `delivered`, `read`, `archived`, `expired`,
  `cancelled`. Recipient can read only their own rows. All mutation flows
  through security-definer RPCs (`bnotif_mark_read`, `bnotif_mark_unread`,
  `bnotif_archive`, `bnotif_archive_all_read`). Recipients cannot mutate
  template/priority/action/dedupe/policy fields.
- **`business_notification_schedules`** — future reminders/escalations. Unique
  on `dedupe_key`. Claimed by `bnotif_claim_schedules` with FOR UPDATE SKIP
  LOCKED. Service-role only.
- **`business_notification_dispatches`** — per-channel attempts. Unique on
  `(notification_id, channel)`. Claimed by `bnotif_claim_dispatches` with FOR
  UPDATE SKIP LOCKED. Service-role only.
- **`business_notification_escalations`** — bounded escalation runs. Unique on
  `dedupe_key`. Service-role only.
- **`business_notification_event_receipts`** — outbox replay guard. Unique on
  `(source_event_id, policy_version)`. Service-role only.

## Status machine

```
pending ──▶ scheduled ──▶ delivered ──▶ read ──▶ archived
   │           │            │                       ▲
   │           │            └───────────────────────┘
   ▼           ▼
cancelled   expired
```

`read → delivered` only via `bnotif_mark_unread` (explicit user action).
Dispatch status is separate — it is not projected into the inbox status.

## Indexes

- `bnotif_recipient_created_idx` — recipient list scroll.
- `bnotif_recipient_unread_idx` — partial index for unread counts.
- `bnotif_dispatch_claim_idx` — pending/retry claim.
- `bnotif_schedule_claim_idx` — due schedule claim.
