# RELATIONSHIP_TIMELINE_ARCHITECTURE

**Status:** Ratified (BC-7.5)
**Canonical store:** `public.graph_timeline_events` (BC-4.2)

## Position in the stack

Relationship Timeline is a **product-facing projection** over the
frozen BC-4.2 graph timeline. It introduces:

- A deterministic, unordered pair identity (`relationshipId`) for
  grouping.
- A category taxonomy for UI filtering.
- A thin adapter SDK and React Query hooks.
- A dedicated route under Business Connect.

It does **not** introduce:

- A new persistence table.
- A second timeline registry or manifest.
- A second RLS model.
- A second cursor / ordering scheme.
- A parallel timeline service or repository.

## Layering

```
UI (routes/business-connect.relationship-timeline.tsx, components)
        │
        ▼
Hooks (src/hooks/use-relationship-timeline.ts)
        │
        ▼
RelationshipTimelineSDK (framework-free adapter)
        │
        ▼
RelationshipGraphSDK.timeline / .pairTimeline / .history   ◄── BC-4.2
        │
        ▼
GraphTimelineService (server) ──► graph_timeline_events (RLS-enforced)
```

Every arrow is a call, not a copy. The adapter never opens a new
persistence path.

## Non-goals for BC-7.5

- Meeting Request Lifecycle.
- Messaging.
- AI enrichment.
- New per-relationship aggregate table.
- Timeline mutations (edit, delete, backfill).
