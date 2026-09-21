// BC-7.8 Turn A — Meeting Workspace derivation contract tests.
// Pure logic only: bucket derivation + action resolver + SDK freeze.

import { describe, expect, it } from "vitest";
import { deriveBucket, isTerminalMeetingStatus } from "@/lib/meeting/workspace/buckets";
import {
  resolveMeetingWorkspaceAction,
  type ResolveMeetingActionInput,
} from "@/lib/meeting/workspace/action-resolver";
import {
  MEETING_WORKSPACE_ACTION_KINDS,
  MEETING_WORKSPACE_ACTION_LABEL_KEYS,
  MEETING_WORKSPACE_ACTION_PRIORITY,
} from "@/lib/meeting/workspace/action-registry";
import { MeetingWorkspaceSDK, MEETING_WORKSPACE_SDK_METHODS } from "@/lib/meeting/workspace/sdk";

const NOW = "2026-07-15T10:00:00.000Z";
const FUTURE = "2026-07-15T15:00:00.000Z";
const PAST = "2026-07-15T05:00:00.000Z";

const baseAction: ResolveMeetingActionInput = {
  status: "proposed",
  viewerRole: "required",
  viewerInvitationResponse: "accepted",
  schedulingMode: "unscheduled",
  hasSelectedProposal: false,
  activeProposalCount: 0,
  viewerPendingProposalResponseCount: 0,
  selectableProposalCount: 0,
  hasUserActionableCalendarIssue: false,
  sourceVisible: true,
};

describe("BC-7.8 buckets", () => {
  it("classifies completed as history", () => {
    expect(
      deriveBucket({
        status: "completed",
        schedulingMode: "scheduled",
        scheduledStartAt: PAST,
        now: NOW,
      }),
    ).toBe("history");
  });

  it("classifies cancelled/declined/no_show as history", () => {
    for (const status of ["cancelled", "declined", "no_show"] as const) {
      expect(
        deriveBucket({
          status,
          schedulingMode: "unscheduled",
          scheduledStartAt: null,
          now: NOW,
        }),
      ).toBe("history");
    }
  });

  it("classifies confirmed + future scheduled as upcoming", () => {
    expect(
      deriveBucket({
        status: "confirmed",
        schedulingMode: "scheduled",
        scheduledStartAt: FUTURE,
        now: NOW,
      }),
    ).toBe("upcoming");
  });

  it("keeps confirmed + past-start in overview (never auto-completed)", () => {
    expect(
      deriveBucket({
        status: "confirmed",
        schedulingMode: "scheduled",
        scheduledStartAt: PAST,
        now: NOW,
      }),
    ).toBe("overview");
  });

  it("classifies draft/proposed without schedule as unscheduled", () => {
    expect(
      deriveBucket({
        status: "draft",
        schedulingMode: "unscheduled",
        scheduledStartAt: null,
        now: NOW,
      }),
    ).toBe("unscheduled");
    expect(
      deriveBucket({
        status: "proposed",
        schedulingMode: "scheduling",
        scheduledStartAt: null,
        now: NOW,
      }),
    ).toBe("unscheduled");
  });

  it("isTerminalMeetingStatus matches the state-machine set", () => {
    expect(isTerminalMeetingStatus("completed")).toBe(true);
    expect(isTerminalMeetingStatus("cancelled")).toBe(true);
    expect(isTerminalMeetingStatus("declined")).toBe(true);
    expect(isTerminalMeetingStatus("no_show")).toBe(true);
    expect(isTerminalMeetingStatus("confirmed")).toBe(false);
    expect(isTerminalMeetingStatus("draft")).toBe(false);
  });
});

