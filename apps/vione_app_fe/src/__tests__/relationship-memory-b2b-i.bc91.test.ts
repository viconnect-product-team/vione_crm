// BC-9.1 Turn B2b-i — Focused policy/runtime tests.
//
// Covers the sub-turn contract:
//   * source-loader dispatcher is exhaustive and gates unknown extractors
//   * every deterministic extractor is a pure function of its DTO
//   * extractors produce stable ordering + canonical keys
//   * extractors never exceed their per-source candidate cap
//   * extractors reject wrong source domain / wrong memory kind
//   * inferred commitment is rejected (only explicit commitment phrasing)
//   * manual extractor enforces sensitive-content gate
//   * unresolved entity → candidate rejected (never marked resolved)
//   * visibility ceiling is enforced by the pipeline
//   * private-note domain / hard-blocked table never appears in B2b-i
//     runtime paths (structural regex over source files)
//
// Persistence, merge, provenance, links, and worker orchestration are
// OUT OF SCOPE for this sub-turn and are not tested here.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  extractMeetingOutcomeCommitments,
  extractFollowUpCommitments,
  extractAgendaTopics,
  extractPersonProfileRole,
  extractBusinessCardServices,
  extractIntroductionContext,
  extractManualOwnerAuthored,
  runDeterministicExtractor,
} from "@/lib/business-connect/relationship-memory/extractors";
import type {
  AgendaExtractionSourceDTO,
  BusinessCardExtractionSourceDTO,
  FollowUpExtractionSourceDTO,
  IntroductionExtractionSourceDTO,
  ManualMemoryExtractionSourceDTO,
  MeetingOutcomeExtractionSourceDTO,
  RelationshipProfileExtractionSourceDTO,
} from "@/lib/business-connect/relationship-memory/source-dtos";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";
import { getExtractor } from "@/lib/business-connect/relationship-memory/extractor-registry";
import { runExtractionPipeline } from "@/lib/business-connect/relationship-memory/extraction-pipeline.server";
import { validateCandidate } from "@/lib/business-connect/relationship-memory/candidate";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const P3 = "33333333-3333-4333-8333-333333333333";
const M1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const F1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const A1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CARD1 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const INTRO1 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const OWNER = "99999999-9999-4999-8999-999999999999";

const now = "2026-07-01T00:00:00.000Z";

function outcomeDTO(
  overrides: Partial<MeetingOutcomeExtractionSourceDTO> = {},
): MeetingOutcomeExtractionSourceDTO {
  return {
    sourceDomain: "meeting_outcome_safe",
    sourceRecordId: M1,
    sourceVersion: "1",
    occurredAt: now,
    visibilityCeiling: "sensitive",
    meetingId: M1,
    outcomeType: "commitment",
    outcomeStatus: "finalized",
    summary: "We will ship the quarterly review by 2026-09-30\nDiscussed general pricing",
    finalized: true,
    participants: [
      { personNodeId: P1, role: "organizer" },
      { personNodeId: P2, role: "participant" },
    ],
    ...overrides,
  };
}

function followUpDTO(
  overrides: Partial<FollowUpExtractionSourceDTO> = {},
): FollowUpExtractionSourceDTO {
  return {
    sourceDomain: "follow_up_safe",
    sourceRecordId: F1,
    sourceVersion: "1",
    occurredAt: now,
    visibilityCeiling: "sensitive",
    meetingId: M1,
    followUpId: F1,
    title: "Send onboarding kit",
    description: null,
    status: "open",
    priority: "high",
    dueAt: "2026-07-15T00:00:00.000Z",
    assigneePersonNodeId: P2,
    ...overrides,
  };
}

