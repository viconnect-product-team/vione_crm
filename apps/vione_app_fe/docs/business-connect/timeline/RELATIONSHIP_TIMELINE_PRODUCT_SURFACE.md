# RELATIONSHIP_TIMELINE_PRODUCT_SURFACE

**Slice:** BC-7.5C
**Status:** Shipped
**Owner:** Business Connect

## Routes

| Route                                         | Scope  | Purpose                                                       |
| --------------------------------------------- | ------ | ------------------------------------------------------------- |
| `/business-connect/relationship-timeline`     | Viewer | Full projected timeline for the current person node           |
| `/business-connect/connections/$personNodeId` | Pair   | Relationship detail — timeline between viewer and counterpart |

Both routes are `ssr: false` and set `robots: noindex` (private, per-viewer).

## Component tree

```
routes/business-connect.relationship-timeline.tsx
routes/business-connect.connections.$personNodeId.tsx
  └── <RelationshipTimeline mode="viewer" | "pair" />
       ├── <RelationshipTimelineFilters />
       ├── <RelationshipTimelineLoading /> | <RelationshipTimelineError /> | <RelationshipTimelineEmptyState />
       └── <RelationshipTimelineGroup />
            └── <RelationshipTimelineItem />   ← presentation registry
```

All components live at `src/components/business-connect/timeline/`.

## Data access

UI consumes **only** the SDK barrel:

- `RelationshipTimelineSDK` — via `useRelationshipTimeline`, `useRelationshipPairTimeline`, `useRelationshipTimelineEvent` in `src/hooks/use-relationship-timeline.ts`.
- No direct `graph_timeline_events` reads.
- No Supabase client, projection consumer, or outbox access from UI code.

## Query keys

Defined in `src/hooks/use-relationship-timeline.ts`:

```
["bc75","relationshipTimeline"]
["bc75","relationshipTimeline","list", params]
["bc75","relationshipTimeline","pair", params]
["bc75","relationshipTimeline","detail", nodeId, eventId]
```

Timeline is read-only — no `invalidateQueries` for writes; refresh is manual (`query.refetch()`).

## Filters

Category chips: `all | connection | introduction | meeting | card | membership | work`. Toggled via `aria-pressed`, Escape resets to `all`. Filter is applied server-side in viewer mode (SDK `categories`) and client-side in pair mode.

## Grouping

Date buckets rendered in order: `Today, Yesterday, Last 7 days, Last month, Older`. Bucketing is computed at render time from `occurredAt` and never persisted.

## Pagination

Cursor-based (`hasNextPage` / `fetchNextPage`), default 30, max 100. No OFFSET.

## Freshness

`staleTime: 60_000` (matches projection cadence). Manual refresh only — no polling.

## Non-goals

No AI summaries, no messaging, no timeline mutations, no source-domain writes, no manual event injection, no relationship aggregate table.
