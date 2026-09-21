# BC-4.1A — Domain Layer & Test Plan

## TypeScript module (`src/lib/business-meetings/`)

- `types.ts` — enums, JSON-safe DTOs (Meeting, Participant, Proposal), mutation
  result shapes.
- `errors.ts` — `toBusinessMeetingError` mapping DB/RLS errors → stable codes
  (`MEETING_STALE_VERSION`, `MEETING_BLOCKED`, `MEETING_NOT_ELIGIBLE`,
  `MEETING_INVALID_TRANSITION`, `MEETING_NOT_ORGANIZER`,
  `MEETING_NOT_PARTICIPANT`, `MEETING_RATE_LIMITED`, `MEETING_IMMUTABLE_FIELD`,
  `MEETING_AUTH_REQUIRED`).
- `state-machine.ts` — `evaluateMeetingTransition`, `isFreshVersion`,
  `isTerminal`, `TERMINAL_STATUSES`.
- `eligibility.ts` — `classifyEligibility`, `requireMeetingProposalEligibility`.
- `mappers.ts` — row → DTO.
- `repository.ts` — participant-scoped read boundary (`listUpcoming`,
  `listPending`, `listPast`) using `.or()` filters honoring RLS.
- `index.ts` — barrel.

## Verification status (this slice)

- `src/__tests__/business-meetings.bc41a.test.ts` — 17 pure tests: full
  transition table, actor rules, terminal rejection, version guard, Policy B
  classifier. **PASS.**
- Structural DB verification: 8 mutation functions present; RLS enabled+forced on
  all 5 tables; 8 CHECK constraints on `business_meeting_proposals`. **PASS.**
- `tsgo --noEmit` clean. **PASS.**

## Deferred verification (later slices)

Authenticated end-to-end mutation tests (create→propose→accept/reschedule/cancel)
require a signed-in Supabase session and land with the server-function adapters
in BC-4.1B, alongside notification and Business Interaction integration.
