// @vitest-environment jsdom
// BC-Mobile-2C — Person Detail foundation tests.
//
// Guards the 2C contract: fail-closed resolution (u:/c:), unified unavailable
// state, visibility-flag gating (showContact/showSocial), URL sanitization,
// DTO whitelist, privacy boundaries (no notes/tags/ids), one-h1 semantics,
// 44px+ labelled actions, bilingual copy, and axe-clean states.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, within, act } from "@testing-library/react";
import { toast } from "sonner";
import { axe } from "jest-axe";
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
import type { ReactNode } from "react";
import type {
  CounterpartSummary,
  GlobalConnectionDTO,
  PairState,
} from "@/lib/global-network/types";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { BusinessCard, VisibilitySettings } from "@/lib/business-card/business-card.types";
import { toPublicBusinessCard, type PublicBusinessCard } from "@/lib/business-card/public-card";

// ── Module-boundary mocks ────────────────────────────────────────────────────

const getStateMock = vi.fn();
const getByIdMock = vi.fn();
const resolvePublicMock = vi.fn();
const savedSearchMock = vi.fn();
const getPublicMock = vi.fn();

vi.mock("@/lib/global-network/network.sdk", () => ({
  GlobalNetworkSDK: {
    connections: {
      getState: (...a: unknown[]) => getStateMock(...a),
      getById: (...a: unknown[]) => getByIdMock(...a),
    },
    counterparts: { resolvePublic: (...a: unknown[]) => resolvePublicMock(...a) },
  },
}));

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: { search: (...a: unknown[]) => savedSearchMock(...a) },
}));

vi.mock("@/lib/business-card/business-card.sdk", () => ({
  BusinessCardSDK: { getPublic: (...a: unknown[]) => getPublicMock(...a) },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// Spy on the shared share/download delivery so the retry test can fail the
// first attempt and succeed on retry without jsdom Share Sheet plumbing.
const vcfDeliverySpy = vi.fn();
let vcfDeliveryImpl: (() => Promise<string>) | null = null;
vi.mock("@/lib/business-connect/mobile/person-vcard", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/business-connect/mobile/person-vcard")>();
  return {
    ...orig,
    shareOrDownloadVcf: (...a: unknown[]) => {
      vcfDeliverySpy(...a);
      return vcfDeliveryImpl ? vcfDeliveryImpl() : Promise.resolve("downloaded");
    },
  };
});

const viewerState: { id: string | null } = { id: "viewer-a" };
vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => viewerState.id,
}));

const {
  useBusinessConnectPerson,
  parseBcMobilePersonId,
  sanitizePhoneHref,
  sanitizeEmailHref,
  sanitizeHttpUrl,
  hostLabelOf,
  buildPersonContact,
} = await import("@/hooks/use-business-connect-person");
const { PersonDetail } = await import("@/components/business-connect/mobile/PersonDetail");

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

const USER1 = "11111111-1111-4111-8111-111111111111";
const CARD1 = "22222222-2222-4222-8222-222222222222";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function pairState(overrides: Partial<PairState> = {}): PairState {
  return {
    targetUserId: USER1,
    status: "accepted",
    direction: "outgoing",
    connectionId: "conn-1",
    blocked: false,
    ...overrides,
  };
}

function connection(overrides: Partial<GlobalConnectionDTO> = {}): GlobalConnectionDTO {
  return {
    id: "conn-1",
    requesterUserId: "viewer-a",
    recipientUserId: USER1,
    status: "accepted",
    sourceType: "manual",
    sourceId: null,
    requestedAt: daysAgo(20),
    respondedAt: daysAgo(12),
    disconnectedAt: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(12),
    direction: "outgoing",
    counterpartUserId: USER1,
    requestedByCurrentUser: true,
    ...overrides,
  };
}

