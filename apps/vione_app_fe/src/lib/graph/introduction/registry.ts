// BC-6.0 — Smart Introduction v1 frozen scoring contract.
// Deterministic. Bounded [0,1]. Versioned. No randomness. No AI.

import type { IntroductionConfidence, IntroductionReasonCode } from "./types";

/** Per-factor weight bounds. Sum need not equal 1; final score is clamped. */
export const INTRODUCTION_WEIGHTS = Object.freeze({
  /** Weakest-link bounded pair trust (min of hop strengths). */
  relationshipTrust: 0.55,
  /** Path length penalty subtracted per additional hop over 2. */
  pathLengthPenaltyPerExtraHop: 0.12,
  /** Bonus applied once when any shared context exists. */
  sharedContext: 0.12,
  /** Bonus for at least one recent interaction on any hop. */
  recency: 0.08,
  /** Bonus applied when a prior successful introduction is on record. */
  introductionHistory: 0.1,
  /** Bonus scaled by evidence diversity ((distinctReasons-1)/N). */
  diversityAdjustment: 0.05,
  /** Absolute per-hop stale penalty when hop is stale/cold. */
  staleHopPenalty: 0.08,
});

/** Deterministic confidence thresholds (score-based, then depth-adjusted). */
export const INTRODUCTION_CONFIDENCE_THRESHOLDS = Object.freeze({
  medium: 0.45,
  high: 0.7,
});

/** Diversity caps applied deterministically before returning. */
export const INTRODUCTION_DIVERSITY = Object.freeze({
  maxPathsPerPrimaryIntermediary: 2,
  maxPathsPerDominantContext: 2,
});

/** Path generation budgets. */
export const INTRODUCTION_BUDGETS = Object.freeze({
  defaultLimit: 10,
  maxLimit: 25,
  maxCandidatePaths: 200,
  maxFirstDegreeFanOut: 200,
  maxIntermediaryFanOut: 50,
});

export const INTRODUCTION_REASON_PRIORITY: Record<IntroductionReasonCode, number> = Object.freeze({
  STRONG_DIRECT_INTERMEDIARY: 100,
  STRONG_TARGET_RELATIONSHIP: 95,
  MUTUAL_TRUST_PATH: 90,
  PRIOR_INTRODUCTION_HISTORY: 85,
  SAME_ASSOCIATION: 70,
  SAME_COMPANY_CONTEXT: 68,
  SHARED_COMMUNITY: 60,
  SHARED_EVENT: 55,
  RECENT_INTERACTION: 50,
  SHORTEST_TRUSTED_PATH: 20,
});

export function confidenceFromScore(score: number, depth: 2 | 3): IntroductionConfidence {
  // 3-hop paths must not appear "high" unless truly excellent.
  const adjusted = depth === 3 ? score - 0.05 : score;
  if (adjusted >= INTRODUCTION_CONFIDENCE_THRESHOLDS.high) return "high";
  if (adjusted >= INTRODUCTION_CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "low";
}
