// @vitest-environment jsdom
// BC-Mobile-7B — Viewer cache isolation & bounded invalidation tests.
//
// RELEASE BLOCKER coverage:
//  - every 7B query key is scoped by authenticated viewer + communityRef
//  - account switch A→B→A without reload: B never inherits A's REGISTERED /
//    interested state; queries refetch under B-scoped keys; A's authoritative
//    state is intact on switch-back (no manual cache clearing)
//  - cross-community isolation even with overlapping refs in fixtures
//  - late-response race: A's in-flight response resolving after the switch
//    lands in A's key and never renders into B's UI
//  - mutation invalidation is bounded (exact keys, never global)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, cleanup, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  CommunityActivityPreviewDTO,
  CommunityEventDetailDTO,
  CommunityEventPageDTO,
  CommunityEventRegistrationStateDTO,
  CommunityEventSummaryDTO,
  CommunityOpportunityDetailDTO,
  CommunityOpportunityPageDTO,
  CommunityOpportunitySummaryDTO,
} from "@/lib/business-connect/mobile/community-activity.types";

// ── Server-truth simulation (token-scoped backend) ───────────────────────────
// The real backend derives the viewer from the bearer token; here the mocks
// resolve per `truth.viewer`, and registrations/interests flip `truth` so a
// post-mutation refetch returns the mutated canonical state.

const truth = {
  viewer: "user-a" as "user-a" | "user-b",
  aRegistered: true, // USER A registered for Event X
  aInterested: true, // USER A interested in Opportunity Y
};

const viewerState: { id: string | null } = { id: "user-a" };

const listEventsMock = vi.fn();
const getEventDetailMock = vi.fn();
const registerEventMock = vi.fn();
const listOpportunitiesMock = vi.fn();
const getOpportunityDetailMock = vi.fn();
const expressInterestMock = vi.fn();
const getActivityPreviewMock = vi.fn();

vi.mock("@/lib/business-connect/mobile/community.sdk", () => ({
  CommunitySDK: {
    listEvents: (a: unknown) => listEventsMock(a),
    getEventDetail: (a: unknown) => getEventDetailMock(a),
    registerForEvent: (a: unknown) => registerEventMock(a),
    listOpportunities: (a: unknown) => listOpportunitiesMock(a),
    getOpportunityDetail: (a: unknown) => getOpportunityDetailMock(a),
    expressInterest: (a: unknown) => expressInterestMock(a),
    getActivityPreview: (a: unknown) => getActivityPreviewMock(a),
  },
}));

// 7A chain imports these at module scope — stub the boundaries.
vi.mock("@/lib/global-network/network.sdk", () => ({ GlobalNetworkSDK: {} }));
vi.mock("@/lib/business-card/saved-card.sdk", () => ({ SavedCardSDK: {} }));
vi.mock("@/lib/business-card/guest-contact.sdk", () => ({ GuestContactSDK: {} }));

vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => viewerState.id,
}));

// Imported AFTER the mocks so hooks receive the stubbed boundaries.
const {
  communityActivityKeys,
  useCommunityEvents,
  useCommunityEventDetail,
  useCommunityOpportunities,
  useCommunityOpportunityDetail,
  useCommunityActivityPreview,
} = await import("@/hooks/use-community-activity");
const { communityKeys } = await import("@/hooks/use-community");

afterEach(cleanup);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const COMMUNITY_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMMUNITY_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EVENT_X = "evt-x";
const OPP_Y = "opp-y";

function eventSummary(
  registrationState: CommunityEventRegistrationStateDTO,
  communityId = COMMUNITY_A,
): CommunityEventSummaryDTO {
  return {
    eventRef: EVENT_X,
    title: `CEO Dinner @${communityId}`,
    startAt: "2026-09-18",
    locationLabel: "Hanoi",
    formatLabel: "dinner",
    registrationState,
    capacityState: "open",
  };
}

function eventPage(registrationState: CommunityEventRegistrationStateDTO): CommunityEventPageDTO {
  return { items: [eventSummary(registrationState)], totalCount: 1, nextOffset: null };
}

function eventDetail(
  registrationState: CommunityEventRegistrationStateDTO,
): CommunityEventDetailDTO {
  return {
    event: eventSummary(registrationState),
    communityId: COMMUNITY_A,
    communityName: "Hiệp hội A",
    canRegister: registrationState === "available",
    checkinHandoff: registrationState === "registered",
  };
}