function summary(overrides: Partial<CounterpartSummary> = {}): CounterpartSummary {
  return {
    userId: USER1,
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
    targetCardId: CARD1,
    savedAt: daysAgo(5),
    favorite: true,
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
      cardId: CARD1,
      slug: "tran-minh-anh",
      cardKind: "primary",
      status: "published",
      publicMode: "public",
      displayName: "Trần Minh Anh",
      professionalTitle: "Founder",
      companyName: "XYZ Studio",
      avatarUrl: null,
      unavailable: false,
    },
    ...overrides,
  };
}

function visibility(overrides: Partial<VisibilitySettings> = {}): VisibilitySettings {
  return {
    mode: "public",
    showContact: true,
    showSocial: true,
    showServices: true,
    showNeeds: true,
    ...overrides,
  };
}

/**
 * BC-Mobile-3A — the mocked public payload is the whitelist DTO produced by
 * the server-side projection, visibility flags already applied.
 */
function publicCard(
  overrides: Partial<BusinessCard> = {},
  vis: Partial<VisibilitySettings> = {},
): PublicBusinessCard {
  return toPublicBusinessCard(fullCard({ visibilitySettings: visibility(vis), ...overrides }));
}

function fullCard(overrides: Partial<BusinessCard> = {}): BusinessCard {
  return {
    id: CARD1,
    ownerUserId: USER1,
    slug: "nguyen-van-binh",
    cardKind: "primary",
    status: "published",
    publicMode: "public",
    allowContactExchange: true,
    visibilitySettings: visibility(),
    displayName: "Nguyễn Văn Bình",
    professionalTitle: "CEO",
    companyName: "ABC Corporation",
    companyLogoUrl: null,
    avatarUrl: null,
    coverUrl: null,
    headline: "CEO",
    bio: null,
    displayNameEn: null,
    professionalTitleEn: null,
    companyNameEn: null,
    headlineEn: null,
    bioEn: null,
    website: "https://abc.example.com/about",
    workEmail: "binh@abc.example.com",
    workPhone: "+84 901 234 567",
    zaloUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/nvbinh",
    facebookUrl: null,
    youtubeUrl: null,
    tiktokUrl: null,
    address: null,
    mapUrl: null,
    themeId: null,
    customBrandColor: null,
    qrOptions: null,
    publishedAt: daysAgo(30),
    updatedAt: daysAgo(1),
    skills: [],
    services: [],
    needs: [],
    ...overrides,
  };
}

function seedAccepted({ withPublic = true }: { withPublic?: boolean } = {}) {
  getStateMock.mockResolvedValue(pairState());
  getByIdMock.mockResolvedValue(connection());
  resolvePublicMock.mockResolvedValue([summary()]);
  savedSearchMock.mockResolvedValue([]);
  getPublicMock.mockResolvedValue(
    withPublic ? { state: "public", card: publicCard() } : { state: "not_found" },
  );
}

// ── Render harness ───────────────────────────────────────────────────────────

function renderPerson(personId: string, lang: "vi" | "en" = "vi") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const networkRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network",
    component: () => <div>network-stub</div>,
  });
  const personRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network/$personId",
    component: function PersonRoute() {
      const { personId: pid } = personRoute.useParams();
      return <PersonDetail personId={pid} />;
    },
  });
  const publicCardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/b/$slug",
    component: () => <div>public-card-stub</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([networkRoute, personRoute, publicCardRoute]),
    history: createMemoryHistory({
      initialEntries: [`/connect-app/network/${encodeURIComponent(personId)}`],
    }),
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
  getStateMock.mockReset();
  getByIdMock.mockReset();
  resolvePublicMock.mockReset();
  savedSearchMock.mockReset();
  getPublicMock.mockReset();
  viewerState.id = "viewer-a";
  vcfDeliverySpy.mockReset();
  vcfDeliveryImpl = null;
  (toast.error as unknown as { mockClear(): void }).mockClear();
  (toast.success as unknown as { mockClear(): void }).mockClear();
});

// ── Pure: personId parsing ───────────────────────────────────────────────────

