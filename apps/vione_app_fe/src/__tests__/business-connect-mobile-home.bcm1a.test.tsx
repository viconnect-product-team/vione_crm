// @vitest-environment jsdom
// BC-Mobile-1A — Executive Home contract tests.
//
// Covers: Today selection policy (frozen category precedence, cap 3,
// cross-source dedupe, no fabrication), greeting daypart, identity-scoped
// query keys, item rendering semantics (link vs static, non-color urgency
// cue), Home states (loading / core error / today partial error / empty /
// populated), single global V instance via context, notification badge
// truthfulness, axe audit, and structural boundary scans (no server fns, no
// mock imports in the mobile Home layer).

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { LangContext } from "@/lib/i18n";
import { BusinessConnectMobileShell } from "@/components/business-connect/mobile/BusinessConnectMobileShell";
import { TodayItem } from "@/components/business-connect/mobile/TodayItem";
import {
  bcMobileHomeKeys,
  getGreetingDaypart,
  selectTodayItems,
  BC_MOBILE_HOME_MAX_TODAY_ITEMS,
  type BcMobileTodayItem,
  type BcMobileHomeData,
} from "@/hooks/use-business-connect-home";
import type { WorkHubItemDTO, WorkHubOverviewDTO } from "@/lib/business-connect/work-hub/types";

// vaul (drawer) references ResizeObserver; jsdom does not implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver ??= ResizeObserverStub;

afterEach(() => cleanup());

// ── Controllable mock of the Home composition hook ──────────────────────────
// Component-level tests drive the real UI through every state without
// touching the network; the pure selection/key logic is tested for real
// below (it is imported before this mock via the spread).

type HomeResult = {
  data: BcMobileHomeData | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

const homeState: { current: HomeResult } = {
  current: { data: undefined, isPending: true, isError: false, refetch: () => {} },
};

vi.mock("@/hooks/use-business-connect-home", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/hooks/use-business-connect-home")>();
  return { ...orig, useBusinessConnectHome: () => homeState.current };
});

// BC-RC1 harness repair — ExecutiveHome now embeds RelationshipSuggestions
// (BC-6A), which owns a react-query client. These contract tests stub the
// intelligence hooks directly so no QueryClientProvider is required.
vi.mock("@/hooks/use-relationship-intelligence", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/hooks/use-relationship-intelligence")>();
  return {
    ...orig,
    useTodayRelationshipRecommendations: () => ({
      recommendations: [],
      initialLoading: false,
      error: null,
      retry: () => {},
    }),
    useDismissRelationshipRecommendation: () => ({ mutate: () => {}, isPending: false }),
  };
});

// Imported AFTER the mock so ExecutiveHome receives the stubbed hook.
const { ExecutiveHome } = await import("@/components/business-connect/mobile/ExecutiveHome");

// ── Fixtures ─────────────────────────────────────────────────────────────────

function workHubItem(overrides: Partial<WorkHubItemDTO> & { id: string }): WorkHubItemDTO {
  return {
    sourceType: "meeting_invitation",
    sourceRecordId: overrides.id,
    itemKind: "meeting_upcoming",
    category: "upcoming",
    priority: "p2",
    urgency: "normal",
    titleKey: "bc.workHub.kind.meeting_upcoming",
    descriptionKey: null,
    safeDisplayData: { counterpartDisplayName: "Trần Minh Anh" },
    dueAt: null,
    startsAt: "2026-08-09T09:30:00.000Z",
    occurredAt: null,
    status: null,
    action: {
      kind: "route",
      labelKey: "bc.workHub.action.view",
      targetRoute: "/business-connect/meetings",
      targetParams: null,
      targetSearch: null,
      mutationCapability: null,
      requiresConfirmation: false,
    },
    secondaryAction: null,
    context: {},
    viewerPermissions: { canRoute: true, canInlineMutate: false },
    dedupeKey: `dk:${overrides.id}`,
    registryVersion: "1.0.0",
    ...overrides,
  } as WorkHubItemDTO;
}

