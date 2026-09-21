import { describe, it, expect } from "vitest";
import {
  buildSmartCollections,
  computeRelationshipScore,
  relationshipAgeDays,
} from "@/lib/business-card/relationship-intelligence";
import { mapRowToRelationshipEvent } from "@/lib/business-card/relationship.mappers";
import type { RelationshipScoreSignals, SavedCard } from "@/lib/business-card/relationship.types";

// ---------------------------------------------------------------------------
// BC-2.5 — Relationship Intelligence Engine (PURE).
// Verifies deterministic score, age, smart collections and event mapping.
// No live DB, no AI, no side effects.
// ---------------------------------------------------------------------------

const NOW = Date.parse("2025-06-01T00:00:00Z");

function card(partial: Partial<SavedCard> & { id: string }): SavedCard {
  return {
    id: partial.id,
    targetCardId: partial.targetCardId ?? `card-${partial.id}`,
    savedAt: partial.savedAt ?? "2025-05-20T00:00:00Z",
    favorite: partial.favorite ?? false,
    tags: partial.tags ?? [],
    notes: partial.notes ?? null,
    firstMetAt: null,
    metAt: null,
    reminderAt: null,
    source: partial.source ?? "profile",
    createdAt: "2025-05-20T00:00:00Z",
    updatedAt: "2025-05-20T00:00:00Z",
    lastViewedAt: null,
    lastContactAt: null,
    lastScanAt: null,
    company: partial.company ?? null,
    companyId: null,
    industry: partial.industry ?? null,
    interest: null,
    meetingPlace: null,
    event: null,
    referral: null,
    importance: partial.importance ?? 0,
    labels: [],
    color: null,
    priority: null,
    birthday: null,
    anniversary: null,
    collectionId: partial.collectionId ?? null,
    archived: partial.archived ?? false,
    lastOpened: partial.lastOpened ?? null,
    target: {
      cardId: partial.targetCardId ?? `card-${partial.id}`,
      slug: `slug-${partial.id}`,
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: `Name ${partial.id}`,
      professionalTitle: null,
      companyName: null,
      avatarUrl: null,
      unavailable: false,
    },
  } as SavedCard;
}

const zeroSignals: RelationshipScoreSignals = {
  saved: false,
  favorite: false,
  hasNotes: false,
  viewCount: 0,
  shareCount: 0,
  meetingCount: 0,
  qrCount: 0,
  nfcCount: 0,
  walletCount: 0,
  tagCount: 0,
  importance: 0,
};

describe("relationshipAgeDays", () => {
  it("returns whole days elapsed", () => {
    expect(relationshipAgeDays("2025-05-22T00:00:00Z", NOW)).toBe(10);
  });
  it("clamps future/invalid to 0", () => {
    expect(relationshipAgeDays("2025-07-01T00:00:00Z", NOW)).toBe(0);
    expect(relationshipAgeDays("not-a-date", NOW)).toBe(0);
  });
});

describe("computeRelationshipScore", () => {
  it("is 0 and dormant with no signals", () => {
    const s = computeRelationshipScore(zeroSignals);
    expect(s.value).toBe(0);
    expect(s.tier).toBe("dormant");
    expect(s.breakdown).toEqual({});
  });

  it("is deterministic for identical inputs", () => {
    const signals = { ...zeroSignals, saved: true, favorite: true, meetingCount: 2 };
    expect(computeRelationshipScore(signals)).toEqual(computeRelationshipScore(signals));
  });

  it("caps repeated signals and stays within 0–100", () => {
    const s = computeRelationshipScore({
      ...zeroSignals,
      saved: true,
      favorite: true,
      hasNotes: true,
      viewCount: 999,
      shareCount: 999,
      meetingCount: 999,
      qrCount: 999,
      nfcCount: 999,
      walletCount: 999,
      tagCount: 999,
      importance: 999,
    });
    expect(s.value).toBeGreaterThan(0);
    expect(s.value).toBeLessThanOrEqual(100);
    expect(s.tier).toBe("strong");
  });

  it("assigns tiers by threshold", () => {
    expect(computeRelationshipScore({ ...zeroSignals, saved: true }).tier).toBe("new");
  });
});

describe("buildSmartCollections", () => {
  const cards = [
    card({
      id: "1",
      savedAt: "2025-05-25T00:00:00Z",
      favorite: true,
      industry: "Tech",
      tags: ["vip"],
    }),
    card({ id: "2", savedAt: "2025-01-01T00:00:00Z", industry: "Tech" }),
    card({ id: "3", savedAt: "2025-05-30T00:00:00Z", tags: ["vip", "lead"] }),
  ];

  it("derives recent within the 30-day window", () => {
    const recent = buildSmartCollections(cards, NOW).find((c) => c.kind === "recent");
    expect(recent?.cardIds.sort()).toEqual(["1", "3"]);
  });

  it("derives favorites", () => {
    const fav = buildSmartCollections(cards, NOW).find((c) => c.kind === "favorites");
    expect(fav?.cardIds).toEqual(["1"]);
  });

  it("groups by industry and tag", () => {
    const cols = buildSmartCollections(cards, NOW);
    const tech = cols.find((c) => c.id === "industry:tech");
    expect(tech?.cardIds.sort()).toEqual(["1", "2"]);
    const vip = cols.find((c) => c.id === "tag:vip");
    expect(vip?.cardIds.sort()).toEqual(["1", "3"]);
  });

  it("always exposes future placeholders as empty", () => {
    const cols = buildSmartCollections(cards, NOW);
    expect(cols.find((c) => c.kind === "nearby")?.count).toBe(0);
    expect(cols.find((c) => c.kind === "aiSuggested")?.count).toBe(0);
  });
});

describe("mapRowToRelationshipEvent", () => {
  it("maps row shape and defaults metadata", () => {
    const evt = mapRowToRelationshipEvent({
      id: "e1",
      target_card_id: "card-1",
      event_type: "viewed",
      metadata: { source: "profile" },
      created_at: "2025-05-20T00:00:00Z",
    });
    expect(evt).toEqual({
      id: "e1",
      targetCardId: "card-1",
      type: "viewed",
      metadata: { source: "profile" },
      createdAt: "2025-05-20T00:00:00Z",
    });
  });

  it("defaults null/invalid metadata to empty object", () => {
    const evt = mapRowToRelationshipEvent({
      id: "e2",
      target_card_id: "card-2",
      event_type: "saved",
      metadata: null,
      created_at: "2025-05-20T00:00:00Z",
    });
    expect(evt.metadata).toEqual({});
  });
});