describe("2C parseBcMobilePersonId", () => {
  it("parses u: connection ids and lowercases the uuid", () => {
    expect(parseBcMobilePersonId(`u:${USER1.toUpperCase()}`)).toEqual({
      kind: "connection",
      id: USER1,
    });
  });

  it("parses c: saved-card ids", () => {
    expect(parseBcMobilePersonId(`c:${CARD1}`)).toEqual({ kind: "saved_card", id: CARD1 });
  });

  it("rejects malformed ids (fail-closed)", () => {
    for (const bad of [
      "",
      "u:",
      USER1,
      `x:${USER1}`,
      "u:not-a-uuid",
      `u:${USER1}x`,
      `uu:${USER1}`,
      `c:${USER1.slice(0, -1)}`,
    ]) {
      expect(parseBcMobilePersonId(bad)).toBeNull();
    }
  });
});

// ── Pure: sanitizers ─────────────────────────────────────────────────────────

describe("2C channel sanitization", () => {
  it("phone href keeps an allowlist of characters", () => {
    expect(sanitizePhoneHref("+84 (901) 234-567")).toBe("tel:+84 (901) 234-567");
    expect(sanitizePhoneHref("+84abc<script>901")).toBe("tel:+84901");
  });

  it("phone href is null for empty or trivial input", () => {
    expect(sanitizePhoneHref("")).toBeNull();
    expect(sanitizePhoneHref(null)).toBeNull();
    expect(sanitizePhoneHref("ab")).toBeNull();
  });

  it("email href accepts a single plain address", () => {
    expect(sanitizeEmailHref("binh@abc.example.com")).toBe("mailto:binh@abc.example.com");
  });

  it("email href rejects header injection, lists, and spaces", () => {
    expect(sanitizeEmailHref("a@b.com?subject=x")).toBeNull();
    expect(sanitizeEmailHref("a@b.com,b@c.com")).toBeNull();
    expect(sanitizeEmailHref("a b@c.com")).toBeNull();
    expect(sanitizeEmailHref("not-an-email")).toBeNull();
  });

  it("http url accepts https/http only", () => {
    expect(sanitizeHttpUrl("https://abc.example.com/x")).toBe("https://abc.example.com/x");
    expect(sanitizeHttpUrl("http://abc.example.com")).toBe("http://abc.example.com/");
  });

  it("http url rejects javascript:, data:, protocol-relative, userinfo", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("data:text/html,<script>")).toBeNull();
    expect(sanitizeHttpUrl("//evil.example.com")).toBeNull();
    expect(sanitizeHttpUrl("https://user:pass@evil.example.com")).toBeNull();
    expect(sanitizeHttpUrl("not a url")).toBeNull();
  });

  it("host label is host-only, never the raw string", () => {
    expect(hostLabelOf("https://abc.example.com/about?q=1")).toBe("abc.example.com");
    expect(hostLabelOf(null)).toBeNull();
  });
});

// ── Pure: contact builder (visibility gating) ───────────────────────────────

describe("2C buildPersonContact", () => {
  it("maps all channels with sanitized hrefs under default visibility", () => {
    const c = buildPersonContact(publicCard());
    expect(c).toEqual({
      phone: "+84 901 234 567",
      phoneHref: "tel:+84 901 234 567",
      email: "binh@abc.example.com",
      emailHref: "mailto:binh@abc.example.com",
      websiteLabel: "abc.example.com",
      websiteHref: "https://abc.example.com/about",
      social: [{ type: "linkedin", href: "https://www.linkedin.com/in/nvbinh" }],
    });
  });

  it("showContact=false removes phone, email, and website entirely", () => {
    const c = buildPersonContact(publicCard({}, { showContact: false }));
    expect(c.phone).toBeNull();
    expect(c.phoneHref).toBeNull();
    expect(c.email).toBeNull();
    expect(c.emailHref).toBeNull();
    expect(c.websiteHref).toBeNull();
    expect(c.websiteLabel).toBeNull();
    expect(c.social).toHaveLength(1); // social untouched
  });

  it("showSocial=false removes every social link", () => {
    const c = buildPersonContact(publicCard({}, { showSocial: false }));
    expect(c.social).toEqual([]);
    expect(c.phoneHref).not.toBeNull(); // contact untouched
  });

  it("drops unsafe social URLs by construction", () => {
    const c = buildPersonContact(
      publicCard({ linkedinUrl: "javascript:alert(1)", facebookUrl: "https://fb.example.com/x" }),
    );
    expect(c.social).toEqual([{ type: "facebook", href: "https://fb.example.com/x" }]);
  });
});

