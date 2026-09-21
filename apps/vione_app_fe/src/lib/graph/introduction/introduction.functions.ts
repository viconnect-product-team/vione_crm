// BC-6.0 — Smart Introduction server-fn adapter.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type { SmartIntroductionPageDTO } from "./types";

const input = z.object({
  targetPersonNodeId: z.string().uuid(),
  limit: z.number().int().min(1).max(25).optional(),
  maxDepth: z.union([z.literal(2), z.literal(3)]).optional(),
  includeAlternatives: z.boolean().optional(),
  cursor: z.string().max(2048).nullable().optional(),
});

export const graphFindIntroductionPathsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }): Promise<SmartIntroductionPageDTO> => {
    const { SmartIntroductionService } = await import("./introduction.service.server");
    const svc = new SmartIntroductionService(null as any as never, context.userId);
    return svc.findIntroductionPaths(data);
  });
