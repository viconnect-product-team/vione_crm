// BC-7.7 Turn C — React Query hooks for the calendar & availability surface.
// UI goes through these hooks → MeetingCalendarSDK → server functions.
// No component should touch the SDK or server-fn modules directly.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { MeetingCalendarSDK, type CreateProposalsInput } from "./sdk";
import { meetingCalendarKeys } from "./query-keys";
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

// ── Preferences ──────────────────────────────────────────────────────────────

export function useAvailabilityPreferences() {
  return useQuery<AvailabilityPreferencesDTO | null>({
    queryKey: meetingCalendarKeys.preferences(),
    queryFn: () => MeetingCalendarSDK.preferences.get(),
    staleTime: 30_000,
  });
}

export function useUpdateAvailabilityPreferences(): UseMutationResult<
  AvailabilityPreferencesDTO,
  Error,
  UpdatePreferencesInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => MeetingCalendarSDK.preferences.update(input),
    onSuccess: (row) => {
      qc.setQueryData(meetingCalendarKeys.preferences(), row);
    },
  });
}

// ── Availability finder ─────────────────────────────────────────────────────

export function useCommonAvailability(input: FindCommonAvailabilityInput | null) {
  return useQuery<AvailabilitySlotDTO[]>({
    queryKey: input
      ? meetingCalendarKeys.commonAvailability(input)
      : [...meetingCalendarKeys.all, "common-availability", "disabled"],
    queryFn: () => MeetingCalendarSDK.availability.findCommon(input as FindCommonAvailabilityInput),
    enabled: !!input,
    staleTime: 15_000,
  });
}

// ── Proposals ───────────────────────────────────────────────────────────────

export function useMeetingTimeProposals(meetingId: string | null | undefined) {
  return useQuery<MeetingTimeProposalDTO[]>({
    queryKey: meetingCalendarKeys.proposals(meetingId ?? ""),
    queryFn: () => MeetingCalendarSDK.proposals.list(meetingId as string),
    enabled: !!meetingId,
    staleTime: 10_000,
  });
}

export function useCreateTimeProposals(): UseMutationResult<
  MeetingTimeProposalDTO[],
  Error,
  CreateProposalsInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => MeetingCalendarSDK.proposals.create(input),
    onSuccess: (_rows, input) => {
      qc.invalidateQueries({
        queryKey: meetingCalendarKeys.proposals(input.meetingId),
      });
    },
  });
}

export function useRespondToProposal(
  meetingId: string,
): UseMutationResult<
  MeetingTimeProposalResponseDTO,
  Error,
  { proposalId: string; response: MeetingTimeProposalResponseValue }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, response }) =>
      MeetingCalendarSDK.proposals.respond(proposalId, response),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: meetingCalendarKeys.proposals(meetingId),
      });
    },
  });
}

export function useSelectProposal(
  meetingId: string,
): UseMutationResult<
  MeetingTimeProposalDTO,
  Error,
  { proposalId: string; expectedMeetingVersion?: number }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, expectedMeetingVersion }) =>
      MeetingCalendarSDK.proposals.select(proposalId, expectedMeetingVersion),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: meetingCalendarKeys.proposals(meetingId),
      });
      qc.invalidateQueries({
        queryKey: meetingCalendarKeys.projections(meetingId),
      });
    },
  });
}

// ── Projections (sync status) ───────────────────────────────────────────────

export function useMeetingProjections(meetingId: string | null | undefined) {
  return useQuery<CalendarProjectionDTO[]>({
    queryKey: meetingCalendarKeys.projections(meetingId ?? ""),
    queryFn: () => MeetingCalendarSDK.projections.list(meetingId as string),
    enabled: !!meetingId,
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}
