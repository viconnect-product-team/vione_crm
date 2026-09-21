// BC-4.1B — BusinessMeetingSDK.
// The single, stable façade application code uses for Business Meetings. It
// binds an authenticated Supabase client + trusted userId (+ injected
// server-only resolvers) once, then delegates to BusinessMeetingService. It
// NEVER touches the DB directly, never duplicates the state machine, and
// returns only JSON-safe DTOs.
//
// Client-safe by construction: statically imports no *.server module. The
// server-only deps (target resolution + counterpart projection) are injected by
// the server-function handler.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BusinessMeetingService, type MeetingServiceDeps } from "./service";
import type {
  BusinessMeetingMutationResult,
  CreateDraftInput,
  MeetingCountsDTO,
  MeetingDetailDTO,
  MeetingListItemDTO,
  MeetingListOptions,
  MeetingMutationOptions,
  MeetingReasonInput,
  ProposeInput,
  ProposeNewTimeInput,
} from "./types";

type DB = SupabaseClient<Database>;

export function createBusinessMeetingSDK(
  supabase: DB,
  userId: string | null | undefined,
  deps: MeetingServiceDeps,
) {
  const readDeps = { projectCounterparts: deps.projectCounterparts };
  return {
    // Mutations
    createDraft: (input: CreateDraftInput): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.createDraft(supabase, userId, deps, input),
    propose: (input: ProposeInput): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.propose(supabase, userId, input),
    proposeNewTime: (
      meetingId: string,
      baseVersion: number,
      input: ProposeNewTimeInput,
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.proposeNewTime(supabase, userId, meetingId, baseVersion, input),
    accept: (
      meetingId: string,
      proposalVersion: number,
      options?: MeetingMutationOptions,
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.accept(supabase, userId, meetingId, proposalVersion, options),
    decline: (
      meetingId: string,
      proposalVersion: number,
      input?: MeetingReasonInput,
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.decline(supabase, userId, meetingId, proposalVersion, input),
    tentativelyAccept: (
      meetingId: string,
      proposalVersion: number,
      options?: MeetingMutationOptions,
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.tentativelyAccept(
        supabase,
        userId,
        meetingId,
        proposalVersion,
        options,
      ),
    cancel: (
      meetingId: string,
      input?: MeetingReasonInput & { expectedVersion?: number },
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.cancel(supabase, userId, meetingId, input),
    complete: (
      meetingId: string,
      options?: MeetingMutationOptions & { expectedVersion?: number },
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.complete(supabase, userId, meetingId, options),
    markNoShow: (
      meetingId: string,
      options?: MeetingMutationOptions & { expectedVersion?: number },
    ): Promise<BusinessMeetingMutationResult> =>
      BusinessMeetingService.markNoShow(supabase, userId, meetingId, options),

    // Reads
    getDetail: (meetingId: string): Promise<MeetingDetailDTO> =>
      BusinessMeetingService.getDetail(supabase, userId, readDeps, meetingId),
    listUpcoming: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      BusinessMeetingService.listUpcoming(supabase, userId, readDeps, options),
    listPending: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      BusinessMeetingService.listPending(supabase, userId, readDeps, options),
    listPast: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      BusinessMeetingService.listPast(supabase, userId, readDeps, options),
    listCancelled: (options?: MeetingListOptions): Promise<MeetingListItemDTO[]> =>
      BusinessMeetingService.listCancelled(supabase, userId, readDeps, options),
    getProposalHistory: (meetingId: string) =>
      BusinessMeetingService.getProposalHistory(supabase, userId, readDeps, meetingId),
    counts: (): Promise<MeetingCountsDTO> => BusinessMeetingService.counts(supabase, userId),
  };
}

export type BusinessMeetingSDK = ReturnType<typeof createBusinessMeetingSDK>;