function oppSummary(interested: boolean): CommunityOpportunitySummaryDTO {
  return {
    opportunityRef: OPP_Y,
    title: "Tìm đối tác triển khai ERP",
    categoryKey: "opp.type.partnership",
    organizationLabel: "ViOne",
    shortDescription: "Cần đối tác triển khai.",
    publishedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-30T00:00:00.000Z",
    daysLeft: 51,
    interested,
    interestLevel: interested ? "high" : null,
  };
}

function oppPage(interested: boolean): CommunityOpportunityPageDTO {
  return { items: [oppSummary(interested)], totalCount: 1, nextOffset: null };
}

function oppDetail(interested: boolean): CommunityOpportunityDetailDTO {
  return {
    opportunity: oppSummary(interested),
    description: "Mô tả đầy đủ.",
    regionLabel: "Hà Nội",
    industryLabel: "Công nghệ",
    budgetMin: 500_000_000,
    budgetMax: 900_000_000,
    poster: { memberRef: "member-poster-1", displayName: "Người đăng" },
    communityId: COMMUNITY_A,
    communityName: "Hiệp hội A",
    canExpressInterest: !interested,
    followUp: null,
    followUpHistory: [],
    followUpAttachments: [],
  };
}

function preview(
  registrationState: CommunityEventRegistrationStateDTO,
): CommunityActivityPreviewDTO {
  return { nextEvents: [eventSummary(registrationState)], openOpportunities: [] };
}

/** What the canonical backend would answer for the CURRENT truth.viewer. */
function viewerRegistrationState(): CommunityEventRegistrationStateDTO {
  return truth.viewer === "user-a" && truth.aRegistered ? "registered" : "available";
}
function viewerInterested(): boolean {
  return truth.viewer === "user-a" && truth.aInterested;
}

