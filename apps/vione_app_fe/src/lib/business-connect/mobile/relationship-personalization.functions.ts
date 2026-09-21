// BC-Mobile-6C — Personalization RPC (thin wrappers only).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type {
  BcMobileGetPersonalizationResult,
  BcMobileRecordInteractionResult,
  BcMobileResetPersonalizationResult,
  BcMobileUpdateRelationshipIntelPreferencesResult,
} from "./relationship-personalization.types";

const updateSchema = z
  .object({
    recommendationsEnabled: z.boolean().optional(),
    reconnectEnabled: z.boolean().optional(),
    reconnectCadence: z.enum(["auto", "more_often", "normal", "less_often"]).optional(),
    preferredContactAction: z.enum(["auto", "call", "email"]).optional(),
    behavioralAdaptationEnabled: z.boolean().optional(),
  })
  .refine((o) => Object.values(o).some((v) => v !== undefined), {
    message: "At least one preference field is required",
  });

const recordSchema = z.object({
  kind: z.enum([
    "recommendation_opened",
    "recommendation_dismissed",
    "action_call_selected",
    "action_email_selected",
    "action_person_opened",
    "action_moment_selected",
  ]),
  recommendationType: z.literal("reconnect").nullish(),
});

export const bcRelPersonalizationGetFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BcMobileGetPersonalizationResult> => {
    return fetchNestApiFromServer("/connect-app/network/personalization/get", context.token);
  });

export const bcRelPersonalizationUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }): Promise<BcMobileUpdateRelationshipIntelPreferencesResult> => {
    return fetchNestApiFromServer("/connect-app/network/personalization/update", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const bcRelPersonalizationRecordInteractionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => recordSchema.parse(input))
  .handler(async ({ data, context }): Promise<BcMobileRecordInteractionResult> => {
    return fetchNestApiFromServer(
      "/connect-app/network/personalization/record-interaction",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

export const bcRelPersonalizationResetFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BcMobileResetPersonalizationResult> => {
    return fetchNestApiFromServer("/connect-app/network/personalization/reset", context.token, {
      method: "POST",
    });
  });
