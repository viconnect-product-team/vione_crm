// BC-2.6 — Business Interaction server functions.
//
// Thin adapters over BusinessInteractionService. Every function is owner-scoped
// via requireSupabaseAuth (owner = auth.uid()); RLS enforces the same on the
// business_interactions table. No relationship or profile data is duplicated.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { BusinessInteractionService } from "./interaction.service";

const interactionTypeSchema = z.enum([
  "meeting",
  "call",
  "email",
  "qr_scan",
  "nfc_tap",
  "wallet_save",
  "website_visit",
  "referral",
  "business_lunch",
  "conference",
  "event",
  "demo",
  "proposal",
  "contract",
  "follow_up",
  "other",
]);

const metadataSchema = z.record(z.string(), z.unknown()).optional();

/** Create an immutable business interaction on a relationship the caller owns. */
export const createInteractionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        relationshipId: z.string().uuid(),
        companyId: z.string().uuid().nullable().optional(),
        type: interactionTypeSchema,
        occurredAt: z.string().max(40).nullable().optional(),
        title: z.string().max(200).nullable().optional(),
        note: z.string().max(4000).nullable().optional(),
        location: z.string().max(200).nullable().optional(),
        metadata: metadataSchema,
      })
      .parse(d),
  )
  .handler(({ data, context }) =>
    BusinessInteractionService.create(null as any, context.userId, {
      relationshipId: data.relationshipId,
      companyId: data.companyId ?? null,
      type: data.type,
      occurredAt: data.occurredAt ?? null,
      title: data.title ?? null,
      note: data.note ?? null,
      location: data.location ?? null,
      metadata: (data.metadata ?? {}) as Record<string, never>,
    }),
  );

/** Patch an interaction the caller owns. */
export const updateInteractionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        companyId: z.string().uuid().nullable().optional(),
        type: interactionTypeSchema.optional(),
        occurredAt: z.string().max(40).nullable().optional(),
        title: z.string().max(200).nullable().optional(),
        note: z.string().max(4000).nullable().optional(),
        location: z.string().max(200).nullable().optional(),
        metadata: metadataSchema,
      })
      .parse(d),
  )
  .handler(({ data, context }) => {
    const { id, ...patch } = data;
    return BusinessInteractionService.update(null as any, context.userId, id, {
      ...patch,
      metadata: patch.metadata as Record<string, never> | undefined,
    });
  });

/** Delete an interaction the caller owns. */
export const deleteInteractionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(({ data, context }) =>
    BusinessInteractionService.delete(null as any, context.userId, data.id),
  );

/** List interactions for one relationship or the whole graph (newest first). */
export const listInteractionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ relationshipId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(({ data, context }) =>
    BusinessInteractionService.list(null as any, context.userId, data.relationshipId),
  );

/** Derived interaction timeline for one relationship. */
export const interactionTimelineFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ relationshipId: z.string().uuid() }).parse(d))
  .handler(({ data, context }) =>
    BusinessInteractionService.timeline(null as any, context.userId, data.relationshipId),
  );
