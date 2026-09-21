// BC-Mobile-6A — Privacy + composition contract tests.
//
// Pins: DTO carry no private content (notes/photos/OCR/tags/contact
// details), fail-closed person resolution, cross-viewer boundary (every
// port receives the viewer id), wording failure ⇒ deterministic fallback,
// ranking is never influenced by AI.

import { describe, expect, it, vi } from "vitest";
import type { Lang } from "@/lib/i18n";
import {
  composePersonRecommendation,
  composeTodayRecommendations,
  type RelationshipIntelligenceDeps,
} from "@/lib/business-connect/mobile/relationship-intelligence.service";
type WordingInput = { locale: Lang; daysSinceLastInteraction: number };

const NOW = new Date("2026-08-10T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const VIEWER = "viewer-user-1";
const U1 = "123e4567-e89b-42d3-a456-426614174001";
const U2 = "123e4567-e89b-42d3-a456-426614174002";
const C1 = "123e4567-e89b-42d3-a456-426614174003";
const G1 = "123e4567-e89b-42d3-a456-426614174004";

function makeDeps(
  overrides: Partial<RelationshipIntelligenceDeps> = {},
): RelationshipIntelligenceDeps {
  return {
    listOldestConnections: vi.fn(async () => [
      { connectionId: "conn-1", counterpartUserId: U1, connectedAt: daysAgo(90) },
      { connectionId: "conn-2", counterpartUserId: U2, connectedAt: daysAgo(50) },
    ]),
    listSavedCardEdges: vi.fn(async () => [
      {
        targetCardId: C1,
        savedAt: daysAgo(70),
        displayName: "Card Person",
        avatarUrl: null,
        headline: "CEO",
        companyName: "Acme",
      },
    ]),
    listGuestEdges: vi.fn(async () => [
      { id: G1, displayName: "Guest Person", firstSharedAt: daysAgo(60), source: "public_card" },
    ]),
    listRecentMomentEdges: vi.fn(async () => []),
    resolveConnectionSummaries: vi.fn(async (ids: string[]) =>
      ids.map((id: any) => ({
        userId: id,
        displayName: `User ${id.slice(-1)}`,
        avatarUrl: null,
        headline: null,
        companyName: null,
      })),
    ),
    listDismissals: vi.fn(async () => []),
    getAcceptedConnectionEdge: vi.fn(async () => null),
    getSavedCardEdge: vi.fn(async () => null),
    getGuestEdge: vi.fn(async () => null),
    ...overrides,
  };
}

const FORBIDDEN_KEYS = [
  "note",
  "notes",
  "photo",
  "photos",
  "ocr",
  "transcript",
  "tags",
  "email",
  "phone",
  "address",
  "owner_user_id",
  "ownerUserId",
  "score",
  "probability",
  "connectionId",
];

function assertDtoPrivacy(payload: unknown) {
  const json = JSON.stringify(payload);
  for (const key of FORBIDDEN_KEYS) {
    expect(json.includes(`"${key}"`)).toBe(false);
  }
}

describe("composeTodayRecommendations", () => {
  it("mixes all three person kinds, ranks by staleness, caps at 3", async () => {
    const deps = makeDeps();
    const { recommendations } = await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    expect(recommendations.length).toBeLessThanOrEqual(3);
    expect(recommendations.map((r: any) => r.person.personId)).toEqual([
      `u:${U1}`, // 90d
      `c:${C1}`, // 70d
      `g:${G1}`, // 60d
    ]);
    expect(recommendations.every((r) => r.type === "reconnect")).toBe(true);
    expect(recommendations[0]?.reason.days).toBe(90);
  });

  it("recent interaction via moment suppresses that person only", async () => {
    const deps = makeDeps({
      listRecentMomentEdges: vi.fn(async () => [{ personId: `u:${U1}`, occurredAt: daysAgo(2) }]),
    });
    const { recommendations } = await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    expect(recommendations.map((r: any) => r.person.personId)).not.toContain(`u:${U1}`);
  });

  it("dismissal suppresses exactly one person", async () => {
    const deps = makeDeps({
      listDismissals: vi.fn(async () => [
        { personId: `u:${U1}`, recommendationType: "reconnect", dismissedUntil: daysAgo(-5) },
      ]),
    });
    const { recommendations } = await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    expect(recommendations.map((r: any) => r.person.personId)).not.toContain(`u:${U1}`);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("every port receives the viewer id (cross-viewer boundary)", async () => {
    const deps = makeDeps();
    await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    for (const key of [
      "listOldestConnections",
      "listSavedCardEdges",
      "listGuestEdges",
      "listRecentMomentEdges",
    ] as const) {
      expect(deps[key]).toHaveBeenCalledWith(VIEWER, expect.anything());
    }
    expect(deps.listDismissals).toHaveBeenCalledWith(VIEWER);
  });

  it("DTO privacy: no notes/photos/OCR/tags/contact fields, no scores", async () => {
    const deps = makeDeps();
    const result = await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    assertDtoPrivacy(result);
  });

  it("AI wording success → wordingSource ai; failure → deterministic fallback", async () => {
    const withAi = makeDeps({
      wording: async () => "Đã lâu rồi, hãy kết nối lại nhé.",
    });
    const aiResult = await composeTodayRecommendations(withAi, VIEWER, "vi", NOW);
    expect(aiResult.recommendations[0]?.wordingSource).toBe("ai");
    expect(aiResult.recommendations[0]?.aiSuggestion).toBeTruthy();

    const failing = makeDeps({
      wording: async () => {
        throw new Error("gateway down");
      },
    });
    const fallback = await composeTodayRecommendations(failing, VIEWER, "vi", NOW);
    expect(fallback.recommendations[0]?.wordingSource).toBe("deterministic");
    expect(fallback.recommendations[0]?.aiSuggestion).toBeNull();
    // Ranking unchanged by AI failure — same deterministic order.
    expect(fallback.recommendations.map((r: any) => r.person.personId)).toEqual(
      aiResult.recommendations.map((r: any) => r.person.personId),
    );
  });

  it("AI never receives a name or id — wording port input is numbers + locale only", async () => {
    const wording = vi.fn(async (_input: WordingInput) => null);
    const deps = makeDeps({ wording });
    await composeTodayRecommendations(deps, VIEWER, "vi", NOW);
    expect(wording).toHaveBeenCalled();
    const input = wording.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(Object.keys(input).sort()).toEqual(["daysSinceLastInteraction", "locale"]);
    expect(typeof input.daysSinceLastInteraction).toBe("number");
  });
});

describe("composePersonRecommendation — fail-closed", () => {
  it("invalid person id ⇒ null WITHOUT touching any port", async () => {
    const deps = makeDeps();
    const { recommendation } = await composePersonRecommendation(
      deps,
      VIEWER,
      "u:not-a-uuid",
      "vi",
      NOW,
    );
    expect(recommendation).toBeNull();
    expect(deps.getAcceptedConnectionEdge).not.toHaveBeenCalled();
    expect(deps.getSavedCardEdge).not.toHaveBeenCalled();
    expect(deps.getGuestEdge).not.toHaveBeenCalled();
  });

  it("no accepted edge ⇒ null (fail-closed), AI never called", async () => {
    const wording = vi.fn(async () => "x");
    const deps = makeDeps({ getAcceptedConnectionEdge: vi.fn(async () => null), wording });
    const { recommendation } = await composePersonRecommendation(
      deps,
      VIEWER,
      `u:${U1}`,
      "vi",
      NOW,
    );
    expect(recommendation).toBeNull();
    expect(wording).not.toHaveBeenCalled();
  });

  it("edge without any meaningful interaction ⇒ null (missing evidence silence)", async () => {
    const deps = makeDeps({
      getSavedCardEdge: vi.fn(async () => ({
        targetCardId: C1,
        savedAt: null as unknown as string, // broken upstream row
        displayName: "X",
        avatarUrl: null,
        headline: null,
        companyName: null,
      })),
    });
    const { recommendation } = await composePersonRecommendation(
      deps,
      VIEWER,
      `c:${C1}`,
      "vi",
      NOW,
    );
    expect(recommendation).toBeNull();
  });

  it("authorized + stale ⇒ exactly ONE recommendation for that person", async () => {
    const deps = makeDeps({
      getAcceptedConnectionEdge: vi.fn(async (viewer: string, target: string) => {
        expect(viewer).toBe(VIEWER);
        return { connectionId: "conn-1", counterpartUserId: target, connectedAt: daysAgo(75) };
      }),
    });
    const { recommendation } = await composePersonRecommendation(
      deps,
      VIEWER,
      `u:${U1}`,
      "en",
      NOW,
    );
    expect(recommendation?.person.personId).toBe(`u:${U1}`);
    expect(recommendation?.reason).toEqual({
      kind: "last_interaction",
      days: 75,
      evidenceKind: "connected",
    });
    assertDtoPrivacy(recommendation);
  });

  it("active dismissal ⇒ null", async () => {
    const deps = makeDeps({
      getGuestEdge: vi.fn(async () => ({
        id: G1,
        displayName: "Guest",
        firstSharedAt: daysAgo(75),
        source: "public_card",
      })),
      listDismissals: vi.fn(async () => [
        { personId: `g:${G1}`, recommendationType: "reconnect", dismissedUntil: daysAgo(-1) },
      ]),
    });
    const { recommendation } = await composePersonRecommendation(
      deps,
      VIEWER,
      `g:${G1}`,
      "vi",
      NOW,
    );
    expect(recommendation).toBeNull();
  });
});
