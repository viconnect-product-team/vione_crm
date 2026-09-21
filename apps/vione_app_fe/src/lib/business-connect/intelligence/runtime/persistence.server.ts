// BC-9.0 Turn B1 — Server-only persistence, cache lookup, and RPC wrappers.
//
// This module is loaded ONLY from server function handlers via a dynamic
// import (never at module scope) so it stays out of the client bundle.
// All writes go through SECURITY DEFINER RPCs; direct table writes are
// blocked by RLS (no INSERT/UPDATE/DELETE policies exist).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { BusinessConnectAICapability } from "../registry";
import type { ModelPolicyClass } from "../types";
import type { BusinessConnectAIAuditRecord } from "./audit-shape";
import { AUDIT_FORBIDDEN_KEYS, buildAuditRecord } from "./audit-shape";
import { estimateCostMillicents, REQUEST_TIMEOUT_MS, TOKEN_BUDGET } from "./budgets";
import { RESULT_EXPIRY_SECONDS, DEFAULT_DAILY_RATE_LIMITS } from "../context-policy";
import { isResultStale } from "../persistence-hash";

type UserClient = SupabaseClient<Database>;

/** Claim a request row idempotently. Returns id + whether it was new. */
export async function claimRequest(
  supabase: UserClient,
  args: {
    capability: BusinessConnectAICapability;
    scopeType: string;
    scopeRef: string | null;
    idempotencySignature: string;
    userIdempotencyKey: string | null;
    contextHash: string;
    promptVersion: string;
    policyVersion: string;
    modelPolicyClass: ModelPolicyClass;
    sourceVersions: Record<string, string>;
    tenantScopeOpaque: string;
  },
): Promise<{
  requestId: string;
  isNew: boolean;
  existingStatus: string;
  canonicalResultId: string | null;
}> {
  const capability = args.capability;
  const timeoutMs = REQUEST_TIMEOUT_MS[capability];
  const tokenBudget = TOKEN_BUDGET[capability];
  const expiresAt = new Date(Date.now() + RESULT_EXPIRY_SECONDS[capability] * 1000).toISOString();
  const estimatedCost = estimateCostMillicents(tokenBudget, args.modelPolicyClass);

  const { data, error } = await supabase.rpc("bcai_claim_request", {
    p_capability: capability,
    p_scope_type: args.scopeType,
    p_scope_ref: args.scopeRef,
    p_idempotency_signature: args.idempotencySignature,
    p_user_idempotency_key: args.userIdempotencyKey,
    p_context_hash: args.contextHash,
    p_prompt_version: args.promptVersion,
    p_policy_version: args.policyVersion,
    p_model_policy_class: args.modelPolicyClass,
    p_source_versions: args.sourceVersions,
    p_timeout_ms: timeoutMs,
    p_token_budget: tokenBudget,
    p_expires_at: expiresAt,
    p_tenant_scope_opaque: args.tenantScopeOpaque,
    p_estimated_cost_millicents: estimatedCost,
  } as never);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("BC-9.0 claim_request returned no row");
  return {
    requestId: (row as { request_id: string }).request_id,
    isNew: (row as { is_new: boolean }).is_new,
    existingStatus: (row as { existing_status: string }).existing_status,
    canonicalResultId: (row as { canonical_result_id: string | null }).canonical_result_id,
  };
}