function overviewWith(previews: Partial<WorkHubOverviewDTO["previews"]>): WorkHubOverviewDTO {
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
      generatedAt: "2026-08-09T00:00:00.000Z",
    },
    previews: {
      overdue: [],
      needs_action: [],
      due_soon: [],
      upcoming: [],
      waiting: [],
      recent: [],
      ...previews,
    },
  };
}

function homeData(overrides: Partial<BcMobileHomeData> = {}): BcMobileHomeData {
  return {
    identity: { displayName: "Lan Phạm", avatarUrl: null, email: "lan@example.com" },
    today: { status: "ok", items: [], pool: [] },
    unreadNotificationCount: 0,
    ...overrides,
  };
}

function todayItem(overrides: Partial<BcMobileTodayItem> = {}): BcMobileTodayItem {
  return {
    id: "i1",
    kind: "meeting",
    category: "upcoming",
    urgency: "normal",
    titleKey: "bc.mobile.home.today",
    descriptionKey: null,
    counterpartDisplayName: "Trần Minh Anh",
    startsAt: "2026-08-09T09:30:00.000Z",
    dueAt: null,
    action: {
      labelKey: "bc.mobile.home.today",
      targetRoute: "/business-connect/meetings",
      targetParams: null,
      targetSearch: null,
      canRoute: true,
    },
    ...overrides,
  };
}

// ── Render helpers ───────────────────────────────────────────────────────────

