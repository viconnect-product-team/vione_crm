// @vitest-environment jsdom
// BC-UI-1T shard — /business-connect landing surface.
//
// BC-RC1C harness/contract repair: BC-8.0 replaced the old overview surface
// (primary card + saved-card metrics) with the Work Hub read model. The route
// itself is healthy in production (`business-connect.index.tsx` -> WorkHubPage);
// the previous assertions were stale (ledger group C). Card/saved-card
// invariants are already protected by the my-card and saved-cards shards, so
// this shard now protects the landing surface's real invariants:
//   1. summary counts come from the SDK DTO (no hardcoded zeros)
//   2. empty previews render the canonical empty state (not a blank page)
//   3. a backend failure renders the retry-able error region and does NOT
//      blank the Business Connect shell/navigation
//
// jsdom cannot fetch the relative /_serverFn URL, so the server function is
// stubbed at the module boundary (test-only, matching the real DTO contract).

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { screen, waitFor, cleanup } from "@testing-library/react";
import type {
  WorkHubCategory,
  WorkHubItemDTO,
  WorkHubOverviewDTO,
} from "@/lib/business-connect/work-hub/types";
import { renderAt, warmupRouteTree } from "./helpers/business-connect-test-harness";

const EMPTY_PREVIEWS: Record<WorkHubCategory, WorkHubItemDTO[]> = {
  needs_action: [],
  overdue: [],
  due_soon: [],
  upcoming: [],
  waiting: [],
  recent: [],
};

function makeOverview(over: Partial<WorkHubOverviewDTO["summary"]> = {}): WorkHubOverviewDTO {
  return {
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
      ...over,
    },
    previews: { ...EMPTY_PREVIEWS },
  } as WorkHubOverviewDTO;
}

let overview: WorkHubOverviewDTO = makeOverview();
let overviewError: Error | null = null;

vi.mock("@/components/MockModeBanner", () => ({ MockModeBanner: () => null }));
vi.mock("@/lib/business-connect/work-hub/functions", () => ({
  getWorkHubOverviewFn: async () => {
    if (overviewError) throw overviewError;
    return { ...overview, registryVersion: "1.0.0" };
  },
  getWorkHubSummaryFn: async () => ({ ...overview.summary }),
  listWorkHubItemsFn: async () => ({ items: [], nextCursor: null, registryVersion: "1.0.0" }),
}));

vi.mock("@/components/dashboard/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
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
  overview = makeOverview();
  overviewError = null;
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BC-UI-1T overview (Work Hub landing)", () => {
  it("renders SDK-backed summary counts", async () => {
    overview = makeOverview({ overdueCount: 3, needsActionCount: 2, upcomingCount: 5 });
    await renderAt("/business-connect");

    const list = await screen.findByRole("list", { name: /work hub/i });
    await waitFor(() => {
      const counts = Array.from(list.querySelectorAll('[role="listitem"]')).map((el) =>
        el.textContent?.trim(),
      );
      expect(counts.some((c) => /3$/.test(c ?? ""))).toBe(true);
      expect(counts.some((c) => /2$/.test(c ?? ""))).toBe(true);
      expect(counts.some((c) => /5$/.test(c ?? ""))).toBe(true);
    });
  });

  it("empty previews render the canonical empty state, not a blank page", async () => {
    overview = makeOverview();
    await renderAt("/business-connect");
    await waitFor(() => expect(screen.getByText("Nothing to do right now")).toBeTruthy());
  });

  it("backend failure shows a retry-able error and keeps the shell navigation", async () => {
    overviewError = new Error("boom");
    await renderAt("/business-connect");

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByRole("button", { name: /try again|retry/i })).toBeTruthy();
    // Shell navigation must survive a Work Hub data failure.
    expect(screen.getByRole("navigation", { name: "Business Connect" })).toBeTruthy();
  });
});
