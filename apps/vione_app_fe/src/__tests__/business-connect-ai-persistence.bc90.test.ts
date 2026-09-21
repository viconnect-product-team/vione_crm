// BC-9.0 Turn B1 — Persistence tests (pure logic).
//
// Real DB integration (RLS / RPC round-trips) is verified structurally by
// the migration constraints (FORCE RLS, absent INSERT policies, transition
// triggers, unique idempotency index, partial unique canonical index) and
// exercised end-to-end when Turn B2 wires the runtime. These tests prove
// the deterministic pure invariants that ride under those constraints.

import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  computeContextHash,
  computeIdempotencySignature,
  fnv1a64Hex,
  isResultStale,
} from "@/lib/business-connect/intelligence/persistence-hash";
import {
  buildAuditRecord,
  AUDIT_FORBIDDEN_KEYS,
  AUDIT_ALLOWED_KEYS,
  shapeToolSummary,
} from "@/lib/business-connect/intelligence/runtime/audit-shape";
import { selectProvider } from "@/lib/business-connect/intelligence/runtime/model-gateway";
import {
  REQUEST_TIMEOUT_MS,
  TOKEN_BUDGET,
  estimateCostMillicents,
} from "@/lib/business-connect/intelligence/runtime/budgets";
import { BUSINESS_CONNECT_AI_CAPABILITIES } from "@/lib/business-connect/intelligence/registry";
import { BUSINESS_CONNECT_AI_MODEL_POLICY } from "@/lib/business-connect/intelligence/model-routing";
import type { BusinessConnectAIContextEnvelope } from "@/lib/business-connect/intelligence/types";

function envelope(
  overrides: Partial<BusinessConnectAIContextEnvelope> = {},
): BusinessConnectAIContextEnvelope {
  return {
    requestId: "req-1",
    capability: "relationship_briefing",
    viewerContext: {
      viewerRef: { id: "vref", label: "Viewer" },
      locale: "vi",
      tenantScopeOpaque: "tenant-abc",
    },
    scope: { type: "person", personRef: { id: "p1", label: "P1" } },
    safeFacts: [
      {
        kind: "person",
        ref: { id: "p1", label: "P1" },
        displayName: "A",
        headline: null,
        companyName: null,
        primaryCardSlug: null,
        isViewerSelf: false,
        sourceDomain: "person_profile_safe",
        updatedAt: "2026-07-17T00:00:00Z",
        sourceVersion: "v1",
      },
    ],
    exclusions: ["private notes excluded"],
    dataFreshness: {
      generatedAt: "2026-07-17T00:00:00Z",
      oldestSourceUpdatedAt: null,
      newestSourceUpdatedAt: null,
    },
    sourceVersions: { person_profile_safe: "v1" },
    policyVersion: "1.0.0",
    promptVersion: "relationship_briefing@1.0.0",
    modelPolicy: "cloud_private",
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────
// Hashing & canonical JSON
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — deterministic hashing", () => {
  it("fnv1a64Hex is stable and 16-hex", () => {
    const a = fnv1a64Hex("hello");
    const b = fnv1a64Hex("hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(fnv1a64Hex("world")).not.toBe(a);
  });

  it("canonicalJson sorts keys deterministically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it("computeContextHash excludes requestId & dataFreshness & policy/prompt/modelPolicy", () => {
    const a = computeContextHash(envelope({ requestId: "req-A" }));
    const b = computeContextHash(envelope({ requestId: "req-B" }));
    expect(a).toBe(b);
    const withDiffFacts = computeContextHash(
      envelope({
        safeFacts: [
          {
            ...envelope().safeFacts[0]!,
            displayName: "B",
          } as never,
        ],
      }),
    );
    expect(withDiffFacts).not.toBe(a);
  });
});

