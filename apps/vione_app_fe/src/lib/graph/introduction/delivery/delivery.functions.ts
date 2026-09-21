// BC-6.3 — Introduction Delivery server-fn RPC boundary.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  IntroductionDeliveryDTO,
  IntroductionDeliveryPageDTO,
  PendingDeliveryItemDTO,
} from "./types";

const uuid = z.string().uuid();

export const deliverIntroductionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        introductionRequestId: uuid,
        deliveryNote: z.string().max(500).optional(),
        idempotencyKey: z.string().min(8).max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }): Promise<IntroductionDeliveryDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).deliverIntroduction(data);
  });

const idOnly = z.object({ deliveryId: uuid });

export const acknowledgeIntroductionDeliveryFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).acknowledgeDelivery(data.deliveryId);
  });

export const revokeIntroductionDeliveryFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).revokeDelivery(data.deliveryId);
  });

export const getIntroductionDeliveryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(null as any as never, context.userId).getDelivery(
      data.deliveryId,
    );
  });

const listOpts = z
  .object({
    status: z.enum(["active", "terminal", "all"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().max(2048).nullable().optional(),
  })
  .optional();

export const listIncomingIntroductionDeliveriesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryPageDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).listIncomingForTarget(data);
  });

export const listOutgoingIntroductionDeliveriesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryPageDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).listOutgoingForIntermediary(data);
  });

export const listRequesterIntroductionDeliveriesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionDeliveryPageDTO> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).listStatusForRequester(data);
  });

export const listPendingIntroductionDeliveriesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }): Promise<PendingDeliveryItemDTO[]> => {
    const { IntroductionDeliveryService } = await import("./delivery.service.server");
    return new IntroductionDeliveryService(
      null as any as never,
      context.userId,
    ).listPendingDeliveries();
  });
