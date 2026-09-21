// BC-9.1 Turn B2c — Embedding provider abstraction (server-only).
//
// Adapter-based, private-first. Concrete providers are registered lazily so
// tests can inject deterministic adapters. No provider payload is ever
// surfaced to callers.

import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
  type RelationshipMemoryProviderClass,
} from "./embedding-profile";
import { RelationshipMemoryError } from "./errors";

export interface EmbeddingRequest {
  text: string;
  contentHash: string;
  inputVersion: string;
  /** Protected data requires a private-first provider. */
  protected: boolean;
}

export interface EmbeddingResult {
  vector: Float32Array;
  providerClass: RelationshipMemoryProviderClass;
  modelId: string;
  modelVersion: string;
  dimensions: number;
  latencyMs: number;
}

export interface EmbeddingProviderAdapter {
  readonly providerClass: RelationshipMemoryProviderClass;
  readonly modelId: string;
  readonly modelVersion: string;
  embed(req: EmbeddingRequest): Promise<EmbeddingResult>;
}

const adapters = new Map<RelationshipMemoryProviderClass, EmbeddingProviderAdapter>();
let managedApproved = false;

export function registerEmbeddingAdapter(adapter: EmbeddingProviderAdapter): void {
  if (
    !RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.approvedProviderClasses.includes(adapter.providerClass)
  ) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_FORBIDDEN",
      `Provider class '${adapter.providerClass}' not in approved list`,
    );
  }
  adapters.set(adapter.providerClass, adapter);
}

/** Explicit operator opt-in for managed providers to embed protected data. */
export function approveManagedForProtected(approved: boolean): void {
  managedApproved = approved;
}

function selectAdapter(protectedData: boolean): EmbeddingProviderAdapter {
  if (protectedData) {
    const priv = adapters.get("local_private");
    if (priv) return priv;
    if (
      RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.requiresPrivateFirstForProtected &&
      !managedApproved
    ) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_FORBIDDEN",
        "Protected data requires a private-first provider (no local adapter registered)",
      );
    }
  }
  const priv = adapters.get("local_private");
  if (priv) return priv;
  const gemini = adapters.get("managed_gemini");
  if (gemini) return gemini;
  const openai = adapters.get("managed_openai");
  if (openai) return openai;
  throw new RelationshipMemoryError(
    "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_UNAVAILABLE",
    "No embedding adapter registered",
  );
}

export async function embedWithProvider(req: EmbeddingRequest): Promise<EmbeddingResult> {
  const adapter = selectAdapter(req.protected);
  const result = await Promise.race([
    adapter.embed(req),
    new Promise<EmbeddingResult>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new RelationshipMemoryError("RELATIONSHIP_MEMORY_EMBEDDING_FAILED", "Provider timeout"),
          ),
        RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.providerTimeoutMs,
      ),
    ),
  ]);
  if (result.dimensions !== RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH",
      `Expected ${RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions}, got ${result.dimensions}`,
    );
  }
  if (result.vector.length !== result.dimensions) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH",
      "Vector length does not match declared dimensions",
    );
  }
  return result;
}

/** Test-only: clear registered adapters. */
export function __resetEmbeddingAdaptersForTests(): void {
  adapters.clear();
  managedApproved = false;
}
