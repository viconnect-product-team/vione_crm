# BC-Mobile-1A — Home Data Contract Verification

**Date:** 2026-08-09
**Scope:** Verification of real, callable, client-safe data boundaries for `/connect-app` Home BEFORE any UI was written. Names below were verified against source, not audit prose.

## Verified contracts

| Home need | Existing source | Function / SDK | DTO | Tenant/user authority | Status |
|---|---|---|---|---|---|
| Authenticated identity (name, avatar) | Platform Identity (BC-1.0) | `getCurrentUserFn` — `src/lib/identity/platform-identity.functions.ts:26` | `GlobalIdentityContext { userId, email, profile: UserProfile \| null }` — `identity.types.ts:26` | `requireSupabaseAuth` → `context.userId`; RLS as caller | **LIVE_REUSABLE** |
| Today briefing (meetings, follow-ups, pending actions, relationship activity) | Unified Work Hub read-model (BC-8.0) | `getWorkHubOverviewFn` — `src/lib/business-connect/work-hub/functions.ts:38` | `WorkHubOverviewDTO { summary, previews: Record<category, WorkHubItemDTO[]> }` — `work-hub/types.ts:175` | authed fn; identity from bearer token; PII-safe display contract (`types.ts:134-143`) | **LIVE_REUSABLE** |
| Notification unread state/count | Notification Orchestration (BC-8.1) | `NotificationOrchestrationSDK.getUnreadCount` → `getUnreadNotificationCountFn` — `list-functions.ts:112` | `{ count: number }` | authed fn; RLS as caller | **LIVE_REUSABLE** |
| Upcoming meeting signal | Work Hub kinds `meeting_upcoming`, `meeting_invitation_response_required`, `meeting_time_response_required`, … | (via Work Hub above) | `WorkHubItemDTO { startsAt, dueAt, safeDisplayData.counterpartDisplayName, action.targetRoute }` | as above | **LIVE_REUSABLE** (via Work Hub) |
| Follow-up signal | Work Hub kinds `meeting_follow_up_overdue` / `due_soon` / `active` (BC-7.9 domain underneath) | (via Work Hub above) | as above | as above | **LIVE_REUSABLE** (via Work Hub) |
| Relationship / connection attention | Work Hub kinds `connection_request_*`, `introduction_*`, `relationship_activity_recent` | (via Work Hub above) | as above | as above | **LIVE_REUSABLE** (via Work Hub) |
| BC AI recommendations (BC-4.5) | `RelationshipGraphSDK.recommendConnections` via `use-recommendations.ts` | `RecommendationPageDTO` | requires `sourceNodeId` (person node) | authed | **NOT_USED** — Home must not invent ranking; Work Hub already exposes server-prioritized signals. Adding the graph feed would duplicate the priority model. |
| Viewer user id (query-key scoping) | `useViewerUserId` — `src/hooks/use-viewer-user-id.ts` | local session | `string \| null` | client-side session only, never route input | **LIVE_REUSABLE** (cache-key scoping only) |
| Private relationship memory / notes | relationship-memory domain | — | — | excluded from AI + display by frozen contract | **NOT_AVAILABLE** to Home by design (privacy freeze) |

## Composition decision

One thin client-safe hook — `useBusinessConnectHome()` (`src/hooks/use-business-connect-home.ts`):

- Aggregates the three LIVE_REUSABLE contracts above into a single normalized shape `{ identity, today, unreadNotificationCount }`.
- Query key is **identity-scoped**: `["bc-mobile", "home", viewerUserId]` — an account switch changes the key, so no cross-account cached Home is possible.
- **Graceful degradation:** identity is core (its failure shows the quiet retry state); Work Hub and unread-count failures degrade independently (Today retry panel / bell without badge). Failures never fall back to mocks.
- **Priority model:** items are taken in the FROZEN Work Hub category precedence (`overdue → needs_action → due_soon → upcoming → waiting → recent`), server-ordered inside each category, deduped by the server-computed `dedupeKey`, capped at 3. No client-side score, no new ranking, no invented AI.
- **Privacy:** the composition touches only identity, Work Hub, and notification-count contracts. No relationship-memory, no note bodies, no embeddings, no score internals.
