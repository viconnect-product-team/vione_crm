// BC-4.1/4.2/4.4 — Relationship Graph Engine — Consumer SDK (framework-free).
// The ONLY consumer-facing API. No React, no Supabase, no repository imports.

import { GraphError, type GraphErrorCode } from "./errors";
import {
  graphArchiveEdgeFn,
  graphConnectFn,
  graphCreateEdgeFn,
  graphDisconnectFn,
  graphGetNodeFn,
  graphGetTimelineEventFn,
  graphHistoryFn,
  graphMutualConnectionsFn,
  graphNeighborsFn,
  graphPairTimelineFn,
  graphRegisterNodeFn,
  graphRestoreEdgeFn,
  graphSharedAssociationsFn,
  graphSharedCommunitiesFn,
  graphSharedCompaniesFn,
  graphShortestPathFn,
  graphTimelineFn,
  graphUpdateEdgeMetadataFn,
} from "./graph.functions";
import type {
  EdgeKind,
  GraphCursorPage,
  GraphMutualDTO,
  GraphNeighborDTO,
  GraphNodeDTO,
  GraphPathDTO,
  GraphSharedNodeDTO,
  MutualQuery,
  NeighborsQuery,
  NodeKind,
  SharedNodesQuery,
  ShortestPathQuery,
  TenantScopeType,
  VisibilityClass,
} from "./types";
import type {
  GraphTimelineEventDTO,
  PairTimelineQuery,
  TimelinePage,
  TimelineQuery,
} from "./timeline.types";
import { graphRelationshipStrengthFn } from "./strength/strength.functions";
import type { RelationshipStrengthResult } from "./strength/types";
import { graphRecommendConnectionsFn } from "./recommendation/recommendation.functions";
import type { RecommendationPageDTO, RecommendationQuery } from "./recommendation/types";

const KNOWN_CODES: readonly GraphErrorCode[] = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NODE_NOT_FOUND",
  "EDGE_NOT_FOUND",
  "KIND_NOT_REGISTERED",
  "INVALID_NODE_KIND",
  "INVALID_EDGE_KIND",
  "INVALID_DIRECTION",
  "INVALID_CURSOR",
  "LIMIT_EXCEEDED",
  "DEPTH_EXCEEDED",
  "PATH_NOT_FOUND",
  "CROSS_TENANT_FORBIDDEN",
  "REGISTRY_VERSION_MISMATCH",
  "WRITE_FORBIDDEN",
  "PRODUCER_CAPABILITY_REQUIRED",
  "SOURCE_NODE_NOT_FOUND",
  "TARGET_NODE_NOT_FOUND",
  "EDGE_ALREADY_EXISTS",
  "EDGE_ARCHIVED",
  "CARDINALITY_VIOLATION",
  "SELF_EDGE_FORBIDDEN",
  "SCOPE_MISMATCH",
  "VISIBILITY_INVALID",
  "IDEMPOTENCY_CONFLICT",
  "METADATA_INVALID",
  "EVENT_EMISSION_FAILED",
  "STRENGTH_NOT_AVAILABLE",
  "STRENGTH_VERSION_UNSUPPORTED",
  "STRENGTH_RECOMPUTE_REQUIRED",
  "STRENGTH_SIGNAL_INVALID",
  "STRENGTH_PRIVACY_RESTRICTED",
  "RECOMMENDATION_CURSOR_INVALID",
  "RECOMMENDATION_VERSION_UNSUPPORTED",
  "RECOMMENDATION_SOURCE_DISABLED",
  "RECOMMENDATION_PRIVACY_RESTRICTED",
  "INTERNAL_ERROR",
];

function normalize(err: unknown): GraphError {
  if (err instanceof GraphError) return err;
  const code = (err as { code?: string } | null)?.code;
  if (code && (KNOWN_CODES as readonly string[]).includes(code)) {
    return new GraphError(code as GraphErrorCode);
  }
  return new GraphError("INTERNAL_ERROR");
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw normalize(e);
  }
}

