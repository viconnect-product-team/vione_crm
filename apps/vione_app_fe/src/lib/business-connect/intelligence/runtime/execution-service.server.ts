// BC-9.0 Turn B2 — Business Connect AI execution orchestrator (server-only).
//
// Wraps the full advisory generation pipeline:
//
//   1. Verify authenticated viewer (from middleware context).
//   2. Rate-limit + budget checks (persistence layer).
//   3. Load safe facts (viewer-scoped, RLS-enforced) → build context envelope.
//   4. Compute context hash + idempotency signature; check cache.
//   5. Claim request row (idempotent).
//   6. Build gateway provider under the capability's model policy.
//   7. Run bounded tool loop with the AI SDK (`stopWhen: stepCountIs(6)`),
//      structured output via `Output.object`, one repair retry on validation
//      failure.
//   8. Validate factuality + privacy of the model's structured payload.
//   9. Persist canonical result + tool invocations; transition request.
//  10. Return an AIResultEnvelope with meta (versions, freshness, citations).
//
// This module is loaded ONLY inside `.handler()` bodies (never at module
// scope of a `.functions.ts` file) so its server-only imports stay out of
// the client bundle.

import { generateText, Output, NoObjectGeneratedError, stepCountIs, tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import { BUSINESS_CONNECT_AI_POLICY_VERSION, DEFAULT_DAILY_RATE_LIMITS } from "../context-policy";
import { BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS } from "../response-schemas";
import { getPromptEntry } from "../prompt-registry";
import { computeContextHash, computeIdempotencySignature } from "../persistence-hash";
import { BusinessConnectAIError } from "../errors";
import { isScopeCompatible } from "../eligibility";
import type { BusinessConnectAICapability } from "../registry";
import type {
  BusinessConnectAIContextEnvelope,
  IntelligenceScope,
  ResponseMeta,
  ViewerContext,
} from "../types";

import {
  claimRequest,
  findCachedResult,
  incrementRate,
  recordResult,
  recordToolInvocation,
  transitionRequest,
} from "./persistence.server";
import { buildBusinessConnectAIGateway } from "./model-gateway.server";
import {
  createBusinessConnectAIToolLoopState,
  executeBusinessConnectAITool,
  offeredToolsForCapability,
  assertViewerDerivedFromServerContext,
} from "./tool-executor.server";
import {
  serializeBusinessConnectAIContext,
  serializeBusinessConnectAIQuery,
} from "./prompt-envelope";
import {
  validateBusinessConnectAIFactuality,
  validateBusinessConnectAIPrivacy,
} from "./validators";
import { loadBusinessConnectAIFacts } from "./fact-loader.server";
import { redactBusinessConnectAIContext } from "../redaction";
import { buildAuditRecord } from "./audit-shape";

type UserClient = SupabaseClient<Database>;

export type ExecuteInput = {
  supabase: UserClient;
  viewer: ViewerContext;
  capability: BusinessConnectAICapability;
  scope: IntelligenceScope;
  query?: string | null;
  idempotencyKey?: string | null;
};

export type ExecuteOutput = {
  resultId: string;
  status: "generated" | "reviewed" | "accepted" | "expired" | "rejected";
  capability: BusinessConnectAICapability;
  payload: unknown;
  meta: ResponseMeta;
  cacheHit: boolean;
};

function scopeRefOf(scope: IntelligenceScope): string | null {
  switch (scope.type) {
    case "person":
      return scope.personRef.id;
    case "organization":
      return scope.organizationRef.id;
    case "meeting":
      return scope.meetingRef.id;
    case "introduction":
      return scope.introductionRef.id;
    default:
      return null;
  }
}

function buildResponseMeta(
  envelope: BusinessConnectAIContextEnvelope,
  modelId: string | null,
  citations: readonly {
    sourceType: string;
    sourceRef: { id: string; label: string; route?: string };
    updatedAt: string;
  }[],
  confidence: "low" | "medium" | "high",
  limitations: readonly string[],
): ResponseMeta {
  return {
    capability: envelope.capability,
    generatedAt: envelope.dataFreshness.generatedAt,
    promptVersion: envelope.promptVersion,
    policyVersion: envelope.policyVersion,
    modelPolicy: envelope.modelPolicy,
    modelId,
    confidence,
    sourceFreshness: {
      oldestSourceUpdatedAt: envelope.dataFreshness.oldestSourceUpdatedAt,
      newestSourceUpdatedAt: envelope.dataFreshness.newestSourceUpdatedAt,
      isStale: false,
    },
    limitations,
    citations: citations.map((c: any) => ({
      sourceType: c.sourceType as ResponseMeta["citations"][number]["sourceType"],
      sourceRef: c.sourceRef,
      updatedAt: c.updatedAt,
    })),
  };
}

export async function executeBusinessConnectAI(input: ExecuteInput): Promise<ExecuteOutput> {
  assertViewerDerivedFromServerContext(input.viewer);
  const { capability, scope, viewer, supabase } = input;

  if (!isScopeCompatible(capability, scope)) {
    throw new BusinessConnectAIError(
      "BUSINESS_CONNECT_AI_SCOPE_INVALID",
      `${capability} does not accept scope ${scope.type}`,
    );
  }

  // 1. Rate limit
  const rate = await incrementRate(supabase, capability, DEFAULT_DAILY_RATE_LIMITS[capability]);
  if (!rate.allowed) {
    throw new BusinessConnectAIError(
      "BUSINESS_CONNECT_AI_RATE_LIMITED",
      `Daily limit ${rate.dailyLimit} reached (${rate.currentCount})`,
    );
  }

  // 2. Build model policy + provider
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const gateway = buildBusinessConnectAIGateway(capability, lovableApiKey);

  // 3. Load safe facts + build envelope
  const loaded = await loadBusinessConnectAIFacts({
    supabase,
    viewer,
    capability,
    scope,
  });
  const promptEntry = getPromptEntry(capability);
  const now = new Date();
  const initialEnvelope: BusinessConnectAIContextEnvelope = redactBusinessConnectAIContext({
    requestId: crypto.randomUUID(),
    capability,
    viewerContext: viewer,
    scope,
    safeFacts: loaded.facts,
    exclusions: [...loaded.omissions, "private meeting notes"],
    dataFreshness: {
      generatedAt: now.toISOString(),
      oldestSourceUpdatedAt: null,
      newestSourceUpdatedAt: null,
    },
    sourceVersions: loaded.sourceVersions,
    policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
    promptVersion: promptEntry.version,
    modelPolicy: gateway.policyClass,
  });

  // 4. Cache lookup
  const contextHash = computeContextHash(initialEnvelope);
  const cached = await findCachedResult(supabase, {
    capability,
    contextHash,
    promptVersion: promptEntry.version,
    policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
    modelPolicyClass: gateway.policyClass,
    sourceVersions: loaded.sourceVersions,
  });
  if (cached && !cached.staleReason) {
    const meta = (cached.meta ?? {}) as unknown as ResponseMeta;
    return {
      resultId: cached.resultId,
      status: "generated",
      capability,
      payload: cached.payload,
      meta,
      cacheHit: true,
    };
  }

  // 5. Claim request
  const idempotencySignature = computeIdempotencySignature({
    requesterOpaqueId: viewer.viewerRef.id,
    tenantScopeOpaque: viewer.tenantScopeOpaque,
    capability,
    scopeType: scope.type,
    scopeRef: scopeRefOf(scope),
    contextHash,
    promptVersion: promptEntry.version,
    policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
    modelPolicyClass: gateway.policyClass,
    userIdempotencyKey: input.idempotencyKey ?? null,
  });
  const claim = await claimRequest(supabase, {
    capability,
    scopeType: scope.type,
    scopeRef: scopeRefOf(scope),
    idempotencySignature,
    userIdempotencyKey: input.idempotencyKey ?? null,
    contextHash,
    promptVersion: promptEntry.version,
    policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
    modelPolicyClass: gateway.policyClass,
    sourceVersions: loaded.sourceVersions,
    tenantScopeOpaque: viewer.tenantScopeOpaque,
  });

  const startedAt = Date.now();
  await transitionRequest(supabase, {
    requestId: claim.requestId,
    next: "running",
    providerId: gateway.providerId,
    modelId: gateway.modelId,
  });

  try {
    // 6. Build AI SDK tool set
    const toolLoopState = createBusinessConnectAIToolLoopState();
    const offered = offeredToolsForCapability(capability);
    // AI SDK's `tool()` generic infers as `Tool<never, never>` when we build a
    // heterogeneous record; the shape is correct at runtime, so we type the
    // container as `Record<string, unknown>` and cast at the call boundary.
    const aiTools: Record<string, unknown> = {};
    for (const t of offered) {
      aiTools[t.name] = tool({
        description: t.description,

        inputSchema: t.inputSchema as any,

        execute: (async (rawInput: unknown) => {
          const outcome = executeBusinessConnectAITool({
            capability,
            viewer,
            envelope: initialEnvelope,
            state: toolLoopState,
            request: { toolName: t.name, input: rawInput },
          });
          const iteration = toolLoopState.callCount;
          try {
            await recordToolInvocation(supabase, {
              requestId: claim.requestId,
              toolName: t.name,
              iteration,
              status: outcome.status === "ok" ? "ok" : "denied",
              inputSummary: { toolName: t.name, iteration },
              outputSummary: {
                status: outcome.status,
                resultCount: outcome.status === "ok" ? outcome.facts.length : 0,
                reason: outcome.status === "denied" ? outcome.reason : undefined,
              },
              latencyMs: null,
              errorCode: outcome.status === "denied" ? outcome.reason : null,
            });
          } catch {
            // audit failure never blocks the loop
          }
          if (outcome.status === "denied") {
            return { available: false, reason: outcome.reason, detail: outcome.detail };
          }
          return { available: true, facts: outcome.facts };
        }) as any,
      });
    }

    const schema = BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS[capability];
    const contextBlock = serializeBusinessConnectAIContext(initialEnvelope);
    const queryBlock = serializeBusinessConnectAIQuery(input.query ?? null);

    const runOnce = async () => {
      return await generateText({
        model: gateway.provider(gateway.modelId),
        system: promptEntry.systemInstruction,
        prompt: `${contextBlock}\n\n${queryBlock}`,

        tools: aiTools as any,
        stopWhen: stepCountIs(50),

        output: Output.object({ schema: schema as any }) as any,
      });
    };

    let output: unknown;
    try {
      const first = await runOnce();

      output = (first as any).output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        // one repair retry with an explicit fix instruction
        const repair = await generateText({
          model: gateway.provider(gateway.modelId),
          system: promptEntry.systemInstruction,
          prompt: `${contextBlock}\n\n${queryBlock}\n\nLần trước JSON không hợp lệ. Chỉ trả JSON đúng schema.`,

          tools: aiTools as any,
          stopWhen: stepCountIs(50),

          output: Output.object({ schema: schema as any }) as any,
        });

        output = (repair as any).output;
      } else {
        throw error;
      }
    }

    // 8. Validators
    const privacyIssues = validateBusinessConnectAIPrivacy(output);
    if (privacyIssues.length > 0) {
      throw new BusinessConnectAIError(
        "BUSINESS_CONNECT_AI_INVALID_RESPONSE",
        `Privacy validator rejected response: ${privacyIssues[0].code} @ ${privacyIssues[0].path}`,
        { issues: privacyIssues.map((i) => i.code) },
      );
    }
    const factIssues = validateBusinessConnectAIFactuality(output, initialEnvelope);
    if (factIssues.length > 0) {
      throw new BusinessConnectAIError(
        "BUSINESS_CONNECT_AI_INVALID_RESPONSE",
        `Factuality validator rejected response: ${factIssues[0].detail}`,
        { issues: factIssues.map((i) => i.code) },
      );
    }

    const meta = buildResponseMeta(
      initialEnvelope,
      gateway.modelId,
      (output as { citations?: ResponseMeta["citations"] })?.citations ?? [],
      (output as { confidence?: "low" | "medium" | "high" })?.confidence ?? "low",
      (output as { limitations?: readonly string[] })?.limitations ?? loaded.omissions,
    );

    const auditRecord = buildAuditRecord({
      capability,
      scopeType: scope.type,
      modelPolicyClass: gateway.policyClass,
      providerId: gateway.providerId,
      modelId: gateway.modelId,
      promptVersion: promptEntry.version,
      policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
      latencyMs: Date.now() - startedAt,
      tokensPrompt: null,
      tokensCompletion: null,
      cacheHit: false,
      status: "completed",
      errorCode: null,
    });

    const resultId = await recordResult(supabase, {
      requestId: claim.requestId,
      payload: output,
      audit: auditRecord,
      contextHash,
      sourceVersions: loaded.sourceVersions,
      promptVersion: promptEntry.version,
      policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
      modelPolicyClass: gateway.policyClass,
      providerId: gateway.providerId,
      modelId: gateway.modelId,
      capability,
      cacheHit: false,
    });
    await transitionRequest(supabase, {
      requestId: claim.requestId,
      next: "completed",
      latencyMs: Date.now() - startedAt,
    });

    return {
      resultId,
      status: "generated",
      capability,
      payload: output,
      meta,
      cacheHit: false,
    };
  } catch (error) {
    const errorCode =
      error instanceof BusinessConnectAIError ? error.code : "BUSINESS_CONNECT_AI_INTERNAL_ERROR";
    try {
      await transitionRequest(supabase, {
        requestId: claim.requestId,
        next: "failed",
        errorCode,
        reason: error instanceof Error ? error.message.slice(0, 200) : null,
        latencyMs: Date.now() - startedAt,
      });
    } catch {
      // ignore secondary failure
    }
    throw error;
  }
}
