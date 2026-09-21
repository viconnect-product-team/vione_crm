# BC-4.0 — Participant, Authorization & Privacy Model

Business Connect v1 — FROZEN.

## Global authorization

Meeting access uses `auth.uid()` + Global Identity + participant membership +
account status. It **must not** require a `members` row, an Association context,
or `current_member_id()`. Account status `suspended`/`deactivated` →
`MEETING_ACCOUNT_SUSPENDED` / `MEETING_ACCOUNT_INACTIVE`.

## Authorization matrix

| Actor                          | Read meeting                  | Read participants | Read follow-ups/notes | Create meeting | Respond            | Reschedule | Cancel | Complete |
| ------------------------------ | ----------------------------- | ----------------- | --------------------- | -------------- | ------------------ | ---------- | ------ | -------- |
| Organizer                      | ✔                             | ✔                 | own only              | ✔              | ✔ (as participant) | ✔          | ✔      | ✔        |
| Invited participant            | ✔                             | ✔                 | own only              | —              | ✔                  | ✔          | ✔      | ✔        |
| Unrelated user                 | ✗                             | ✗                 | ✗                     | ✗              | ✗                  | ✗          | ✗      | ✗        |
| Company admin (of participant) | ✗                             | ✗                 | ✗                     | ✗              | ✗                  | ✗          | ✗      | ✗        |
| Association admin              | ✗                             | ✗                 | ✗                     | ✗              | ✗                  | ✗          | ✗      | ✗        |
| Platform moderator             | only with explicit permission | "                 | ✗ (never notes)       | ✗              | ✗                  | ✗          | ✗      | ✗        |
| Anonymous                      | ✗                             | ✗                 | ✗                     | ✗              | ✗                  | ✗          | ✗      | ✗        |

## RLS design

- `business_meetings` SELECT: `auth.uid()` is organizer OR active participant.
- `business_meeting_participants` SELECT: caller is a participant of the meeting
  (or authorized moderator).
- `business_meeting_proposals` SELECT: caller is a participant of the meeting.
- `business_meeting_followups` SELECT/ALL: `owner_user_id = auth.uid()`.
- `business_meeting_notes` SELECT/ALL: `owner_user_id = auth.uid()`.
- Direct INSERT/UPDATE/DELETE on meetings/participants/proposals: **revoked** to
  `authenticated`; all writes go through SECURITY DEFINER RPCs. Follow-ups and
  notes may allow direct owner-scoped writes (owner = auth.uid()) or RPC.
- GRANT `SELECT` (+ owner writes where applicable) to `authenticated`;
  `GRANT ALL` to `service_role`. No `anon` grants — meetings are never public.

Explicitly verified in the test plan: unrelated users cannot read; company owners
cannot read employees' meetings; association admins cannot read members' private
meetings; blocked/reported users gain no visibility; anonymous denied.

## Private meeting notes (recommendation)

Persist private notes in a **dedicated `business_meeting_notes` table**, not in
participant metadata and not in Business Interaction notes.

| Field                   | Type             | Notes         |
| ----------------------- | ---------------- | ------------- |
| id                      | uuid PK          |               |
| meeting_id              | uuid FK          |               |
| owner_user_id           | uuid             | = auth.uid()  |
| body                    | text             | owner-private |
| created_at / updated_at | timestamptz      |               |
| deleted_at              | timestamptz null | soft delete   |

Rationale: preserves strict owner-private visibility, prevents accidental sharing
through the meeting aggregate, keeps a clean boundary for future AI
summarization, and guarantees no leakage through notification payloads. Shared
notes are out of scope unless separately approved. Edit history (if required
later) is additive via a `*_history` table.

## Participant integrity

- Participant identity is resolved server-side from trusted context.
- No arbitrary participant injection from the client.
- One participant never sees another participant's private connections, notes,
  or follow-ups.
- External (non-user) participants are deferred beyond MVP.
