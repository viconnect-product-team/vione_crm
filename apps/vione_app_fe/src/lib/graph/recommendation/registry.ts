// BC-4.4 — Recommendation Engine v1 — Frozen candidate-source registry.
// Only sources declared here contribute. Changing weights or caps REQUIRES
// a new RELATIONSHIP_RECOMMENDATION_VERSION.

import type {
  RecommendationCategory,
  RecommendationReasonCode,
  RecommendationSourceKind,
} from "./types";
import type { NodeKind, VisibilityClass } from "../types";

export type FrequencyModel = "single" | "capped_log";

export interface RecommendationSource {
  sourceKind: RecommendationSourceKind;
  enabled: boolean;
  candidateNodeKinds: readonly NodeKind[];
  /** Max candidates emitted by THIS source per query, before ranking. */
  maximumCandidates: number;
  /** Contribution ceiling before category caps. 0..1. */
  baseWeight: number;
  /** How repeated evidence grows (mutual counts, shared context counts). */
  frequencyModel: FrequencyModel;
  frequencyCap: number;
  reasonCode: RecommendationReasonCode;
  /** Lower = more important on collision when merging duplicates. */
  dedupePriority: number;
  /** Highest visibility class the source is allowed to observe. */
  privacyClass: VisibilityClass;
  /** Category used for diversity + category cap. */
  diversityCategory: RecommendationCategory;
  /** Deferred capability tags — informational only in v1. */
  requiredCapabilities: readonly string[];
  version: 1;
}

const REGISTRY: readonly RecommendationSource[] = Object.freeze([
  {
    sourceKind: "MUTUAL_CONNECTION",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 200,
    baseWeight: 0.35,
    frequencyModel: "capped_log",
    frequencyCap: 12,
    reasonCode: "MUTUAL_CONNECTIONS",
    dedupePriority: 1,
    privacyClass: "connected",
    diversityCategory: "mutual",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "STRONG_MUTUAL",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 100,
    baseWeight: 0.2,
    frequencyModel: "capped_log",
    frequencyCap: 6,
    reasonCode: "TRUSTED_MUTUAL",
    dedupePriority: 2,
    privacyClass: "connected",
    diversityCategory: "strength",
    requiredCapabilities: ["strength.v1"],
    version: 1,
  },
  {
    sourceKind: "SHARED_COMPANY",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 120,
    baseWeight: 0.18,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    reasonCode: "SHARED_COMPANY",
    dedupePriority: 3,
    privacyClass: "association",
    diversityCategory: "context_company",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "SHARED_ASSOCIATION",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 120,
    baseWeight: 0.12,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    reasonCode: "SHARED_ASSOCIATION",
    dedupePriority: 4,
    privacyClass: "association",
    diversityCategory: "context_association",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "SHARED_COMMUNITY",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 120,
    baseWeight: 0.1,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    reasonCode: "SHARED_COMMUNITY",
    dedupePriority: 5,
    privacyClass: "community",
    diversityCategory: "context_community",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "SHARED_EVENT",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 120,
    baseWeight: 0.08,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    reasonCode: "SHARED_EVENT",
    dedupePriority: 6,
    privacyClass: "association",
    diversityCategory: "context_event",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "SHARED_MEETING",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 60,
    baseWeight: 0.08,
    frequencyModel: "capped_log",
    frequencyCap: 3,
    reasonCode: "SHARED_MEETING",
    dedupePriority: 7,
    privacyClass: "connected",
    diversityCategory: "context_meeting",
    requiredCapabilities: [],
    version: 1,
  },
  {
    sourceKind: "INTRODUCTION_PATH",
    enabled: true,
    candidateNodeKinds: ["person"],
    maximumCandidates: 40,
    baseWeight: 0.1,
    frequencyModel: "capped_log",
    frequencyCap: 3,
    reasonCode: "INTRODUCTION_PATH",
    dedupePriority: 8,
    privacyClass: "connected",
    diversityCategory: "introduction",
    requiredCapabilities: [],
    version: 1,
  },
] as const satisfies readonly RecommendationSource[]);

/** Per-diversity-category cap — one category cannot monopolize a page. */
export const RECO_CATEGORY_CAPS: Readonly<Record<RecommendationCategory, number>> = Object.freeze({
  mutual: 0.5,
  context_company: 0.35,
  context_association: 0.3,
  context_community: 0.3,
  context_event: 0.25,
  context_meeting: 0.25,
  introduction: 0.25,
  strength: 0.3,
});

/** Maximum consecutive candidates from the same diversity category. */
export const RECO_MAX_CONSECUTIVE_SAME_CATEGORY = 2;
/** Absolute cap on candidate pool evaluated per query, pre-ranking. */
export const RECO_MAX_CANDIDATE_POOL = 500;
/** Maximum visible examples per reason. */
export const RECO_MAX_REASON_EXAMPLES = 3;
/** Default page size. */
export const RECO_DEFAULT_LIMIT = 10;
/** Absolute page-size limit. */
export const RECO_MAX_LIMIT = 50;
/** Small recency boost applied to fresh shared-context signals. */
export const RECO_RECENCY_BONUS_CAP = 0.05;

const BY_KIND = new Map<RecommendationSourceKind, RecommendationSource>(
  REGISTRY.map((s) => [s.sourceKind, s] as const),
);

// Integrity checks (module-load time).
for (const s of REGISTRY) {
  if (s.baseWeight < 0 || s.baseWeight > 1)
    throw new Error(`[reco.registry] baseWeight out of range: ${s.sourceKind}`);
  if (s.frequencyCap < 1) throw new Error(`[reco.registry] frequencyCap < 1: ${s.sourceKind}`);
  if (s.maximumCandidates < 1)
    throw new Error(`[reco.registry] maximumCandidates < 1: ${s.sourceKind}`);
}
{
  const seen = new Set<string>();
  for (const s of REGISTRY) {
    if (seen.has(s.sourceKind))
      throw new Error(`[reco.registry] duplicate source: ${s.sourceKind}`);
    seen.add(s.sourceKind);
  }
}

export function listRecommendationSources(): readonly RecommendationSource[] {
  return REGISTRY;
}
export function getRecommendationSource(
  kind: RecommendationSourceKind,
): RecommendationSource | undefined {
  return BY_KIND.get(kind);
}
