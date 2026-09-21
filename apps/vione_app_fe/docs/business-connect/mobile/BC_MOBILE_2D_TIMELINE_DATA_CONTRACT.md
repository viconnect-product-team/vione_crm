# BC_MOBILE_2D_TIMELINE_DATA_CONTRACT

Status: FROZEN for BC-Mobile-2D.
Scope: the read-only Relationship Timeline read model behind the Person
Detail "Journey" section (`/connect-app/network/$personId`).

## 1. Source audit

| Candidate source | Classification | Used? | Reason |
| --- | --- | --- | --- |
| `graph_timeline_events` (via BC-4.2 keyset read `RelationshipGraphWriteService.pairTimeline`) | TIMELINE_CANONICAL | YES (u:) | The only governed timeline store. SQL RLS requires both `subject_node_id` and `related_node_id` readable. Pair-scoped, ordered `occurred_at DESC, id DESC`, opaque cursor. |
| `graph_nodes` (`RelationshipGraphRepository.findNodeByExternalRef`) | TIMELINE_CANONICAL (resolution) | YES (u:) | READ-ONLY `SELECT`. `registerNode` is a write-on-read and is forbidden here. |
| Connection pair state (`GlobalConnectionService.getState`) | TIMELINE_CANONICAL (authorization) | YES (u:) | Same authorization source as 2C Person Detail. |
| `saved_business_cards` (owner-scoped SELECT) | TIMELINE_CANONICAL (domain record) | YES (c:) | The saved edge existing for THIS viewer IS the authorization (2C). `saved_at` is the one truthful milestone. |
| Meeting events / handles | TIMELINE_UNSUPPORTED | NO | Meeting projection is skipped upstream (NOT_READABLE); participant handles are opaque and not mobile-safe. |
| SAVED_CARD / MET graph event kinds | TIMELINE_OPTIONAL | NO | Canonical-looking but unwired: no producer emits them today. Requesting them would return nothing; fabricating them is forbidden. |
| `business_relationship_memories` | TIMELINE_UNSUPPORTED | NO | Intelligence-layer memory; not a relationship-moment timeline. |
| Synthesized/inferred events ("you met 3 times", streaks) | FORBIDDEN | NO | No fabrication. Only canonical moments. |

## 2. Resolution

- `u:<userId>` → pair state MUST be `accepted` (not blocked, not self) →
  read-only node resolution for viewer + counterpart → pair-scoped timeline
  read with `eventKinds = JOURNEY_EVENT_KINDS`.
- `c:<targetCardId>` → owner-scoped saved edge IS the authorization → exactly
  one `card_saved` milestone from `saved_at` (id `card_saved:<targetCardId>`).
- Each namespace reads exactly ONE source. No cross-source dedupe stitching.
- Fail-closed: any authorization/existence failure → `status: "unavailable"`;
  the section renders nothing and never reveals which check failed.

## 3. Event model

`JOURNEY_EVENT_KINDS` (frozen): `CONNECTED_TO`, `INTRO_DELIVERY_*` (6),
`INTRO_OUTCOME_*` (6). Mapping: `CONNECTED_TO → "connected"`,
`INTRO_* → "introduction"`, saved edge → `"card_saved"`. Unknown kinds are
dropped defensively. No MEETING_* is ever requested.

## 4. DTO (whitelist)

```ts
type BcMobileJourneyItem = {
  id: string;            // graph event id, or card_saved:<targetCardId>
  kind: "connected" | "introduction" | "card_saved";
  occurredAt: string;    // ISO
  provenance: { domain: "graph" | "saved_card" };
};
type BcMobileJourneyPage = { items: BcMobileJourneyItem[]; nextCursor: string | null };
type BcMobilePersonJourneyResult =
  | { status: "ok"; page: BcMobileJourneyPage }
  | { status: "unavailable" };
```

FORBIDDEN on the DTO: graph node ids, raw `metadata`, `dedupe_key`, tenant
fields, counters, viewer flags. Asserted by test.

## 5. Pagination & cost

- Default page size 5, clamp `[1, 20]`. Cursor is an opaque passthrough of
  the BC-4.2 keyset cursor; `null` = first page.
- Backend calls, first page (u:): 1 pair-state read + 2 node lookups +
  1 timeline query = 4 bounded reads, 1 RPC round trip. (c:): 1 read.
- React Query key: `["bc-mobile", "person-journey", viewerId, personId]` —
  account switch invalidates by construction. `staleTime` 60s, `retry` 1.
  No realtime subscription in 2D.

## 6. Read-only guarantee

The read model never registers nodes, creates edges, or emits events.
A missing graph node means "no canonical milestones yet" (e.g. legacy
connection predating the BC-5.0 graph sync) → truthful empty page.
Static guards assert no write symbol is reachable from the read-model
modules, and the RPC boundary stays a thin adapter.

## 7. Frozen OUT (2D)

Mutations, realtime, meeting milestones, cross-source dedupe, contextual
narratives with names/counterpart references, navigation from milestones
(no mobile-safe destinations yet), analytics counters.
