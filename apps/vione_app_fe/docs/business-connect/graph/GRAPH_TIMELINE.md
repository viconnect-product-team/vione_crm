# GRAPH_TIMELINE — Timeline Contract

Design-only.

## Purpose

Give consumers a uniform, viewer-scoped stream of relationship events
without teaching any product about specific edge types.

## Event Shape

```ts
export interface GraphTimelineEvent {
  id: string;
  edgeId: string;
  edgeType: EdgeType;
  actorNodeId: string; // who caused it (often the "from" node)
  subjectNodeId: string; // primary counterpart
  relatedNodeIds?: string[]; // e.g. introducer, event, company
  occurredAt: string;
  visibility: EdgeVisibility;
  summaryKey: string; // i18n key, e.g. "graph.timeline.met"
  payload?: Record<string, unknown>; // registry-validated
}
```

## TimelineContribution (per edge registration)

```ts
export type TimelineContribution =
  | { emit: false }
  | {
      emit: true;
      summaryKey: string; // i18n key
      dedupeWindowSeconds?: number; // collapse rapid duplicates
      collapseWithTypes?: EdgeType[]; // e.g. VIEWED_CARD collapses with SAVED_CARD
    };
```

## Canonical Event Kinds (v1)

- `saved_card`, `viewed_card`
- `met`, `introduced`, `referred`
- `joined`, `left`, `attended`, `checked_in`
- `connected`, `invited`, `accepted_invitation`
- `worked_for_started`, `worked_for_ended`
- `hosted`, `sponsored`, `spoke_at`

These are **derived** from edge writes via the registry; the timeline table
never stores product-specific enums.

## Query Contract

- `timeline(nodeId, filter?) → Page<GraphTimelineEvent>`
- `pairTimeline(a, b, filter?) → Page<GraphTimelineEvent>`
- Ordering: `occurredAt DESC, id DESC`.
- Visibility resolved server-side against viewer identity.
- Deduplication and collapsing happen on read, driven by registry
  `dedupeWindowSeconds` / `collapseWithTypes`.
