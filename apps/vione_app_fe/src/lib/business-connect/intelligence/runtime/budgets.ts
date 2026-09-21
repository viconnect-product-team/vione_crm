// BC-9.0 Turn B1 — Per-capability timeouts, token budgets, cost estimates.
// Client-safe constants (no runtime imports). Used by the model gateway to
// enforce hard caps BEFORE provider execution — no unbounded requests.

import type { BusinessConnectAICapability } from "../registry";

export const REQUEST_TIMEOUT_MS: Readonly<Record<BusinessConnectAICapability, number>> =
  Object.freeze({
    relationship_briefing: 30_000,
    meeting_preparation: 45_000,
    introduction_draft: 30_000,
    follow_up_draft: 30_000,
    next_action_suggestion: 20_000,
    opportunity_signal_summary: 30_000,
    network_query: 20_000,
    work_hub_assistant: 20_000,
  });

export const TOKEN_BUDGET: Readonly<Record<BusinessConnectAICapability, number>> = Object.freeze({
  relationship_briefing: 4_000,
  meeting_preparation: 6_000,
  introduction_draft: 3_000,
  follow_up_draft: 3_000,
  next_action_suggestion: 2_500,
  opportunity_signal_summary: 4_000,
  network_query: 3_000,
  work_hub_assistant: 3_000,
});

/**
 * Rough millicent cost per 1k tokens by model policy class. Used for
 * pre-flight estimated cost accounting (audit only — real cost is recorded
 * post-run from provider usage headers). Numbers are conservative caps.
 */
export const COST_PER_1K_TOKENS_MILLICENTS: Readonly<Record<string, number>> = Object.freeze({
  cloud_general: 200, // e.g. gpt-5.5 class
  cloud_private: 150,
  local_private: 5,
  unavailable: 0,
});

export function estimateCostMillicents(tokenBudget: number, modelPolicyClass: string): number {
  const rate = COST_PER_1K_TOKENS_MILLICENTS[modelPolicyClass] ?? 0;
  return Math.ceil((tokenBudget / 1000) * rate);
}
