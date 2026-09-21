// BC-Mobile-6A — Relationship Intelligence server adapter (SERVER-ONLY).
//
// Implements the DI ports with viewer-scoped Supabase queries. Defense in
// depth: RLS (auth.uid()) AND explicit owner/participant filters. Every
// query selects a MINIMAL projection — notes, tags, photos, OCR payloads,
// contact details and private org fields are never read for intelligence.

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRelationshipWording } from "./relationship-intelligence.ai.server";
import type { RelationshipDismissal } from "./relationship-intelligence.engine";
import { getPersonalizationPolicy } from "./relationship-personalization.server";
import {
  composePersonRecommendation,
  composeTodayRecommendations,
  type ConnectionEdge,
  type CounterpartPublicSummary,
  type GuestContactEdge,
  type MomentEdge,
  type RelationshipIntelligenceDeps,
  type SavedCardEdge,
} from "./relationship-intelligence.service";
import type {
  BcMobileDismissRecommendationResult,
  BcMobilePersonRecommendationResult,
  BcMobileTodayRecommendationsResult,
  RelationshipRecommendationType,
  RelationshipWordingLocale,
} from "./relationship-intelligence.types";
import { RELATIONSHIP_INTELLIGENCE_CONFIG } from "./relationship-intelligence.types";

type DB = SupabaseClient;

// ── Ports ──────────────────────────────────────────────────────────────────

async function listOldestConnections(
  supabase: DB,
  viewerId: string,
  limit: number,
): Promise<ConnectionEdge[]> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("id, requester_user_id, recipient_user_id, responded_at, updated_at")
    .eq("status", "accepted")
    .or(`requester_user_id.eq.${viewerId},recipient_user_id.eq.${viewerId}`)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => {
    const row = r as Record<string, unknown>;
    const requester = row.requester_user_id as string;
    return {
      connectionId: row.id as string,
      counterpartUserId: requester === viewerId ? (row.recipient_user_id as string) : requester,
      connectedAt: (row.responded_at as string | null) ?? (row.updated_at as string),
    };
  });
}

/** Coarse, truthful area label: the last meaningful segment of a canonical address. */
function areaFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 1);
  const last = parts.at(-1) ?? null;
  return normalizeLabel(last);
}

function normalizeLabel(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, 64) : null;
}

const SAVED_EDGE_SELECT =
  "target_card_id, saved_at, industry, target:member_business_cards!saved_business_cards_target_card_id_fkey(display_name, professional_title, company_name, avatar_url, address)";

function mapSavedEdge(row: Record<string, unknown>): SavedCardEdge | null {
  const target = row.target as Record<string, unknown> | null;
  if (!target) return null; // target no longer visible under RLS → exclude
  return {
    targetCardId: row.target_card_id as string,
    savedAt: row.saved_at as string,
    displayName: (target.display_name as string | null) ?? null,
    avatarUrl: (target.avatar_url as string | null) ?? null,
    headline: (target.professional_title as string | null) ?? null,
    companyName: (target.company_name as string | null) ?? null,
    industryLabel: normalizeLabel(row.industry as string | null),
    areaLabel: areaFromAddress(target.address as string | null),
  };
}

