# BC-4.0 — Notification & Reminder Contract

Business Connect v1 — FROZEN. Reuse the recipient-scoped notification pattern
(`gn_notifications` / `gn_notification_prefs` / trigger + preference gate). No new
delivery infrastructure.

## Notification events

| Event                     | Recipient              | Trigger                        |
| ------------------------- | ---------------------- | ------------------------------ |
| meeting_proposed          | invited participant(s) | organizer proposes             |
| meeting_accepted          | organizer              | participant accepts            |
| meeting_declined          | organizer              | participant declines           |
| meeting_new_time_proposed | other participant      | reschedule / counter-proposal  |
| meeting_confirmed         | both participants      | acceptance confirms            |
| meeting_cancelled         | other participant(s)   | cancellation                   |
| meeting_reminder          | each participant       | 24h / 1h / custom before start |
| followup_due              | owner only             | private reminder               |

## Payload — privacy-safe

Allowed: meeting title, public counterpart summary (name/headline/avatar/slug/
company), scheduled time, safe **location_type** (not the text/URL), deep link,
correlation/event id.

Never include: private notes, hidden phone/email, meeting URL (by default;
allowed only if policy explicitly permits per-participant), report data, private
company/association fields, full participant lists, auth tokens.

## Reminder model

- Meeting reminders: 24h before, 1h before, optional custom.
- Follow-up reminders: owner-private via `reminder_at`, no cross-user delivery.
- Timezone-safe (computed from UTC + IANA).
- Idempotent: no duplicate reminder on retry (dedupe key per meeting+offset).
- Reschedule updates future reminders; cancellation invalidates them.
- Reuse the existing scheduler; do not create a second one.

## Idempotency

Every notification/interaction emission is deduped by an origin event id
(`ON CONFLICT ... DO NOTHING`), mirroring `gn_emit_notification_from_event()`.