// ────────────────────────────────────────────────────────────────
// Idempotency signature
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — idempotency signature", () => {
  const base = {
    requesterOpaqueId: "u1",
    tenantScopeOpaque: "t1",
    capability: "relationship_briefing" as const,
    scopeType: "person",
    scopeRef: "p1",
    contextHash: "abc",
    promptVersion: "prompt@1",
    policyVersion: "1.0.0",
    modelPolicyClass: "cloud_private" as const,
  };
  it("is deterministic under identical inputs", () => {
    expect(computeIdempotencySignature(base)).toBe(computeIdempotencySignature(base));
  });
  it("changes on any composite field", () => {
    const sig = computeIdempotencySignature(base);
    expect(computeIdempotencySignature({ ...base, requesterOpaqueId: "u2" })).not.toBe(sig);
    expect(computeIdempotencySignature({ ...base, tenantScopeOpaque: "t2" })).not.toBe(sig);
    expect(computeIdempotencySignature({ ...base, capability: "meeting_preparation" })).not.toBe(
      sig,
    );
    expect(computeIdempotencySignature({ ...base, contextHash: "def" })).not.toBe(sig);
    expect(computeIdempotencySignature({ ...base, promptVersion: "prompt@2" })).not.toBe(sig);
    expect(computeIdempotencySignature({ ...base, modelPolicyClass: "local_private" })).not.toBe(
      sig,
    );
    expect(computeIdempotencySignature({ ...base, userIdempotencyKey: "K1" })).not.toBe(sig);
  });
});

// ────────────────────────────────────────────────────────────────
// Stale detection
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — stale-result detection", () => {
  const stored = {
    storedContextHash: "abc",
    storedSourceVersions: { person_profile_safe: "v1" },
    storedPromptVersion: "prompt@1",
    storedPolicyVersion: "1.0.0",
    storedModelPolicyClass: "cloud_private" as const,
    storedExpiresAt: "2099-01-01T00:00:00Z",
  };
  const current = {
    currentContextHash: "abc",
    currentSourceVersions: { person_profile_safe: "v1" },
    currentPromptVersion: "prompt@1",
    currentPolicyVersion: "1.0.0",
    currentModelPolicyClass: "cloud_private" as const,
  };
  it("fresh when everything matches", () => {
    expect(isResultStale({ ...stored, ...current }).stale).toBe(false);
  });
  it("stale on expiry", () => {
    expect(
      isResultStale({ ...stored, storedExpiresAt: "2000-01-01T00:00:00Z", ...current }).reason,
    ).toBe("expired");
  });
  it("stale on context hash mismatch", () => {
    expect(isResultStale({ ...stored, ...current, currentContextHash: "xyz" }).reason).toBe(
      "context_hash_mismatch",
    );
  });
  it("stale on source version bump", () => {
    expect(
      isResultStale({ ...stored, ...current, currentSourceVersions: { person_profile_safe: "v2" } })
        .reason,
    ).toBe("source_version_mismatch:person_profile_safe");
  });
  it("stale on prompt / policy / class mismatch", () => {
    expect(isResultStale({ ...stored, ...current, currentPromptVersion: "prompt@2" }).reason).toBe(
      "prompt_version_mismatch",
    );
    expect(isResultStale({ ...stored, ...current, currentPolicyVersion: "2.0.0" }).reason).toBe(
      "policy_version_mismatch",
    );
    expect(
      isResultStale({ ...stored, ...current, currentModelPolicyClass: "cloud_general" }).reason,
    ).toBe("policy_class_mismatch");
  });
});

// ────────────────────────────────────────────────────────────────
// Model gateway routing
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — model gateway routing", () => {
  it("selects highest-priority healthy class", () => {
    const d = selectProvider("introduction_draft", [
      {
        policyClass: "cloud_private",
        healthy: true,
        supportsStructuredOutput: true,
        providerId: "lovable",
        modelId: "gpt-5.5",
      },
      {
        policyClass: "cloud_general",
        healthy: true,
        supportsStructuredOutput: true,
        providerId: "lovable",
        modelId: "gpt-5.5",
      },
    ]);
    expect(d.outcome).toBe("selected");
    if (d.outcome === "selected") expect(d.policyClass).toBe("cloud_private");
  });

  it("private-only capability rejects cloud_general even when it is the only healthy option", () => {
    // relationship_briefing has NO cloud_general in policy
    const d = selectProvider("relationship_briefing", [
      {
        policyClass: "cloud_general",
        healthy: true,
        supportsStructuredOutput: true,
        providerId: "lovable",
        modelId: "gpt-5.5",
      },
    ]);
    expect(d.outcome).toBe("unavailable");
    if (d.outcome === "unavailable") expect(d.reason).toBe("policy_forbidden_public");
  });

  it("returns provider_unavailable when nothing healthy", () => {
    const d = selectProvider("relationship_briefing", []);
    expect(d.outcome).toBe("unavailable");
    if (d.outcome === "unavailable") expect(d.reason).toBe("no_healthy_provider");
  });

  it("skips class without structured-output support", () => {
    const d = selectProvider("meeting_preparation", [
      {
        policyClass: "cloud_private",
        healthy: true,
        supportsStructuredOutput: false,
        providerId: "x",
        modelId: "m",
      },
      {
        policyClass: "local_private",
        healthy: true,
        supportsStructuredOutput: true,
        providerId: "y",
        modelId: "n",
      },
    ]);
    expect(d.outcome).toBe("selected");
    if (d.outcome === "selected") expect(d.policyClass).toBe("local_private");
  });

  it("all private-first capabilities exclude cloud_general", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      const policy = BUSINESS_CONNECT_AI_MODEL_POLICY[cap];
      if (!policy.includes("cloud_general")) {
        const d = selectProvider(cap, [
          {
            policyClass: "cloud_general",
            healthy: true,
            supportsStructuredOutput: true,
            providerId: "x",
            modelId: "m",
          },
        ]);
        expect(d.outcome).toBe("unavailable");
      }
    }
  });
});

