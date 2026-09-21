# Escalation Runtime

Frozen policies in `NOTIFICATION_ESCALATION_POLICY`:

- `follow_up_overdue`: +24h, +72h (two levels).
- `introduction_delivery_required`: +72h (one repeat).
- `meeting_invitation_received`: one-shot; upcoming reminders handle the rest.

## Seeding

`seedEscalationSchedule` computes bounded steps and upserts rows keyed on
`dedupe_key`. Duplicate seeding is a no-op.

## Cancellation (§AC)

`cancelEscalationsForSource` transitions all future rows for a source to
`cancelled`. Runtime callers must invoke this when:

- follow-up is completed/cancelled,
- meeting is resolved/cancelled,
- outcome is created,
- introduction is delivered/terminal,
- recipient loses authority.

Domain wiring for these cancellation triggers lands with Turn C domain
integration.
