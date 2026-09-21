// BC-9.1 — Client-safe barrel. UI imports ONLY from here.
// Server-only modules and future extractors MUST NOT be re-exported.

export * from "./registry";
export * from "./types";
export * from "./errors";
export * from "./eligibility";
export * from "./memory-policy";
export {
  RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION,
  RELATIONSHIP_MEMORY_EXTRACTION_MODES,
  RELATIONSHIP_MEMORY_EXTRACTION_LIMITS,
  RELATIONSHIP_MEMORY_EXTRACTORS,
  getExtractor,
  isKnownExtractor,
  assertRegistryIntegrity,
  type RelationshipMemoryExtractionMode,
  type RelationshipMemoryExtractorDefinition,
} from "./extractor-registry";
export {
  RELATIONSHIP_MEMORY_EVIDENCE_TYPES,
  RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS,
  relationshipMemoryCandidateSchema,
  validateCandidate,
  type RelationshipMemoryCandidate,
  type RelationshipMemoryEvidenceType,
  type RelationshipMemoryEvidenceStrength,
} from "./candidate";
export {
  normalizeWhitespace,
  normalizeCasing,
  normalizeChannel,
  normalizeOrgName,
  normalizeIsoDate,
  stableStructuredValue,
  candidateCanonicalKey,
} from "./normalizers";
export {
  RelationshipMemorySDK,
  RELATIONSHIP_MEMORY_SDK_METHODS,
  type RelationshipMemorySDKType,
} from "./sdk";
export * from "./embedding-profile";
export * from "./embedding-input";
export * from "./embedding-eligibility";
export * from "./search-dto";
export * from "./retrieval-hybrid";
