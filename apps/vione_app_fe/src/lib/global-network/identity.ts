// BC-3.1A — Global Network identity guard.
// Resolves an active platform user for networking WITHOUT requiring a member
// row, association context, or public business card. Uses the frozen Global
// Identity model (user_profiles.account_status). Server-invoked only.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalNetworkError } from "./errors";
import type { GlobalNetworkUser } from "./types";

type DB = SupabaseClient<Database>;

/**
 * Ensure the caller is an active platform user eligible for global networking.
 * - unauthenticated       -> NETWORK_AUTH_REQUIRED
 * - suspended account     -> NETWORK_ACCOUNT_SUSPENDED
 * - deactivated account   -> NETWORK_ACCOUNT_INACTIVE
 * - no member / assoc / card -> VALID (global users are first-class)
 * Never creates a fake membership. `userId` is server-resolved (context.userId).
 */
export async function requireGlobalNetworkUser(
  supabase: DB,
  userId: string | null | undefined,
): Promise<GlobalNetworkUser> {
  if (!userId) throw new GlobalNetworkError("NETWORK_AUTH_REQUIRED");

  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, account_status")
    .eq("user_id", userId)
    .maybeSingle();

  const accountStatus = (data?.account_status as string | undefined) ?? "active";
  if (accountStatus === "suspended") {
    throw new GlobalNetworkError("NETWORK_ACCOUNT_SUSPENDED");
  }
  if (accountStatus === "deactivated") {
    throw new GlobalNetworkError("NETWORK_ACCOUNT_INACTIVE");
  }

  return {
    userId,
    accountStatus,
    profileId: (data?.user_id as string | undefined) ?? undefined,
  };
}