/** Transition a request status through the validated lifecycle. */
export async function transitionRequest(
  supabase: UserClient,
  args: {
    requestId: string;
    next: "running" | "completed" | "failed" | "cancelled" | "expired";
    reason?: string | null;
    providerId?: string | null;
    modelId?: string | null;
    latencyMs?: number | null;
    actualCostMillicents?: number | null;
    errorCode?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc("bcai_transition_request", {
    p_request_id: args.requestId,
    p_next_status: args.next,
    p_reason: args.reason ?? null,
    p_provider_id: args.providerId ?? null,
    p_model_id: args.modelId ?? null,
    p_latency_ms: args.latencyMs ?? null,
    p_actual_cost_millicents: args.actualCostMillicents ?? null,
    p_error_code: args.errorCode ?? null,
  } as never);
  if (error) throw error;
}

/** Record a canonical result for a request. Idempotent under concurrency. */
export async function recordResult(
  supabase: UserClient,
  args: {
    requestId: string;
    payload: unknown;
    audit: BusinessConnectAIAuditRecord;
    contextHash: string;
    sourceVersions: Record<string, string>;
    promptVersion: string;
    policyVersion: string;
    modelPolicyClass: ModelPolicyClass;
    providerId: string | null;
    modelId: string | null;
    capability: BusinessConnectAICapability;
    cacheHit: boolean;
  },
): Promise<string> {
  const auditShaped = buildAuditRecord(args.audit);
  // Defensive: assert nothing forbidden slipped into audit
  for (const forbid of AUDIT_FORBIDDEN_KEYS) {
    if ((auditShaped as Record<string, unknown>)[forbid] !== undefined) {
      throw new Error(`BC-9.0 audit forbidden key present: ${forbid}`);
    }
  }
  const expiresAt = new Date(
    Date.now() + RESULT_EXPIRY_SECONDS[args.capability] * 1000,
  ).toISOString();
  const { data, error } = await supabase.rpc("bcai_record_result", {
    p_request_id: args.requestId,
    p_payload: args.payload,
    p_meta: { audit: auditShaped },
    p_context_hash: args.contextHash,
    p_source_versions: args.sourceVersions,
    p_prompt_version: args.promptVersion,
    p_policy_version: args.policyVersion,
    p_model_policy_class: args.modelPolicyClass,
    p_provider_id: args.providerId,
    p_model_id: args.modelId,
    p_expires_at: expiresAt,
    p_cache_hit: args.cacheHit,
  } as never);
  if (error) throw error;
  return data as string;
}

/**
 * Look up a fresh canonical result for the same requester/capability/context.
 * User-isolation and tenant-isolation are enforced by RLS `owner_id = auth.uid()`.
 */
export async function findCachedResult(
  supabase: UserClient,
  args: {
    capability: BusinessConnectAICapability;
    contextHash: string;
    promptVersion: string;
    policyVersion: string;
    modelPolicyClass: ModelPolicyClass;
    sourceVersions: Record<string, string>;
  },
): Promise<{
  resultId: string;
  payload: unknown;
  meta: unknown;
  staleReason: string | null;
} | null> {
  const { data, error } = await supabase
    .from("business_connect_ai_results")
    .select(
      "id, payload, meta, context_hash, source_versions, prompt_version, policy_version, model_policy_class, expires_at, status",
    )
    .eq("capability", args.capability)
    .eq("context_hash", args.contextHash)
    .eq("is_canonical", true)
    .in("status", ["generated", "reviewed", "accepted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const stale = isResultStale({
    storedContextHash: data.context_hash,
    storedSourceVersions: (data.source_versions ?? {}) as Record<string, string>,
    storedPromptVersion: data.prompt_version,
    storedPolicyVersion: data.policy_version,
    storedModelPolicyClass: data.model_policy_class as ModelPolicyClass,
    storedExpiresAt: data.expires_at,
    currentContextHash: args.contextHash,
    currentSourceVersions: args.sourceVersions,
    currentPromptVersion: args.promptVersion,
    currentPolicyVersion: args.policyVersion,
    currentModelPolicyClass: args.modelPolicyClass,
  });
  if (stale.stale)
    return { resultId: data.id, payload: data.payload, meta: data.meta, staleReason: stale.reason };
  return { resultId: data.id, payload: data.payload, meta: data.meta, staleReason: null };
}

/** Atomic per-user/per-capability daily rate-limit check. */
export async function incrementRate(
  supabase: UserClient,
  capability: BusinessConnectAICapability,
  override?: number,
): Promise<{ allowed: boolean; currentCount: number; dailyLimit: number }> {
  const limit = override ?? DEFAULT_DAILY_RATE_LIMITS[capability];
  const { data, error } = await supabase.rpc("bcai_increment_rate", {
    p_capability: capability,
    p_daily_limit: limit,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: (row as { allowed: boolean }).allowed,
    currentCount: (row as { current_count: number }).current_count,
    dailyLimit: (row as { daily_limit: number }).daily_limit,
  };
}

/** Owner-scoped accept — idempotent, non-mutating on domain data. */
export async function acceptResult(supabase: UserClient, resultId: string): Promise<void> {
  const { error } = await supabase.rpc("bcai_accept_result", { p_result_id: resultId });
  if (error) throw error;
}
export async function rejectResult(
  supabase: UserClient,
  resultId: string,
  reason: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("bcai_reject_result", {
    p_result_id: resultId,
    p_reason: reason,
  } as never);
  if (error) throw error;
}

/** Read a single result owned by the caller (RLS enforces owner_id = auth.uid()). */
export async function getOwnedResult(supabase: UserClient, resultId: string) {
  const { data, error } = await supabase
    .from("business_connect_ai_results")
    .select(
      "id, request_id, capability, status, payload, meta, context_hash, prompt_version, policy_version, model_policy_class, expires_at, created_at, accepted_at, rejected_at",
    )
    .eq("id", resultId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Record a tool invocation (Turn B2 will drive this from the tool loop). */
export async function recordToolInvocation(
  supabase: UserClient,
  args: {
    requestId: string;
    toolName: string;
    iteration: number;
    status: "ok" | "failed" | "skipped" | "denied";
    inputSummary: Record<string, unknown>;
    outputSummary: Record<string, unknown>;
    latencyMs: number | null;
    errorCode: string | null;
  },
) {
  const { error } = await supabase.rpc("bcai_record_tool_invocation", {
    p_request_id: args.requestId,
    p_tool_name: args.toolName,
    p_iteration: args.iteration,
    p_status: args.status,
    p_input_summary: args.inputSummary,
    p_output_summary: args.outputSummary,
    p_latency_ms: args.latencyMs,
    p_error_code: args.errorCode,
  } as never);
  if (error) throw error;
}