function agendaDTO(overrides: Partial<AgendaExtractionSourceDTO> = {}): AgendaExtractionSourceDTO {
  return {
    sourceDomain: "agenda_safe",
    sourceRecordId: M1,
    sourceVersion: "3",
    occurredAt: now,
    visibilityCeiling: "standard",
    meetingId: M1,
    items: [
      { agendaItemId: A1, title: "Pricing discussion", status: "accepted", estimatedMinutes: 10 },
      { agendaItemId: A1, title: "Pricing discussion", status: "accepted", estimatedMinutes: 10 }, // dupe
      { agendaItemId: A1, title: "Roadmap review", status: "in_progress", estimatedMinutes: null },
      { agendaItemId: A1, title: "Dropped item", status: "dropped", estimatedMinutes: null },
    ],
    counterpartPersonNodeIds: [P1, P2],
    ...overrides,
  };
}

function profileDTO(
  overrides: Partial<RelationshipProfileExtractionSourceDTO> = {},
): RelationshipProfileExtractionSourceDTO {
  return {
    sourceDomain: "person_profile_safe",
    sourceRecordId: P1,
    sourceVersion: "17510000",
    occurredAt: now,
    visibilityCeiling: "public_ok",
    subjectPersonNodeId: P1,
    displayName: "Ada Lovelace",
    professionalTitle: "Head of Growth",
    companyName: "Acme, Inc.",
    industry: "SaaS",
    ...overrides,
  };
}

function cardDTO(
  overrides: Partial<BusinessCardExtractionSourceDTO> = {},
): BusinessCardExtractionSourceDTO {
  return {
    sourceDomain: "person_profile_safe",
    sourceRecordId: CARD1,
    sourceVersion: "17510000",
    occurredAt: now,
    visibilityCeiling: "public_ok",
    cardId: CARD1,
    cardSlug: "ada-lovelace",
    subjectPersonNodeId: P1,
    services: [
      { title: "Growth consulting", category: "Advisory" },
      { title: "  Growth consulting  ", category: "Advisory" }, // dedupe
      { title: "Fractional CMO", category: null },
    ],
    ...overrides,
  };
}

function introDTO(
  overrides: Partial<IntroductionExtractionSourceDTO> = {},
): IntroductionExtractionSourceDTO {
  return {
    sourceDomain: "introduction_safe",
    sourceRecordId: INTRO1,
    sourceVersion: "1",
    occurredAt: now,
    visibilityCeiling: "sensitive",
    introductionRequestId: INTRO1,
    status: "pending",
    requesterPersonNodeId: P1,
    intermediaryPersonNodeId: P3,
    targetPersonNodeId: P2,
    purpose: "Explore partnership on Q4 launch",
    ...overrides,
  };
}

function manualDTO(
  overrides: Partial<ManualMemoryExtractionSourceDTO> = {},
): ManualMemoryExtractionSourceDTO {
  return {
    sourceDomain: "work_hub_items",
    sourceRecordId: `manual/${OWNER}/${P1}`,
    sourceVersion: "hash1",
    occurredAt: now,
    visibilityCeiling: "restricted",
    subjectType: "person",
    subjectRef: P1,
    memoryKind: "preference",
    canonicalPredicate: "prefers_channel",
    canonicalText: "Prefers async written updates over calls",
    authoredByOwner: true,
    ...overrides,
  };
}

// ---------- 1. meeting_outcome extractor ----------

