// BC-9.1 Turn B2c — Query embedder factory (server-only).
//
// Builds a private-first query embedder for search. In test environments
// callers inject a deterministic adapter via registerEmbeddingAdapter().

import { RELATIONSHIP_MEMORY_EMBEDDING_PROFILE } from "./embedding-profile";
import { embedWithProvider } from "./embedding-provider.server";

export async function getQueryEmbedder(): Promise<(text: string) => Promise<Float32Array>> {
  return async (text: string) => {
    const { fnv1a64Hex } = await import("./embedding-input");
    const result = await embedWithProvider({
      text,
      contentHash: fnv1a64Hex(text),
      inputVersion: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.inputVersion,
      protected: false,
    });
    return result.vector;
  };
}
