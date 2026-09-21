// BC-7.9 Turn A — Meeting Outcome domain types (frozen surface).
// DTO must not expose recorded_by_user_id or internal audit fields.

export const MEETING_OUTCOME_TYPES = [
  "positive_progress",
  "agreement_reached",
  "opportunity_created",
  "follow_up_required",
  "no_decision",
  "blocked",
  "not_a_fit",
  "completed_objective",
  "informational",
  "other",
] as const;

export type MeetingOutcomeType = (typeof MEETING_OUTCOME_TYPES)[number];

export const MEETING_OUTCOME_STATUSES = ["draft", "finalized"] as const;
export type MeetingOutcomeStatus = (typeof MEETING_OUTCOME_STATUSES)[number];

export const MEETING_OUTCOME_SUMMARY_MAX = 2000;

export interface MeetingOutcomeDTO {
  id: string;
  meetingId: string;
  outcomeType: MeetingOutcomeType;
  outcomeStatus: MeetingOutcomeStatus;
  summary: string | null;
  version: number;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** True when the viewer is the outcome recorder (organizer). No raw uid leak. */
  viewerIsRecorder: boolean;
}

export interface MeetingOutcomePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canFinalize: boolean;
  canRead: boolean;
}

export interface CreateMeetingOutcomeInput {
  meetingId: string;
  outcomeType: MeetingOutcomeType;
  summary?: string | null;
  clientRequestId?: string | null;
}

export interface UpdateMeetingOutcomeInput {
  meetingId: string;
  expectedVersion: number;
  outcomeType?: MeetingOutcomeType;
  summary?: string | null;
  /** When true, clears the summary regardless of `summary` field. */
  clearSummary?: boolean;
}

export interface FinalizeMeetingOutcomeInput {
  meetingId: string;
  expectedVersion: number;
}
