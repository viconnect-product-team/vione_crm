# BC-7.9 Turn C — Meeting Outcome & Follow-up Product Surface

## Scope

Turn C wires the frozen Turn A (Outcome) and Turn B (Follow-up) domains into
the canonical Meeting Detail page (`/business-connect/meetings/$meetingId`)
and the meeting-scoped timeline.

Deferred (explicitly out of scope):

- Global viewer-owned Follow-up workspace (`/business-connect/follow-ups`) —
  the detail-page surface already covers meeting-scoped ownership; a global
  aggregator can ship in a later turn without contract change.
- Overdue/due-soon workspace CTAs beyond the P7 "record outcome" action.
- AI summary, transcription, notifications/reminders, CRM automation.

## Components

- `src/hooks/use-meeting-outcome.ts` — React Query hooks (outcome + follow-up
  reads and mutations). Errors are mapped through the stable domain error
  contracts before reaching the UI.
- `src/components/business-connect/meeting/MeetingOutcomeSection.tsx` —
  Organizer-only create/edit/finalize; participants see the recorded outcome
  read-only. Empty state differentiates organizer vs. participant copy.
- `src/components/business-connect/meeting/MeetingFollowUpSection.tsx` —
  Follow-up list with per-item actions gated by DTO `viewerPermissions`.
  Owner selector is limited to meeting participants + organizer; no raw uid
  is ever rendered (`owner.kind` / `isViewer` from the DTO).

## Timeline integration

Turn A/B DB triggers already emit `business_meeting_events` with event types
`business_meeting_outcome_{created,updated,finalized}` and
`business_meeting_follow_up_{created,updated,started,completed,cancelled}`.

The workspace timeline projector derives its label via
`bc.meetings.workspace.timeline.event.${event_type.toLowerCase()}`. Turn C
adds the matching Vietnamese + English translations to `src/lib/i18n.ts`, so
lifecycle events appear on the Meeting Timeline with no projector change.

## Privacy

- Outcome DTO exposes `viewerIsRecorder` (boolean), never a raw uid.
- Follow-up DTO exposes `owner.kind` / `owner.isViewer`; the UI uses these
  to render the "You / Organizer / Participant / External" label.
- The Follow-up owner selector uses `MeetingDetailDTO.participants`
  (already participant-authorized under RLS) and never leaks non-participant
  identity.

## Authority

- Meeting-Detail organizer check uses `detail.viewerRole === "organizer"`.
- Every per-follow-up action is gated by `viewerPermissions` from the DTO.
  The server RE-validates authority; the UI never fabricates authority.
