// BC-4.1A — Business Meetings domain types (client-safe, JSON-safe).
// Frozen per BC-4.0 contract + state machine. Additive only.
// Dates are ISO strings. Never expose mutation keys, audit internals,
// raw policy fields, DB-only normalized keys, or moderation data.

export const BUSINESS_MEETING_STATUSES = [
  "draft",
  "proposed",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type BusinessMeetingStatus = (typeof BUSINESS_MEETING_STATUSES)[number];

export const BUSINESS_MEETING_PARTICIPANT_ROLES = ["organizer", "required", "optional"] as const;
export type BusinessMeetingParticipantRole = (typeof BUSINESS_MEETING_PARTICIPANT_ROLES)[number];

export const BUSINESS_MEETING_RESPONSE_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "tentative",
  "proposed_new_time",
] as const;
export type BusinessMeetingResponseStatus = (typeof BUSINESS_MEETING_RESPONSE_STATUSES)[number];

export const BUSINESS_MEETING_TYPES = [
  "in_person",
  "video_call",
  "phone_call",
  "business_lunch",
  "demo",
  "consultation",
  "interview",
  "networking",
  "site_visit",
  "other",
] as const;
export type BusinessMeetingType = (typeof BUSINESS_MEETING_TYPES)[number];

export const BUSINESS_MEETING_LOCATION_TYPES = [
  "physical",
  "online",
  "phone",
  "hybrid",
  "unspecified",
] as const;
export type BusinessMeetingLocationType = (typeof BUSINESS_MEETING_LOCATION_TYPES)[number];

export const BUSINESS_MEETING_SOURCE_TYPES = [
  "global_connection",
  "saved_card",
  "business_profile",
  "company",
  "association",
  "event",
  "qr",
  "nfc",
  "manual",
  "referral",
] as const;
export type BusinessMeetingSourceType = (typeof BUSINESS_MEETING_SOURCE_TYPES)[number];

/** Named lifecycle operations. Clients never submit a target status. */
export type BusinessMeetingOperation =
  | "propose"
  | "accept"
  | "decline"
  | "tentative"
  | "cancel"
  | "reschedule"
  | "complete"
  | "mark_no_show";

/** Server-verified eligibility source for proposing a meeting (Policy B). */
export type MeetingEligibilitySource = "global_connection" | "saved_card";

export type MeetingEligibility = {
  organizerUserId: string;
  targetUserId: string;
  eligibilitySource: MeetingEligibilitySource;
};

/** JSON-safe meeting aggregate DTO (participant-scoped). */
export type BusinessMeetingDTO = {
  id: string;
  createdByUserId: string;
  organizerUserId: string;
  title: string;
  description: string | null;
  meetingType: BusinessMeetingType;
  status: BusinessMeetingStatus;
  activeProposalVersion: number | null;
  confirmedProposalId: string | null;
  timezone: string;
  sourceType: BusinessMeetingSourceType;
  sourceId: string | null;
  companyId: string | null;
  associationId: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
};

/** JSON-safe participant DTO. Private notes are NOT part of this slice. */
export type BusinessMeetingParticipantDTO = {
  id: string;
  meetingId: string;
  userId: string;
  role: BusinessMeetingParticipantRole;
  responseStatus: BusinessMeetingResponseStatus;
  responseMessage: string | null;
  respondedAt: string | null;
  joinedAt: string;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** JSON-safe proposal DTO. Location/URL are participant-private by RLS. */
export type BusinessMeetingProposalDTO = {
  id: string;
  meetingId: string;
  version: number;
  proposedByUserId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  locationType: BusinessMeetingLocationType;
  locationText: string | null;
  meetingUrl: string | null;
  proposalMessage: string | null;
  createdAt: string;
  supersededAt: string | null;
  acceptedAt: string | null;
};

/** Compact viewer-facing state summary. */
export type MeetingStateSummary = {
  meetingId: string;
  status: BusinessMeetingStatus;
  activeProposalVersion: number | null;
  viewerRole: BusinessMeetingParticipantRole | null;
  viewerResponseStatus: BusinessMeetingResponseStatus | null;
};

export type StatusCounts = Record<BusinessMeetingStatus, number>;

/** JSON-safe result returned by controlled mutation functions. */
export type BusinessMeetingMutationResult = {
  meetingId: string;
  status: BusinessMeetingStatus;
  version?: number;
};

export type MeetingListOptions = {
  limit?: number;
  offset?: number;
};

// ── BC-4.1B — Application service DTOs (privacy-safe, JSON-safe) ──────────────

/** Safe public counterpart summary (published public card projection only). */
export type MeetingCounterpartSummary = {
  userId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  primaryCardSlug: string | null;
};

/** UI-convenience capabilities. The server mutation still revalidates. */
export type MeetingViewerCapabilities = {
  canView: boolean;
  canAccept: boolean;
  canDecline: boolean;
  /** BC-7.6 — advisory only, DB re-checks. */
  canTentative: boolean;
  canProposeNewTime: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canMarkNoShow: boolean;
};

/** Compact list item. Sensitive fields (URL/location/description) omitted. */
export type MeetingListItemDTO = {
  id: string;
  title: string;
  status: BusinessMeetingStatus;
  meetingType: BusinessMeetingType;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  locationType: BusinessMeetingLocationType | null;
  activeProposalVersion: number | null;
  viewerRole: BusinessMeetingParticipantRole | null;
  viewerResponseStatus: BusinessMeetingResponseStatus | null;
  counterpart: MeetingCounterpartSummary | null;
  capabilities: MeetingViewerCapabilities;
};

/** Full participant-authorized detail. URL/location exposed to participants. */
export type MeetingDetailDTO = {
  meeting: BusinessMeetingDTO;
  participants: BusinessMeetingParticipantDTO[];
  activeProposal: BusinessMeetingProposalDTO | null;
  viewerRole: BusinessMeetingParticipantRole | null;
  counterpart: MeetingCounterpartSummary | null;
  capabilities: MeetingViewerCapabilities;
};

export type MeetingCountsDTO = StatusCounts;

/** Create-draft service input. Target is resolved server-side (never trusted). */
export type CreateDraftInput = {
  targetCardSlug: string;
  title: string;
  description?: string | null;
  meetingType: BusinessMeetingType;
  timezone: string;
  source?: { type: BusinessMeetingSourceType; id?: string | null } | null;
  mutationKey?: string;
};

/** Propose timing for an existing draft meeting. */
export type ProposeInput = {
  meetingId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  locationType: BusinessMeetingLocationType;
  locationText?: string | null;
  meetingUrl?: string | null;
  proposalMessage?: string | null;
  mutationKey?: string;
};

/** Propose a new time (reschedule) against a base version. */
export type ProposeNewTimeInput = {
  startAt: string;
  endAt: string;
  timezone: string;
  locationType: BusinessMeetingLocationType;
  locationText?: string | null;
  meetingUrl?: string | null;
  proposalMessage?: string | null;
  mutationKey?: string;
};

export type MeetingReasonInput = { reason?: string | null; mutationKey?: string };
export type MeetingMutationOptions = { mutationKey?: string };

/** BC-4.1C — Proposal history projection with public proposer summaries. */
export type ProposalHistoryDTO = {
  activeVersion: number | null;
  proposals: BusinessMeetingProposalDTO[];
  proposers: Record<string, MeetingCounterpartSummary>;
};
