# RELATIONSHIP_TIMELINE_SDK

## Module

`src/lib/graph/relationship-timeline/` (public barrel: `index.ts`).

## Public surface (frozen for BC-7.5)

```ts
RelationshipTimelineSDK.version          // 1

RelationshipTimelineSDK.listTimeline({
  nodeId, categories?, eventTypes?, sourceDomains?, cursor?, limit?
}): Promise<RelationshipTimelinePage>

RelationshipTimelineSDK.listRelationshipTimeline({
  nodeA, nodeB, eventTypes?, cursor?, limit?
}): Promise<RelationshipTimelinePage>

RelationshipTimelineSDK.getTimelineEvent({
  nodeId, eventId
}): Promise<RelationshipTimelineEventDTO | null>
```

Also exported: `canonicalPairKey`, `categoryFor`, `sourceFor`,
`toRelationshipTimelineDTO`, and all DTO types.

## Contract

- **Framework-free.** No React, no Supabase, no direct repository
  imports.
- **Adapter-only.** Delegates every read to `RelationshipGraphSDK`;
  no independent cursor, ordering or visibility logic.
- **No authority-bearing inputs.** Callers cannot pass viewer ids,
  auth tokens, or "as-user" flags.
- **Bounded limits.** `limit` is clamped to `[1, 100]` with a default
  of `30`. Matches BC-4.2 defaults.
- **Ordering.** Preserves BC-4.2 `occurred_at DESC, id DESC`.
- **Cursor.** Opaque, reused from BC-4.2. `null` = first page.
- **Errors.** Rethrows `GraphError` unchanged (imported from
  `@/lib/graph`).

## What consumers must not do

- Import from `../graph.sdk` directly for timeline reads.
- Import the write service or repository.
- Bypass the SDK to hit Supabase directly.

Surface freeze is asserted in `timeline.bc75.test.ts`.
