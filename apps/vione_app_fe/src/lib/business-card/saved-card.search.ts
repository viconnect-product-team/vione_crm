// BC-3.1 — Canonical Saved Cards route-search contract.
//
// Pure types + zod validation + a single canonical default object. No supabase,
// no window — safe to import in routes, hooks, components and tests. This is the
// ONE source of truth for Saved Cards route search state; Link, navigate(),
// redirects and reset-filter actions all reuse SAVED_CARDS_DEFAULT_SEARCH.

import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";
import {
  CANONICAL_SAVED_CARD_SOURCES,
  type CanonicalSavedCardSource,
  type SavedCardAvailability,
} from "./saved-card.contracts";

// ── Sort contract ─────────────────────────────────────────────────────────────

export type SavedCardSort =
  | "recentlySaved"
  | "recentlyOpened"
  | "frequentlyOpened"
  | "name"
  | "company";

export const SAVED_CARD_SORTS: SavedCardSort[] = [
  "recentlySaved",
  "recentlyOpened",
  "frequentlyOpened",
  "name",
  "company",
];

// ── Section (computed views — NOT collections) ────────────────────────────────

export type SavedCardsSection = "all" | "favorites" | "recent" | "frequent" | "archived";

export const SAVED_CARDS_SECTIONS: SavedCardsSection[] = [
  "all",
  "favorites",
  "recent",
  "frequent",
  "archived",
];

export type SavedCardsView = "grid" | "list";

// ── Canonical search shape ────────────────────────────────────────────────────

export type SavedCardsSearch = {
  q: string;
  section: SavedCardsSection;
  collection: string; // "" = no collection filter
  tags: string[];
  favorite?: boolean;
  archived?: boolean;
  source?: CanonicalSavedCardSource;
  availability?: SavedCardAvailability;
  sort: SavedCardSort;
  cursor: string; // reserved for future server-driven pagination
  view: SavedCardsView;
};

/**
 * THE canonical default search. Import and reuse everywhere — never re-declare a
 * partial default inline (that is the "duplicated route defaults" anti-pattern).
 */
export const SAVED_CARDS_DEFAULT_SEARCH: SavedCardsSearch = {
  q: "",
  section: "all",
  collection: "",
  tags: [],
  favorite: undefined,
  archived: undefined,
  source: undefined,
  availability: undefined,
  sort: "recentlySaved",
  cursor: "",
  view: "grid",
};

// ── Validation (fallback() keeps types precise; never zod .catch()) ───────────

export const savedCardsSearchSchema = z.object({
  q: fallback(z.string(), SAVED_CARDS_DEFAULT_SEARCH.q).default(SAVED_CARDS_DEFAULT_SEARCH.q),
  section: fallback(
    z.enum(SAVED_CARDS_SECTIONS as [SavedCardsSection, ...SavedCardsSection[]]),
    SAVED_CARDS_DEFAULT_SEARCH.section,
  ).default(SAVED_CARDS_DEFAULT_SEARCH.section),
  collection: fallback(z.string(), SAVED_CARDS_DEFAULT_SEARCH.collection).default(
    SAVED_CARDS_DEFAULT_SEARCH.collection,
  ),
  tags: fallback(z.array(z.string()), SAVED_CARDS_DEFAULT_SEARCH.tags).default(
    SAVED_CARDS_DEFAULT_SEARCH.tags,
  ),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  source: z
    .enum(CANONICAL_SAVED_CARD_SOURCES as [CanonicalSavedCardSource, ...CanonicalSavedCardSource[]])
    .optional(),
  availability: z.enum(["available", "unavailable"]).optional(),
  sort: fallback(
    z.enum(SAVED_CARD_SORTS as [SavedCardSort, ...SavedCardSort[]]),
    SAVED_CARDS_DEFAULT_SEARCH.sort,
  ).default(SAVED_CARDS_DEFAULT_SEARCH.sort),
  cursor: fallback(z.string(), SAVED_CARDS_DEFAULT_SEARCH.cursor).default(
    SAVED_CARDS_DEFAULT_SEARCH.cursor,
  ),
  view: fallback(z.enum(["grid", "list"]), SAVED_CARDS_DEFAULT_SEARCH.view).default(
    SAVED_CARDS_DEFAULT_SEARCH.view,
  ),
});

// ── Normalizers (clamp free strings to the closed contract in the component) ──

export function normalizeSection(v: string | undefined): SavedCardsSection {
  return SAVED_CARDS_SECTIONS.includes(v as SavedCardsSection) ? (v as SavedCardsSection) : "all";
}

export function normalizeSort(v: string | undefined): SavedCardSort {
  return SAVED_CARD_SORTS.includes(v as SavedCardSort) ? (v as SavedCardSort) : "recentlySaved";
}

export function normalizeView(v: string | undefined): SavedCardsView {
  return v === "list" ? "list" : "grid";
}

export function normalizeSource(v: string | undefined): CanonicalSavedCardSource | undefined {
  return v && CANONICAL_SAVED_CARD_SOURCES.includes(v as CanonicalSavedCardSource)
    ? (v as CanonicalSavedCardSource)
    : undefined;
}

export function normalizeAvailability(v: string | undefined): SavedCardAvailability | undefined {
  return v === "available" || v === "unavailable" ? v : undefined;
}

/** True when the search equals the canonical default (drives "reset" affordance). */
export function isDefaultSearch(s: SavedCardsSearch): boolean {
  return (
    s.q === "" &&
    s.section === "all" &&
    s.collection === "" &&
    s.tags.length === 0 &&
    s.favorite === undefined &&
    s.archived === undefined &&
    s.source === undefined &&
    s.availability === undefined &&
    s.sort === "recentlySaved" &&
    s.view === SAVED_CARDS_DEFAULT_SEARCH.view
  );
}
