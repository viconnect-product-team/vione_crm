// BC-7.9 Turn B — Meeting Follow-up domain types (frozen surface).
// DTO must never expose raw user ids for owner/createdBy.

export const MEETING_FOLLOW_UP_STATUSES = [
  "open",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type MeetingFollowUpStatus = (typeof MEETING_FOLLOW_UP_STATUSES)[number];

export const MEETING_FOLLOW_UP_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type MeetingFollowUpPriority = (typeof MEETING_FOLLOW_UP_PRIORITIES)[number];

export const MEETING_FOLLOW_UP_TITLE_MAX = 240;
export const MEETING_FOLLOW_UP_DESCRIPTION_MAX = 4000;
/** Product-defined "due soon" window: within 24h from now. */
export const MEETING_FOLLOW_UP_DUE_SOON_MS = 24 * 60 * 60 * 1000;

export type MeetingFollowUpTemporalState =
  | "active"
  | "due_soon"
  | "overdue"
  | "completed"
  | "cancelled";

export interface MeetingFollowUpIdentity {
  /** Stable, safe identifier for the viewer (self / meeting-participant / organizer). No raw uid. */
  kind: "self" | "organizer" | "participant" | "external";
  /** True when identity resolves to the viewer. */
  isViewer: boolean;
}

export interface MeetingFollowUpViewerPermissions {
  canEdit: boolean;
  canChangeStatus: boolean;
  canCancel: boolean;
}

export interface MeetingFollowUpDTO {
  id: string;
  meetingId: string;
  outcomeId: string | null;
  title: string;
  description: string | null;
  status: MeetingFollowUpStatus;
  priority: MeetingFollowUpPriority;
  dueAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  temporalState: MeetingFollowUpTemporalState;
  owner: MeetingFollowUpIdentity;
  createdBy: MeetingFollowUpIdentity;
  viewerPermissions: MeetingFollowUpViewerPermissions;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingFollowUpInput {
  meetingId: string;
  title: string;
  ownerUserId: string;
  description?: string | null;
  priority?: MeetingFollowUpPriority;
  dueAt?: string | null;
  outcomeId?: string | null;
  clientRequestId?: string | null;
}

export interface UpdateMeetingFollowUpInput {
  followUpId: string;
  expectedVersion: number;
  title?: string;
  description?: string | null;
  clearDescription?: boolean;
  priority?: MeetingFollowUpPriority;
  dueAt?: string | null;
  clearDueAt?: boolean;
  ownerUserId?: string;
}

export interface SetMeetingFollowUpStatusInput {
  followUpId: string;
  expectedVersion: number;
  targetStatus: Extract<MeetingFollowUpStatus, "in_progress" | "completed">;
}

export interface CancelMeetingFollowUpInput {
  followUpId: string;
  expectedVersion: number;
}
