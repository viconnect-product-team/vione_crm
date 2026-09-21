// BC-7.9 Turn C — React Query hooks for Meeting Outcome + Follow-up.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MeetingOutcomeSDK } from "@/lib/meeting/outcome/sdk";
import { mapMeetingOutcomeError } from "@/lib/meeting/outcome/errors";
import { mapMeetingFollowUpError } from "@/lib/meeting/follow-up/errors";
import type {
  CreateMeetingOutcomeInput,
  FinalizeMeetingOutcomeInput,
  MeetingOutcomeDTO,
  UpdateMeetingOutcomeInput,
} from "@/lib/meeting/outcome/types";
import type {
  CancelMeetingFollowUpInput,
  CreateMeetingFollowUpInput,
  MeetingFollowUpDTO,
  SetMeetingFollowUpStatusInput,
  UpdateMeetingFollowUpInput,
} from "@/lib/meeting/follow-up/types";

export const meetingOutcomeKeys = {
  outcome: (meetingId: string) => ["meeting-outcome", meetingId] as const,
  followUps: (meetingId: string) => ["meeting-follow-ups", meetingId] as const,
};

async function runOutcome<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw mapMeetingOutcomeError(e);
  }
}
async function runFollowUp<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw mapMeetingFollowUpError(e);
  }
}

// Outcome
export function useMeetingOutcome(meetingId: string) {
  return useQuery<MeetingOutcomeDTO | null>({
    queryKey: meetingOutcomeKeys.outcome(meetingId),
    queryFn: () => runOutcome(MeetingOutcomeSDK.getOutcome(meetingId)),
    enabled: Boolean(meetingId),
  });
}

function invalidateOutcome(qc: ReturnType<typeof useQueryClient>, meetingId: string) {
  qc.invalidateQueries({ queryKey: meetingOutcomeKeys.outcome(meetingId) });
  qc.invalidateQueries({ queryKey: ["meeting-workspace-timeline", meetingId] });
}

export function useCreateMeetingOutcome(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingOutcomeInput) =>
      runOutcome(MeetingOutcomeSDK.createOutcome(input)),
    onSuccess: () => invalidateOutcome(qc, meetingId),
  });
}

export function useUpdateMeetingOutcome(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeetingOutcomeInput) =>
      runOutcome(MeetingOutcomeSDK.updateOutcome(input)),
    onSuccess: () => invalidateOutcome(qc, meetingId),
  });
}

export function useFinalizeMeetingOutcome(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FinalizeMeetingOutcomeInput) =>
      runOutcome(MeetingOutcomeSDK.finalizeOutcome(input)),
    onSuccess: () => invalidateOutcome(qc, meetingId),
  });
}

// Follow-ups
export function useMeetingFollowUps(meetingId: string) {
  return useQuery<MeetingFollowUpDTO[]>({
    queryKey: meetingOutcomeKeys.followUps(meetingId),
    queryFn: () => runFollowUp(MeetingOutcomeSDK.listFollowUps(meetingId)),
    enabled: Boolean(meetingId),
  });
}

function invalidateFollowUps(qc: ReturnType<typeof useQueryClient>, meetingId: string) {
  qc.invalidateQueries({ queryKey: meetingOutcomeKeys.followUps(meetingId) });
  qc.invalidateQueries({ queryKey: ["meeting-workspace-timeline", meetingId] });
}

export function useCreateMeetingFollowUp(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingFollowUpInput) =>
      runFollowUp(MeetingOutcomeSDK.createFollowUp(input)),
    onSuccess: () => invalidateFollowUps(qc, meetingId),
  });
}

export function useUpdateMeetingFollowUp(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeetingFollowUpInput) =>
      runFollowUp(MeetingOutcomeSDK.updateFollowUp(input)),
    onSuccess: () => invalidateFollowUps(qc, meetingId),
  });
}

export function useSetMeetingFollowUpStatus(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetMeetingFollowUpStatusInput) =>
      runFollowUp(MeetingOutcomeSDK.setFollowUpStatus(input)),
    onSuccess: () => invalidateFollowUps(qc, meetingId),
  });
}

export function useCancelMeetingFollowUp(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelMeetingFollowUpInput) =>
      runFollowUp(MeetingOutcomeSDK.cancelFollowUp(input)),
    onSuccess: () => invalidateFollowUps(qc, meetingId),
  });
}