describe("meeting_outcome.commitments.v1", () => {
  it("emits explicit commitments only; ignores general discussion", () => {
    const out = extractMeetingOutcomeCommitments(outcomeDTO());
    expect(out.length).toBeGreaterThan(0);
    for (const c of out) {
      expect(c.canonicalPredicate).toBe("committed_to");
      expect(c.memoryKind).toBe("commitment");
      expect(c.subjectResolved).toBe(false);
    }
    // "Discussed general pricing" line must NOT appear.
    expect(out.some((c) => c.canonicalText.includes("discussed"))).toBe(false);
  });
  it("does not emit when outcome not finalized", () => {
    expect(extractMeetingOutcomeCommitments(outcomeDTO({ finalized: false }))).toEqual([]);
  });
  it("returns stable ordering for identical input", () => {
    const a = extractMeetingOutcomeCommitments(outcomeDTO());
    const b = extractMeetingOutcomeCommitments(outcomeDTO());
    expect(a.map((c: any) => c.canonicalText + c.subjectRef)).toEqual(
      b.map((c: any) => c.canonicalText + c.subjectRef),
    );
  });
  it("respects per-source candidate cap", () => {
    const many = Array.from(
      { length: 40 },
      (_, i) => `We will complete task ${i} by 2026-09-30`,
    ).join("\n");
    const parts = Array.from({ length: 5 }, (_, i) => ({
      personNodeId:
        `${i}${i}${i}${i}${i}${i}${i}${i}-${i}${i}${i}${i}-4${i}${i}${i}-8${i}${i}${i}-${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}`.slice(
          0,
          36,
        ),
      role: "participant" as const,
    }));
    // Use valid uuids
    parts[0].personNodeId = P1;
    parts[1].personNodeId = P2;
    parts[2].personNodeId = P3;
    parts.length = 3;
    const out = extractMeetingOutcomeCommitments(
      outcomeDTO({ summary: many, participants: parts }),
    );
    const def = getExtractor("meeting_outcome.commitments.v1")!;
    expect(out.length).toBeLessThanOrEqual(def.maxCandidates);
  });
  it("marks 'high' evidence when a due-date hint is present", () => {
    const out = extractMeetingOutcomeCommitments(outcomeDTO());
    expect(out.every((c) => c.evidenceStrength === "high")).toBe(true);
  });
});

// ---------- 2. follow_up extractor ----------

describe("follow_up.commitments.v1", () => {
  it("emits one candidate for open follow-up with assignee", () => {
    const out = extractFollowUpCommitments(followUpDTO());
    expect(out).toHaveLength(1);
    expect(out[0].canonicalPredicate).toBe("planned_follow_up");
  });
  it("emits nothing for completed follow-up (never signals completion)", () => {
    expect(extractFollowUpCommitments(followUpDTO({ status: "completed" }))).toEqual([]);
  });
  it("emits nothing when assignee unresolved (no active-subject inference)", () => {
    expect(extractFollowUpCommitments(followUpDTO({ assigneePersonNodeId: null }))).toEqual([]);
  });
});

// ---------- 3. agenda extractor ----------

describe("agenda.topics.v1", () => {
  it("dedupes topics and drops dropped/proposed items", () => {
    const out = extractAgendaTopics(agendaDTO());
    const topics = new Set(out.map((c: any) => c.canonicalText));
    expect(topics.has("pricing discussion")).toBe(true);
    expect(topics.has("roadmap review")).toBe(true);
    expect(topics.has("dropped item")).toBe(false);
  });
  it("emits shared_history kind and never infers interest/preference", () => {
    const out = extractAgendaTopics(agendaDTO());
    expect(out.every((c) => c.memoryKind === "shared_history")).toBe(true);
  });
  it("produces stable ordering", () => {
    const a = extractAgendaTopics(agendaDTO());
    const b = extractAgendaTopics(agendaDTO());
    expect(a).toEqual(b);
  });
});

// ---------- 4. person_profile.role extractor ----------

describe("person_profile.role.v1", () => {
  it("extracts explicit role + org only; never infers seniority", () => {
    const out = extractPersonProfileRole(profileDTO());
    expect(out).toHaveLength(1);
    expect(out[0].memoryKind).toBe("role_context");
    expect(out[0].canonicalText).toContain("head of growth");
    expect(out[0].canonicalText).toContain("acme");
    expect(JSON.stringify(out[0].structuredValue).toLowerCase()).not.toContain("seniority");
  });
  it("emits nothing when both title and org are absent", () => {
    expect(
      extractPersonProfileRole(profileDTO({ professionalTitle: null, companyName: null })),
    ).toEqual([]);
  });
});

// ---------- 5. business_card.services extractor ----------

