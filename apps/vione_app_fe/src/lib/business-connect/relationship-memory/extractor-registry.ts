// BC-9.1 Turn B1 — Frozen Extractor Registry.
//
// SINGLE source of truth for which extractors may run, what memory kinds
// they may produce, in which mode, and under which bounds. Adding a new
// extractor requires bumping the registry version and passing the policy
// tests. No arbitrary extractor names are accepted at runtime.

import {
  RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS,
  type RelationshipMemoryAllowedSourceDomain,
  type RelationshipMemoryKind,
  type RelationshipMemorySensitivity,
} from "./registry";

export const RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION = "b1.0.0" as const;

export const RELATIONSHIP_MEMORY_EXTRACTION_MODES = [
  "deterministic",
  "model_assisted",
  "manual",
] as const;
export type RelationshipMemoryExtractionMode =
  (typeof RELATIONSHIP_MEMORY_EXTRACTION_MODES)[number];

/** Hard extraction bounds. Frozen. Enforced by worker + service. */
export const RELATIONSHIP_MEMORY_EXTRACTION_LIMITS = Object.freeze({
  /** Max candidates a single source record may produce. */
  MAX_CANDIDATES_PER_SOURCE: 20,
  /** Max candidates one worker batch may accept. */
  MAX_CANDIDATES_PER_BATCH: 100,
  /** Max source records a single claim call returns. */
  MAX_SOURCES_PER_CLAIM: 25,
  /** Max characters of any single source text field fed to an extractor. */
  MAX_SOURCE_TEXT_CHARS: 8_000,
  /** Max total characters across all source fields for one record. */
  MAX_SOURCE_CONTEXT_CHARS: 24_000,
  /** Model-assisted provider wall-clock ceiling. */
  MAX_PROVIDER_MS: 45_000,
  /** At most one repair retry for model-assisted extraction. */
  MAX_REPAIR_RETRIES: 1,
  /** Max tool calls if BC-9.0 runtime tools are ever reused by an extractor. */
  MAX_TOOL_CALLS: 8,
  /** Max attempts before receipt is marked failed. */
  MAX_ATTEMPTS_PER_RECEIPT: 3,
});

export interface RelationshipMemoryExtractorDefinition {
  readonly extractorId: string;
  readonly extractorVersion: string;
  readonly sourceDomain: RelationshipMemoryAllowedSourceDomain;
  readonly mode: RelationshipMemoryExtractionMode;
  readonly allowedMemoryKinds: ReadonlyArray<RelationshipMemoryKind>;
  readonly requiredFields: ReadonlyArray<string>;
  readonly maxCandidates: number;
  /** Confidence mapping used by the extractor when producing candidates. */
  readonly confidence: {
    readonly base: number;
    readonly perAdditionalSignal: number;
    readonly max: number;
  };
  /** Extractor cannot mint memories more permissive than this ceiling. */
  readonly sourceVisibilityCeiling: RelationshipMemorySensitivity;
  /** How long an extraction receipt stays "fresh" before eligible for re-run
   *  (Turn C consumes this; B1 only stores it). */
  readonly freshnessDays: number;
  /** Extractor-local timeout budget (ms). */
  readonly timeoutMs: number;
}

/**
 * Frozen registry of extractors approved for Turn B1.
 *
 * Only DETERMINISTIC extractors are shipped in B1. Model-assisted extractor
 * slots are reserved in a follow-up sub-turn once the deterministic path
 * proves out end-to-end; keeping this list short in B1 is intentional.
 */
