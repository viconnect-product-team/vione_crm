// @vitest-environment jsdom
// BC-7.9 Turn C — Meeting Outcome + Follow-up UI unit tests.
// Focused on render-shape, empty-state authority gating, and section wiring.

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { MeetingOutcomeSection } from "@/components/business-connect/meeting/MeetingOutcomeSection";
import { MeetingFollowUpSection } from "@/components/business-connect/meeting/MeetingFollowUpSection";
import type { MeetingFollowUpDTO } from "@/lib/meeting/follow-up/types";
import type { BusinessMeetingParticipantDTO } from "@/lib/business-meetings/types";

vi.mock("@/lib/meeting/outcome/sdk", () => ({
  MeetingOutcomeSDK: {
    getOutcome: vi.fn(async () => null),
    createOutcome: vi.fn(),
    updateOutcome: vi.fn(),
    finalizeOutcome: vi.fn(),
    listFollowUps: vi.fn(async () => [] as MeetingFollowUpDTO[]),
    createFollowUp: vi.fn(),
    updateFollowUp: vi.fn(),
    setFollowUpStatus: vi.fn(),
    cancelFollowUp: vi.fn(),
  },
}));

const MEETING_ID = "00000000-0000-4000-8000-000000000001";
const VIEWER = "00000000-0000-4000-8000-000000000002";

function wrap(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{node}</LangContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe("MeetingOutcomeSection", () => {
  it("shows organizer CTA when no outcome exists and viewer is organizer", async () => {
    wrap(<MeetingOutcomeSection meetingId={MEETING_ID} isOrganizer />);
    expect(await screen.findByText(/Record an outcome/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Record outcome/i })).toBeTruthy();
  });

  it("hides CTA and shows participant copy when viewer is not organizer", async () => {
    wrap(<MeetingOutcomeSection meetingId={MEETING_ID} isOrganizer={false} />);
    expect(await screen.findByText(/organizer has not recorded/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Record outcome/i })).toBeNull();
  });
});

describe("MeetingFollowUpSection", () => {
  const participants: BusinessMeetingParticipantDTO[] = [
    {
      id: "p1",
      meetingId: MEETING_ID,
      userId: VIEWER,
      role: "organizer",
      responseStatus: "accepted",
      responseMessage: null,
      respondedAt: null,
      joinedAt: "2026-01-01T00:00:00Z",
      leftAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  it("renders empty state and Add button for participants", async () => {
    wrap(
      <MeetingFollowUpSection
        meetingId={MEETING_ID}
        viewerUserId={VIEWER}
        participants={participants}
        isViewerParticipant
      />,
    );
    expect(await screen.findByText(/No follow-up actions/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add follow-up/i })).toBeTruthy();
  });

  it("hides Add button for non-participants", async () => {
    wrap(
      <MeetingFollowUpSection
        meetingId={MEETING_ID}
        viewerUserId={VIEWER}
        participants={participants}
        isViewerParticipant={false}
      />,
    );
    expect(await screen.findByText(/No follow-up actions/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add follow-up/i })).toBeNull();
  });
});
