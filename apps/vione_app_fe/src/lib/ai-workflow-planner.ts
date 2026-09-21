import type { CapabilityId } from "@/lib/ai-capabilities";
import type { AiSessionMemory } from "@/lib/ai-session-memory";
import { AI_WORKFLOWS, workflowsForCapability, type AiWorkflow } from "@/lib/ai-workflows";

/**
 * AI Workflow Planner — Phase 10, Step 8.
 *
 * Deterministic (NO LLM) selection of the best-matching workflow(s) from a user
 * message + detected capability + session memory. Returns a primary workflow to
 * preview plus alternative suggestions when several workflows match. Never
 * executes anything — planning only.
 */

export type WorkflowMatch = {
  workflow: AiWorkflow;
  score: number;
};

export type WorkflowPlan = {
  /** Best-matching workflow, or null when nothing matched. */
  workflow: AiWorkflow | null;
  /** Additional matching workflows the user can choose instead. */
  suggestions: AiWorkflow[];
  /** Short reason (Vietnamese). */
  reason: string;
};

/** Score how well a workflow matches the message + capability. */
function scoreWorkflow(
  wf: AiWorkflow,
  lowerMessage: string,
  capability: CapabilityId | null,
): number {
  let score = 0;
  for (const t of wf.triggers) {
    if (lowerMessage.includes(t.toLowerCase())) score += 2;
  }
  if (capability && wf.supportedCapabilities.includes(capability)) score += 1;
  return score;
}

export function matchWorkflows(message: string, capability: CapabilityId | null): WorkflowMatch[] {
  const lower = message.toLowerCase().trim();
  return AI_WORKFLOWS.map((wf) => ({ workflow: wf, score: scoreWorkflow(wf, lower, capability) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function planWorkflow(
  message: string,
  capability: CapabilityId | null,
  memory?: AiSessionMemory | null,
): WorkflowPlan {
  const matches = matchWorkflows(message, capability);

  if (matches.length === 0) {
    // No trigger/capability hit — offer capability-scoped workflows if any.
    const fallbackCap = capability ?? memory?.activeCapability ?? null;
    const capWorkflows = fallbackCap ? workflowsForCapability(fallbackCap) : [];
    if (capWorkflows.length > 0) {
      return {
        workflow: capWorkflows[0],
        suggestions: capWorkflows.slice(1),
        reason: "Chọn quy trình theo năng lực hiện tại.",
      };
    }
    return {
      workflow: null,
      suggestions: [],
      reason: "Chưa tìm thấy quy trình phù hợp cho yêu cầu này.",
    };
  }

  const [best, ...rest] = matches;
  // Only surface alternatives that scored close to the best (avoid noise).
  const suggestions = rest
    .filter((m) => m.score >= Math.max(1, best.score - 2))
    .map((m) => m.workflow);

  return {
    workflow: best.workflow,
    suggestions,
    reason:
      suggestions.length > 0
        ? "Có nhiều quy trình phù hợp — bạn có thể chọn quy trình khác."
        : `Đề xuất quy trình "${best.workflow.name}".`,
  };
}
