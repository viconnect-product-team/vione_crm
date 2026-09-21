// BC-6.3 — Introduction Delivery React Query bindings.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IntroductionDeliverySDK,
  toIntroductionDeliveryError,
  type DeliverIntroductionInput,
  type IntroductionDeliveryDTO,
  type IntroductionDeliveryPageDTO,
  type ListDeliveriesOptions,
  type PendingDeliveryItemDTO,
} from "@/lib/graph";

export const introductionDeliveryKeys = {
  root: ["intro-delivery"] as const,
  inbox: (o?: ListDeliveriesOptions) =>
    ["intro-delivery", "inbox", o?.status ?? "all", o?.limit ?? 25] as const,
  outgoing: (o?: ListDeliveriesOptions) =>
    ["intro-delivery", "outgoing", o?.status ?? "all", o?.limit ?? 25] as const,
  requesterStatus: (o?: ListDeliveriesOptions) =>
    ["intro-delivery", "requester", o?.status ?? "all", o?.limit ?? 25] as const,
  pending: () => ["intro-delivery", "pending"] as const,
  detail: (id: string) => ["intro-delivery", "detail", id] as const,
};

export function useIncomingIntroductionDeliveries(opts?: ListDeliveriesOptions) {
  return useQuery<IntroductionDeliveryPageDTO>({
    queryKey: introductionDeliveryKeys.inbox(opts),
    queryFn: () => IntroductionDeliverySDK.listIncomingForTarget(opts),
    staleTime: 30_000,
  });
}

export function useOutgoingIntroductionDeliveries(opts?: ListDeliveriesOptions) {
  return useQuery<IntroductionDeliveryPageDTO>({
    queryKey: introductionDeliveryKeys.outgoing(opts),
    queryFn: () => IntroductionDeliverySDK.listOutgoingForIntermediary(opts),
    staleTime: 30_000,
  });
}

export function useRequesterIntroductionDeliveries(opts?: ListDeliveriesOptions) {
  return useQuery<IntroductionDeliveryPageDTO>({
    queryKey: introductionDeliveryKeys.requesterStatus(opts),
    queryFn: () => IntroductionDeliverySDK.listStatusForRequester(opts),
    staleTime: 30_000,
  });
}

export function usePendingIntroductionDeliveries() {
  return useQuery<PendingDeliveryItemDTO[]>({
    queryKey: introductionDeliveryKeys.pending(),
    queryFn: () => IntroductionDeliverySDK.listPendingDeliveries(),
    staleTime: 30_000,
  });
}

function useInvalidateDeliverySets() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["intro-delivery", "inbox"] });
    qc.invalidateQueries({ queryKey: ["intro-delivery", "outgoing"] });
    qc.invalidateQueries({ queryKey: ["intro-delivery", "requester"] });
    qc.invalidateQueries({ queryKey: ["intro-delivery", "pending"] });
  };
}

export function useDeliverIntroduction() {
  const qc = useQueryClient();
  const invalidate = useInvalidateDeliverySets();
  return useMutation<IntroductionDeliveryDTO, Error, DeliverIntroductionInput>({
    mutationFn: (i) => IntroductionDeliverySDK.deliverIntroduction(i),
    onError: (err) => {
      throw toIntroductionDeliveryError(err);
    },
    onSuccess: (dto) => {
      invalidate();
      qc.setQueryData(introductionDeliveryKeys.detail(dto.id), dto);
    },
  });
}

export function useAcknowledgeIntroductionDelivery() {
  const qc = useQueryClient();
  const invalidate = useInvalidateDeliverySets();
  return useMutation<IntroductionDeliveryDTO, Error, string>({
    mutationFn: (id) => IntroductionDeliverySDK.acknowledgeDelivery(id),
    onSuccess: (dto) => {
      invalidate();
      qc.setQueryData(introductionDeliveryKeys.detail(dto.id), dto);
    },
  });
}

export function useRevokeIntroductionDelivery() {
  const qc = useQueryClient();
  const invalidate = useInvalidateDeliverySets();
  return useMutation<IntroductionDeliveryDTO, Error, string>({
    mutationFn: (id) => IntroductionDeliverySDK.revokeDelivery(id),
    onSuccess: (dto) => {
      invalidate();
      qc.setQueryData(introductionDeliveryKeys.detail(dto.id), dto);
    },
  });
}
