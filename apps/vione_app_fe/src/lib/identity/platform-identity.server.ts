// BC-1.0 — Platform Identity server helpers.
// Server-only (blocked from client bundle by *.server filename).
// Imported ONLY by src/lib/identity/platform-identity.functions.ts.
//
// These helpers DO NOT modify or replace the Association identity path
// (current_member_id / current_association_id RPCs stay authoritative).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AssociationIdentity, GlobalIdentityContext, UserProfile } from "./identity.types";

type DB = SupabaseClient<Database>;

type ProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    professionalTitle: row.professional_title,
    companyName: row.company_name,
    industry: row.industry,
    region: row.region,
    bio: row.bio,
    locale: row.locale,
    timezone: row.timezone,
    onboardingStatus: row.onboarding_status,
    accountStatus: row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Read the current user's global profile, or null if none exists yet. */
export async function resolveUserProfile(
  supabase: DB,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
}

/**
 * Ensure the caller is a valid platform user. An authenticated user WITHOUT a
 * member row is valid. Throws only when the account is suspended/deactivated.
 * Returns the profile (may be null when not yet created).
 */
export async function requirePlatformUser(
  supabase: DB,
  userId: string,
): Promise<UserProfile | null> {
  const profile = await resolveUserProfile(supabase, userId);
  if (profile && profile.accountStatus !== "active") {
    throw new Error("Platform account is not active");
  }
  return profile;
}

/** Build the global identity context. Never throws for a missing member. */
export async function buildGlobalIdentityContext(
  supabase: DB,
  userId: string,
  email: string | null,
): Promise<GlobalIdentityContext> {
  const profile = await resolveUserProfile(supabase, userId);
  return {
    userId,
    email,
    profile,
    hasProfile: profile !== null,
  };
}

/**
 * Association contexts via the frozen membership model (compatibility layer).
 * Returns [] for a user with no memberships — this is a valid platform user.
 */
export async function getAssociationContexts(
  supabase: DB,
  userId: string,
): Promise<AssociationIdentity[]> {
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("association_id, role, is_default, associations(name)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!memberships || memberships.length === 0) return [];

  // Best-effort member id per association (does not throw when absent).
  const { data: memberRows } = await supabase
    .from("members")
    .select("id, association_id")
    .eq("user_id", userId);
  const memberByAssoc = new Map<string, string>();
  for (const m of memberRows ?? []) {
    if (m.association_id) memberByAssoc.set(m.association_id, m.id);
  }

  return memberships.map((row) => {
    const assoc = row.associations as { name: string | null } | null;
    return {
      associationId: row.association_id,
      associationName: assoc?.name ?? null,
      role: row.role,
      isDefault: Boolean(row.is_default),
      memberId: memberByAssoc.get(row.association_id) ?? null,
    };
  });
}
