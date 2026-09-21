// BC-Mobile-4A — card scan RPC (thin).
// Directs all requests to backend NestJS RESTful API.

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type { CardScanResponse } from "./card-scan.types";

const DATA_URL_MAX_CHARS = 3 * 1024 * 1024;

const scanInput = z.object({
  imageDataUrl: z
    .string()
    .min(64)
    .max(DATA_URL_MAX_CHARS)
    .refine((s) => s.startsWith("data:image/jpeg"), "processed card image must be a JPEG data URL"),
  clientToken: z.string().uuid(),
});

export const bcMobileCardScanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => scanInput.parse(data))
  .handler(async ({ data, context }): Promise<CardScanResponse> => {
    return fetchNestApiFromServer("/connect-app/card-scan", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
