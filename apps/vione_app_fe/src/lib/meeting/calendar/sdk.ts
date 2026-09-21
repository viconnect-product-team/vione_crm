// BC-7.7 Turn B1 — MeetingCalendarSDK (client-facing façade).
// UI code goes through this SDK; it delegates to authenticated server fns.
// B2 will add proposal-select, sync worker triggers and account connect.

import {
  findCommonAvailabilityFn,
  getMyAvailabilityPreferencesFn,
  updateAvailabilityPreferencesFn,
  createTimeProposalsFn,
  respondToTimeProposalFn,
  selectTimeProposalFn,
  listMeetingTimeProposalsFn,
  listMeetingProjectionsFn,
} from "@/lib/calendar.functions";
import type {
  AvailabilityPreferencesDTO,
  AvailabilitySlotDTO,
  CalendarProjectionDTO,
  FindCommonAvailabilityInput,
  MeetingTimeProposalDTO,
  MeetingTimeProposalResponseDTO,
  MeetingTimeProposalResponseValue,
} from "./types";
import type { UpdatePreferencesInput } from "./preferences.service";

export interface CreateProposalsInput {
  meetingId: string;
  proposals: { startAt: string; endAt: string; timezone: string }[];
  /** Idempotency token; retrying the same key returns the same round. */
  clientRequestId?: string;
}

export const MeetingCalendarSDK = {
  preferences: {
    get: (): Promise<AvailabilityPreferencesDTO | null> => getMyAvailabilityPreferencesFn({}),
    update: (input: UpdatePreferencesInput): Promise<AvailabilityPreferencesDTO> =>
      updateAvailabilityPreferencesFn({ data: input }),
  },
  availability: {
    findCommon: (input: FindCommonAvailabilityInput): Promise<AvailabilitySlotDTO[]> =>
      findCommonAvailabilityFn({ data: input }),
  },
  proposals: {
    list: (meetingId: string): Promise<MeetingTimeProposalDTO[]> =>
      listMeetingTimeProposalsFn({ data: { meetingId } }),
    create: (input: CreateProposalsInput): Promise<MeetingTimeProposalDTO[]> =>
      createTimeProposalsFn({ data: input }),
    respond: (
      proposalId: string,
      response: MeetingTimeProposalResponseValue,
    ): Promise<MeetingTimeProposalResponseDTO> =>
      respondToTimeProposalFn({ data: { proposalId, response } }),
    select: (
      proposalId: string,
      expectedMeetingVersion?: number,
    ): Promise<MeetingTimeProposalDTO> =>
      selectTimeProposalFn({ data: { proposalId, expectedMeetingVersion } }),
  },
  projections: {
    list: (meetingId: string): Promise<CalendarProjectionDTO[]> =>
      listMeetingProjectionsFn({ data: { meetingId } }),
  },
} as const;

export type MeetingCalendarSDKType = typeof MeetingCalendarSDK;
