// BC-9.0 Turn B1 — Deterministic hashing + idempotency signature derivation.
//
// Client-safe (no Node deps). Used by both browser SDK stubs and server
// runtime so hashes computed either side agree byte-for-byte.
//
// Hash: FNV-1a 64-bit rendered as 16 hex chars, matching the algorithm used
// in BC-6.0 introduction pathing. Not cryptographic — this is a
// dedupe/lookup key, not an authenticator.

import type { BusinessConnectAICapability } from "./registry";
import type { BusinessConnectAIContextEnvelope, ModelPolicyClass } from "./types";

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK64 = 0xffffffffffffffffn;

/** FNV-1a 64-bit. Stable across browser & server (BigInt maths). */
export function fnv1a64Hex(input: string): string {
  let h = FNV_OFFSET;
  for (let i = 0; i < input.length; i += 1) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * FNV_PRIME) & MASK64;
  }
  return h.toString(16).padStart(16, "0");
}

/**
 * Fields excluded from the context hash — they either identify the request
 * (requestId) or carry non-source metadata that would break dedupe.
 */
const ENVELOPE_HASH_EXCLUDED = new Set<string>([
  "requestId",
  "dataFreshness",
  // policyVersion + promptVersion + modelPolicy are folded into the
  // idempotency signature separately.
  "policyVersion",
  "promptVersion",
  "modelPolicy",
  // human-readable "exclusions" list is descriptive; content is derived
  // from source domains already reflected in safeFacts.
  "exclusions",
]);

/**
 * Canonical JSON with sorted keys. Deterministic across engines. Excludes
 * hidden/internal fields listed above so context hash is stable across
 * transient metadata (e.g. requestId).
 */
export function canonicalJson(value: unknown, excludeTopLevel = false): string {
  const seen = new WeakSet<object>();
  const walk = (v: unknown, depth: number): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v as object)) throw new Error("BC-9.0 canonical json cycle");
    seen.add(v as object);
    if (Array.isArray(v)) return v.map((x: any) => walk(x, depth + 1));
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => !(depth === 0 && excludeTopLevel && ENVELOPE_HASH_EXCLUDED.has(k)))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return entries.reduce<Record<string, unknown>>((acc, [k, val]) => {
      acc[k] = walk(val, depth + 1);
      return acc;
    }, {});
  };
  return JSON.stringify(walk(value, 0));
}

/**
 * Context hash computed from the FINAL redacted context envelope. Excludes
 * request identity/metadata so identical (viewer, scope, safe facts) inputs
 * produce identical hashes.
 *
 * Any change in a source's `updatedAt` or `sourceVersion` flows through
 * `safeFacts[*]` and changes the hash — this is how stale-result detection
 * works.
 */
export function computeContextHash(envelope: BusinessConnectAIContextEnvelope): string {
  const payload = canonicalJson(envelope, true);
  return fnv1a64Hex(payload);
}

/**
 * Idempotency signature: deterministic dedupe key for the AI request layer.
 * Duplicate/concurrent submissions with the same signature converge on the
 * same canonical row (unique index on requests.idempotency_signature).
 */
export function computeIdempotencySignature(input: {
  requesterOpaqueId: string;
  tenantScopeOpaque: string;
  capability: BusinessConnectAICapability;
  scopeType: string;
  scopeRef: string | null;
  contextHash: string;
  promptVersion: string;
  policyVersion: string;
  modelPolicyClass: ModelPolicyClass;
  userIdempotencyKey?: string | null;
}): string {
  const payload = canonicalJson({
    r: input.requesterOpaqueId,
    t: input.tenantScopeOpaque,
    c: input.capability,
    st: input.scopeType,
    sr: input.scopeRef ?? "",
    ch: input.contextHash,
    pv: input.promptVersion,
    plv: input.policyVersion,
    mp: input.modelPolicyClass,
    uik: input.userIdempotencyKey ?? "",
  });
  return `bcai:${fnv1a64Hex(payload)}`;
}

/**
 * Given two envelopes, tests whether the second is STALE relative to the
 * first. Stale = a source appears in newer with a different updatedAt OR a
 * source version bumped OR the policy/prompt class differs.
 */
export function isResultStale(input: {
  storedContextHash: string;
  storedSourceVersions: Record<string, string>;
  storedPromptVersion: string;
  storedPolicyVersion: string;
  storedModelPolicyClass: ModelPolicyClass;
  storedExpiresAt: string;
  currentContextHash: string;
  currentSourceVersions: Record<string, string>;
  currentPromptVersion: string;
  currentPolicyVersion: string;
  currentModelPolicyClass: ModelPolicyClass;
  nowIso?: string;
}): { stale: boolean; reason: string | null } {
  const now = new Date(input.nowIso ?? new Date().toISOString());
  if (new Date(input.storedExpiresAt) <= now) return { stale: true, reason: "expired" };
  if (input.storedContextHash !== input.currentContextHash)
    return { stale: true, reason: "context_hash_mismatch" };
  if (input.storedPromptVersion !== input.currentPromptVersion)
    return { stale: true, reason: "prompt_version_mismatch" };
  if (input.storedPolicyVersion !== input.currentPolicyVersion)
    return { stale: true, reason: "policy_version_mismatch" };
  if (input.storedModelPolicyClass !== input.currentModelPolicyClass)
    return { stale: true, reason: "policy_class_mismatch" };
  for (const [k, v] of Object.entries(input.currentSourceVersions)) {
    const stored = input.storedSourceVersions[k];
    if (stored !== undefined && stored !== v) {
      return { stale: true, reason: `source_version_mismatch:${k}` };
    }
  }
  return { stale: false, reason: null };
}
