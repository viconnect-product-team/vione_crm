// @vitest-environment jsdom
// BC-Mobile-2A — Network contract tests.
//
// Guards the frozen Network contract: live SDK boundaries only (GlobalNetworkSDK
// + SavedCardSDK — both mocked here at the module boundary), the Network
// inclusion rule (accepted connections ∪ non-archived saved cards, slug dedupe),
// the normalized DTO (no private fields), bounded pagination, truthful search
// (server search for saved cards + bounded fallback for connections),
// viewer-scoped cache isolation, privacy (notes never render), navigation to
// the reserved Person Detail route, i18n (VI+EN), structural bans, and axe.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, renderHook, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
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

// ── Module-boundary mocks (the ONLY network surfaces the hook may touch) ─────

const listAcceptedMock = vi.fn();
const resolvePublicMock = vi.fn();
const savedCardSearchMock = vi.fn();
const guestContactListMock = vi.fn();

vi.mock("@/lib/global-network/network.sdk", () => ({
  GlobalNetworkSDK: {
    connections: { listAccepted: (...args: unknown[]) => listAcceptedMock(...args) },
    counterparts: { resolvePublic: (...args: unknown[]) => resolvePublicMock(...args) },
  },
}));

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: { search: (...args: unknown[]) => savedCardSearchMock(...args) },
}));

vi.mock("@/lib/business-card/guest-contact.sdk", () => ({
  GuestContactSDK: {
    listMine: (...args: unknown[]) => guestContactListMock(...args),
    getMine: vi.fn(),
  },
}));

const viewerState: { id: string | null } = { id: "viewer-a" };
vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => viewerState.id,
}));

// Imported AFTER the mocks so the hook receives the stubbed boundaries.
const {
  useBusinessConnectNetwork,
  bcMobileNetworkKeys,
  connectionToPerson,
  savedCardToPerson,
  mergeNetworkPeople,
  foldSearchText,
  personMatchesTerm,
  BC_MOBILE_NETWORK_PAGE_SIZE,
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
  guestContactListMock.mockResolvedValue([]);
}

// ── Render harness ───────────────────────────────────────────────────────────

function renderNetwork(lang: "vi" | "en" = "vi") {
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
      <LangContext.Provider value={{ lang, setLang: () => {} }}>{children}</LangContext.Provider>
    </QueryClientProvider>
  );
  return render(
    <Wrapper>
      <RouterProvider router={router as never} />
    </Wrapper>,
  );
}

beforeEach(() => {
  listAcceptedMock.mockReset();
  resolvePublicMock.mockReset();
  savedCardSearchMock.mockReset();
  guestContactListMock.mockReset();
  viewerState.id = "viewer-a";
});

// ── Normalized DTO ───────────────────────────────────────────────────────────

describe("normalized DTO", () => {
  it("maps a connection + public summary into the small presentation DTO", () => {
    const p = connectionToPerson(connection(), summary());
    expect(p.personId).toBe("u:user-1");
    expect(p.relationshipId).toBe("conn-1");
    expect(p.relationshipKind).toBe("connection");
    expect(p.displayName).toBe("Nguyễn Văn Bình");
    expect(p.headline).toBe("CEO");
    expect(p.companyName).toBe("ABC Corporation");
    expect(p.context?.kind).toBe("connected");
    expect(p.cardSlug).toBe("nguyen-van-binh");
    // Exactly the whitelisted presentation fields — nothing else.
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
  });

  it("maps a saved card WITHOUT private owner metadata", () => {
    const p = savedCardToPerson(savedCard());
    expect(p.personId).toBe("c:card-1");
    expect(p.relationshipKind).toBe("saved_card");
    expect(p.context?.kind).toBe("saved_card");
    const leakFields = ["notes", "tags", "labels", "importance", "priority", "firstMetAt"];
    for (const f of leakFields) expect(p).not.toHaveProperty(f);
    expect(JSON.stringify(p)).not.toContain("SECRET NOTE");
  });

  it("omits the context line when no timestamp exists", () => {
    const p = savedCardToPerson(savedCard({ savedAt: null as never }));
    expect(p.context).toBeNull();
  });
});

// ── Inclusion rule + ordering ────────────────────────────────────────────────