function defaultMockImpls() {
  listEventsMock.mockImplementation(() => Promise.resolve(eventPage(viewerRegistrationState())));
  getEventDetailMock.mockImplementation(() =>
    Promise.resolve(eventDetail(viewerRegistrationState())),
  );
  registerEventMock.mockImplementation(() => {
    if (truth.viewer === "user-a") truth.aRegistered = true;
    return Promise.resolve({ ok: true as const });
  });
  listOpportunitiesMock.mockImplementation(() => Promise.resolve(oppPage(viewerInterested())));
  getOpportunityDetailMock.mockImplementation(() => Promise.resolve(oppDetail(viewerInterested())));
  expressInterestMock.mockImplementation(() => {
    if (truth.viewer === "user-a") truth.aInterested = true;
    return Promise.resolve({ ok: true as const });
  });
  getActivityPreviewMock.mockImplementation(() =>
    Promise.resolve(preview(viewerRegistrationState())),
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function switchViewer(id: "user-a" | "user-b") {
  viewerState.id = id;
  truth.viewer = id;
}

beforeEach(() => {
  vi.clearAllMocks();
  truth.aRegistered = true;
  truth.aInterested = true;
  switchViewer("user-a");
  defaultMockImpls();
});

const keyOf = (k: readonly unknown[]) => JSON.stringify(k);

// ── 1. Key structure ─────────────────────────────────────────────────────────

describe("viewer-scoped query keys", () => {
  it("every viewer-dependent key embeds viewerUserId AND communityRef", () => {
    const a = "user-a";
    const b = "user-b";
    const keys = [
      communityActivityKeys.events(a, COMMUNITY_A, "upcoming"),
      communityActivityKeys.events(a, COMMUNITY_A, "registered"),
      communityActivityKeys.event(a, COMMUNITY_A, EVENT_X),
      communityActivityKeys.opportunities(a, COMMUNITY_A, ""),
      communityActivityKeys.opportunity(a, COMMUNITY_A, OPP_Y),
      communityActivityKeys.preview(a, COMMUNITY_A),
    ];
    for (const k of keys) {
      expect(k).toContain(a);
      expect(k).toContain(COMMUNITY_A);
    }
    // viewer switch → every key changes
    expect(keyOf(communityActivityKeys.events(a, COMMUNITY_A, "upcoming"))).not.toBe(
      keyOf(communityActivityKeys.events(b, COMMUNITY_A, "upcoming")),
    );
    expect(keyOf(communityActivityKeys.event(a, COMMUNITY_A, EVENT_X))).not.toBe(
      keyOf(communityActivityKeys.event(b, COMMUNITY_A, EVENT_X)),
    );
    expect(keyOf(communityActivityKeys.opportunity(a, COMMUNITY_A, OPP_Y))).not.toBe(
      keyOf(communityActivityKeys.opportunity(b, COMMUNITY_A, OPP_Y)),
    );
    expect(keyOf(communityActivityKeys.preview(a, COMMUNITY_A))).not.toBe(
      keyOf(communityActivityKeys.preview(b, COMMUNITY_A)),
    );
    // community switch → every key changes
    expect(keyOf(communityActivityKeys.events(a, COMMUNITY_A, "upcoming"))).not.toBe(
      keyOf(communityActivityKeys.events(a, COMMUNITY_B, "upcoming")),
    );
    expect(keyOf(communityActivityKeys.opportunity(a, COMMUNITY_A, OPP_Y))).not.toBe(
      keyOf(communityActivityKeys.opportunity(a, COMMUNITY_B, OPP_Y)),
    );
    expect(keyOf(communityActivityKeys.preview(a, COMMUNITY_A))).not.toBe(
      keyOf(communityActivityKeys.preview(a, COMMUNITY_B)),
    );
  });

  it("queries stay disabled while the viewer is unknown (no unscoped fetch)", () => {
    const queryClient = makeQueryClient();
    viewerState.id = null;
    const { result } = renderHook(() => useCommunityEvents(COMMUNITY_A, "upcoming"), {
      wrapper: wrapperFor(queryClient),
    });
    expect(result.current.initialLoading).toBe(false);
    expect(listEventsMock).not.toHaveBeenCalled();
  });
});

// ── 2. Account-switch adversarial tests ──────────────────────────────────────

describe("account switch A→B→A (no reload, no manual cache clearing)", () => {
  it("events list: B never inherits A's REGISTERED state; A intact on switch-back", async () => {
    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(() => useCommunityEvents(COMMUNITY_A, "upcoming"), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(result.current.events[0].registrationState).toBe("registered"); // A truth

    switchViewer("user-b");
    rerender();
    await waitFor(() => expect(result.current.events[0]?.registrationState).toBe("available"));
    // refetched under the B-scoped key
    expect(listEventsMock).toHaveBeenCalledTimes(2);
    // B's cache entry holds B's state, A's entry still holds A's
    const aEntry = queryClient.getQueryData(
      communityActivityKeys.events("user-a", COMMUNITY_A, "upcoming"),
    ) as { pages: CommunityEventPageDTO[] } | undefined;
    const bEntry = queryClient.getQueryData(
      communityActivityKeys.events("user-b", COMMUNITY_A, "upcoming"),
    ) as { pages: CommunityEventPageDTO[] } | undefined;
    expect(aEntry?.pages[0].items[0].registrationState).toBe("registered");
    expect(bEntry?.pages[0].items[0].registrationState).toBe("available");

    switchViewer("user-a");
    rerender();
    await waitFor(() => expect(result.current.events[0]?.registrationState).toBe("registered"));
    // no third fetch needed — A's scoped cache is authoritative
    expect(listEventsMock).toHaveBeenCalledTimes(2);
  });

  it("event detail: B never inherits A's viewer state (canRegister / checkinHandoff)", async () => {
    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(() => useCommunityEventDetail(COMMUNITY_A, EVENT_X), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.detail?.event.registrationState).toBe("registered");
    expect(result.current.detail?.checkinHandoff).toBe(true);

    switchViewer("user-b");
    rerender();
    await waitFor(() => expect(result.current.detail?.event.registrationState).toBe("available"));
    expect(result.current.detail?.canRegister).toBe(true);
    expect(result.current.detail?.checkinHandoff).toBe(false);
    expect(getEventDetailMock).toHaveBeenCalledTimes(2);

    switchViewer("user-a");
    rerender();
    await waitFor(() => expect(result.current.detail?.event.registrationState).toBe("registered"));
  });

  it("opportunities list: B never inherits A's interested state", async () => {
    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(() => useCommunityOpportunities(COMMUNITY_A, ""), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.opportunities).toHaveLength(1));
    expect(result.current.opportunities[0].interested).toBe(true);

    switchViewer("user-b");
    rerender();
    await waitFor(() => expect(result.current.opportunities[0]?.interested).toBe(false));
    expect(listOpportunitiesMock).toHaveBeenCalledTimes(2);

    switchViewer("user-a");
    rerender();
    await waitFor(() => expect(result.current.opportunities[0]?.interested).toBe(true));
  });

  it("opportunity detail: B never inherits A's interested state", async () => {
    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(
      () => useCommunityOpportunityDetail(COMMUNITY_A, OPP_Y),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.detail?.opportunity.interested).toBe(true);
    expect(result.current.detail?.canExpressInterest).toBe(false);

    switchViewer("user-b");
    rerender();
    await waitFor(() => expect(result.current.detail?.opportunity.interested).toBe(false));
    expect(result.current.detail?.canExpressInterest).toBe(true);
    expect(getOpportunityDetailMock).toHaveBeenCalledTimes(2);

    switchViewer("user-a");
    rerender();
    await waitFor(() => expect(result.current.detail?.opportunity.interested).toBe(true));
  });

  it("community preview: B never inherits A's REGISTERED preview state", async () => {
    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(() => useCommunityActivityPreview(COMMUNITY_A), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.preview).not.toBeNull());
    expect(result.current.preview?.nextEvents[0].registrationState).toBe("registered");

    switchViewer("user-b");
    rerender();
    await waitFor(() =>
      expect(result.current.preview?.nextEvents[0]?.registrationState).toBe("available"),
    );
    expect(getActivityPreviewMock).toHaveBeenCalledTimes(2);
  });
});

// ── 3. Cross-community cache isolation ───────────────────────────────────────

describe("cross-community cache isolation", () => {
  it("same viewer + overlapping eventRef: community B never reuses community A state", async () => {
    const queryClient = makeQueryClient();
    truth.aRegistered = true; // registered in COMMUNITY_A only
    listEventsMock.mockImplementation((input: { communityId: string }) =>
      Promise.resolve(
        input.communityId === COMMUNITY_A ? eventPage("registered") : eventPage("available"),
      ),
    );

    const { result, rerender } = renderHook(
      ({ communityId }) => useCommunityEvents(communityId, "upcoming"),
      { wrapper: wrapperFor(queryClient), initialProps: { communityId: COMMUNITY_A } },
    );
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(result.current.events[0].registrationState).toBe("registered");

    // rapid navigation to community B with the SAME eventRef in the fixture
    rerender({ communityId: COMMUNITY_B });
    await waitFor(() => expect(result.current.events[0]?.registrationState).toBe("available"));
    expect(listEventsMock).toHaveBeenCalledTimes(2);

    const aEntry = queryClient.getQueryData(
      communityActivityKeys.events("user-a", COMMUNITY_A, "upcoming"),
    ) as { pages: CommunityEventPageDTO[] } | undefined;
    const bEntry = queryClient.getQueryData(
      communityActivityKeys.events("user-a", COMMUNITY_B, "upcoming"),
    ) as { pages: CommunityEventPageDTO[] } | undefined;
    expect(aEntry?.pages[0].items[0].registrationState).toBe("registered");
    expect(bEntry?.pages[0].items[0].registrationState).toBe("available");
  });

  it("opportunity detail is scoped per community even with identical refs", async () => {
    const queryClient = makeQueryClient();
    getOpportunityDetailMock.mockImplementation((input: { communityId: string }) =>
      Promise.resolve({
        ...oppDetail(input.communityId === COMMUNITY_A),
        communityId: input.communityId,
      }),
    );
    const { result, rerender } = renderHook(
      ({ communityId }) => useCommunityOpportunityDetail(communityId, OPP_Y),
      { wrapper: wrapperFor(queryClient), initialProps: { communityId: COMMUNITY_A } },
    );
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.detail?.opportunity.interested).toBe(true);

    rerender({ communityId: COMMUNITY_B });
    await waitFor(() => expect(result.current.detail?.opportunity.interested).toBe(false));
    expect(getOpportunityDetailMock).toHaveBeenCalledTimes(2);
  });
});

