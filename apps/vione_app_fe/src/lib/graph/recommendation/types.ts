// BC-4.4 — Recommendation Engine v1 — Public DTOs.
// Framework-free. Consumers never see raw graph rows or hidden topology.

import type { GraphNodeDTO, NodeKind } from "../types";

export const RELATIONSHIP_RECOMMENDATION_VERSION = "1.0.0" as const;
export const RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION = 1 as const;

/** Stable reason codes; consumers pattern-match on these. */
export type RecommendationReasonCode =
  | "MUTUAL_CONNECTIONS"
  | "SHARED_COMPANY"
  | "SHARED_ASSOCIATION"
  | "SHARED_COMMUNITY"
  | "SHARED_EVENT"
  | "SHARED_MEETING"
  | "INTRODUCTION_PATH"
  | "TRUSTED_MUTUAL";

/** Deterministic candidate-source identifiers. */
export type RecommendationSourceKind =
  | "MUTUAL_CONNECTION"
  | "SHARED_COMPANY"
  | "SHARED_ASSOCIATION"
  | "SHARED_COMMUNITY"
  | "SHARED_EVENT"
  | "SHARED_MEETING"
  | "INTRODUCTION_PATH"
  | "STRONG_MUTUAL";

/** Stable category buckets for diversity + caps. */
export type RecommendationCategory =
  | "mutual"
  | "context_company"
  | "context_association"
  | "context_community"
  | "context_event"
  | "context_meeting"
  | "introduction"
  | "strength";

export interface RecommendationReasonDTO {
  code: RecommendationReasonCode;
  summaryKey: string;
  count?: number;
  /** Up to a small number of VISIBLE example nodes; never hidden ones. */
  examples?: GraphNodeDTO[];
  /** Rounded contribution (0..1) for UI display; may be omitted. */
  contribution?: number;
  priority: number;
}

export interface RecommendationDTO {
  candidateNode: GraphNodeDTO;
  score: number;
  rank: number;
  reasons: RecommendationReasonDTO[];
  recommendationVersion: typeof RELATIONSHIP_RECOMMENDATION_VERSION;
  freshness: "fresh" | "stale" | "cold";
}

export interface RecommendationPageDTO {
  items: RecommendationDTO[];
  nextCursor: string | null;
  recommendationVersion: typeof RELATIONSHIP_RECOMMENDATION_VERSION;
  registryVersion: typeof RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION;
  generatedAt: string;
  candidateCountEvaluated: number;
  truncated: boolean;
}

export interface RecommendationQuery {
  sourceNodeId: string;
  targetNodeKinds?: NodeKind[];
  limit?: number;
  cursor?: string | null;
  includeReasonDetails?: boolean;
}