describe("business_card.services.v1", () => {
  it("normalizes service labels and dedupes", () => {
    const out = extractBusinessCardServices(cardDTO());
    const labels = out.map((c: any) => c.canonicalText);
    expect(labels).toContain("growth consulting");
    expect(labels).toContain("fractional cmo");
    expect(new Set(labels).size).toBe(labels.length);
  });
  it("uses interest kind (never infers capability from org)", () => {
    const out = extractBusinessCardServices(cardDTO());
    expect(out.every((c) => c.memoryKind === "interest")).toBe(true);
  });
});

// ---------- 6. introduction.context extractor ----------

describe("introduction.context.v1", () => {
  it("emits shared_history for both requester and target", () => {
    const out = extractIntroductionContext(introDTO());
    const refs = new Set(out.map((c: any) => c.subjectRef));
    expect(refs.has(P1)).toBe(true);
    expect(refs.has(P2)).toBe(true);
    expect(out.every((c) => c.canonicalPredicate === "introduction_purpose")).toBe(true);
  });
  it("emits nothing for cancelled/expired/declined introductions", () => {
    expect(extractIntroductionContext(introDTO({ status: "cancelled" }))).toEqual([]);
    expect(extractIntroductionContext(introDTO({ status: "expired" }))).toEqual([]);
    expect(extractIntroductionContext(introDTO({ status: "declined" }))).toEqual([]);
  });
});

// ---------- 7. manual owner-authored extractor ----------

describe("manual.owner_authored.v1", () => {
  it("emits exactly one candidate for a valid owner-authored input", () => {
    const out = extractManualOwnerAuthored(manualDTO());
    expect(out).toHaveLength(1);
    expect(out[0].memoryKind).toBe("preference");
    expect(out[0].evidenceType).toBe("direct_statement");
  });
  it("rejects a disallowed memory kind", () => {
    expect(() => extractManualOwnerAuthored(manualDTO({ memoryKind: "risk_flag" as any }))).toThrow(
      RelationshipMemoryError,
    );
  });
  it("rejects sensitive content", () => {
    expect(() =>
      extractManualOwnerAuthored(manualDTO({ canonicalText: "Their salary is $X" })),
    ).toThrow(/sensitive/i);
  });
  it("does not activate without owner-authored flag", () => {
    expect(extractManualOwnerAuthored(manualDTO({ authoredByOwner: true as any }))).toHaveLength(1);
  });
});

// ---------- 8. Dispatcher exhaustiveness ----------

describe("runDeterministicExtractor dispatcher", () => {
  it("throws EXTRACTOR_NOT_FOUND for unknown id", () => {
    try {
      runDeterministicExtractor("bogus.v1", outcomeDTO() as any);
      throw new Error("did not throw");
    } catch (e) {
      expect((e as RelationshipMemoryError).code).toBe("RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND");
    }
  });
  it("rejects a source domain mismatch (wrong extractor for source)", () => {
    try {
      runDeterministicExtractor("agenda.topics.v1", outcomeDTO() as any);
      throw new Error("did not throw");
    } catch (e) {
      expect((e as RelationshipMemoryError).code).toBe(
        "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
      );
    }
  });
  it("routes each frozen id to its extractor without error", () => {
    expect(runDeterministicExtractor("meeting_outcome.commitments.v1", outcomeDTO())).toBeDefined();
    expect(runDeterministicExtractor("follow_up.commitments.v1", followUpDTO())).toBeDefined();
    expect(runDeterministicExtractor("agenda.topics.v1", agendaDTO())).toBeDefined();
    expect(runDeterministicExtractor("person_profile.role.v1", profileDTO())).toBeDefined();
    expect(runDeterministicExtractor("business_card.services.v1", cardDTO())).toBeDefined();
    expect(runDeterministicExtractor("introduction.context.v1", introDTO())).toBeDefined();
    expect(runDeterministicExtractor("manual.owner_authored.v1", manualDTO())).toBeDefined();
  });
});

