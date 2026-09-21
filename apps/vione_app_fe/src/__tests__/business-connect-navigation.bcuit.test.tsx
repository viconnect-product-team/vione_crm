// @vitest-environment jsdom
// BC-UI-1T shard — Navigation group + placeholder safety.
// Mounts the REAL business-connect routes in a memory router with the SDK/data
// boundary mocked and heavy leaf components stubbed.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { screen, waitFor, cleanup, within } from "@testing-library/react";
import type { BusinessCardSummary } from "@/lib/business-card/business-card.types";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import {
  makeSummary,
  makeSaved,
  renderAt,
  warmupRouteTree,
} from "./helpers/business-connect-test-harness";

// Mutable datasets so a reload can return a different snapshot.
let cardsData: BusinessCardSummary[] = [];
let cardsError: Error | null = null;
let savedData: SavedCard[] = [];
let eligible = true;
let createdId = "new-card-1";

const recordOpen = vi.fn(async (_id: string) => makeSaved({ id: "r" }));
const createGlobalDraft = vi.fn(async () => ({ id: createdId }));
const getGlobal = vi.fn(async (id: string) => ({ id, slug: `slug-${id}` }));

vi.mock("@/lib/business-card", () => ({
  BusinessCardSDK: {
    listGlobal: vi.fn(async () => {
      if (cardsError) throw cardsError;
      return cardsData.map((c: any) => ({ ...c }));
    }),
    globalEligibility: vi.fn(async () => ({ eligible })),
    getGlobal: (id: string) => getGlobal(id),
    createGlobalDraft: () => createGlobalDraft(),
  },
}));

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: {
    search: vi.fn(async () => savedData.map((c: any) => ({ ...c }))),
    recordOpen: (id: string) => recordOpen(id),
    collections: { list: vi.fn(async () => []) },
    tags: { list: vi.fn(async () => []) },
    setFavorite: vi.fn(async () => makeSaved({ id: "x" })),
    setArchived: vi.fn(async () => makeSaved({ id: "x" })),
    move: vi.fn(async () => makeSaved({ id: "x" })),
    setNote: vi.fn(async () => makeSaved({ id: "x" })),
    remove: vi.fn(async () => ({ ok: true })),
  },
}));

// BC-RC1 harness repair — MockModeBanner and the Work Hub hook call real
// server functions, which cannot be fetched from jsdom (relative /_serverFn
// URL). Stub them so the shard exercises UI, not the server transport.
vi.mock("@/components/MockModeBanner", () => ({ MockModeBanner: () => null }));
vi.mock("@/lib/business-connect/work-hub/functions", () => ({
  getWorkHubOverviewFn: async () => ({
    summary: {
      needsActionCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
      upcomingCount: 0,
      waitingCount: 0,
      recentCount: 0,
      highestPriority: null,
      registryVersion: "1.0.0",
      generatedAt: "2026-01-01T00:00:00.000Z",
    },
    previews: {
      needs_action: [],
      overdue: [],
      due_soon: [],
      upcoming: [],
      waiting: [],
      recent: [],
    },
    registryVersion: "1.0.0",
  }),
}));

vi.mock("@/components/dashboard/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}));
vi.mock("@/components/connect/GlobalCardBuilder", () => ({
  GlobalCardBuilder: ({ card }: { card: { id: string } }) => (
    <div data-testid="global-card-builder">builder:{card.id}</div>
  ),
}));

vi.mock("@/integrations/supabase/client", () => {
  const user = { id: "auth-user-test", email: "tester@example.com" };

  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data: [], error: null }),
  };

  const channel: any = { on: () => channel, subscribe: () => channel };
  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user }, error: null }),
        getSession: async () => ({ data: { session: { user } }, error: null }),
        onAuthStateChange: (cb: (e: string, s: { user: typeof user }) => void) => {
          cb("SIGNED_IN", { user });
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
      from: () => builder,
      rpc: async () => ({ data: [], error: null }),
      channel: () => channel,
      removeChannel: () => {},
    },
  };
});

beforeAll(async () => {
  await warmupRouteTree();
}, 30000);

beforeEach(() => {
  cardsData = [];
  cardsError = null;
  savedData = [];
  eligible = true;
  createdId = "new-card-1";
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BC-UI-1T navigation", () => {
  it("renders exactly 7 non-duplicated tabs with Overview active (exact match)", async () => {
    await renderAt("/business-connect");
    const nav = await waitFor(() => screen.getByRole("navigation", { name: /Business Connect/i }));
    const links = within(nav).getAllByRole("link");
    const labels = links.map((l) => l.textContent);
    expect(labels).toEqual([
      "Overview",
      "My Business Card",
      "Saved Cards",
      "Connections",
      "Meetings",
      "Timeline",
      "Relationship Memory",
    ]);
    expect(new Set(labels).size).toBe(7); // no duplicates

    const overview = within(nav).getByRole("link", { name: "Overview" });
    expect(overview.getAttribute("data-status")).toBe("active");
    // Exact matching: overview is NOT active on a child route.
    expect(
      within(nav).getByRole("link", { name: "My Business Card" }).getAttribute("data-status"),
    ).not.toBe("active");
  });

  it("marks My Business Card / Saved Cards active on their routes", async () => {
    await renderAt("/business-connect/my-card");
    let nav = await waitFor(() => screen.getByRole("navigation", { name: /Business Connect/i }));
    expect(
      within(nav).getByRole("link", { name: "My Business Card" }).getAttribute("data-status"),
    ).toBe("active");
    expect(
      within(nav).getByRole("link", { name: "Overview" }).getAttribute("data-status"),
    ).not.toBe("active");

    cleanup();
    await renderAt("/business-connect/saved-cards");
    nav = await waitFor(() => screen.getByRole("navigation", { name: /Business Connect/i }));
    expect(within(nav).getByRole("link", { name: "Saved Cards" }).getAttribute("data-status")).toBe(
      "active",
    );
  });

  // The former placeholder assertion was removed in BC-7.8: both
  // /business-connect/connections and /business-connect/meetings are now
  // shipped product surfaces with their own interactive controls.
});
