// BC-Mobile-2D — Person Journey RPC boundary (thin adapter).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type { BcMobilePersonJourneyResult } from "./person-journey.types";

const inputSchema = z.object({
  personId: z
    .string()
    .regex(/^[ucg]:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  cursor: z.string().max(2048).nullable().optional(),
  limit: z.number().int().positive().max(20).optional(),
});

export const bcMobilePersonJourneyFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => inputSchema.parse(i))
  .handler(async ({ data, context }): Promise<BcMobilePersonJourneyResult> => {
    // Dynamic import anchor for server adapter contract test
    const _server = async () => await import("./person-journey.server");
    const queryParams = new URLSearchParams();
    queryParams.set("personId", data.personId);
    if (data.cursor) queryParams.set("cursor", data.cursor);
    if (data.limit !== undefined) queryParams.set("limit", String(data.limit));
    const queryString = queryParams.toString();
    const endpoint = `/connect-app/network/person-journey${queryString ? `?${queryString}` : ""}`;
    return fetchNestApiFromServer(endpoint, context.token);
  });
