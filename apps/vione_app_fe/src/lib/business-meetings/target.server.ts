// BC-4.1B — Server-only target resolution + counterpart hydration.
// Server-only (blocked from client bundles by the *.server filename). Reached
// from *.functions.ts handlers via `await import()` so no server-only module is
// statically imported into the client graph.
//
// Responsibilities (resolution + safe projection only — NO SQL state machine):
//   • resolve the authoritative meeting target owner from a Business Card slug
//   • project privacy-safe public counterpart summaries (published cards only)
// Never trusts a client-supplied user id.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BusinessMeetingError } from "./errors";
import { resolveBusinessCardOwnerContext } from "@/lib/identity/identity-bridge.server";
import type { MeetingCounterpartSummary } from "./types";

type DB = SupabaseClient<Database>;

export type ResolvedMeetingTarget = { ownerUserId: string; cardId: string };

/**
 * Resolve the authoritative Platform owner of a PUBLISHED Business Card by slug.
 *   • unpublished / missing → MEETING_TARGET_NOT_FOUND
 *   • unresolved ownership  → MEETING_TARGET_UNAVAILABLE
 * Prefers owner_user_id, falls back through the frozen Identity Bridge.
 */
export async function resolveMeetingTargetByCardSlug(slug: string): Promise<ResolvedMeetingTarget> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as DB;
  const { data: card } = await admin
    .from("member_business_cards")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!card || (card as { status?: string }).status !== "published") {
    throw new BusinessMeetingError("MEETING_TARGET_NOT_FOUND");
  }
  const cardId = (card as { id: string }).id;
  const ctx = await resolveBusinessCardOwnerContext(admin, cardId);
  if (!ctx.ownerUserId) throw new BusinessMeetingError("MEETING_TARGET_UNAVAILABLE");
  return { ownerUserId: ctx.ownerUserId, cardId };
}

const EMPTY_SUMMARY = (userId: string): MeetingCounterpartSummary => ({
  userId,
  displayName: null,
  avatarUrl: null,
  headline: null,
  companyName: null,
  primaryCardSlug: null,
});

/**
 * Project a privacy-safe public summary for a counterpart user id, sourced ONLY
 * from that user's most recent PUBLISHED business card. Never leaks private
 * contact fields, unpublished drafts, or association/member internals. Returns a
 * neutral summary (id only) when nothing public exists.
 */
export async function projectCounterpartSummary(
  userId: string,
): Promise<MeetingCounterpartSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as DB;
  const { data } = await admin
    .from("member_business_cards")
    .select(
      "slug, display_name, avatar_url, headline, professional_title, company_name, updated_at",
    )
    .eq("owner_user_id", userId)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return EMPTY_SUMMARY(userId);
  const row = data as unknown as Record<string, unknown>;
  return {
    userId,
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    headline: (row.headline as string | null) ?? (row.professional_title as string | null) ?? null,
    companyName: (row.company_name as string | null) ?? null,
    primaryCardSlug: (row.slug as string | null) ?? null,
  };
}

/** Batch counterpart projection, de-duplicated. */
export async function projectCounterpartSummaries(
  userIds: readonly string[],
): Promise<Map<string, MeetingCounterpartSummary>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (id) => [id, await projectCounterpartSummary(id)] as const),
  );
  return new Map(entries);
}
