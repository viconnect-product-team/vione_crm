# BC-7.9 Turn B — Follow-up State Machine

Statuses: `open`, `in_progress`, `completed`, `cancelled`.

Allowed transitions (frozen):

| From → To   | in_progress | completed | cancelled |
| ----------- | :---------: | :-------: | :-------: |
| open        |     ✅      |    ✅     |    ✅     |
| in_progress |      —      |    ✅     |    ✅     |
| completed   |      —      |     —     |     —     |
| cancelled   |      —      |     —     |     —     |

Terminals: `completed`, `cancelled`. Once terminal:

- No edits to any field (immutability trigger).
- No further status changes.
- Duplicate `set_status(completed)` on a completed row and duplicate
  `cancel` on a cancelled row are idempotent no-ops (same row, no new event).

`completed_at` is set on entry to `completed`. `cancelled_at` is set on
entry to `cancelled`. Both are cleared to `null` on the opposite terminal
(a follow-up only ever ends in one terminal).

Optimistic concurrency: every update / status change / cancel requires
`expected_version = version`. Mismatch → `MEETING_FOLLOW_UP_VERSION_CONFLICT`.
Successful mutation bumps `version` by exactly 1 and emits exactly one
outbox event.
