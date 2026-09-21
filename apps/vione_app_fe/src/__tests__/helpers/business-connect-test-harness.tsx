// BC-UI-1T shared test harness (pure helpers only).
//
// Contains NO vi.mock calls: those must live in each shard file so Vitest can
// hoist them above the SDK/supabase imports and so each shard keeps its own
// isolated mutable mock state. This harness only holds the pure, stateless
// pieces that were duplicated across every shard: synthetic data builders, the
// memory-router render helper, and the axe assertion.

import { useState } from "react";
import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { SavedCardsLibrary } from "@/components/business-connect/SavedCardsLibrary";
import {
  SAVED_CARDS_DEFAULT_SEARCH,
  type SavedCardsSearch,
} from "@/lib/business-card/saved-card.search";
import type { BusinessCardSummary } from "@/lib/business-card/business-card.types";
import type { SavedCard } from "@/lib/business-card/relationship.types";

/**
 * Warms the one-time route-tree + router transform outside the per-test budget.
 * The first dynamic import of the generated route tree compiles the whole app
 * router (~seconds). Calling this in a shard's `beforeAll` (with a generous hook
 * timeout) keeps individual tests inside the default 5s timeout — no per-test
 * timeout override needed.
 */
export async function warmupRouteTree() {
  await import("@tanstack/react-router");
  await import("@/routeTree.gen");
}

/** Fails the test with a readable summary if axe finds any violation. */
export async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe(container);
  if (results.violations.length > 0) {
    const summary = results.violations.map((v) => `${v.id}: ${v.help}`).join("\n");
    throw new Error(`axe found accessibility violations:\n${summary}`);
  }
}

/** Synthetic BusinessCardSummary (safe test data only). */
export function makeSummary(
  over: Partial<BusinessCardSummary> & { id: string },
): BusinessCardSummary {
  return {
    id: over.id,
    slug: over.slug ?? `slug-${over.id}`,
    cardKind: over.cardKind ?? "primary",
    status: over.status ?? "published",
    publicMode: over.publicMode ?? "public",
    displayName: over.displayName ?? `Name ${over.id}`,
    professionalTitle: over.professionalTitle ?? "Director",
    companyName: over.companyName ?? "Test Co",
    avatarUrl: over.avatarUrl ?? null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as BusinessCardSummary;
}

/** Synthetic SavedCard (safe test data only). */
export function makeSaved(over: Partial<SavedCard> & { id: string }): SavedCard {
  return {
    id: over.id,
    targetCardId: over.targetCardId ?? `t-${over.id}`,
    savedAt: "2026-01-01T00:00:00.000Z",
    favorite: over.favorite ?? false,
    tags: over.tags ?? [],
    notes: null,
    firstMetAt: null,
    metAt: null,
    reminderAt: null,
    source: "profile",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastViewedAt: null,
    lastContactAt: null,
    lastScanAt: null,
    company: null,
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
    collectionId: null,
    archived: false,
    lastOpened: null,
    target: {
      cardId: over.targetCardId ?? `t-${over.id}`,
      slug: `slug-${over.id}`,
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: over.target?.displayName ?? `Saved ${over.id}`,
      professionalTitle: "Manager",
      companyName: "Saved Co",
      avatarUrl: null,
      unavailable: false,
    },
  };
}

/** Mounts the real business-connect route tree in a fresh memory router. */
export async function renderAt(path: string) {
  const { createRouter, RouterProvider, createMemoryHistory } =
    await import("@tanstack/react-router");
  const { routeTree } = await import("@/routeTree.gen");
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history, defaultPreloadStaleTime: 0 });

  const utils = render(<RouterProvider router={router as any} />);
  // __root starts at lang "vi" and flips to English via a mount effect that
  // reads localStorage ("vba.lang" = "en" in each shard's beforeEach). Wait for
  // that hydration so assertions see the English UI deterministically.
  await waitFor(() => {
    if (document.documentElement.lang !== "en") throw new Error("lang not hydrated");
  });
  return { router, ...utils };
}

/**
 * Direct-render harness for SavedCardsLibrary. Bypasses the full route tree
 * (no __root, no <html> shell, no AppShell) — only mounts the SDK-backed
 * component under a fresh QueryClient + LangContext.
 *
 * Callers must vi.mock("@/lib/business-card/saved-card.sdk") in the shard file
 * BEFORE importing this helper (Vitest hoisting requirement).
 */
export type SavedCardsHarness = {
  container: HTMLElement;
  getSearch: () => SavedCardsSearch;
  patched: Array<Partial<SavedCardsSearch>>;
  resetCalls: number;
  queryClient: QueryClient;
  unmount: () => void;
};

export function renderSavedCardsLibrary(
  initial: Partial<SavedCardsSearch> = {},
): SavedCardsHarness {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  let search: SavedCardsSearch = { ...SAVED_CARDS_DEFAULT_SEARCH, ...initial };
  const patched: Array<Partial<SavedCardsSearch>> = [];
  let resetCalls = 0;

  function Wrapper() {
    const [s, setS] = useState<SavedCardsSearch>(search);
    search = s;
    return (
      <SavedCardsLibrary
        search={s}
        onPatch={(p) => {
          patched.push(p);
          setS((prev) => ({ ...prev, ...p }));
        }}
        onReset={() => {
          resetCalls++;
          setS({ ...SAVED_CARDS_DEFAULT_SEARCH });
        }}
      />
    );
  }

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <Wrapper />
      </LangContext.Provider>
    </QueryClientProvider>,
  );

  return {
    container: utils.container,
    getSearch: () => search,
    patched,
    get resetCalls() {
      return resetCalls;
    },
    queryClient,
    unmount: () => {
      utils.unmount();
      queryClient.clear();
    },
  };
}
