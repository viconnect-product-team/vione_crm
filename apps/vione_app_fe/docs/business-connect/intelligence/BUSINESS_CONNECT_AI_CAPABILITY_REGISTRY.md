# BC-9.0 — Capability Registry

| Capability                   | Risk tier          | Scope                          | Allowed sources                                                          |
| ---------------------------- | ------------------ | ------------------------------ | ------------------------------------------------------------------------ |
| `relationship_briefing`      | read_only_analysis | person / organization          | profile, relationship, graph, meeting, outcome, follow-up, company       |
| `meeting_preparation`        | read_only_analysis | meeting                        | meeting, agenda, shared notes, outcome, profile, relationship, follow-up |
| `introduction_draft`         | draft_generation   | introduction / person          | profile, relationship, introduction, company                             |
| `follow_up_draft`            | draft_generation   | meeting / person               | meeting, outcome, follow-up, shared notes, profile, relationship         |
| `next_action_suggestion`     | decision_support   | work_hub / global              | work-hub items, meeting, follow-up, introduction, relationship           |
| `opportunity_signal_summary` | decision_support   | global / person / organization | graph, relationship, profile, company                                    |
| `network_query`              | read_only_analysis | any                            | profile, relationship, graph, company, meeting, introduction             |
| `work_hub_assistant`         | decision_support   | work_hub / global              | work-hub, meeting, follow-up, introduction, relationship, notification   |

**No** capability maps to `prohibited_autonomous_action`. This is a compile-time union member kept only to make the negative assertion loud and explicit.
