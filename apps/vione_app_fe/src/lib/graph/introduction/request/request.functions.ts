// BC-6.2 — Introduction Request server-fn RPC boundary.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type { IntroductionRequestDTO, IntroductionRequestPageDTO } from "./types";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const uuid = z.string().uuid();

export const sendIntroductionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        targetPersonNodeId: uuid,
        pathId: z.string().min(1).max(200),
        requestNote: z.string().max(500).optional(),
        idempotencyKey: z.string().min(8).max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }): Promise<IntroductionRequestDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    const svc = new IntroductionRequestService(getDb(context) as never, context.userId);
    return svc.sendRequest(data);
  });

const idOnly = z.object({ requestId: uuid });

export const acceptIntroductionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).acceptRequest(
      data.requestId,
    );
  });

export const declineIntroductionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).declineRequest(
      data.requestId,
    );
  });

export const cancelIntroductionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).cancelRequest(
      data.requestId,
    );
  });

export const getIntroductionRequestFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => idOnly.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).getRequest(
      data.requestId,
    );
  });

const listOpts = z
  .object({
    status: z.enum(["pending", "terminal", "all"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().max(2048).nullable().optional(),
  })
  .optional();

export const listIncomingIntroductionRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestPageDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).listIncoming(
      data,
    );
  });

export const listOutgoingIntroductionRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionRequestPageDTO> => {
    const { IntroductionRequestService } = await import("./request.service.server");
    return new IntroductionRequestService(getDb(context) as never, context.userId).listOutgoing(
      data,
    );
  });
