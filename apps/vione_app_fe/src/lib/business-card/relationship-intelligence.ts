// BC-2.5 — Relationship Intelligence Engine (PURE).
//
// Deterministic, dependency-free logic for the relationship graph: relationship
// age, deterministic relationship score, and smart collection grouping. No AI,
// no supabase, no window — every function here is pure and unit-testable.
//
// This module adds INTELLIGENCE ONLY. It does not duplicate profile data, does
// not message, and does not implement CRM/community/marketplace. Downstream
// intelligence phases (networking, AI, affiliate, meetings) build on these
// primitives; none are implemented here.

import type {
  RelationshipScore,
  RelationshipScoreSignals,
  SavedCard,
  SmartCollection,
  SmartCollectionKind,
} from "./relationship.types";

// ── Relationship age ────────────────────────────────────────────────────────

/** Whole days between two ISO timestamps (>= 0). `now` defaults to Date.now(). */
export function relationshipAgeDays(savedAt: string, now: number = Date.now()): number {
  const start = Date.parse(savedAt);
  if (Number.isNaN(start)) return 0;
  const diff = now - start;
  return diff <= 0 ? 0 : Math.floor(diff / 86_400_000);
}

// ── Deterministic relationship score ────────────────────────────────────────
//
// Simple, transparent, deterministic weighting. NO machine learning. The score
// is a bounded 0–100 integer so downstream surfaces can rank without guessing
// at a scale. Weights are intentionally small and additive.

const SCORE_WEIGHTS = {
  saved: 8, // the edge itself exists
  favorite: 12,
  view: 3, // per view, capped
  share: 6, // per share, capped
  meeting: 15, // per meeting, capped
  qr: 4, // per QR scan, capped
  nfc: 4, // per NFC tap, capped
  wallet: 5, // per wallet event, capped
  note: 6, // has a private note
  tag: 2, // per tag, capped
  importance: 4, // per importance point (0–5)
  interaction: 6, // BC-2.6 — per recorded business interaction, capped
} as const;

const SCORE_CAPS = {
  view: 5,
  share: 4,
  meeting: 3,
  qr: 4,
  nfc: 4,
  wallet: 3,
  tag: 5,
  interaction: 6,
} as const;

function cap(n: number, max: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), max);
}

/** Deterministic 0–100 relationship score with an explainable breakdown. */
export function computeRelationshipScore(signals: RelationshipScoreSignals): RelationshipScore {
  const breakdown: Record<string, number> = {};
  let raw = 0;

  const add = (key: string, value: number) => {
    if (value > 0) {
      breakdown[key] = value;
      raw += value;
    }
  };

  add("saved", signals.saved ? SCORE_WEIGHTS.saved : 0);
  add("favorite", signals.favorite ? SCORE_WEIGHTS.favorite : 0);
  add("note", signals.hasNotes ? SCORE_WEIGHTS.note : 0);
  add("view", cap(signals.viewCount, SCORE_CAPS.view) * SCORE_WEIGHTS.view);
  add("share", cap(signals.shareCount, SCORE_CAPS.share) * SCORE_WEIGHTS.share);
  add("meeting", cap(signals.meetingCount, SCORE_CAPS.meeting) * SCORE_WEIGHTS.meeting);
  add("qr", cap(signals.qrCount, SCORE_CAPS.qr) * SCORE_WEIGHTS.qr);
  add("nfc", cap(signals.nfcCount, SCORE_CAPS.nfc) * SCORE_WEIGHTS.nfc);
  add("wallet", cap(signals.walletCount, SCORE_CAPS.wallet) * SCORE_WEIGHTS.wallet);
  add("tag", cap(signals.tagCount, SCORE_CAPS.tag) * SCORE_WEIGHTS.tag);
  add("importance", cap(signals.importance, 5) * SCORE_WEIGHTS.importance);
  add(
    "interaction",
    cap(signals.interactionCount ?? 0, SCORE_CAPS.interaction) * SCORE_WEIGHTS.interaction,
  );

  const value = Math.max(0, Math.min(100, raw));
  const tier: RelationshipScore["tier"] =
    value >= 70 ? "strong" : value >= 35 ? "active" : value > 0 ? "new" : "dormant";

  return { value, tier, breakdown };
}

// ── Smart collections ───────────────────────────────────────────────────────
//
// Dynamic, deterministic groupings over the owner's saved cards. No persistence:
// collections are derived on read. "nearby" and "aiSuggested" are architecture
// placeholders (empty for now) to keep future phases additive.

const RECENT_WINDOW_DAYS = 30;

function push(map: Map<string, string[]>, key: string, id: string) {
  const arr = map.get(key);
  if (arr) arr.push(id);
  else map.set(key, [id]);
}

/** Build dynamic smart collections from the owner's saved cards. */
export function buildSmartCollections(
  cards: SavedCard[],
  now: number = Date.now(),
): SmartCollection[] {
  const collections: SmartCollection[] = [];
  const make = (
    id: string,
    kind: SmartCollectionKind,
    label: string,
    ids: string[],
  ): SmartCollection => ({ id, kind, label, count: ids.length, cardIds: ids });

  // Recent (saved within the window).
  const recent = cards
    .filter((c) => relationshipAgeDays(c.savedAt, now) <= RECENT_WINDOW_DAYS)
    .map((c: any) => c.id);
  collections.push(make("recent", "recent", "recent", recent));

  // Favorites.
  const favorites = cards.filter((c) => c.favorite).map((c: any) => c.id);
  collections.push(make("favorites", "favorites", "favorites", favorites));

  // By industry (private metadata first, else target unavailable → skip).
  const byIndustry = new Map<string, string[]>();
  for (const c of cards) {
    const industry = c.industry?.trim();
    if (industry) push(byIndustry, industry.toLowerCase(), c.id);
  }
  for (const [key, ids] of byIndustry) {
    collections.push(make(`industry:${key}`, "industry", key, ids));
  }

  // By tag.
  const byTag = new Map<string, string[]>();
  for (const c of cards) for (const tag of c.tags) push(byTag, tag.toLowerCase(), c.id);
  for (const [key, ids] of byTag) {
    collections.push(make(`tag:${key}`, "tags", key, ids));
  }

  // Architecture placeholders (future phases). Always present, empty for now.
  collections.push(make("nearby", "nearby", "nearby", []));
  collections.push(make("aiSuggested", "aiSuggested", "aiSuggested", []));

  return collections;
}
