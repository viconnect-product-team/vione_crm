# BC-7.7 Turn C — Calendar & Availability Product Surface

**Status:** Shipped · Gate: GO ✅
**Depends on:** BC-7.7 Turn A (foundation), B1 (availability core),
B2 (scheduling + sync). Google/Microsoft OAuth remains deferred.

## Surfaces delivered

1. **Calendar & availability settings route** — `/connect/calendar-settings`
   (route file `src/routes/connect.calendar-settings.tsx`, `ssr: false`).
2. **`CalendarAvailabilitySettings`** — timezone, working days & hours,
   minimum notice, default duration, before/after buffers. Validates
   locally and calls `updateAvailabilityPreferencesFn` via the SDK with
   `expectedVersion` for optimistic concurrency.
3. **`MeetingSchedulingSection`** — bundles finder + matrix + sync status
   into the canonical `MeetingDetailSheet`.
4. **`CommonAvailabilityFinder`** — organizer-only date-range / duration
   search that calls the deterministic engine and lets the organizer
   batch-select up to 5 slots to create a proposal round in one atomic
   RPC (with `clientRequestId` idempotency).
5. **`ProposalResponseMatrix`** — one row per proposal, response select
   for the viewer, "confirm this slot" button for the organizer using
   `expectedMeetingVersion` from the active proposal.
6. **`CalendarSyncStatus`** — per-participant projection state (internal
   only today; provider labels ready for Google/Microsoft rollout).
7. **`meetingCalendarKeys` + hooks** — precise React Query keys so
   preferences, proposals, projections, and common-availability searches
   invalidate independently.
8. **`useViewerUserId`** — client-only viewer id for role checks; the
   server RPC still re-authorizes everything.
9. **`calendarErrorTKey`** — every `CalendarError` code maps to a
   localized string (EN/VI); UI never renders raw SQL/RLS text.

## i18n

All strings live under the `calendar.*` namespace in `src/lib/i18n.ts`
(EN + VI). Provider labels use `calendar.sync.provider.*` and are ready
for the future Google/Microsoft turn without further translation work.

## Contracts & guarantees

- **No provider tokens or raw event content ever cross the wire** — the
  frozen DTOs from Turn A are unchanged.
- **RLS + SECURITY DEFINER RPCs still enforce authority.** The client
  role toggle (organizer vs participant) is UX only; the DB re-checks.
- **Deterministic availability.** The finder receives
  `availabilityConfidence: "deterministic"` slots and never invents
  provider data.
- **Idempotent proposal creation.** The finder passes `clientRequestId`
  so retrying the same batch returns the same round.
- **Optimistic concurrency preserved.** Settings pass
  `expectedVersion`; proposal-select passes `expectedMeetingVersion`.
- **Auto-refreshing sync status.** `useMeetingProjections` polls every
  20 s so the sheet shows retries / failures without a manual refresh.

## Deferred (intentionally)

- Google Calendar / Microsoft 365 OAuth activation — labels and adapter
  registry entries exist but the connect flow is out of scope for
  Turn C.
- Free/busy import from external providers — internal projections only.
