# BC-4.0 — Meeting State Machine

Business Connect v1 — FROZEN. Mirrors the BC-3.1A pattern: one pure function
(`evaluateMeetingTransition`) + a DB guard that enforces the identical rules.
Client-supplied target statuses are never accepted.

## Statuses

`draft, proposed, confirmed, declined, cancelled, completed, no_show`

## Transitions

| From      | Operation                | To        | Actor                                  |
| --------- | ------------------------ | --------- | -------------------------------------- |
| draft     | propose                  | proposed  | organizer                              |
| proposed  | accept                   | confirmed | invited participant (recipient)        |
| proposed  | decline                  | declined  | invited participant                    |
| proposed  | cancel                   | cancelled | organizer                              |
| proposed  | reschedule (new version) | proposed  | either participant                     |
| confirmed | cancel                   | cancelled | either participant                     |
| confirmed | complete                 | completed | either participant                     |
| confirmed | mark_no_show             | no_show   | either participant                     |
| confirmed | reschedule (new version) | proposed  | either participant                     |
| completed | —                        | —         | terminal (immutable)                   |
| cancelled | —                        | —         | terminal                               |
| declined  | —                        | —         | terminal (reopen only via new meeting) |
| no_show   | complete/reopen          | (policy)  | either — treated near-terminal         |

Any other `(from, operation)` → `MEETING_INVALID_TRANSITION`.
Wrong actor → `MEETING_NOT_ORGANIZER` / `MEETING_NOT_PARTICIPANT`.
Reschedule/accept against an outdated version → `MEETING_STALE_VERSION`.

## Actor resolution

Resolved from trusted context only:

- `organizer` — `organizer_user_id`
- `participant` / recipient — row in `business_meeting_participants`
- `either` — any participant
- `platform_moderator` — explicit permission (no implicit Association/Company admin)

## Reschedule (version-safe)

`reschedule` inserts a new `business_meeting_proposals` row with
`version = meeting.version + 1`, sets meeting back to `proposed`, and bumps
`meeting.version`. `accept` must pass the version it saw; if it no longer matches
`meeting.version`, reject with `MEETING_STALE_VERSION`. Row-level locking in the
RPC serializes concurrent counter-proposals; the higher version wins
deterministically and the loser is superseded.

## Concurrency guarantees

- duplicate propose/accept/... → idempotent via `(actor, mutation_key)` cache
- concurrent accept → single authoritative state under row lock
- cancel/accept race → deterministic (first committed transition wins; the other
  sees `MEETING_INVALID_TRANSITION`)
- complete after cancellation → `MEETING_INVALID_TRANSITION`
- no duplicate notification / interaction event (dedupe by origin event id)
