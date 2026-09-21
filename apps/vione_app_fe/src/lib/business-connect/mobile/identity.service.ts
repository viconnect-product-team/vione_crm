// BC-Mobile-5A — identity domain service (server-side logic).
//
// Ownership rules (P4 — server authoritative):
//   - every owner mutation derives the actor from context.userId
//     (auth.uid() on the wire) and writes owner_user_id = actor;
//   - client-supplied owner_user_id never reaches this module (the zod
//     schema is strict) and would be ignored here anyway.
//
// Public resolution:
//   - the anonymous /c/:token path resolves a SINGLE token through the
//     privileged server client and returns only toPublicIdentityCard output.
//     A TO anon table policy is deliberately NOT used: it would turn the
//     resolver into an enumerable public directory (a hard non-goal).
//   - the project's security guard forbids anon-executable SECURITY DEFINER
//     functions, so no RPC bypass exists either.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  BusinessIdentity,
  IdentityShareLinkInfo,
  IdentityVisibilityState,
  MyIdentityPayload,
  PublicIdentityResult,
} from "./identity.types";
import { toPublicIdentityCard } from "./identity.projection";
import type { IdentityUpdateInput, VisibilityUpdateInput } from "./identity.validation";
import { reportIdentityMetric } from "./identity.telemetry";

type DB = SupabaseClient<Database>;
type IdentityRow = Database["public"]["Tables"]["business_identities"]["Row"];

