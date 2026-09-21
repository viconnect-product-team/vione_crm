// BC-4.1A — Row → JSON-safe DTO mappers for Business Meetings.
// Pure functions. Never expose mutation keys, audit internals, or DB-only keys.

import type {
  BusinessMeetingDTO,
  BusinessMeetingParticipantDTO,
  BusinessMeetingProposalDTO,
} from "./types";

type MeetingRow = {
  id: string;
  created_by_user_id: string;
  organizer_user_id: string;
  title: string;
  description: string | null;
  meeting_type: BusinessMeetingDTO["meetingType"];
  status: BusinessMeetingDTO["status"];
  active_proposal_version: number | null;
  confirmed_proposal_id: string | null;
  timezone: string;
  source_type: BusinessMeetingDTO["sourceType"];
  source_id: string | null;
  company_id: string | null;
  association_id: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
};

type ParticipantRow = {
  id: string;
  meeting_id: string;
  user_id: string;
  role: BusinessMeetingParticipantDTO["role"];
  response_status: BusinessMeetingParticipantDTO["responseStatus"];
  response_message: string | null;
  responded_at: string | null;
  joined_at: string;
  left_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProposalRow = {
  id: string;
  meeting_id: string;
  version: number;
  proposed_by_user_id: string;
  start_at: string;
  end_at: string;
  timezone: string;
  location_type: BusinessMeetingProposalDTO["locationType"];
  location_text: string | null;
  meeting_url: string | null;
  proposal_message: string | null;
  created_at: string;
  superseded_at: string | null;
  accepted_at: string | null;
};

export function mapMeetingRow(row: MeetingRow): BusinessMeetingDTO {
  return {
    id: row.id,
    createdByUserId: row.created_by_user_id,
    organizerUserId: row.organizer_user_id,
    title: row.title,
    description: row.description,
    meetingType: row.meeting_type,
    status: row.status,
    activeProposalVersion: row.active_proposal_version,
    confirmedProposalId: row.confirmed_proposal_id,
    timezone: row.timezone,
    sourceType: row.source_type,
    sourceId: row.source_id,
    companyId: row.company_id,
    associationId: row.association_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
  };
}

export function mapParticipantRow(row: ParticipantRow): BusinessMeetingParticipantDTO {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    userId: row.user_id,
    role: row.role,
    responseStatus: row.response_status,
    responseMessage: row.response_message,
    respondedAt: row.responded_at,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProposalRow(row: ProposalRow): BusinessMeetingProposalDTO {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    version: row.version,
    proposedByUserId: row.proposed_by_user_id,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationType: row.location_type,
    locationText: row.location_text,
    meetingUrl: row.meeting_url,
    proposalMessage: row.proposal_message,
    createdAt: row.created_at,
    supersededAt: row.superseded_at,
    acceptedAt: row.accepted_at,
  };
}
