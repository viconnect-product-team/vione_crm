// @vitest-environment jsdom
// BC-Mobile-2B — Network VISUAL POLISH tests.
//
// This shard guards the 2B visual contract AND proves the 2A runtime freeze:
// no per-person cards / tabs / chips / KPIs / action buttons were introduced,
// the editorial row hierarchy is intact (name dominant, one quiet context
// line, truncation on long text), the clear-search affordance is accessible,
// and page size 25 / debounce 300ms / DTO whitelist / privacy boundaries are
// byte-for-byte unchanged in behavior.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { LangContext } from "@/lib/i18n";
import type { CounterpartSummary, GlobalConnectionDTO } from "@/lib/global-network/types";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { ReactNode } from "react";

// ── Module-boundary mocks (identical boundaries to the frozen 2A shard) ──────

const listAcceptedMock = vi.fn();
const resolvePublicMock = vi.fn();
const savedCardSearchMock = vi.fn();

vi.mock("@/lib/global-network/network.sdk", () => ({
  GlobalNetworkSDK: {
    connections: { listAccepted: (...args: unknown[]) => listAcceptedMock(...args) },
    counterparts: { resolvePublic: (...args: unknown[]) => resolvePublicMock(...args) },
  },
}));

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: { search: (...args: unknown[]) => savedCardSearchMock(...args) },
}));

const viewerState: { id: string | null } = { id: "viewer-a" };
vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => viewerState.id,
}));

