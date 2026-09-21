// RelationshipService — the single home for Business Relationship logic built on
// Saved Business Cards (BC-2.4). Orchestrates the repository + mappers; enforces
// invariants (owner = auth.uid(), no self-save, no profile duplication).
//
// This is the first layer of the Business Relationship Graph. It intentionally
// does NOT implement messaging, followers, feeds, CRM pipelines, or networking —
// only the persistent owner→card edge and its private metadata.
//
// Statically imports NO *.server module, so it is safe to import from
// *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapRowToRelationshipEvent, mapRowToSavedCard } from "./relationship.mappers";
import {
  RelationshipEventRepository,
  RelationshipRepository,
  updateByTarget,
} from "./relationship.repository";
import {
  buildSmartCollections,
  computeRelationshipScore,
  relationshipAgeDays,
} from "./relationship-intelligence";
import {
  REL_ERR,
  type RelationshipEvent,
  type RelationshipEventType,
  type RelationshipMetadataPatch,
  type RelationshipScore,
  type RelationshipTimeline,
  type SaveCardInput,
  type SavedCard,
  type SavedCardSource,
  type SmartCollection,
} from "./relationship.types";

const VALID_SOURCES: SavedCardSource[] = ["profile", "qr", "nfc", "url", "import"];

function cleanTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().slice(0, 40);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 20) break;
  }
  return out;
}

/** Read the target card's owner (owner_user_id) under the caller's RLS. */
async function targetOwner(
  supabase: SupabaseClient,
  targetCardId: string,
): Promise<{ exists: boolean; ownerUserId: string | null }> {
  const { data, error } = await supabase
    .from("member_business_cards")
    .select("id, owner_user_id")
    .eq("id", targetCardId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { exists: false, ownerUserId: null };
  return { exists: true, ownerUserId: (data as { owner_user_id: string | null }).owner_user_id };
}

/** Append a history event, swallowing errors so it never blocks the primary op. */
async function safeRecordEvent(
  supabase: SupabaseClient,
  userId: string,
  targetCardId: string,
  type: RelationshipEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await RelationshipEventRepository.insert(supabase, {
      owner_user_id: userId,
      target_card_id: targetCardId,
      event_type: type,
      metadata,
    });
  } catch {
    // History is best-effort; a failure here must not break the edge mutation.
  }
}

/** Count events by type for the deterministic score. */
function countByType(events: RelationshipEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  return counts;
}

