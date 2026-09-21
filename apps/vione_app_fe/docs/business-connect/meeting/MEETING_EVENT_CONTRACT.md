# BC-7.0 — Event Contract (Outbox)

Meeting mutations emit outbox events consumed by graph, notifications,
and analytics.

## Event types

| Type                  | Emitted on            | Payload keys                                            |
| --------------------- | --------------------- | ------------------------------------------------------- | -------------------------------------- |
| `meeting.proposed`    | draft → proposed      | meetingId, organizerId, participantIds, proposalVersion |
| `meeting.accepted`    | proposed → confirmed  | meetingId, participantId, proposalVersion               |
| `meeting.declined`    | proposed → declined   | meetingId, participantId, reason?                       |
| `meeting.rescheduled` | (proposed             | confirmed) → proposed (new version)                     | meetingId, proposedBy, proposalVersion |
| `meeting.cancelled`   | \* → cancelled        | meetingId, cancelledBy, reason?                         |
| `meeting.completed`   | confirmed → completed | meetingId, participantIds                               |
| `meeting.no_show`     | confirmed → no_show   | meetingId, absentParticipantIds                         |

## Delivery guarantees

At-least-once. Consumers MUST be idempotent on `(event_id)`. Retry with
exponential backoff + jitter. Terminal events are never replayed after
successful ack.

## Schema evolution

Additive only. Renames or removals require a new event type and a
deprecation window — never mutate an existing contract.
