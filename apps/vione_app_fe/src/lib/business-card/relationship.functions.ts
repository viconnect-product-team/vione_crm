// BC-2.4 — Business Relationship (Saved Business Cards) server functions.
//
// Thin adapters over RelationshipService. Every function is owner-scoped via
// requireSupabaseAuth (owner = auth.uid()); RLS enforces the same on the table.
// No profile data is ever duplicated — reads embed the LIVE card summary.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { RelationshipService } from "./relationship.service";
import type { SavedCard } from "./relationship.types";

const sourceSchema = z.enum(["profile", "qr", "nfc", "url", "import"]);
const tagsSchema = z.array(z.string().max(60)).max(50);

/** List the caller's saved relationships (newest first, live target summary). */
export const listSavedCardsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<SavedCard[]> =>
      RelationshipService.list(null as any, context.userId),
  );

/** Whether the caller has saved a given target card. */
export const isSavedCardFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<boolean> =>
      RelationshipService.exists(null as any, context.userId, data.targetCardId),
  );

/** Save a relationship edge to a target card. */
export const saveCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetCardId: z.string().uuid(),
        source: sourceSchema.optional(),
        tags: tagsSchema.optional(),
        notes: z.string().max(4000).nullable().optional(),
        favorite: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      RelationshipService.save(null as any, context.userId, data),
  );

/**
 * Save via a public slug (import flows: QR / NFC / URL). Resolves the slug to a
 * card id through the public projection, then creates the edge. Never exposes
 * private data — resolution is subject to the card's own visibility.
 */
export const saveCardBySlugFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().min(1).max(120), source: sourceSchema.optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<SavedCard> => {
    const { BusinessCardService } = await import("./business-card.service");
    // BC-Mobile-3A — resolve the internal id server-side; the public DTO no
    // longer carries it. Fails closed to a generic not-found.
    const targetCardId = await BusinessCardService.resolvePublicCardId(data.slug);
    if (!targetCardId) throw new Error("REL_TARGET_NOT_FOUND");
    return RelationshipService.save(null as any, context.userId, {
      targetCardId,
      source: data.source ?? "url",
    });
  });

/**
 * BC-Mobile-3A — Saved-state check by public slug. Lets the anonymous-shaped
 * Public Card page render "already saved" for signed-in viewers without the
 * internal card id ever leaving the server.
 */
export const isSavedCardBySlugFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }): Promise<boolean> => {
    const { BusinessCardService } = await import("./business-card.service");
    const targetCardId = await BusinessCardService.resolvePublicCardId(data.slug);
    if (!targetCardId) return false;
    return RelationshipService.exists(null as any, context.userId, targetCardId);
  });

/** Remove a relationship edge by target card id. */
export const removeSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<{ removed: boolean }> =>
      RelationshipService.unsave(null as any, context.userId, data.targetCardId),
  );

/** BC-Mobile-3A — Remove a relationship edge by public slug (id stays server-side). */
export const removeSavedCardBySlugFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }): Promise<{ removed: boolean }> => {
    const { BusinessCardService } = await import("./business-card.service");
    const targetCardId = await BusinessCardService.resolvePublicCardId(data.slug);
    if (!targetCardId) return { removed: false };
    return RelationshipService.unsave(null as any, context.userId, targetCardId);
  });

/** Set the favorite flag on an edge. */
export const favoriteSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetCardId: z.string().uuid(), favorite: z.boolean() }).parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      RelationshipService.favorite(
        null as any,
        context.userId,
        data.targetCardId,
        data.favorite,
      ),
  );

/** Replace the private tag set on an edge. */
export const tagSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetCardId: z.string().uuid(), tags: tagsSchema }).parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      RelationshipService.tag(null as any, context.userId, data.targetCardId, data.tags),
  );

/** Set the private note on an edge. */
export const noteSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetCardId: z.string().uuid(), notes: z.string().max(4000).nullable() }).parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      RelationshipService.note(null as any, context.userId, data.targetCardId, data.notes),
  );

/** Patch owner-only relationship metadata (BC-2.4 + BC-2.5 intelligence fields). */
export const updateSavedCardMetadataFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetCardId: z.string().uuid(),
        favorite: z.boolean().optional(),
        tags: tagsSchema.optional(),
        notes: z.string().max(4000).nullable().optional(),
        firstMetAt: z.string().max(40).nullable().optional(),
        metAt: z.string().max(200).nullable().optional(),
        reminderAt: z.string().max(40).nullable().optional(),
        company: z.string().max(200).nullable().optional(),
        industry: z.string().max(120).nullable().optional(),
        interest: z.string().max(500).nullable().optional(),
        meetingPlace: z.string().max(200).nullable().optional(),
        event: z.string().max(200).nullable().optional(),
        referral: z.string().max(200).nullable().optional(),
        importance: z.number().int().min(0).max(5).optional(),
        labels: tagsSchema.optional(),
        color: z.string().max(40).nullable().optional(),
        priority: z.string().max(40).nullable().optional(),
        birthday: z.string().max(40).nullable().optional(),
        anniversary: z.string().max(40).nullable().optional(),
        companyId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(({ data, context }): Promise<SavedCard> => {
    const { targetCardId, ...patch } = data;
    return RelationshipService.updateMetadata(
      null as any,
      context.userId,
      targetCardId,
      patch,
    );
  });

// ── BC-2.5 Relationship Intelligence server functions ─────────────────────────

const eventTypeSchema = z.enum([
  "saved",
  "viewed",
  "shared",
  "contact",
  "scan",
  "meeting",
  "wallet",
  "qr",
  "nfc",
  "tag_updated",
  "favorite",
  "note_edited",
  "metadata_updated",
]);

/** Append an interaction event to a relationship's history/timeline. */
export const recordRelationshipEventFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetCardId: z.string().uuid(),
        type: eventTypeSchema,
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(({ data, context }) =>
    RelationshipService.recordEvent(
      null as any,
      context.userId,
      data.targetCardId,
      data.type,
      data.metadata ?? {},
    ),
  );

/** Derived timeline (edge timestamps + events) for one relationship. */
export const relationshipTimelineFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(({ data, context }) =>
    RelationshipService.timeline(null as any, context.userId, data.targetCardId),
  );

/** History events (newest first) for one relationship or the whole graph. */
export const relationshipHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetCardId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(({ data, context }) =>
    RelationshipService.history(null as any, context.userId, data.targetCardId),
  );

/** Dynamic smart collections over the caller's saved cards. */
export const relationshipCollectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(({ context }) => RelationshipService.collections(null as any, context.userId));

/** Deterministic relationship score for one relationship. */
export const relationshipScoreFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(({ data, context }) =>
    RelationshipService.relationshipScore(null as any, context.userId, data.targetCardId),
  );
