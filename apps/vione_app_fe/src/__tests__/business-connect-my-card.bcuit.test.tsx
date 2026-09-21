// @vitest-environment jsdom
// BC-UI-1T shard — My Business Card: select/create stay in surface, eligibility,
// per-card load failure retry.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BusinessCardSummary } from "@/lib/business-card/business-card.types";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import {
  makeSummary,
  makeSaved,
  renderAt,
  warmupRouteTree,
} from "./helpers/business-connect-test-harness";

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

describe("BC-UI-1T my business card", () => {
  it("lists existing cards and mounts GlobalCardBuilder on select (no /connect redirect)", async () => {
    cardsData = [makeSummary({ id: "c1", displayName: "Alpha Person" })];
    const { router } = await renderAt("/business-connect/my-card");
    await waitFor(() => expect(screen.getByText("Alpha Person")).toBeTruthy());
    await userEvent.click(screen.getByText("Alpha Person"));
    await waitFor(() => expect(screen.getByTestId("global-card-builder")).toBeTruthy());
    // Never left the Business Connect surface.
    expect(router.state.location.pathname).toBe("/business-connect/my-card");
  });

  it("create stays inside /business-connect/my-card and opens the builder", async () => {
    cardsData = [];
    createdId = "draft-9";
    const { router } = await renderAt("/business-connect/my-card");
    await waitFor(() => expect(screen.getByText("You have no card yet.")).toBeTruthy());
    await userEvent.click(screen.getByRole("button", { name: /Create card/i }));
    await waitFor(() => expect(createGlobalDraft).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("builder:draft-9")).toBeTruthy());
    expect(router.state.location.pathname).toBe("/business-connect/my-card");
  });

  it("eligibility gates the create action", async () => {
    eligible = false;
    cardsData = [];
    await renderAt("/business-connect/my-card");
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: /Create card/i }) as HTMLButtonElement).disabled,
      ).toBe(true),
    );
  });

  it("per-card load failure surfaces a retry", async () => {
    cardsData = [makeSummary({ id: "c1", displayName: "Alpha Person" })];
    getGlobal.mockRejectedValueOnce(new Error("load failed"));
    await renderAt("/business-connect/my-card");
    await waitFor(() => expect(screen.getByText("Alpha Person")).toBeTruthy());
    await userEvent.click(screen.getByText("Alpha Person"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /try again|thử lại/i })).toBeTruthy(),
    );
  });
});
