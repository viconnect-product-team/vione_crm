// BC-7.5 — Relationship Timeline public barrel.
// Consumers must import from here (never from ../graph.sdk directly).

export { RelationshipTimelineSDK } from "./relationship-timeline.sdk";
export type { RelationshipTimelineSDKType } from "./relationship-timeline.sdk";
export { canonicalPairKey } from "./pair-key";
export { categoryFor, sourceFor, toRelationshipTimelineDTO } from "./mapping";
export {
  RELATIONSHIP_TIMELINE_VERSION,
  type RelationshipTimelineCategory,
  type RelationshipTimelineSource,
  type RelationshipTimelineEventDTO,
  type RelationshipTimelinePage,
  type ListRelationshipTimelineInput,
  type ListRelationshipPairTimelineInput,
} from "./types";
export {
  RELATIONSHIP_TIMELINE_PRESENTATION_REGISTRY,
  UNKNOWN_PRESENTATION,
  presentationFor,
  importanceFor,
  type TimelinePresentation,
  type TimelineImportance,
  type TimelineActorPolicy,
  type TimelineSourceCTA,
} from "./presentation";
