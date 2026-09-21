# Meeting Outcome — Policy

## Authority (BC-7.9 Turn A)

- **Create**: organizer only, when no outcome exists and meeting is eligible.
- **Update (draft)**: organizer only, while outcome status is `draft`.
- **Finalize**: organizer only, while outcome status is `draft`.
- **Read**: any authorized meeting participant (incl. organizer) and platform
  admin. Unrelated users and anonymous callers: denied.

Collaborative editing is out of scope for Turn A.

## Meeting-state eligibility

Create / update / finalize are permitted only when meeting status is
`in_progress` or `completed`. Any of
`draft, proposed, confirmed, declined, cancelled, no_show` → denied with
`MEETING_OUTCOME_INVALID_STATE`.

The completion transition itself is **never** blocked by outcome presence.
Downstream Workspace derivation of "completed meeting + no outcome →
outcome missing" is intentionally reserved for Turn C.

## Summary

- Optional plain text.
- Server trims and rejects `length > 2000`.
- HTML is never trusted or rendered as HTML in Turn A surfaces.

## Concurrency

- Every update / finalize requires `expectedVersion` matching current row.
- Stale writes raise `MEETING_OUTCOME_VERSION_CONFLICT`.
- Update RPC uses `WHERE id = ? AND version = expectedVersion` atomically
  and bumps `version = version + 1`.

## Idempotency

- Create with same `client_request_id` on the same meeting returns the same
  canonical row (no duplicate insert).
- Finalize on an already-finalized outcome returns the current record
  (no version bump, no additional event).
