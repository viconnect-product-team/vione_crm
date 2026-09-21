// SavedCardService — BC-3.0 organization logic over Saved Business Cards.
//
// The single home for collections, search, tagging, favorite/archive/move,
// sync, and deterministic AI suggestions. References-only: it NEVER duplicates
// card data. Orchestrates SavedCardCollectionRepository + SavedCardRepository +
// RelationshipRepository/RelationshipService; never queries tables directly.
//
// Statically imports NO *.server module, so it is safe to import from
// *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SavedCardCollectionRepository } from "./collection.repository";
import { SavedCardRepository } from "./saved-card.repository";
import { RelationshipRepository } from "./relationship.repository";
import { RelationshipService } from "./relationship.service";
import { mapRowToSavedCard } from "./relationship.mappers";
import { isSystemSlug, mapRowToCollection, suggestForSavedCard } from "./saved-card.mappers";
import {
  SAVED_CARD_ERR,
  SYSTEM_COLLECTIONS,
  type CreateCollectionInput,
  type SavedCardCollection,
  type SavedCardSearchQuery,
  type SavedCardSuggestion,
  type UpdateCollectionInput,
} from "./collection.types";
import { REL_ERR, type SavedCard } from "./relationship.types";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `c-${Date.now().toString(36)}`
  );
}

