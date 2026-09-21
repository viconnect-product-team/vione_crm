// BC-6.2 — Introduction Request React Query bindings.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IntroductionRequestSDK,
  toIntroductionRequestError,
  type IntroductionRequestDTO,
  type IntroductionRequestPageDTO,
  type ListRequestsOptions,
  type SendIntroductionRequestInput,
} from "@/lib/graph";

export const introductionRequestKeys = {
  root: ["intro-request"] as const,
  incoming: (o?: ListRequestsOptions) =>
    ["intro-request", "incoming", o?.status ?? "all", o?.limit ?? 25] as const,
  outgoing: (o?: ListRequestsOptions) =>
    ["intro-request", "outgoing", o?.status ?? "all", o?.limit ?? 25] as const,
  detail: (id: string) => ["intro-request", "detail", id] as const,
  state: (pathId: string) => ["intro-request", "state", pathId] as const,
};

export function useIncomingIntroductionRequests(opts?: ListRequestsOptions) {
  return useQuery<IntroductionRequestPageDTO>({
    queryKey: introductionRequestKeys.incoming(opts),
    queryFn: () => IntroductionRequestSDK.listIncoming(opts),
    staleTime: 30_000,
  });
}

export function useOutgoingIntroductionRequests(opts?: ListRequestsOptions) {
  return useQuery<IntroductionRequestPageDTO>({
    queryKey: introductionRequestKeys.outgoing(opts),
    queryFn: () => IntroductionRequestSDK.listOutgoing(opts),
    staleTime: 30_000,
  });
}

function useInvalidateOutgoing() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["intro-request", "outgoing"] });
}
function useInvalidateIncoming() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["intro-request", "incoming"] });
}

export function useSendIntroductionRequest() {
  const qc = useQueryClient();
  const invalidateOutgoing = useInvalidateOutgoing();
  return useMutation<IntroductionRequestDTO, Error, SendIntroductionRequestInput>({
    mutationFn: (input) => IntroductionRequestSDK.sendRequest(input),
    onError: (err) => {
      throw toIntroductionRequestError(err);
    },
    onSuccess: (dto) => {
      invalidateOutgoing();
      qc.setQueryData(introductionRequestKeys.detail(dto.id), dto);
      qc.invalidateQueries({
        queryKey: introductionRequestKeys.state(dto.selectedPath.pathId),
      });
    },
  });
}

export function useAcceptIntroductionRequest() {
  const qc = useQueryClient();
  const invalidateIncoming = useInvalidateIncoming();
  return useMutation<IntroductionRequestDTO, Error, string>({
    mutationFn: (id) => IntroductionRequestSDK.acceptRequest(id),
    onSuccess: (dto) => {
      invalidateIncoming();
      qc.setQueryData(introductionRequestKeys.detail(dto.id), dto);
      qc.invalidateQueries({
        queryKey: introductionRequestKeys.state(dto.selectedPath.pathId),
      });
    },
  });
}

export function useDeclineIntroductionRequest() {
  const qc = useQueryClient();
  const invalidateIncoming = useInvalidateIncoming();
  return useMutation<IntroductionRequestDTO, Error, string>({
    mutationFn: (id) => IntroductionRequestSDK.declineRequest(id),
    onSuccess: (dto) => {
      invalidateIncoming();
      qc.setQueryData(introductionRequestKeys.detail(dto.id), dto);
      qc.invalidateQueries({
        queryKey: introductionRequestKeys.state(dto.selectedPath.pathId),
      });
    },
  });
}

export function useCancelIntroductionRequest() {
  const qc = useQueryClient();
  const invalidateOutgoing = useInvalidateOutgoing();
  return useMutation<IntroductionRequestDTO, Error, string>({
    mutationFn: (id) => IntroductionRequestSDK.cancelRequest(id),
    onSuccess: (dto) => {
      invalidateOutgoing();
      qc.setQueryData(introductionRequestKeys.detail(dto.id), dto);
      qc.invalidateQueries({
        queryKey: introductionRequestKeys.state(dto.selectedPath.pathId),
      });
    },
  });
}
