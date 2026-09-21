// BC-7.8 Turn A — Frozen action priority registry (spec §6/§8).
// Deterministic, no AI. Lower priority number = higher urgency.

export const MEETING_WORKSPACE_ACTION_KINDS = [
  "respond_meeting",
  "respond_time_proposal",
  "select_final_time",
  "schedule_meeting",
  "resolve_calendar_action",
  "view_meeting",
  "view_history",
  "none",
] as const;

export type MeetingWorkspaceActionKind = (typeof MEETING_WORKSPACE_ACTION_KINDS)[number];

/** Frozen: index = priority tier (§6). Lower = more urgent. */
export const MEETING_WORKSPACE_ACTION_PRIORITY: Record<MeetingWorkspaceActionKind, number> =
  Object.freeze({
    respond_meeting: 0,
    respond_time_proposal: 1,
    select_final_time: 2,
    schedule_meeting: 3,
    resolve_calendar_action: 4,
    view_meeting: 5,
    view_history: 5,
    none: 6,
  });

/** i18n key mapping (frozen; UI must not invent labels — spec §8/§62). */
export const MEETING_WORKSPACE_ACTION_LABEL_KEYS: Record<MeetingWorkspaceActionKind, string> =
  Object.freeze({
    respond_meeting: "bc.meetings.workspace.action.respond_meeting",
    respond_time_proposal: "bc.meetings.workspace.action.respond_time_proposal",
    select_final_time: "bc.meetings.workspace.action.select_final_time",
    schedule_meeting: "bc.meetings.workspace.action.schedule_meeting",
    resolve_calendar_action: "bc.meetings.workspace.action.resolve_calendar_action",
    view_meeting: "bc.meetings.workspace.action.view_meeting",
    view_history: "bc.meetings.workspace.action.view_history",
    none: "bc.meetings.workspace.action.none",
  });

export function isMeetingWorkspaceActionKind(value: unknown): value is MeetingWorkspaceActionKind {
  return (
    typeof value === "string" &&
    (MEETING_WORKSPACE_ACTION_KINDS as readonly string[]).includes(value)
  );
}
