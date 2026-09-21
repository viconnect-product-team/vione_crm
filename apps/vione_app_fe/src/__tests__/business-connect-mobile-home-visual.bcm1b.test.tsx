// @vitest-environment jsdom
// BC-Mobile-1B — Executive Home VISUAL POLISH contract tests.
//
// 1A runtime/data semantics are frozen; this shard guards the 1B visual
// contract: editorial Today list (hairline dividers, no per-item cards),
// restrained header (40px avatar, tiny live-only unread indicator), greeting
// typography hierarchy, whitespace-first empty state, secondary V text
// action, reduced-motion behavior, dark-token proof, responsive frame, no
// dashboard-density regression (no KPI/charts/carousels/new sections).

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { readFileSync } from "node:fs";
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
  BC_MOBILE_HOME_MAX_TODAY_ITEMS,
  type BcMobileTodayItem,
  type BcMobileHomeData,
} from "@/hooks/use-business-connect-home";

// vaul (drawer) references ResizeObserver; jsdom does not implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver ??= ResizeObserverStub;

afterEach(() => {
  document.documentElement.classList.remove("dark");
  cleanup();
});

// ── Controllable mock of the Home composition hook (same pattern as 1A) ─────

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
// (BC-6A), which owns a react-query client. These visual tests stub the
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

const src = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const HOME_SRC = "src/components/business-connect/mobile/ExecutiveHome.tsx";
const ITEM_SRC = "src/components/business-connect/mobile/TodayItem.tsx";

// ── 1. No dashboard-density regression ───────────────────────────────────────

