// BC-4.1B — Business Meetings identity guard.
// Resolves an active platform user eligible to schedule Business Meetings,
// WITHOUT requiring a member row, association context, or public card. Mirrors
// the frozen Global Identity model (user_profiles.account_status). Server-only
// (userId is always server-resolved via context.userId). Statically imports NO
// *.server module → safe to import from *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BusinessMeetingError } from "./errors";

type DB = SupabaseClient<Database>;

export type GlobalMeetingUser = {
  userId: string;
  accountStatus: string;
};

/**
 * Ensure the caller is an active platform user eligible for Business Meetings.
 *   • unauthenticated     → MEETING_AUTH_REQUIRED
 *   • suspended account   → MEETING_ACCOUNT_SUSPENDED
 *   • deactivated account → MEETING_ACCOUNT_INACTIVE
 *   • no member / assoc / card → VALID (global users are first-class)
 */
export async function requireGlobalMeetingUser(
  supabase: DB,
  userId: string | null | undefined,
): Promise<GlobalMeetingUser> {
  if (!userId) throw new BusinessMeetingError("MEETING_AUTH_REQUIRED");

  const { data } = await supabase
    .from("user_profiles")
    .select("account_status")
    .eq("user_id", userId)
    .maybeSingle();

  const accountStatus = (data?.account_status as string | undefined) ?? "active";
  if (accountStatus === "suspended") {
    throw new BusinessMeetingError("MEETING_ACCOUNT_SUSPENDED");
  }
  if (accountStatus === "deactivated") {
    throw new BusinessMeetingError("MEETING_ACCOUNT_INACTIVE");
  }

  return { userId, accountStatus };
}
