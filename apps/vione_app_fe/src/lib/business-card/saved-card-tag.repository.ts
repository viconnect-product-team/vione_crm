// SavedCardTagRepository — the ONLY module that queries saved_card_tags and
// saved_business_card_tags directly. Pure data access; owner scope enforced by
// RLS AND explicit owner_user_id filters (defense in depth). References-only:
// tags never carry card data.

import type { SupabaseClient } from "@supabase/supabase-js";

const TAGS = "saved_card_tags";
const LINKS = "saved_business_card_tags";
const TAG_SELECT = "id, name, normalized_name, created_at, updated_at";

export type TagRow = Record<string, unknown>;

export const SavedCardTagRepository = {
  async listByOwner(supabase: SupabaseClient, ownerUserId: string): Promise<TagRow[]> {
    const { data, error } = await supabase
      .from(TAGS)
      .select(TAG_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("normalized_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TagRow[];
  },

  async findByNormalized(
    supabase: SupabaseClient,
    ownerUserId: string,
    normalized: string,
  ): Promise<TagRow | null> {
    const { data, error } = await supabase
      .from(TAGS)
      .select(TAG_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("normalized_name", normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as TagRow | null;
  },

  async findById(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
  ): Promise<TagRow | null> {
    const { data, error } = await supabase
      .from(TAGS)
      .select(TAG_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as TagRow | null;
  },

  async insert(supabase: SupabaseClient, row: TagRow): Promise<TagRow> {
    const { data, error } = await supabase
      .from(TAGS)
      .insert(row as never)
      .select(TAG_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as TagRow;
  },

  /** Idempotent get-or-create by normalized name (owner-scoped). */
  async ensure(
    supabase: SupabaseClient,
    ownerUserId: string,
    name: string,
    normalized: string,
  ): Promise<TagRow> {
    const existing = await this.findByNormalized(supabase, ownerUserId, normalized);
    if (existing) return existing;
    return this.insert(supabase, {
      owner_user_id: ownerUserId,
      name,
      normalized_name: normalized,
    });
  },

  async update(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
    patch: TagRow,
  ): Promise<TagRow | null> {
    const { data, error } = await supabase
      .from(TAGS)
      .update({ updated_at: new Date().toISOString(), ...patch } as never)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select(TAG_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as TagRow | null;
  },

  async delete(supabase: SupabaseClient, ownerUserId: string, id: string): Promise<number> {
    const { data, error } = await supabase
      .from(TAGS)
      .delete()
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },

  // ── Junction (saved_business_card_tags) ──────────────────────────────────

  /** Tag ids currently linked to a saved card edge. */
  async linkedTagIds(supabase: SupabaseClient, savedCardId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(LINKS)
      .select("tag_id")
      .eq("saved_card_id", savedCardId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as { tag_id: string }[]).map((r: any) => r.tag_id);
  },

  async addLinks(supabase: SupabaseClient, savedCardId: string, tagIds: string[]): Promise<void> {
    if (!tagIds.length) return;
    const rows = tagIds.map((tag_id) => ({ saved_card_id: savedCardId, tag_id }));
    const { error } = await supabase
      .from(LINKS)
      .upsert(rows as never, { onConflict: "saved_card_id,tag_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  },

  async removeLinks(
    supabase: SupabaseClient,
    savedCardId: string,
    tagIds: string[],
  ): Promise<void> {
    if (!tagIds.length) return;
    const { error } = await supabase
      .from(LINKS)
      .delete()
      .eq("saved_card_id", savedCardId)
      .in("tag_id", tagIds);
    if (error) throw new Error(error.message);
  },

  /** Per-tag link counts for the owner as { [tagId]: count }. */
  async tagCounts(supabase: SupabaseClient, ownerUserId: string): Promise<Record<string, number>> {
    // Owner-scoped via the RLS join: only links to the owner's edges are visible.
    const { data, error } = await supabase
      .from(LINKS)
      .select("tag_id, saved_business_cards!inner(owner_user_id)")
      .eq("saved_business_cards.owner_user_id", ownerUserId);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const r of (data ?? []) as { tag_id: string }[]) {
      counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;
    }
    return counts;
  },
};
