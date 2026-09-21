// BusinessCardService — the single home for Business Card business logic:
// owner resolution, public projection, CRUD orchestration, visibility, theme,
// and audit. Server functions are thin adapters that call this service; no
// domain logic is duplicated in the function layer.
//
// This module statically imports NO *.server file, so it is safe to import from
// *.functions.ts. Server-only clients (admin) are loaded lazily inside methods.

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessCardOwner } from "@/lib/business-card-authz";
import { resolveAssociationId, resolveMemberId, resolveMemberIdOrNull } from "@/lib/current-member";
import { BusinessCardRepository } from "./business-card.repository";
import { mapRowToBusinessCard, mapRowToSummary } from "./business-card.mappers";
import { toPublicBusinessCard } from "./public-card";
import {
  BC_ERR,
  LOCKED_STATUSES,
  normalizeVisibility,
  type BusinessCard,
  type BusinessCardSummary,
  type CardStatus,
  type CardWriteInput,
  type PublicBusinessCardResult,
  type PublicMode,
  type VisibilitySettings,
} from "./business-card.types";

async function requireMemberIdForWrite(supabase: SupabaseClient): Promise<string> {
  const id = await resolveMemberIdOrNull(supabase);
  if (!id) throw new Error(BC_ERR.NO_PROFILE);
  return id;
}

