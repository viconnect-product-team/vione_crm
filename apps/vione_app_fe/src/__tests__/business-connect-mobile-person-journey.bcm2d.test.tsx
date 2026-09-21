// @vitest-environment jsdom
// BC-Mobile-2D — Person Journey tests.
//
// Guards the 2D contract: authorization-first read model (fail-closed),
// READ-ONLY node resolution (never registerNode), canonical event-kind set
// (no MEETING_*, no unwired SAVED_CARD/MET), whitelist DTO (no metadata,
// node ids, or tenant fields), cursor passthrough, bounded pagination,
// per-viewer cache isolation, failure isolation from the identity hero,
// bilingual copy, and axe-clean light/dark states.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, within } from "@testing-library/react";
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
import { readFileSync } from "node:fs";
import { LangContext } from "@/lib/i18n";
import type { ReactNode } from "react";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";
import type {
  BcMobilePersonJourneyResult,
  PersonJourneyDeps,
} from "@/lib/business-connect/mobile/person-journey.types";
import {
  JOURNEY_EVENT_KINDS,
  JOURNEY_DEFAULT_LIMIT,
  JOURNEY_MAX_LIMIT,
  clampJourneyLimit,
  decodeJourneyCursor,
  encodeJourneyCursor,
  parseBcMobilePersonId,
} from "@/lib/business-connect/mobile/person-journey.types";
import { composePersonJourney } from "@/lib/business-connect/mobile/person-journey.compose";

// ── Module-boundary mocks (client side) ─────────────────────────────────────

const journeyFnMock = vi.fn();
vi.mock("@/lib/business-connect/mobile/person-journey.functions", () => ({
  bcMobilePersonJourneyFn: (...a: unknown[]) => journeyFnMock(...a),
}));

const personHookMock = vi.fn();
vi.mock("@/hooks/use-business-connect-person", () => ({
  useBusinessConnectPerson: (...a: unknown[]) => personHookMock(...a),
}));

const viewerState: { id: string | null } = { id: "viewer-a" };
vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => viewerState.id,
}));