export interface RegisterNodeArgs {
  nodeKind: NodeKind;
  externalRefType: string;
  externalRefId: string;
  visibility?: VisibilityClass;
  tenantScopeType?: TenantScopeType;
  tenantScopeId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateEdgeArgs {
  edgeKind: EdgeKind;
  sourceNodeId: string;
  targetNodeId: string;
  visibility?: VisibilityClass;
  tenantScopeType?: TenantScopeType;
  tenantScopeId?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
}

export interface ConnectArgs {
  sourceNodeId: string;
  targetNodeId: string;
  idempotencyKey?: string | null;
}

export const RelationshipGraphSDK = {
  // Reads
  async getNode(nodeId: string): Promise<GraphNodeDTO> {
    return safeCall(() => graphGetNodeFn({ data: { nodeId } }));
  },
  async neighbors(q: NeighborsQuery): Promise<GraphCursorPage<GraphNeighborDTO>> {
    return safeCall(() => graphNeighborsFn({ data: q }));
  },
  async mutualConnections(q: MutualQuery): Promise<GraphCursorPage<GraphMutualDTO>> {
    return safeCall(() => graphMutualConnectionsFn({ data: q }));
  },
  async sharedCompanies(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return safeCall(() => graphSharedCompaniesFn({ data: q }));
  },
  async sharedAssociations(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return safeCall(() => graphSharedAssociationsFn({ data: q }));
  },
  async sharedCommunities(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return safeCall(() => graphSharedCommunitiesFn({ data: q }));
  },
  async shortestPath(q: ShortestPathQuery): Promise<GraphPathDTO> {
    return safeCall(() => graphShortestPathFn({ data: q }));
  },

  // Writes
  async registerNode(args: RegisterNodeArgs): Promise<GraphNodeDTO> {
    return safeCall(() => graphRegisterNodeFn({ data: args }));
  },
  async createEdge(args: CreateEdgeArgs): Promise<{ edgeId: string; replayed: boolean }> {
    return safeCall(() => graphCreateEdgeFn({ data: args }));
  },
  async connect(args: ConnectArgs): Promise<{ edgeId: string }> {
    return safeCall(() => graphConnectFn({ data: args }));
  },
  async disconnect(edgeId: string): Promise<void> {
    await safeCall(() => graphDisconnectFn({ data: { edgeId } }));
  },
  async archiveEdge(edgeId: string): Promise<void> {
    await safeCall(() => graphArchiveEdgeFn({ data: { edgeId } }));
  },
  async restoreEdge(edgeId: string): Promise<void> {
    await safeCall(() => graphRestoreEdgeFn({ data: { edgeId } }));
  },
  async updateEdgeMetadata(edgeId: string, metadata: Record<string, unknown>): Promise<void> {
    await safeCall(() => graphUpdateEdgeMetadataFn({ data: { edgeId, metadata } }));
  },

  // Timeline
  async timeline(q: TimelineQuery): Promise<TimelinePage> {
    return safeCall(() => graphTimelineFn({ data: q }));
  },
  async pairTimeline(q: PairTimelineQuery): Promise<TimelinePage> {
    return safeCall(() => graphPairTimelineFn({ data: q }));
  },
  async history(q: TimelineQuery): Promise<TimelinePage> {
    return safeCall(() => graphHistoryFn({ data: q }));
  },
  // BC-7.5B — Direct by-id read for adapter surfaces (no page scan).
  async getTimelineEventById(eventId: string): Promise<GraphTimelineEventDTO | null> {
    return safeCall(() => graphGetTimelineEventFn({ data: { eventId } }));
  },

  // Strength (BC-4.3)
  async relationshipStrength(input: {
    sourceNodeId: string;
    targetNodeId: string;
    scoringVersion?: string;
  }): Promise<RelationshipStrengthResult> {
    return safeCall(() => graphRelationshipStrengthFn({ data: input }));
  },

  // Recommendations (BC-4.4)
  async recommendConnections(q: RecommendationQuery): Promise<RecommendationPageDTO> {
    return safeCall(() => graphRecommendConnectionsFn({ data: q }));
  },
} as const;

export type RelationshipGraphSDKType = typeof RelationshipGraphSDK;
