// BC-4.1C — BusinessMeetingSDK (client-facing façade).
// The ONLY entry point UI/hook code uses to reach Business Connect Meetings.
// Every verb delegates to an authenticated server function (RPC stub, safe to
// import on the client). Those functions run under requireSupabaseAuth and
// delegate to the service → repository / authoritative BC-4.1A RPCs.
//
// UI code MUST consume this SDK (via the hook layer) — never the server
// functions, service, repository, or the supabase client directly.

import {
  acceptMeetingFn,
  cancelMeetingFn,
  completeMeetingFn,
  countMeetingsFn,
  declineMeetingFn,
  getMeetingDetailFn,
  getMeetingProposalHistoryFn,
  listCancelledMeetingsFn,
  listPastMeetingsFn,
  listPendingMeetingsFn,
  listUpcomingMeetingsFn,
  markMeetingNoShowFn,
  rescheduleMeetingFn,
  tentativelyAcceptMeetingFn,
} from "@/lib/business-meetings.functions";
import type {
  BusinessMeetingLocationType,
  BusinessMeetingMutationResult,
  MeetingCountsDTO,
  MeetingDetailDTO,
  MeetingListItemDTO,
  MeetingListOptions,
  ProposalHistoryDTO,
} from "./types";

export type RescheduleInput = {
  startAt: string;
  endAt: string;
  timezone: string;
  locationType: BusinessMeetingLocationType;
  locationText?: string | null;
  meetingUrl?: string | null;
  proposalMessage?: string | null;
  mutationKey?: string;
};

export const BusinessMeetingSDK = {
  meetings: {
    // Reads
    listUpcoming: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      listUpcomingMeetingsFn({ data: options ?? {} }),
    listPending: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      listPendingMeetingsFn({ data: options ?? {} }),
    listPast: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      listPastMeetingsFn({ data: options ?? {} }),
    listCancelled: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      listCancelledMeetingsFn({ data: options ?? {} }),
    get: (meetingId: string): Promise<MeetingDetailDTO> =>
      getMeetingDetailFn({ data: { meetingId } }),
    getProposalHistory: (meetingId: string): Promise<ProposalHistoryDTO> =>
      getMeetingProposalHistoryFn({ data: { meetingId } }),
    countByStatus: (): Promise<MeetingCountsDTO> => countMeetingsFn({}),

    // Mutations
    accept: (
      meetingId: string,
      proposalVersion: number,
      mutationKey?: string,
    ): Promise<BusinessMeetingMutationResult> =>
      acceptMeetingFn({ data: { meetingId, proposalVersion, mutationKey } }),
    decline: (
      meetingId: string,
      proposalVersion: number,
      input?: { reason?: string | null; mutationKey?: string },
    ): Promise<BusinessMeetingMutationResult> =>
      declineMeetingFn({
        data: {
          meetingId,
          proposalVersion,
          reason: input?.reason,
          mutationKey: input?.mutationKey,
        },
      }),
    tentativelyAccept: (
      meetingId: string,
      proposalVersion: number,
      mutationKey?: string,
    ): Promise<BusinessMeetingMutationResult> =>
      tentativelyAcceptMeetingFn({ data: { meetingId, proposalVersion, mutationKey } }),
    proposeNewTime: (
      meetingId: string,
      baseVersion: number,
      input: RescheduleInput,
    ): Promise<BusinessMeetingMutationResult> =>
      rescheduleMeetingFn({ data: { meetingId, baseVersion, ...input } }),
    cancel: (
      meetingId: string,
      input?: { reason?: string | null; expectedVersion?: number; mutationKey?: string },
    ): Promise<BusinessMeetingMutationResult> =>
      cancelMeetingFn({
        data: {
          meetingId,
          reason: input?.reason,
          expectedVersion: input?.expectedVersion,
          mutationKey: input?.mutationKey,
        },
      }),
    complete: (
      meetingId: string,
      input?: { expectedVersion?: number; mutationKey?: string },
    ): Promise<BusinessMeetingMutationResult> =>
      completeMeetingFn({
        data: {
          meetingId,
          expectedVersion: input?.expectedVersion,
          mutationKey: input?.mutationKey,
        },
      }),
    markNoShow: (
      meetingId: string,
      input?: { expectedVersion?: number; mutationKey?: string },
    ): Promise<BusinessMeetingMutationResult> =>
      markMeetingNoShowFn({
        data: {
          meetingId,
          expectedVersion: input?.expectedVersion,
          mutationKey: input?.mutationKey,
        },
      }),
  },
};

export type BusinessMeetingSDKType = typeof BusinessMeetingSDK;
