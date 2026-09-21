# BC-7.7 — Calendar & Availability Integration (Architecture)

**Status:** In progress (Turn A ratified — foundation).
**Canonical meeting store:** `public.business_meetings` (unchanged).
**Projection stores:** `business_meeting_calendar_projections`.

## Core principle

`BusinessMeeting` remains the source of truth for identity, participants,
organizer, status, and confirmation state. External calendar events
(Google, Microsoft, etc.) are **synchronization projections**. An external
event ID is never authoritative for anything.

## v1 provider registry

- `google`
- `microsoft`
- `internal` (no external calendar connected)

Frozen. New providers require a separate slice.

## Turn A scope (this migration)

Foundation only:

1. Five new tables (`business_calendar_accounts`,
   `business_availability_preferences`,
   `business_meeting_time_proposals`,
   `business_meeting_time_proposal_responses`,
   `business_meeting_calendar_projections`).
2. Provider-agnostic port (`CalendarProviderAdapter`).
3. `InternalCalendarAdapter` (always-available default).
4. Read-only repository (`CalendarRepository`).
5. Frozen error contract, provider registry, query bounds.

## Turn B scope (next)

- `AvailabilityService` (common free-slot algorithm, timezone/DST safe).
- `SchedulingService` (proposal round + participant response + selection).
- `CalendarSyncService` (idempotent projection, retry, reconciliation).
- SECURITY DEFINER RPCs:
  `business_availability_preferences_update`,
  `business_meeting_time_proposals_create`,
  `business_meeting_time_proposal_respond`,
  `business_meeting_time_proposal_select`,
  `business_meeting_calendar_sync_reconcile`.
- Server-side test suites.

## Turn C scope

- `MeetingCalendarSDK` + query keys + hooks.
- Meeting scheduling UI (find times, propose, respond, select, sync status).
- Availability settings UI.
- Calendar account UI.
- i18n (VI + EN), real axe, docs suite, final gate.

## Deferred (out of scope, section 74)

- Google/Microsoft OAuth wiring — no infrastructure present today.
  Adapters exist as contract; activation is a separate slice.
- AI scheduling, AI slot ranking.
- Recurring meetings.
- Public booking pages.
- External email-only guests.
- Bidirectional sync.
- Meeting outcome / transcription / CRM automation.
