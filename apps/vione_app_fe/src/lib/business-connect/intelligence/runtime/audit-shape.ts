// BC-9.0 Turn B1 — Safe audit/metering record shaping.
//
// Client-safe pure module (kept as a plain .ts so tests can import without
// server-only globals). Persistence layer calls `buildAuditRecord` before
// writing to the requests / tool_invocations tables and asserts the result
// contains no forbidden fields.

import type { BusinessConnectAICapability } from "../registry";
import type { BusinessConnectAISessionScope } from "../registry";
import type { ModelPolicyClass } from "../types";

export type BusinessConnectAIAuditRecord = {
  capability: BusinessConnectAICapability;
  scopeType: BusinessConnectAISessionScope;
  modelPolicyClass: ModelPolicyClass;
  providerId: string | null;
  modelId: string | null;
  promptVersion: string;
  policyVersion: string;
  latencyMs: number | null;
  tokensPrompt: number | null;
  tokensCompletion: number | null;
  cacheHit: boolean;
  status: "completed" | "failed" | "cancelled" | "expired" | "running" | "pending";
  errorCode: string | null;
};

/** Field allowlist enforced at runtime (§59 audit safety). */
export const AUDIT_ALLOWED_KEYS = Object.freeze<ReadonlyArray<keyof BusinessConnectAIAuditRecord>>([
  "capability",
  "scopeType",
  "modelPolicyClass",
  "providerId",
  "modelId",
  "promptVersion",
  "policyVersion",
  "latencyMs",
  "tokensPrompt",
  "tokensCompletion",
  "cacheHit",
  "status",
  "errorCode",
]);

/**
 * Field denylist. If any of these keys appear in the shaped record we throw
 * — this catches accidental leakage of raw context, private notes, prompts,
 * or auth material into audit rows.
 */
export const AUDIT_FORBIDDEN_KEYS = Object.freeze([
  "prompt",
  "context",
  "contextEnvelope",
  "safeFacts",
  "privateNotes",
  "private_note",
  "rawResponse",
  "raw_context",
  "apiKey",
  "authorization",
  "bearer",
  "secret",
  "password",
  "email",
  "phone",
] as const);

export function buildAuditRecord(
  input: BusinessConnectAIAuditRecord,
): BusinessConnectAIAuditRecord {
  const out: Record<string, unknown> = {};
  for (const k of AUDIT_ALLOWED_KEYS) out[k as string] = input[k];
  for (const forbid of AUDIT_FORBIDDEN_KEYS) {
    if (forbid in out) {
      throw new Error(`BC-9.0 audit forbidden key leaked: ${forbid}`);
    }
  }
  return out as BusinessConnectAIAuditRecord;
}

/**
 * Redact a tool-invocation input/output summary before persisting. Keeps
 * only counts, ref labels, and status flags — never raw text bodies.
 */
export function shapeToolSummary(
  summary: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!summary) return {};
  const out: Record<string, unknown> = {};
  const allow = new Set([
    "toolName",
    "iteration",
    "status",
    "resultCount",
    "factKinds",
    "refCount",
    "cacheHit",
    "errorCode",
    "durationMs",
    "capability",
    "scopeType",
    "reason",
  ]);
  for (const [k, v] of Object.entries(summary)) {
    if (!allow.has(k)) continue;
    if (typeof v === "string" && v.length > 200) continue; // never long strings
    out[k] = v;
  }
  return out;
}
