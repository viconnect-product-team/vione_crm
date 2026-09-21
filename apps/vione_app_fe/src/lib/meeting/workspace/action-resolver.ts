// BC-7.8 Turn A — Pure action resolver (spec §7/§8).
// Deterministic, mutation-free. Card UI must not recompute action logic.

import type {
  BusinessMeetingParticipantRole,
  BusinessMeetingResponseStatus,
  BusinessMeetingStatus,
} from "@/lib/business-meetings/types";
import { isTerminal } from "@/lib/business-meetings/state-machine";
import {
  MEETING_WORKSPACE_ACTION_LABEL_KEYS,
  MEETING_WORKSPACE_ACTION_PRIORITY,
  type MeetingWorkspaceActionKind,
} from "./action-registry";
import type { MeetingSchedulingMode, MeetingWorkspaceActionDTO } from "./types";

export interface ResolveMeetingActionInput {
  status: BusinessMeetingStatus;
  viewerRole: BusinessMeetingParticipantRole | null;
  viewerInvitationResponse: BusinessMeetingResponseStatus | null;
  schedulingMode: MeetingSchedulingMode;
  hasSelectedProposal: boolean;
  activeProposalCount: number;
  viewerPendingProposalResponseCount: number;
  selectableProposalCount: number;
  hasUserActionableCalendarIssue: boolean;
  sourceVisible: boolean;
}

function build(
  kind: MeetingWorkspaceActionKind,
  reasonCode: string,
  target: MeetingWorkspaceActionDTO["target"] = "detail",
): MeetingWorkspaceActionDTO {
  return {
    kind,
    priority: MEETING_WORKSPACE_ACTION_PRIORITY[kind],
    labelKey: MEETING_WORKSPACE_ACTION_LABEL_KEYS[kind],
    target,
    reasonCode,
  };
}

/**
 * Priority order is frozen by MEETING_WORKSPACE_ACTION_PRIORITY (§6):
 *   P0 respond_meeting
 *   P1 respond_time_proposal
 *   P2 select_final_time
 *   P3 schedule_meeting
 *   P4 resolve_calendar_action
 *   P5 view_meeting / view_history
 *   P6 none
 *
 * The resolver returns the *most urgent* actionable state; other conditions
 * are not surfaced (spec §5 forbids informational-only entries in Needs Action).
 */
export function resolveMeetingWorkspaceAction(
  input: ResolveMeetingActionInput,
): MeetingWorkspaceActionDTO {
  const {
    status,
    viewerRole,
    viewerInvitationResponse,
    schedulingMode,
    hasSelectedProposal,
    activeProposalCount,
    viewerPendingProposalResponseCount,
    selectableProposalCount,
    hasUserActionableCalendarIssue,
  } = input;

  // Non-participant or unknown viewer: informational view only.
  if (viewerRole === null) return build("none", "viewer_not_participant", "none");

  // Terminal meetings: history view.
  if (isTerminal(status)) return build("view_history", "meeting_terminal");

  const isOrganizer = viewerRole === "organizer";
  const isInvited = !isOrganizer;

  // P0 — participant invitation requires response.
  if (
    isInvited &&
    status === "proposed" &&
    (viewerInvitationResponse === null || viewerInvitationResponse === "pending")
  ) {
    return build("respond_meeting", "viewer_pending_invitation");
  }

  // P1 — participant has active time proposal(s) requiring response.
  if (isInvited && viewerPendingProposalResponseCount > 0) {
    return build("respond_time_proposal", "viewer_pending_proposal_response", "scheduling");
  }

  // P2 — organizer: proposals ready to be finalized.
  if (isOrganizer && !hasSelectedProposal && selectableProposalCount > 0 && status !== "draft") {
    return build("select_final_time", "final_slot_selectable", "scheduling");
  }

  // P3 — organizer scheduling actions.
  if (isOrganizer && status === "draft") {
    return build("schedule_meeting", "draft_ready_to_propose", "scheduling");
  }
  if (
    isOrganizer &&
    schedulingMode !== "scheduled" &&
    activeProposalCount === 0 &&
    (status === "proposed" || status === "confirmed")
  ) {
    return build("schedule_meeting", "meeting_needs_scheduling", "scheduling");
  }

  // P4 — user-actionable calendar issue.
  if (hasUserActionableCalendarIssue) {
    return build("resolve_calendar_action", "calendar_action_required", "calendar-settings");
  }

  // P5 — passive view.
  return build("view_meeting", "no_pending_action");
}