const { PersonJourney } = await import("@/components/business-connect/mobile/PersonJourney");
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
beforeEach(() => {
  journeyFnMock.mockReset();
  personHookMock.mockReset();
  viewerState.id = "viewer-a";
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VIEWER = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const USER1 = "11111111-1111-4111-8111-111111111111";
const CARD1 = "22222222-2222-4222-8222-222222222222";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function personFixture(overrides: Partial<BcMobilePersonDetail> = {}): BcMobilePersonDetail {
  return {
    personId: `u:${USER1}`,
    kind: "connection",
    displayName: "Nguyễn Văn Bình",
    avatarUrl: null,
    headline: "CEO",
    companyName: "ABC Corporation",
    primaryCardSlug: null,
    relationship: { kind: "connected", connectedAt: daysAgo(12), requestedByViewer: true },
    contact: null,
    ...overrides,
  };
}

function okPage(
  items: { id: string; kind: "connected" | "introduction" | "card_saved"; occurredAt: string }[],
  nextCursor: string | null = null,
): BcMobilePersonJourneyResult {
  return {
    status: "ok",
    page: {
      items: items.map((i) => ({ ...i, provenance: { domain: "graph" as const } })),
      nextCursor,
    },
  };
}

// ── Render helpers ───────────────────────────────────────────────────────────

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderJourney(
  personId: string,
  lang: "vi" | "en" = "vi",
  dark = false,
  qc: QueryClient = newQueryClient(),
) {
  return render(
    <QueryClientProvider client={qc}>
      <LangContext.Provider value={{ lang, setLang: () => {} }}>
        <div className={dark ? "dark bc-app" : "bc-app"}>
          <PersonJourney personId={personId} />
        </div>
      </LangContext.Provider>
    </QueryClientProvider>,
  );
}

function renderPersonDetail(lang: "vi" | "en" = "vi", dark = false) {
  const qc = newQueryClient();
  const outlet: ReactNode = null;
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={qc}>
        <LangContext.Provider value={{ lang, setLang: () => {} }}>
          <div className={dark ? "dark bc-app" : "bc-app"}>
            <Outlet />
            {outlet}
          </div>
        </LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const personRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network/$personId",
    component: () => {
      const { personId } = personRoute.useParams();
      return <PersonDetail personId={personId} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([personRoute]),
    history: createMemoryHistory({ initialEntries: [`/connect-app/network/u:${USER1}`] }),
  });
  return render(<RouterProvider router={router} />);
}

// ════════════════════════════════════════════════════════════════════════════
// Part A — Pure composition (read model)
// ════════════════════════════════════════════════════════════════════════════

type DepsCall = { fn: ReturnType<typeof vi.fn> };

function depsFixture(overrides: Partial<PersonJourneyDeps> = {}) {
  const calls = {
    getPairState: vi.fn(async () => ({
      status: "accepted",
      blocked: false,
      direction: "outgoing",
    })),
    findPersonNodeId: vi.fn(
      async (userId: string): Promise<string | null> =>
        userId === VIEWER ? "node-viewer" : "node-target",
    ),
    listPairTimeline: vi.fn(
      async (args: {
        nodeA: string;
        nodeB: string;
        eventKinds: readonly string[];
        cursor: string | null;
        limit: number;
      }) => ({
        items: [
          // Canonical read order: occurred_at DESC (newest first).
          { id: "ev-2", eventKind: "INTRO_OUTCOME_CREATED", occurredAt: daysAgo(5) },
          { id: "ev-1", eventKind: "CONNECTED_TO", occurredAt: daysAgo(10) },
        ],
        nextCursor: null as string | null,
      }),
    ),
    findSavedCard: vi.fn(
      async () => ({ savedAt: daysAgo(3) }) as { savedAt: string | null } | null,
    ),
    // BC-Mobile-2E — default: the viewer has no moments unless a test opts in.
    listMoments: vi.fn(async () => []),
  };
  const deps: PersonJourneyDeps = { ...calls, ...overrides } as PersonJourneyDeps;
  return { deps, calls };
}

describe("composePersonJourney — connection namespace (u:)", () => {
  it("maps CONNECTED_TO → connected and INTRO_* → introduction, order preserved", async () => {
    const { deps } = depsFixture();
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items.map((i) => i.kind)).toEqual(["introduction", "connected"]);
    expect(res.page.items[0]!.occurredAt > res.page.items[1]!.occurredAt).toBe(true);
    expect(res.page.items.every((i) => i.provenance.domain === "graph")).toBe(true);
  });

  it("drops unknown event kinds defensively", async () => {
    const { deps, calls } = depsFixture();
    calls.listPairTimeline.mockResolvedValueOnce({
      items: [
        { id: "ev-x", eventKind: "MEETING_CREATED", occurredAt: daysAgo(1) },
        { id: "ev-y", eventKind: "CONNECTED_TO", occurredAt: daysAgo(2) },
      ],
      nextCursor: null,
    });
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items).toHaveLength(1);
    expect(res.page.items[0]!.kind).toBe("connected");
  });

  it("queries exactly the canonical event-kind set (no MEETING_*, no SAVED_CARD/MET)", async () => {
    const { deps, calls } = depsFixture();
    await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    const arg = calls.listPairTimeline.mock.calls[0]![0];
    expect([...arg.eventKinds].sort()).toEqual([...JOURNEY_EVENT_KINDS].sort());
    for (const k of JOURNEY_EVENT_KINDS) {
      expect(k === "CONNECTED_TO" || k.startsWith("INTRO_")).toBe(true);
    }
  });

  it("threads the composite cursor through and propagates the graph keyset; limit defaults to 5", async () => {
    // BC-Mobile-2E: cursors are the opaque composite { g, ge, lo, ms } —
    // the graph keyset travels inside `g`, never as a raw passthrough.
    const { deps, calls } = depsFixture();
    calls.listPairTimeline.mockResolvedValueOnce({ items: [], nextCursor: "cursor-2" });
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: encodeJourneyCursor({ g: "cursor-1", ge: 0, lo: null, ms: false }),
    });
    expect(calls.listPairTimeline.mock.calls[0]![0].cursor).toBe("cursor-1");
    expect(calls.listPairTimeline.mock.calls[0]![0].limit).toBe(JOURNEY_DEFAULT_LIMIT);
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(decodeJourneyCursor(res.page.nextCursor!)).toEqual({
      g: "cursor-2",
      ge: 0,
      lo: null,
      ms: false,
    });
  });

  it("clamps limit to [default 5, max 20]", () => {
    expect(clampJourneyLimit(undefined)).toBe(5);
    expect(clampJourneyLimit(0)).toBe(5);
    expect(clampJourneyLimit(-3)).toBe(5);
    expect(clampJourneyLimit(99)).toBe(JOURNEY_MAX_LIMIT);
    expect(clampJourneyLimit(7)).toBe(7);
  });

  it("fails closed when the pair is not accepted — and never touches the graph", async () => {
    for (const bad of [
      { status: "pending", blocked: false, direction: "outgoing" },
      { status: "accepted", blocked: true, direction: "outgoing" },
      { status: "accepted", blocked: false, direction: "self" },
      { status: "none", blocked: false, direction: "outgoing" },
    ]) {
      const { deps, calls } = depsFixture();
      calls.getPairState.mockResolvedValueOnce(bad);
      const res = await composePersonJourney(deps, {
        viewerUserId: VIEWER,
        personId: `u:${USER1}`,
        cursor: null,
      });
      expect(res.status).toBe("unavailable");
      expect(calls.findPersonNodeId).not.toHaveBeenCalled();
      expect(calls.listPairTimeline).not.toHaveBeenCalled();
    }
  });

  it("returns a truthful empty page when the viewer node was never registered (read-only, no write-on-read)", async () => {
    const { deps, calls } = depsFixture();
    calls.findPersonNodeId.mockImplementation(
      async (u: string): Promise<string | null> => (u === VIEWER ? null : "node-target"),
    );
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items).toEqual([]);
    expect(res.page.nextCursor).toBeNull();
    expect(calls.listPairTimeline).not.toHaveBeenCalled();
  });

  it("returns a truthful empty page when the counterpart node is missing", async () => {
    const { deps, calls } = depsFixture();
    calls.findPersonNodeId.mockImplementation(
      async (u: string): Promise<string | null> => (u === VIEWER ? "node-viewer" : null),
    );
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items).toEqual([]);
    expect(calls.listPairTimeline).not.toHaveBeenCalled();
  });
});