describe("BC-7.8 action resolver — priority ordering", () => {
  it("P0 respond_meeting beats every other pending state", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerInvitationResponse: "pending",
      viewerPendingProposalResponseCount: 3,
      hasUserActionableCalendarIssue: true,
    });
    expect(a.kind).toBe("respond_meeting");
    expect(a.priority).toBe(0);
    expect(a.reasonCode).toBe("viewer_pending_invitation");
  });

  it("P1 respond_time_proposal fires when invitation already accepted", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerInvitationResponse: "accepted",
      viewerPendingProposalResponseCount: 1,
      hasUserActionableCalendarIssue: true,
    });
    expect(a.kind).toBe("respond_time_proposal");
    expect(a.priority).toBe(1);
    expect(a.target).toBe("scheduling");
  });

  it("P2 select_final_time only for organizer with selectable proposals", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: "organizer",
      viewerInvitationResponse: null,
      status: "proposed",
      selectableProposalCount: 2,
      activeProposalCount: 2,
    });
    expect(a.kind).toBe("select_final_time");
    expect(a.priority).toBe(2);
  });

  it("P3 schedule_meeting fires for organizer draft", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: "organizer",
      viewerInvitationResponse: null,
      status: "draft",
    });
    expect(a.kind).toBe("schedule_meeting");
    expect(a.reasonCode).toBe("draft_ready_to_propose");
  });

  it("P3 schedule_meeting fires for organizer of unscheduled proposed/confirmed with no proposals", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: "organizer",
      viewerInvitationResponse: null,
      status: "confirmed",
      schedulingMode: "unscheduled",
      activeProposalCount: 0,
    });
    expect(a.kind).toBe("schedule_meeting");
    expect(a.reasonCode).toBe("meeting_needs_scheduling");
  });

  it("P4 resolve_calendar_action only when no higher-priority state applies", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: "required",
      viewerInvitationResponse: "accepted",
      hasUserActionableCalendarIssue: true,
    });
    expect(a.kind).toBe("resolve_calendar_action");
    expect(a.priority).toBe(4);
    expect(a.target).toBe("calendar-settings");
  });

  it("P5 view_meeting is the passive default", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: "required",
      viewerInvitationResponse: "accepted",
    });
    expect(a.kind).toBe("view_meeting");
  });

  it("terminal meetings collapse to view_history regardless of other flags", () => {
    for (const status of ["completed", "cancelled", "declined", "no_show"] as const) {
      const a = resolveMeetingWorkspaceAction({
        ...baseAction,
        status,
        viewerInvitationResponse: "pending",
        viewerPendingProposalResponseCount: 5,
        hasUserActionableCalendarIssue: true,
      });
      expect(a.kind).toBe("view_history");
    }
  });

  it("non-participant viewers get 'none'", () => {
    const a = resolveMeetingWorkspaceAction({
      ...baseAction,
      viewerRole: null,
      viewerInvitationResponse: null,
    });
    expect(a.kind).toBe("none");
    expect(a.target).toBe("none");
  });
});

describe("BC-7.8 action registry", () => {
  it("every action kind has a priority and label key", () => {
    for (const kind of MEETING_WORKSPACE_ACTION_KINDS) {
      expect(MEETING_WORKSPACE_ACTION_PRIORITY[kind]).toBeTypeOf("number");
      expect(MEETING_WORKSPACE_ACTION_LABEL_KEYS[kind]).toMatch(
        /^bc\.meetings\.workspace\.action\./,
      );
    }
  });

  it("priority tiers are frozen and non-negative", () => {
    for (const kind of MEETING_WORKSPACE_ACTION_KINDS) {
      expect(MEETING_WORKSPACE_ACTION_PRIORITY[kind]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("BC-7.8 SDK contract freeze", () => {
  it("MeetingWorkspaceSDK exposes only the whitelisted read methods", () => {
    const actual = Object.keys(MeetingWorkspaceSDK).sort();
    const expected = [...MEETING_WORKSPACE_SDK_METHODS].sort();
    expect(actual).toEqual(expected);
  });

  it("SDK object is frozen (mutation-free)", () => {
    expect(Object.isFrozen(MeetingWorkspaceSDK)).toBe(true);
  });

  it("no mutation-shaped verbs on the SDK", () => {
    const forbidden =
      /^(create|update|delete|cancel|propose|select|respond|accept|decline|complete|schedule|sync)/i;
    for (const method of MEETING_WORKSPACE_SDK_METHODS) {
      expect(forbidden.test(method)).toBe(false);
    }
  });
});
