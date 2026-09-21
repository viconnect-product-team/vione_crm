# Meeting Outcome — Events

Outcome mutations write to the existing `business_meeting_events` outbox using
`bm_log_event()` — same convention used elsewhere in the Meeting domain, so
existing timeline/consumer infrastructure picks them up unchanged.

## Event types

| `event_type`                         | Emitted on                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| `business_meeting_outcome_created`   | successful create (once per outcome)                         |
| `business_meeting_outcome_updated`   | successful draft update (once per version bump)              |
| `business_meeting_outcome_finalized` | successful transition `draft → finalized` (once per outcome) |

## Exactly-once semantics

Each event is written with a stable `mutation_key`:

- `outcome_create:<outcomeId>`
- `outcome_update:<outcomeId>:<newVersion>`
- `outcome_finalize:<outcomeId>`

Combined with the partial UNIQUE index on
`(meeting_id, mutation_key)` from BC-7.6F, replays and idempotent RPC calls
cannot emit duplicate events.

## Payload (PII-minimized)

```json
{
  "outcomeId": "uuid",
  "outcomeType": "agreement_reached",
  "outcomeStatus": "draft" | "finalized",
  "version": 2
}
```

`meetingId`, `actorUserId`, and `occurredAt` are recorded as first-class
columns on `business_meeting_events`. **`summary` is intentionally excluded**
from the generic outbox payload — downstream consumers that need it must read
the outcome table directly under RLS.
