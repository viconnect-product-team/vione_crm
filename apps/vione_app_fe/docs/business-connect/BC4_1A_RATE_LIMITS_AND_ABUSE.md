# BC-4.1A — Rate Limits & Abuse Controls

Mirrors the BC-3.1F guarded-request pattern. Enforced inside
`business_meeting_propose` (new-meeting creation path) using authoritative counts
from `business_meeting_events`.

## Caps (new meeting proposals per proposer)

- **Hourly:** 10 → exceed → `MEETING_RATE_LIMITED`
- **Daily:** 30 → exceed → `MEETING_RATE_LIMITED`

Reschedules (`propose_new_time`) on existing meetings are not counted against the
new-meeting caps but remain bounded by the state machine and version guards.

## Idempotency

Every mutation accepts an optional `mutation_key`. A replay with the same
`(actor_user_id, mutation_key)` returns the cached result and never re-counts
against limits.

## Blocking

Blocked pairs cannot propose or reschedule (`MEETING_BLOCKED`). Pending proposals
between a pair that becomes blocked are treated as cancellable by policy (baseline
documented; sweep automation deferred).

## Deferred

Per-pair proposal cooldown after decline, global spam heuristics, and moderator
review queues are deferred to a later slice.
