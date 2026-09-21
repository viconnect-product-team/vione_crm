// BC-9.0 Turn B2 — Server-only model gateway construction.
//
// Reads LOVABLE_API_KEY inside the request boundary (never at module scope).
// Builds an OpenAI-compatible provider pointed at Lovable AI Gateway. The
// pure policy layer (selectProvider) in `../model-gateway.ts` chooses which
// model class to use — this file only carries the concrete provider build.

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { BusinessConnectAICapability } from "../registry";
import type { ModelPolicyClass } from "../types";
import { selectProvider, type ProviderHealth } from "./model-gateway";
import { BusinessConnectAIError } from "../errors";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
const MODEL_BY_CLASS: Readonly<Record<ModelPolicyClass, string | null>> = {
  cloud_private: "google/gemini-2.5-flash",
  local_private: null, // not deployed in-app yet — remains unhealthy at runtime
  cloud_general: "openai/gpt-5.5",
  unavailable: null,
};

export type BuiltGateway = {
  provider: ReturnType<typeof createOpenAICompatible>;
  modelId: string;
  providerId: string;
  policyClass: ModelPolicyClass;
};

/**
 * Build the Lovable AI Gateway provider for a given capability. Returns null
 * when the capability policy has no healthy eligible provider — the caller
 * MUST surface PROVIDER_UNAVAILABLE and never fall back to a disallowed class.
 */
export function buildBusinessConnectAIGateway(
  capability: BusinessConnectAICapability,
  lovableApiKey: string | undefined,
): BuiltGateway {
  if (!lovableApiKey) {
    throw new BusinessConnectAIError(
      "BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE",
      "LOVABLE_API_KEY missing on server",
    );
  }
  const health: ProviderHealth[] = (
    Object.entries(MODEL_BY_CLASS) as ReadonlyArray<[ModelPolicyClass, string | null]>
  )
    .filter(
      (entry): entry is [ModelPolicyClass, string] =>
        entry[1] !== null && entry[0] !== "unavailable",
    )
    .map(([policyClass, modelId]) => ({
      policyClass,
      healthy: true,
      supportsStructuredOutput: true,
      providerId: "lovable-ai-gateway",
      modelId,
    }));

  const decision = selectProvider(capability, health);
  if (decision.outcome !== "selected") {
    throw new BusinessConnectAIError(
      "BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE",
      `No healthy provider for ${capability}: ${decision.reason}`,
    );
  }

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: GATEWAY_BASE,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  return {
    provider,
    modelId: decision.modelId,
    providerId: decision.providerId,
    policyClass: decision.policyClass,
  };
}
