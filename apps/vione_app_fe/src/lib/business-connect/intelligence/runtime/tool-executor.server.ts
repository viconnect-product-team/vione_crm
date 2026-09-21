// BC-9.0 Turn B2 — Viewer-scoped, bounded tool executor.
//
// Runtime rules enforced here (proven in tests):
//   • Viewer identity comes from the AUTHENTICATED server context only.
//     Any identity-shaped field supplied by the model in tool input is
//     rejected (the Zod schema also rejects such keys via strict()).
//   • Only tools registered in tool-registry.ts may be invoked.
//   • Every invocation is capability-gated: if the current request's
//     capability is not in the tool's capability allowlist → denied.
//   • Executor operates over the ALREADY-REDACTED context envelope — it
//     never widens scope, never fetches private notes, never returns raw
//     rows from excluded domains.
//   • Hard bounds: at most TOOL_LOOP_LIMITS.maxToolCallsPerRequest calls,
//     TOOL_LOOP_LIMITS.maxTotalFacts fact rows returned in aggregate.

import { TOOL_LOOP_LIMITS } from "../context-policy";
import type { BusinessConnectAICapability } from "../registry";
import type {
  BusinessConnectAIContextEnvelope,
  BusinessConnectSafeFact,
  ViewerContext,
} from "../types";
import {
  BUSINESS_CONNECT_AI_TOOLS,
  getBusinessConnectAITool,
  type BusinessConnectAIToolDefinition,
  type BusinessConnectAIToolName,
} from "../tool-registry";
import { BusinessConnectAIError } from "../errors";

export type ToolExecutionRequest = {
  toolName: string;
  input: unknown;
};

export type ToolExecutionOutcome =
  | {
      status: "ok";
      toolName: BusinessConnectAIToolName;
      facts: readonly BusinessConnectSafeFact[];
    }
  | {
      status: "denied";
      toolName: string;
      reason:
        | "unknown_tool"
        | "capability_not_allowed"
        | "invalid_input"
        | "identity_field_rejected"
        | "budget_exhausted";
      detail: string;
    };

export type ToolLoopState = {
  callCount: number;
  factsReturned: number;
  startedAtMs: number;
};

export function createBusinessConnectAIToolLoopState(now = Date.now()): ToolLoopState {
  return { callCount: 0, factsReturned: 0, startedAtMs: now };
}

function checkBudget(state: ToolLoopState): string | null {
  if (state.callCount >= TOOL_LOOP_LIMITS.maxToolCallsPerRequest)
    return `max_tool_calls_exceeded (${TOOL_LOOP_LIMITS.maxToolCallsPerRequest})`;
  if (state.factsReturned >= TOOL_LOOP_LIMITS.maxTotalFacts)
    return `max_total_facts_exceeded (${TOOL_LOOP_LIMITS.maxTotalFacts})`;
  if (Date.now() - state.startedAtMs > TOOL_LOOP_LIMITS.maxWallClockMs)
    return `wall_clock_exceeded (${TOOL_LOOP_LIMITS.maxWallClockMs}ms)`;
  return null;
}

const BANNED_INPUT_KEYS = new Set([
  "viewerId",
  "userId",
  "authUid",
  "tenantId",
  "ownerId",
  "impersonate",
  "asUser",
  "supabase",
]);

function rejectsIdentityFields(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  for (const k of Object.keys(input as Record<string, unknown>)) {
    if (BANNED_INPUT_KEYS.has(k)) return k;
  }
  return null;
}

/**
 * Filter the envelope's safeFacts to answer a tool call. Never fetches;
 * only projects from the pre-assembled envelope, so the redaction & source
 * allowlist guarantees always hold.
 */
