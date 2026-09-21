# BC-7.0 — Meeting Aggregate

Canonical aggregate root: `business_meetings`. See
`BC4_1A_SCHEMA_AND_AGGREGATE.md` for the full column list; this document
freezes the aggregate under the BC-7.0 name.

## Root table

`public.business_meetings` — 18 columns, FORCE RLS, optimistic concurrency
via `version` (bigint, monotonically increasing on every mutation).

## Child entities

- `business_meeting_participants` — participant list, role, response state.
- `business_meeting_proposals` — versioned time/location proposals; the
  latest row is the current proposal, older rows are history.
- `business_meeting_proposal_history` — append-only audit trail.
- `business_meeting_eligibility_snapshots` — Policy B evaluation captured
  at proposal time.

## Invariants

- Exactly one organizer participant per meeting.
- Terminal statuses (`declined`, `cancelled`, `completed`, `no_show`) are
  immutable; enforced by DB triggers and state machine.
- `version` on the root MUST match the caller's `expectedVersion` for
  mutations; otherwise `MEETING_STALE_VERSION` is raised.
- Proposal `version` MUST be strictly greater than the previous proposal's
  version; enforced by CHECK constraint + `isFreshVersion`.

## DTO surface

Consumers see JSON-safe DTOs from `src/lib/business-meetings/types.ts`
(`MeetingListItemDTO`, `MeetingDetailDTO`, `ProposalHistoryDTO`,
`MeetingCountsDTO`). Raw rows never leave the repository.