export const RelationshipService = {
  /** Create (or return existing) a relationship edge owned by the caller. */
  async save(supabase: SupabaseClient, userId: string, input: SaveCardInput): Promise<SavedCard> {
    // Idempotent: if already saved, return the existing edge.
    const existing = await RelationshipRepository.findByTarget(
      supabase,
      userId,
      input.targetCardId,
    );
    if (existing) return mapRowToSavedCard(existing);

    // Target must be resolvable under the caller's RLS (i.e. public or theirs).
    const owner = await targetOwner(supabase, input.targetCardId);
    if (!owner.exists) throw new Error(REL_ERR.TARGET_NOT_FOUND);
    // You cannot save your own card as a relationship.
    if (owner.ownerUserId && owner.ownerUserId === userId) throw new Error(REL_ERR.SELF_SAVE);

    const source = VALID_SOURCES.includes(input.source as SavedCardSource)
      ? input.source
      : "profile";

    const row = await RelationshipRepository.insert(supabase, {
      owner_user_id: userId,
      target_card_id: input.targetCardId,
      source,
      favorite: input.favorite ?? false,
      tags: cleanTags(input.tags),
      notes: input.notes?.trim() ? input.notes.trim() : null,
    });
    // Append the first history event (best-effort; never blocks the save).
    await safeRecordEvent(supabase, userId, input.targetCardId, "saved", { source });
    return mapRowToSavedCard(row);
  },

  /** Remove a relationship edge by target card id. Returns whether one was removed. */
  async unsave(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<{ removed: boolean }> {
    const n = await RelationshipRepository.deleteByTarget(supabase, userId, targetCardId);
    return { removed: n > 0 };
  },

  /** Toggle/set the favorite flag on an edge. */
  async favorite(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    value: boolean,
  ): Promise<SavedCard> {
    const row = await updateByTarget(supabase, userId, targetCardId, { favorite: value });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    await safeRecordEvent(supabase, userId, targetCardId, "favorite", { value });
    return mapRowToSavedCard(row);
  },

  /** Replace the private tag set on an edge. */
  async tag(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    tags: string[],
  ): Promise<SavedCard> {
    const clean = cleanTags(tags);
    const row = await updateByTarget(supabase, userId, targetCardId, { tags: clean });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    await safeRecordEvent(supabase, userId, targetCardId, "tag_updated", { count: clean.length });
    return mapRowToSavedCard(row);
  },

  /** Set the private note on an edge. */
  async note(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    notes: string | null,
  ): Promise<SavedCard> {
    const clean = notes?.trim() ? notes.trim().slice(0, 4000) : null;
    const row = await updateByTarget(supabase, userId, targetCardId, { notes: clean });
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    await safeRecordEvent(supabase, userId, targetCardId, "note_edited", {});
    return mapRowToSavedCard(row);
  },

  /** Patch any owner-only relationship metadata (tags/notes/first-met/met-at/reminder). */
  async updateMetadata(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    patch: RelationshipMetadataPatch,
  ): Promise<SavedCard> {
    const p: Record<string, unknown> = {};
    const str = (v: string | null | undefined, max: number) =>
      v?.trim() ? v.trim().slice(0, max) : null;
    if (patch.favorite !== undefined) p.favorite = patch.favorite;
    if (patch.tags !== undefined) p.tags = cleanTags(patch.tags);
    if (patch.notes !== undefined) p.notes = str(patch.notes, 4000);
    if (patch.firstMetAt !== undefined) p.first_met_at = patch.firstMetAt || null;
    if (patch.metAt !== undefined) p.met_at = str(patch.metAt, 200);
    if (patch.reminderAt !== undefined) p.reminder_at = patch.reminderAt || null;
    if (patch.company !== undefined) p.company = str(patch.company, 200);
    if (patch.industry !== undefined) p.industry = str(patch.industry, 120);
    if (patch.interest !== undefined) p.interest = str(patch.interest, 500);
    if (patch.meetingPlace !== undefined) p.meeting_place = str(patch.meetingPlace, 200);
    if (patch.event !== undefined) p.event = str(patch.event, 200);
    if (patch.referral !== undefined) p.referral = str(patch.referral, 200);
    if (patch.importance !== undefined)
      p.importance = Math.max(0, Math.min(5, Math.floor(patch.importance)));
    if (patch.labels !== undefined) p.labels = cleanTags(patch.labels);
    if (patch.color !== undefined) p.color = str(patch.color, 40);
    if (patch.priority !== undefined) p.priority = str(patch.priority, 40);
    if (patch.birthday !== undefined) p.birthday = patch.birthday || null;
    if (patch.anniversary !== undefined) p.anniversary = patch.anniversary || null;
    if (patch.companyId !== undefined) p.company_id = patch.companyId || null;
    const row = await updateByTarget(supabase, userId, targetCardId, p);
    if (!row) throw new Error(REL_ERR.NOT_FOUND);
    await safeRecordEvent(supabase, userId, targetCardId, "metadata_updated", {
      keys: Object.keys(p),
    });
    return mapRowToSavedCard(row);
  },

  /** All of the caller's saved relationships (newest first). */
  async list(supabase: SupabaseClient, userId: string): Promise<SavedCard[]> {
    const rows = await RelationshipRepository.listByOwner(supabase, userId);
    return rows.map(mapRowToSavedCard);
  },

  /** Whether the caller has saved a specific target card. */
  async exists(supabase: SupabaseClient, userId: string, targetCardId: string): Promise<boolean> {
    return RelationshipRepository.existsByTarget(supabase, userId, targetCardId);
  },

  // ── BC-2.5 intelligence ─────────────────────────────────────────────────────

  /**
   * Append an interaction event to the relationship history and refresh the
   * matching timeline column (viewed → last_viewed_at, contact → last_contact_at,
   * scan/qr/nfc → last_scan_at). Owner-scoped; a missing edge is a no-op error.
   */
  async recordEvent(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
    type: RelationshipEventType,
    metadata: Record<string, unknown> = {},
  ): Promise<RelationshipEvent> {
    // Edge must exist and belong to the caller.
    const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    if (!edge) throw new Error(REL_ERR.NOT_FOUND);

    const row = await RelationshipEventRepository.insert(supabase, {
      owner_user_id: userId,
      target_card_id: targetCardId,
      event_type: type,
      metadata,
    });

    const nowIso = new Date().toISOString();
    const touch: Record<string, unknown> = {};
    if (type === "viewed") touch.last_viewed_at = nowIso;
    else if (type === "contact") touch.last_contact_at = nowIso;
    else if (type === "scan" || type === "qr" || type === "nfc") touch.last_scan_at = nowIso;
    if (Object.keys(touch).length > 0) {
      await updateByTarget(supabase, userId, targetCardId, touch);
    }

    return mapRowToRelationshipEvent(row);
  },

  /** Full history (newest first) for one relationship or the whole graph. */
  async history(
    supabase: SupabaseClient,
    userId: string,
    targetCardId?: string,
  ): Promise<RelationshipEvent[]> {
    const rows = targetCardId
      ? await RelationshipEventRepository.listByTarget(supabase, userId, targetCardId)
      : await RelationshipEventRepository.listByOwner(supabase, userId);
    return rows.map(mapRowToRelationshipEvent);
  },

  /** Derived timeline for a single relationship (edge timestamps + events). */
  async timeline(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<RelationshipTimeline> {
    const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    if (!edge) throw new Error(REL_ERR.NOT_FOUND);
    const card = mapRowToSavedCard(edge);
    const events = (
      await RelationshipEventRepository.listByTarget(supabase, userId, targetCardId)
    ).map(mapRowToRelationshipEvent);
    return {
      targetCardId,
      firstSavedAt: card.savedAt,
      lastViewedAt: card.lastViewedAt,
      lastContactAt: card.lastContactAt,
      lastScanAt: card.lastScanAt,
      relationshipAgeDays: relationshipAgeDays(card.savedAt),
      source: card.source,
      events,
    };
  },

  /** Dynamic smart collections over the caller's saved cards (derived on read). */
  async collections(supabase: SupabaseClient, userId: string): Promise<SmartCollection[]> {
    const cards = await this.list(supabase, userId);
    return buildSmartCollections(cards);
  },

  /**
   * Deterministic relationship score for a single relationship. Combines edge
   * state (favorite/notes/tags/importance) with counted history events. No AI.
   */
  async relationshipScore(
    supabase: SupabaseClient,
    userId: string,
    targetCardId: string,
  ): Promise<RelationshipScore> {
    const edge = await RelationshipRepository.findByTarget(supabase, userId, targetCardId);
    if (!edge) throw new Error(REL_ERR.NOT_FOUND);
    const card = mapRowToSavedCard(edge);
    const events = (
      await RelationshipEventRepository.listByTarget(supabase, userId, targetCardId)
    ).map(mapRowToRelationshipEvent);
    const c = countByType(events);
    // BC-2.6 — factor in recorded business interactions (owner-scoped count).
    const { BusinessInteractionService } = await import("./interaction.service");
    const interactionCount = await BusinessInteractionService.count(supabase, userId, card.id);
    return computeRelationshipScore({
      saved: true,
      favorite: card.favorite,
      hasNotes: Boolean(card.notes),
      viewCount: c.viewed ?? 0,
      shareCount: c.shared ?? 0,
      meetingCount: c.meeting ?? 0,
      qrCount: c.qr ?? 0,
      nfcCount: c.nfc ?? 0,
      walletCount: c.wallet ?? 0,
      tagCount: card.tags.length,
      importance: card.importance,
      interactionCount,
    });
  },
};