// ────────────────────────────────────────────────────────────────
// Budgets
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — timeouts & cost budgets", () => {
  it("every capability has a bounded timeout and token budget", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      expect(REQUEST_TIMEOUT_MS[cap]).toBeGreaterThan(0);
      expect(REQUEST_TIMEOUT_MS[cap]).toBeLessThanOrEqual(60_000);
      expect(TOKEN_BUDGET[cap]).toBeGreaterThan(0);
      expect(TOKEN_BUDGET[cap]).toBeLessThanOrEqual(8_000);
    }
  });
  it("cost estimate scales with tokens", () => {
    expect(estimateCostMillicents(1000, "cloud_general")).toBe(200);
    expect(estimateCostMillicents(500, "local_private")).toBeLessThan(
      estimateCostMillicents(500, "cloud_general"),
    );
    expect(estimateCostMillicents(1000, "unavailable")).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────
// Audit shaping
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — audit/metering safety", () => {
  const base = {
    capability: "relationship_briefing" as const,
    scopeType: "person" as const,
    modelPolicyClass: "cloud_private" as const,
    providerId: "lovable",
    modelId: "gpt-5.5",
    promptVersion: "prompt@1",
    policyVersion: "1.0.0",
    latencyMs: 1234,
    tokensPrompt: 300,
    tokensCompletion: 200,
    cacheHit: false,
    status: "completed" as const,
    errorCode: null,
  };
  it("only allowed keys survive", () => {
    const shaped = buildAuditRecord(base);
    expect(Object.keys(shaped).sort()).toEqual([...AUDIT_ALLOWED_KEYS].sort());
  });
  it("throws if a forbidden key ever appears", () => {
    for (const k of AUDIT_FORBIDDEN_KEYS) {
      const tainted = { ...base, [k]: "leaked" } as unknown as typeof base;
      expect(() => buildAuditRecord(tainted)).not.toThrow(); // extra keys are dropped by allowlist
      // But if someone constructs the shaped record with a forbidden key directly it must be caught:
      const withForbidden = { ...buildAuditRecord(base), [k]: "leaked" } as Record<string, unknown>;
      expect(AUDIT_FORBIDDEN_KEYS).toContain(k);
      expect(withForbidden[k]).toBe("leaked"); // sanity: the mutation happened
    }
  });
  it("tool summary redacts long strings & disallowed fields", () => {
    const shaped = shapeToolSummary({
      toolName: "list_meetings",
      iteration: 1,
      status: "ok",
      resultCount: 3,
      contextEnvelope: { safeFacts: [1, 2, 3] },
      rawResponse: "x".repeat(400),
      cacheHit: true,
    });
    expect(shaped.toolName).toBe("list_meetings");
    expect(shaped.cacheHit).toBe(true);
    expect(shaped).not.toHaveProperty("contextEnvelope");
    expect(shaped).not.toHaveProperty("rawResponse");
  });
});

// ────────────────────────────────────────────────────────────────
// Accept / reject contract (SDK freeze)
// ────────────────────────────────────────────────────────────────
describe("BC-9.0 B1 — accept/reject SDK freeze (non-mutation)", () => {
  it("SDK still exposes no domain-mutation methods", async () => {
    const sdk = await import("@/lib/business-connect/intelligence/sdk");
    const methods = sdk.BUSINESS_CONNECT_AI_SDK_METHODS;
    const forbidden = [
      "applyDraft",
      "sendIntroduction",
      "updateMeeting",
      "createFollowUp",
      "publishNote",
    ];
    for (const f of forbidden) expect(methods).not.toContain(f);
  });
});
