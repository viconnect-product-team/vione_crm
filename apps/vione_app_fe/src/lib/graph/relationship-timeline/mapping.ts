// BC-7.5 / BC-7.5B — Registry-driven mapping from raw graph timeline events
// to the product-facing RelationshipTimelineEventDTO.
//
// The mapping is a pure function — no I/O, no auth. It preserves the
// underlying visibility class, uses the registry's summary key untouched,
// and derives the category + source domain from the frozen edge-kind alone.
//
// BC-7.5B extends the mapping table with the Introduction Delivery,
// Introduction Outcome, and Business Meeting lifecycle event kinds that are
// now projected into `graph_timeline_events` by the source-side outbox
// triggers + `RelationshipTimelineProjectionConsumer`.

import type { GraphTimelineEventDTO } from "../timeline.types";
import type { EdgeKind } from "../types";
import { canonicalPairKey } from "./pair-key";
import {
  RELATIONSHIP_TIMELINE_VERSION,
  type RelationshipTimelineCategory,
  type RelationshipTimelineEventDTO,
  type RelationshipTimelineSource,
} from "./types";

const CATEGORY_BY_KIND: Record<string, RelationshipTimelineCategory> = {
  // Graph edges (BC-4.x)
  CONNECTED_TO: "connection",
  MET: "meeting_touch",
  SAVED_CARD: "card",
  SAVED_BY: "card",
  WORKS_FOR: "work",
  EMPLOYS: "work",
  MEMBER_OF: "membership",
  HAS_MEMBER: "membership",
  MANAGES: "work",
  MANAGED_BY: "work",
  ATTENDED: "meeting_touch",
  HAD_ATTENDEE: "meeting_touch",
  FOLLOWED: "connection",
  FOLLOWED_BY: "connection",

  // Introduction Delivery lifecycle (BC-6.3 → BC-7.5B projection)
  INTRO_DELIVERY_CREATED: "introduction",
  INTRO_DELIVERY_DELIVERED: "introduction",
  INTRO_DELIVERY_ACKNOWLEDGED: "introduction",
  INTRO_DELIVERY_DECLINED: "introduction",
  INTRO_DELIVERY_EXPIRED: "introduction",

  // Introduction Outcome lifecycle (BC-6.4 → BC-7.5B projection)
  INTRO_OUTCOME_CREATED: "introduction",
  INTRO_OUTCOME_CONNECTED: "introduction",
  INTRO_OUTCOME_PROGRESSING: "introduction",
  INTRO_OUTCOME_CLOSED_SUCCESS: "introduction",
  INTRO_OUTCOME_CLOSED_NO_FIT: "introduction",
  INTRO_OUTCOME_CLOSED_LOST: "introduction",

  // Business Meeting lifecycle (BC-4.1/7.0 → BC-7.5B projection)
  MEETING_CREATED: "meeting",
  MEETING_PROPOSED: "meeting",
  MEETING_CONFIRMED: "meeting",
  MEETING_COMPLETED: "meeting",
  MEETING_CANCELLED: "meeting",
  MEETING_RESCHEDULED: "meeting",
  MEETING_DECLINED: "meeting",

  // Legacy / adjacent aliases from BC-7.5 initial cut
  INTRO_DELIVERED: "introduction",
  INTRO_OUTCOME: "introduction",
};

const SOURCE_BY_KIND: Record<string, RelationshipTimelineSource> = {
  CONNECTED_TO: "connection",
  MET: "meeting",
  SAVED_CARD: "business_card",
  SAVED_BY: "business_card",
  WORKS_FOR: "employment",
  EMPLOYS: "employment",
  MEMBER_OF: "membership",
  HAS_MEMBER: "membership",
  MANAGES: "employment",
  MANAGED_BY: "employment",
  ATTENDED: "meeting",
  HAD_ATTENDEE: "meeting",
  FOLLOWED: "connection",
  FOLLOWED_BY: "connection",

  INTRO_DELIVERY_CREATED: "introduction",
  INTRO_DELIVERY_DELIVERED: "introduction",
  INTRO_DELIVERY_ACKNOWLEDGED: "introduction",
  INTRO_DELIVERY_DECLINED: "introduction",
  INTRO_DELIVERY_EXPIRED: "introduction",

  INTRO_OUTCOME_CREATED: "introduction",
  INTRO_OUTCOME_CONNECTED: "introduction",
  INTRO_OUTCOME_PROGRESSING: "introduction",
  INTRO_OUTCOME_CLOSED_SUCCESS: "introduction",
  INTRO_OUTCOME_CLOSED_NO_FIT: "introduction",
  INTRO_OUTCOME_CLOSED_LOST: "introduction",

  MEETING_CREATED: "meeting",
  MEETING_PROPOSED: "meeting",
  MEETING_CONFIRMED: "meeting",
  MEETING_COMPLETED: "meeting",
  MEETING_CANCELLED: "meeting",
  MEETING_RESCHEDULED: "meeting",
  MEETING_DECLINED: "meeting",

  INTRO_DELIVERED: "introduction",
  INTRO_OUTCOME: "introduction",
};

export function categoryFor(kind: EdgeKind): RelationshipTimelineCategory {
  return CATEGORY_BY_KIND[kind] ?? "other";
}

export function sourceFor(kind: EdgeKind): RelationshipTimelineSource {
  return SOURCE_BY_KIND[kind] ?? "graph";
}

export function toRelationshipTimelineDTO(
  row: GraphTimelineEventDTO,
): RelationshipTimelineEventDTO {
  return {
    id: row.id,
    relationshipId: canonicalPairKey(row.subjectNodeId, row.relatedNodeId),
    eventType: row.eventKind,
    eventCategory: categoryFor(row.eventKind),
    occurredAt: row.occurredAt,
    actorPersonNodeId: row.actorNodeId,
    targetPersonNodeId: row.relatedNodeId,
    sourceDomain: sourceFor(row.eventKind),
    sourceId: row.edgeId,
    summaryKey: row.summaryKey,
    metadata: row.metadata as Record<string, string | number | boolean | null>,
    visibilityClass: row.visibility,
    version: RELATIONSHIP_TIMELINE_VERSION,
  };
}
