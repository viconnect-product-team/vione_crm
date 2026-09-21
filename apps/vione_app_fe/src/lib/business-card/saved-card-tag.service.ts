// SavedCardTagService — BC-3.0 normalized tagging over saved cards.
//
// Owns the user-private tag catalog (saved_card_tags) and the card↔tag junction
// (saved_business_card_tags). Orchestrates SavedCardTagRepository +
// RelationshipRepository only; never queries tables directly. References-only.
//
// Statically imports NO *.server module — safe to import from *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SavedCardTagRepository, type TagRow } from "./saved-card-tag.repository";
import { RelationshipRepository } from "./relationship.repository";
import { SAVED_CARD_TAG_ERR, normalizeTagName, type SavedCardTag } from "./saved-card.contracts";
import { REL_ERR } from "./relationship.types";

function mapRowToTag(row: TagRow, count: number): SavedCardTag {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    normalizedName: (row.normalized_name as string) ?? "",
    count,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function edgeIdForTarget(
  supabase: SupabaseClient,
  userId: string,
  targetCardId: string,
): Promise<string> {
  const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
  if (!edge) throw new Error(REL_ERR.NOT_FOUND);
  return edge.id as string;
}

export const SavedCardTagService = {
  /** The owner's tag catalog with live link counts. */
  async list(supabase: SupabaseClient, userId: string): Promise<SavedCardTag[]> {
    const [rows, counts] = await Promise.all([
      SavedCardTagRepository.listByOwner(supabase, userId),
      SavedCardTagRepository.tagCounts(supabase, userId),
    ]);
    return rows.map((r: any) => mapRowToTag(r, counts[r.id as string] ?? 0));
  },

  /** Create (or return existing) a tag by name. Idempotent on normalized name. */
  async create(supabase: SupabaseClient, userId: string, name: string): Promise<SavedCardTag> {
    const clean = name.trim().slice(0, 60);
    const norm = normalizeTagName(clean);
    if (!norm) throw new Error(SAVED_CARD_TAG_ERR.INVALID_NAME);
    const row = await SavedCardTagRepository.ensure(supabase, userId, clean, norm);
    return mapRowToTag(row, 0);
  },

  async rename(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    name: string,
  ): Promise<SavedCardTag> {
    const clean = name.trim().slice(0, 60);
    const norm = normalizeTagName(clean);
    if (!norm) throw new Error(SAVED_CARD_TAG_ERR.INVALID_NAME);
    const clash = await SavedCardTagRepository.findByNormalized(supabase, userId, norm);
    if (clash && (clash.id as string) !== id) throw new Error(SAVED_CARD_TAG_ERR.DUPLICATE);
    const row = await SavedCardTagRepository.update(supabase, userId, id, {
      name: clean,
      normalized_name: norm,
    });
    if (!row) throw new Error(SAVED_CARD_TAG_ERR.NOT_FOUND);
    const counts = await SavedCardTagRepository.tagCounts(supabase, userId);
    return mapRowToTag(row, counts[id] ?? 0);
  },

  async remove(
    supabase: SupabaseClient,
    userId: string,
    id: string,
  ): Promise<{ removed: boolean }> {
    const n = await SavedCardTagRepository.delete(supabase, userId, id); // junction cascades
    return { removed: n > 0 };
  },

  /** Tags currently linked to one saved card. */
  async forCard(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<SavedCardTag[]> {
    const savedCardId = await edgeIdForTarget(supabase, userId, targetCardId);
    const [ids, all, counts] = await Promise.all([
      SavedCardTagRepository.linkedTagIds(supabase, savedCardId),
      SavedCardTagRepository.listByOwner(supabase, userId),
      SavedCardTagRepository.tagCounts(supabase, userId),
    ]);
    const set = new Set(ids);
    return all
      .filter((r) => set.has(r.id as string))
      .map((r: any) => mapRowToTag(r, counts[r.id as string] ?? 0));
  },

  /**
   * Replace the full tag set on a saved card with the given names. Missing tags
   * are auto-created in the catalog. Returns the resulting linked tags.
   */
  async setForCard(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    names: string[],
  ): Promise<SavedCardTag[]> {
    const savedCardId = await edgeIdForTarget(supabase, userId, targetCardId);

    const wanted = Array.from(
      new Map(
        names
          .map((n: any) => normalizeTagName(n))
          .filter(Boolean)
          .map((norm, i) => [norm, names[i].trim().slice(0, 60)]),
      ),
    ).slice(0, 30);

    const resolved: string[] = [];
    for (const [norm, display] of wanted) {
      const row = await SavedCardTagRepository.ensure(supabase, userId, display, norm);
      resolved.push(row.id as string);
    }

    const current = await SavedCardTagRepository.linkedTagIds(supabase, savedCardId);
    const currentSet = new Set(current);
    const wantSet = new Set(resolved);
    const toAdd = resolved.filter((id) => !currentSet.has(id));
    const toRemove = current.filter((id) => !wantSet.has(id));

    await Promise.all([
      SavedCardTagRepository.addLinks(supabase, savedCardId, toAdd),
      SavedCardTagRepository.removeLinks(supabase, savedCardId, toRemove),
    ]);

    return this.forCard(supabase, userId, targetCardId);
  },
};