function mapIdentity(row: IdentityRow): BusinessIdentity {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    displayName: row.display_name,
    headline: row.headline,
    jobTitle: row.job_title,
    companyName: row.company_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    website: row.website,
    linkedinUrl: row.linkedin_url,
    address: row.address,
    city: row.city,
    countryCode: row.country_code,
    preferredLocale: row.preferred_locale,
    status: row.status as BusinessIdentity["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 256-bit opaque token: 64 lowercase hex chars, server-generated only. */
export function generateShareToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

async function fetchOwnIdentity(supabase: DB, userId: string): Promise<BusinessIdentity | null> {
  const { data, error } = await supabase
    .from("business_identities")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapIdentity(data) : null;
}

async function fetchOwnVisibility(
  supabase: DB,
  userId: string,
): Promise<Record<string, IdentityVisibilityState>> {
  const { data, error } = await supabase
    .from("identity_field_visibility")
    .select("field_key, visibility")
    .eq("owner_user_id", userId);
  if (error) throw new Error(error.message);
  const out: Record<string, IdentityVisibilityState> = {};
  for (const row of data ?? []) out[row.field_key] = row.visibility as IdentityVisibilityState;
  return out;
}

export async function getMyIdentity(supabase: DB, userId: string): Promise<MyIdentityPayload> {
  const [identity, visibility] = await Promise.all([
    fetchOwnIdentity(supabase, userId),
    fetchOwnVisibility(supabase, userId),
  ]);
  return { identity, visibility };
}

/**
 * Owner upsert. owner_user_id is ALWAYS the authenticated actor; the
 * payload's strict schema has already rejected any client-supplied owner/id
 * keys. Creates the canonical identity on first save (UNIQUE owner).
 */
export async function upsertMyIdentity(
  supabase: DB,
  userId: string,
  input: IdentityUpdateInput,
): Promise<MyIdentityPayload> {
  const row = {
    owner_user_id: userId,
    ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
    ...(input.headline !== undefined ? { headline: input.headline } : {}),
    ...(input.jobTitle !== undefined ? { job_title: input.jobTitle } : {}),
    ...(input.companyName !== undefined ? { company_name: input.companyName } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
    ...(input.primaryEmail !== undefined ? { primary_email: input.primaryEmail } : {}),
    ...(input.primaryPhone !== undefined ? { primary_phone: input.primaryPhone } : {}),
    ...(input.website !== undefined ? { website: input.website } : {}),
    ...(input.linkedinUrl !== undefined ? { linkedin_url: input.linkedinUrl } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.countryCode !== undefined ? { country_code: input.countryCode } : {}),
    ...(input.preferredLocale !== undefined ? { preferred_locale: input.preferredLocale } : {}),
  };
  const { error } = await supabase
    .from("business_identities")
    .upsert(row, { onConflict: "owner_user_id" });
  if (error) throw new Error(error.message);
  reportIdentityMetric("IDENTITY_UPDATED");
  return getMyIdentity(supabase, userId);
}

/**
 * Visibility batch upsert — atomic, owner-scoped, allowlist-validated
 * upstream. Requires the identity to exist (visibility without an identity
 * is meaningless).
 */
export async function updateMyVisibility(
  supabase: DB,
  userId: string,
  updates: VisibilityUpdateInput,
): Promise<MyIdentityPayload> {
  const identity = await fetchOwnIdentity(supabase, userId);
  if (!identity) throw new Error("identity_not_found");

  const rows = updates.map((u) => ({
    identity_id: identity.id,
    owner_user_id: userId,
    field_key: u.fieldKey,
    visibility: u.visibility,
  }));
  const { error } = await supabase
    .from("identity_field_visibility")
    .upsert(rows, { onConflict: "identity_id,field_key" });
  if (error) throw new Error(error.message);
  reportIdentityMetric("IDENTITY_PRIVACY_UPDATED");
  return getMyIdentity(supabase, userId);
}

/** Ensure a canonical identity row exists (share links require one). */
async function ensureIdentity(supabase: DB, userId: string): Promise<BusinessIdentity> {
  const existing = await fetchOwnIdentity(supabase, userId);
  if (existing) return existing;
  const { error } = await supabase
    .from("business_identities")
    .upsert({ owner_user_id: userId }, { onConflict: "owner_user_id" });
  if (error) throw new Error(error.message);
  const created = await fetchOwnIdentity(supabase, userId);
  if (!created) throw new Error("identity_unavailable");
  return created;
}

function mapShareLink(
  row: Database["public"]["Tables"]["identity_share_links"]["Row"],
): IdentityShareLinkInfo {
  return {
    token: row.public_token,
    status: row.status as IdentityShareLinkInfo["status"],
    createdAt: row.created_at,
    rotatedAt: row.rotated_at,
    lastUsedAt: row.last_used_at,
  };
}

/**
 * Return the owner's active share link, creating one (server-generated
 * opaque token) on first use. The token is stable until the owner rotates —
 * printed QR / future NFC tags keep working.
 */
export async function getOrCreateMyShareLink(
  supabase: DB,
  userId: string,
): Promise<IdentityShareLinkInfo> {
  const identity = await ensureIdentity(supabase, userId);
  const { data, error } = await supabase
    .from("identity_share_links")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return mapShareLink(data);

  const { data: created, error: insertError } = await supabase
    .from("identity_share_links")
    .insert({
      identity_id: identity.id,
      owner_user_id: userId,
      public_token: generateShareToken(),
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);
  return mapShareLink(created);
}

/**
 * Rotate the share link: revoke every active link and issue a fresh opaque
 * token. Owner-scoped (RLS + explicit owner filter); the old token becomes
 * unusable immediately for the public resolver.
 */
export async function rotateMyShareLink(
  supabase: DB,
  userId: string,
): Promise<IdentityShareLinkInfo> {
  const identity = await ensureIdentity(supabase, userId);
  const now = new Date().toISOString();
  const { error: revokeError } = await supabase
    .from("identity_share_links")
    .update({ status: "revoked", revoked_at: now, rotated_at: now })
    .eq("owner_user_id", userId)
    .eq("status", "active");
  if (revokeError) throw new Error(revokeError.message);

  const { data: created, error: insertError } = await supabase
    .from("identity_share_links")
    .insert({
      identity_id: identity.id,
      owner_user_id: userId,
      public_token: generateShareToken(),
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);
  reportIdentityMetric("IDENTITY_LINK_ROTATED");
  return mapShareLink(created);
}

/**
 * THE most security-sensitive path in 5A — anonymous public resolution.
 *
 * Resolves a single opaque token to the privacy-filtered projection. Every
 * failure mode (malformed — already rejected upstream, unknown, revoked,
 * disabled identity) collapses to one neutral "unavailable" state so the
 * response never reveals whether a user, identity, or token ever existed.
 *
 * Uses the privileged server client for a SINGLE-token lookup; the explicit
 * DTO projection below is the only thing that crosses the wire. No SELECT *
 * reaches the client; no internal id, ownership, visibility row, or
 * share-link metadata is returned.
 */
export async function getPublicIdentityByToken(token: string): Promise<PublicIdentityResult> {
  const started = Date.now();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: link } = await supabaseAdmin
    .from("identity_share_links")
    .select("id, identity_id, status")
    .eq("public_token", token)
    .eq("status", "active")
    .maybeSingle();
  if (!link) {
    reportIdentityMetric("IDENTITY_PUBLIC_UNAVAILABLE", { latencyMs: Date.now() - started });
    return { state: "unavailable" };
  }

  const { data: identityRow } = await supabaseAdmin
    .from("business_identities")
    .select("*")
    .eq("id", link.identity_id)
    .eq("status", "active")
    .maybeSingle();
  if (!identityRow) {
    reportIdentityMetric("IDENTITY_PUBLIC_UNAVAILABLE", { latencyMs: Date.now() - started });
    return { state: "unavailable" };
  }

  const { data: visibilityRows } = await supabaseAdmin
    .from("identity_field_visibility")
    .select("field_key, visibility")
    .eq("identity_id", identityRow.id);
  const visibility: Record<string, IdentityVisibilityState> = {};
  for (const row of visibilityRows ?? []) {
    visibility[row.field_key] = row.visibility as IdentityVisibilityState;
  }

  // Best-effort usage marker (never blocks the recipient view).
  await supabaseAdmin
    .from("identity_share_links")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", link.id);

  reportIdentityMetric("IDENTITY_PUBLIC_RESOLVED", { latencyMs: Date.now() - started });
  return {
    state: "public",
    card: toPublicIdentityCard(mapIdentity(identityRow), visibility),
  };
}
