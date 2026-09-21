// BC-6.4 — Introduction Outcome server-fn RPC boundary.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type { IntroductionOutcomeDTO, IntroductionOutcomePageDTO } from "./types";

const uuid = z.string().uuid();

const listOpts = z
  .object({
    status: z.enum(["pending", "resolved", "expired", "all"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().max(2048).nullable().optional(),
  })
  .optional();

export const getIntroductionOutcomeFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ outcomeId: uuid }).parse(i))
  .handler(async ({ data, context }): Promise<IntroductionOutcomeDTO> => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(null as any as never, context.userId).getOutcome(
      data.outcomeId,
    );
  });

export const listRequesterIntroductionOutcomesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionOutcomePageDTO> => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(
      null as any as never,
      context.userId,
    ).listRequesterOutcomes(data);
  });

export const listIntermediaryIntroductionOutcomesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i))
  .handler(async ({ data, context }): Promise<IntroductionOutcomePageDTO> => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(
      null as any as never,
      context.userId,
    ).listIntermediaryOutcomes(data);
  });

export const markIntroductionOutcomeProgressedFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z.object({ outcomeId: uuid, note: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data, context }): Promise<IntroductionOutcomeDTO> => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(null as any as never, context.userId).markProgressed(
      { outcomeId: data.outcomeId, note: data.note },
    );
  });

export const markIntroductionOutcomeNoOutcomeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ outcomeId: uuid }).parse(i))
  .handler(async ({ data, context }): Promise<IntroductionOutcomeDTO> => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(null as any as never, context.userId).markNoOutcome(
      data.outcomeId,
    );
  });

export const getIntermediaryIntroductionImpactFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { IntroductionOutcomeService } = await import("./outcome.service.server");
    return new IntroductionOutcomeService(
      null as any as never,
      context.userId,
    ).getIntermediaryImpact();
  });
