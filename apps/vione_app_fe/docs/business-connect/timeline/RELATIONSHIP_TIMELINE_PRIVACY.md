# RELATIONSHIP_TIMELINE_PRIVACY

**Slice:** BC-7.5C

## Authority

All visibility remains owned by BC-4.2 RLS on `graph_timeline_events`
(FORCE ROW LEVEL SECURITY, resolved against both `subject_node_id` and
`related_node_id`; archived rows hidden; metadata projected through the
edge registration's allowlist). BC-7.5C UI adds **no** new authorization
path — it only reshapes rows the SDK was already authorized to return.

## What the UI receives

Only `RelationshipTimelineEventDTO` fields (see `src/lib/graph/relationship-timeline/types.ts`):

- `id, occurredAt, eventType, eventCategory, sourceDomain`
- `subjectPersonNodeId, targetPersonNodeId, actorPersonNodeId` (already RLS-visible)
- `summaryKey` (i18n key — never free text)
- `metadata` (registry allowlist projection)
- `visibilityClass, version`

## What the UI never shows

- Internal user / auth IDs
- Raw source payloads (introduction body text, meeting descriptions, notes, emails, phones)
- Meeting join URLs
- Outbox event rows
- Graph topology beyond the two endpoints already visible
- Hidden participants

## Actor display

The presentation registry declares an `actorPolicy` per kind:

- `actor-if-visible` — actor may be surfaced when RLS returned an `actorPersonNodeId`.
- `always-neutral` — force neutral wording ("A member").
- `system` — no actor shown (system-generated lifecycle event).

The current item component defaults to neutral wording for all kinds; actor rendering is a future extension gated on identity SDK lookups and never a raw ID.

## Direct by-id lookup

`RelationshipTimelineSDK.getTimelineEvent(nodeId, eventId)` delegates to
`graph_timeline_event_get` (SECURITY INVOKER). It additionally asserts
that the returned row belongs to `nodeId` on either endpoint, so callers
cannot use the by-id path to enumerate events across relationships.

## Empty and partial states

Empty state copy uses "recorded" wording — "No events on your timeline yet" plus the disclaimer "Only shows recorded relationship activity." — so the UI never implies the underlying relationship does not exist or that history is complete. Historical events preceding BC-7.5B projection start may be absent.