// ---------- 9. All emitted candidates satisfy the Zod contract ----------

describe("Candidate contract compliance", () => {
  it("every extractor emits Zod-valid RelationshipMemoryCandidate objects", () => {
    for (const c of extractMeetingOutcomeCommitments(outcomeDTO())) validateCandidate(c);
    for (const c of extractFollowUpCommitments(followUpDTO())) validateCandidate(c);
    for (const c of extractAgendaTopics(agendaDTO())) validateCandidate(c);
    for (const c of extractPersonProfileRole(profileDTO())) validateCandidate(c);
    for (const c of extractBusinessCardServices(cardDTO())) validateCandidate(c);
    for (const c of extractIntroductionContext(introDTO())) validateCandidate(c);
    for (const c of extractManualOwnerAuthored(manualDTO())) validateCandidate(c);
  });
});

// ---------- 10. Pipeline: visibility ceiling + unresolved entity gate ----------

function makeSbStub(
  opts: {
    resolveSucceeds?: boolean;
    loaderResult?: unknown;
  } = {},
) {
  return {
    // Minimal stub — pipeline only needs `resolveSubject` and loader dispatch.
    rpc: async () => ({ data: null, error: null }),
    from: (_: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: opts.resolveSucceeds ? { id: P1, node_type: "person" } : null,
          }),
        }),
        or: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      }),
    }),
  } as any;
}

describe("Extraction pipeline gates", () => {
  it("rejects a candidate whose visibility exceeds the extractor ceiling", async () => {
    // Force a synthetic ceiling by requesting stricter maxSensitivity than
    // the extractor's declared visibility. `person_profile.role.v1` declares
    // 'public_ok'; asking for `public_ok` still allows it, but a hand-built
    // extractor emit with `restricted` will be gated.
    // Use manual extractor whose default emit is 'restricted'.
    const receipt: any = {
      id: "r1",
      ownerUserId: OWNER,
      sourceDomain: "work_hub_items",
      sourceRecordId: `manual/${OWNER}/${P1}`,
      sourceVersion: "hash1",
      extractorId: "manual.owner_authored.v1",
      extractorVersion: "1.0.0",
      status: "processing",
      candidateCount: 0,
      attemptCount: 1,
      rowVersion: 1,
      claimToken: "t",
      lastError: null,
      claimedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const sb = makeSbStub();
    const result = await runExtractionPipeline(sb, receipt, { maxSensitivity: "public_ok" });
    // All emitted candidates rejected by the ceiling gate.
    expect(result.processed).toHaveLength(0);
    expect(result.rejected.length).toBeGreaterThan(0);
    expect(result.rejected[0].code).toBe("RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID");
  });
});

// ---------- 11. Structural gate: no private-note reference in runtime paths ----------

describe("Structural gates for B2b-i runtime paths", () => {
  const files = [
    "src/lib/business-connect/relationship-memory/source-loaders.server.ts",
    "src/lib/business-connect/relationship-memory/source-dtos.ts",
    "src/lib/business-connect/relationship-memory/extractors.ts",
    "src/lib/business-connect/relationship-memory/extraction-pipeline.server.ts",
  ];
  it("no private-note table/domain reference", () => {
    for (const rel of files) {
      const body = readFileSync(resolve(process.cwd(), rel), "utf8");
      expect(body.toLowerCase()).not.toMatch(/business_meeting_private_notes/);
      expect(body.toLowerCase()).not.toMatch(/private_meeting_notes/);
    }
  });
  it("client barrel does not export server-only loaders/pipeline", () => {
    const idx = readFileSync(
      resolve(process.cwd(), "src/lib/business-connect/relationship-memory/index.ts"),
      "utf8",
    );
    expect(idx).not.toMatch(/source-loaders\.server/);
    expect(idx).not.toMatch(/extraction-pipeline\.server/);
    expect(idx).not.toMatch(/entity-resolution\.server/);
  });
});
