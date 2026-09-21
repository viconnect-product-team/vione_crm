// BC-4.4 — Recommendation server-fn adapter.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type { RecommendationPageDTO } from "./types";

const input = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeKinds: z.array(z.string().min(1).max(48)).max(8).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(2048).nullable().optional(),
  includeReasonDetails: z.boolean().optional(),
});

export const graphRecommendConnectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }): Promise<RecommendationPageDTO> => {
    const { RecommendationService } = await import("./recommendation.service.server");
    const svc = new RecommendationService(null as any as never, context.userId);
    return svc.recommendConnections(data);
  });
