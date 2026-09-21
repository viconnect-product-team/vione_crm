# BC-7.9 Turn B — Follow-up Ownership & Authority

Actors: **organizer**, **participant** (of the parent meeting), **other**.
Authority is enforced identically in the SQL RPCs and mirrored in the pure
`follow-up-policy.ts` for UI derivation.

## Create

| Viewer      | May create? | Owner they may assign                    |
| ----------- | :---------: | ---------------------------------------- |
| organizer   |     ✅      | any meeting participant (including self) |
| participant |     ✅      | **self only**                            |
| other       |     ❌      | —                                        |

Invalid owner (non-participant) → `MEETING_FOLLOW_UP_INVALID_OWNER`.

## Edit (title / description / priority / due / outcome link)

- Organizer: any follow-up on the meeting.
- Participant: only follow-ups where they are `owner` or `created_by`.
- Terminal follow-ups: nobody edits.

## Change status (`in_progress` / `completed`)

- Organizer: always.
- Participant: only when they are the current `owner`.

## Cancel

Same rule as change-status.

## Reassign `owner_user_id`

- **Organizer only.** Participants cannot reassign — not even the current
  owner. New owner must be an eligible meeting participant.

Denied paths raise `MEETING_FOLLOW_UP_FORBIDDEN`.
