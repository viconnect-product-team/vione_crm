# BC-6.6 — OutcomeEventEnvelope

Frozen internal contract crossing the adapter boundary. PII-free.

| Field            | Type                     | Notes                                                      |
| ---------------- | ------------------------ | ---------------------------------------------------------- |
| `eventId`        | uuid                     | `graph_outbox_events.id`                                   |
| `idempotencyKey` | text                     | mirrors outbox key `io:<outcomeId>:<kind>:<status>:<type>` |
| `eventType`      | enum                     | see allowlist below                                        |
| `aggregateType`  | `'introduction_outcome'` | literal                                                    |
| `aggregateId`    | uuid                     | `introduction_outcomes.id`                                 |
| `outcomeId`      | uuid                     | ditto (from payload)                                       |
| `status`         | text\|null               | outcome status                                             |
| `outcomeType`    | text\|null               | outcome type                                               |
| `outcomeSource`  | text\|null               | outcome source                                             |
| `occurredAt`     | ISO ts                   | logical transition time                                    |
| `schemaVersion`  | text                     | `OUTCOME_EVENT_SCHEMA_VERSION`                             |
| `attemptCount`   | int                      | transport-only                                             |
| `firstSeenAt`    | ISO ts                   | transport-only                                             |
| `lastAttemptAt`  | ISO ts                   | transport-only                                             |

## Allowlisted event kinds

- `introduction_outcome_created`
- `introduction_outcome_connected`
- `introduction_outcome_progressed`
- `introduction_outcome_no_outcome`
- `introduction_outcome_expired`

## Forbidden fields

Names · emails · phone · notes · raw graph path · hidden topology.

## Schema version

`OUTCOME_EVENT_SCHEMA_VERSION = "1.0.0"`. Unsupported versions → permanent
failure, dead-lettered on all required adapters, no adapter dispatch.
