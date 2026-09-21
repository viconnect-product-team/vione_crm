// BC-9.1 Turn B2c — Authenticated search server functions.
//
// Read-only; RLS applies via requireSupabaseAuth's request-scoped client.
// Vectors and raw source content are never returned.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  RELATIONSHIP_MEMORY_KINDS,
  RELATIONSHIP_MEMORY_SENSITIVITY,
  RELATIONSHIP_MEMORY_SUBJECT_TYPES,
} from "./registry";
import {
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX,
  RELATIONSHIP_MEMORY_QUERY_MAX_CHARS,
  RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH,
  RELATIONSHIP_MEMORY_GRAPH_MAX_NODES,
} from "./search-dto";

type Ctx = { supabase: any; userId: string };

const subjectSchema = z
  .object({
    type: z.enum(RELATIONSHIP_MEMORY_SUBJECT_TYPES),
    ref: z.string().min(1).max(200),
  })
  .optional();

const baseFilters = {
  subject: subjectSchema,
  kinds: z.array(z.enum(RELATIONSHIP_MEMORY_KINDS)).nullish(),
  minConfidence: z.number().min(0).max(1).nullish(),
  maxSensitivity: z.enum(RELATIONSHIP_MEMORY_SENSITIVITY).nullish(),
  includeHistorical: z.boolean().nullish(),
  includeCandidates: z.boolean().nullish(),
  limit: z.number().int().min(1).max(RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX).nullish(),
};

export const searchRelationshipMemoriesFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        queryText: z.string().min(1).max(RELATIONSHIP_MEMORY_QUERY_MAX_CHARS).nullish(),
        ...baseFilters,
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as unknown as Ctx;
    const filters = {
      subject: data.subject ?? undefined,
      kinds: data.kinds ?? undefined,
      minConfidence: data.minConfidence ?? undefined,
      maxSensitivity: data.maxSensitivity ?? undefined,
      includeHistorical: data.includeHistorical ?? false,
      includeCandidates: data.includeCandidates ?? false,
      limit: data.limit ?? undefined,
    };
    if (data.queryText && data.queryText.length > 0) {
      const { searchMemoriesSemantic } = await import("./retrieval.server");
      const { getQueryEmbedder } = await import("./query-embedder.server");
      const embedder = await getQueryEmbedder();
      return await searchMemoriesSemantic(
        supabase,
        { ...filters, queryText: data.queryText },
        { embedQuery: embedder },
      );
    }
    const { searchMemoriesStructured } = await import("./retrieval.server");
    return await searchMemoriesStructured(supabase, filters);
  });

export const listRelevantRelationshipMemoriesFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: subjectSchema,
        kinds: z.array(z.enum(RELATIONSHIP_MEMORY_KINDS)).nullish(),
        maxSensitivity: z.enum(RELATIONSHIP_MEMORY_SENSITIVITY).nullish(),
        limit: z.number().int().min(1).max(RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX).nullish(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as unknown as Ctx;
    const { searchMemoriesStructured } = await import("./retrieval.server");
    return await searchMemoriesStructured(supabase, {
      subject: data.subject ?? undefined,
      kinds: data.kinds ?? undefined,
      maxSensitivity: data.maxSensitivity ?? undefined,
      limit: data.limit ?? undefined,
    });
  });

export const getRelationshipMemoryGraphContextFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memoryId: z.string().uuid(),
        maxDepth: z.number().int().min(1).max(RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH).nullish(),
        maxNodes: z.number().int().min(1).max(RELATIONSHIP_MEMORY_GRAPH_MAX_NODES).nullish(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as unknown as Ctx;
    const { getMemoryGraphContext } = await import("./graph-context.server");
    return await getMemoryGraphContext(supabase, {
      rootMemoryId: data.memoryId,
      maxDepth: data.maxDepth ?? undefined,
      maxNodes: data.maxNodes ?? undefined,
    });
  });