export const SavedCardService = {
  // ── Collections ───────────────────────────────────────────────────────────

  /** Idempotently seed the six system collections for the caller. */
  async ensureSystemCollections(supabase: SupabaseClient, userId: string): Promise<void> {
    const rows = SYSTEM_COLLECTIONS.map((c: any) => ({
      owner_user_id: userId,
      slug: c.slug,
      name: c.name,
      kind: "system",
      color: c.color,
      position: c.position,
      is_system: true,
    }));
    await SavedCardCollectionRepository.upsertSystem(supabase, rows);
  },

  /** List all collections (system + custom) with live non-archived counts. */
  async listCollections(supabase: SupabaseClient, userId: string): Promise<SavedCardCollection[]> {
    await this.ensureSystemCollections(supabase, userId);
    const [rows, counts] = await Promise.all([
      SavedCardCollectionRepository.listByOwner(supabase, userId),
      SavedCardRepository.collectionCounts(supabase, userId),
    ]);
    return rows.map((r: any) => mapRowToCollection(r, counts[r.id as string] ?? 0));
  },

  async createCollection(
    supabase: SupabaseClient,
    userId: string,
    input: CreateCollectionInput,
  ): Promise<SavedCardCollection> {
    const name = input.name.trim().slice(0, 80);
    if (!name) throw new Error(SAVED_CARD_ERR.DUPLICATE_NAME);
    let slug = slugify(name);
    if (isSystemSlug(slug)) slug = `${slug}-${Date.now().toString(36)}`;
    const row = await SavedCardCollectionRepository.insert(supabase, {
      owner_user_id: userId,
      slug,
      name,
      kind: "custom",
      color: input.color ?? null,
      position: 100,
      is_system: false,
    });
    return mapRowToCollection(row, 0);
  },

  async updateCollection(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    patch: UpdateCollectionInput,
  ): Promise<SavedCardCollection> {
    const existing = await SavedCardCollectionRepository.findById(supabase, userId, id);
    if (!existing) throw new Error(SAVED_CARD_ERR.COLLECTION_NOT_FOUND);
    if (existing.is_system && patch.name !== undefined)
      throw new Error(SAVED_CARD_ERR.SYSTEM_LOCKED);
    const p: Record<string, unknown> = {};
    if (patch.name !== undefined) p.name = patch.name.trim().slice(0, 80);
    if (patch.color !== undefined) p.color = patch.color;
    if (patch.position !== undefined) p.position = Math.max(0, Math.floor(patch.position));
    const row = await SavedCardCollectionRepository.update(supabase, userId, id, p);
    if (!row) throw new Error(SAVED_CARD_ERR.COLLECTION_NOT_FOUND);
    const counts = await SavedCardRepository.collectionCounts(supabase, userId);
    return mapRowToCollection(row, counts[id] ?? 0);
  },

  /** Delete a custom collection; its cards are detached, never deleted. */
  async deleteCollection(
    supabase: SupabaseClient,
    userId: string,
    id: string,
  ): Promise<{ removed: boolean }> {
    const existing = await SavedCardCollectionRepository.findById(supabase, userId, id);
    if (!existing) throw new Error(SAVED_CARD_ERR.COLLECTION_NOT_FOUND);
    if (existing.is_system) throw new Error(SAVED_CARD_ERR.SYSTEM_LOCKED);
    await SavedCardRepository.clearCollection(supabase, userId, id);
    const n = await SavedCardCollectionRepository.delete(supabase, userId, id);
    return { removed: n > 0 };
  },

  // ── Organization actions ────────────────────────────────────────────────────

  /** Move a saved card into a collection (null = uncategorized). */
  async moveToCollection(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    collectionId: string | null,
  ): Promise<SavedCard> {
    if (collectionId) {
      const c = await SavedCardCollectionRepository.findById(supabase, userId, collectionId);
      if (!c) throw new Error(SAVED_CARD_ERR.COLLECTION_NOT_FOUND);
    }
    const row = await SavedCardRepository.patchByTarget(supabase, userId, targetCardId, {
      collection_id: collectionId,
    });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    return mapRowToSavedCard(row);
  },

  /** Archive / restore a saved card (hidden from default list, never deleted). */
  async setArchived(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    archived: boolean,
  ): Promise<SavedCard> {
    const row = await SavedCardRepository.patchByTarget(supabase, userId, targetCardId, {
      archived,
    });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    return mapRowToSavedCard(row);
  },

  /** Stamp last_opened when the owner opens a saved card. */
  async touchOpened(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<SavedCard> {
    const row = await SavedCardRepository.patchByTarget(supabase, userId, targetCardId, {
      last_opened: new Date().toISOString(),
    });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    return mapRowToSavedCard(row);
  },

  /** Record an open: increments open_count and stamps last_opened. */
  async recordOpen(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<SavedCard> {
    const current = await SavedCardRepository.currentOpenCount(supabase, userId, targetCardId);
    if (current === null) throw new Error(REL_ERR.NOT_FOUND);
    const row = await SavedCardRepository.patchByTarget(supabase, userId, targetCardId, {
      open_count: current + 1,
      last_opened: new Date().toISOString(),
    });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    return mapRowToSavedCard(row);
  },

  // ── Search / list ───────────────────────────────────────────────────────────

  /** Filtered, in-memory search across the caller's saved cards. */
  async search(
    supabase: SupabaseClient,
    userId: string,
    query: SavedCardSearchQuery = {},
  ): Promise<SavedCard[]> {
    const rows = await RelationshipRepository.listByOwner(supabase, userId);
    let cards = rows.map(mapRowToSavedCard);

    const wantArchived = query.archived ?? false;
    cards = cards.filter((c) => c.archived === wantArchived);

    if (query.collectionId !== undefined) {
      cards = cards.filter((c) => (c.collectionId ?? null) === query.collectionId);
    }
    if (query.favorite !== undefined) cards = cards.filter((c) => c.favorite === query.favorite);
    if (query.tag) {
      const t = query.tag.toLowerCase();
      cards = cards.filter((c) => c.tags.some((x) => x.toLowerCase() === t));
    }
    if (query.industry) {
      const i = query.industry.toLowerCase();
      cards = cards.filter((c) => (c.industry ?? "").toLowerCase().includes(i));
    }
    if (query.text) {
      const q = query.text.toLowerCase();
      cards = cards.filter((c) =>
        [
          c.target.displayName,
          c.target.companyName,
          c.target.professionalTitle,
          c.company,
          c.industry,
          c.notes,
          ...c.tags,
        ]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q)),
      );
    }
    return cards;
  },

  // ── Sync + AI ────────────────────────────────────────────────────────────────

  /**
   * Reconcile: ensure system collections exist and every saved card has an
   * explicit archived flag. Returns counts. Idempotent.
   */
  async sync(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<{ collections: number; cards: number }> {
    await this.ensureSystemCollections(supabase, userId);
    const [collections, cards] = await Promise.all([
      SavedCardCollectionRepository.listByOwner(supabase, userId),
      RelationshipRepository.listByOwner(supabase, userId),
    ]);
    return { collections: collections.length, cards: cards.length };
  },

  /** Deterministic per-card suggestion (tags + target collection). No AI model. */
  async suggest(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<SavedCardSuggestion> {
    const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    if (!edge) throw new Error(REL_ERR.NOT_FOUND);
    return suggestForSavedCard(mapRowToSavedCard(edge));
  },

  /** Apply a suggestion: add tags and move into the suggested collection. */
  async applySuggestion(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<SavedCard> {
    const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    if (!edge) throw new Error(REL_ERR.NOT_FOUND);
    const card = mapRowToSavedCard(edge);
    const s = suggestForSavedCard(card);
    const mergedTags = Array.from(new Set([...card.tags, ...s.tags])).slice(0, 20);
    await RelationshipService.tag(supabase, userId, targetCardId, mergedTags);
    if (s.collectionSlug) {
      const collections = await SavedCardCollectionRepository.listByOwner(supabase, userId);
      const match = collections.find((c) => c.slug === s.collectionSlug);
      if (match) {
        return this.moveToCollection(supabase, userId, targetCardId, match.id as string);
      }
    }
    const row = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    return mapRowToSavedCard(row!);
  },
};
