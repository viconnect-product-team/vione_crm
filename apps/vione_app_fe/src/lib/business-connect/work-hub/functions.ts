// BC-8.0 — Authenticated server functions for the Work Hub read model.
// All handlers run under requireSupabaseAuth. No admin client. No mutations.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  WORK_HUB_CATEGORIES,
  WORK_HUB_SOURCE_TYPES,
  WORK_HUB_URGENCY,
  WORK_HUB_PAGE_SIZE_DEFAULT,
  WORK_HUB_PAGE_SIZE_MAX,
} from "./types";

type Ctx = { supabase: any; userId: string };

const iso = z.string().refine((v) => Number.isFinite(Date.parse(v)), "invalid date");

const filterSchema = z.object({
  category: z.enum(WORK_HUB_CATEGORIES).nullish(),
  sourceType: z.enum(WORK_HUB_SOURCE_TYPES).nullish(),
  urgency: z.enum(WORK_HUB_URGENCY).nullish(),
  fromDate: iso.nullish(),
  toDate: iso.nullish(),
  cursor: z.string().min(1).max(4096).nullish(),
  limit: z.number().int().min(1).max(WORK_HUB_PAGE_SIZE_MAX).nullish(),
});

export const getWorkHubSummaryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { WorkHubService } = await import("./service.server");
    return WorkHubService.getSummary(supabase, userId, new Date().toISOString());
  });

export const getWorkHubOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    const { token } = context as any;
    const { fetchNestApiFromServer } = await import("../../api-client");
    const raw = await fetchNestApiFromServer("/connect-app/briefing", token);
    const { WorkHubService } = await import("./service.server");
    return WorkHubService.getOverviewFromRaw(raw, new Date().toISOString());
  });

export const listWorkHubItemsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => filterSchema.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { WorkHubService } = await import("./service.server");
    return WorkHubService.listItems(supabase, userId, new Date().toISOString(), {
      category: data.category ?? null,
      sourceType: data.sourceType ?? null,
      urgency: data.urgency ?? null,
      fromDate: data.fromDate ?? null,
      toDate: data.toDate ?? null,
      cursor: data.cursor ?? null,
      limit: data.limit ?? WORK_HUB_PAGE_SIZE_DEFAULT,
    });
  });