async function listSavedCardEdges(
  supabase: DB,
  viewerId: string,
  limit: number,
): Promise<SavedCardEdge[]> {
  const { data, error } = await supabase
    .from("saved_business_cards")
    .select(SAVED_EDGE_SELECT)
    .eq("owner_user_id", viewerId)
    .eq("archived", false)
    .order("saved_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((r: any) => mapSavedEdge(r as Record<string, unknown>))
    .filter((e): e is SavedCardEdge => e !== null);
}

async function getSavedCardEdge(
  supabase: DB,
  viewerId: string,
  targetCardId: string,
): Promise<SavedCardEdge | null> {
  const { data, error } = await supabase
    .from("saved_business_cards")
    .select(SAVED_EDGE_SELECT)
    .eq("owner_user_id", viewerId)
    .eq("target_card_id", targetCardId)
    .maybeSingle();
  if (error) return null; // fail-closed
  return data ? mapSavedEdge(data as Record<string, unknown>) : null;
}

const GUEST_EDGE_SELECT = "id, display_name, first_shared_at, source, address";

function mapGuestEdge(row: Record<string, unknown>): GuestContactEdge {
  return {
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? "—",
    firstSharedAt: (row.first_shared_at as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    areaLabel: areaFromAddress(row.address as string | null),
  };
}

async function listGuestEdges(
  supabase: DB,
  viewerId: string,
  limit: number,
): Promise<GuestContactEdge[]> {
  const { data, error } = await supabase
    .from("guest_contacts")
    .select(GUEST_EDGE_SELECT)
    .eq("owner_user_id", viewerId)
    .order("first_shared_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => mapGuestEdge(r as Record<string, unknown>));
}

async function getGuestEdge(
  supabase: DB,
  viewerId: string,
  guestId: string,
): Promise<GuestContactEdge | null> {
  const { data, error } = await supabase
    .from("guest_contacts")
    .select(GUEST_EDGE_SELECT)
    .eq("owner_user_id", viewerId)
    .eq("id", guestId)
    .maybeSingle();
  if (error) return null; // fail-closed
  return data ? mapGuestEdge(data as Record<string, unknown>) : null;
}

/** Moments: timestamps + target ONLY (note/photos never selected). */
async function listRecentMomentEdges(
  supabase: DB,
  viewerId: string,
  limit: number,
): Promise<MomentEdge[]> {
  const { data, error } = await supabase
    .from("business_relationship_moments")
    .select("target_kind, target_user_id, target_card_id, target_guest_id, occurred_at")
    .eq("owner_user_id", viewerId)
    .eq("status", "active")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const edges: MomentEdge[] = [];
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const kind = row.target_kind as string;
    const id =
      kind === "connection"
        ? (row.target_user_id as string | null)
        : kind === "saved_card"
          ? (row.target_card_id as string | null)
          : (row.target_guest_id as string | null);
    if (!id) continue;
    const prefix = kind === "connection" ? "u" : kind === "saved_card" ? "c" : "g";
    edges.push({ personId: `${prefix}:${id}`, occurredAt: row.occurred_at as string });
  }
  return edges;
}

/** Same privacy projection as resolvePublicCounterpartsFn (PUBLISHED+PUBLIC). */
async function resolveConnectionSummaries(
  supabase: DB,
  userIds: string[],
): Promise<CounterpartPublicSummary[]> {
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("member_business_cards")
    .select(
      "owner_user_id, display_name, headline, professional_title, company_name, avatar_url, address, card_kind, status, public_mode",
    )
    .in("owner_user_id", ids)
    .eq("status", "published")
    .eq("public_mode", "public");
  if (error) return [];
  const byUser = new Map<string, CounterpartPublicSummary>();
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const uid = row.owner_user_id as string | null;
    if (!uid) continue;
    const isPrimary = row.card_kind === "primary";
    if (byUser.has(uid) && !isPrimary) continue;
    byUser.set(uid, {
      userId: uid,
      displayName: (row.display_name as string | null) ?? null,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      headline:
        (row.headline as string | null) ?? (row.professional_title as string | null) ?? null,
      companyName: (row.company_name as string | null) ?? null,
      areaLabel: areaFromAddress(row.address as string | null),
    });
  }
  return Array.from(byUser.values());
}

async function listDismissals(supabase: DB, viewerId: string): Promise<RelationshipDismissal[]> {
  const { data, error } = await supabase
    .from("relationship_recommendation_dismissals")
    .select("person_id, recommendation_type, dismissed_until")
    .eq("owner_user_id", viewerId)
    .gt("dismissed_until", new Date().toISOString());
  if (error) return []; // fail-open on read: recommendations still truthful
  return (data ?? []).map((r: any) => {
    const row = r as Record<string, unknown>;
    return {
      personId: row.person_id as string,
      recommendationType: row.recommendation_type as string,
      dismissedUntil: row.dismissed_until as string,
    };
  });
}

/** Fail-closed single-pair edge: the accepted row IS the authorization. */
async function getAcceptedConnectionEdge(
  supabase: DB,
  viewerId: string,
  targetUserId: string,
): Promise<ConnectionEdge | null> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("id, responded_at, updated_at")
    .eq("status", "accepted")
    .or(
      `and(requester_user_id.eq.${viewerId},recipient_user_id.eq.${targetUserId}),` +
        `and(requester_user_id.eq.${targetUserId},recipient_user_id.eq.${viewerId})`,
    )
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    connectionId: row.id as string,
    counterpartUserId: targetUserId,
    connectedAt: (row.responded_at as string | null) ?? (row.updated_at as string),
  };
}

function buildDeps(supabase: DB): RelationshipIntelligenceDeps {
  return {
    listOldestConnections: (viewerId, limit) => listOldestConnections(supabase, viewerId, limit),
    listSavedCardEdges: (viewerId, limit) => listSavedCardEdges(supabase, viewerId, limit),
    listGuestEdges: (viewerId, limit) => listGuestEdges(supabase, viewerId, limit),
    listRecentMomentEdges: (viewerId, limit) => listRecentMomentEdges(supabase, viewerId, limit),
    resolveConnectionSummaries: (userIds) => resolveConnectionSummaries(supabase, userIds),
    listDismissals: (viewerId) => listDismissals(supabase, viewerId),
    getAcceptedConnectionEdge: (viewerId, targetUserId) =>
      getAcceptedConnectionEdge(supabase, viewerId, targetUserId),
    getSavedCardEdge: (viewerId, targetCardId) =>
      getSavedCardEdge(supabase, viewerId, targetCardId),
    getGuestEdge: (viewerId, guestId) => getGuestEdge(supabase, viewerId, guestId),
    wording: ({ locale, daysSinceLastInteraction }) =>
      generateRelationshipWording({ locale, daysSinceLastInteraction }),
    personalization: (viewerId) => getPersonalizationPolicy(supabase, viewerId),
  };
}

// ── Entry points (called by the thin server functions) ────────────────────

export async function getTodayRecommendations(
  supabase: DB,
  viewerId: string,
  locale: RelationshipWordingLocale,
): Promise<BcMobileTodayRecommendationsResult> {
  return composeTodayRecommendations(buildDeps(supabase), viewerId, locale);
}

export async function getPersonRecommendation(
  supabase: DB,
  viewerId: string,
  personId: string,
  locale: RelationshipWordingLocale,
): Promise<BcMobilePersonRecommendationResult> {
  return composePersonRecommendation(buildDeps(supabase), viewerId, personId, locale);
}

/** Dismiss = owner-scoped upsert snoozing (personId, type) for N days. */
export async function dismissRecommendation(
  supabase: DB,
  viewerId: string,
  personId: string,
  type: RelationshipRecommendationType,
): Promise<BcMobileDismissRecommendationResult> {
  const now = new Date();
  const until = new Date(
    now.getTime() + RELATIONSHIP_INTELLIGENCE_CONFIG.DISMISS_SNOOZE_DAYS * 86_400_000,
  );
  const { error } = await supabase.from("relationship_recommendation_dismissals").upsert(
    {
      owner_user_id: viewerId,
      person_id: personId,
      recommendation_type: type,
      dismissed_until: until.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "owner_user_id,person_id,recommendation_type" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}
