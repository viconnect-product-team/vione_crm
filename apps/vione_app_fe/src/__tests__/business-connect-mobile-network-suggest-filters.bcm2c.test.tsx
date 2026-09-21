// @vitest-environment jsdom
// BC-Mobile-2B/6A — Network: hai panel gợi ý phải bám theo tìm kiếm & bộ lọc.
//
// Hợp đồng được khoá bởi shard này:
//   1. Không tìm kiếm / không lọc → "AI Match" và "Cần giữ kết nối" hiển thị
//      đầy đủ các gợi ý chuẩn của 6A.
//   2. Có từ khoá → hai panel VẪN hiển thị, nhưng chỉ còn người thuộc tập kết
//      quả hiện tại (không bị ẩn hoàn toàn như trước).
//   3. Đổi bộ lọc nguồn quan hệ → hai panel lọc theo đúng tập đó.
//   4. Khi không còn ai khớp → hai panel tự ẩn (không hiện panel rỗng).
//   5. Xoá từ khoá / bỏ bộ lọc → hai panel khôi phục đầy đủ.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
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
import type { RelationshipRecommendation } from "@/lib/business-connect/mobile/relationship-intelligence.types";
import type { ReactNode } from "react";

// ── Module-boundary mocks (cùng ranh giới với shard 2A/2B) ──────────────────

const listAcceptedMock = vi.fn();
const resolvePublicMock = vi.fn();
const savedCardSearchMock = vi.fn();
const todayMock = vi.fn();

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
  GuestContactSDK: { listMine: async () => [] },
}));

vi.mock("@/lib/business-connect/mobile/relationship-intelligence.sdk", () => ({
  RelationshipIntelSDK: {
    today: (...args: unknown[]) => todayMock(...args),
    person: async () => ({ recommendation: null }),
    dismiss: async () => ({ ok: true }),
  },
}));

// Dòng khoảnh khắc không thuộc phạm vi shard này.
vi.mock("@/hooks/use-network-feed", () => ({
  useNetworkFeed: () => ({ items: [], initialLoading: false, error: false, retry: () => {} }),
}));

// Hành động kết nối trên thẻ AI Match đi qua hợp đồng riêng (BC-3.1D).
vi.mock("@/hooks/use-network-row-connect", () => ({
  useNetworkRowConnect: () => ({
    state: "none",
    connect: { mutateAsync: async () => {} },
    cancel: { mutateAsync: async () => {} },
    busy: false,
  }),
}));

vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => "viewer-a",
}));

const { NetworkHome } = await import("@/components/business-connect/mobile/NetworkHome");

afterEach(cleanup);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const CONNECTION_NAME = "Nguyễn Văn Bình";
const SAVED_NAME = "Trần Minh Anh";

function connection(): GlobalConnectionDTO {
  return {
    id: "conn-1",
    requesterUserId: "viewer-a",
    recipientUserId: "user-1",
    status: "accepted",
    sourceType: "manual",
    sourceId: null,
    requestedAt: daysAgo(60),
    respondedAt: daysAgo(50),
    disconnectedAt: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(50),
    direction: "outgoing",
    counterpartUserId: "user-1",
    requestedByCurrentUser: true,
  };
}

function summary(): CounterpartSummary {
  return {
    userId: "user-1",
    displayName: CONNECTION_NAME,
    avatarUrl: null,
    headline: "CEO",
    primaryCardSlug: "nguyen-van-binh",
    companyName: "ABC Corporation",
  };
}

function savedCard(): SavedCard {
  return {
    id: "sc-1",
    targetCardId: "card-1",
    savedAt: daysAgo(70),
    favorite: false,
    tags: [],
    notes: null,
    firstMetAt: null,
    metAt: null,
    reminderAt: null,
    source: "qr",
    createdAt: daysAgo(70),
    updatedAt: daysAgo(70),
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
      cardId: "card-1",
      slug: "tran-minh-anh",
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: SAVED_NAME,
      professionalTitle: "Founder",
      companyName: "XYZ",
      avatarUrl: null,
      unavailable: false,
    },
  };
}

function recommendation(
  personId: string,
  displayName: string,
  days: number,
): RelationshipRecommendation {
  return {
    id: `${personId}:reconnect`,
    person: {
      personId,
      displayName,
      avatarUrl: null,
      headline: "CEO",
      companyName: "ABC Corporation",
      industryLabel: null,
      areaLabel: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days, evidenceKind: "moment" },
    aiSuggestion: null,
    wordingSource: "deterministic",
    generatedAt: daysAgo(0),
  };
}

function seed() {
  listAcceptedMock.mockResolvedValue([connection()]);
  resolvePublicMock.mockResolvedValue([summary()]);
  savedCardSearchMock.mockResolvedValue([savedCard()]);
  todayMock.mockResolvedValue({
    recommendations: [
      recommendation("u:user-1", CONNECTION_NAME, 60),
      recommendation("c:card-1", SAVED_NAME, 90),
    ],
  });
}

// ── Render harness ───────────────────────────────────────────────────────────

