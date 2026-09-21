// SavedCardRepository — BC-3.0 persistence for the organization layer over
// saved_business_cards (collection assignment, archive, last-opened, counts).
// Base CRUD lives in RelationshipRepository; this module owns the extra
// organization columns added in BC-3.0. Owner-scoped via RLS AND explicit
// owner_user_id filters.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SAVED_CARD_ROW_SELECT } from "./relationship.repository";

const TABLE = "saved_business_cards";

export type SavedCardRow = Record<string, unknown>;

export const SavedCardRepository = {
  /** Patch org columns on an edge by its own id (owner-scoped). */
  async patchById(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
    patch: SavedCardRow,
  ): Promise<SavedCardRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch as never)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select(SAVED_CARD_ROW_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as SavedCardRow | null;
  },

  /** Patch org columns on an edge by target card id (owner-scoped). */
  async patchByTarget(
    supabase: SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
    patch: SavedCardRow,
  ): Promise<SavedCardRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch as never)
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .select(SAVED_CARD_ROW_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as SavedCardRow | null;
  },

  /** Current open_count for an edge by target (owner-scoped). */
  async currentOpenCount(
    supabase: SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("open_count")
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return Number((data as { open_count: number }).open_count ?? 0);
  },

  /** Detach every edge from a collection (used before deleting a collection). */
  async clearCollection(
    supabase: SupabaseClient,
    ownerUserId: string,
    collectionId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ collection_id: null } as never)
      .eq("owner_user_id", ownerUserId)
      .eq("collection_id", collectionId);
    if (error) throw new Error(error.message);
  },

  /** Per-collection non-archived counts as { [collectionId]: count }. */
  async collectionCounts(
    supabase: SupabaseClient,
    ownerUserId: string,
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("collection_id")
      .eq("owner_user_id", ownerUserId)
      .eq("archived", false);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const r of (data ?? []) as { collection_id: string | null }[]) {
      const key = r.collection_id ?? "__uncategorized__";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  },
};
