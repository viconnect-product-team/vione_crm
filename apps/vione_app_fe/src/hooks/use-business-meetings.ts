// BC-4.1C — Business Meetings query + mutation hooks.
// UI reaches the domain ONLY through these hooks → BusinessMeetingSDK → server
// functions. No component imports the SDK, service, functions, or supabase
// client directly. Mutations invalidate precise query keys and surface stable
// i18n error keys (never raw SQL/RLS text).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { BusinessMeetingSDK, type RescheduleInput } from "@/lib/business-meetings/client-sdk";
import { businessMeetingKeys, type MeetingListFilters } from "@/lib/business-meetings/query-keys";
import { isReconcileError } from "@/lib/business-meetings/error-messages";
import type {
  BusinessMeetingMutationResult,
  MeetingCountsDTO,
  MeetingDetailDTO,
  MeetingListItemDTO,
  ProposalHistoryDTO,
} from "@/lib/business-meetings/types";

export type MeetingSection = "upcoming" | "pending" | "past" | "cancelled";

const LIST_READERS: Record<
  MeetingSection,
  (f?: MeetingListFilters) => Promise<MeetingListItemDTO[]>
> = {
  upcoming: (f) => BusinessMeetingSDK.meetings.listUpcoming(f),
  pending: (f) => BusinessMeetingSDK.meetings.listPending(f),
  past: (f) => BusinessMeetingSDK.meetings.listPast(f),
  cancelled: (f) => BusinessMeetingSDK.meetings.listCancelled(f),
};

const LIST_KEYS: Record<MeetingSection, (f?: MeetingListFilters) => readonly unknown[]> = {
  upcoming: businessMeetingKeys.upcoming,
  pending: businessMeetingKeys.pending,
  past: businessMeetingKeys.past,
  cancelled: businessMeetingKeys.cancelled,
};

export function useMeetingList(section: MeetingSection, filters?: MeetingListFilters) {
  return useQuery({
    queryKey: LIST_KEYS[section](filters),
    queryFn: () => LIST_READERS[section](filters),
    staleTime: 15_000,
  });
}

export function useMeetingCounts() {
  return useQuery<MeetingCountsDTO>({
    queryKey: businessMeetingKeys.counts(),
    queryFn: () => BusinessMeetingSDK.meetings.countByStatus(),
    staleTime: 15_000,
  });
}

export function useMeetingDetail(meetingId: string | null | undefined) {
  return useQuery<MeetingDetailDTO>({
    queryKey: businessMeetingKeys.detail(meetingId ?? ""),
    queryFn: () => BusinessMeetingSDK.meetings.get(meetingId as string),
    enabled: !!meetingId,
    staleTime: 10_000,
  });
}

export function useMeetingProposalHistory(meetingId: string | null | undefined) {
  return useQuery<ProposalHistoryDTO>({
    queryKey: businessMeetingKeys.proposals(meetingId ?? ""),
    queryFn: () => BusinessMeetingSDK.meetings.getProposalHistory(meetingId as string),
    enabled: !!meetingId,
    staleTime: 10_000,
  });
}

/** Invalidate every list + counts + a specific detail/history after a mutation. */
function useReconcile() {
  const qc = useQueryClient();
  return (meetingId?: string) => {
    qc.invalidateQueries({ queryKey: [...businessMeetingKeys.all, "list"] });
    qc.invalidateQueries({ queryKey: businessMeetingKeys.counts() });
    if (meetingId) {
      qc.invalidateQueries({ queryKey: businessMeetingKeys.detail(meetingId) });
      qc.invalidateQueries({ queryKey: businessMeetingKeys.proposals(meetingId) });
    }
  };
}

export type MeetingMutations = {
  accept: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; version: number }
  >;
  decline: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; version: number; reason?: string }
  >;
  tentative: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; version: number }
  >;
  propose: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; baseVersion: number; input: RescheduleInput }
  >;
  cancel: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; reason?: string; expectedVersion?: number }
  >;
  complete: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; expectedVersion?: number }
  >;
  markNoShow: UseMutationResult<
    BusinessMeetingMutationResult,
    Error,
    { meetingId: string; expectedVersion?: number }
  >;
};

/**
 * Meeting lifecycle mutations. Callers pass onSuccess/onError to surface toasts
 * with i18n keys; reconcile-class errors still refetch so the UI self-heals.
 */
export function useMeetingMutations(callbacks?: {
  onSuccess?: (kind: keyof MeetingMutations, res: BusinessMeetingMutationResult) => void;
  onError?: (kind: keyof MeetingMutations, err: unknown) => void;
}): MeetingMutations {
  const reconcile = useReconcile();

  const wrap = (kind: keyof MeetingMutations) => (res: BusinessMeetingMutationResult) => {
    reconcile(res.meetingId);
    callbacks?.onSuccess?.(kind, res);
  };
  const wrapErr = (kind: keyof MeetingMutations, meetingId?: string) => (err: unknown) => {
    if (isReconcileError(err)) reconcile(meetingId);
    callbacks?.onError?.(kind, err);
  };

  const accept = useMutation({
    mutationFn: (v: { meetingId: string; version: number }) =>
      BusinessMeetingSDK.meetings.accept(v.meetingId, v.version),
    onSuccess: wrap("accept"),
    onError: (e, v) => wrapErr("accept", v.meetingId)(e),
  });
  const decline = useMutation({
    mutationFn: (v: { meetingId: string; version: number; reason?: string }) =>
      BusinessMeetingSDK.meetings.decline(v.meetingId, v.version, { reason: v.reason }),
    onSuccess: wrap("decline"),
    onError: (e, v) => wrapErr("decline", v.meetingId)(e),
  });
  const tentative = useMutation({
    mutationFn: (v: { meetingId: string; version: number }) =>
      BusinessMeetingSDK.meetings.tentativelyAccept(v.meetingId, v.version),
    onSuccess: wrap("tentative"),
    onError: (e, v) => wrapErr("tentative", v.meetingId)(e),
  });
  const propose = useMutation({
    mutationFn: (v: { meetingId: string; baseVersion: number; input: RescheduleInput }) =>
      BusinessMeetingSDK.meetings.proposeNewTime(v.meetingId, v.baseVersion, v.input),
    onSuccess: wrap("propose"),
    onError: (e, v) => wrapErr("propose", v.meetingId)(e),
  });
  const cancel = useMutation({
    mutationFn: (v: { meetingId: string; reason?: string; expectedVersion?: number }) =>
      BusinessMeetingSDK.meetings.cancel(v.meetingId, {
        reason: v.reason,
        expectedVersion: v.expectedVersion,
      }),
    onSuccess: wrap("cancel"),
    onError: (e, v) => wrapErr("cancel", v.meetingId)(e),
  });
  const complete = useMutation({
    mutationFn: (v: { meetingId: string; expectedVersion?: number }) =>
      BusinessMeetingSDK.meetings.complete(v.meetingId, { expectedVersion: v.expectedVersion }),
    onSuccess: wrap("complete"),
    onError: (e, v) => wrapErr("complete", v.meetingId)(e),
  });
  const markNoShow = useMutation({
    mutationFn: (v: { meetingId: string; expectedVersion?: number }) =>
      BusinessMeetingSDK.meetings.markNoShow(v.meetingId, { expectedVersion: v.expectedVersion }),
    onSuccess: wrap("markNoShow"),
    onError: (e, v) => wrapErr("markNoShow", v.meetingId)(e),
  });

  return { accept, decline, tentative, propose, cancel, complete, markNoShow };
}