// ── Hook: fail-closed resolution ─────────────────────────────────────────────

describe("2C resolution — connection path (u:)", () => {
  it("accepted pair renders identity, narrative, and gated contact actions", async () => {
    seedAccepted();
    renderPerson(`u:${USER1}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" })).toBeTruthy();
    expect(screen.getByText("CEO")).toBeTruthy();
    expect(screen.getByText("ABC Corporation")).toBeTruthy();
    expect(screen.getByText(/Kết nối .+trước/)).toBeTruthy();
    // Contact actions from the public card projection.
    const call = screen.getByRole("link", { name: "Gọi điện" });
    expect(call.getAttribute("href")).toBe("tel:+84 901 234 567");
    expect(screen.getByRole("link", { name: "Gửi email" }).getAttribute("href")).toBe(
      "mailto:binh@abc.example.com",
    );
    expect(screen.getByRole("link", { name: "Trang web" }).getAttribute("href")).toBe(
      "https://abc.example.com/about",
    );
    expect(screen.getByRole("link", { name: "Danh thiếp" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toBeTruthy();
  });

  it("pending pair → unified unavailable (fail-closed)", async () => {
    getStateMock.mockResolvedValue(pairState({ status: "pending" }));
    renderPerson(`u:${USER1}`);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Không thể hiển thị hồ sơ này." }),
    ).toBeTruthy();
    expect(screen.queryByText("Nguyễn Văn Bình")).toBeNull();
  });

  it("blocked pair → unified unavailable", async () => {
    getStateMock.mockResolvedValue(pairState({ blocked: true }));
    renderPerson(`u:${USER1}`);
    expect(await screen.findByText("Không thể hiển thị hồ sơ này.")).toBeTruthy();
  });

  it("accepted state but unreadable connection edge → unavailable", async () => {
    getStateMock.mockResolvedValue(pairState());
    getByIdMock.mockRejectedValue(new Error("forbidden"));
    renderPerson(`u:${USER1}`);
    expect(await screen.findByText("Không thể hiển thị hồ sơ này.")).toBeTruthy();
  });

  it("counterpart without a public card degrades to the private-member fallback", async () => {
    getStateMock.mockResolvedValue(pairState());
    getByIdMock.mockResolvedValue(connection());
    resolvePublicMock.mockResolvedValue([]);
    getPublicMock.mockResolvedValue({ state: "not_found" });
    renderPerson(`u:${USER1}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Thành viên ẩn" })).toBeTruthy();
    // No contact actions without a resolvable public card.
    expect(screen.queryByRole("link", { name: "Gọi điện" })).toBeNull();
  });

  it("renders who initiated the connection", async () => {
    seedAccepted();
    renderPerson(`u:${USER1}`);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Bạn là người đã gửi lời mời kết nối.")).toBeTruthy();
  });
});

describe("2C resolution — saved-card path (c:)", () => {
  it("viewer-owned saved card renders identity + saved narrative + favorite", async () => {
    savedSearchMock.mockResolvedValue([savedCard()]);
    getPublicMock.mockResolvedValue({ state: "not_found" });
    renderPerson(`c:${CARD1}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Trần Minh Anh" })).toBeTruthy();
    expect(screen.getByText(/Đã lưu .+trước/)).toBeTruthy();
    expect(screen.getByText("Nằm trong danh sách ưa thích của bạn.")).toBeTruthy();
  });

  it("card not in the viewer's saved list → unified unavailable", async () => {
    savedSearchMock.mockResolvedValue([]);
    renderPerson(`c:${CARD1}`);
    expect(await screen.findByText("Không thể hiển thị hồ sơ này.")).toBeTruthy();
    // getState must NOT be consulted on the c: path (no user id exists there).
    expect(getStateMock).not.toHaveBeenCalled();
  });

  it("archived/stranger's card is indistinguishable from missing", async () => {
    savedSearchMock.mockResolvedValue([
      savedCard({ targetCardId: "33333333-3333-4333-8333-333333333333" }),
    ]);
    renderPerson(`c:${CARD1}`);
    expect(await screen.findByText("Không thể hiển thị hồ sơ này.")).toBeTruthy();
  });
});

describe("2C resolution — invalid ids and errors", () => {
  it("malformed personId → unified unavailable, no SDK calls", async () => {
    renderPerson("u:not-a-uuid");
    expect(await screen.findByText("Không thể hiển thị hồ sơ này.")).toBeTruthy();
    expect(getStateMock).not.toHaveBeenCalled();
    expect(savedSearchMock).not.toHaveBeenCalled();
  });

  it("transport error → error state with retry", async () => {
    getStateMock.mockRejectedValue(new Error("network down"));
    renderPerson(`u:${USER1}`);
    // The hook retries once before settling into the error state.
    expect(
      await screen.findByText("Không thể tải hồ sơ.", undefined, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });
});

// ── Privacy & visibility boundaries ──────────────────────────────────────────

describe("2C privacy boundaries", () => {
  it("members_only / not_found public card → channels omitted, page still renders", async () => {
    getStateMock.mockResolvedValue(pairState());
    getByIdMock.mockResolvedValue(connection());
    resolvePublicMock.mockResolvedValue([summary()]);
    getPublicMock.mockResolvedValue({ state: "members_only" });
    renderPerson(`u:${USER1}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Gọi điện" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Gửi email" })).toBeNull();
  });

  it("showContact=false → no tel:/mailto:/external website hrefs in the DOM", async () => {
    getStateMock.mockResolvedValue(pairState());
    getByIdMock.mockResolvedValue(connection());
    resolvePublicMock.mockResolvedValue([summary()]);
    getPublicMock.mockResolvedValue({
      state: "public",
      card: publicCard({}, { showContact: false, showSocial: false }),
    });
    const { container } = renderPerson(`u:${USER1}`);
    await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" });
    const html = container.innerHTML;
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("abc.example.com");
    expect(html).not.toContain("linkedin.com");
    expect(html).not.toContain("binh@abc");
  });

  it("never renders saved notes, tags, or any internal ids", async () => {
    savedSearchMock.mockResolvedValue([savedCard()]);
    getPublicMock.mockResolvedValue({ state: "public", card: publicCard() });
    const { container } = renderPerson(`c:${CARD1}`);
    await screen.findByRole("heading", { level: 1, name: "Trần Minh Anh" });
    const html = container.innerHTML;
    expect(html).not.toContain("SECRET NOTE XYZ");
    expect(html).not.toContain("vip");
    expect(html).not.toContain("sc-1");
    expect(html).not.toContain(CARD1);
  });

  it("connection path never leaks user ids or connection ids into the DOM", async () => {
    seedAccepted();
    const { container } = renderPerson(`u:${USER1}`);
    await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" });
    const html = container.innerHTML;
    expect(html).not.toContain(USER1);
    expect(html).not.toContain("conn-1");
    expect(html).not.toContain("viewer-a");
  });
});