function projectFactsForTool(
  tool: BusinessConnectAIToolDefinition,
  input: Record<string, unknown>,
  envelope: BusinessConnectAIContextEnvelope,
): BusinessConnectSafeFact[] {
  const allowedSources = new Set<string>(tool.sourceDomains);
  const base = envelope.safeFacts.filter((f) => allowedSources.has(f.sourceDomain));

  const meetingRefId = typeof input.meetingRefId === "string" ? input.meetingRefId : null;
  const personRefId = typeof input.personRefId === "string" ? input.personRefId : null;
  const signalType = typeof input.signalType === "string" ? input.signalType : null;
  const category = typeof input.category === "string" ? input.category : null;
  const limitFromInput = typeof input.limit === "number" && input.limit > 0 ? input.limit : null;
  const limit = Math.min(tool.maxResults, limitFromInput ?? tool.maxResults);

  let scoped = base;
  switch (tool.name) {
    case "list_my_recent_meetings":
      scoped = base.filter((f) => f.kind === "meeting");
      break;
    case "get_meeting_snapshot":
      scoped = base.filter(
        (f) => f.kind === "meeting" && (!meetingRefId || f.ref.id === meetingRefId),
      );
      break;
    case "list_meeting_agenda":
      scoped = base.filter(
        (f) => f.kind === "agenda_item" && (!meetingRefId || f.meetingRef.id === meetingRefId),
      );
      break;
    case "list_meeting_shared_notes":
      scoped = base.filter(
        (f) => f.kind === "shared_note" && (!meetingRefId || f.meetingRef.id === meetingRefId),
      );
      break;
    case "get_meeting_outcome":
      scoped = base.filter(
        (f) => f.kind === "meeting_outcome" && (!meetingRefId || f.meetingRef.id === meetingRefId),
      );
      break;
    case "list_my_follow_ups":
      scoped = base.filter(
        (f) => f.kind === "follow_up" && (!meetingRefId || f.meetingRef?.id === meetingRefId),
      );
      break;
    case "get_relationship_snapshot":
      scoped = base.filter(
        (f) =>
          (f.kind === "relationship" || f.kind === "person") &&
          (!personRefId ||
            (f.kind === "relationship"
              ? f.counterpart.id === personRefId
              : f.ref.id === personRefId)),
      );
      break;
    case "list_recent_interactions":
      scoped = base.filter((f) => {
        if (!personRefId) return true;
        if (f.kind === "meeting") return f.participants.some((p) => p.id === personRefId);
        if (f.kind === "meeting_outcome" || f.kind === "follow_up") return true;
        return false;
      });
      break;
    case "list_my_introductions":
      scoped = base.filter(
        (f) =>
          f.kind === "introduction" &&
          (!personRefId ||
            f.requester.id === personRefId ||
            f.target.id === personRefId ||
            f.intermediary?.id === personRefId),
      );
      break;
    case "list_work_hub_items":
      scoped = base.filter((f) => f.kind === "work_item" && (!category || f.category === category));
      break;
    case "list_opportunity_signals":
      scoped = base.filter(
        (f) => f.kind === "opportunity_signal" && (!signalType || f.signalType === signalType),
      );
      break;
  }
  return scoped.slice(0, limit);
}

/**
 * Execute a single tool call. `viewer` is derived from the authenticated
 * server context by the caller; we ONLY accept it as an argument (never from
 * the model's tool input). The executor never uses viewer to widen scope
 * against the envelope — the envelope was already built with the viewer in
 * mind.
 */
export function executeBusinessConnectAITool(args: {
  capability: BusinessConnectAICapability;
  viewer: ViewerContext;
  envelope: BusinessConnectAIContextEnvelope;
  state: ToolLoopState;
  request: ToolExecutionRequest;
}): ToolExecutionOutcome {
  const { capability, envelope, state, request } = args;
  // Touch viewer to keep it in the signature — critical invariant that it is
  // an explicit parameter and cannot be supplied via `request.input`.
  void args.viewer;

  const budgetIssue = checkBudget(state);
  if (budgetIssue) {
    return {
      status: "denied",
      toolName: request.toolName,
      reason: "budget_exhausted",
      detail: budgetIssue,
    };
  }

  const tool = getBusinessConnectAITool(request.toolName);
  if (!tool) {
    return {
      status: "denied",
      toolName: request.toolName,
      reason: "unknown_tool",
      detail: `tool ${request.toolName} not in frozen registry`,
    };
  }
  if (!tool.capabilities.includes(capability)) {
    return {
      status: "denied",
      toolName: request.toolName,
      reason: "capability_not_allowed",
      detail: `capability ${capability} may not call ${tool.name}`,
    };
  }

  const identityKey = rejectsIdentityFields(request.input);
  if (identityKey) {
    return {
      status: "denied",
      toolName: request.toolName,
      reason: "identity_field_rejected",
      detail: `model supplied identity field: ${identityKey}`,
    };
  }

  const parsed = tool.inputSchema.safeParse(request.input ?? {});
  if (!parsed.success) {
    return {
      status: "denied",
      toolName: request.toolName,
      reason: "invalid_input",
      detail: parsed.error.issues[0]?.message ?? "schema mismatch",
    };
  }

  const facts = projectFactsForTool(tool, parsed.data as Record<string, unknown>, envelope);

  state.callCount += 1;
  state.factsReturned += facts.length;

  return { status: "ok", toolName: tool.name, facts };
}

/** Enumerate tools offered to the model for the given capability. */
export function offeredToolsForCapability(
  capability: BusinessConnectAICapability,
): ReadonlyArray<BusinessConnectAIToolDefinition> {
  return BUSINESS_CONNECT_AI_TOOLS.filter((t) => t.capabilities.includes(capability));
}

/** Convert the frozen registry into AI-SDK-compatible tool descriptors. */
export function describeBusinessConnectAIToolsForModel(capability: BusinessConnectAICapability) {
  return offeredToolsForCapability(capability).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

/** Guard used at server boundary — throws typed error on failed viewer check. */
export function assertViewerDerivedFromServerContext(viewer: ViewerContext): void {
  if (!viewer || !viewer.viewerRef?.id || !viewer.tenantScopeOpaque) {
    throw new BusinessConnectAIError(
      "BUSINESS_CONNECT_AI_UNAUTHENTICATED",
      "Viewer context missing",
    );
  }
}
