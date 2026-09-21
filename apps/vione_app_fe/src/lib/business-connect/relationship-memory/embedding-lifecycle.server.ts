// BC-9.1 Turn B2c — Embedding lifecycle (server-only, internal API).
//
// Coordinates: enqueue -> claim -> generate -> persist -> stale-sweep.
// All DB access uses the service-role client and never surfaces raw vectors
// beyond the persistence boundary.

import { RelationshipMemoryError } from "./errors";
import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
} from "./embedding-profile";
import { buildRelationshipMemoryEmbeddingInput } from "./embedding-input";
import { embedWithProvider } from "./embedding-provider.server";
import { shouldMarkEmbeddingStale } from "./embedding-eligibility";
import type { RelationshipMemoryStatus } from "./registry";

/** Minimal admin client shape used here (avoids top-level SDK client import). */
type AdminClient = {
  from: (table: string) => any;
  rpc?: (fn: string, args?: Record<string, unknown>) => any;
};

export interface EmbeddingEnqueueInput {
  memoryId: string;
  ownerUserId: string;
  memoryKind: string;
  canonicalText: string;
  structuredSummary?: string | null;
  subjectType?: string | null;
  subjectLabel?: string | null;
  scopeLabel?: string | null;
  protected: boolean;
}

/** Deterministic enqueue: upsert a pending row keyed by identity tuple. */
export async function enqueueEmbedding(
  admin: AdminClient,
  input: EmbeddingEnqueueInput,
): Promise<{ enqueued: boolean; contentHash: string }> {
  const built = buildRelationshipMemoryEmbeddingInput({
    memoryKind: input.memoryKind as never,
    canonicalText: input.canonicalText,
    structuredSummary: input.structuredSummary ?? null,
    subjectType: (input.subjectType ?? null) as never,
    subjectLabel: input.subjectLabel ?? null,
    scopeLabel: input.scopeLabel ?? null,
  });

  // Insert pending row; conflict on identity index is a no-op.
  const { error } = await admin.from("business_relationship_memory_embeddings").insert({
    memory_id: input.memoryId,
    owner_user_id: input.ownerUserId,
    embedding_profile: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    provider_class: "pending",
    model_id: "pending",
    model_version: "pending",
    dimensions: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions,
    input_version: built.inputVersion,
    content_hash: built.contentHash,
    status: "pending",
  });
  if (error && !String(error.code ?? "").startsWith("23")) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT",
      error.message ?? "enqueue failed",
    );
  }
  return { enqueued: !error, contentHash: built.contentHash };
}

export interface EmbeddingGenerateInput extends EmbeddingEnqueueInput {
  claimToken?: string;
}

/** Generate + persist. Never returns the raw vector to callers. */
export async function generateEmbeddingForMemory(
  admin: AdminClient,
  input: EmbeddingGenerateInput,
): Promise<{
  memoryId: string;
  status: "ready" | "failed";
  contentHash: string;
  providerClass: string;
  modelId: string;
  modelVersion: string;
}> {
  const built = buildRelationshipMemoryEmbeddingInput({
    memoryKind: input.memoryKind as never,
    canonicalText: input.canonicalText,
    structuredSummary: input.structuredSummary ?? null,
    subjectType: (input.subjectType ?? null) as never,
    subjectLabel: input.subjectLabel ?? null,
    scopeLabel: input.scopeLabel ?? null,
  });

  try {
    const result = await embedWithProvider({
      text: built.text,
      contentHash: built.contentHash,
      inputVersion: built.inputVersion,
      protected: input.protected,
    });

    // Persist as pgvector literal — service-role only.
    const vectorLiteral = `[${Array.from(result.vector).join(",")}]`;
    const { error } = await admin
      .from("business_relationship_memory_embeddings")
      .update({
        provider_class: result.providerClass,
        model_id: result.modelId,
        model_version: result.modelVersion,
        embedding: vectorLiteral,
        status: "ready",
        generated_at: new Date().toISOString(),
        claim_token: null,
        claim_expires_at: null,
      })
      .eq("memory_id", input.memoryId)
      .eq("embedding_profile", RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID)
      .eq("content_hash", built.contentHash);
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT", error.message);
    }
    return {
      memoryId: input.memoryId,
      status: "ready",
      contentHash: built.contentHash,
      providerClass: result.providerClass,
      modelId: result.modelId,
      modelVersion: result.modelVersion,
    };
  } catch (err) {
    await admin
      .from("business_relationship_memory_embeddings")
      .update({
        status: "failed",
        last_error_code:
          err instanceof RelationshipMemoryError
            ? err.code
            : "RELATIONSHIP_MEMORY_EMBEDDING_FAILED",
      })
      .eq("memory_id", input.memoryId)
      .eq("content_hash", built.contentHash);
    return {
      memoryId: input.memoryId,
      status: "failed",
      contentHash: built.contentHash,
      providerClass: "none",
      modelId: "none",
      modelVersion: "none",
    };
  }
}

/** Mark embeddings stale for a memory when identity or visibility changed. */
export async function markEmbeddingStale(
  admin: AdminClient,
  input: {
    memoryId: string;
    reason:
      | "content_hash_changed"
      | "input_version_changed"
      | "model_version_changed"
      | "visibility_revoked"
      | "subject_unresolved"
      | "scope_unresolved"
      | "lifecycle_terminal";
  },
): Promise<{ marked: number }> {
  const { data, error } = await admin
    .from("business_relationship_memory_embeddings")
    .update({ status: "stale", stale_at: new Date().toISOString() })
    .eq("memory_id", input.memoryId)
    .neq("status", "archived")
    .select("id");
  if (error) {
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT", error.message);
  }
  return { marked: Array.isArray(data) ? data.length : 0 };
}

export { shouldMarkEmbeddingStale };
