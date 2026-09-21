// BC-9.1 Turn A — Relationship Memory policy invariants.
// Pure unit tests: registries are frozen, canonical keys are stable,
// confidence math is monotonic and bounded, lifecycle transitions are legal,
// merge preserves history and escalates sensitivity, and intelligence
// visibility never surfaces candidates or terminal memories.

import { describe, expect, it } from "vitest";
import {
  RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS,
  RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS,
  RELATIONSHIP_MEMORY_FEEDBACK_KINDS,
  RELATIONSHIP_MEMORY_KINDS,
  RELATIONSHIP_MEMORY_KIND_DEFAULT_SENSITIVITY,
  RELATIONSHIP_MEMORY_LINK_KINDS,
  RELATIONSHIP_MEMORY_STATUSES,
  RELATIONSHIP_MEMORY_SUBJECT_TYPES,
  RELATIONSHIP_MEMORY_TERMINAL_STATUSES,
  RELATIONSHIP_MEMORY_VERSION,
} from "@/lib/business-connect/relationship-memory/registry";
import {
  RELATIONSHIP_MEMORY_SDK_METHODS,
  RelationshipMemorySDK,
} from "@/lib/business-connect/relationship-memory/sdk";
import {
  assertTransition,
  bumpConfidenceOnCorroboration,
  canTransition,
  canonicalKey,
  clampConfidence,
  decayConfidenceOnContradiction,
  detectShallowConflict,
  isMemoryVisibleToIntelligence,
  maxSensitivity,
  mergeMemories,
} from "@/lib/business-connect/relationship-memory/memory-policy";
import type { RelationshipMemoryDTO } from "@/lib/business-connect/relationship-memory/types";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";

const makeMemory = (over: Partial<RelationshipMemoryDTO> = {}): RelationshipMemoryDTO => ({
  id: "m1",
  ownerUserId: "u1",
  subject: { type: "person", ref: "person:1" },
  kind: "preference",
  canonicalKey: "preference:coffee",
  canonicalValue: { drink: "coffee" },
  confidence: 0.5,
  sourceCount: 1,
  status: "active",
  sensitivity: "standard",
  firstObservedAt: "2026-01-01T00:00:00Z",
  lastObservedAt: "2026-01-01T00:00:00Z",
  lastReviewedAt: null,
  registryVersion: RELATIONSHIP_MEMORY_VERSION,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("BC-9.1 Turn A — registry invariants", () => {
  it("freezes every registry array", () => {
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_KIND_DEFAULT_SENSITIVITY)).toBe(true);
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_TERMINAL_STATUSES)).toBe(true);
  });

  it("has non-empty stable sets", () => {
    expect(RELATIONSHIP_MEMORY_KINDS.length).toBeGreaterThan(0);
    expect(RELATIONSHIP_MEMORY_STATUSES).toContain("active");
    expect(RELATIONSHIP_MEMORY_SUBJECT_TYPES).toContain("person");
    expect(RELATIONSHIP_MEMORY_LINK_KINDS).toContain("supersedes");
    expect(RELATIONSHIP_MEMORY_FEEDBACK_KINDS).toContain("request_forget");
  });

  it("allowlist and excluded-list do not overlap", () => {
    const allowed = new Set<string>(RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS);
    for (const ex of RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS) {
      expect(allowed.has(ex)).toBe(false);
    }
  });

  it("assigns a default sensitivity to every memory kind", () => {
    for (const k of RELATIONSHIP_MEMORY_KINDS) {
      expect(RELATIONSHIP_MEMORY_KIND_DEFAULT_SENSITIVITY[k]).toBeDefined();
    }
  });

  it("SDK method list is frozen and covers the public surface", () => {
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_SDK_METHODS)).toBe(true);
    for (const m of RELATIONSHIP_MEMORY_SDK_METHODS) {
      expect(typeof (RelationshipMemorySDK as unknown as Record<string, unknown>)[m]).toBe(
        "function",
      );
    }
  });
});

