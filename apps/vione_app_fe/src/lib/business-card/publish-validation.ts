// BC-2.2 — Business Card publish validation (pure, client-safe).
//
// One shared source of truth for "can this card be published?" used by both the
// builder UI (to gate the Publish button) and — indirectly — as documentation
// of the invariants the service/DB enforce. NO supabase, NO network, NO DOM.
//
// Global (platform-user) cards do NOT require member code, association,
// membership level, or a Membership Identity pass. Those are membership
// concerns and are intentionally absent here.

import { LOCKED_STATUSES, type BusinessCard, type CardStatus } from "./business-card.types";

export type PublishIssueCode =
  | "DISPLAY_NAME"
  | "TITLE_OR_HEADLINE"
  | "SLUG"
  | "CTA"
  | "VISIBILITY"
  | "CONTACT_URL"
  | "ACCOUNT_INACTIVE"
  | "CARD_LOCKED";

export type PublishIssue = { code: PublishIssueCode };

export type PublishValidationInput = {
  displayName?: string | null;
  professionalTitle?: string | null;
  headline?: string | null;
  slug?: string | null;
  status?: CardStatus;
  website?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  zaloUrl?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  publicMode?: string | null;
  visibilitySettings?: {
    showContact: boolean;
    showSocial: boolean;
    showServices: boolean;
    showNeeds: boolean;
  } | null;
  /** Whether the platform account is active (resolved elsewhere). */
  accountActive?: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_MODES = new Set(["public", "members_only", "private"]);

function looksLikeUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  // Accept bare domains and http(s) URLs; reject spaces / obvious junk.
  if (/\s/.test(s)) return false;
  return /^(https?:\/\/)?[\w.-]+\.[a-z]{2}/i.test(s) || s.startsWith("http");
}

/**
 * Returns the list of blocking issues. Empty array === publishable.
 * Pure and deterministic — safe for unit tests and client gating.
 */
export function validateCardForPublish(input: PublishValidationInput): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const name = (input.displayName ?? "").trim();
  if (!name) issues.push({ code: "DISPLAY_NAME" });

  const title = (input.professionalTitle ?? "").trim();
  const headline = (input.headline ?? "").trim();
  if (!title && !headline) issues.push({ code: "TITLE_OR_HEADLINE" });

  const slug = (input.slug ?? "").trim();
  if (slug.length < 2 || !SLUG_RE.test(slug)) issues.push({ code: "SLUG" });

  const modeStr = typeof input.publicMode === "string" ? input.publicMode : "";
  if (modeStr && !VALID_MODES.has(modeStr)) issues.push({ code: "VISIBILITY" });

  const vis = input.visibilitySettings ?? {
    showContact: true,
    showSocial: true,
    showServices: true,
    showNeeds: true,
  };

  const contactValues = [input.workPhone, input.workEmail, input.website].filter(
    (v) => (v ?? "").trim().length > 0,
  );
  const socialValues = [
    input.zaloUrl,
    input.linkedinUrl,
    input.facebookUrl,
    input.youtubeUrl,
    input.tiktokUrl,
  ].filter((v) => (v ?? "").trim().length > 0);

  const hasEnabledCta =
    (vis.showContact && contactValues.length > 0) || (vis.showSocial && socialValues.length > 0);
  if (!hasEnabledCta) issues.push({ code: "CTA" });

  // URL-shaped fields must look like URLs when present.
  const urlFields = [
    input.website,
    input.linkedinUrl,
    input.facebookUrl,
    input.youtubeUrl,
    input.tiktokUrl,
    input.zaloUrl,
  ];
  if (urlFields.some((v) => (v ?? "").trim() && !looksLikeUrl(v as string))) {
    issues.push({ code: "CONTACT_URL" });
  }

  if (input.accountActive === false) issues.push({ code: "ACCOUNT_INACTIVE" });

  if (input.status && LOCKED_STATUSES.has(input.status)) {
    issues.push({ code: "CARD_LOCKED" });
  }

  return issues;
}

/** Convenience wrapper for a full BusinessCard DTO. */
export function validateBusinessCardForPublish(
  card: BusinessCard,
  opts: { accountActive?: boolean } = {},
): PublishIssue[] {
  return validateCardForPublish({
    displayName: card.displayName,
    professionalTitle: card.professionalTitle,
    headline: card.headline,
    slug: card.slug,
    status: card.status,
    website: card.website,
    workEmail: card.workEmail,
    workPhone: card.workPhone,
    zaloUrl: card.zaloUrl,
    linkedinUrl: card.linkedinUrl,
    facebookUrl: card.facebookUrl,
    youtubeUrl: card.youtubeUrl,
    tiktokUrl: card.tiktokUrl,
    publicMode: card.publicMode,
    visibilitySettings: card.visibilitySettings,
    accountActive: opts.accountActive,
  });
}

export function isPublishable(input: PublishValidationInput): boolean {
  return validateCardForPublish(input).length === 0;
}