// ── 4. Late-response race ────────────────────────────────────────────────────

describe("late-response race (A in-flight → switch to B → A resolves late)", () => {
  it("A's late response never renders into B's UI", async () => {
    const queryClient = makeQueryClient();
    let resolveLateA: ((dto: CommunityEventDetailDTO) => void) | null = null;
    getEventDetailMock.mockReset();
    getEventDetailMock.mockImplementation(() => {
      if (truth.viewer === "user-a" && !resolveLateA) {
        return new Promise<CommunityEventDetailDTO>((res) => {
          resolveLateA = res;
        });
      }
      return Promise.resolve(eventDetail(viewerRegistrationState()));
    });

    const { result, rerender } = renderHook(() => useCommunityEventDetail(COMMUNITY_A, EVENT_X), {
      wrapper: wrapperFor(queryClient),
    });
    // A's request is in flight (pending)
    expect(result.current.detail).toBeNull();

    // account switches to B before A responds; B resolves promptly
    switchViewer("user-b");
    rerender();
    await waitFor(() => expect(result.current.detail?.event.registrationState).toBe("available"));

    // A's response finishes LATE — it must land in A's key only
    const lateA = eventDetail("registered");
    await act(async () => {
      resolveLateA?.(lateA);
    });
    await waitFor(() =>
      expect(
        queryClient.getQueryData(communityActivityKeys.event("user-a", COMMUNITY_A, EVENT_X)),
      ).toEqual(lateA),
    );

    // B's UI is untouched by A's late payload
    expect(result.current.detail?.event.registrationState).toBe("available");
    expect(result.current.detail?.checkinHandoff).toBe(false);
    expect(
      queryClient.getQueryData(communityActivityKeys.event("user-b", COMMUNITY_A, EVENT_X)),
    ).toEqual(eventDetail("available"));
  });
});

