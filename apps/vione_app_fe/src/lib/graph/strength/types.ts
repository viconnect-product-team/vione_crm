// BC-4.3 — Relationship Strength Engine v1 — DTOs.
// Public, framework-free types. Consumers never see raw signal rows.

export const RELATIONSHIP_STRENGTH_VERSION = "1.0.0" as const;
export const RELATIONSHIP_STRENGTH_REGISTRY_VERSION = 1 as const;

export type StrengthTier = "very_weak" | "weak" | "normal" | "strong" | "champion";

export type StrengthCategory =
  | "identity_context"
  | "direct_connection"
  | "interaction"
  | "meeting"
  | "introduction"
  | "shared_context"
  | "commercial"
  | "continuity";

export type StrengthSignalKind =
  | "CONNECTED_TO"
  | "SAVED_CARD"
  | "MET"
  | "INTRODUCED"
  | "REFERRED"
  | "MESSAGED"
  | "ATTENDED"
  | "CHECKED_IN"
  | "WORKS_FOR"
  | "MEMBER_OF"
  | "PURCHASED"
  | "SOLD";

export type StrengthFreshness = "fresh" | "stale" | "cold";

export interface StrengthContributionRecord {
  signalKind: StrengthSignalKind;
  category: StrengthCategory;
  rawCount: number;
  effectiveCount: number;
  baseWeight: number;
  frequencyFactor: number;
  recencyFactor: number;
  cappedContribution: number;
  explanationKey: string;
}

export interface RelationshipStrengthResult {
  sourceNodeId: string;
  targetNodeId: string;
  score: number;
  tier: StrengthTier;
  scoringVersion: typeof RELATIONSHIP_STRENGTH_VERSION;
  contributionVersion: number;
  registryVersion: number;
  calculatedAt: string;
  freshness: StrengthFreshness;
  contributions: StrengthContributionRecord[];
  explanationKeys: string[];
}

/** Raw signal observation used by the pure scoring engine. */
export interface StrengthSignalObservation {
  signalKind: StrengthSignalKind;
  /** How many times this signal was observed on the visible surface. */
  count: number;
  /**
   * Most-recent occurrence time (ISO). For undirected/aggregate signals
   * choose the max of both directions. Omit for signals without a time.
   */
  lastAt?: string;
}
