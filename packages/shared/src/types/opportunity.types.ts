import { OpportunityType } from "../enums/categories.enum.js";
import { MeetingStatus } from "../enums/status.enum.js";

export interface SharedOpportunity {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  type: OpportunityType;
  communityId?: string;
  communityName?: string;
  dealSizeMin?: number;
  dealSizeMax?: number;
  currency?: string;
  deadline?: string;
  attachments?: string[];
  interestCount: number;
  claimsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedOpportunityMeeting {
  id: string;
  opportunityId?: string;
  hostId: string;
  participantId: string;
  hostName: string;
  participantName: string;
  scheduledTime: string;
  locationType: "online" | "offline";
  meetingUrl?: string;
  address?: string;
  status: MeetingStatus;
  notes?: string;
  outcome?: string;
  createdAt: string;
}
