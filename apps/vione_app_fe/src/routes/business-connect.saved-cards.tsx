// BC-UI-1 — Saved Business Cards inside the Business Connect surface.
//
// Thin route: owns type-safe URL search state, then delegates all UI/logic to
// the shared <SavedCardsLibrary>. No table access, no server-fn imports.

import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useCallback, useMemo } from "react";
import {
  savedCardsSearchSchema,
  SAVED_CARDS_DEFAULT_SEARCH,
  normalizeSection,
  normalizeSort,
  normalizeView,
  normalizeAvailability,
  type SavedCardsSearch,
  type SavedCardsSection,
} from "@/lib/business-card/saved-card.search";
import { SavedCardsLibrary } from "@/components/business-connect/SavedCardsLibrary";

export const Route = createFileRoute("/business-connect/saved-cards")({
  ssr: false,
  validateSearch: zodValidator(savedCardsSearchSchema),
  head: () => ({
    meta: [
      { title: "Saved Business Cards — ViOne" },
      { name: "description", content: "Your saved business cards, collections and tags." },
    ],
  }),
  component: BusinessConnectSavedCards,
});

// Section → effective search overrides (computed views over the SDK result set).
function applySection(base: SavedCardsSearch, section: SavedCardsSection): SavedCardsSearch {
  switch (section) {
    case "favorites":
      return { ...base, section, favorite: true, archived: undefined };
    case "recent":
      return { ...base, section, favorite: undefined, archived: false, sort: "recentlyOpened" };
    case "frequent":
      return { ...base, section, favorite: undefined, archived: false, sort: "frequentlyOpened" };
    case "archived":
      return { ...base, section, favorite: undefined, archived: true };
    case "all":
    default:
      return { ...base, section, favorite: undefined, archived: false };
  }
}

function BusinessConnectSavedCards() {
  const rawSearch = Route.useSearch();
  const navigate = Route.useNavigate();

  const search = useMemo<SavedCardsSearch>(() => {
    const section = normalizeSection(rawSearch.section);
    const merged: SavedCardsSearch = {
      ...SAVED_CARDS_DEFAULT_SEARCH,
      ...rawSearch,
      section,
      sort: normalizeSort(rawSearch.sort),
      view: normalizeView(rawSearch.view),
      availability: normalizeAvailability(rawSearch.availability),
      q: (rawSearch.q ?? "").slice(0, 200),
      tags: Array.isArray(rawSearch.tags) ? rawSearch.tags.slice(0, 10) : [],
    };
    return applySection(merged, section);
  }, [rawSearch]);

  const onPatch = useCallback(
    (patch: Partial<SavedCardsSearch>) => {
      void navigate({ to: ".", search: (prev: SavedCardsSearch) => ({ ...prev, ...patch }) });
    },
    [navigate],
  );

  const onReset = useCallback(() => {
    void navigate({ to: ".", search: () => ({ ...SAVED_CARDS_DEFAULT_SEARCH }) });
  }, [navigate]);

  return <SavedCardsLibrary search={search} onPatch={onPatch} onReset={onReset} />;
}