// ── 5. Bounded mutation invalidation ─────────────────────────────────────────

describe("bounded mutation invalidation (exact keys, never global)", () => {
  it("EVENT REGISTER SUCCESS invalidates exactly: detail + eventsRoot + preview + community detail", async () => {
    const queryClient = makeQueryClient();
    truth.aRegistered = false; // A not yet registered
    const { result } = renderHook(() => useCommunityEventDetail(COMMUNITY_A, EVENT_X), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.detail?.event.registrationState).toBe("available");

    const spy = vi.spyOn(queryClient, "invalidateQueries");
    await act(async () => {
      await result.current.register.mutateAsync();
    });

    const invalidated = spy.mock.calls.map((c: any) => keyOf(c[0]?.queryKey as readonly unknown[]));
    expect(new Set(invalidated)).toEqual(
      new Set([
        keyOf(communityActivityKeys.event("user-a", COMMUNITY_A, EVENT_X)),
        keyOf(communityActivityKeys.eventsRoot),
        keyOf(communityActivityKeys.preview("user-a", COMMUNITY_A)),
        keyOf(communityKeys.detail("user-a", COMMUNITY_A)),
      ]),
    );
    // never a global / root-level reset
    for (const call of spy.mock.calls) {
      expect(call[0]?.queryKey).toBeDefined();
      expect(call[0]?.queryKey).not.toEqual(["bc-mobile"]);
    }
    // canonical truth flipped → the active detail refetches into REGISTERED
    await waitFor(() => expect(result.current.detail?.event.registrationState).toBe("registered"));
  });

  it("OPPORTUNITY INTEREST SUCCESS invalidates exactly: detail + opportunitiesRoot + preview", async () => {
    const queryClient = makeQueryClient();
    truth.aInterested = false; // A not yet interested
    const { result } = renderHook(() => useCommunityOpportunityDetail(COMMUNITY_A, OPP_Y), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.detail?.opportunity.interested).toBe(false);

    const spy = vi.spyOn(queryClient, "invalidateQueries");
    await act(async () => {
      await result.current.interest.mutateAsync("high");
    });

    const invalidated = spy.mock.calls.map((c: any) => keyOf(c[0]?.queryKey as readonly unknown[]));
    expect(new Set(invalidated)).toEqual(
      new Set([
        keyOf(communityActivityKeys.opportunity("user-a", COMMUNITY_A, OPP_Y)),
        keyOf(communityActivityKeys.opportunitiesRoot),
        keyOf(communityActivityKeys.preview("user-a", COMMUNITY_A)),
      ]),
    );
    for (const call of spy.mock.calls) {
      expect(call[0]?.queryKey).toBeDefined();
      expect(call[0]?.queryKey).not.toEqual(["bc-mobile"]);
    }
    await waitFor(() => expect(result.current.detail?.opportunity.interested).toBe(true));
  });

  it("register mutation calls the canonical SDK with communityId + eventRef only", async () => {
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useCommunityEventDetail(COMMUNITY_A, EVENT_X), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    await act(async () => {
      await result.current.register.mutateAsync();
    });
    expect(registerEventMock).toHaveBeenCalledWith({
      communityId: COMMUNITY_A,
      eventRef: EVENT_X,
    });
  });

  it("interest mutation calls the canonical SDK with communityId + opportunityRef + level only", async () => {
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useCommunityOpportunityDetail(COMMUNITY_A, OPP_Y), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.detail).not.toBeNull());
    await act(async () => {
      await result.current.interest.mutateAsync("high");
    });
    expect(expressInterestMock).toHaveBeenCalledWith({
      communityId: COMMUNITY_A,
      opportunityRef: OPP_Y,
      interestLevel: "high",
    });
  });
});
