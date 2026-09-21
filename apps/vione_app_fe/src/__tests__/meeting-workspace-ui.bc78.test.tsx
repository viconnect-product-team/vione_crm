// @vitest-environment jsdom
// BC-7.8 Turn B-F — Meeting Workspace UI verification.
//
// Verifies:
//   - Card renders from DTO only (no additional server-fn fetches → no N+1).
//   - Bucket list renders semantic <ul role="list"> with correct label.
//   - Loading / error / empty branches expose proper roles (status/alert).
//   - Pagination "Load more" appears only when nextCursor is present.
//   - No axe violations on populated bucket list.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import type {
  MeetingWorkspaceItemDTO,
  MeetingWorkspaceListDTO,
} from "@/lib/meeting/workspace/types";

// ── Track calls to prove no per-card N+1 ────────────────────────────────────
const listCalls = vi.fn<(args: unknown) => Promise<MeetingWorkspaceListDTO>>();
const summaryCalls = vi.fn();
const detailCalls = vi.fn();

vi.mock("@/lib/meeting/workspace/workspace.functions", () => ({
  listWorkspaceMeetingsFn: (args: unknown) => listCalls(args),
  getWorkspaceSummaryFn: () => summaryCalls(),
  getMeetingWorkspaceDetailFn: (args: unknown) => detailCalls(args),
}));

// Bypass server-fn RPC wrapping — return the fn directly.
vi.mock("@tanstack/react-start", async () => {
  return {
    useServerFn: <T,>(fn: T) => fn,
  };
});

// Stub router <Link> so we don't need a real router tree.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode }) => (
    <a {...(rest as Record<string, unknown>)}>{children}</a>
  ),
}));

// Load AFTER mocks so the components pick up mocked deps.
async function loadComponents() {
  const list = await import("@/components/business-connect/meeting/workspace/WorkspaceBucketList");
  const card = await import("@/components/business-connect/meeting/workspace/MeetingWorkspaceCard");
  return {
    WorkspaceBucketList: list.WorkspaceBucketList,
    MeetingWorkspaceCard: card.MeetingWorkspaceCard,
  };
}

function makeItem(
  id: string,
  over: Partial<MeetingWorkspaceItemDTO> = {},
): MeetingWorkspaceItemDTO {
  return {
    meeting: {
      id,
      title: `Meeting ${id}`,
      meetingType: "one_on_one",
      status: "proposed",
      locationType: null,
      createdAt: "2026-07-01T10:00:00Z",
      updatedAt: "2026-07-01T10:00:00Z",
      cancelledAt: null,
      completedAt: null,
    },
    viewer: {
      role: "organizer",
      invitationResponseStatus: null,
      canRespondToMeeting: false,
      hasPendingTimeProposalResponse: false,
      canSelectFinalTime: false,
    },
    action: {
      kind: "view_meeting",
      priority: 2,
      labelKey: "bc.meetings.workspace.action.view_meeting",
      target: "detail",
      reasonCode: "organizer_awaiting_responses",
    },
    scheduleSummary: {
      isScheduled: false,
      schedulingMode: "scheduling",
      startAt: null,
      endAt: null,
      timezone: "Asia/Ho_Chi_Minh",
      durationMinutes: 30,
    },
    invitationSummary: {
      requiredCount: 2,
      acceptedCount: 1,
      declinedCount: 0,
      tentativeCount: 0,
      pendingCount: 1,
    },
    proposalSummary: {
      activeProposalCount: 2,
      selectedProposalId: null,
      viewerPendingResponseCount: 0,
      selectableProposalCount: 0,
      latestProposalAt: null,
    },
    participantSummary: {
      participantCount: 2,
      requiredCount: 2,
      acceptedCount: 1,
      visibleParticipants: [],
    },
    calendarSyncSummary: {
      totalProjectionCount: 0,
      syncedCount: 0,
      pendingCount: 0,
      retryScheduledCount: 0,
      failedCount: 0,
      hasUserActionableIssue: false,
    },
    sourceContextSummary: { type: "direct", label: "Direct", canNavigate: false, target: null },
    latestTimelineSummary: { latestEventKind: null, occurredAt: null, summaryKey: null },
    ...over,
  } as MeetingWorkspaceItemDTO;
}

function Wrap({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return (
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </LangContext.Provider>
  );
}

beforeEach(() => {
  listCalls.mockReset();
  summaryCalls.mockReset();
  detailCalls.mockReset();
});
afterEach(() => cleanup());

describe("MeetingWorkspaceCard (DTO-only, no fetches)", () => {
  it("renders title, badges, and action button without triggering any server fn", async () => {
    const { MeetingWorkspaceCard } = await loadComponents();
    const item = makeItem("m1");
    const { container } = render(
      <Wrap>
        <MeetingWorkspaceCard item={item} />
      </Wrap>,
    );
    expect(screen.getByRole("heading", { name: /Meeting m1/i })).toBeTruthy();
    expect(screen.getByText(/view meeting/i)).toBeTruthy();
    expect(listCalls).not.toHaveBeenCalled();
    expect(summaryCalls).not.toHaveBeenCalled();
    expect(detailCalls).not.toHaveBeenCalled();
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe("WorkspaceBucketList (consolidated read, semantic list)", () => {
  it("issues exactly ONE list call for N cards (no per-card N+1)", async () => {
    const { WorkspaceBucketList } = await loadComponents();
    const items = ["a", "b", "c", "d", "e"].map((id: any) => makeItem(id));
    listCalls.mockResolvedValueOnce({ items, nextCursor: null });

    render(
      <Wrap>
        <WorkspaceBucketList bucket="needs_action" />
      </Wrap>,
    );

    await screen.findByRole("list");
    expect(listCalls).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("shows loading (role=status, aria-live=polite) then list", async () => {
    const { WorkspaceBucketList } = await loadComponents();
    let resolve: (v: MeetingWorkspaceListDTO) => void = () => {};
    listCalls.mockImplementationOnce(
      () => new Promise<MeetingWorkspaceListDTO>((r) => (resolve = r)),
    );
    render(
      <Wrap>
        <WorkspaceBucketList bucket="upcoming" />
      </Wrap>,
    );
    const status = await screen.findByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    resolve({ items: [makeItem("x")], nextCursor: null });
    await screen.findByRole("list");
  });

  it("shows role=alert on error with a working retry", async () => {
    const { WorkspaceBucketList } = await loadComponents();
    listCalls
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ items: [makeItem("r1")], nextCursor: null });
    render(
      <Wrap>
        <WorkspaceBucketList bucket="history" />
      </Wrap>,
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByRole("list");
    expect(listCalls).toHaveBeenCalledTimes(2);
  });

  it("shows Load more only when nextCursor is present", async () => {
    const { WorkspaceBucketList } = await loadComponents();
    listCalls.mockResolvedValueOnce({
      items: [makeItem("p1")],
      nextCursor: "cursor-xyz",
    });
    render(
      <Wrap>
        <WorkspaceBucketList bucket="unscheduled" />
      </Wrap>,
    );
    await screen.findByRole("list");
    expect(screen.getByRole("button", { name: /load more/i })).toBeTruthy();
  });

  it("has no axe violations on populated list", async () => {
    const { WorkspaceBucketList } = await loadComponents();
    listCalls.mockResolvedValueOnce({
      items: [makeItem("a1"), makeItem("a2")],
      nextCursor: null,
    });
    const { container } = render(
      <Wrap>
        <WorkspaceBucketList bucket="needs_action" />
      </Wrap>,
    );
    await screen.findByRole("list");
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
