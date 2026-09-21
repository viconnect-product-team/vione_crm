# BC-9.0 — Structured Response Schemas

Each capability has a Zod schema exported by
`src/lib/business-connect/intelligence/response-schemas.ts`. Free-form text is
never accepted for operational capabilities.

Every response carries the shared meta trio:

- `confidence: "low" | "medium" | "high"`
- `citations: Citation[]` — each cites a `SafeRef` present in the envelope
- `limitations: string[]` — honest surfacing of missing data / omissions

## Schemas

| Capability                 | Schema                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| relationship_briefing      | `RelationshipBriefingResponseSchema`                                                              |
| meeting_preparation        | `MeetingPreparationResponseSchema`                                                                |
| introduction_draft         | `IntroductionDraftResponseSchema`                                                                 |
| follow_up_draft            | `FollowUpDraftResponseSchema`                                                                     |
| next_action_suggestion     | `NextActionSuggestionResponseSchema` — each suggestion has `requiresHumanDecision: literal(true)` |
| opportunity_signal_summary | `OpportunitySignalResponseSchema` — `type` bounded to approved signal enum                        |
| network_query              | `NetworkQueryResponseSchema`                                                                      |
| work_hub_assistant         | `WorkHubAssistantResponseSchema`                                                                  |

## No schema bounds (deliberate)

Per `ai-sdk-agent-patterns`, schemas contain **no** `.min()`/`.max()`/length
bounds, string `format`/`pattern`, or long enums. Bounds are enforced by:

- prompt text (soft guidance)
- post-generation factuality validator (Turn B)
- caller code clamping arrays before display
