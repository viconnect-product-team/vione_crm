// BC-Mobile-5A — deterministic identity validation + normalization.
// Client mirrors these rules for UX; the SERVER remains authoritative.

import { z } from "zod";
import { IDENTITY_FIELD_KEYS } from "./identity.projection";

/** Explicit server-enforced length limits (chars). */
export const IDENTITY_LIMITS = {
  displayName: 120,
  headline: 160,
  jobTitle: 120,
  companyName: 160,
  bio: 1000,
  primaryEmail: 254,
  primaryPhone: 40,
  website: 500,
  linkedinUrl: 500,
  address: 500,
  city: 120,
  countryCode: 2,
  preferredLocale: 10,
} as const;

/** Trim + collapse inner whitespace (single-line fields). */
export function normalizeText(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Trim, keep newlines, collapse trailing spaces (bio). */
export function normalizeMultiline(raw: string): string {
  return raw
    .trim()
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Email: trim, lowercase, basic format. Returns null when invalid. */
export function normalizeIdentityEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.length > IDENTITY_LIMITS.primaryEmail) return null;
  return /^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$/.test(v) ? v : null;
}

/** Phone: strict character allowlist, international + preserved. */
export function normalizeIdentityPhone(raw: string): string | null {
  const v = raw.replace(/[^0-9+()\-.\s]/g, "").trim();
  if (v.length < 3 || v.length > IDENTITY_LIMITS.primaryPhone) return null;
  return v;
}

/**
 * URL: http/https only, no credentials, no javascript:/data: schemes.
 * Returns the normalized URL string or null.
 */
export function normalizeIdentityUrl(raw: string, maxLen: number): string | null {
  const trimmed = raw.trim();
  if (trimmed.length > maxLen) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Country code: exactly 2 ASCII letters, uppercased. */
export function normalizeCountryCode(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : null;
}

/**
 * Single-line / multiline text: normalized, empty → null (field cleared),
 * post-normalization length strictly enforced.
 */
const optionalText = (max: number, multiline = false) =>
  z
    .string()
    .max(max + 200) // pre-normalization headroom; normalized length enforced after
    .transform((s) => (multiline ? normalizeMultiline(s) : normalizeText(s)))
    .refine((s) => s.length <= max, `exceeds ${max} chars`)
    .transform((s) => (s === "" ? null : s))
    .nullable();

/**
 * A URL field: empty → null (cleared); a NON-EMPTY value that fails the
 * http(s)/no-credentials rules is REJECTED (never silently dropped, so the
 * owner immediately sees that e.g. a javascript: URL was refused).
 */
const optionalUrl = (max: number) =>
  z
    .string()
    .max(max + 200)
    .transform((s) => s.trim())
    .refine((s) => s === "" || normalizeIdentityUrl(s, max) !== null, "invalid or unsafe URL")
    .transform((s) => (s === "" ? null : normalizeIdentityUrl(s, max)))
    .nullable();

/** Email field: empty → null; malformed non-empty input is REJECTED. */
const optionalEmail = z
  .string()
  .max(IDENTITY_LIMITS.primaryEmail + 50)
  .transform((s) => s.trim())
  .refine((s) => s === "" || normalizeIdentityEmail(s) !== null, "invalid email")
  .transform((s) => (s === "" ? null : normalizeIdentityEmail(s)))
  .nullable();

/** Phone field: empty → null; un-normalizable non-empty input is REJECTED. */
const optionalPhone = z
  .string()
  .max(IDENTITY_LIMITS.primaryPhone + 50)
  .transform((s) => s.trim())
  .refine((s) => s === "" || normalizeIdentityPhone(s) !== null, "invalid phone")
  .transform((s) => (s === "" ? null : normalizeIdentityPhone(s)))
  .nullable();

/**
 * Owner identity update payload. STRICT: unknown keys (e.g. a forged
 * owner_user_id, id, status, created_at) are REJECTED — never silently
 * mapped to columns. Every value is normalized server-side.
 */
export const identityUpdateSchema = z
  .object({
    displayName: optionalText(IDENTITY_LIMITS.displayName),
    headline: optionalText(IDENTITY_LIMITS.headline),
    jobTitle: optionalText(IDENTITY_LIMITS.jobTitle),
    companyName: optionalText(IDENTITY_LIMITS.companyName),
    bio: optionalText(IDENTITY_LIMITS.bio, true),
    avatarUrl: z
      .string()
      .max(IDENTITY_LIMITS.website + 200)
      .transform((s) => s.trim())
      .refine(
        (s) =>
          s === "" ||
          s.startsWith("/") ||
          normalizeIdentityUrl(s, IDENTITY_LIMITS.website) !== null,
        "invalid or unsafe URL"
      )
      .transform((s) => {
        if (s === "") return null;
        if (s.startsWith("/")) return s;
        return normalizeIdentityUrl(s, IDENTITY_LIMITS.website);
      })
      .nullable(),
    primaryEmail: optionalEmail,
    primaryPhone: optionalPhone,
    website: optionalUrl(IDENTITY_LIMITS.website),
    linkedinUrl: optionalUrl(IDENTITY_LIMITS.linkedinUrl),
    address: optionalText(IDENTITY_LIMITS.address),
    city: optionalText(IDENTITY_LIMITS.city),
    countryCode: z
      .string()
      .max(10)
      .transform((s) => s.trim())
      .refine((s) => s === "" || normalizeCountryCode(s) !== null, "invalid country code")
      .transform((s) => (s === "" ? null : normalizeCountryCode(s)))
      .nullable(),
    preferredLocale: optionalText(IDENTITY_LIMITS.preferredLocale),
  })
  .strict();

export type IdentityUpdateInput = z.infer<typeof identityUpdateSchema>;

/**
 * Visibility update batch. field_key is a fixed enum — unknown keys
 * ("password", "owner_user_id", future internal columns) are REJECTED.
 */
export const visibilityUpdateSchema = z
  .array(
    z
      .object({
        fieldKey: z.enum(IDENTITY_FIELD_KEYS),
        visibility: z.enum(["PRIVATE", "SHARED"]),
      })
      .strict(),
  )
  .min(1)
  .max(IDENTITY_FIELD_KEYS.length);

export type VisibilityUpdateInput = z.infer<typeof visibilityUpdateSchema>;

/**
 * Public share token: 64 lowercase hex chars from 32 crypto-random bytes
 * (256 bits). Malformed tokens fail HERE — cheaply, before any DB work.
 */
export const PUBLIC_TOKEN_RE = /^[a-f0-9]{64}$/;
export const publicTokenSchema = z.string().regex(PUBLIC_TOKEN_RE);

export function isValidPublicToken(token: string): boolean {
  return PUBLIC_TOKEN_RE.test(token);
}
