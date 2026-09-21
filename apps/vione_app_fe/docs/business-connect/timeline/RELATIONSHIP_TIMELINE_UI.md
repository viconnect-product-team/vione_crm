# RELATIONSHIP_TIMELINE_UI

## Route

`/business-connect/relationship-timeline`
(file: `src/routes/business-connect.relationship-timeline.tsx`).

Wrapped by the standard `AppShell`. No new generic activity-feed
route is introduced.

## Components (co-located in the route file for BC-7.5)

- **RelationshipTimelinePage** — container; owns filter state and
  viewer node resolution.
- **Category filter row** — `role=group` with `aria-pressed` chips.
- **Live region** — `role=status` + `aria-live=polite` + `aria-busy`
  reflects loading and result count.
- **Group headings** — Today / Yesterday / Last 7 days / Last month /
  Older. Labels are derived at render time and never persisted.
- **List** — `<ul role="list">` per group.
- **TimelineCard** — icon slot, localized title from
  `summaryKey`, `occurredAt`, category badge.
- **Empty / loading / error states** — dedicated cards; error uses
  `role="alert"`.

## Data flow

```
useViewerPersonNodeId()          — resolves the viewer's person node
useRelationshipTimeline(...)     — cursor-paginated React Query hook
RelationshipTimelineSDK          — framework-free adapter
```

The route imports the SDK and hooks only. It does not import
`GraphTimelineService`, `graphTimelineFn` or any Supabase client.

## Interactions

- Filter chips toggle category; `all` clears.
- "Load more" button uses `fetchNextPage()` when
  `hasNextPage === true`.
- "Refresh" re-runs the current filter.

## What the surface never shows

- Edit / delete controls.
- Source-domain mutations.
- Raw metadata payloads outside the BC-4.2 allowlist.
- Meeting join URLs, notes, emails, phones.
