# BC-7.9 Turn A — Meeting Outcome Domain Architecture

## Purpose

Canonical, organizer-authored record of what happened in a meeting.
One outcome per meeting. Optional. Never blocks meeting completion.

## Boundaries

- **Own**: `business_meeting_outcomes` table, 3 RPCs, `MeetingOutcomeService`,
  `MeetingOutcomeSDK`.
- **Consumes**: `business_meetings` (organizer, status), `bm_is_participant()`,
  `bm_log_event()` (existing outbox convention).
- **Emits**: `business_meeting_outcome_{created,updated,finalized}` events into
  `business_meeting_events` with a per-operation `mutation_key`.
- **Deferred**: Follow-up (Turn B), UI/timeline integration (Turn C), graph
  signals, AI summary/transcription.

## Layering

- `types.ts` — public shape.
- `registry.ts` — frozen type/status registry + transition rule.
- `outcome-policy.ts` — pure authority / eligibility functions.
- `repository.server.ts` — RPC calls + RLS reads only, no policy.
- `service.server.ts` — input normalization, error mapping, DTO projection.
- `functions.ts` — authenticated `createServerFn` adapters.
- `sdk.ts` — frozen 4-method client surface.

## Invariants

1. One canonical outcome per meeting (`UNIQUE (meeting_id)`).
2. Lifecycle: `draft → finalized`. No reopen, no supersede, no delete.
3. Writes only via SECURITY DEFINER RPCs (RLS FORCEd; no DML policies).
4. Organizer-only authority (create/update draft/finalize).
5. Participants (incl. organizer) can read; anyone else denied.
6. Optimistic concurrency via `expectedVersion`.
7. Idempotency via `client_request_id` (create) and per-op `mutation_key`.
8. Exactly-once outcome events.
9. Meeting completion never blocked by outcome presence.
