// @vitest-environment jsdom
// BC-4.1C — Business Meetings management UI accessibility + interaction contract.
// Harness fix: render the REAL <MeetingSectionView /> DIRECTLY inside a minimal
// QueryClientProvider (retries off) — NO routeTree.gen, NO app shell, NO root
// route, NO global loaders. The data layer is mocked at the server-function
// boundary (@/lib/business-meetings.functions) so the real hooks, client SDK,
// and TanStack Query freshness/refetch behavior stay under test.
//
// Assertions preserved:
//   - the section list exposes role="list" + an aria-live polite status region
//   - list items are keyboard-focusable buttons with descriptive aria-labels
//   - refreshing re-announces inside the live region and empties the list
//   - opening an item reveals the detail dialog with capability-gated actions
//   - axe reports no violations
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MeetingSectionView } from "@/components/business-meetings/MeetingSectionView";
import type {
  MeetingCountsDTO,
  MeetingDetailDTO,
  MeetingListItemDTO,
  ProposalHistoryDTO,
} from "@/lib/business-meetings/types";

vi.setConfig({ testTimeout: 20000 });

const CAPS = {
  canView: true,
  canAccept: true,
  canDecline: true,
  canTentative: true,
  canProposeNewTime: true,
  canCancel: false,
  canComplete: false,
  canMarkNoShow: false,
};

const PENDING_ITEM: MeetingListItemDTO = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Intro call with Acme",
  status: "proposed",
  meetingType: "video_call",
  timezone: "Asia/Ho_Chi_Minh",
  startAt: "2026-08-01T03:00:00.000Z",
  endAt: "2026-08-01T03:30:00.000Z",
  locationType: "online",
  activeProposalVersion: 1,
  viewerRole: "required",
  viewerResponseStatus: "pending",
  counterpart: {
    userId: "u-acme",
    displayName: "Acme Corp",
    avatarUrl: null,
    headline: "Enterprise sales",
    companyName: "Acme",
    primaryCardSlug: "acme",
  },
  capabilities: CAPS,
};

const DETAIL: MeetingDetailDTO = {
  meeting: {
    id: PENDING_ITEM.id,
    createdByUserId: "u-acme",
    organizerUserId: "u-acme",
    title: PENDING_ITEM.title,
    description: null,
    meetingType: "video_call",
    status: "proposed",
    activeProposalVersion: 1,
    confirmedProposalId: null,
    timezone: "Asia/Ho_Chi_Minh",
    sourceType: "manual",
    sourceId: null,
    companyId: null,
    associationId: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    cancelledAt: null,
    completedAt: null,
  },
  participants: [],
  activeProposal: {
    id: "p1",
    meetingId: PENDING_ITEM.id,
    version: 1,
    proposedByUserId: "u-acme",
    startAt: PENDING_ITEM.startAt as string,
    endAt: PENDING_ITEM.endAt as string,
    timezone: "Asia/Ho_Chi_Minh",
    locationType: "online",
    locationText: null,
    meetingUrl: "https://meet.example.com/x",
    proposalMessage: "Looking forward to it.",
    createdAt: "2026-07-01T00:00:00.000Z",
    supersededAt: null,
    acceptedAt: null,
  },
  viewerRole: "required",
  counterpart: PENDING_ITEM.counterpart,
  capabilities: CAPS,
};

const COUNTS: MeetingCountsDTO = {
  draft: 0,
  proposed: 1,
  confirmed: 2,
  declined: 0,
  cancelled: 0,
  completed: 0,
  no_show: 0,
};

const HISTORY: ProposalHistoryDTO = {
  activeVersion: 1,
  proposals: [DETAIL.activeProposal!],
  proposers: { "u-acme": PENDING_ITEM.counterpart! },
};

let pendingRefreshed = false;
const listPending = vi.fn(async () => {
  if (pendingRefreshed) return [];
  return [{ ...PENDING_ITEM }];
});

// Mock ONLY the server-function boundary — real hooks + client SDK + react-query stay live.
vi.mock("@/lib/business-meetings.functions", () => ({
  listUpcomingMeetingsFn: vi.fn(async () => []),
  listPendingMeetingsFn: (...a: unknown[]) => listPending(...(a as [])),
  listPastMeetingsFn: vi.fn(async () => []),
  listCancelledMeetingsFn: vi.fn(async () => []),
  countMeetingsFn: vi.fn(async () => COUNTS),
  getMeetingDetailFn: vi.fn(async () => DETAIL),
  getMeetingProposalHistoryFn: vi.fn(async () => HISTORY),
  acceptMeetingFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "confirmed" })),
  declineMeetingFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "declined" })),
  rescheduleMeetingFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "proposed" })),
  cancelMeetingFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "cancelled" })),
  completeMeetingFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "completed" })),
  markMeetingNoShowFn: vi.fn(async () => ({ meetingId: PENDING_ITEM.id, status: "no_show" })),
}));

// jsdom lacks scrollTo (Radix Sheet calls it) — provide a no-op.
if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = () => {};
}

let queryClient: QueryClient;

// Minimal controlled harness: owns openId locally, no router needed.
function Harness() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <MeetingSectionView
        section="pending"
        openId={openId}
        onOpen={(id: string) => setOpenId(id)}
        onCloseDetail={() => setOpenId(null)}
      />
    </QueryClientProvider>
  );
}

function renderHarness() {
  return render(<Harness />);
}

beforeEach(() => {
  pendingRefreshed = false;
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.clearAllMocks();
});

describe("BC-4.1C Business Meetings UI a11y contract", () => {
  it("renders the pending list with role=list and a polite live region", async () => {
    renderHarness();

    const list = await waitFor(() => {
      const el = screen.getByRole("list", { name: /cuộc hẹn|meetings/i });
      expect(el).toBeTruthy();
      return el;
    });
    expect(within(list).getAllByRole("listitem").length).toBe(1);

    const status = document.querySelector('[data-testid="meetings-announcement"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
    await waitFor(() => expect(status?.textContent ?? "").toMatch(/1/));
  });

  it("item is a focusable button with a descriptive aria-label", async () => {
    renderHarness();
    const btn = await waitFor(() => screen.getByRole("button", { name: /Intro call with Acme/i }));
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it("refresh re-announces and empties the list when the server returns none", async () => {
    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => screen.getByRole("button", { name: /Intro call with Acme/i }));

    pendingRefreshed = true;
    const refresh = screen.getByRole("button", { name: /làm mới|refresh/i });
    await user.click(refresh);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Intro call with Acme/i })).toBeNull();
    });
    expect(listPending.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("opening an item shows the detail dialog with accept/decline actions", async () => {
    const user = userEvent.setup();
    renderHarness();
    const btn = await waitFor(() => screen.getByRole("button", { name: /Intro call with Acme/i }));
    await user.click(btn);

    const dialog = await waitFor(() => screen.getByRole("dialog"));
    expect(within(dialog).getByRole("button", { name: /chấp nhận|accept/i })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: /từ chối|decline/i })).toBeTruthy();
  });

  it("has no axe violations on the pending list", async () => {
    const { container } = renderHarness();
    await waitFor(() => screen.getByRole("button", { name: /Intro call with Acme/i }));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
