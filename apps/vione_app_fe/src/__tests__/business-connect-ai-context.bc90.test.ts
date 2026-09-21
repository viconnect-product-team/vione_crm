// BC-9.0 Turn A — Context tests (§88, §93).
// Proves that context builders, redaction and windowing enforce the safe-fact
// invariants: no private notes, no raw IDs, capability-bounded windows, honest
// omission surfacing, and freshness metadata.

import { describe, expect, it } from "vitest";
import {
  buildMeetingPreparationContext,
  buildNextActionContext,
  buildRelationshipBriefingContext,
} from "@/lib/business-connect/intelligence/context-builders";
import { redactBusinessConnectAIContext } from "@/lib/business-connect/intelligence/redaction";
import type {
  BusinessConnectAIContextEnvelope,
  BusinessConnectSafeFact,
  ViewerContext,
} from "@/lib/business-connect/intelligence/types";

const viewer: ViewerContext = {
  viewerRef: { id: "viewer-opaque", label: "You" },
  locale: "vi",
  tenantScopeOpaque: "t-opaque",
};

function relFact(daysAgo: number, i: number): BusinessConnectSafeFact {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    kind: "relationship",
    ref: { id: `r-${i}`, label: `R${i}` },
    counterpart: { id: `c-${i}`, label: `C${i}` },
    status: "connected",
    strengthTier: "warm",
    savedAt: d,
    firstMetAt: null,
    lastContactAt: d,
    sharedTags: [],
    sourceDomain: "connection_relationship_safe",
    updatedAt: d,
  };
}

function workFact(i: number): BusinessConnectSafeFact {
  return {
    kind: "work_item",
    ref: { id: `w-${i}`, label: `W${i}`, route: "/business-connect" },
    itemKind: "meeting_invitation_response_required",
    category: "meeting",
    priorityTier: "P1",
    headline: `item ${i}`,
    counterpartRef: null,
    dueAt: null,
    sourceDomain: "work_hub_items",
    updatedAt: new Date().toISOString(),
  };
}

describe("context builders bound windows and drop stale facts", () => {
  it("relationship briefing drops relationship facts older than 90 days", () => {
    const facts = [relFact(30, 1), relFact(120, 2), relFact(400, 3)];
    const env = buildRelationshipBriefingContext({
      requestId: "req-1",
      capability: "relationship_briefing",
      viewerContext: viewer,
      scope: { type: "person", personRef: { id: "p1", label: "P1" } },
      candidateFacts: facts,
      modelPolicy: "cloud_private",
    });
    const kept = env.safeFacts.filter((f) => f.kind === "relationship");
    expect(kept).toHaveLength(1);
    expect(env.exclusions.length).toBeGreaterThan(0);
  });

  it("caps work_item facts at 30 (§12) and reports omission", () => {
    const facts = Array.from({ length: 40 }, (_, i) => workFact(i));
    const env = buildNextActionContext({
      requestId: "req-2",
      capability: "next_action_suggestion",
      viewerContext: viewer,
      scope: { type: "work_hub" },
      candidateFacts: facts,
      modelPolicy: "cloud_private",
    });
    const kept = env.safeFacts.filter((f) => f.kind === "work_item");
    expect(kept.length).toBe(30);
    expect(env.exclusions.some((e) => /work_item/.test(e))).toBe(true);
  });

  it("drops facts whose source is not allowed for the capability", () => {
    const disallowed: BusinessConnectSafeFact = {
      kind: "work_item",
      ref: { id: "x", label: "X" },
      itemKind: "meeting",
      category: "meeting",
      priorityTier: "P2",
      headline: "x",
      counterpartRef: null,
      dueAt: null,
      // work_item facts require sourceDomain = work_hub_items;
      // work_hub_items is NOT in relationship_briefing's allowlist.
      sourceDomain: "work_hub_items",
      updatedAt: new Date().toISOString(),
    };
    const env = buildRelationshipBriefingContext({
      requestId: "req-3",
      capability: "relationship_briefing",
      viewerContext: viewer,
      scope: { type: "person", personRef: { id: "p1", label: "P1" } },
      candidateFacts: [disallowed],
      modelPolicy: "cloud_private",
    });
    expect(env.safeFacts).toHaveLength(0);
    expect(env.exclusions.some((e) => /allowlist/.test(e))).toBe(true);
  });
});

