// BusinessCardRepository — the ONLY module that queries member_business_cards
// and its child tables directly (BC service-extraction rule). Every read/write
// path in the domain goes through these methods. Pure data access: no
// authorization, no DTO mapping, no business rules — those live in the service.
//
// Each method takes an explicit SupabaseClient so the caller controls the auth
// context (user-scoped RLS client, anon publishable client, or admin client).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardChildren, RawCardRow } from "./business-card.mappers";
import type { CardStatus, PublicMode } from "./business-card.types";

const CARD_TABLE = "member_business_cards";

export type CardWriteRow = Record<string, unknown>;

export const BusinessCardRepository = {
  /** Summary columns for the current member's cards (newest first). */
  async listSummariesByMember(supabase: SupabaseClient, memberId: string) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select(
        "id, slug, card_kind, status, public_mode, display_name, professional_title, company_name, avatar_url, updated_at",
      )
      .eq("member_id", memberId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as RawCardRow[];
  },

  /** Summary columns for a global owner's cards (newest first, BC-2.2). */
  async listSummariesByOwner(supabase: SupabaseClient, ownerUserId: string) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select(
        "id, slug, card_kind, status, public_mode, display_name, professional_title, company_name, avatar_url, updated_at",
      )
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as RawCardRow[];
  },

  /** Full row scoped to a global owner (owner get, BC-2.2). */
  async findFullByIdForOwner(supabase: SupabaseClient, id: string, ownerUserId: string) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", ownerUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as RawCardRow | null;
  },

  /** Full row scoped to a member (owner get). */
  async findFullByIdForMember(supabase: SupabaseClient, id: string, memberId: string) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select("*")
      .eq("id", id)
      .eq("member_id", memberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as RawCardRow | null;
  },

  async findFullBySlug(supabase: SupabaseClient, slug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase.from(CARD_TABLE).select("*");
    if (isUuid) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as RawCardRow | null;
  },

  async findPublishedBySlug(supabase: SupabaseClient, slug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase
      .from(CARD_TABLE)
      .select("*")
      .eq("status", "published");
    if (isUuid) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as RawCardRow | null;
  },

  /**
   * Published + fully-public slugs for the sitemap (SEO discovery). Only cards
   * that are actually crawlable (status=published, public_mode=public) are
   * returned; members-only / private cards are excluded. Read-only projection:
   * slug + updated_at only, no PII.
   */
  async listPublishedPublicSlugs(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select("slug, updated_at")
      .eq("status", "published")
      .eq("public_mode", "public")
      .order("updated_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);
    return (data ?? []) as { slug: string; updated_at: string | null }[];
  },

  async findPublishedPublicMode(supabase: SupabaseClient, slug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase
      .from(CARD_TABLE)
      .select("public_mode")
      .eq("status", "published");
    if (isUuid) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }
    const { data } = await query.maybeSingle();
    return (data as { public_mode: PublicMode } | null) ?? null;
  },

  /** Raw full row by id (no scoping — caller has already authorized). */
  async findRawById(supabase: SupabaseClient, id: string) {
    const { data } = await supabase.from(CARD_TABLE).select("*").eq("id", id).maybeSingle();
    return (data ?? null) as RawCardRow | null;
  },

  /** Status column only (used by the mutation gate). */
  async findStatusById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as { status: CardStatus } | null) ?? null;
  },

  /** Card ids owned by a member (stats scoping). */
  async listCardIdsByMember(supabase: SupabaseClient, memberId: string) {
    const { data, error } = await supabase.from(CARD_TABLE).select("id").eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => r.id as string);
  },

  /** Load ordered skills/services/needs for a card. */
  async loadChildren(supabase: SupabaseClient, cardId: string): Promise<CardChildren> {
    const [{ data: skills }, { data: services }, { data: needs }] = await Promise.all([
      supabase
        .from("business_card_skills")
        .select("label")
        .eq("card_id", cardId)
        .order("sort_order"),
      supabase
        .from("business_card_services")
        .select("title, description, category")
        .eq("card_id", cardId)
        .order("sort_order"),
      supabase
        .from("business_card_needs")
        .select("title, description, category")
        .eq("card_id", cardId)
        .order("sort_order"),
    ]);
    return {
      skills: (skills ?? null) as CardChildren["skills"],
      services: (services ?? null) as CardChildren["services"],
      needs: (needs ?? null) as CardChildren["needs"],
    };
  },

  /** Demote the current primary card in a member/association scope. */
  async demotePrimary(
    supabase: SupabaseClient,
    memberId: string,
    associationId: string,
    exceptId?: string | null,
  ) {
    let q = supabase
      .from(CARD_TABLE)
      .update({ card_kind: "secondary" } as never)
      .eq("member_id", memberId)
      .eq("association_id", associationId)
      .eq("card_kind", "primary");
    if (exceptId) q = q.neq("id", exceptId);
    const { error } = await q;
    if (error) throw new Error(error.message);
  },

  /** Demote the current primary card in a global-owner scope (BC-2.2). */
  async demotePrimaryByOwner(
    supabase: SupabaseClient,
    ownerUserId: string,
    exceptId?: string | null,
  ) {
    let q = supabase
      .from(CARD_TABLE)
      .update({ card_kind: "secondary" } as never)
      .eq("owner_user_id", ownerUserId)
      .eq("card_kind", "primary");
    if (exceptId) q = q.neq("id", exceptId);
    const { error } = await q;
    if (error) throw new Error(error.message);
  },

  async updateById(supabase: SupabaseClient, id: string, row: CardWriteRow) {
    const { error } = await supabase
      .from(CARD_TABLE)
      .update(row as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async insertReturningId(supabase: SupabaseClient, row: CardWriteRow): Promise<string> {
    const { data, error } = await supabase
      .from(CARD_TABLE)
      .insert(row as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  },

  async deleteById(supabase: SupabaseClient, id: string) {
    const { error } = await supabase.from(CARD_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Replace all child rows for a card, then insert the provided sets. */
  async replaceChildren(
    supabase: SupabaseClient,
    cardId: string,
    associationId: string | null,
    children: {
      skills: { label: string }[];
      services: { title: string; description?: string | null; category?: string | null }[];
      needs: { title: string; description?: string | null; category?: string | null }[];
    },
  ) {
    await Promise.all([
      supabase.from("business_card_skills").delete().eq("card_id", cardId),
      supabase.from("business_card_services").delete().eq("card_id", cardId),
      supabase.from("business_card_needs").delete().eq("card_id", cardId),
    ]);

    if (children.skills.length) {
      const { error } = await supabase.from("business_card_skills").insert(
        children.skills.map((s, i) => ({
          card_id: cardId,
          association_id: associationId,
          label: s.label,
          sort_order: i,
        })) as never,
      );
      if (error) throw new Error(error.message);
    }
    if (children.services.length) {
      const { error } = await supabase.from("business_card_services").insert(
        children.services.map((s, i) => ({
          card_id: cardId,
          association_id: associationId,
          title: s.title,
          description: s.description ?? null,
          category: s.category ?? null,
          sort_order: i,
        })) as never,
      );
      if (error) throw new Error(error.message);
    }
    if (children.needs.length) {
      const { error } = await supabase.from("business_card_needs").insert(
        children.needs.map((s, i) => ({
          card_id: cardId,
          association_id: associationId,
          title: s.title,
          description: s.description ?? null,
          category: s.category ?? null,
          sort_order: i,
        })) as never,
      );
      if (error) throw new Error(error.message);
    }
  },

  /** Best-effort owner-initiated audit log (never throws). */
  async logMemberEvent(
    supabase: SupabaseClient,
    cardId: string,
    eventType: string,
    metadata: Record<string, unknown>,
  ) {
    try {
      await supabase.rpc("log_business_card_member_event", {
        _card_id: cardId,
        _event_type: eventType,
        _metadata: metadata as never,
      });
    } catch {
      /* ignore audit failure */
    }
  },
};
