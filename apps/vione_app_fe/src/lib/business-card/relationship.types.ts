// BC-2.4 — Business Relationship model (Saved Business Cards).
//
// A Saved Card is NOT a bookmark and NOT a copy of a profile. It is a
// RELATIONSHIP EDGE from the owner (auth.uid()) to a target Business Card,
// enriched with owner-only PRIVATE metadata (favorite, tags, notes, first-met,
// met-at, reminder, source). Profile data is NEVER duplicated or snapshotted —
// the linked card summary is always resolved live via target_card_id and stays
// subject to the card's own visibility/RLS.
//
// This is the first layer of the Business Relationship Graph. Downstream phases
// (relationship strength, networking, meetings, CRM, community, AI, analytics,
// affiliate) build ON this edge — none are implemented here.

import type { CardKind, CardStatus, PublicMode } from "./business-card.types";

/** How a relationship edge was created. */
export type SavedCardSource = "profile" | "qr" | "nfc" | "url" | "import";

export const SAVED_CARD_SOURCES: SavedCardSource[] = ["profile", "qr", "nfc", "url", "import"];

/** Live (non-duplicated) summary of the target card, resolved via RLS. */
export type SavedCardTarget = {
  cardId: string;
  slug: string;
  cardKind: CardKind;
  status: CardStatus;
  publicMode: PublicMode;
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  /** True when the linked card is no longer publicly resolvable (privacy/removal). */
  unavailable: boolean;
};

/** A saved relationship edge with owner-only private metadata + live target. */
export type SavedCard = {
  id: string;
  targetCardId: string;
  savedAt: string;
  favorite: boolean;
  tags: string[];
  notes: string | null;
  firstMetAt: string | null;
  metAt: string | null;
  reminderAt: string | null;
  source: SavedCardSource;
  createdAt: string;
  updatedAt: string;
  // ── BC-2.5 timeline (private) ──────────────────────────────────────────────
  lastViewedAt: string | null;
  lastContactAt: string | null;
  lastScanAt: string | null;
  // ── BC-2.5 intelligence metadata (private) ─────────────────────────────────
  company: string | null;
  industry: string | null;
  interest: string | null;
  meetingPlace: string | null;
  event: string | null;
  referral: string | null;
  importance: number;
  labels: string[];
  color: string | null;
  priority: string | null;
  birthday: string | null;
  anniversary: string | null;
  /** Optional link to a first-class Company entity (BC-2.7). */
  companyId: string | null;
  // ── BC-3.0 organization ──────────────────────────────────────────────────
  /** Collection this saved card belongs to (null = uncategorized/Default). */
  collectionId: string | null;
  /** Archived edges are hidden from the default list but never deleted. */
  archived: boolean;
  /** Last time the owner opened this saved card (drives Recent/Frequent). */
  lastOpened: string | null;
  /** Live profile summary (null-filled + unavailable=true when not resolvable). */
  target: SavedCardTarget;
};

/** Input to create a relationship edge. Only the target + source/tags/notes. */
export type SaveCardInput = {
  targetCardId: string;
  source?: SavedCardSource;
  tags?: string[];
  notes?: string | null;
  favorite?: boolean;
};

/** Owner-only metadata patch. Every field optional; only provided keys change. */
export type RelationshipMetadataPatch = {
  favorite?: boolean;
  tags?: string[];
  notes?: string | null;
  firstMetAt?: string | null;
  metAt?: string | null;
  reminderAt?: string | null;
  // ── BC-2.5 intelligence metadata ───────────────────────────────────────────
  company?: string | null;
  industry?: string | null;
  interest?: string | null;
  meetingPlace?: string | null;
  event?: string | null;
  referral?: string | null;
  importance?: number;
  labels?: string[];
  color?: string | null;
  priority?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  // ── BC-2.7 optional company reference ──────────────────────────────────────
  companyId?: string | null;
};

// ── BC-2.5 Relationship history / timeline ────────────────────────────────────

/** Discrete relationship history event types (append-only, owner-scoped). */
export type RelationshipEventType =
  | "saved"
  | "viewed"
  | "shared"
  | "contact"
  | "scan"
  | "meeting"
  | "wallet"
  | "qr"
  | "nfc"
  | "tag_updated"
  | "favorite"
  | "note_edited"
  | "metadata_updated";

export const RELATIONSHIP_EVENT_TYPES: RelationshipEventType[] = [
  "saved",
  "viewed",
  "shared",
  "contact",
  "scan",
  "meeting",
  "wallet",
  "qr",
  "nfc",
  "tag_updated",
  "favorite",
  "note_edited",
  "metadata_updated",
];

/** JSON-serializable value (safe across the server-fn RPC boundary). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** A single history record on the owner→card relationship. */
export type RelationshipEvent = {
  id: string;
  targetCardId: string;
  type: RelationshipEventType;
  metadata: Record<string, JsonValue>;
  createdAt: string;
};

/** Timeline snapshot for a single relationship (derived, not stored). */
export type RelationshipTimeline = {
  targetCardId: string;
  firstSavedAt: string | null;
  lastViewedAt: string | null;
  lastContactAt: string | null;
  lastScanAt: string | null;
  relationshipAgeDays: number;
  source: SavedCardSource;
  events: RelationshipEvent[];
};

// ── BC-2.5 Relationship score (deterministic, no AI) ──────────────────────────

/** Raw signals feeding the deterministic score. */
export type RelationshipScoreSignals = {
  saved: boolean;
  favorite: boolean;
  hasNotes: boolean;
  viewCount: number;
  shareCount: number;
  meetingCount: number;
  qrCount: number;
  nfcCount: number;
  walletCount: number;
  tagCount: number;
  importance: number;
  /** BC-2.6 — count of recorded business interactions on this relationship. */
  interactionCount?: number;
};

/** Deterministic 0–100 score + explainable breakdown. */
export type RelationshipScore = {
  value: number;
  tier: "dormant" | "new" | "active" | "strong";
  breakdown: Record<string, number>;
};

// ── BC-2.5 Smart collections (dynamic, derived) ───────────────────────────────

export type SmartCollectionKind =
  | "recent"
  | "favorites"
  | "nearby"
  | "association"
  | "industry"
  | "country"
  | "tags"
  | "aiSuggested";

/** A dynamic grouping of saved cards; derived on read, never persisted. */
export type SmartCollection = {
  id: string;
  kind: SmartCollectionKind;
  label: string;
  count: number;
  cardIds: string[];
};

export const REL_ERR = {
  NOT_FOUND: "REL_NOT_FOUND",
  SELF_SAVE: "REL_SELF_SAVE",
  TARGET_NOT_FOUND: "REL_TARGET_NOT_FOUND",
} as const;
