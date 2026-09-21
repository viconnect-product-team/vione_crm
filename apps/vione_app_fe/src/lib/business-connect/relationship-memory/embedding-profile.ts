// BC-9.1 Turn B2c — Frozen embedding profile registry (client-safe).
//
// The profile fixes dimensions, metric, input version, provider policy, and
// lifecycle bounds so no runtime-defined profile can be introduced.

export const RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID = "relationship_memory_semantic_v1" as const;

export type RelationshipMemoryEmbeddingProfileId = typeof RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID;

export const RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS = 1536 as const;
export const RELATIONSHIP_MEMORY_EMBEDDING_METRIC = "cosine" as const;
export const RELATIONSHIP_MEMORY_EMBEDDING_INPUT_VERSION = "1.0.0" as const;

/** Approved provider *classes*. Model IDs are chosen inside the adapter. */
export const RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES = [
  "local_private",
  "managed_gemini",
  "managed_openai",
] as const;
export type RelationshipMemoryProviderClass =
  (typeof RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES)[number];

export const RELATIONSHIP_MEMORY_EMBEDDING_PROFILE = Object.freeze({
  id: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
  dimensions: RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS,
  metric: RELATIONSHIP_MEMORY_EMBEDDING_METRIC,
  inputVersion: RELATIONSHIP_MEMORY_EMBEDDING_INPUT_VERSION,
  /** Max characters passed to the provider after deterministic truncation. */
  maxInputChars: 4000,
  /** Provider call timeout, ms. */
  providerTimeoutMs: 15_000,
  /** Retry cap across the async lifecycle. */
  maxAttempts: 5,
  /** Approved provider classes. */
  approvedProviderClasses: RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES,
  /**
   * Protected data (sensitive/restricted) requires a private-first provider
   * class. Managed classes are only allowed when explicit policy approval is
   * configured at the adapter layer.
   */
  requiresPrivateFirstForProtected: true,
  /** Retrieval-eligible lifecycle statuses. */
  eligibleLifecycleStatuses: ["active", "verified"] as const,
  /** Terminal / non-current statuses that must be excluded from current context. */
  nonCurrentStatuses: ["superseded", "expired", "archived", "rejected", "dismissed"] as const,
  /** Stale after this many days without observation (used by stale sweeper). */
  staleAfterDays: 180,
});

export type RelationshipMemoryEmbeddingProfile = typeof RELATIONSHIP_MEMORY_EMBEDDING_PROFILE;

export function getEmbeddingProfile(id: string): RelationshipMemoryEmbeddingProfile {
  if (id !== RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID) {
    throw new Error(`Unknown embedding profile: ${id}`);
  }
  return RELATIONSHIP_MEMORY_EMBEDDING_PROFILE;
}

export const RELATIONSHIP_MEMORY_EMBEDDING_STATUSES = [
  "pending",
  "processing",
  "ready",
  "failed",
  "stale",
  "archived",
] as const;
export type RelationshipMemoryEmbeddingStatus =
  (typeof RELATIONSHIP_MEMORY_EMBEDDING_STATUSES)[number];
