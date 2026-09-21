// BC-7.10 Turn C — React Query hooks wrapping MeetingCollaborationSDK.
// Agenda + Shared Notes + Private Notes. Errors are normalized to
// MeetingCollaborationError codes so components can map to translated toasts.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MeetingAgendaSDK,
  MeetingPrivateNoteSDK,
  MeetingSharedNoteSDK,
} from "@/lib/meeting/collaboration/sdk";
import { mapMeetingCollaborationError } from "@/lib/meeting/collaboration/errors";
import type {
  CreateAgendaItemInput,
  DeleteAgendaItemInput,
  MeetingAgendaItemDTO,
  MeetingPrivateNoteDTO,
  MeetingSharedNoteDTO,
  PublishSharedNoteInput,
  ReorderAgendaInput,
  SetAgendaItemStatusInput,
  UpdateAgendaItemInput,
  UpdateSharedNoteInput,
  UpsertPrivateNoteInput,
} from "@/lib/meeting/collaboration/types";

export const meetingCollaborationKeys = {
  agenda: (meetingId: string) => ["meeting-agenda", meetingId] as const,
  sharedNote: (meetingId: string) => ["meeting-shared-note", meetingId] as const,
  privateNote: (meetingId: string) => ["meeting-private-note", meetingId] as const,
  timeline: (meetingId: string) => ["meeting-workspace-timeline", meetingId] as const,
};

async function run<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw mapMeetingCollaborationError(e);
  }
}

// -------- Agenda --------

export function useMeetingAgenda(meetingId: string) {
  return useQuery<MeetingAgendaItemDTO[]>({
    queryKey: meetingCollaborationKeys.agenda(meetingId),
    queryFn: () => run(MeetingAgendaSDK.listAgenda(meetingId)),
    enabled: Boolean(meetingId),
  });
}

function invalidateAgenda(qc: ReturnType<typeof useQueryClient>, meetingId: string) {
  qc.invalidateQueries({ queryKey: meetingCollaborationKeys.agenda(meetingId) });
}

export function useCreateAgendaItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgendaItemInput) => run(MeetingAgendaSDK.createAgendaItem(input)),
    onSuccess: () => invalidateAgenda(qc, meetingId),
  });
}

export function useUpdateAgendaItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAgendaItemInput) => run(MeetingAgendaSDK.updateAgendaItem(input)),
    onSuccess: () => invalidateAgenda(qc, meetingId),
  });
}

export function useSetAgendaItemStatus(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetAgendaItemStatusInput) =>
      run(MeetingAgendaSDK.setAgendaItemStatus(input)),
    onSuccess: () => invalidateAgenda(qc, meetingId),
  });
}

export function useReorderAgenda(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderAgendaInput) => run(MeetingAgendaSDK.reorderAgenda(input)),
    onSuccess: () => invalidateAgenda(qc, meetingId),
  });
}

export function useDeleteAgendaItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteAgendaItemInput) => run(MeetingAgendaSDK.deleteAgendaItem(input)),
    onSuccess: () => invalidateAgenda(qc, meetingId),
  });
}

// -------- Shared Notes --------

export function useSharedNote(meetingId: string) {
  return useQuery<MeetingSharedNoteDTO | null>({
    queryKey: meetingCollaborationKeys.sharedNote(meetingId),
    queryFn: () => run(MeetingSharedNoteSDK.getNote(meetingId)),
    enabled: Boolean(meetingId),
  });
}

function invalidateSharedNote(qc: ReturnType<typeof useQueryClient>, meetingId: string) {
  qc.invalidateQueries({ queryKey: meetingCollaborationKeys.sharedNote(meetingId) });
  qc.invalidateQueries({ queryKey: meetingCollaborationKeys.timeline(meetingId) });
}

export function useInitSharedNote(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(MeetingSharedNoteSDK.initNote(meetingId)),
    onSuccess: () => invalidateSharedNote(qc, meetingId),
  });
}

export function useUpdateSharedNote(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSharedNoteInput) => run(MeetingSharedNoteSDK.updateDraft(input)),
    onSuccess: () => invalidateSharedNote(qc, meetingId),
  });
}

export function usePublishSharedNote(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishSharedNoteInput) => run(MeetingSharedNoteSDK.publish(input)),
    onSuccess: () => invalidateSharedNote(qc, meetingId),
  });
}

// -------- Private Notes --------

export function usePrivateNote(meetingId: string) {
  return useQuery<MeetingPrivateNoteDTO | null>({
    queryKey: meetingCollaborationKeys.privateNote(meetingId),
    queryFn: () => run(MeetingPrivateNoteSDK.getMyNote(meetingId)),
    enabled: Boolean(meetingId),
  });
}

export function useUpsertPrivateNote(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertPrivateNoteInput) => run(MeetingPrivateNoteSDK.upsertMyNote(input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meetingCollaborationKeys.privateNote(meetingId) });
    },
  });
}