function renderNetwork() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app",
    component: () => <div>home-stub</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([networkRoute, personRoute, homeRoute]),
    history: createMemoryHistory({ initialEntries: ["/connect-app/network"] }),
  });
  const Wrapper = ({ children }: { children?: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LangContext.Provider value={{ lang: "vi", setLang: () => {} }}>
        <div className="bc-app">{children}</div>
      </LangContext.Provider>
    </QueryClientProvider>
  );
  return render(
    <Wrapper>
      <RouterProvider router={router as never} />
    </Wrapper>,
  );
}

const aiMatch = () => screen.queryByRole("region", { name: "AI Match – Nên kết nối hôm nay" });
const nurture = () => screen.queryByRole("region", { name: "Cần giữ kết nối" });

async function findAiMatch() {
  return await screen.findByRole("region", { name: "AI Match – Nên kết nối hôm nay" });
}

function typeSearch(value: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
}

async function chooseFilter(label: string) {
  fireEvent.click(screen.getByRole("button", { name: "Bộ lọc" }));
  fireEvent.click(await screen.findByRole("button", { name: label }));
}

beforeEach(() => {
  listAcceptedMock.mockReset();
  resolvePublicMock.mockReset();
  savedCardSearchMock.mockReset();
  todayMock.mockReset();
  seed();
});

// ── Baseline ─────────────────────────────────────────────────────────────────

describe("panel gợi ý — trạng thái mặc định", () => {
  it("hiển thị đủ hai panel với toàn bộ gợi ý khi không tìm kiếm/không lọc", async () => {
    renderNetwork();
    const strip = await findAiMatch();
    expect(within(strip).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(strip).getByText(SAVED_NAME)).toBeTruthy();

    const keep = nurture()!;
    expect(keep).toBeTruthy();
    expect(within(keep).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(keep).getByText(SAVED_NAME)).toBeTruthy();
  });
});

// ── Tìm kiếm ─────────────────────────────────────────────────────────────────

describe("panel gợi ý — theo từ khoá", () => {
  it("vẫn hiển thị khi có từ khoá và chỉ giữ người thuộc kết quả tìm kiếm", async () => {
    renderNetwork();
    await findAiMatch();
    savedCardSearchMock.mockResolvedValue([]); // server search: không có thẻ khớp
    typeSearch("binh");

    await waitFor(() => {
      const strip = aiMatch();
      expect(strip).toBeTruthy();
      expect(within(strip!).queryByText(SAVED_NAME)).toBeNull();
    });
    expect(within(aiMatch()!).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(nurture()!).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(nurture()!).queryByText(SAVED_NAME)).toBeNull();
  });

  it("ẩn cả hai panel khi từ khoá không khớp ai", async () => {
    renderNetwork();
    await findAiMatch();
    savedCardSearchMock.mockResolvedValue([]);
    typeSearch("khongtontai-zzz");

    await waitFor(() => expect(aiMatch()).toBeNull());
    expect(nurture()).toBeNull();
  });

  it("khôi phục đầy đủ hai panel sau khi xoá từ khoá", async () => {
    renderNetwork();
    await findAiMatch();
    savedCardSearchMock.mockResolvedValue([]);
    typeSearch("binh");
    await waitFor(() => expect(within(aiMatch()!).queryByText(SAVED_NAME)).toBeNull());

    savedCardSearchMock.mockResolvedValue([savedCard()]);
    fireEvent.click(screen.getByRole("button", { name: "Xóa tìm kiếm" }));
    await waitFor(() => expect(within(aiMatch()!).getByText(SAVED_NAME)).toBeTruthy());
    expect(within(nurture()!).getByText(CONNECTION_NAME)).toBeTruthy();
  });
});

// ── Bộ lọc ───────────────────────────────────────────────────────────────────

describe("panel gợi ý — theo bộ lọc nguồn quan hệ", () => {
  it('bộ lọc "Đã lưu" chỉ giữ gợi ý của người đến từ thẻ đã lưu', async () => {
    renderNetwork();
    await findAiMatch();
    await chooseFilter("Đã lưu");

    await waitFor(() => expect(within(aiMatch()!).queryByText(CONNECTION_NAME)).toBeNull());
    expect(within(aiMatch()!).getByText(SAVED_NAME)).toBeTruthy();
    expect(within(nurture()!).getByText(SAVED_NAME)).toBeTruthy();
    expect(within(nurture()!).queryByText(CONNECTION_NAME)).toBeNull();
  });

  it('bộ lọc "Mới kết nối" chỉ giữ gợi ý của kết nối', async () => {
    renderNetwork();
    await findAiMatch();
    await chooseFilter("Mới kết nối");

    await waitFor(() => expect(within(aiMatch()!).queryByText(SAVED_NAME)).toBeNull());
    expect(within(aiMatch()!).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(nurture()!).getByText(CONNECTION_NAME)).toBeTruthy();
  });

  it('bộ lọc không có ai (Quét thẻ) thì ẩn cả hai panel; chọn lại "Tất cả" khôi phục', async () => {
    renderNetwork();
    await findAiMatch();
    await chooseFilter("Quét thẻ");
    await waitFor(() => expect(aiMatch()).toBeNull());
    expect(nurture()).toBeNull();

    await chooseFilter("Tất cả");
    const strip = await findAiMatch();
    expect(within(strip).getByText(CONNECTION_NAME)).toBeTruthy();
    expect(within(strip).getByText(SAVED_NAME)).toBeTruthy();
  });
});
