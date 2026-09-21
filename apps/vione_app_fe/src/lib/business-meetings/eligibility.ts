// BC-4.1A — Connection Policy B eligibility (server-side helper).
//
// A meeting proposal is allowed when ONE server-verified condition holds:
//   • the users have an accepted Global Connection, OR
//   • the organizer owns a Saved Card edge targeting the participant.
//
// Association membership, Company context and public profile visibility are
// NOT sufficient. This module performs participant-scoped reads only; the
// authoritative enforcement additionally lives inside the DB mutation
// functions (bm_eligibility_source / bm_pair_blocked). Statically imports NO
// *.server module → safe to import from *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BusinessMeetingError } from "./errors";
import type { MeetingEligibility, MeetingEligibilitySource } from "./types";

type DB = SupabaseClient<Database>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pure: pick the strongest eligibility source, preferring global_connection. */
export function classifyEligibility(
  hasAcceptedConnection: boolean,
  hasSavedCardEdge: boolean,
): MeetingEligibilitySource | null {
  if (hasAcceptedConnection) return "global_connection";
  if (hasSavedCardEdge) return "saved_card";
  return null;
}

/** True when the organizer/target pair is currently blocked (identity hidden). */
export async function isPairBlocked(supabase: DB, a: string, b: string): Promise<boolean> {
  const [low, high] = a < b ? [a, b] : [b, a];
  const { data, error } = await supabase
    .from("user_connections")
    .select("id")
    .eq("status", "blocked")
    .eq("pair_user_low", low)
    .eq("pair_user_high", high)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function hasAcceptedConnection(supabase: DB, a: string, b: string): Promise<boolean> {
  const [low, high] = a < b ? [a, b] : [b, a];
  const { data, error } = await supabase
    .from("user_connections")
    .select("id")
    .eq("status", "accepted")
    .eq("pair_user_low", low)
    .eq("pair_user_high", high)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function hasSavedCardEdge(
  supabase: DB,
  organizerUserId: string,
  targetUserId: string,
): Promise<boolean> {
  // organizer-owned saved card whose target card is owned by the target user.
  const { data: cards, error: cardErr } = await supabase
    .from("member_business_cards")
    .select("id")
    .eq("owner_user_id", targetUserId);
  if (cardErr) throw new Error(cardErr.message);
  const ids = (cards ?? []).map((c: any) => (c as { id: string }).id);
  if (ids.length === 0) return false;
  const { data, error } = await supabase
    .from("saved_business_cards")
    .select("id")
    .eq("owner_user_id", organizerUserId)
    .in("target_card_id", ids)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

/**
 * Reusable server-side eligibility guard (Policy B). Resolves the eligibility
 * source or throws a stable domain error. Never trusts client identity: the
 * organizer id is always the trusted current-user id.
 */
export async function requireMeetingProposalEligibility(
  supabase: DB,
  organizerUserId: string,
  targetUserId: string,
): Promise<MeetingEligibility> {
  if (!UUID.test(targetUserId)) {
    throw new BusinessMeetingError("MEETING_TARGET_NOT_FOUND");
  }
  if (organizerUserId === targetUserId) {
    throw new BusinessMeetingError("MEETING_PARTICIPANT_INVALID");
  }
  if (await isPairBlocked(supabase, organizerUserId, targetUserId)) {
    throw new BusinessMeetingError("MEETING_BLOCKED");
  }
  const [conn, saved] = await Promise.all([
    hasAcceptedConnection(supabase, organizerUserId, targetUserId),
    hasSavedCardEdge(supabase, organizerUserId, targetUserId),
  ]);
  const source = classifyEligibility(conn, saved);
  if (!source) throw new BusinessMeetingError("MEETING_CONNECTION_REQUIRED");
  return { organizerUserId, targetUserId, eligibilitySource: source };
}
