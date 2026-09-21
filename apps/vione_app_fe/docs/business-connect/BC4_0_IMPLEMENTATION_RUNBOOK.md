# BC-4.0 — Implementation Runbook

Business Connect v1 — FROZEN. Planning only; no schema written in BC-4.0.

## Migration principles

All BC-4 artifacts are **additive**. No changes to existing domains.

Expected artifacts (across slices):

- enums: `meeting_type`, `meeting_status`, `location_type`, `participant_role`,
  `participant_response`, `followup_status`, `meeting_source_type`
- tables: `business_meetings`, `business_meeting_participants`,
  `business_meeting_proposals`, `business_meeting_followups`,
  `business_meeting_notes`
- indexes (meeting_id, owner_user_id, status, start_at)
- RLS policies (participant-scoped; owner-scoped for followups/notes)
- SECURITY DEFINER transition RPCs: `meeting_propose`, `meeting_respond`,
  `meeting_reschedule`, `meeting_cancel`, `meeting_complete`,
  `followup_create`, `followup_complete`
- idempotency table `business_meeting_mutations (actor_user_id, mutation_key)`
- audit table `business_meeting_events` + notification mapping trigger
- GRANT/REVOKE per `BC4_0_PARTICIPANT_AND_PRIVACY_MODEL.md`

Every `CREATE TABLE public.*` is immediately followed by GRANTs
(`SELECT` + scoped writes to `authenticated`, `ALL` to `service_role`, no `anon`),
then `ENABLE ROW LEVEL SECURITY`, then policies.

## Rollback

Drop only BC-4 artifacts (tables, enums, RPCs, triggers). Must preserve Global
Connections, Saved Cards, Business Interactions, Companies, Association Events,
legacy networking.

## Implementation slices

- **BC-4.1A** — schema, RLS, meeting state machine, proposal versioning.
- **BC-4.1B** — MeetingService, repository, server-fn adapters, MeetingSDK.
- **BC-4.1C** — Meetings management UI.
- **BC-4.1D** — Business Profile & Connection "Propose Meeting" integration.
- **BC-4.1E** — Follow-ups, private notes, interaction + UnifiedRelationshipView
  integration.
- **BC-4.1F** — Notifications, reminders, ICS, production hardening.

Do not implement multiple slices in one change.

## Future routes (frozen; no UI in BC-4.0)

`/connect/meetings`, `/connect/meetings/upcoming`, `/connect/meetings/past`,
`/connect/meetings/follow-ups`, `/connect/meetings/new`,
`/connect/meetings/$meetingId`. Profile action on `/b/$slug` → Propose meeting.
Connection action on `/connect/network/connections` → Schedule meeting.

## UI information architecture (future)

Meetings list: Upcoming / Pending / Past / Cancelled.
Detail: summary, participants, schedule, location, response state, private notes,
follow-ups, interaction timeline, calendar export.
Proposal flow: date/time, timezone, duration, meeting type, location, optional
message, confirmation. Mobile-first, Vietnamese default + i18n.

## Approvals required before BC-4.1A

1. Connection requirement Policy B. 2. Blocking baseline. 3. Dedicated notes
   table. 4. Explicit approval to write production schema.
