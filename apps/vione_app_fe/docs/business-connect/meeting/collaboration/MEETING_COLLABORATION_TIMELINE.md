# Meeting Collaboration Timeline Integration

Only three collaboration events reach the meeting timeline:

| Event type                                | Emitter                 | Metadata                        |
| ----------------------------------------- | ----------------------- | ------------------------------- |
| `business_meeting_agenda_item_created`    | Agenda trigger          | `{ agendaItemId, title }`       |
| `business_meeting_agenda_item_discussed`  | Agenda trigger          | `{ agendaItemId }`              |
| `business_meeting_shared_notes_published` | Shared-note publish RPC | `{ sharedNoteId, publishedAt }` |

## Privacy invariants

1. **Private notes emit ZERO timeline events.** The private-notes table has
   no trigger and no RPC path into `business_meeting_events_outbox`.
2. **Shared-note metadata never carries `content`.** Only identifiers +
   timestamps. Verified structurally in
   `meeting-collaboration-security.bc710.test.ts`.
3. **`MeetingTimeline.tsx` renders `summaryKey` only** — never
   `event.metadata` and never any note body.
4. **RLS on `business_meeting_events`** restricts reads to participants /
   organizer / admin.

## i18n

Keys registered under `bc.meetings.workspace.timeline.event.*`. Any new
event type must add a matching key or the timeline renders the raw
`eventType` slug (defensive fallback via `hasTKey`).
