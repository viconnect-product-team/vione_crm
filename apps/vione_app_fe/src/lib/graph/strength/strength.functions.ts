// BC-4.3 — Relationship Strength — Authenticated server-fn adapter.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type { RelationshipStrengthResult } from "./types";

const input = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  scoringVersion: z.string().max(16).optional(),
});

export const graphRelationshipStrengthFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }): Promise<RelationshipStrengthResult> => {
    const { RelationshipStrengthService } = await import("./strength.service.server");
    const svc = new RelationshipStrengthService(null as any as never, context.userId);
    return svc.relationshipStrength(data);
  });
