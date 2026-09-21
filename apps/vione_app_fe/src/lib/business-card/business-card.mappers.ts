// BusinessCardService — row → DTO mappers (single source of truth).
//
// Extracted verbatim from the former inline mapping in
// business-card.functions.ts so every read path (owner get, preview, public
// projection) produces an identical DTO shape. No behavior change: the same
// column fallbacks and defaults are preserved, parameterized by `defaults`.

import type {
  BusinessCard,
  BusinessCardSummary,
  CardKind,
  CardNeed,
  CardService,
  CardSkill,
  CardStatus,
  PublicMode,
} from "./business-card.types";
import { normalizeVisibility, normalizeQrOptions } from "./business-card.types";

export type RawCardRow = Record<string, unknown>;

export type CardChildren = {
  skills: { label: unknown }[] | null;
  services: { title: unknown; description: unknown; category: unknown }[] | null;
  needs: { title: unknown; description: unknown; category: unknown }[] | null;
};

export type MapDefaults = {
  /** Default status when the column is null (get/preview: "draft"). */
  status: CardStatus;
  /** Default public mode when the column is null. */
  publicMode: PublicMode;
  /**
   * Public projection rule (BC-2.1A): the public card MUST never expose the
   * platform owner. When false, ownerUserId is forced to null.
   */
  exposeOwner: boolean;
};

export function mapSkills(rows: CardChildren["skills"]): CardSkill[] {
  return (rows ?? []).map((s) => ({ label: s.label as string }));
}

export function mapServices(rows: CardChildren["services"]): CardService[] {
  return (rows ?? []).map((s) => ({
    title: s.title as string,
    description: (s.description as string) ?? null,
    category: (s.category as string) ?? null,
  }));
}

export function mapNeeds(rows: CardChildren["needs"]): CardNeed[] {
  return (rows ?? []).map((s) => ({
    title: s.title as string,
    description: (s.description as string) ?? null,
    category: (s.category as string) ?? null,
  }));
}

/** Map a raw member_business_cards row + child rows into the canonical DTO. */
export function mapRowToBusinessCard(
  c: RawCardRow,
  children: CardChildren,
  defaults: MapDefaults,
): BusinessCard {
  const publicMode = (c.public_mode as PublicMode) ?? defaults.publicMode;
  return {
    id: c.id as string,
    ownerUserId: defaults.exposeOwner ? ((c.owner_user_id as string) ?? null) : null,
    slug: c.slug as string,
    cardKind: (c.card_kind as CardKind) ?? "primary",
    status: (c.status as CardStatus) ?? defaults.status,
    publicMode,
    visibilitySettings: normalizeVisibility(c.visibility_settings, publicMode),
    allowContactExchange: (c.allow_contact_exchange as boolean) ?? true,
    displayName: (c.display_name as string) ?? null,
    professionalTitle: (c.professional_title as string) ?? null,
    companyName: (c.company_name as string) ?? null,
    companyLogoUrl: (c.company_logo_url as string) ?? null,
    avatarUrl: (c.avatar_url as string) ?? null,
    coverUrl: (c.cover_url as string) ?? null,
    headline: (c.headline as string) ?? null,
    bio: (c.bio as string) ?? null,
    displayNameEn: (c.display_name_en as string) ?? null,
    professionalTitleEn: (c.professional_title_en as string) ?? null,
    companyNameEn: (c.company_name_en as string) ?? null,
    headlineEn: (c.headline_en as string) ?? null,
    bioEn: (c.bio_en as string) ?? null,
    website: (c.website as string) ?? null,
    workEmail: (c.work_email as string) ?? null,
    workPhone: (c.work_phone as string) ?? null,
    zaloUrl: (c.zalo_url as string) ?? null,
    linkedinUrl: (c.linkedin_url as string) ?? null,
    facebookUrl: (c.facebook_url as string) ?? null,
    youtubeUrl: (c.youtube_url as string) ?? null,
    tiktokUrl: (c.tiktok_url as string) ?? null,
    address: (c.address as string) ?? null,
    mapUrl: (c.map_url as string) ?? null,
    themeId: (c.theme_id as string) ?? null,
    customBrandColor: (c.custom_brand_color as string) ?? null,
    qrOptions: c.qr_options == null ? null : normalizeQrOptions(c.qr_options),
    publishedAt: (c.published_at as string) ?? null,
    updatedAt: c.updated_at as string,
    skills: mapSkills(children.skills),
    services: mapServices(children.services),
    needs: mapNeeds(children.needs),
  };
}

export function mapRowToSummary(r: RawCardRow): BusinessCardSummary {
  return {
    id: r.id as string,
    slug: r.slug as string,
    cardKind: (r.card_kind as CardKind) ?? "primary",
    status: (r.status as CardStatus) ?? "draft",
    publicMode: (r.public_mode as PublicMode) ?? "members_only",
    displayName: (r.display_name as string) ?? null,
    professionalTitle: (r.professional_title as string) ?? null,
    companyName: (r.company_name as string) ?? null,
    avatarUrl: (r.avatar_url as string) ?? null,
    updatedAt: r.updated_at as string,
  };
}
