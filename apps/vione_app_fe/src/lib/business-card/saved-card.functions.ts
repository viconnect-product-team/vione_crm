// BC-3.0 — Saved Card organization server functions.
//
// Thin adapters over SavedCardService. Every function is owner-scoped via
// requireSupabaseAuth (owner = auth.uid()); RLS enforces the same on the
// tables. References-only: no card data is ever duplicated.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { SavedCardService } from "./saved-card.service";
import { SavedCardTagService } from "./saved-card-tag.service";
import { fetchNestApiFromServer } from "../api-client";
import type {
  SavedCardCollection,
  SavedCardSearchQuery,
  SavedCardSuggestion,
} from "./collection.types";
import type { SavedCardTag } from "./saved-card.contracts";
import type { SavedCard } from "./relationship.types";

// ── Collections ──────────────────────────────────────────────────────────────

export const listCollectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<SavedCardCollection[]> =>
      SavedCardService.listCollections(null as any, context.userId),
  );

export const createCollectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ name: z.string().min(1).max(80), color: z.string().max(40).nullable().optional() })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCardCollection> =>
      SavedCardService.createCollection(null as any, context.userId, data),
  );

export const updateCollectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        color: z.string().max(40).nullable().optional(),
        position: z.number().int().min(0).max(9999).optional(),
      })
      .parse(d),
  )
  .handler(({ data, context }): Promise<SavedCardCollection> => {
    const { id, ...patch } = data;
    return SavedCardService.updateCollection(null as any, context.userId, id, patch);
  });

export const deleteCollectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<{ removed: boolean }> =>
      SavedCardService.deleteCollection(null as any, context.userId, data.id),
  );

// ── Organization actions ────────────────────────────────────────────────────

export const moveSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ targetCardId: z.string().uuid(), collectionId: z.string().uuid().nullable() })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      SavedCardService.moveToCollection(
        null as any,
        context.userId,
        data.targetCardId,
        data.collectionId,
      ),
  );

export const archiveSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetCardId: z.string().uuid(), archived: z.boolean() }).parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      SavedCardService.setArchived(
        null as any,
        context.userId,
        data.targetCardId,
        data.archived,
      ),
  );

export const touchSavedCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      SavedCardService.touchOpened(null as any, context.userId, data.targetCardId),
  );

// ── Search ────────────────────────────────────────────────────────────────────

export const searchSavedCardsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        text: z.string().max(200).optional(),
        collectionId: z.string().uuid().nullable().optional(),
        tag: z.string().max(60).optional(),
        industry: z.string().max(120).optional(),
        location: z.string().max(120).optional(),
        association: z.string().max(120).optional(),
        favorite: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<SavedCard[]> => {
    const { token } = context as any;
    const url = `/connect-app/network/saved-cards${data.text ? `?term=${encodeURIComponent(data.text)}` : ""}`;
    return fetchNestApiFromServer(url, token);
  });

// ── Sync + AI ─────────────────────────────────────────────────────────────────

export const syncSavedCardsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<{ collections: number; cards: number }> =>
      SavedCardService.sync(null as any, context.userId),
  );

export const suggestSavedCardFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCardSuggestion> =>
      SavedCardService.suggest(null as any, context.userId, data.targetCardId),
  );

export const applySavedCardSuggestionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      SavedCardService.applySuggestion(null as any, context.userId, data.targetCardId),
  );

// ── BC-3.0 recordOpen (open_count) ──────────────────────────────────────────

export const recordSavedCardOpenFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCard> =>
      SavedCardService.recordOpen(null as any, context.userId, data.targetCardId),
  );

// ── BC-3.0 Normalized tags ──────────────────────────────────────────────────

export const listSavedCardTagsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<SavedCardTag[]> =>
      SavedCardTagService.list(null as any, context.userId),
  );

export const createSavedCardTagFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(60) }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCardTag> =>
      SavedCardTagService.create(null as any, context.userId, data.name),
  );

export const renameSavedCardTagFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(60) }).parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCardTag> =>
      SavedCardTagService.rename(null as any, context.userId, data.id, data.name),
  );

export const deleteSavedCardTagFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<{ removed: boolean }> =>
      SavedCardTagService.remove(null as any, context.userId, data.id),
  );

export const tagsForSavedCardFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ targetCardId: z.string().uuid() }).parse(d))
  .handler(
    ({ data, context }): Promise<SavedCardTag[]> =>
      SavedCardTagService.forCard(null as any, context.userId, data.targetCardId),
  );

export const setSavedCardTagsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetCardId: z.string().uuid(),
        names: z.array(z.string().max(60)).max(30),
      })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<SavedCardTag[]> =>
      SavedCardTagService.setForCard(
        null as any,
        context.userId,
        data.targetCardId,
        data.names,
      ),
  );
