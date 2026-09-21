// RelationshipRepository — the ONLY module that queries saved_business_cards
// directly. Pure data access: no authorization decisions, no DTO shaping beyond
// row typing. The owner scope is enforced by RLS (auth.uid() = owner_user_id)
// AND by explicit owner_user_id filters here (defense in depth).
//
// The target card summary is embedded via the PostgREST foreign-key relation to
// member_business_cards. Because that embed runs under the caller's RLS, a card
// that is no longer public simply resolves to null — never leaking private data.

import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "saved_business_cards";

// Embedded summary columns (same public-safe projection as card summaries).
const TARGET_EMBED =
  "target:member_business_cards!saved_business_cards_target_card_id_fkey(id, slug, card_kind, status, public_mode, display_name, professional_title, company_name, avatar_url)";

const ROW_SELECT = `id, target_card_id, saved_at, favorite, tags, notes, first_met_at, met_at, reminder_at, source, created_at, updated_at, last_viewed_at, last_contact_at, last_scan_at, company, industry, interest, meeting_place, event, referral, importance, labels, color, priority, birthday, anniversary, company_id, collection_id, archived, last_opened, ${TARGET_EMBED}`;

// Shared column projection (importable by the SavedCard layer, BC-3.0).
export const SAVED_CARD_ROW_SELECT = ROW_SELECT;

export type SavedCardRow = Record<string, unknown>;

export const RelationshipRepository = {
  /** All of the owner's saved edges (newest first), with live target summary. */
  async listByOwner(supabase: SupabaseClient, ownerUserId: string): Promise<SavedCardRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedCardRow[];
  },

  /** One saved edge by target card id (owner-scoped). */
  async findByTarget(
    supabase: SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
  ): Promise<SavedCardRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as SavedCardRow | null;
  },

  /** One saved edge by its own id (owner-scoped). */
  async findById(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
  ): Promise<SavedCardRow | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(ROW_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as SavedCardRow | null;
  },

  /** Lightweight existence check (no embed). */
  async existsByTarget(
    supabase: SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id")
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return !!data;
  },

  /** Upsert-free insert of a new edge; returns the created row (with embed). */
  async insert(supabase: SupabaseClient, row: SavedCardRow): Promise<SavedCardRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row as never)
      .select(ROW_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as SavedCardRow;
  },

  /** Patch owner-only metadata on an edge; returns the updated row (with embed). */
  async update(
    supabase: SupabaseClient,
    ownerUserId: string,
    id: string,
    patch: SavedCardRow,
  ): Promise<SavedCardRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch as never)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select(ROW_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as SavedCardRow;
  },

  /** Delete an edge by target card id (owner-scoped). Returns rows removed. */
  async deleteByTarget(
    supabase: SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
  ): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },
};

// Convenience: patch by target card id (owner-scoped). Used by favorite/tag/note.
export async function updateByTarget(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  ownerUserId: string,
  targetCardId: string,
  patch: SavedCardRow,
): Promise<SavedCardRow | null> {
  const { data, error } = await supabase
    .from("saved_business_cards")
    .update(patch as never)
    .eq("owner_user_id", ownerUserId)
    .eq("target_card_id", targetCardId)
    .select(ROW_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as SavedCardRow | null;
}

// ── BC-2.5 Relationship events (history / timeline) ───────────────────────────

const EVENTS_TABLE = "relationship_events";
const EVENT_SELECT = "id, target_card_id, event_type, metadata, created_at";

export const RelationshipEventRepository = {
  /** Append a history event (owner-scoped). */
  async insert(
    supabase: import("@supabase/supabase-js").SupabaseClient,
    row: {
      owner_user_id: string;
      target_card_id: string;
      event_type: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<SavedCardRow> {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .insert({ metadata: {}, ...row } as never)
      .select(EVENT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as SavedCardRow;
  },

  /** History for a single relationship (newest first). */
  async listByTarget(
    supabase: import("@supabase/supabase-js").SupabaseClient,
    ownerUserId: string,
    targetCardId: string,
    limit = 100,
  ): Promise<SavedCardRow[]> {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select(EVENT_SELECT)
      .eq("owner_user_id", ownerUserId)
      .eq("target_card_id", targetCardId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedCardRow[];
  },

  /** All of the owner's history events (newest first). */
  async listByOwner(
    supabase: import("@supabase/supabase-js").SupabaseClient,
    ownerUserId: string,
    limit = 200,
  ): Promise<SavedCardRow[]> {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select(EVENT_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedCardRow[];
  },
};
