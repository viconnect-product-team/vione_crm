// BC-9.1 Turn A — Authenticated server functions (read-only surface).
// Turn A exposes ONLY read paths; extraction/mutation lands in Turn B.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  RELATIONSHIP_MEMORY_KINDS,
  RELATIONSHIP_MEMORY_STATUSES,
  RELATIONSHIP_MEMORY_SENSITIVITY,
  RELATIONSHIP_MEMORY_SUBJECT_TYPES,
} from "./registry";
import { RELATIONSHIP_MEMORY_PAGE_SIZE_DEFAULT, RELATIONSHIP_MEMORY_PAGE_SIZE_MAX } from "./types";

type Ctx = { supabase: any; userId: string };

const subjectSchema = z
  .object({
    type: z.enum(RELATIONSHIP_MEMORY_SUBJECT_TYPES),
    ref: z.string().min(1).max(200),
  })
  .optional();

const filterSchema = z.object({
  subject: subjectSchema,
  kinds: z.array(z.enum(RELATIONSHIP_MEMORY_KINDS)).nullish(),
  statuses: z.array(z.enum(RELATIONSHIP_MEMORY_STATUSES)).nullish(),
  minConfidence: z.number().min(0).max(1).nullish(),
  maxSensitivity: z.enum(RELATIONSHIP_MEMORY_SENSITIVITY).nullish(),
  limit: z.number().int().min(1).max(RELATIONSHIP_MEMORY_PAGE_SIZE_MAX).nullish(),
  cursor: z.string().min(1).max(4096).nullish(),
});

export const listRelationshipMemoriesFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => filterSchema.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { RelationshipMemoryRepository } = await import("./repository.server");
    const result = await RelationshipMemoryRepository.list(supabase, userId, {
      subject: data.subject ?? undefined,
      kinds: data.kinds ?? undefined,
      statuses: data.statuses ?? undefined,
      minConfidence: data.minConfidence ?? undefined,
      maxSensitivity: data.maxSensitivity ?? undefined,
      limit: data.limit ?? RELATIONSHIP_MEMORY_PAGE_SIZE_DEFAULT,
      cursor: data.cursor ?? null,
    });
    return result as any;
  });

export const getRelationshipMemoryByIdFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { RelationshipMemoryRepository } = await import("./repository.server");
    const result = await RelationshipMemoryRepository.getById(supabase, userId, data.id);
    return result as any;
  });