// ── DTO whitelist ────────────────────────────────────────────────────────────

describe("2C DTO whitelist", () => {
  it("person DTO exposes exactly the frozen field set", async () => {
    seedAccepted();
    let captured: unknown = null;
    function Probe() {
      const r = useBusinessConnectPerson(`u:${USER1}`);
      if (r.status === "ok") captured = r.person;
      return null;
    }
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LangContext.Provider value={{ lang: "vi", setLang: () => {} }}>
          <Probe />
        </LangContext.Provider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    const person = captured as Record<string, unknown>;
    expect(Object.keys(person).sort()).toEqual(
      [
        "avatarUrl",
        "companyName",
        "contact",
        "displayName",
        "headline",
        "kind",
        "personId",
        "primaryCardSlug",
        "relationship",
      ].sort(),
    );
    const rel = person.relationship as Record<string, unknown>;
    expect(Object.keys(rel).sort()).toEqual(["connectedAt", "kind", "requestedByViewer"].sort());
    const contact = person.contact as Record<string, unknown>;
    expect(Object.keys(contact).sort()).toEqual(
      ["email", "emailHref", "phone", "phoneHref", "social", "websiteHref", "websiteLabel"].sort(),
    );
  });
});

// ── A11y & i18n ──────────────────────────────────────────────────────────────