describe("context envelope carries freshness & policy metadata", () => {
  it("records generatedAt, promptVersion, policyVersion, modelPolicy", () => {
    const env = buildRelationshipBriefingContext({
      requestId: "req-4",
      capability: "relationship_briefing",
      viewerContext: viewer,
      scope: { type: "person", personRef: { id: "p1", label: "P1" } },
      candidateFacts: [relFact(1, 1)],
      modelPolicy: "cloud_private",
    });
    expect(env.dataFreshness.generatedAt).toBeTruthy();
    expect(env.promptVersion).toBe("1.0.0");
    expect(env.policyVersion).toBe("1.0.0");
    expect(env.modelPolicy).toBe("cloud_private");
  });

  it("meeting_preparation exclusions always list private notes", () => {
    const env = buildMeetingPreparationContext({
      requestId: "req-5",
      capability: "meeting_preparation",
      viewerContext: viewer,
      scope: { type: "meeting", meetingRef: { id: "m1", label: "M1" } },
      candidateFacts: [],
      modelPolicy: "cloud_private",
    });
    expect(env.exclusions).toContain("private meeting notes");
  });
});

describe("redaction hard-fails on forbidden fields (§14, §93)", () => {
  it("rejects a fact carrying auth_uid / email / private_note fields", () => {
    const poisoned: BusinessConnectSafeFact = {
      kind: "person",
      ref: { id: "p1", label: "P1" },
      displayName: "X",
      headline: null,
      companyName: null,
      primaryCardSlug: null,
      isViewerSelf: false,
      sourceDomain: "person_profile_safe",
      updatedAt: new Date().toISOString(),
      // Poisoned field — must be rejected.
      // @ts-expect-error deliberately unsafe
      email: "leak@example.com",
    };
    const envelope: BusinessConnectAIContextEnvelope = {
      requestId: "req-6",
      capability: "relationship_briefing",
      viewerContext: viewer,
      scope: { type: "person", personRef: { id: "p1", label: "P1" } },
      safeFacts: [poisoned],
      exclusions: [],
      dataFreshness: {
        generatedAt: new Date().toISOString(),
        oldestSourceUpdatedAt: null,
        newestSourceUpdatedAt: null,
      },
      sourceVersions: {},
      policyVersion: "1.0.0",
      promptVersion: "1.0.0",
      modelPolicy: "cloud_private",
    };
    expect(() => redactBusinessConnectAIContext(envelope)).toThrow(/forbidden field/);
  });

  it("rejects a fact whose source domain is not in the safe allowlist", () => {
    const bad: BusinessConnectSafeFact = {
      kind: "person",
      ref: { id: "p1", label: "P1" },
      displayName: "X",
      headline: null,
      companyName: null,
      primaryCardSlug: null,
      isViewerSelf: false,
      // @ts-expect-error test-only
      sourceDomain: "private_meeting_notes",
      updatedAt: new Date().toISOString(),
    };
    const envelope: BusinessConnectAIContextEnvelope = {
      requestId: "req-7",
      capability: "relationship_briefing",
      viewerContext: viewer,
      scope: { type: "person", personRef: { id: "p1", label: "P1" } },
      safeFacts: [bad],
      exclusions: [],
      dataFreshness: {
        generatedAt: new Date().toISOString(),
        oldestSourceUpdatedAt: null,
        newestSourceUpdatedAt: null,
      },
      sourceVersions: {},
      policyVersion: "1.0.0",
      promptVersion: "1.0.0",
      modelPolicy: "cloud_private",
    };
    expect(() => redactBusinessConnectAIContext(envelope)).toThrow(/allowlist/);
  });
});

describe("no code path indexes business_meeting_private_notes for AI", () => {
  it("intelligence module tree contains no reference to private notes table", async () => {
    // Static import-graph guard: read all intelligence source files & assert.
    const modules = import.meta.glob("/src/lib/business-connect/intelligence/**/*.ts", {
      as: "raw",
      eager: true,
    });
    for (const [path, src] of Object.entries(modules)) {
      expect(
        (src as string).includes("business_meeting_private_notes"),
        `forbidden reference in ${path}`,
      ).toBe(false);
    }
  });
});
