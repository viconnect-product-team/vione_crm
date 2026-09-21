// BC-3.1 — Saved Cards Library deterministic tests.
// Pure contract + refinement logic (no supabase, no network).

import { describe, it, expect } from "vitest";
import {
  SAVED_CARDS_DEFAULT_SEARCH,
  savedCardsSearchSchema,
  isDefaultSearch,
  normalizeSection,
  normalizeSort,
  normalizeView,
  normalizeAvailability,
  type SavedCardsSearch,
} from "@/lib/business-card/saved-card.search";
import { toSdkQuery, refineSavedCards } from "@/hooks/use-saved-cards";
import type { SavedCard } from "@/lib/business-card/relationship.types";

function makeCard(over: Partial<SavedCard> & { id: string }): SavedCard {
  return {
    id: over.id,
    targetCardId: over.targetCardId ?? `t-${over.id}`,
    savedAt: over.savedAt ?? "2024-01-01T00:00:00.000Z",
    favorite: over.favorite ?? false,
    tags: over.tags ?? [],
    notes: over.notes ?? null,
    firstMetAt: null,
    metAt: null,
    reminderAt: null,
    source: over.source ?? "public_card",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastViewedAt: null,
    lastContactAt: null,
    lastScanAt: null,
    company: over.company ?? null,
    industry: null,
    interest: null,
    meetingPlace: null,
    event: null,
    referral: null,
    importance: 0,
    labels: [],
    color: null,
    priority: null,
    birthday: null,
    anniversary: null,
    companyId: null,
    collectionId: over.collectionId ?? null,
    archived: over.archived ?? false,
    lastOpened: over.lastOpened ?? null,
    target: {
      cardId: over.targetCardId ?? `t-${over.id}`,
      slug: `slug-${over.id}`,
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: over.target?.displayName ?? `Name ${over.id}`,
      professionalTitle: null,
      companyName: over.target?.companyName ?? null,
      avatarUrl: null,
      unavailable: over.target?.unavailable ?? false,
    },
  } as SavedCard;
}

const base: SavedCardsSearch = { ...SAVED_CARDS_DEFAULT_SEARCH };

describe("saved-card.search contract", () => {
  it("has a stable canonical default", () => {
    expect(SAVED_CARDS_DEFAULT_SEARCH.section).toBe("all");
    expect(SAVED_CARDS_DEFAULT_SEARCH.sort).toBe("recentlySaved");
    expect(isDefaultSearch(SAVED_CARDS_DEFAULT_SEARCH)).toBe(true);
  });

  it("falls back invalid URL values instead of throwing", () => {
    const parsed = savedCardsSearchSchema.parse({ sort: "nope", view: "weird", q: 123 });
    expect(normalizeSort(parsed.sort)).toBe("recentlySaved");
    expect(normalizeView(parsed.view)).toBe("grid");
  });

  it("normalizers clamp to the closed contract", () => {
    expect(normalizeSection("archived")).toBe("archived");
    expect(normalizeSection("bogus")).toBe("all");
    expect(normalizeAvailability("unavailable")).toBe("unavailable");
    expect(normalizeAvailability("maybe")).toBeUndefined();
  });
});

describe("toSdkQuery mapping", () => {
  it("maps favorites section to favorite=true", () => {
    const q = toSdkQuery({ ...base, section: "favorites" });
    expect(q.favorite).toBe(true);
    expect(q.archived).toBe(false);
  });

  it("maps archived section to archived=true", () => {
    const q = toSdkQuery({ ...base, section: "archived" });
    expect(q.archived).toBe(true);
  });

  it("sends only the first tag to the server", () => {
    const q = toSdkQuery({ ...base, tags: ["a", "b"] });
    expect(q.tag).toBe("a");
  });
});

describe("refineSavedCards", () => {
  const cards = [
    makeCard({ id: "1", savedAt: "2024-01-01T00:00:00Z", tags: ["vip"] }),
    makeCard({ id: "2", savedAt: "2024-03-01T00:00:00Z", tags: ["vip", "lead"] }),
    makeCard({ id: "3", savedAt: "2024-02-01T00:00:00Z", target: { unavailable: true } as never }),
  ];

  it("sorts recentlySaved newest first", () => {
    const out = refineSavedCards(cards, { ...base, sort: "recentlySaved" });
    expect(out.map((c: any) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("applies multi-tag AND refinement beyond the server tag", () => {
    const out = refineSavedCards(cards, { ...base, tags: ["vip", "lead"] });
    expect(out.map((c: any) => c.id)).toEqual(["2"]);
  });

  it("filters by availability", () => {
    const out = refineSavedCards(cards, { ...base, availability: "unavailable" });
    expect(out.map((c: any) => c.id)).toEqual(["3"]);
  });

  it("does not mutate the input array", () => {
    const snapshot = cards.map((c: any) => c.id);
    refineSavedCards(cards, { ...base, sort: "name" });
    expect(cards.map((c: any) => c.id)).toEqual(snapshot);
  });
});
