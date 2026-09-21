# BC-4.0 — Follow-up Model

Business Connect v1 — FROZEN. Follow-ups are **private, owner-scoped** actions.
They are NOT shared tasks, NOT assignable to a counterpart, NOT a CRM pipeline,
NOT project tasks.

## `business_meeting_followups`

| Field                   | Type                        | Null | Notes                                             |
| ----------------------- | --------------------------- | ---- | ------------------------------------------------- |
| id                      | uuid PK                     | no   |                                                   |
| meeting_id              | uuid FK → business_meetings | no   | may reference a meeting before or after it occurs |
| owner_user_id           | uuid                        | no   | = auth.uid()                                      |
| title                   | text                        | no   | ≤ 200                                             |
| note                    | text                        | yes  | ≤ 4000, owner-private                             |
| status                  | enum `followup_status`      | no   | open / completed / cancelled                      |
| priority                | text                        | yes  | low / normal / high (additive)                    |
| due_at                  | timestamptz                 | yes  | UTC                                               |
| completed_at            | timestamptz                 | yes  |                                                   |
| reminder_at             | timestamptz                 | yes  | owner-private reminder                            |
| created_at / updated_at | timestamptz                 | no   |                                                   |
| deleted_at              | timestamptz                 | yes  | soft delete only                                  |

## Rules

- Visibility: `owner_user_id = auth.uid()` — a counterpart can never read it.
- No shared follow-up list in MVP; no assignment to the counterpart.
- A follow-up may exist before or after the meeting.
- Completing a follow-up **may** create a private Business Interaction event
  (`followup_completed`) on the owner's relationship edge, deduped by idempotency
  key; the note body is never copied.
- Cancellation/soft-delete never destroys the row unexpectedly (retention §).
- Reminders are owner-private, timezone-safe, idempotent, and invalidated on
  cancellation.

## Statuses (`followup_status`)

`open → completed`, `open → cancelled`. `completed`/`cancelled` are terminal
(reopen creates a new follow-up).
