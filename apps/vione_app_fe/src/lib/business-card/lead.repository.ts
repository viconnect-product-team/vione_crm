// LeadRepository — the ONLY module that queries business_card_leads and the
// analytics source tables (business_card_interactions) for the Business Card
// lead/analytics domain (BC-2.1D service-extraction rule). Pure data access:
// no business rules, no metadata composition, no aggregation — those live in
// LeadService. Each method takes an explicit SupabaseClient so the caller
// controls the auth context.

import type { SupabaseClient } from "@supabase/supabase-js";

const LEAD_TABLE = "business_card_leads";
const INTERACTION_TABLE = "business_card_interactions";

export type RawLeadRow = Record<string, unknown>;

export const LeadRepository = {
  /** All leads owned by a member (newest first) with joined card slug/name. */
  async listByOwnerMember(supabase: SupabaseClient, memberId: string) {
    const { data, error } = await supabase
      .from(LEAD_TABLE)
      .select(
        "id, card_id, requester_name, requester_email, requester_phone, message, lead_type, status, preferred_time, created_at, updated_at, metadata, member_business_cards(slug, display_name)",
      )
      .eq("owner_member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as RawLeadRow[];
  },

  /** Status + metadata for a single owned lead (mutation read-modify-write). */
  async findStatusMetaForOwner(supabase: SupabaseClient, id: string, memberId: string) {
    const { data, error } = await supabase
      .from(LEAD_TABLE)
      .select("status, metadata")
      .eq("id", id)
      .eq("owner_member_id", memberId)
      .single();
    if (error) throw new Error(error.message);
    return (data ?? null) as { status: string | null; metadata: unknown } | null;
  },

  /** Patch an owned lead (status/metadata/updated_at). */
  async updateForOwner(
    supabase: SupabaseClient,
    id: string,
    memberId: string,
    patch: Record<string, unknown>,
  ) {
    const { error } = await supabase
      .from(LEAD_TABLE)
      .update(patch as never)
      .eq("id", id)
      .eq("owner_member_id", memberId);
    if (error) throw new Error(error.message);
  },

  /** Lead status + created_at within a range (stats). */
  async listStatusSince(supabase: SupabaseClient, memberId: string, sinceIso: string) {
    const { data, error } = await supabase
      .from(LEAD_TABLE)
      .select("status, created_at")
      .eq("owner_member_id", memberId)
      .gte("created_at", sinceIso);
    if (error) throw new Error(error.message);
    return (data ?? []) as { status: string | null; created_at: string }[];
  },

  /** Interaction type + created_at within a range for a set of cards (stats). */
  async listInteractionsSince(supabase: SupabaseClient, cardIds: string[], sinceIso: string) {
    if (cardIds.length === 0) return [];
    const { data, error } = await supabase
      .from(INTERACTION_TABLE)
      .select("interaction_type, created_at")
      .in("card_id", cardIds)
      .gte("created_at", sinceIso);
    if (error) throw new Error(error.message);
    return (data ?? []) as { interaction_type: string; created_at: string }[];
  },
};
