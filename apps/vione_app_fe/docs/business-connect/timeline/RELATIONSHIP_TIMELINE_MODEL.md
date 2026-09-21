# RELATIONSHIP_TIMELINE_MODEL

## Canonical store

All rows live in `public.graph_timeline_events` (BC-4.2). BC-7.5 does
not add rows outside this table.

## Relationship identity

`relationshipId = canonicalPairKey(subjectNodeId, relatedNodeId)`.

Properties:

- Unordered — `f(a,b) === f(b,a)`.
- Deterministic — pure of `(a,b)`.
- Stable — depends only on node ids, not on edges or metadata.
- Non-authoritative — not used for RLS, not persisted as a foreign
  key, not an authorization token.
- Nullable — resolves to `null` for events without a counterpart
  (e.g. self-scoped events, or when `related_node_id IS NULL`).

Format: `rel:<loNodeId>:<hiNodeId>`, string ordering.

## DTO

`RelationshipTimelineEventDTO` fields (all from the projection, no
new DB columns):

- `id` — mirrors `graph_timeline_events.id`.
- `relationshipId` — derived, nullable.
- `eventType` — mirrors `event_kind` (frozen registry).
- `eventCategory` — UI grouping derived from `eventType`.
- `occurredAt` — `occurred_at`.
- `actorPersonNodeId` — mirrors `actor_node_id`.
- `targetPersonNodeId` — mirrors `related_node_id`.
- `sourceDomain` — derived label describing which product produced
  the underlying edge/event.
- `sourceId` — mirrors `edge_id` when safe; product-domain ids are
  never leaked.
- `summaryKey` — mirrors `summary_key`; consumers localize.
- `metadata` — mirrors `metadata`; already allowlisted by BC-4.2.
- `visibilityClass` — mirrors `visibility_class`.
- `version` — `RELATIONSHIP_TIMELINE_VERSION` (currently `1`).

## What the DTO does not expose

- Internal user ids or auth ids.
- Raw outbox payloads.
- Notes, descriptions, emails, phones.
- Meeting join URLs.
- Hidden topology (unauthorized subjects/related nodes).