describe("BC-Mobile-1B — structure: no dashboard regression", () => {
  it("Home still has exactly ONE content section (Today) — no new sections", () => {
    const source = src(HOME_SRC);
    expect(source.match(/<section[\s>]/g)).toHaveLength(1);
    expect(source.match(/aria-labelledby="bc-home-today"/g)).toHaveLength(1);
  });

  it("no KPI/chart/carousel/analytics components enter the Home layer", () => {
    for (const p of [HOME_SRC, ITEM_SRC]) {
      const importLines = src(p)
        .split("\n")
        .filter((l) => /^\s*import\s/.test(l));
      for (const line of importLines) {
        expect(line.toLowerCase()).not.toMatch(/chart|carousel|kpi|analytics|recharts/);
        expect(line.toLowerCase()).not.toContain("mock");
        expect(line).not.toMatch(/-data["']/);
      }
    }
  });

  it("the frozen max-3 Today cap is unchanged", () => {
    expect(BC_MOBILE_HOME_MAX_TODAY_ITEMS).toBe(3);
  });

  it("Today rows are editorial lines, not elevated cards", () => {
    const item = src(ITEM_SRC);
    expect(item).not.toContain("rounded-2xl");
    expect(item).not.toContain("shadow");
    // Hairline dividers live on the parent list.
    expect(src(HOME_SRC)).toContain("divide-y divide-[var(--bc-mobile-border)]");
  });
});

// ── 2. Header + greeting visual contract ─────────────────────────────────────

describe("BC-Mobile-1B — header and greeting polish", () => {
  it("avatar is ~40px with a subtle fallback, inside a 44px touch target", () => {
    const source = src(HOME_SRC);
    expect(source).toContain("h-10 w-10 rounded-full object-cover");
    expect(source).toContain("h-11 w-11 place-items-center rounded-full");
  });

  it("unread indicator is tiny, restrained, and live-only", async () => {
    // null source → no badge at all.
    homeState.current = {
      data: homeData({ unreadNotificationCount: null }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    const bell = screen.getByRole("link", { name: "Thông báo" });
    expect(bell.textContent?.trim()).toBe("");
    cleanup();

    // Counts above 9 collapse to a restrained "9+".
    homeState.current = {
      data: homeData({ unreadNotificationCount: 12 }),
      isPending: false,
      isError: false,
      refetch: () => {},
    };
    await renderHome("vi");
    const bell12 = screen.getByRole("link", { name: "Thông báo, 12 chưa đọc" });
    expect(bell12.textContent).toContain("9+");
    expect(bell12.textContent).not.toContain("12");
    // Tiny badge, champagne micro accent (legible in both token sets).
    expect(src(HOME_SRC)).toContain("min-h-[16px] min-w-[16px]");
    expect(src(HOME_SRC)).toContain("bg-[var(--bc-mobile-accent)]");
  });

  it("greeting is secondary, name is primary (~26–30px semibold)", () => {
    const source = src(HOME_SRC);
    expect(source).toContain("text-[14px] font-normal text-[var(--bc-mobile-muted)]");
    expect(source).toMatch(/text-\[2[6-9]px\] font-semibold|text-\[30px\] font-semibold/);
  });
});

// ── 3. Today item semantics ──────────────────────────────────────────────────

describe("BC-Mobile-1B — Today item visual semantics", () => {
  it("actionable rows get a subtle press scale, disabled under reduced motion", () => {
    const source = src(ITEM_SRC);
    expect(source).toContain("active:scale-[0.99]");
    expect(source).toContain("motion-reduce:active:scale-100");
    expect(source).toContain("duration-150");
  });

  it("genuinely overdue items get a tiny danger dot WITH the text cue", async () => {
    await renderWithRouter(
      <TodayItem
        item={todayItem({
          category: "overdue",
          urgency: "high",
          descriptionKey: "bc.mobile.home.error.retry",
        })}
      />,
      "vi",
    );
    const link = await screen.findByRole("link");
    expect(link.querySelector('[class*="bc-mobile-danger"]')).toBeTruthy();
    expect(link.textContent).toContain("Thử lại"); // text cue preserved
  });

  it("non-overdue rows carry NO danger coloring", async () => {
    await renderWithRouter(<TodayItem item={todayItem()} />);
    const link = await screen.findByRole("link");
    expect(link.querySelector('[class*="bc-mobile-danger"]')).toBeNull();
  });

  it("non-actionable rows are static content, never fake buttons", async () => {
    await renderWithRouter(
      <TodayItem
        item={todayItem({ action: { ...todayItem().action, canRoute: false, targetRoute: null } })}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

// ── 4. Home states — visual shape ────────────────────────────────────────────

describe("BC-Mobile-1B — Home state visuals", () => {
  it("populated Today renders ≤3 rows in a divided list with one secondary V text action", async () => {
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
    expect(list.className).toContain("divide-y");
    const vActions = screen.getAllByRole("button", { name: "Mở V để kết nối" });
    expect(vActions).toHaveLength(1); // secondary text action — no second gold button
  });

  it("empty state is whitespace-first (no card) with a calm icon and subtle V CTA", async () => {
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    await renderHome("vi");
    const title = screen.getByText("Hôm nay thật yên tĩnh");
    let node: HTMLElement | null = title as HTMLElement;
    while (node && node.tagName !== "MAIN") {
      expect(node.className).not.toMatch(/border-dashed|rounded-2xl|shadow/);
      node = node.parentElement;
    }
    // Calm icon instead of illustration; CTA opens the ONE global V sheet.
    expect(src(HOME_SRC)).toContain("CircleCheck");
    fireEvent.click(screen.getByRole("button", { name: "Mở V để kết nối" }));
    const dialogs = await screen.findAllByRole("dialog", { name: "Hành động nhanh" });
    expect(dialogs).toHaveLength(1); // no duplicate V sheet
  });

  it("skeleton matches the final layout and respects reduced motion", () => {
    const source = src(HOME_SRC);
    expect(source).toContain("aria-busy");
    expect(source).toContain("motion-reduce:animate-none");
    // Skeleton mirrors: greeting lines + divided Today rows.
    expect(source).toContain("divide-y divide-[var(--bc-mobile-border)]");
  });
});

// ── 5. Motion, spacing, dark mode, responsive frame ─────────────────────────

describe("BC-Mobile-1B — system polish", () => {
  it("content-state transition is 160ms and disabled under reduced motion", () => {
    const css = src("src/styles.css");
    expect(css).toContain("bc-home-enter 160ms ease-out");
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce\)[\s\S]*?\.bc-home-enter[\s\S]*?animation:\s*none/,
    );
  });

  it("spacing rhythm uses the frozen scale (20px page, 32px greeting→Today, 16px rows)", () => {
    expect(src("src/components/business-connect/mobile/MobilePage.tsx")).toContain("1.25rem");
    expect(src(HOME_SRC)).toContain('className="mt-8"');
    expect(src(ITEM_SRC)).toContain("py-4");
  });

  it("dark tokens exist for every Home surface (champagne restrained, dividers subtle)", () => {
    const css = src("src/styles.css");
    expect(css).toContain(".dark .bc-app");
    const darkBlock = css.slice(css.indexOf(".dark .bc-app"));
    for (const token of [
      "--bc-mobile-bg",
      "--bc-mobile-surface",
      "--bc-mobile-surface-2",
      "--bc-mobile-text",
      "--bc-mobile-muted",
      "--bc-mobile-border",
      "--bc-mobile-accent",
      "--bc-mobile-danger",
    ]) {
      expect(darkBlock).toContain(token);
    }
    // No pure black backgrounds in the dark token set.
    expect(darkBlock).not.toContain("#000");
  });

  it("the 480px mobile frame is preserved (no desktop sidebar, no phone bezel)", () => {
    const shell = src("src/components/business-connect/mobile/BusinessConnectMobileShell.tsx");
    expect(shell).toContain("max-w-[480px]");
    expect(shell).not.toMatch(/aside|sidebar/i);
  });

  it("the ivory token is defined (initials fallback stays legible)", () => {
    expect(src("src/styles.css")).toContain("--bc-mobile-ivory");
  });
});

// ── 6. Accessibility ─────────────────────────────────────────────────────────

describe("BC-Mobile-1B — accessibility", () => {
  it("axe passes on the populated Home (badge + list + V action)", async () => {
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

  it("axe passes on the empty Home under dark tokens", async () => {
    document.documentElement.classList.add("dark");
    homeState.current = { data: homeData(), isPending: false, isError: false, refetch: () => {} };
    await renderHome("en");
    await screen.findByText("All quiet today");
    await assertNoAxeViolations(document.body);
  });
});