describe("Network inclusion rule", () => {
  it("dedupes by public card slug — the connection wins", () => {
    const conn = connectionToPerson(connection(), summary());
    const dup = savedCardToPerson(
      savedCard({ target: { ...savedCard().target, slug: "nguyen-van-binh" } }),
    );
    const merged = mergeNetworkPeople([conn], [dup]);
    expect(merged).toHaveLength(1);
    expect(merged[0].relationshipKind).toBe("connection");
  });

  it("keeps distinct saved cards and orders by relationship recency desc", () => {
    const older = connectionToPerson(connection({ respondedAt: daysAgo(30) }), summary());
    const newer = savedCardToPerson(savedCard({ savedAt: daysAgo(2) }));
    const merged = mergeNetworkPeople([older], [newer]);
    expect(merged).toHaveLength(2);
    expect(merged[0].personId).toBe("c:card-1");
    expect(merged[1].personId).toBe("u:user-1");
  });
});

// ── Search helpers ───────────────────────────────────────────────────────────

describe("search semantics", () => {
  it("folds case and diacritics (binh → Bình)", () => {
    expect(foldSearchText("  BINH ")).toBe("binh");
    expect(foldSearchText("Nguyễn")).toBe("nguyen");
  });

  it("matches display-safe fields only", () => {
    const p = connectionToPerson(connection(), summary());
    expect(personMatchesTerm(p, "binh")).toBe(true);
    expect(personMatchesTerm(p, "abc corp")).toBe(true);
    expect(personMatchesTerm(p, "ceo")).toBe(true);
    expect(personMatchesTerm(p, "secret")).toBe(false);
    expect(personMatchesTerm(p, "")).toBe(true);
  });

  it("scopes query keys by viewer identity (account switch ⇒ new key)", () => {
    expect(bcMobileNetworkKeys.connections("viewer-a")).not.toEqual(
      bcMobileNetworkKeys.connections("viewer-b"),
    );
    expect(bcMobileNetworkKeys.savedCards("viewer-a", "x")).not.toEqual(
      bcMobileNetworkKeys.savedCards("viewer-b", "x"),
    );
    expect(bcMobileNetworkKeys.savedCards("viewer-a", "x")).not.toEqual(
      bcMobileNetworkKeys.savedCards("viewer-a", "y"),
    );
  });
});

// ── Screen behavior ──────────────────────────────────────────────────────────

