# BC-4.1A — Versioned Proposals & Reschedule Concurrency

## Model

Each timing proposal is an immutable `business_meeting_proposals` row keyed by
`(meeting_id, version)`. The meeting's `active_proposal_version` points at the live
version; superseded rows carry `superseded_at`.

## Reschedule (version-safe)

`business_meeting_propose_new_time`:

1. `SELECT ... FOR UPDATE` on the meeting row (serializes concurrent
   counter-proposals).
2. Compute `next := active_proposal_version + 1`.
3. Mark the current proposal `superseded_at = now()`.
4. Insert the new proposal at `version = next`.
5. Set meeting `status = proposed`, `active_proposal_version = next`,
   `confirmed_proposal_id = NULL`.

The row lock makes the higher version win deterministically; the losing concurrent
writer re-reads a bumped version and its stale insert fails on the
`(meeting_id, version)` unique constraint → mapped to `MEETING_STALE_VERSION`.

## Accept (version-checked)

`business_meeting_accept(meeting_id, expected_version, mutation_key)` requires the
caller to pass the version it saw. If `expected_version <> active_proposal_version`
→ `MEETING_STALE_VERSION`. On success: proposal `accepted_at = now()`, meeting
`confirmed`, `confirmed_proposal_id` set, `start_at`/`end_at` copied to the
aggregate.

## Concurrency guarantees

- duplicate propose/accept/reschedule → idempotent via
  `(actor_user_id, mutation_key)` ledger (cached result returned).
- concurrent accept → single authoritative state under row lock.
- cancel/accept race → first committed transition wins; loser sees
  `MEETING_INVALID_TRANSITION`.
- complete after cancellation → `MEETING_INVALID_TRANSITION`.
- proposals are never mutated in place (immutability trigger).