export const RELATIONSHIP_MEMORY_EXTRACTORS: ReadonlyArray<RelationshipMemoryExtractorDefinition> =
  Object.freeze([
    Object.freeze({
      extractorId: "meeting_outcome.commitments.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "meeting_outcome_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["commitment", "milestone"] as const,
      requiredFields: ["meetingId", "outcomeSummary"] as const,
      maxCandidates: 8,
      confidence: { base: 0.55, perAdditionalSignal: 0.1, max: 0.85 },
      sourceVisibilityCeiling: "sensitive",
      freshnessDays: 30,
      timeoutMs: 5_000,
    }),
    Object.freeze({
      extractorId: "follow_up.commitments.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "follow_up_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["commitment"] as const,
      requiredFields: ["followUpId", "title"] as const,
      maxCandidates: 5,
      confidence: { base: 0.6, perAdditionalSignal: 0.05, max: 0.85 },
      sourceVisibilityCeiling: "sensitive",
      freshnessDays: 30,
      timeoutMs: 5_000,
    }),
    Object.freeze({
      extractorId: "agenda.topics.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "agenda_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["interest", "shared_history"] as const,
      requiredFields: ["meetingId", "agendaItems"] as const,
      maxCandidates: 6,
      confidence: { base: 0.4, perAdditionalSignal: 0.05, max: 0.7 },
      sourceVisibilityCeiling: "standard",
      freshnessDays: 45,
      timeoutMs: 5_000,
    }),
    Object.freeze({
      extractorId: "person_profile.role.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "person_profile_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["role_context"] as const,
      requiredFields: ["personNodeId", "role"] as const,
      maxCandidates: 2,
      confidence: { base: 0.7, perAdditionalSignal: 0.05, max: 0.9 },
      sourceVisibilityCeiling: "public_ok",
      freshnessDays: 90,
      timeoutMs: 3_000,
    }),
    Object.freeze({
      extractorId: "business_card.services.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "person_profile_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["interest"] as const,
      requiredFields: ["cardSlug", "services"] as const,
      maxCandidates: 6,
      confidence: { base: 0.45, perAdditionalSignal: 0.05, max: 0.75 },
      sourceVisibilityCeiling: "public_ok",
      freshnessDays: 60,
      timeoutMs: 3_000,
    }),
    Object.freeze({
      extractorId: "introduction.context.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "introduction_safe",
      mode: "deterministic",
      allowedMemoryKinds: ["shared_history", "opportunity_signal"] as const,
      requiredFields: ["introductionRequestId", "purpose"] as const,
      maxCandidates: 4,
      confidence: { base: 0.5, perAdditionalSignal: 0.05, max: 0.8 },
      sourceVisibilityCeiling: "sensitive",
      freshnessDays: 60,
      timeoutMs: 5_000,
    }),
    Object.freeze({
      extractorId: "manual.owner_authored.v1",
      extractorVersion: "1.0.0",
      sourceDomain: "work_hub_items",
      mode: "manual",
      allowedMemoryKinds: [
        "preference",
        "interest",
        "shared_history",
        "commitment",
        "milestone",
        "personal_context",
      ] as const,
      requiredFields: ["subjectRef", "canonicalText"] as const,
      maxCandidates: 1,
      confidence: { base: 0.8, perAdditionalSignal: 0, max: 0.95 },
      sourceVisibilityCeiling: "restricted",
      freshnessDays: 365,
      timeoutMs: 2_000,
    }),
  ]);

const BY_ID: ReadonlyMap<string, RelationshipMemoryExtractorDefinition> = new Map(
  RELATIONSHIP_MEMORY_EXTRACTORS.map((e: any) => [e.extractorId, e]),
);

const ALLOWED_DOMAINS: ReadonlySet<string> = new Set(RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS);

export function getExtractor(
  extractorId: string,
): RelationshipMemoryExtractorDefinition | undefined {
  return BY_ID.get(extractorId);
}

export function isKnownExtractor(extractorId: string): boolean {
  return BY_ID.has(extractorId);
}

/** Every registered extractor targets an allowlisted safe source domain. */
export function assertRegistryIntegrity(): void {
  for (const ex of RELATIONSHIP_MEMORY_EXTRACTORS) {
    if (!ALLOWED_DOMAINS.has(ex.sourceDomain)) {
      throw new Error(
        `Extractor ${ex.extractorId} declares non-allowlisted source domain ${ex.sourceDomain}`,
      );
    }
    if (
      ex.maxCandidates <= 0 ||
      ex.maxCandidates > RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_CANDIDATES_PER_SOURCE
    ) {
      throw new Error(`Extractor ${ex.extractorId} maxCandidates out of bounds.`);
    }
    if (ex.confidence.base < 0 || ex.confidence.max > 1 || ex.confidence.base > ex.confidence.max) {
      throw new Error(`Extractor ${ex.extractorId} confidence mapping invalid.`);
    }
  }
}
