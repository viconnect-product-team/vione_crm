# BC-7.0 — Meeting State Machine

Frozen at `src/lib/business-meetings/state-machine.ts` (BC-4.1A).
Verified by `src/__tests__/business-meetings.bc41a.test.ts` and
`src/__tests__/meeting-foundation.bc70.test.ts`.

## States

`draft → proposed → confirmed → completed`
Terminal branches: `declined`, `cancelled`, `no_show`.

## Transitions

| From      | Op           | Actor       | To                     |
| --------- | ------------ | ----------- | ---------------------- |
| draft     | propose      | organizer   | proposed               |
| proposed  | accept       | participant | confirmed              |
| proposed  | decline      | participant | declined               |
| proposed  | cancel       | organizer   | cancelled              |
| proposed  | reschedule   | participant | proposed (new version) |
| confirmed | reschedule   | either      | proposed (new version) |
| confirmed | cancel       | organizer   | cancelled              |
| confirmed | complete     | either      | completed              |
| confirmed | mark_no_show | either      | no_show                |

## Guardrails

- Organizer cannot accept own proposal.
- Non-participants are rejected on every operation.
- All terminal statuses reject every operation.
- Every mutation carries `expectedVersion`; stale versions raise
  `MEETING_STALE_VERSION` and clients reconcile via `useReconcile`.

## Error codes

`MEETING_STALE_VERSION`, `MEETING_BLOCKED`, `MEETING_NOT_ELIGIBLE`,
`MEETING_INVALID_TRANSITION`, `MEETING_NOT_ORGANIZER`,
`MEETING_NOT_PARTICIPANT`, `MEETING_RATE_LIMITED`,
`MEETING_IMMUTABLE_FIELD`, `MEETING_AUTH_REQUIRED`.
