// BC-9.0 Turn B1 — Model gateway policy layer (client-safe).
//
// The gateway itself is not wired to a provider in B1 (Turn B2 activates
// tool loops and provider execution). This module ships the deterministic
// PROVIDER SELECTION function that both the SDK and the server persistence
// layer share so tests can prove:
//
//   • private-only capabilities never select `cloud_general`
//   • provider health gates run BEFORE any expensive call
//   • structured-output capability gates apply
//   • a stable `PROVIDER_UNAVAILABLE` result is returned when nothing eligible is up
//
// Real Lovable-AI/OpenAI dispatch lives in a `.server.ts` companion in
// Turn B2. Keeping the policy pure lets it be unit-tested without spinning
// up a Worker.

import { BUSINESS_CONNECT_AI_MODEL_POLICY } from "../model-routing";
import type { BusinessConnectAICapability } from "../registry";
import type { ModelPolicyClass } from "../types";

export type ProviderHealth = {
  policyClass: ModelPolicyClass;
  healthy: boolean;
  supportsStructuredOutput: boolean;
  providerId: string;
  modelId: string;
};

export type GatewayDecision =
  | {
      outcome: "selected";
      policyClass: ModelPolicyClass;
      providerId: string;
      modelId: string;
    }
  | {
      outcome: "unavailable";
      reason: "no_healthy_provider" | "structured_output_unsupported" | "policy_forbidden_public";
    };

/**
 * Deterministic provider selection with privacy safety. Given the capability
 * and current provider health snapshot, return the highest-priority policy
 * class the policy allows AND that has a healthy provider AND that supports
 * structured output.
 *
 * If the capability's policy does NOT include `cloud_general`, we hard-fail
 * before ever considering a `cloud_general` provider — even if it is the
 * only healthy option. This is the private-only invariant.
 */
export function selectProvider(
  capability: BusinessConnectAICapability,
  health: ReadonlyArray<ProviderHealth>,
): GatewayDecision {
  const policyOrder = BUSINESS_CONNECT_AI_MODEL_POLICY[capability];
  const allowsPublic = policyOrder.includes("cloud_general");
  for (const cls of policyOrder) {
    const candidates = health.filter((h) => h.policyClass === cls && h.healthy);
    if (candidates.length === 0) continue;
    const withStructured = candidates.find((c) => c.supportsStructuredOutput);
    if (!withStructured) {
      // capability requires structured output; skip class
      continue;
    }
    return {
      outcome: "selected",
      policyClass: cls,
      providerId: withStructured.providerId,
      modelId: withStructured.modelId,
    };
  }
  // If we got here with an eligible public-only healthy provider but the
  // capability disallows public, surface a specific reason.
  const publicOnlyHealthy = health.some(
    (h) => h.policyClass === "cloud_general" && h.healthy && h.supportsStructuredOutput,
  );
  if (!allowsPublic && publicOnlyHealthy) {
    return { outcome: "unavailable", reason: "policy_forbidden_public" };
  }
  const anyStructured = health.some((h) => h.healthy && h.supportsStructuredOutput);
  if (!anyStructured && health.some((h) => h.healthy)) {
    return { outcome: "unavailable", reason: "structured_output_unsupported" };
  }
  return { outcome: "unavailable", reason: "no_healthy_provider" };
}
