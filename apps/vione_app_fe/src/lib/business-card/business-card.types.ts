// BusinessCard domain types + pure visibility helpers.
//
// Extracted from business-card.functions.ts so every layer (repository,
// service, SDK, server functions) shares one definition. Client-safe: no
// server imports, no supabase client. Behavior is unchanged.

import type { PublicBusinessCard } from "./public-card";

export type CardKind = "primary" | "secondary";
export type CardStatus = "draft" | "published" | "hidden" | "suspended" | "archived" | "rejected";
export type PublicMode = "public" | "members_only" | "private";

// Granular display rules persisted in `visibility_settings` (jsonb).
// `mode` mirrors `public_mode` (the enum) and drives RLS/index; the flags
// gate individual sections when the card is visible.
export type VisibilitySettings = {
  mode: PublicMode;
  showContact: boolean;
  showSocial: boolean;
  showServices: boolean;
  showNeeds: boolean;
};

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  mode: "members_only",
  showContact: true,
  showSocial: true,
  showServices: true,
  showNeeds: true,
};

export function normalizeVisibility(raw: unknown, mode: PublicMode): VisibilitySettings {
  const v = (raw ?? {}) as Partial<VisibilitySettings>;
  return {
    mode,
    showContact: v.showContact ?? true,
    showSocial: v.showSocial ?? true,
    showServices: v.showServices ?? true,
    showNeeds: v.showNeeds ?? true,
  };
}

export type CardSkill = { label: string };
export type CardService = { title: string; description: string | null; category: string | null };
export type CardNeed = { title: string; description: string | null; category: string | null };

/**
 * Persisted QR customisation. Kept alongside the card record so live preview,
 * public profile render and PNG/SVG exports all use the same values.
 */
export type QrOptions = {
  background: "white" | "template" | "transparent";
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
};

export const DEFAULT_QR_OPTIONS: QrOptions = {
  background: "white",
  logoScale: 0.22,
  logoOffsetX: 0,
  logoOffsetY: 0,
};

export function normalizeQrOptions(raw: unknown): QrOptions {
  const v = (raw ?? {}) as Partial<QrOptions>;
  const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
    const num = typeof n === "number" && Number.isFinite(n) ? n : fallback;
    return Math.max(lo, Math.min(hi, num));
  };
  const bg = v.background;
  return {
    background:
      bg === "template" || bg === "transparent" || bg === "white"
        ? bg
        : DEFAULT_QR_OPTIONS.background,
    logoScale: clamp(v.logoScale, 0.14, 0.3, DEFAULT_QR_OPTIONS.logoScale),
    logoOffsetX: clamp(v.logoOffsetX, -0.25, 0.25, DEFAULT_QR_OPTIONS.logoOffsetX),
    logoOffsetY: clamp(v.logoOffsetY, -0.25, 0.25, DEFAULT_QR_OPTIONS.logoOffsetY),
  };
}

export type BusinessCard = {
  id: string;
  // Internal-only: platform owner (BC-2.1A foundation). Nullable/unset for all
  // legacy cards until BC-2.1B populates it. NEVER exposed on the public DTO.
  ownerUserId: string | null;
  slug: string;
  cardKind: CardKind;
  status: CardStatus;
  publicMode: PublicMode;
  visibilitySettings: VisibilitySettings;
  /** BC-Mobile-3B — owner opt-out for the anonymous guest share-contact form. */
  allowContactExchange: boolean;
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  headline: string | null;
  bio: string | null;
  // Optional English overrides. When any is set, the card can render a second
  // (EN) side; missing fields fall back to the VI value at presentation time.
  displayNameEn: string | null;
  professionalTitleEn: string | null;
  companyNameEn: string | null;
  headlineEn: string | null;
  bioEn: string | null;
  website: string | null;
  workEmail: string | null;
  workPhone: string | null;
  zaloUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  address: string | null;
  mapUrl: string | null;
  themeId: string | null;
  customBrandColor: string | null;
  qrOptions: QrOptions | null;
  publishedAt: string | null;
  updatedAt: string;
  skills: CardSkill[];
  services: CardService[];
  needs: CardNeed[];
};

export type BusinessCardSummary = {
  id: string;
  slug: string;
  cardKind: CardKind;
  status: CardStatus;
  publicMode: PublicMode;
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  updatedAt: string;
};

/**
 * BC-Mobile-3A — Anonymous public lookup result. The card payload is the
 * explicit whitelist DTO (`PublicBusinessCard`): visibility gates are applied
 * server-side and internal ids, owner ids, raw visibility flags, timestamps,
 * QR options and audit fields never cross the wire. `members_only` is an
 * intentional access-tier gate, not an error.
 */
export type PublicBusinessCardResult =
  | { state: "public"; card: PublicBusinessCard }
  | { state: "members_only" }
  | { state: "not_found" };

// Coded errors (stable, machine-readable) so the client can map them to clear,
// localized permission messages instead of surfacing raw Postgres strings.
export const BC_ERR = {
  NO_PROFILE: "BC_NO_PROFILE",
  NOT_FOUND: "BC_NOT_FOUND",
  FORBIDDEN: "BC_FORBIDDEN",
  LOCKED: "BC_LOCKED",
} as const;

// Statuses that are administratively locked: the owner may not edit, publish,
// set primary, or otherwise mutate the card until an admin restores it.
export const LOCKED_STATUSES = new Set<CardStatus>(["suspended", "rejected"]);

// Card content input shape (write path). owner_user_id is NEVER part of this —
// it is always derived server-side from auth.uid().
export type CardWriteInput = {
  id?: string | null;
  scope?: "association" | "global";
  slug: string;
  cardKind: CardKind;
  publicMode: PublicMode;
  visibilitySettings?: {
    showContact: boolean;
    showSocial: boolean;
    showServices: boolean;
    showNeeds: boolean;
  };
  displayName?: string | null;
  professionalTitle?: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  displayNameEn?: string | null;
  professionalTitleEn?: string | null;
  companyNameEn?: string | null;
  headlineEn?: string | null;
  bioEn?: string | null;
  website?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  zaloUrl?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  themeId?: string | null;
  customBrandColor?: string | null;
  qrOptions?: QrOptions | null;
  skills: { label: string }[];
  services: { title: string; description?: string | null; category?: string | null }[];
  needs: { title: string; description?: string | null; category?: string | null }[];
};