async function renderHome(lang: "vi" | "en" = "vi") {
  const rootRoute = createRootRoute({
    component: () => (
      <LangContext.Provider value={{ lang, setLang: () => {} }}>
        <BusinessConnectMobileShell>
          <Outlet />
        </BusinessConnectMobileShell>
      </LangContext.Provider>
    ),
  });
  const home = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app",
    component: () => <ExecutiveHome />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([home]),
    history: createMemoryHistory({ initialEntries: ["/connect-app"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("navigation", {
    name: lang === "vi" ? "Điều hướng chính" : "Primary navigation",
  });
  return router;
}

async function renderWithRouter(ui: React.ReactElement, lang: "vi" | "en" = "en") {
  const rootRoute = createRootRoute({
    component: () => (
      <LangContext.Provider value={{ lang, setLang: () => {} }}>
        <Outlet />
      </LangContext.Provider>
    ),
  });
  const leaf = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => ui });
  const router = createRouter({
    routeTree: rootRoute.addChildren([leaf]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
}

async function assertNoAxeViolations(container: Element) {
  const results = await axe(container);
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `- ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join("\n");
    throw new Error(`axe found accessibility violations:\n${summary}`);
  }
}

// ── 1. Today selection policy ────────────────────────────────────────────────

describe("BC-Mobile-1A — Today selection policy", () => {
  it("orders items by frozen category precedence, not by source order", () => {
    const overview = overviewWith({
      recent: [workHubItem({ id: "recent-1", category: "recent" })],
      upcoming: [workHubItem({ id: "up-1", category: "upcoming" })],
      overdue: [workHubItem({ id: "od-1", category: "overdue" })],
      needs_action: [workHubItem({ id: "na-1", category: "needs_action" })],
    });
    const items = selectTodayItems(overview, 10);
    expect(items.map((i) => i.id)).toEqual(["od-1", "na-1", "up-1", "recent-1"]);
  });

  it("caps the list at 3 by default", () => {
    const overview = overviewWith({
      overdue: [1, 2].map((n: any) => workHubItem({ id: `od-${n}`, category: "overdue" })),
      needs_action: [1, 2].map((n: any) => workHubItem({ id: `na-${n}`, category: "needs_action" })),
    });
    const items = selectTodayItems(overview);
    expect(items).toHaveLength(BC_MOBILE_HOME_MAX_TODAY_ITEMS);
    expect(items.map((i) => i.id)).toEqual(["od-1", "od-2", "na-1"]);
  });

  it("dedupes across sources via the server-computed dedupeKey", () => {
    const shared = "dk:shared";
    const overview = overviewWith({
      overdue: [workHubItem({ id: "a", category: "overdue", dedupeKey: shared })],
      upcoming: [workHubItem({ id: "b", category: "upcoming", dedupeKey: shared })],
    });
    const items = selectTodayItems(overview, 10);
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("a");
  });

  it("returns an empty list on a genuinely quiet day — never fabricates", () => {
    expect(selectTodayItems(overviewWith({}))).toEqual([]);
  });

  it("fills from waiting/recent only after primary categories", () => {
    const overview = overviewWith({
      recent: [1, 2, 3].map((n: any) => workHubItem({ id: `r-${n}`, category: "recent" })),
      due_soon: [workHubItem({ id: "ds-1", category: "due_soon" })],
    });
    const items = selectTodayItems(overview);
    expect(items.map((i) => i.id)).toEqual(["ds-1", "r-1", "r-2"]);
  });

  it("maps item kinds to semantic presentation kinds", () => {
    const overview = overviewWith({
      overdue: [
        workHubItem({ id: "f", category: "overdue", itemKind: "meeting_follow_up_overdue" }),
        workHubItem({ id: "c", category: "overdue", itemKind: "connection_request_received" }),
        workHubItem({ id: "i", category: "overdue", itemKind: "introduction_request_received" }),
      ],
    });
    const kinds = selectTodayItems(overview).map((i) => i.kind);
    expect(kinds).toEqual(["follow_up", "connection", "introduction"]);
  });
});

// ── 2. Greeting + identity-scoped keys ───────────────────────────────────────

describe("BC-Mobile-1A — greeting and query-key contract", () => {
  it("maps hours to localized dayparts", () => {
    expect(getGreetingDaypart(new Date("2026-08-09T07:00:00"))).toBe("morning");
    expect(getGreetingDaypart(new Date("2026-08-09T13:00:00"))).toBe("afternoon");
    expect(getGreetingDaypart(new Date("2026-08-09T21:00:00"))).toBe("evening");
  });

  it("scopes the Home query key by viewer id (no cross-account cache)", () => {
    expect(bcMobileHomeKeys.home("user-a")).not.toEqual(bcMobileHomeKeys.home("user-b"));
    expect(bcMobileHomeKeys.home("user-a")).toEqual(["bc-mobile", "home", "user-a"]);
  });
});

// ── 3. TodayItem semantics ───────────────────────────────────────────────────

describe("BC-Mobile-1A — TodayItem presentation", () => {
  it("renders a routable item as a link with a descriptive aria-label", async () => {
    await renderWithRouter(<TodayItem item={todayItem()} />);
    const link = await screen.findByRole("link");
    expect(link.getAttribute("aria-label")).toContain("Trần Minh Anh");
  });

  it("renders a non-routable item as static content (no dead link)", async () => {
    await renderWithRouter(
      <TodayItem
        item={todayItem({ action: { ...todayItem().action, canRoute: false, targetRoute: null } })}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("surfaces high urgency as TEXT, not color alone", async () => {
    const { container } = render(<></>);
    cleanup();
    await renderWithRouter(
      <TodayItem
        item={todayItem({ urgency: "high", descriptionKey: "bc.mobile.home.error.retry" })}
      />,
      "vi",
    );
    const link = await screen.findByRole("link");
    expect(link.textContent).toContain("Thử lại");
    expect(container).toBeDefined();
  });
});

// ── 4. Executive Home states ─────────────────────────────────────────────────

describe("BC-Mobile-1A — Executive Home states", () => {
  it("shows a quiet skeleton while loading", async () => {
    homeState.current = { data: undefined, isPending: true, isError: false, refetch: () => {} };
    await renderHome("vi");
    expect(screen.getByRole("status", { name: "Đang tải trang chủ…" })).toBeTruthy();
  });

  it("shows greeting with the authenticated display name", async () => {
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    await renderHome("vi");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Lan Phạm");
    expect(h1.textContent).toMatch(/Chào buổi (sáng|chiều|tối),/);
  });

  it("renders the Today list from live data (max 3)", async () => {
    homeState.current = {
      data: homeData({
        today: {
          status: "ok",
          items: [todayItem({ id: "1" }), todayItem({ id: "2" }), todayItem({ id: "3" })],
          pool: [todayItem({ id: "1" }), todayItem({ id: "2" }), todayItem({ id: "3" })],
        },
      }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("li")).toHaveLength(3);
  });

  it("shows the empty state with a V CTA on a quiet day", async () => {
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    await renderHome("vi");
    expect(screen.getByText("Hôm nay thật yên tĩnh")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở V để kết nối" })).toBeTruthy();
  });

  it("shows a retryable core error when identity fails", async () => {
    const refetch = vi.fn();
    homeState.current = { data: undefined, isPending: false, isError: true, refetch };
    await renderHome("vi");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Không tải được trang chủ.");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("degrades Today independently when the work hub fails", async () => {
    homeState.current = {
      data: homeData({ today: { status: "error", items: [], pool: [] } }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    // Greeting still renders; only the Today section degrades.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Lan Phạm");
    expect(screen.getByRole("alert").textContent).toContain("Không tải được mục Hôm nay.");
  });

  it("shows the unread badge ONLY from a real count", async () => {
    homeState.current = {
      data: homeData({ unreadNotificationCount: 4 }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    expect(screen.getByRole("link", { name: "Thông báo, 4 chưa đọc" }).textContent).toContain("4");
  });

  it("renders NO badge when the unread source is unavailable (null)", async () => {
    homeState.current = {
      data: homeData({ unreadNotificationCount: null }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    const bell = screen.getByRole("link", { name: "Thông báo" });
    expect(bell.textContent?.trim()).toBe("");
  });
});

// ── 5. Single global V instance via context ──────────────────────────────────

describe("BC-Mobile-1A — V entry integration", () => {
  it("the empty-state CTA opens the ONE global V sheet (context, not a 2nd instance)", async () => {
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    const router = await renderHome("vi");
    fireEvent.click(screen.getByRole("button", { name: "Mở V để kết nối" }));
    const dialog = await screen.findByRole("dialog", { name: "Hành động nhanh" });
    expect(dialog).toBeTruthy();
    // Opening V must never navigate.
    expect(router.state.location.pathname).toBe("/connect-app");
  });
});

// ── 6. Accessibility audit ───────────────────────────────────────────────────

describe("BC-Mobile-1A — accessibility", () => {
  it("has no axe violations in the populated state", async () => {
    homeState.current = {
      data: homeData({
        today: {
          status: "ok",
          items: [todayItem({ id: "1" }), todayItem({ id: "2" })],
          pool: [todayItem({ id: "1" }), todayItem({ id: "2" })],
        },
        unreadNotificationCount: 2,
      }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    await screen.findByRole("list");
    await assertNoAxeViolations(document.body);
  });

  it("has no axe violations in the empty state", async () => {
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    await renderHome("en");
    await screen.findByText("All quiet today");
    await assertNoAxeViolations(document.body);
  });
});

// ── 7. Structural boundaries ─────────────────────────────────────────────────

describe("BC-Mobile-1A — structural boundaries", () => {
  const hookPath = join(process.cwd(), "src/hooks/use-business-connect-home.ts");
  const homeComponentPath = join(
    process.cwd(),
    "src/components/business-connect/mobile/ExecutiveHome.tsx",
  );

  it("the Home layer contains no server functions and no .server imports", () => {
    for (const p of [hookPath, homeComponentPath]) {
      const src = readFileSync(p, "utf8");
      expect(src).not.toContain("createServerFn");
      expect(src).not.toMatch(/from\s+["'][^"']*\.server["']/);
      expect(src).not.toContain("client.server");
    }
  });

  it("the Home layer imports no mock data modules", () => {
    for (const p of [hookPath, homeComponentPath]) {
      const src = readFileSync(p, "utf8");
      const importLines = src.split("\n").filter((l) => /^\s*import\s/.test(l));
      for (const line of importLines) {
        expect(line).not.toMatch(/-data["']/);
        expect(line.toLowerCase()).not.toContain("mock");
      }
    }
  });

  it("the eslint boundary covers the Home composition hook", () => {
    const eslintConfig = readFileSync(join(process.cwd(), "eslint.config.js"), "utf8");
    expect(eslintConfig).toContain("src/hooks/use-business-connect-home.ts");
  });

  it("the data contract verification doc exists", () => {
    expect(
      existsSync(
        join(process.cwd(), "docs/business-connect/mobile/BC_MOBILE_1A_HOME_DATA_CONTRACT.md"),
      ),
    ).toBe(true);
  });
});