describe("Network screen", () => {
  it("renders real normalized records (name, title · company, ONE context line)", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    renderNetwork();
    expect((await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!).toBeTruthy();
    expect(screen.getAllByText("CEO · ABC Corporation").at(-1)!).toBeTruthy();
    expect(screen.getAllByText("Trần Minh Anh").at(-1)!).toBeTruthy();
    expect(screen.getAllByText("Founder · XYZ").at(-1)!).toBeTruthy();
    // Exactly one context line per person.
    expect(screen.getAllByText("Mới kết nối")).toHaveLength(1);
    expect(screen.getAllByText("Đã lưu")).toHaveLength(1);
    // Live boundary was used with a bounded page.
    expect(listAcceptedMock).toHaveBeenCalledWith({
      limit: BC_MOBILE_NETWORK_PAGE_SIZE,
      offset: 0,
    });
    expect(savedCardSearchMock).toHaveBeenCalledWith({});
  });

  it("never renders private notes from saved cards", async () => {
    seed({ cards: [savedCard()] });
    renderNetwork();
    expect((await screen.findAllByText("Trần Minh Anh")).at(-1)!).toBeTruthy();
    expect(screen.queryByText(/SECRET NOTE/)).toBeNull();
    expect(screen.queryByText(/vip/)).toBeNull();
  });

  it("shows the elegant empty state with the Mở V action when truly empty", async () => {
    seed();
    renderNetwork();
    expect(await screen.findByText("Network của anh đang còn trống.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Mở V/ })).toBeTruthy();
  });

  it("keeps shell, title and search while loading (skeleton rows, no spinner)", async () => {
    listAcceptedMock.mockReturnValue(new Promise(() => {}));
    resolvePublicMock.mockReturnValue(new Promise(() => {}));
    savedCardSearchMock.mockReturnValue(new Promise(() => {}));
    renderNetwork();
    expect(await screen.findByRole("heading", { name: "Network" })).toBeTruthy();
    expect(screen.getByRole("searchbox")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("shows a quiet error without raw backend detail and retries", async () => {
    listAcceptedMock.mockRejectedValue(
      new Error("pg: relation user_connections permission denied"),
    );
    savedCardSearchMock.mockRejectedValue(
      new Error("pg: relation user_connections permission denied"),
    );
    guestContactListMock.mockRejectedValue(new Error("pg: permission denied"));
    renderNetwork();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Không thể tải Network.")).toBeTruthy();
    expect(screen.queryByText(/pg: relation/)).toBeNull();
    seed({ connections: [connection()], summaries: [summary()] });
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect((await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!).toBeTruthy();
  });

  it("search uses the server saved-card search and the bounded connection fallback", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "minh" } });
    await waitFor(
      () => {
        expect(savedCardSearchMock).toHaveBeenCalledWith({ text: "minh" });
      },
      { timeout: 2000 },
    );
    // "minh" matches the saved card (server result) but not the connection.
    expect((await screen.findAllByText("Trần Minh Anh")).at(-1)!).toBeTruthy();
    await waitFor(() => expect(screen.queryAllByText("Nguyễn Văn Bình").at(-1) ?? null).toBeNull());
  });

  it("debounces: rapid typing triggers one server search with the final term", async () => {
    seed({ cards: [savedCard()] });
    renderNetwork();
    (await screen.findAllByText("Trần Minh Anh")).at(-1)!;
    const input = screen.getByRole("searchbox");
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
    expect(textCalls[0][0]).toEqual({ text: "min" });
  });

  it("shows the empty-search state and never falls back to a global directory", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz nobody" } });
    expect(
      await screen.findByText("Không tìm thấy người phù hợp.", undefined, { timeout: 2000 }),
    ).toBeTruthy();
    expect(screen.queryByText(/Mở V/)).toBeNull();
  });

  it("paginates with a bounded load-more (offset contract, never unbounded)", async () => {
    const page1 = Array.from({ length: BC_MOBILE_NETWORK_PAGE_SIZE }, (_, i) =>
      connection({ id: `conn-${i}`, counterpartUserId: `user-${i}`, respondedAt: daysAgo(i + 1) }),
    );
    listAcceptedMock.mockImplementation(({ offset }: { offset: number }) =>
      Promise.resolve(offset === 0 ? page1 : []),
    );
    resolvePublicMock.mockResolvedValue([]);
    savedCardSearchMock.mockResolvedValue([]);
    renderNetwork();
    const btn = await screen.findByRole("button", { name: "Xem thêm" });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(listAcceptedMock).toHaveBeenCalledWith({
        limit: BC_MOBILE_NETWORK_PAGE_SIZE,
        offset: BC_MOBILE_NETWORK_PAGE_SIZE,
      }),
    );
    // No more pages once a short page arrives.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull());
  });

  it("rows navigate to the reserved Person Detail route", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    renderNetwork();
    const link = await screen.findByRole("link", { name: "Nguyễn Văn Bình" });
    expect(link.getAttribute("href")).toBe("/connect-app/network/u%3Auser-1");
  });

  it("account switch re-fetches under a new viewer-scoped key (no stale cross-account cache)", async () => {
    seed({ connections: [connection()], summaries: [summary()] });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children?: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(() => useBusinessConnectNetwork(""), { wrapper });
    await waitFor(() => expect(listAcceptedMock).toHaveBeenCalledTimes(1));
    viewerState.id = "viewer-b";
    rerender();
    await waitFor(() => expect(listAcceptedMock).toHaveBeenCalledTimes(2));
  });

  it("renders in English", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    renderNetwork("en");
    expect(await screen.findByPlaceholderText("Search people, company, title…")).toBeTruthy();
    expect(await screen.findByText("Newly connected")).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("axe passes on populated and empty states", async () => {
    seed({
      connections: [connection()],
      summaries: [summary()],
      cards: [savedCard()],
    });
    const populated = renderNetwork();
    (await screen.findAllByText("Nguyễn Văn Bình")).at(-1)!;
    await expectNoViolations(populated.container);
    populated.unmount();

    seed();
    const empty = renderNetwork();
    await screen.findByText("Network của anh đang còn trống.");
    await expectNoViolations(empty.container);
    empty.unmount();
  });
});

// ── Structural gates ─────────────────────────────────────────────────────────

describe("structural gates", () => {
  const files = [
    "src/hooks/use-business-connect-network.ts",
    "src/components/business-connect/mobile/NetworkHome.tsx",
    "src/components/business-connect/mobile/NetworkPersonRow.tsx",
    "src/routes/connect-app.network.tsx",
    "src/routes/connect-app.network.$personId.tsx",
  ];
  const banned = [
    ".server",
    "client.server",
    "service_role",
    "CURRENT_USER_ID",
    "members-data",
    "networking-data",
    "extra-data",
    "fees-data",
  ];
  for (const file of files) {
    it(`${file} imports no server/service-role/mock modules`, () => {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      for (const token of banned) expect(src).not.toContain(token);
    });
  }
});
