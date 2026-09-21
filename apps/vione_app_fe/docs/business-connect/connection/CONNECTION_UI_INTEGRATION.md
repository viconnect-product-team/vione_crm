# BC-5.1 — Connection UI Integration

**Status:** GO. Architecture Version: Business Connect v1.

## Surface

`/business-connect/connections` is now a unified Connections workspace with
four canonical tabs, backed exclusively by `ConnectionSDK` (lifecycle),
`RelationshipGraphSDK` (recommendations) and `GlobalNetworkSDK.counterparts`
(public profile enrichment — non-lifecycle, isolated to `use-connection.ts`).

Tabs:

- **Discover** — `RecommendationFeed` + per-card `ConnectionStateAction`.
- **Incoming** — `IncomingRequestsList` (Accept / Decline).
- **Sent** — `OutgoingRequestsList` (Cancel).
- **Connected** — `ConnectedPeopleList` (Disconnect / Block via menu).

## Route search contract

Frozen in `src/lib/connection/route-search.ts`:

```
ConnectionSearch = { tab: "discover"|"incoming"|"sent"|"connected", q: string, cursor: string|null }
CONNECTION_SEARCH_DEFAULT = { tab: "discover", q: "", cursor: null }
```

Validated with `zodValidator(connectionSearchSchema)` + a route `search`
middleware that clamps unknown `tab` values to `discover`, so
`?tab=xyz` deep-links land safely.

## Query keys — `connectionKeys` factory

Namespaced under `["bc51", "connection", …]`:

| Key                 | Shape                                     |
| ------------------- | ----------------------------------------- |
| `root`              | `["bc51","connection"]`                   |
| `state(nodeId)`     | `["bc51","connection","state",nodeId]`    |
| `incoming(limit)`   | `["bc51","connection","incoming",limit]`  |
| `outgoing(limit)`   | `["bc51","connection","outgoing",limit]`  |
| `connected(limit)`  | `["bc51","connection","connected",limit]` |
| `counterparts(ids)` | `["bc51","counterparts",<sorted-csv>]`    |

Recommendation invalidation targets the existing BC-4.5 root
`["bc45","recommendations"]`.

## Invalidation matrix (`invalidateFor`)

| Mutation     | Invalidates                                                      |
| ------------ | ---------------------------------------------------------------- |
| `send`       | target state + outgoing                                          |
| `accept`     | target state + incoming + connected + recommendations            |
| `decline`    | target state + incoming                                          |
| `cancel`     | target state + outgoing                                          |
| `disconnect` | target state + connected + recommendations                       |
| `block`      | target state + connected + incoming + outgoing + recommendations |
| `unblock`    | target state + recommendations                                   |

No whole-app invalidation.

## Relationship-state mapping (`ConnectionStateAction`)

Consumes `useConnectionRelationshipState` (single source of truth):

| Canonical state    | Controls rendered                                        |
| ------------------ | -------------------------------------------------------- |
| `none`             | **Connect**                                              |
| `outgoing_pending` | Pending • **Cancel request**                             |
| `incoming_pending` | **Accept** • **Decline**                                 |
| `connected`        | Connected • overflow menu → **Disconnect** / **Block**   |
| `blocked_by_me`    | Blocked • **Unblock**                                    |
| `blocked_me`       | **Unavailable** (privacy-safe, direction never revealed) |
| `unavailable`      | **Unavailable**                                          |

## Security-boundary audit

UI layer imports only:

- `@/lib/connection` (SDK / types / errors) — lifecycle
- `@/lib/graph` via `RelationshipGraphSDK` — recommendations
- `@/lib/global-network/network.sdk` **only** for `counterparts.resolvePublic`,
  centralized in `src/hooks/use-connection.ts` — public profile lookup, not
  lifecycle.

Not imported from any UI file: `ConnectionService`, `GlobalConnectionService`,
`global-network.functions`, graph repositories/services, Supabase clients,
`user_connections` tables. No `owner_user_id` / `viewer_user_id` / authority
parameters are passed anywhere from UI.

## Deferred (not in BC-5.1)

Messaging, chat, smart introduction, meeting requests, follow model, CRM,
AI, community invitations, persistent recommendation-feedback learning,
mutual/shared-context enrichment on request cards, per-list cursor
pagination beyond the bounded default limit (server APIs currently expose
offset-only lists; will land alongside the underlying repository upgrade).
