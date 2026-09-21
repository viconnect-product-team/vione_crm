# Work Hub — Source Registry (BC-8.0)

The Hub is a read-model only. It reads from exactly six canonical domain
sources and never owns state. Each source contributes one bounded query
per viewer request (§24, §41).

| Source                  | Table(s)                      | Resolver                      | Emitted item kinds                                                                                                                                                                         |
| ----------------------- | ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Connection requests     | `global_connection_requests`  | `resolveConnectionRequest`    | `connection_request_received`, `connection_request_sent_waiting`                                                                                                                           |
| Introduction requests   | `introduction_requests`       | `resolveIntroductionRequest`  | `introduction_request_received`, `introduction_request_accepted_waiting_delivery`                                                                                                          |
| Introduction deliveries | `introduction_deliveries`     | `resolveIntroductionDelivery` | `introduction_delivery_received`                                                                                                                                                           |
| Meeting workspace       | `business_meetings`           | `resolveMeetingWorkspaceItem` | `meeting_invitation_response_required`, `meeting_time_response_required`, `meeting_final_time_selection_ready`, `meeting_schedule_required`, `meeting_upcoming`, `meeting_outcome_missing` |
| Meeting follow-ups      | `business_meeting_follow_ups` | `resolveMeetingFollowUp`      | `meeting_follow_up_overdue`, `meeting_follow_up_due_soon`, `meeting_follow_up_active`                                                                                                      |
| Relationship activity   | `graph_timeline_events`       | `resolveRelationshipActivity` | `relationship_activity_recent`                                                                                                                                                             |

All reads execute through the caller's authenticated Supabase client
(`requireSupabaseAuth`), so RLS is the security boundary. The repository
projects only PII-safe columns; no note bodies, outcome text, tokens, or
tenant metadata are read.

## Bounds

- Per-source cap: `WORK_HUB_SOURCE_READ_LIMIT_DEFAULT = 30` (max 100).
- Page size: `WORK_HUB_PAGE_SIZE_DEFAULT = 20`, max 100.
- Time windows: upcoming 30d, due-soon 7d, recent 14d — frozen constants.

Adding a new source requires: (a) new entry in `WORK_HUB_SOURCE_TYPES`,
(b) resolver, (c) repository read with an explicit `LIMIT`, (d) a bump of
`WORK_HUB_PRIORITY_VERSION`.
