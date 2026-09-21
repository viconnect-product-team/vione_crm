# BC-7.9 Turn B — Follow-up Events

All follow-up mutations emit exactly one event per accepted state change,
via `bm_log_event(meeting_id, actor_user_id, event_type, mutation_key,
source_type := 'meeting_follow_up', source_id := follow_up_id, meta)`.

| Event type                             | Emitted when                                            | `mutation_key`                       |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------ |
| `business_meeting_follow_up_created`   | `_create` inserts a new row (not the idempotent replay) | `follow_up_create:<id>`              |
| `business_meeting_follow_up_updated`   | `_update` accepts any field change                      | `follow_up_update:<id>:<newVersion>` |
| `business_meeting_follow_up_started`   | Status → `in_progress`                                  | `follow_up_start:<id>`               |
| `business_meeting_follow_up_completed` | Status → `completed`                                    | `follow_up_complete:<id>`            |
| `business_meeting_follow_up_cancelled` | Status → `cancelled`                                    | `follow_up_cancel:<id>`              |

Meta payload (minimal, no PII):

```json
{
  "followUpId": "uuid",
  "meetingId": "uuid",
  "outcomeId": "uuid|null",
  "status": "open|in_progress|completed|cancelled",
  "priority": "low|normal|high|urgent",
  "dueAt": "iso|null",
  "version": 2
}
```

Idempotency: `business_meeting_mutations (actor_user_id, mutation_key)` is
UNIQUE. A retried mutation with the same effect uses the same key and skips
the second insert, so downstream consumers see each state change once.
