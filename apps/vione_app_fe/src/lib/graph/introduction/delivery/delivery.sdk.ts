// BC-6.3 — IntroductionDeliverySDK (client-safe façade).
import {
  acknowledgeIntroductionDeliveryFn,
  deliverIntroductionFn,
  getIntroductionDeliveryFn,
  listIncomingIntroductionDeliveriesFn,
  listOutgoingIntroductionDeliveriesFn,
  listPendingIntroductionDeliveriesFn,
  listRequesterIntroductionDeliveriesFn,
  revokeIntroductionDeliveryFn,
} from "./delivery.functions";
import type {
  DeliverIntroductionInput,
  IntroductionDeliveryDTO,
  IntroductionDeliveryPageDTO,
  ListDeliveriesOptions,
  PendingDeliveryItemDTO,
} from "./types";

export const IntroductionDeliverySDK = {
  deliverIntroduction: (i: DeliverIntroductionInput): Promise<IntroductionDeliveryDTO> =>
    deliverIntroductionFn({ data: i }),
  acknowledgeDelivery: (deliveryId: string): Promise<IntroductionDeliveryDTO> =>
    acknowledgeIntroductionDeliveryFn({ data: { deliveryId } }),
  revokeDelivery: (deliveryId: string): Promise<IntroductionDeliveryDTO> =>
    revokeIntroductionDeliveryFn({ data: { deliveryId } }),
  getDelivery: (deliveryId: string): Promise<IntroductionDeliveryDTO> =>
    getIntroductionDeliveryFn({ data: { deliveryId } }),
  listIncomingForTarget: (o?: ListDeliveriesOptions): Promise<IntroductionDeliveryPageDTO> =>
    listIncomingIntroductionDeliveriesFn({ data: o ?? {} }),
  listOutgoingForIntermediary: (o?: ListDeliveriesOptions): Promise<IntroductionDeliveryPageDTO> =>
    listOutgoingIntroductionDeliveriesFn({ data: o ?? {} }),
  listStatusForRequester: (o?: ListDeliveriesOptions): Promise<IntroductionDeliveryPageDTO> =>
    listRequesterIntroductionDeliveriesFn({ data: o ?? {} }),
  listPendingDeliveries: (): Promise<PendingDeliveryItemDTO[]> =>
    listPendingIntroductionDeliveriesFn({ data: {} as never }),
};

export type IntroductionDeliverySDKType = typeof IntroductionDeliverySDK;
