// InteractionRepository — the ONLY module that queries business_interactions
// directly. Pure data access: owner scope is enforced by RLS
// (auth.uid() = owner_user_id) AND by explicit owner_user_id filters here
// (defense in depth). No authorization decisions, no DTO shaping beyond typing.

import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "business_interactions";

const ROW_SELECT =
  "id, relationship_id, company_id, interaction_type, occurred_at, title, note, location, metadata, created_at, updated_at";

export type InteractionRow = Record<string, unknown>;

export const InteractionRepository = {
  /** Insert a new interaction; returns the created row. */
  async insert(supabase: SupabaseClient, row: InteractionRow): Promise<InteractionRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row as never)
      .select(ROW_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as InteractionRow;
  },

  /** One interaction by id (owner-scoped). */
  async findById(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
  ): Promise<InteractionRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as InteractionRow | null;
  },

  /** Patch an interaction (owner-scoped); returns the updated row or null. */
  async update(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
    patch: InteractionRow,
  ): Promise<InteractionRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch as never)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select(ROW_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as InteractionRow | null;
  },

  /** Delete an interaction by id (owner-scoped). Returns rows removed. */
  async deleteById(supabase: SupabaseClient, ownerUserId: string, id: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },

  /** Interactions for one relationship (newest first, owner-scoped). */
  async listByRelationship(
    supabase: SupabaseClient,
    ownerUserId: string,
    relationshipId: string,
    limit = 200,
  ): Promise<InteractionRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("relationship_id", relationshipId)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as InteractionRow[];
  },

  /** All of the owner's interactions (newest first). */
  async listByOwner(
    supabase: SupabaseClient,
    ownerUserId: string,
    limit = 500,
  ): Promise<InteractionRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as InteractionRow[];
  },

  /** Count interactions for one relationship (owner-scoped). */
  async countByRelationship(
    supabase: SupabaseClient,
    ownerUserId: string,
    relationshipId: string,
  ): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerUserId)
      .eq("relationship_id", relationshipId);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};
