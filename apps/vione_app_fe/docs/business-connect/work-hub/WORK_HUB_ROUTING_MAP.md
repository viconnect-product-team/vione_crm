# Work Hub — Action Routing Map (BC-8.0)

Every card routes into a canonical product surface. The Hub never
renders lifecycle UI itself.

| Item kind                                                                                                                                                                                                         | Target route                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `connection_request_received`, `connection_request_sent_waiting`                                                                                                                                                  | `/business-connect/connections`                                                                    |
| `introduction_request_received`                                                                                                                                                                                   | `/business-connect/introductions/inbox`                                                            |
| `introduction_request_accepted_waiting_delivery`, `introduction_delivery_received`                                                                                                                                | `/business-connect/introductions/deliveries`                                                       |
| `meeting_invitation_response_required`, `meeting_time_response_required`, `meeting_final_time_selection_ready`, `meeting_schedule_required`, `meeting_upcoming`, `meeting_outcome_missing`, `meeting_follow_up_*` | `/business-connect/meetings/$meetingId`                                                            |
| `relationship_activity_recent`                                                                                                                                                                                    | `/business-connect/connections/$personNodeId` (fallback `/business-connect/relationship-timeline`) |

All routes are type-safe TanStack paths. UI passes `targetRoute`,
`targetParams`, and `targetSearch` straight into `<Link to>`.
