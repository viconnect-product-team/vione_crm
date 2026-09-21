# RELATIONSHIP_TIMELINE_PROJECTION.md — BC-7.5B

**Status:** Ratified (BC-7.5B)
**Canonical store:** `public.graph_timeline_events` (BC-4.2) — unchanged

## Purpose

BC-7.5 established the Relationship Timeline as a read-only projection
over the BC-4.2 graph timeline. BC-7.5B closes the last runtime gap: the
Introduction Delivery, Introduction Outcome and Business Meeting
domains do NOT emit graph edges directly, so their lifecycle transitions
never showed up in the timeline. BC-7.5B adds a source-side outbox +
projection consumer so those transitions land in the same canonical
store, under the same RLS, without introducing a second timeline table
or a second visibility model.

## Flow

```
introduction_deliveries UPDATE OF status
introduction_outcomes   UPDATE OF status
business_meetings       UPDATE OF status
   │
   ▼ trigger (SECURITY DEFINER)
graph_emit_outbox_event(kind, aggregate, id, payload, idempotency_key)
   │
   ▼ graph_outbox_events (FORCE RLS, service_role only)
   │
   ▼ /api/public/hooks/timeline-projection  (pg_cron, anon apikey)
RelationshipTimelineProjectionConsumer.consumeBatch()
   │
   ▼ graph_record_timeline_event(...)  dedupe_key = outbox:<event_id>
graph_timeline_events  (unchanged RLS)
   │
   ▼ RelationshipGraphSDK.timeline / .pairTimeline
   ▼ RelationshipTimelineSDK  (BC-7.5 adapter, no changes to shape)
```

## Idempotency

Two layers:

1. **Outbox emission** — trigger functions build a deterministic
   `idempotency_key` of the form `<aggregate>:<row_id>:<event_kind>`.
   Replays of the same transition hit the UNIQUE constraint on
   `graph_outbox_events.idempotency_key` and are swallowed by
   `graph_emit_outbox_event`.

2. **Projection** — each projected timeline row carries
   `dedupe_key = 'outbox:<event_id>'`. `graph_record_timeline_event`
   swallows duplicates on that key, so repeated consumer runs against
   the same outbox row remain safe.

## Visibility

The consumer inserts rows scoped to the derived subject/related person
nodes with the domain's expected visibility class:

| Domain                | Subject                  | Related            | Visibility |
| --------------------- | ------------------------ | ------------------ | ---------- |
| introduction_delivery | intermediaryPersonNodeId | targetPersonNodeId | private    |
| introduction_outcome  | requesterPersonNodeId    | targetPersonNodeId | private    |

Meetings intentionally do NOT project a synthetic person↔person row in
BC-7.5B: participants are stored in `business_meeting_participants`,
and per-participant fan-out is deferred (see "Non-goals" below).
`graph_timeline_events` RLS is the only authorization gate; the
projection consumer never widens it.

## By-id read contract

`RelationshipTimelineSDK.getTimelineEvent({ nodeId, eventId })` now
resolves through `graph_timeline_event_get(_event_id)` (SECURITY
INVOKER) instead of scanning the first page. RLS still applies. The
adapter additionally rejects rows whose subject/related nodes do not
match the caller-provided `nodeId`, so surfaces that pass a viewer
perspective get an early null instead of a leak-shaped mismatch.

## Non-goals for BC-7.5B

- Per-participant fan-out for meetings (would multiply timeline rows).
- New Relationship aggregate table.
- Second timeline registry / cursor / visibility model.
- Messaging / AI enrichment / CRM automation.
- Source-domain mutations (the projection is read-only for domains).
