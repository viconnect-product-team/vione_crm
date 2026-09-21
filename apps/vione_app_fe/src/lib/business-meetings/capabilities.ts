// BC-4.1B (extended by BC-7.6) — Pure viewer-capability derivation.
// UI convenience only: the authoritative server mutations (BC-4.1A + BC-7.6
// RPCs) revalidate every transition. This never runs an independent state
// machine — it composes the frozen transition table with the viewer's trusted
// role and their own participant response status.

import { evaluateMeetingTransition, type MeetingActor } from "./state-machine";
import type {
  BusinessMeetingParticipantRole,
  BusinessMeetingResponseStatus,
  BusinessMeetingStatus,
  MeetingViewerCapabilities,
} from "./types";

export type MeetingViewerContext = {
  status: BusinessMeetingStatus;
  viewerRole: BusinessMeetingParticipantRole | null;
  /** BC-7.6 — the viewer's own response row status (if a participant). */
  viewerResponseStatus?: BusinessMeetingResponseStatus | null;
};

const NO_CAPS: MeetingViewerCapabilities = {
  canView: false,
  canAccept: false,
  canDecline: false,
  canTentative: false,
  canProposeNewTime: false,
  canCancel: false,
  canComplete: false,
  canMarkNoShow: false,
};

function actorFor(role: BusinessMeetingParticipantRole | null): MeetingActor {
  if (role === null) return "non_participant";
  if (role === "organizer") return "organizer";
  return "participant";
}

/**
 * BC-7.6: a viewer's response actions are ADVISORY-gated by both the
 * transition table AND their own response row's current status. Only
 * pending / tentative rows may accept/decline/tentative. Accepted or
 * declined participants cannot re-respond in BC-7.6 (re-invite deferred).
 */
function responseAllowed(
  status: BusinessMeetingResponseStatus | null | undefined,
  next: "accept" | "decline" | "tentative",
): boolean {
  if (status == null) return false;
  switch (next) {
    case "accept":
      return status === "pending" || status === "tentative";
    case "tentative":
      return status === "pending" || status === "tentative";
    case "decline":
      return status === "pending" || status === "tentative";
  }
}

export function deriveMeetingViewerCapabilities(
  ctx: MeetingViewerContext,
): MeetingViewerCapabilities {
  const { status, viewerRole, viewerResponseStatus } = ctx;
  if (viewerRole === null) return { ...NO_CAPS };
  const actor = actorFor(viewerRole);
  const can = (op: Parameters<typeof evaluateMeetingTransition>[0]["operation"]) =>
    evaluateMeetingTransition({ from: status, operation: op, actor }).ok;

  // Organizer never responds; participants only if their own row allows it.
  const isParticipantResponder = viewerRole !== "organizer";
  const respStatus = viewerResponseStatus ?? (isParticipantResponder ? "pending" : null);

  return {
    canView: true,
    canAccept: can("accept") && isParticipantResponder && responseAllowed(respStatus, "accept"),
    canDecline: can("decline") && isParticipantResponder && responseAllowed(respStatus, "decline"),
    canTentative:
      can("tentative") && isParticipantResponder && responseAllowed(respStatus, "tentative"),
    canProposeNewTime: can("reschedule"),
    canCancel: can("cancel"),
    canComplete: can("complete"),
    canMarkNoShow: can("mark_no_show"),
  };
}