export const BusinessCardService = {
  // ── Owner resolution ─────────────────────────────────────────────────────
  /** Resolve + require the caller owns a card (owner_user_id → legacy member). */
  async resolveOwner(supabase: SupabaseClient, userId: string, cardId: string) {
    return requireBusinessCardOwner(supabase, userId, cardId);
  },

  /**
   * Canonical mutation gate: require ownership, then enforce admin-lock. Both
   * this (server) and owner-aware RLS (database) apply. Never grants access to
   * unresolved cards; never treats an association admin as owner.
   */
  async assertOwnerUnlocked(
    supabase: SupabaseClient,
    userId: string,
    cardId: string,
    opts: { requireUnlocked?: boolean } = {},
  ): Promise<{
    status: CardStatus;
    authz: Awaited<ReturnType<typeof requireBusinessCardOwner>>;
  }> {
    const authz = await requireBusinessCardOwner(supabase, userId, cardId);
    const row = await BusinessCardRepository.findStatusById(supabase, cardId);
    if (!row) throw new Error(BC_ERR.NOT_FOUND);
    const status = row.status;
    if (opts.requireUnlocked && LOCKED_STATUSES.has(status)) {
      throw new Error(BC_ERR.LOCKED);
    }
    return { status, authz };
  },

  // ── Reads ────────────────────────────────────────────────────────────────
  async listMyCards(supabase: SupabaseClient): Promise<BusinessCardSummary[]> {
    const memberId = await resolveMemberIdOrNull(supabase);
    if (!memberId) return [];
    const rows = await BusinessCardRepository.listSummariesByMember(supabase, memberId);
    return rows.map(mapRowToSummary);
  },

  /** List the authenticated global owner's cards (BC-2.2). */
  async listMyGlobalCards(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<BusinessCardSummary[]> {
    const rows = await BusinessCardRepository.listSummariesByOwner(supabase, userId);
    return rows.map(mapRowToSummary);
  },

  /** Get one global card owned by the authenticated user (BC-2.2). */
  async getMyGlobalCard(
    supabase: SupabaseClient,
    userId: string,
    id: string,
  ): Promise<BusinessCard> {
    const c = await BusinessCardRepository.findFullByIdForOwner(supabase, id, userId);
    if (!c) throw new Error("Không tìm thấy danh thiếp.");
    const children = await BusinessCardRepository.loadChildren(supabase, id);
    return mapRowToBusinessCard(c, children, {
      status: "draft",
      publicMode: "members_only",
      exposeOwner: true,
    });
  },

  async getMyCard(supabase: SupabaseClient, id: string): Promise<BusinessCard> {
    const memberId = await resolveMemberId(supabase);
    const c = await BusinessCardRepository.findFullByIdForMember(supabase, id, memberId);
    if (!c) throw new Error("Không tìm thấy danh thiếp.");
    const children = await BusinessCardRepository.loadChildren(supabase, id);
    return mapRowToBusinessCard(c, children, {
      status: "draft",
      publicMode: "members_only",
      exposeOwner: true,
    });
  },

  async getPreviewBySlug(supabase: SupabaseClient, slug: string): Promise<BusinessCard | null> {
    const c = await BusinessCardRepository.findFullBySlug(supabase, slug);
    if (!c) return null;
    const children = await BusinessCardRepository.loadChildren(supabase, c.id as string);
    return mapRowToBusinessCard(c, children, {
      status: "draft",
      publicMode: "members_only",
      exposeOwner: true,
    });
  },

  /**
   * Public projection (no auth). Uses the anon publishable client so RLS returns
   * only published+public cards. A published members_only card is reported as
   * restricted (never leaks content); anything else is not found. ownerUserId is
   * always nulled in the projection.
   */
  async getPublicBySlug(slug: string): Promise<PublicBusinessCardResult> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const c = await BusinessCardRepository.findPublishedBySlug(supabase, slug);
    if (!c) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const gated = await BusinessCardRepository.findPublishedPublicMode(
        supabaseAdmin as unknown as SupabaseClient,
        slug,
      );
      if (gated && gated.public_mode === "members_only") {
        return { state: "members_only" };
      }
      return { state: "not_found" };
    }

    const children = await BusinessCardRepository.loadChildren(supabase, c.id as string);
    const card = mapRowToBusinessCard(c, children, {
      status: "published",
      publicMode: "public",
      exposeOwner: false,
    });
    // BC-Mobile-3A — the anonymous surface receives ONLY the explicit
    // whitelist DTO: visibility gates applied here, internals never mapped.
    return { state: "public", card: toPublicBusinessCard(card) };
  },

  /**
   * BC-Mobile-3A — Resolve the internal card id for a published+public slug.
   * Server-to-server use ONLY (save-contact / vCard pipelines); the id never
   * appears on any anonymous DTO. Fails closed to null (slug enumeration
   * collapses into the same result as "not found").
   */
  async resolvePublicCardId(slug: string): Promise<string | null> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const c = await BusinessCardRepository.findPublishedBySlug(supabase, slug);
    return c ? (c.id as string) : null;
  },

  /**
   * List published + fully-public profile slugs for the sitemap (BC-2.3).
   * Uses the anon publishable client (RLS applies); returns slug + updated_at
   * only. Never exposes PII or non-public cards.
   */
  async listPublicProfileSlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const rows = await BusinessCardRepository.listPublishedPublicSlugs(supabase);
    return rows.map((r: any) => ({ slug: r.slug, updatedAt: r.updated_at }));
  },

  async listMyCardIds(supabase: SupabaseClient, memberId: string): Promise<string[]> {
    return BusinessCardRepository.listCardIdsByMember(supabase, memberId);
  },

  // ── Global draft (BC-2.2) ───────────────────────────────────────────────────
  /**
   * Create a draft global Business Card for the authenticated platform user.
   * owner_user_id is set server-side from auth.uid(); member_id/association_id
   * stay null. A unique slug is generated server-side. Public profile fields may
   * be prefilled from the user's global profile but the card starts as a draft
   * (never auto-published). No private association data is copied.
   */
  async createGlobalDraft(supabase: SupabaseClient, userId: string): Promise<{ id: string }> {
    const { resolveUserProfile } = await import("@/lib/identity/platform-identity.server");
    const profile = await resolveUserProfile(supabase, userId);

    const base = (profile?.displayName ?? "card")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
    const rand = Math.random().toString(36).slice(2, 8);
    const slug = `${base || "card"}-${rand}`;

    return this.saveCard(supabase, userId, {
      id: null,
      scope: "global",
      slug,
      cardKind: "secondary",
      publicMode: "members_only",
      displayName: profile?.displayName ?? null,
      professionalTitle: profile?.professionalTitle ?? null,
      companyName: profile?.companyName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      bio: profile?.bio ?? null,
      skills: [],
      services: [],
      needs: [],
    });
  },

  // ── Create / update ────────────────────────────────────────────────────────
  async saveCard(
    supabase: SupabaseClient,
    userId: string,
    input: CardWriteInput,
  ): Promise<{ id: string }> {
    const scope = input.scope ?? "association";
    let memberId: string | null = null;
    let associationId: string | null = null;
    if (scope === "association") {
      memberId = await requireMemberIdForWrite(supabase);
      associationId = await resolveAssociationId(supabase);
    }

    if (input.id) {
      await this.assertOwnerUnlocked(supabase, userId, input.id, { requireUnlocked: true });
    }

    // Single primary per member/association: demote existing primary first.
    if (input.cardKind === "primary" && memberId && associationId) {
      await BusinessCardRepository.demotePrimary(
        supabase,
        memberId,
        associationId,
        input.id ?? null,
      );
    } else if (input.cardKind === "primary" && scope === "global") {
      // Global-owner scope: single primary per owner (BC-2.2).
      await BusinessCardRepository.demotePrimaryByOwner(supabase, userId, input.id ?? null);
    }

    const visibility: VisibilitySettings = normalizeVisibility(
      input.visibilitySettings,
      input.publicMode,
    );

    const row: Record<string, unknown> = {
      slug: input.slug,
      card_kind: input.cardKind,
      public_mode: input.publicMode,
      visibility_settings: visibility,
      display_name: input.displayName ?? null,
      professional_title: input.professionalTitle ?? null,
      company_name: input.companyName ?? null,
      company_logo_url: input.companyLogoUrl ?? null,
      avatar_url: input.avatarUrl ?? null,
      cover_url: input.coverUrl ?? null,
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      display_name_en: input.displayNameEn ?? null,
      professional_title_en: input.professionalTitleEn ?? null,
      company_name_en: input.companyNameEn ?? null,
      headline_en: input.headlineEn ?? null,
      bio_en: input.bioEn ?? null,
      website: input.website ?? null,
      work_email: input.workEmail ?? null,
      work_phone: input.workPhone ?? null,
      zalo_url: input.zaloUrl ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      facebook_url: input.facebookUrl ?? null,
      youtube_url: input.youtubeUrl ?? null,
      tiktok_url: input.tiktokUrl ?? null,
      address: input.address ?? null,
      map_url: input.mapUrl ?? null,
      theme_id: input.themeId ?? null,
      custom_brand_color: input.customBrandColor ?? null,
      qr_options: input.qrOptions ?? null,
      updated_at: new Date().toISOString(),
    };

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    let cardId = input.id ?? null;
    if (cardId) {
      const prev = await BusinessCardRepository.findRawById(supabase, cardId);
      if (prev) {
        const before = prev as Record<string, unknown>;
        associationId = (before.association_id as string | null) ?? associationId;
        for (const [k, v] of Object.entries(row)) {
          if (k === "updated_at") continue;
          const prevVal = before[k];
          if (JSON.stringify(prevVal ?? null) !== JSON.stringify(v ?? null)) {
            changes[k] = { from: prevVal ?? null, to: v ?? null };
          }
        }
      }
      await BusinessCardRepository.updateById(supabase, cardId, row);
    } else {
      cardId = await BusinessCardRepository.insertReturningId(supabase, {
        ...row,
        owner_user_id: userId,
        member_id: memberId,
        association_id: associationId,
      });
    }

    const id = cardId as string;

    await BusinessCardRepository.logMemberEvent(supabase, id, input.id ? "update" : "create", {
      slug: input.slug,
      card_kind: input.cardKind,
      ...(input.id ? { changes } : {}),
    });

    await BusinessCardRepository.replaceChildren(supabase, id, associationId, {
      skills: input.skills,
      services: input.services,
      needs: input.needs,
    });

    return { id };
  },

  // ── Status / primary / delete ──────────────────────────────────────────────
  async setStatus(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    status: "draft" | "published" | "hidden" | "archived",
  ): Promise<{ ok: boolean }> {
    await this.assertOwnerUnlocked(supabase, userId, id, { requireUnlocked: true });
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "published") patch.published_at = new Date().toISOString();
    await BusinessCardRepository.updateById(supabase, id, patch);
    return { ok: true };
  },

  /** Publish convenience (SDK verb). */
  async publish(supabase: SupabaseClient, userId: string, id: string) {
    return this.setStatus(supabase, userId, id, "published");
  },

  /** Hide convenience (SDK verb). */
  async hide(supabase: SupabaseClient, userId: string, id: string) {
    return this.setStatus(supabase, userId, id, "hidden");
  },

  async setPrimary(supabase: SupabaseClient, userId: string, id: string): Promise<{ ok: boolean }> {
    const { authz } = await this.assertOwnerUnlocked(supabase, userId, id, {
      requireUnlocked: true,
    });
    if (authz.memberId && authz.associationId) {
      await BusinessCardRepository.demotePrimary(supabase, authz.memberId, authz.associationId, id);
    } else if (authz.ownershipMode === "global_user" && authz.ownerUserId) {
      await BusinessCardRepository.demotePrimaryByOwner(supabase, authz.ownerUserId, id);
    }
    await BusinessCardRepository.updateById(supabase, id, {
      card_kind: "primary",
      updated_at: new Date().toISOString(),
    });
    await BusinessCardRepository.logMemberEvent(supabase, id, "set_primary", {});
    return { ok: true };
  },

  async deleteCard(supabase: SupabaseClient, userId: string, id: string): Promise<{ ok: boolean }> {
    await this.assertOwnerUnlocked(supabase, userId, id, { requireUnlocked: true });
    await BusinessCardRepository.logMemberEvent(supabase, id, "delete", {});
    await BusinessCardRepository.deleteById(supabase, id);
    return { ok: true };
  },
};

export type { PublicMode };