describe("2C accessibility & i18n", () => {
  it("loaded connection page: one h1, labelled actions, axe-clean", async () => {
    seedAccepted();
    const { container } = renderPerson(`u:${USER1}`);
    await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" });
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    for (const a of Array.from(container.querySelectorAll("a"))) {
      const name = a.getAttribute("aria-label") ?? a.textContent ?? "";
      expect(name.trim().length).toBeGreaterThan(0);
    }
    await expectNoViolations(container);
  });

  it("loaded saved-card page is axe-clean", async () => {
    savedSearchMock.mockResolvedValue([savedCard()]);
    getPublicMock.mockResolvedValue({ state: "public", card: publicCard() });
    const { container } = renderPerson(`c:${CARD1}`);
    await screen.findByRole("heading", { level: 1, name: "Trần Minh Anh" });
    await expectNoViolations(container);
  });

  it("unavailable state is axe-clean and bilingual", async () => {
    savedSearchMock.mockResolvedValue([]);
    const { container, unmount } = renderPerson(`c:${CARD1}`, "en");
    expect(
      await screen.findByRole("heading", { level: 1, name: "This profile can't be shown." }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to Network" })).toBeTruthy();
    await expectNoViolations(container);
    unmount();
  });

  it("contact actions are labelled in English under en lang", async () => {
    seedAccepted();
    renderPerson(`u:${USER1}`, "en");
    await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" });
    expect(screen.getByRole("link", { name: "Call" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Email" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Website" })).toBeTruthy();
  });
});

// ── .vcf export — failure toast retry ────────────────────────────────────────

describe("2C — .vcf export failure toast retry", () => {
  it("offers a one-tap Retry on the failure toast that re-runs the same export", async () => {
    let attempts = 0;
    vcfDeliveryImpl = () => {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error("share sheet unavailable"))
        : Promise.resolve("shared");
    };
    seedAccepted();
    renderPerson(`u:${USER1}`, "en");

    fireEvent.click(await screen.findByRole("button", { name: /export contact \(\.vcf\)/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /share \/ download/i }));

    // First attempt fails: the error toast carries a Retry action; sheet closed.
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [message, options] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, { action: { label: string; onClick: () => void } }];
    expect(message).toBe("Couldn't export the contact. Please try again.");
    expect(options.action.label).toBe("Retry");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(vcfDeliverySpy).toHaveBeenCalledTimes(1);

    // One tap on Retry re-opens the preview sheet and re-delivers the same file.
    await act(async () => {
      options.action.onClick();
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Contact shared (.vcf)"));
    expect(vcfDeliverySpy).toHaveBeenCalledTimes(2);
    const [firstVcf, firstName] = vcfDeliverySpy.mock.calls[0] as [string, string];
    const [retryVcf, retryName] = vcfDeliverySpy.mock.calls[1] as [string, string];
    expect(retryVcf).toBe(firstVcf);
    expect(retryName).toBe(firstName);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
