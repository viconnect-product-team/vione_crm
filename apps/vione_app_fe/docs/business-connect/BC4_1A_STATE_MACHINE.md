# BC-4.1A — State Machine

One pure function (`evaluateMeetingTransition` in
`src/lib/business-meetings/state-machine.ts`) mirrors the DB mutation-function
guards. Client-supplied target statuses are never accepted.

## Statuses

`draft, proposed, confirmed, declined, cancelled, completed, no_show`.
Terminal: `declined, cancelled, completed, no_show`.

## Transitions

| From      | Operation    | To        | Actor               | DB function                         |
| --------- | ------------ | --------- | ------------------- | ----------------------------------- |
| draft     | propose      | proposed  | organizer           | `business_meeting_propose`          |
| proposed  | accept       | confirmed | invited participant | `business_meeting_accept`           |
| proposed  | decline      | declined  | invited participant | `business_meeting_decline`          |
| proposed  | cancel       | cancelled | organizer           | `business_meeting_cancel`           |
| proposed  | reschedule   | proposed  | either participant  | `business_meeting_propose_new_time` |
| confirmed | reschedule   | proposed  | either participant  | `business_meeting_propose_new_time` |
| confirmed | cancel       | cancelled | organizer           | `business_meeting_cancel`           |
| confirmed | complete     | completed | either participant  | `business_meeting_complete`         |
| confirmed | mark_no_show | no_show   | either participant  | `business_meeting_mark_no_show`     |

Any other `(from, operation)` → `MEETING_INVALID_TRANSITION`. Wrong actor →
`MEETING_NOT_ORGANIZER` / `MEETING_NOT_PARTICIPANT`. Organizer accepting/declining
own proposal → `MEETING_INVALID_TRANSITION`. Stale version → `MEETING_STALE_VERSION`.

## Confirmation policy (two-party MVP — FROZEN)

Meeting becomes `confirmed` when the single required invited participant accepts
the **active** proposal version. Optional participants never block confirmation.
Stale responses (against a superseded version) do not count. Multi-required-party
"all must accept" is deferred (documented, not implemented).

## Actor resolution

From trusted context only: `organizer_user_id`, participant row membership, or
explicit platform moderator (`is_platform_admin`). No implicit Association/Company
admin authority.