describe("BC-9.1 Turn A — canonical keys & confidence math", () => {
  it("canonicalKey is deterministic and normalizes whitespace/case/punctuation", () => {
    expect(canonicalKey("preference", "  Loves   Espresso!! ")).toBe("preference:loves espresso");
    expect(canonicalKey("preference", "loves espresso")).toBe(
      canonicalKey("preference", "Loves Espresso"),
    );
  });

  it("clampConfidence bounds into [0,1] and 3-decimal precision", () => {
    expect(clampConfidence(-0.5)).toBe(0);
    expect(clampConfidence(1.5)).toBe(1);
    expect(clampConfidence(0.1234)).toBe(0.123);
    expect(clampConfidence(Number.NaN)).toBe(0);
  });

  it("corroboration is monotonic non-decreasing and bounded by 1", () => {
    let c = 0;
    for (let i = 0; i < 20; i++) {
      const next = bumpConfidenceOnCorroboration(c, 1);
      expect(next).toBeGreaterThanOrEqual(c);
      expect(next).toBeLessThanOrEqual(1);
      c = next;
    }
    expect(c).toBeGreaterThan(0.99);
  });

  it("contradiction decays confidence toward 0 and never below 0", () => {
    let c = 0.9;
    for (let i = 0; i < 30; i++) c = decayConfidenceOnContradiction(c, 1);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThan(0.05);
  });
});

describe("BC-9.1 Turn A — lifecycle transitions", () => {
  it("allows legal transitions", () => {
    expect(canTransition("candidate", "active")).toBe(true);
    expect(canTransition("active", "superseded")).toBe(true);
    expect(canTransition("active", "dismissed")).toBe(true);
  });

  it("rejects illegal transitions and terminal-status moves", () => {
    expect(() => assertTransition("dismissed", "active")).toThrow(RelationshipMemoryError);
    expect(() => assertTransition("expired", "active")).toThrow(RelationshipMemoryError);
    expect(() => assertTransition("candidate", "superseded")).toThrow(RelationshipMemoryError);
  });
});

describe("BC-9.1 Turn A — merge & sensitivity escalation", () => {
  it("merges preserving oldest first-observed and newest last-observed", () => {
    const a = makeMemory({
      confidence: 0.6,
      firstObservedAt: "2026-01-01T00:00:00Z",
      lastObservedAt: "2026-02-01T00:00:00Z",
      sensitivity: "standard",
    });
    const b = makeMemory({
      id: "m2",
      confidence: 0.4,
      firstObservedAt: "2025-12-01T00:00:00Z",
      lastObservedAt: "2026-03-01T00:00:00Z",
      sensitivity: "sensitive",
    });
    const merged = mergeMemories(a, b);
    expect(merged.firstObservedAt).toBe("2025-12-01T00:00:00Z");
    expect(merged.lastObservedAt).toBe("2026-03-01T00:00:00Z");
    expect(merged.sourceCount).toBe(2);
    expect(merged.confidence).toBeGreaterThanOrEqual(0.6);
    // Sensitivity escalates, never lowers.
    expect(merged.sensitivity).toBe("sensitive");
  });

  it("throws when merging incompatible memories", () => {
    const a = makeMemory({ canonicalKey: "preference:coffee" });
    const b = makeMemory({ canonicalKey: "preference:tea" });
    expect(() => mergeMemories(a, b)).toThrow(RelationshipMemoryError);
  });

  it("maxSensitivity picks the highest tier", () => {
    expect(maxSensitivity("public_ok", "restricted")).toBe("restricted");
    expect(maxSensitivity("sensitive", "standard")).toBe("sensitive");
  });
});

describe("BC-9.1 Turn A — intelligence visibility gate", () => {
  it("hides candidates and terminal statuses from intelligence", () => {
    expect(isMemoryVisibleToIntelligence({ status: "candidate", sensitivity: "standard" })).toBe(
      false,
    );
    expect(isMemoryVisibleToIntelligence({ status: "dismissed", sensitivity: "standard" })).toBe(
      false,
    );
  });

  it("gates by sensitivity tier", () => {
    const m = { status: "active" as const, sensitivity: "sensitive" as const };
    expect(isMemoryVisibleToIntelligence(m, "standard")).toBe(false);
    expect(isMemoryVisibleToIntelligence(m, "sensitive")).toBe(true);
    expect(isMemoryVisibleToIntelligence(m, "restricted")).toBe(true);
  });

  it("detects shallow value conflicts", () => {
    expect(detectShallowConflict({ drink: "coffee" }, { drink: "tea" })).toBe(true);
    expect(detectShallowConflict({ drink: "coffee" }, { drink: "coffee" })).toBe(false);
    expect(detectShallowConflict({ drink: "coffee" }, { food: "cake" })).toBe(false);
  });
});
