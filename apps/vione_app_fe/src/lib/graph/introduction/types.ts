// BC-6.0 — Smart Introduction Foundation — frozen DTOs and versions.
// Read-only. No request workflow, no messaging, no AI.

export const SMART_INTRODUCTION_VERSION = "1.0.0" as const;
export const SMART_INTRODUCTION_REGISTRY_VERSION = "1.0.0" as const;

export type IntroductionConfidence = "low" | "medium" | "high";

export type IntroductionReasonCode =
  | "STRONG_DIRECT_INTERMEDIARY"
  | "STRONG_TARGET_RELATIONSHIP"
  | "MUTUAL_TRUST_PATH"
  | "SAME_ASSOCIATION"
  | "SAME_COMPANY_CONTEXT"
  | "SHARED_COMMUNITY"
  | "SHARED_EVENT"
  | "RECENT_INTERACTION"
  | "PRIOR_INTRODUCTION_HISTORY"
  | "SHORTEST_TRUSTED_PATH";

export interface SmartIntroductionReasonDTO {
  code: IntroductionReasonCode;
  summaryKey: string;
  priority: number;
  count?: number;
  examples?: string[];
}

export interface SmartIntroductionIntermediaryDTO {
  personNodeId: string;
  hop: number;
}

export interface SmartIntroductionTargetDTO {
  personNodeId: string;
}

export interface SmartIntroductionPathDTO {
  pathId: string;
  target: SmartIntroductionTargetDTO;
  intermediaries: SmartIntroductionIntermediaryDTO[];
  depth: 2 | 3;
  score: number;
  confidence: IntroductionConfidence;
  reasons: SmartIntroductionReasonDTO[];
  introductionVersion: typeof SMART_INTRODUCTION_VERSION;
  strengthVersion: string;
  generatedAt: string;
}

export type SmartIntroductionPageState =
  | "OK"
  | "NO_PATH"
  | "TARGET_ALREADY_CONNECTED"
  | "TARGET_UNAVAILABLE"
  | "PRIVACY_RESTRICTED";

export interface SmartIntroductionPageDTO {
  items: SmartIntroductionPathDTO[];
  nextCursor?: string | null;
  introductionVersion: typeof SMART_INTRODUCTION_VERSION;
  /** BC-6.1 — page-level state so UI can render short-circuit states safely. */
  state: SmartIntroductionPageState;
  /** BC-6.1 — true when strength hydration produced fallback for at least one hop. */
  usedStrengthFallback?: boolean;
}

export interface SmartIntroductionQuery {
  targetPersonNodeId: string;
  limit?: number;
  maxDepth?: 2 | 3;
  includeAlternatives?: boolean;
  cursor?: string | null;
}
