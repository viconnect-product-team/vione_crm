// BC-4.2 — Timeline DTOs and query contracts.

import type { EdgeKind, GraphCursorPage, GraphMetadata, NodeKind, VisibilityClass } from "./types";

export interface GraphTimelineEventDTO {
  id: string;
  eventKind: EdgeKind;
  subjectNodeId: string;
  relatedNodeId: string | null;
  edgeId: string | null;
  actorNodeId: string | null;
  visibility: VisibilityClass;
  summaryKey: string;
  metadata: GraphMetadata;
  occurredAt: string;
  dedupeKey: string | null;
  collapseKey: string | null;
}

export interface TimelineQuery {
  nodeId: string;
  eventKinds?: EdgeKind[];
  nodeKinds?: NodeKind[];
  cursor?: string | null;
  limit?: number;
}

export interface PairTimelineQuery {
  nodeA: string;
  nodeB: string;
  eventKinds?: EdgeKind[];
  cursor?: string | null;
  limit?: number;
}

export type TimelinePage = GraphCursorPage<GraphTimelineEventDTO>;
