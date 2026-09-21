// Pure row → DTO mapping for the relationship (saved cards) domain.
// No supabase, no window — deterministic and unit-testable.

import type { CardKind, CardStatus, PublicMode } from "./business-card.types";
import {
  SAVED_CARD_SOURCES,
  type SavedCard,
  type SavedCardSource,
  type SavedCardTarget,
} from "./relationship.types";

function normalizeSource(v: unknown): SavedCardSource {
  return SAVED_CARD_SOURCES.includes(v as SavedCardSource) ? (v as SavedCardSource) : "profile";
}

function mapTarget(targetCardId: string, embed: unknown): SavedCardTarget {
  // PostgREST returns the embed as an object (or null when RLS hides the row).
  const t = (Array.isArray(embed) ? embed[0] : embed) as Record<string, unknown> | null;
  if (!t) {
    return {
      cardId: targetCardId,
      slug: "",
      cardKind: "primary",
      status: "hidden",
      publicMode: "private",
      displayName: null,
      professionalTitle: null,
      companyName: null,
      avatarUrl: null,
      unavailable: true,
    };
  }
  return {
    cardId: (t.id as string) ?? targetCardId,
    slug: (t.slug as string) ?? "",
    cardKind: (t.card_kind as CardKind) ?? "primary",
    status: (t.status as CardStatus) ?? "hidden",
    publicMode: (t.public_mode as PublicMode) ?? "private",
    displayName: (t.display_name as string) ?? null,
    professionalTitle: (t.professional_title as string) ?? null,
    companyName: (t.company_name as string) ?? null,
    avatarUrl: (t.avatar_url as string) ?? null,
    unavailable: false,
  };
}

/** Map a saved_business_cards row (+ embedded target) to a SavedCard DTO. */
export function mapRowToSavedCard(row: Record<string, unknown>): SavedCard {
  const targetCardId = row.target_card_id as string;
  return {
    id: row.id as string,
    targetCardId,
    savedAt: row.saved_at as string,
    favorite: Boolean(row.favorite),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    notes: (row.notes as string) ?? null,
    firstMetAt: (row.first_met_at as string) ?? null,
    metAt: (row.met_at as string) ?? null,
    reminderAt: (row.reminder_at as string) ?? null,
    source: normalizeSource(row.source),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastViewedAt: (row.last_viewed_at as string) ?? null,
    lastContactAt: (row.last_contact_at as string) ?? null,
    lastScanAt: (row.last_scan_at as string) ?? null,
    company: (row.company as string) ?? null,
    companyId: (row.company_id as string) ?? null,
    industry: (row.industry as string) ?? null,
    interest: (row.interest as string) ?? null,
    meetingPlace: (row.meeting_place as string) ?? null,
    event: (row.event as string) ?? null,
    referral: (row.referral as string) ?? null,
    importance: typeof row.importance === "number" ? row.importance : 0,
    labels: Array.isArray(row.labels) ? (row.labels as string[]) : [],
    color: (row.color as string) ?? null,
    priority: (row.priority as string) ?? null,
    birthday: (row.birthday as string) ?? null,
    anniversary: (row.anniversary as string) ?? null,
    collectionId: (row.collection_id as string) ?? null,
    archived: Boolean(row.archived),
    lastOpened: (row.last_opened as string) ?? null,
    target: mapTarget(targetCardId, row.target),
  };
}

/** Map a relationship_events row to a RelationshipEvent DTO. */
export function mapRowToRelationshipEvent(
  row: Record<string, unknown>,
): import("./relationship.types").RelationshipEvent {
  return {
    id: row.id as string,
    targetCardId: row.target_card_id as string,
    type: row.event_type as import("./relationship.types").RelationshipEventType,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, import("./relationship.types").JsonValue>)
        : {},
    createdAt: row.created_at as string,
  };
}
