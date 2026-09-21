// BC-Mobile-3A — Public Digital Card projection (security boundary).
//
// /b/$slug and the .vcf endpoint are ANONYMOUS public surfaces. They must
// never transport a private/full Business Card record and rely on React to
// hide fields. This module is the explicit whitelist:
//
//   canonical business card (internal)
//   → toPublicBusinessCard (visibility gates applied, internals stripped)
//   → PublicBusinessCard DTO (the ONLY shape that crosses the wire)
//   → Public Card UI / vCard generator
//
// Denylist (never present on the DTO): owner_user_id, association/member ids,
// card internal UUID, raw visibility flags, status/publicMode/cardKind,
// qrOptions, publishedAt/updatedAt, notes, relationship data, Meeting
// Moments, Journey, AI data, tags, audit fields, tenant info.

import type { BusinessCard } from "./business-card.types";

/** Slug contract: normalized, bounded, routing-safe, no traversal/markup. */
export const PUBLIC_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export function isValidPublicSlug(slug: string): boolean {
  return PUBLIC_SLUG_RE.test(slug);
}

/**
 * The anonymous public projection. Every field is display-safe public content
 * chosen by the card owner; visibility flags have ALREADY been applied
 * (hidden fields are null / empty lists).
 */
export type PublicBusinessCard = {
  slug: string;
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  headline: string | null;
  bio: string | null;
  /** Optional English overrides (public bilingual display content). */
  displayNameEn: string | null;
  professionalTitleEn: string | null;
  companyNameEn: string | null;
  headlineEn: string | null;
  bioEn: string | null;
  /** Contact — null when the owner hides the contact section. */
  website: string | null;
  workEmail: string | null;
  workPhone: string | null;
  address: string | null;
  mapUrl: string | null;
  /** Social — null when the owner hides the social section. */
  zaloUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  /** Branding. */
  themeId: string | null;
  customBrandColor: string | null;
  /** BC-Mobile-3B — whether this card accepts anonymous guest contact shares.
   *  Display-safe: the CTA visibility is already public information. */
  allowContactExchange: boolean;
  /** Public content lists (gated by their section flags). */
  skills: { label: string }[];
  services: { title: string; description: string | null; category: string | null }[];
  needs: { title: string; description: string | null; category: string | null }[];
};

/**
 * Map the canonical internal card to the anonymous public DTO.
 * Visibility flags are hard gates applied HERE (server-side), not in the UI.
 */
export function toPublicBusinessCard(card: BusinessCard): PublicBusinessCard {
  const v = card.visibilitySettings;
  const showContact = v.showContact !== false;
  const showSocial = v.showSocial !== false;
  const showServices = v.showServices !== false;
  const showNeeds = v.showNeeds !== false;
  return {
    slug: card.slug,
    displayName: card.displayName,
    professionalTitle: card.professionalTitle,
    companyName: card.companyName,
    companyLogoUrl: card.companyLogoUrl,
    avatarUrl: card.avatarUrl,
    coverUrl: card.coverUrl,
    headline: card.headline,
    bio: card.bio,
    displayNameEn: card.displayNameEn,
    professionalTitleEn: card.professionalTitleEn,
    companyNameEn: card.companyNameEn,
    headlineEn: card.headlineEn,
    bioEn: card.bioEn,
    website: showContact ? card.website : null,
    workEmail: showContact ? card.workEmail : null,
    workPhone: showContact ? card.workPhone : null,
    address: showContact ? card.address : null,
    mapUrl: showContact ? card.mapUrl : null,
    zaloUrl: showSocial ? card.zaloUrl : null,
    linkedinUrl: showSocial ? card.linkedinUrl : null,
    facebookUrl: showSocial ? card.facebookUrl : null,
    youtubeUrl: showSocial ? card.youtubeUrl : null,
    tiktokUrl: showSocial ? card.tiktokUrl : null,
    themeId: card.themeId,
    customBrandColor: card.customBrandColor,
    allowContactExchange: card.allowContactExchange,
    skills: card.skills,
    services: showServices ? card.services : [],
    needs: showNeeds ? card.needs : [],
  };
}
