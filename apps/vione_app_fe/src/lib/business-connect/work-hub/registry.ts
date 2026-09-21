// BC-8.0 — Frozen kind→(category, priority, action, urgency, labels) mapping.
// Any change to this file bumps WORK_HUB_PRIORITY_VERSION.

import {
  WORK_HUB_PRIORITY,
  type WorkHubActionKind,
  type WorkHubCategory,
  type WorkHubItemKind,
  type WorkHubPriority,
  type WorkHubUrgency,
} from "./types";

interface KindDescriptor {
  category: WorkHubCategory;
  priority: WorkHubPriority;
  urgency: WorkHubUrgency;
  actionKind: WorkHubActionKind;
  titleKey: string;
  descriptionKey: string | null;
  /** Sources this kind may originate from (§4). Used for tests + docs. */
  sourceHint: string;
}

export const WORK_HUB_KIND_REGISTRY: Readonly<Record<WorkHubItemKind, KindDescriptor>> =
  Object.freeze({
    connection_request_received: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P1,
      urgency: "high",
      actionKind: "review_connection_request",
      titleKey: "bc.workHub.kind.connection_request_received.title",
      descriptionKey: "bc.workHub.kind.connection_request_received.desc",
      sourceHint: "connection",
    },
    connection_request_sent_waiting: {
      category: "waiting",
      priority: WORK_HUB_PRIORITY.P6,
      urgency: "informational",
      actionKind: "review_connection_request",
      titleKey: "bc.workHub.kind.connection_request_sent_waiting.title",
      descriptionKey: "bc.workHub.kind.connection_request_sent_waiting.desc",
      sourceHint: "connection",
    },
    introduction_request_received: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P1,
      urgency: "high",
      actionKind: "review_introduction_request",
      titleKey: "bc.workHub.kind.introduction_request_received.title",
      descriptionKey: "bc.workHub.kind.introduction_request_received.desc",
      sourceHint: "introduction_request",
    },
    introduction_request_accepted_waiting_delivery: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P2,
      urgency: "normal",
      actionKind: "deliver_introduction",
      titleKey: "bc.workHub.kind.introduction_request_accepted_waiting_delivery.title",
      descriptionKey: "bc.workHub.kind.introduction_request_accepted_waiting_delivery.desc",
      sourceHint: "introduction_request",
    },
    introduction_delivery_received: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P2,
      urgency: "normal",
      actionKind: "view_introduction",
      titleKey: "bc.workHub.kind.introduction_delivery_received.title",
      descriptionKey: "bc.workHub.kind.introduction_delivery_received.desc",
      sourceHint: "introduction_delivery",
    },
    introduction_outcome_missing: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P3,
      urgency: "low",
      actionKind: "view_introduction",
      titleKey: "bc.workHub.kind.introduction_outcome_missing.title",
      descriptionKey: "bc.workHub.kind.introduction_outcome_missing.desc",
      sourceHint: "introduction_outcome",
    },
    meeting_invitation_response_required: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P1,
      urgency: "high",
      actionKind: "respond_meeting",
      titleKey: "bc.workHub.kind.meeting_invitation_response_required.title",
      descriptionKey: "bc.workHub.kind.meeting_invitation_response_required.desc",
      sourceHint: "meeting_invitation",
    },
    meeting_time_response_required: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P2,
      urgency: "normal",
      actionKind: "review_meeting_times",
      titleKey: "bc.workHub.kind.meeting_time_response_required.title",
      descriptionKey: "bc.workHub.kind.meeting_time_response_required.desc",
      sourceHint: "meeting_scheduling",
    },
    meeting_final_time_selection_ready: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P2,
      urgency: "normal",
      actionKind: "select_meeting_time",
      titleKey: "bc.workHub.kind.meeting_final_time_selection_ready.title",
      descriptionKey: "bc.workHub.kind.meeting_final_time_selection_ready.desc",
      sourceHint: "meeting_scheduling",
    },
    meeting_schedule_required: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P3,
      urgency: "normal",
      actionKind: "schedule_meeting",
      titleKey: "bc.workHub.kind.meeting_schedule_required.title",
      descriptionKey: "bc.workHub.kind.meeting_schedule_required.desc",
      sourceHint: "meeting_scheduling",
    },
    meeting_upcoming: {
      category: "upcoming",
      priority: WORK_HUB_PRIORITY.P5,
      urgency: "informational",
      actionKind: "view_upcoming_meeting",
      titleKey: "bc.workHub.kind.meeting_upcoming.title",
      descriptionKey: "bc.workHub.kind.meeting_upcoming.desc",
      sourceHint: "meeting",
    },
    meeting_outcome_missing: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P3,
      urgency: "normal",
      actionKind: "record_meeting_outcome",
      titleKey: "bc.workHub.kind.meeting_outcome_missing.title",
      descriptionKey: "bc.workHub.kind.meeting_outcome_missing.desc",
      sourceHint: "meeting_outcome",
    },
    meeting_follow_up_due_soon: {
      category: "due_soon",
      priority: WORK_HUB_PRIORITY.P3,
      urgency: "normal",
      actionKind: "review_follow_up",
      titleKey: "bc.workHub.kind.meeting_follow_up_due_soon.title",
      descriptionKey: "bc.workHub.kind.meeting_follow_up_due_soon.desc",
      sourceHint: "meeting_follow_up",
    },
    meeting_follow_up_overdue: {
      category: "overdue",
      priority: WORK_HUB_PRIORITY.P1,
      urgency: "critical",
      actionKind: "review_follow_up",
      titleKey: "bc.workHub.kind.meeting_follow_up_overdue.title",
      descriptionKey: "bc.workHub.kind.meeting_follow_up_overdue.desc",
      sourceHint: "meeting_follow_up",
    },
    meeting_follow_up_active: {
      category: "waiting",
      priority: WORK_HUB_PRIORITY.P6,
      urgency: "low",
      actionKind: "review_follow_up",
      titleKey: "bc.workHub.kind.meeting_follow_up_active.title",
      descriptionKey: "bc.workHub.kind.meeting_follow_up_active.desc",
      sourceHint: "meeting_follow_up",
    },
    calendar_sync_action_required: {
      category: "needs_action",
      priority: WORK_HUB_PRIORITY.P4,
      urgency: "normal",
      actionKind: "resolve_calendar_issue",
      titleKey: "bc.workHub.kind.calendar_sync_action_required.title",
      descriptionKey: "bc.workHub.kind.calendar_sync_action_required.desc",
      sourceHint: "calendar_sync",
    },
    relationship_activity_recent: {
      category: "recent",
      priority: WORK_HUB_PRIORITY.P7,
      urgency: "informational",
      actionKind: "view_relationship_activity",
      titleKey: "bc.workHub.kind.relationship_activity_recent.title",
      descriptionKey: "bc.workHub.kind.relationship_activity_recent.desc",
      sourceHint: "relationship_activity",
    },
  });

export const WORK_HUB_ACTION_LABEL_KEYS: Readonly<Record<WorkHubActionKind, string>> =
  Object.freeze({
    review_connection_request: "bc.workHub.action.review_connection_request",
    review_introduction_request: "bc.workHub.action.review_introduction_request",
    deliver_introduction: "bc.workHub.action.deliver_introduction",
    view_introduction: "bc.workHub.action.view_introduction",
    respond_meeting: "bc.workHub.action.respond_meeting",
    review_meeting_times: "bc.workHub.action.review_meeting_times",
    select_meeting_time: "bc.workHub.action.select_meeting_time",
    schedule_meeting: "bc.workHub.action.schedule_meeting",
    record_meeting_outcome: "bc.workHub.action.record_meeting_outcome",
    review_follow_up: "bc.workHub.action.review_follow_up",
    view_upcoming_meeting: "bc.workHub.action.view_upcoming_meeting",
    resolve_calendar_issue: "bc.workHub.action.resolve_calendar_issue",
    view_relationship_activity: "bc.workHub.action.view_relationship_activity",
    none: "bc.workHub.action.none",
  });
