# RELATIONSHIP_TIMELINE_VISIBILITY

BC-7.5 does not implement its own visibility. All access decisions
remain owned by BC-4.2 RLS on `graph_timeline_events`.

## Guarantees inherited from BC-4.2

- FORCE ROW LEVEL SECURITY on `graph_timeline_events`.
- Visibility resolved against `subject_node_id` **and**
  `related_node_id`. A row is only readable when the viewer's
  identity satisfies the visibility class of both endpoints.
- `metadata` is projected through the edge registration's
  `metadataAllowlist` before serialization.
- Archived events (`archived_at IS NOT NULL`) are hidden.

## Guarantees added by BC-7.5

- The adapter never widens visibility. It only reshapes and filters
  the already-authorized page rows.
- `relationshipId` is derived from node ids that were already
  returned by an RLS-passing query. It does not leak topology on its
  own because possessing it does not authorize any lookup.
- Category and source-domain filters are applied client-side after
  the RLS-scoped fetch. They can never surface a row the viewer was
  not entitled to.
- `getTimelineEvent()` scans a bounded page returned by the same
  RLS-scoped RPC; there is no by-id bypass.

## Boundary tests

Covered by `src/__tests__/timeline.bc75.test.ts`:

- Unrelated viewer receives an empty page.
- Blocked / hidden source is not leaked through the adapter.
- Pair timeline returns only events authorized on both endpoints.
- Metadata redaction survives projection.
