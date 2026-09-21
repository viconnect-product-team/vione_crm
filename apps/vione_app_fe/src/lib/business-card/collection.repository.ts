// SavedCardCollectionRepository — the ONLY module that queries
// saved_card_collections directly. Pure data access, owner-scoped via RLS AND
// explicit owner_user_id filters (defense in depth).

import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "saved_card_collections";
const SELECT = "id, slug, name, kind, color, position, is_system, created_at, updated_at";

export type CollectionRow = Record<string, unknown>;

export const SavedCardCollectionRepository = {
  async listByOwner(supabase: SupabaseClient, ownerUserId: string): Promise<CollectionRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CollectionRow[];
  },

  async findById(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
  ): Promise<CollectionRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as CollectionRow | null;
  },

  async insert(supabase: SupabaseClient, row: CollectionRow): Promise<CollectionRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row as never)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as CollectionRow;
  },

  /** Idempotent seed of the system collections (skips existing slugs). */
  async upsertSystem(supabase: SupabaseClient, rows: CollectionRow[]): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .upsert(rows as never, { onConflict: "owner_user_id,slug", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  },

  async update(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
    patch: CollectionRow,
  ): Promise<CollectionRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch as never)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select(SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as CollectionRow | null;
  },

  async delete(supabase: SupabaseClient, ownerUserId: string, id: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },
};
