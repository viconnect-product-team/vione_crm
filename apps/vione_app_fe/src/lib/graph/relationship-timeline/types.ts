// BC-7.5 — Relationship Timeline product DTOs.
//
// This module is a PRODUCT projection over graph_timeline_events. It does not
// define a new persistence layer, a new registry, or a new visibility model.
// See docs/business-connect/timeline/RELATIONSHIP_TIMELINE_ARCHITECTURE.md.

import type { EdgeKind, GraphCursorPage, VisibilityClass } from "../types";
import type { GraphTimelineEventDTO } from "../timeline.types";

export const RELATIONSHIP_TIMELINE_VERSION = 1 as const;

/** Broad UI-facing grouping over the frozen edge-kind registry. */
export type RelationshipTimelineCategory =
  | "connection"
  | "introduction"
  | "meeting"
  | "card"
  | "membership"
  | "work"
  | "meeting_touch"
  | "other";

/** Which product domain originally produced the source event. */
export type RelationshipTimelineSource =
  | "connection"
  | "introduction"
  | "meeting"
  | "business_card"
  | "membership"
  | "employment"
  | "graph";

export interface RelationshipTimelineEventDTO {
  id: string;
  /** Deterministic pair projection — see canonicalPairKey. Non-authoritative. */
  relationshipId: string | null;
  eventType: EdgeKind;
  eventCategory: RelationshipTimelineCategory;
  occurredAt: string;
  actorPersonNodeId: string | null;
  targetPersonNodeId: string | null;
  sourceDomain: RelationshipTimelineSource;
  sourceId: string | null;
  summaryKey: string;
  /** PII-safe allowlist projection performed by the underlying graph service. */
  metadata: Record<string, string | number | boolean | null>;
  visibilityClass: VisibilityClass;
  version: typeof RELATIONSHIP_TIMELINE_VERSION;
}

export interface ListRelationshipTimelineInput {
  nodeId: string;
  categories?: RelationshipTimelineCategory[];
  eventTypes?: EdgeKind[];
  sourceDomains?: RelationshipTimelineSource[];
  cursor?: string | null;
  limit?: number;
}

export interface ListRelationshipPairTimelineInput {
  nodeA: string;
  nodeB: string;
  eventTypes?: EdgeKind[];
  cursor?: string | null;
  limit?: number;
}

export type RelationshipTimelinePage = GraphCursorPage<RelationshipTimelineEventDTO>;

export type { GraphTimelineEventDTO };
