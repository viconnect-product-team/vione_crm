// BC-9.0 — Model routing policy (§16, §17, §18). Pure & deterministic.
//
// Runtime provider selection lives in `runtime/model-router.server.ts` (Turn B)
// and MUST consult this policy first. This module makes it easy to prove — in
// tests — that no capability silently routes protected context to an
// unapproved public provider.

import type { BusinessConnectAICapability } from "./registry";
import type { ModelPolicyClass } from "./types";

/** Per-capability policy: ordered preference list of acceptable model classes. */
export const BUSINESS_CONNECT_AI_MODEL_POLICY: Readonly<
  Record<BusinessConnectAICapability, ReadonlyArray<ModelPolicyClass>>
> = Object.freeze({
  relationship_briefing: ["cloud_private", "local_private"],
  meeting_preparation: ["cloud_private", "local_private"],
  introduction_draft: ["cloud_private", "local_private", "cloud_general"],
  follow_up_draft: ["cloud_private", "local_private", "cloud_general"],
  next_action_suggestion: ["cloud_private", "local_private"],
  opportunity_signal_summary: ["cloud_private", "local_private"],
  network_query: ["cloud_private", "local_private"],
  work_hub_assistant: ["cloud_private", "local_private"],
});

/**
 * Choose the highest-preference class from the capability's allowed list that
 * is currently available. Returns `"unavailable"` when no eligible class is up.
 */
export function selectModelPolicyClass(
  capability: BusinessConnectAICapability,
  availability: Readonly<Record<ModelPolicyClass, boolean>>,
): ModelPolicyClass {
  const preferences = BUSINESS_CONNECT_AI_MODEL_POLICY[capability];
  for (const candidate of preferences) {
    if (availability[candidate]) return candidate;
  }
  return "unavailable";
}

/** Assert no capability allows `cloud_general` before a private option. */
export function assertPrivateBeforePublic(): void {
  for (const [cap, prefs] of Object.entries(BUSINESS_CONNECT_AI_MODEL_POLICY)) {
    const firstIndexOfPublic = prefs.indexOf("cloud_general");
    if (firstIndexOfPublic === -1) continue;
    const hasPrivateEarlier = prefs
      .slice(0, firstIndexOfPublic)
      .some((p) => p === "cloud_private" || p === "local_private");
    if (!hasPrivateEarlier) {
      throw new Error(`[BC-9.0] capability ${cap} allows public model before private option`);
    }
  }
}