const {
  useBusinessConnectNetwork: _hook,
  connectionToPerson,
  savedCardToPerson,
  BC_MOBILE_NETWORK_PAGE_SIZE,
  BC_MOBILE_NETWORK_SEARCH_DEBOUNCE_MS,
  BC_MOBILE_NETWORK_SEARCH_MAX_PAGES,
} = await import("@/hooks/use-business-connect-network");
const { NetworkHome } = await import("@/components/business-connect/mobile/NetworkHome");

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `- ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join("\n");
    throw new Error(`axe violations:\n${summary}`);
  }
}

afterEach(cleanup);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function connection(overrides: Partial<GlobalConnectionDTO> = {}): GlobalConnectionDTO {
  return {
    id: "conn-1",
    requesterUserId: "viewer-a",
    recipientUserId: "user-1",
    status: "accepted",
    sourceType: "manual",
    sourceId: null,
    requestedAt: daysAgo(20),
    respondedAt: daysAgo(12),
    disconnectedAt: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(12),
    direction: "outgoing",
    counterpartUserId: "user-1",
    requestedByCurrentUser: true,
    ...overrides,
  };
}

function summary(overrides: Partial<CounterpartSummary> = {}): CounterpartSummary {
  return {
    userId: "user-1",
    displayName: "Nguyễn Văn Bình",
    avatarUrl: null,
    headline: "CEO",
    primaryCardSlug: "nguyen-van-binh",
    companyName: "ABC Corporation",
    ...overrides,
  };
}

function savedCard(overrides: Partial<SavedCard> = {}): SavedCard {
  return {
    id: "sc-1",
    targetCardId: "card-1",
    savedAt: daysAgo(5),
    favorite: false,
    tags: ["vip"],
    notes: "SECRET NOTE XYZ — must never render",
    firstMetAt: null,
    metAt: null,
    reminderAt: null,
    source: "qr",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    lastViewedAt: null,
    lastContactAt: null,
    lastScanAt: null,
    company: null,
    industry: null,
    interest: null,
    meetingPlace: null,
    event: null,
    referral: null,
    importance: 3,
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
      cardId: "card-1",
      slug: "tran-minh-anh",
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: "Trần Minh Anh",
      professionalTitle: "Founder",
      companyName: "XYZ",
      avatarUrl: null,
      unavailable: false,
    },
    ...overrides,
  };
}

function seed({
  connections = [] as GlobalConnectionDTO[],
  summaries = [] as CounterpartSummary[],
  cards = [] as SavedCard[],
} = {}) {
  listAcceptedMock.mockResolvedValue(connections);
  resolvePublicMock.mockResolvedValue(summaries);
  savedCardSearchMock.mockResolvedValue(cards);
}

// ── Render harness ───────────────────────────────────────────────────────────

function renderNetwork(lang: "vi" | "en" = "vi", dark = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const networkRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network",
    component: NetworkHome,
  });
  const personRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network/$personId",
    component: () => <div>person-stub</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([networkRoute, personRoute]),
    history: createMemoryHistory({ initialEntries: ["/connect-app/network"] }),
  });
  const Wrapper = ({ children }: { children?: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LangContext.Provider value={{ lang, setLang: () => {} }}>
        <div className={dark ? "dark bc-app" : "bc-app"}>{children}</div>
      </LangContext.Provider>
    </QueryClientProvider>
  );
  return render(
    <Wrapper>
      <RouterProvider router={router as never} />
    </Wrapper>,
  );
}

// Ô tìm kiếm nay luôn hiển thị (thiết kế Network mới) — không còn nút bật/tắt.
async function openSearch() {
  return await screen.findByRole("searchbox");
}

beforeEach(() => {
  listAcceptedMock.mockReset();
  resolvePublicMock.mockReset();
  savedCardSearchMock.mockReset();
  viewerState.id = "viewer-a";
});

// ── Runtime freeze proof (2A semantics unchanged by 2B) ─────────────────────

describe("2A runtime freeze", () => {
  it("frozen constants are unchanged (page 25 / debounce 300ms / 4-page search bound)", () => {
    expect(BC_MOBILE_NETWORK_PAGE_SIZE).toBe(25);
    expect(BC_MOBILE_NETWORK_SEARCH_DEBOUNCE_MS).toBe(300);
    expect(BC_MOBILE_NETWORK_SEARCH_MAX_PAGES).toBe(4);
  });

  it("DTO whitelist is unchanged (exact frozen field set)", () => {
    const p = connectionToPerson(connection(), summary());
    expect(Object.keys(p).sort()).toEqual(
      [
        "avatarUrl",
        "cardSlug",
        "companyName",
        "context",
        "displayName",
        "headline",
        "personId",
        "relationshipId",
        "relationshipKind",
        "sortAt",
      ].sort(),
    );
    const s = savedCardToPerson(savedCard());
    expect(Object.keys(s).sort()).toEqual(Object.keys(p).sort());
  });

  it("privacy gate unchanged: saved-card notes/tags never enter the DTO", () => {
    const s = savedCardToPerson(savedCard());
    for (const f of ["notes", "tags", "labels", "importance", "priority", "firstMetAt"]) {
      expect(s).not.toHaveProperty(f);
    }
    expect(JSON.stringify(s)).not.toContain("SECRET NOTE");
  });

  it("search backend path unchanged: server saved-card search, bounded page contract", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(listAcceptedMock).toHaveBeenCalledWith({ limit: 25, offset: 0 });
    await openSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "binh" } });
    await waitFor(() => expect(savedCardSearchMock).toHaveBeenCalledWith({ text: "binh" }), {
      timeout: 2000,
    });
  });

  it("debounce unchanged: rapid typing triggers one server search with the final term", async () => {
    seed();
    renderNetwork();
    await screen.findByText("Network của anh đang còn trống.");
    const input = await openSearch();
    fireEvent.change(input, { target: { value: "m" } });
    fireEvent.change(input, { target: { value: "mi" } });
    fireEvent.change(input, { target: { value: "min" } });
    await waitFor(() => expect(savedCardSearchMock).toHaveBeenCalledWith({ text: "min" }), {
      timeout: 2000,
    });
    const textCalls = savedCardSearchMock.mock.calls.filter(
      (c) => (c[0] as { text?: string }).text,
    );
    expect(textCalls).toHaveLength(1);
  });
});

// ── Editorial row structure ─────────────────────────────────────────────────

describe("editorial person row", () => {
  it("each row is exactly ONE navigable link with no nested interactive controls", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    const link = await screen.findByRole("link", { name: "Nguyễn Văn Bình" });
    const li = link.closest("li");
    expect(li).toBeTruthy();
    expect(within(li as HTMLElement).getAllByRole("link")).toHaveLength(1);
    expect(within(li as HTMLElement).queryAllByRole("button")).toHaveLength(0);
    // Chevron is visual-only — aria-hidden, never announced.
    const chevron = li?.querySelector("svg[aria-hidden='true']:last-of-type");
    expect(chevron).toBeTruthy();
  });

  it("name is the dominant element; title · company and context stay quiet", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    const name = (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(name.className).toContain("text-[17px]");
    expect(name.className).toContain("font-semibold");
    const titleCompany = screen.getAllByText("CEO · ABC Corporation").at(-1)!;
    expect(titleCompany.className).toContain("text-[13px]");
    const context = screen.getByText("Mới kết nối");
    expect(context.className).toContain("text-[11.5px]");
  });

  it("long text is clamped: name/title/context all truncate to one line", async () => {
    seed({
      connections: [connection()],
      summaries: [
        summary({
          displayName: "Nguyễn Văn Bình Christopher Alexander the Third",
          headline: "Tổng Giám đốc Điều hành kiêm Chủ tịch Hội đồng Chiến lược Toàn cầu",
          companyName: "Tập đoàn Công nghệ và Đầu tư Phát triển Bền vững ABC Corporation",
        }),
      ],
    });
    renderNetwork();
    const name = (await screen.findAllByText(/Christopher Alexander/)).at(-1)!;
    expect(name.className).toContain("truncate");
    const titleCompany = screen.getAllByText(/Tổng Giám đốc/).at(-1)!;
    expect(titleCompany.className).toContain("truncate");
    expect(screen.getByText("Mới kết nối").className).toContain("truncate");
  });

  it("title-only and company-only render without a dangling separator", async () => {
    seed({
      connections: [
        connection({ id: "c1", counterpartUserId: "u1" }),
        connection({ id: "c2", counterpartUserId: "u2" }),
      ],
      summaries: [
        summary({ userId: "u1", displayName: "Chỉ Chức Danh", companyName: null }),
        summary({ userId: "u2", displayName: "Chỉ Công Ty", headline: null }),
      ],
    });
    renderNetwork();
    expect((await screen.findAllByText("CEO")).at(-1)!).toBeTruthy();
    expect(screen.getAllByText("ABC Corporation").at(-1)!).toBeTruthy();
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it("omits the secondary line entirely when neither title nor company exists", async () => {
    seed({
      connections: [connection()],
      summaries: [summary({ headline: null, companyName: null })],
    });
    renderNetwork();
    const link = await screen.findByRole("link", { name: "Nguyễn Văn Bình" });
    // no empty title/company line when neither headline nor company exists.
    expect(within(link).queryByText(/·/)).toBeNull();
  });

  it("max ONE context line per person", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(screen.getAllByText("Mới kết nối")).toHaveLength(1);
    expect(screen.getAllByText("Đã lưu")).toHaveLength(1);
  });

  it("avatar fallback renders initials on a restrained neutral surface", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    const initials = await screen.findByText("NB");
    expect(initials.getAttribute("aria-hidden")).toBe("true");
    expect(initials.className).toContain("rounded-full");
    // No random bright color classes — neutral token only.
    expect(initials.className).not.toMatch(/bg-(red|blue|green|amber|purple|pink)-/);
  });

  it("real avatar renders as a clean circular crop with empty alt (no duplicate name)", async () => {
    seed({
      connections: [connection()],
      summaries: [summary({ avatarUrl: "https://cdn.example.com/avatar.png" })],
    });
    renderNetwork();
    const link = await screen.findByRole("link", { name: "Nguyễn Văn Bình" });
    const img = link.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.className).toContain("rounded-full");
    expect(img?.className).toContain("object-cover");
  });

  it("row press target is >= 68px with a subtle, reduced-motion-safe response", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    const link = await screen.findByRole("link", { name: "Nguyễn Văn Bình" });
    expect(link.className).toContain("min-h-[92px]");
    expect(link.className).toContain("duration-150");
    expect(link.className).toContain("motion-reduce:active:scale-100");
    expect(link.className).toContain("motion-reduce:transition-none");
  });
});

// ── Search field ─────────────────────────────────────────────────────────────

describe("search field", () => {
  it("clear button appears only while a query exists and has an accessible name", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(screen.queryByRole("button", { name: "Xóa tìm kiếm" })).toBeNull();
    await openSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "binh" } });
    const clear = await screen.findByRole("button", { name: "Xóa tìm kiếm" });
    fireEvent.click(clear);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("button", { name: "Xóa tìm kiếm" })).toBeNull();
    // Clearing restores the full list.
    expect((await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!).toBeTruthy();
  });

  it("search remains labeled for screen readers", async () => {
    seed();
    renderNetwork();
    const input = await openSearch();
    expect(input.id).toBe("bc-network-search");
    expect(document.querySelector("label[for='bc-network-search']")).toBeTruthy();
  });
});

// ── Loading / empty / search-empty ───────────────────────────────────────────

describe("content states", () => {
  it("loading: title + search stay; exactly 6 skeleton rows mirror the final layout", async () => {
    listAcceptedMock.mockReturnValue(new Promise(() => {}));
    resolvePublicMock.mockReturnValue(new Promise(() => {}));
    savedCardSearchMock.mockReturnValue(new Promise(() => {}));
    const { container } = renderNetwork();
    expect(await screen.findByRole("heading", { name: "Network" })).toBeTruthy();
    expect(screen.getByRole("searchbox")).toBeTruthy();
    const status = screen.getByRole("status");
    const avatarBars = status.querySelectorAll(".h-12.w-12.rounded-full");
    expect(avatarBars).toHaveLength(6);
    // Skeleton respects reduced motion.
    expect(status.querySelector(".motion-reduce\\:animate-none")).toBeTruthy();
    expect(container.querySelector("[role='progressbar']")).toBeNull();
  });

  it("empty Network: unchanged semantics (title copy + Mở V action, no illustration)", async () => {
    seed();
    renderNetwork();
    expect(await screen.findByText("Network của anh đang còn trống.")).toBeTruthy();
    expect(
      screen.getByText("Hãy trao danh thiếp hoặc kết nối với một người để bắt đầu."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Mở V/ })).toBeTruthy();
    expect(document.querySelector("main img")).toBeNull();
  });

  it("empty search: unchanged message, no fake people, clear-query action resets", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    await openSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz nobody" } });
    expect(
      await screen.findByText("Không tìm thấy người phù hợp.", undefined, { timeout: 2000 }),
    ).toBeTruthy();
    // No global-directory fallback, no V CTA inside search-empty.
    expect(screen.queryByText(/Mở V/)).toBeNull();
    expect(screen.queryByRole("link", { name: "Nguyễn Văn Bình" })).toBeNull();
    // The query stays visible in the field; the clear action resets it.
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("zzzz nobody");
    const clears = screen.getAllByRole("button", { name: "Xóa tìm kiếm" });
    fireEvent.click(clears[clears.length - 1]);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect((await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!).toBeTruthy();
  });

  it("load-more stays a quiet text control with a reserved slot (no layout jump)", async () => {
    const page1 = Array.from({ length: 25 }, (_, i) =>
      connection({ id: `conn-${i}`, counterpartUserId: `user-${i}`, respondedAt: daysAgo(i + 1) }),
    );
    listAcceptedMock.mockImplementation(({ offset }: { offset: number }) =>
      Promise.resolve(offset === 0 ? page1 : []),
    );
    resolvePublicMock.mockResolvedValue([]);
    savedCardSearchMock.mockResolvedValue([]);
    renderNetwork();
    const btn = await screen.findByRole("button", { name: "Xem thêm" });
    expect(btn.className).not.toContain("bg-[var(--bc-mobile-accent)]");
    fireEvent.click(btn);
    await waitFor(() => expect(listAcceptedMock).toHaveBeenCalledWith({ limit: 25, offset: 25 }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull());
  });
});

// ── Forbidden surfaces (NOT a CRM) ──────────────────────────────────────────

describe("forbidden surfaces stay absent", () => {
  it("no tabs, filter chips, KPI cards, or contact action buttons", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    const { container } = renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("button", { name: /gọi|call|zalo|whatsapp|follow/i })).toBeNull();
    // No KPI/count card patterns.
    expect(container.querySelectorAll("[data-kpi], [data-stat], .kpi")).toHaveLength(0);
  });

  it("row component source introduces no Card wrapper, shadow, or swipe behavior", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/business-connect/mobile/NetworkPersonRow.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/from "@\/components\/ui\/card"/);
    expect(src).not.toContain("shadow-");
    expect(src).not.toMatch(/swipe|onTouchMove|translateX/i);
  });

  // Tabs (Tất cả · Kết nối của tôi) + one filter menu are part of the approved
  // Network redesign; the guard now only forbids heavy imported UI machinery.
  it("screen source introduces no A–Z rail, chip filters, or imported menu machinery", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/business-connect/mobile/NetworkHome.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/A–Z rail|A-Z rail|FilterChip|filter-chip/i);
    expect(src).not.toContain("DropdownMenu");
    expect(src).not.toMatch(/from "@\/components\/ui\/tabs"/);
  });
});

// ── i18n + axe ───────────────────────────────────────────────────────────────

describe("i18n + accessibility", () => {
  it("renders the polished experience in English", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork("en");
    expect((await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!).toBeTruthy();
    await openSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "binh" } });
    expect(await screen.findByRole("button", { name: "Clear search" })).toBeTruthy();
  });

  it(
    "axe passes: populated, empty, search-empty, and dark-mode surfaces",
    async () => {
      seed({ connections: [connection()], summaries: [summary()], cards: [savedCard()] });
    const populated = renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    await expectNoViolations(populated.container);
    populated.unmount();
    cleanup();

    seed();
    const empty = renderNetwork();
    await screen.findByText("Network của anh đang còn trống.");
    await expectNoViolations(empty.container);
    empty.unmount();
    cleanup();

    seed({ connections: [connection()], summaries: [summary()] });
    const searchEmpty = renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    await openSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz" } });
    await screen.findByText("Không tìm thấy người phù hợp.", undefined, { timeout: 2000 });

    await expectNoViolations(searchEmpty.container);
    searchEmpty.unmount();
    cleanup();

    seed({ connections: [connection()], summaries: [summary()] });
    const dark = renderNetwork("vi", true);
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    expect(dark.container.querySelector(".dark")).toBeTruthy();
    await expectNoViolations(dark.container);
    dark.unmount();
  }, 20_000);
});
