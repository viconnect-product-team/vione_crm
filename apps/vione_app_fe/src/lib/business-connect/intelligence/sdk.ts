// BC-9.0 — Public SDK contract (§65, §66). Turn A ships the surface; Turn B
// wires runtime. UI code imports ONLY this module — never provider adapters,
// model routers, prompt internals, or raw AI request/result tables.
//
// Every method in Turn A returns PROVIDER_UNAVAILABLE with a safe fallback
// envelope so downstream product surfaces can be scaffolded and tested against
// the real error contract before runtime lands.

// (BC-9.0 B2) — provider is live; PROVIDER_UNAVAILABLE now surfaces only when
// the model gateway can't route this capability under its policy.
import type { BusinessConnectAICapability, BusinessConnectAIResultStatus } from "./registry";
import type {
  FollowUpDraftResponse,
  IntroductionDraftResponse,
  MeetingPreparationResponse,
  NetworkQueryResponse,
  NextActionSuggestionResponse,
  OpportunitySignalResponse,
  RelationshipBriefingResponse,
  WorkHubAssistantResponse,
} from "./response-schemas";
import type { IntelligenceScope, ResponseMeta, SafeRef } from "./types";

export type GenerateRequest<TScope extends IntelligenceScope = IntelligenceScope> = {
  scope: TScope;
  idempotencyKey?: string;
  locale?: "vi" | "en";
};

export type QueryRequest = GenerateRequest & { query: string };

export type AIResultEnvelope<TPayload> = {
  resultId: string;
  status: BusinessConnectAIResultStatus;
  capability: BusinessConnectAICapability;
  meta: ResponseMeta;
  payload: TPayload | null;
  /** Present when payload is null; carries a machine-readable error code. */
  errorCode?: string;
};

export interface BusinessConnectIntelligenceSDKType {
  generateRelationshipBriefing(
    req: GenerateRequest<Extract<IntelligenceScope, { type: "person" | "organization" }>>,
  ): Promise<AIResultEnvelope<RelationshipBriefingResponse>>;
  generateMeetingPreparation(
    req: GenerateRequest<Extract<IntelligenceScope, { type: "meeting" }>>,
  ): Promise<AIResultEnvelope<MeetingPreparationResponse>>;
  generateIntroductionDraft(
    req: GenerateRequest,
  ): Promise<AIResultEnvelope<IntroductionDraftResponse>>;
  generateFollowUpDraft(req: GenerateRequest): Promise<AIResultEnvelope<FollowUpDraftResponse>>;
  suggestNextActions(req: GenerateRequest): Promise<AIResultEnvelope<NextActionSuggestionResponse>>;
  generateOpportunitySignals(
    req: GenerateRequest,
  ): Promise<AIResultEnvelope<OpportunitySignalResponse>>;
  queryNetwork(req: QueryRequest): Promise<AIResultEnvelope<NetworkQueryResponse>>;
  askWorkHubAssistant(req: QueryRequest): Promise<AIResultEnvelope<WorkHubAssistantResponse>>;
  getAIResult(resultId: string): Promise<AIResultEnvelope<unknown>>;
  acceptAIResult(resultId: string): Promise<{ resultId: string; status: "accepted" }>;
  rejectAIResult(
    resultId: string,
    reason?: string,
  ): Promise<{ resultId: string; status: "rejected" }>;
}

async function callGenerate<T>(
  capability: BusinessConnectAICapability,
  req: GenerateRequest | QueryRequest,
): Promise<AIResultEnvelope<T>> {
  const { bcAiGenerate } = await import("@/lib/business-connect-ai.functions");
  const query = "query" in req ? req.query : null;
  const row = await bcAiGenerate({
    data: {
      capability,
      scope: req.scope,
      query,
      idempotencyKey: req.idempotencyKey ?? null,
      locale: req.locale ?? null,
    },
  });
  return {
    resultId: row.resultId,
    status: row.status as BusinessConnectAIResultStatus,
    capability: row.capability as BusinessConnectAICapability,
    meta: row.meta as unknown as ResponseMeta,
    payload: row.payload as unknown as T,
  };
}

export const BusinessConnectIntelligenceSDK: BusinessConnectIntelligenceSDKType = Object.freeze({
  generateRelationshipBriefing: (req: GenerateRequest) =>
    callGenerate<RelationshipBriefingResponse>("relationship_briefing", req),
  generateMeetingPreparation: (req: GenerateRequest) =>
    callGenerate<MeetingPreparationResponse>("meeting_preparation", req),
  generateIntroductionDraft: (req: GenerateRequest) =>
    callGenerate<IntroductionDraftResponse>("introduction_draft", req),
  generateFollowUpDraft: (req: GenerateRequest) =>
    callGenerate<FollowUpDraftResponse>("follow_up_draft", req),
  suggestNextActions: (req: GenerateRequest) =>
    callGenerate<NextActionSuggestionResponse>("next_action_suggestion", req),
  generateOpportunitySignals: (req: GenerateRequest) =>
    callGenerate<OpportunitySignalResponse>("opportunity_signal_summary", req),
  queryNetwork: (req: QueryRequest) => callGenerate<NetworkQueryResponse>("network_query", req),
  askWorkHubAssistant: (req: QueryRequest) =>
    callGenerate<WorkHubAssistantResponse>("work_hub_assistant", req),
  getAIResult: async (resultId: string) => {
    const { bcAiGetResult } = await import("@/lib/business-connect-ai.functions");
    const row = await bcAiGetResult({ data: { resultId } });
    return {
      resultId: row.id,
      status: row.status as BusinessConnectAIResultStatus,
      capability: row.capability as BusinessConnectAICapability,
      meta: (row.meta ?? {}) as unknown as ResponseMeta,
      payload: row.payload as unknown,
    };
  },
  acceptAIResult: async (resultId: string) => {
    const { bcAiAcceptResult } = await import("@/lib/business-connect-ai.functions");
    return await bcAiAcceptResult({ data: { resultId } });
  },
  rejectAIResult: async (resultId: string, reason?: string) => {
    const { bcAiRejectResult } = await import("@/lib/business-connect-ai.functions");
    return await bcAiRejectResult({ data: { resultId, reason } });
  },
});

/** Method allowlist — used by the SDK-freeze contract test. */
export const BUSINESS_CONNECT_AI_SDK_METHODS = Object.freeze([
  "generateRelationshipBriefing",
  "generateMeetingPreparation",
  "generateIntroductionDraft",
  "generateFollowUpDraft",
  "suggestNextActions",
  "generateOpportunitySignals",
  "queryNetwork",
  "askWorkHubAssistant",
  "getAIResult",
  "acceptAIResult",
  "rejectAIResult",
] as const);

/** Safe-ref helper used across callers. */
export function safeRef(id: string, label: string, route?: string): SafeRef {
  return route ? { id, label, route } : { id, label };
}
