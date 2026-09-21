# BC-9.0 — Context Policy

## Windows (§11, §12)

| Domain                       | Window                 |
| ---------------------------- | ---------------------- |
| Relationship recent activity | 90 days, max 20 events |
| Meeting history              | max 10                 |
| Follow-ups                   | max 20                 |
| Introductions                | max 10                 |
| Work Hub items               | max 30                 |
| Shared notes                 | max 20                 |
| Agenda items                 | max 50                 |

## Result expiry (§38)

| Capability                 | Expiry                                       |
| -------------------------- | -------------------------------------------- |
| relationship_briefing      | 24h                                          |
| meeting_preparation        | until meeting starts OR 6h (whichever first) |
| introduction_draft         | 24h                                          |
| follow_up_draft            | 24h                                          |
| next_action_suggestion     | 1h                                           |
| opportunity_signal_summary | 24h                                          |
| network_query              | 1h                                           |
| work_hub_assistant         | 1h                                           |

## Rate limits (§58, per user per day defaults)

| Capability                 | Limit |
| -------------------------- | ----- |
| relationship_briefing      | 20    |
| meeting_preparation        | 20    |
| introduction_draft         | 30    |
| follow_up_draft            | 30    |
| next_action_suggestion     | 50    |
| opportunity_signal_summary | 20    |
| network_query              | 50    |
| work_hub_assistant         | 50    |

## Tool-loop limits (§44)

- Max tool calls per request: **8**
- Max iterations: **6**
- Max total retrieved facts: **100**
- Max wall-clock: **~45s** (deployment-tunable)

## Envelope size hard cap

`MAX_CONTEXT_ENVELOPE_CHARS = 48_000` — defensive outer bound. Runtime
enforces stricter per-model token budgets.