describe("composePersonJourney — saved-card namespace (c:)", () => {
  it("synthesizes exactly one card_saved milestone from saved_at", async () => {
    const { deps, calls } = depsFixture();
    const savedAt = daysAgo(3);
    calls.findSavedCard.mockResolvedValueOnce({ savedAt });
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `c:${CARD1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items).toEqual([
      {
        id: `card_saved:${CARD1}`,
        kind: "card_saved",
        occurredAt: savedAt,
        provenance: { domain: "saved_card" },
      },
    ]);
    expect(res.page.nextCursor).toBeNull();
    expect(calls.getPairState).not.toHaveBeenCalled();
    expect(calls.listPairTimeline).not.toHaveBeenCalled();
  });

  it("fails closed when the saved edge is not visible to this viewer", async () => {
    const { deps, calls } = depsFixture();
    calls.findSavedCard.mockResolvedValueOnce(null);
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `c:${CARD1}`,
      cursor: null,
    });
    expect(res.status).toBe("unavailable");
  });

  it("renders truthful empty when saved_at is null", async () => {
    const { deps, calls } = depsFixture();
    calls.findSavedCard.mockResolvedValueOnce({ savedAt: null });
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `c:${CARD1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.page.items).toEqual([]);
  });
});

describe("composePersonJourney — input hygiene & DTO whitelist", () => {
  it("fails closed on malformed person ids without touching any dependency", async () => {
    const { deps, calls } = depsFixture();
    for (const bad of ["", "x:abc", `u:not-a-uuid`, `c:${USER1}x`, `U:${USER1}`]) {
      const res = await composePersonJourney(deps, {
        viewerUserId: VIEWER,
        personId: bad,
        cursor: null,
      });
      expect(res.status).toBe("unavailable");
    }
    expect(calls.getPairState).not.toHaveBeenCalled();
    expect(calls.findSavedCard).not.toHaveBeenCalled();
    expect(calls.listPairTimeline).not.toHaveBeenCalled();
  });

  it("parses the same opaque ids as the 2C contract", () => {
    expect(parseBcMobilePersonId(`u:${USER1}`)).toEqual({ kind: "connection", id: USER1 });
    expect(parseBcMobilePersonId(`c:${CARD1.toUpperCase()}`)).toEqual({
      kind: "saved_card",
      id: CARD1,
    });
    expect(parseBcMobilePersonId("u:123")).toBeNull();
  });

  it("DTO exposes only whitelisted fields — no metadata, node ids, or tenant data", async () => {
    const { deps, calls } = depsFixture();
    calls.listPairTimeline.mockResolvedValueOnce({
      items: [
        {
          id: "ev-1",
          eventKind: "CONNECTED_TO",
          occurredAt: daysAgo(10),
          // fields that exist on the graph row but must NOT leak:
          subjectNodeId: "node-viewer",
          relatedNodeId: "node-target",
          metadata: { source: "manual" },
          dedupeKey: "dedupe",
        } as never,
      ],
      nextCursor: null,
    });
    const res = await composePersonJourney(deps, {
      viewerUserId: VIEWER,
      personId: `u:${USER1}`,
      cursor: null,
    });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    const item = res.page.items[0]!;
    expect(Object.keys(item).sort()).toEqual(["id", "kind", "occurredAt", "provenance"].sort());
    expect(Object.keys(item.provenance)).toEqual(["domain"]);
    const json = JSON.stringify(res.page);
    for (const forbidden of ["metadata", "subjectNodeId", "relatedNodeId", "dedupeKey", "tenant"]) {
      expect(json).not.toContain(forbidden);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Part B — Read-only / boundary static guards
// ════════════════════════════════════════════════════════════════════════════

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");

const READ_MODEL_FILES = [
  "src/lib/business-connect/mobile/person-journey.types.ts",
  "src/lib/business-connect/mobile/person-journey.compose.ts",
  "src/lib/business-connect/mobile/person-journey.server.ts",
  "src/lib/business-connect/mobile/person-journey.functions.ts",
  "src/hooks/use-business-connect-person-journey.ts",
  "src/components/business-connect/mobile/PersonJourney.tsx",
];

describe("BC-2D read-only guards (static)", () => {
  it("no write path is reachable from the read model (no registerNode/createEdge/connect)", () => {
    for (const file of READ_MODEL_FILES) {
      const src = stripComments(readFileSync(file, "utf8"));
      for (const forbidden of [
        "registerNode(",
        "ensurePersonNode(",
        "createEdge(",
        "graphRegisterNodeFn",
        "graphConnectFn",
        "graphCreateEdgeFn",
        ".connect(",
      ]) {
        expect(src, `${file} must not reference ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("client modules never import server-only modules", () => {
    for (const file of [
      "src/hooks/use-business-connect-person-journey.ts",
      "src/components/business-connect/mobile/PersonJourney.tsx",
      "src/components/business-connect/mobile/PersonDetail.tsx",
      "src/lib/business-connect/mobile/person-journey.types.ts",
      "src/lib/business-connect/mobile/person-journey.compose.ts",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} must not import a .server module`).not.toMatch(
        /from\s+"[^"]*\.server["']/,
      );
    }
  });

  it("the functions file is a thin adapter (server module only via dynamic import)", () => {
    const src = readFileSync("src/lib/business-connect/mobile/person-journey.functions.ts", "utf8");
    expect(src).not.toMatch(/^import .*person-journey\.server/m);
    expect(src).toContain('await import("./person-journey.server")');
    expect(stripComments(src)).not.toContain("GlobalConnectionService");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Part C — PersonJourney component (UI)
// ════════════════════════════════════════════════════════════════════════════

describe("PersonJourney — rendering", () => {
  it("renders milestones in Vietnamese with dates, axe-clean", async () => {
    journeyFnMock.mockResolvedValue(
      okPage([
        { id: "e1", kind: "connected", occurredAt: daysAgo(10) },
        { id: "e2", kind: "introduction", occurredAt: daysAgo(4) },
      ]),
    );
    const { container } = renderJourney(`u:${USER1}`);
    expect(await screen.findByText("Bắt đầu kết nối")).toBeTruthy();
    expect(screen.getByText("Hành trình")).toBeTruthy();
    expect(screen.getByText("Giới thiệu")).toBeTruthy();
    expect(container.querySelector("ol")).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(2);
    await expectNoViolations(container);
  });

  it("renders English labels", async () => {
    journeyFnMock.mockResolvedValue(
      okPage([
        { id: "e1", kind: "connected", occurredAt: daysAgo(10) },
        { id: "e2", kind: "card_saved", occurredAt: daysAgo(3) },
      ]),
    );
    renderJourney(`u:${USER1}`, "en");
    expect(await screen.findByText("Connected")).toBeTruthy();
    expect(screen.getByText("Journey")).toBeTruthy();
    expect(screen.getByText("Saved business card")).toBeTruthy();
  });

  it("shows the quiet empty state (VI + EN)", async () => {
    journeyFnMock.mockResolvedValue(okPage([]));
    const { unmount } = renderJourney(`u:${USER1}`);
    expect(await screen.findByText("Chưa có nhiều dấu mốc được lưu.")).toBeTruthy();
    unmount();
    renderJourney(`u:${USER1}`, "en");
    expect(await screen.findByText("Not many milestones saved yet.")).toBeTruthy();
  });

  it("renders nothing when the server says unavailable (fail-closed)", async () => {
    journeyFnMock.mockResolvedValue({
      status: "unavailable",
    } satisfies BcMobilePersonJourneyResult);
    const { container } = renderJourney(`u:${USER1}`);
    await waitFor(() => expect(journeyFnMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector("#bc-mobile-journey-heading")).toBeNull());
    expect(screen.queryByText("Hành trình")).toBeNull();
  });

  it("error state offers retry and retries on click", async () => {
    journeyFnMock.mockRejectedValue(new Error("boom"));
    renderJourney(`u:${USER1}`);
    // The hook retries once (production posture), so the error surfaces after backoff.
    expect(
      await screen.findByText("Không tải được hành trình.", {}, { timeout: 4000 }),
    ).toBeTruthy();
    const before = journeyFnMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(journeyFnMock.mock.calls.length).toBeGreaterThan(before));
  });

  it("view-more paginates with the opaque cursor and has a 44px+ target", async () => {
    journeyFnMock
      .mockResolvedValueOnce(
        okPage([{ id: "e1", kind: "connected", occurredAt: daysAgo(10) }], "cursor-2"),
      )
      .mockResolvedValueOnce(
        okPage([{ id: "e2", kind: "introduction", occurredAt: daysAgo(3) }], null),
      );
    renderJourney(`u:${USER1}`);
    const more = (await screen.findByRole("button", { name: "Xem thêm" })) as HTMLButtonElement;
    expect(more.className).toContain("min-h-11");
    fireEvent.click(more);
    expect(await screen.findByText("Giới thiệu")).toBeTruthy();
    expect(journeyFnMock).toHaveBeenCalledTimes(2);
    expect(journeyFnMock.mock.calls[1]![0]).toEqual({
      data: { personId: `u:${USER1}`, cursor: "cursor-2", limit: 5 },
    });
    expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
  });

  it("isolates the cache per viewer (account switch refetches)", async () => {
    journeyFnMock.mockResolvedValue(okPage([]));
    const qc = newQueryClient();
    const first = renderJourney(`u:${USER1}`, "vi", false, qc);
    await screen.findByText("Chưa có nhiều dấu mốc được lưu.");
    first.unmount();
    viewerState.id = "viewer-b";
    renderJourney(`u:${USER1}`, "vi", false, qc);
    await waitFor(() => expect(journeyFnMock).toHaveBeenCalledTimes(2));
  });

  it("is axe-clean in dark mode", async () => {
    journeyFnMock.mockResolvedValue(
      okPage([{ id: "e1", kind: "connected", occurredAt: daysAgo(10) }]),
    );
    const { container } = renderJourney(`u:${USER1}`, "vi", true);
    await screen.findByText("Bắt đầu kết nối");
    expect(container.querySelector(".dark")).toBeTruthy();
    await expectNoViolations(container);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Part D — PersonDetail integration (failure isolation)
// ════════════════════════════════════════════════════════════════════════════

describe("PersonDetail × PersonJourney", () => {
  it("renders the journey section inside the person page with exactly one h1", async () => {
    personHookMock.mockReturnValue({
      status: "ok",
      person: personFixture(),
      retry: vi.fn(),
    });
    journeyFnMock.mockResolvedValue(
      okPage([{ id: "e1", kind: "connected", occurredAt: daysAgo(10) }]),
    );
    renderPersonDetail();
    expect(await screen.findByText("Bắt đầu kết nối")).toBeTruthy();
    expect(screen.getByText("Hành trình")).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("journey loading never blocks the identity hero", async () => {
    personHookMock.mockReturnValue({
      status: "ok",
      person: personFixture(),
      retry: vi.fn(),
    });
    journeyFnMock.mockReturnValue(new Promise(() => {})); // never resolves
    renderPersonDetail();
    expect(await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Đang tải hành trình…" })).toBeTruthy();
  });

  it("journey error never blocks the identity hero and offers retry", async () => {
    personHookMock.mockReturnValue({
      status: "ok",
      person: personFixture(),
      retry: vi.fn(),
    });
    journeyFnMock.mockRejectedValue(new Error("boom"));
    renderPersonDetail();
    expect(await screen.findByRole("heading", { level: 1, name: "Nguyễn Văn Bình" })).toBeTruthy();
    expect(
      await screen.findByText("Không tải được hành trình.", {}, { timeout: 4000 }),
    ).toBeTruthy();
    // The person page also embeds the 6A intel section, which renders its own
    // "Thử lại" on error — scope the assertion to the journey region.
    const journeyRegion = screen.getByRole("region", { name: "Hành trình" });
    expect(within(journeyRegion).getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });
});
