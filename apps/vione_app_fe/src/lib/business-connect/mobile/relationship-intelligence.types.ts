// BC-Mobile-6A — Relationship Intelligence domain types (client-safe).
//
// The wire DTO carries ONLY: the person (privacy-safe projection), the
// recommendation type, ONE reason (last meaningful interaction, day
// granularity), and optional AI wording. It NEVER carries: notes, tags,
// photos, OCR payloads, contact details, internal ids, scores, or
// probabilities. The UI renders reason/suggestion copy from i18n keys; the
// server never authors UI strings except validated AI wording.

import type { Lang } from "@/lib/i18n";

/** Canonical mobile person kinds (same identity model as 2C/2E/5E). */
export type BcMobileRelIntelPersonKind = "connection" | "saved_card" | "guest_contact";

/** Meaningful-interaction evidence kinds (origin timestamps + moments only). */
export type RelationshipEvidenceKind =
  | "connected"
  | "card_saved"
  | "contact_shared"
  | "card_scanned"
  | "moment";

/** Recency + volume configuration — transparent constants, no black boxes. */
export const RELATIONSHIP_INTELLIGENCE_CONFIG = Object.freeze({
  /** Reconnect surfaces when the last meaningful interaction is ≥ this. */
  RECONNECT_AFTER_DAYS: 45,
  /** Recent interactions (< this) suppress recommendations entirely. */
  RECENT_INTERACTION_SUPPRESS_DAYS: 7,
  /** Home shows at most this many recommendations. */
  MAX_HOME_RECOMMENDATIONS: 3,
  /** Bounded candidate pools (defense in depth on query size). */
  HOME_CANDIDATE_CONNECTIONS: 25,
  HOME_CANDIDATE_SAVED_CARDS: 50,
  HOME_CANDIDATE_GUESTS: 50,
  MOMENT_READ_WINDOW: 200,
  /** Dismissal snooze duration. */
  DISMISS_SNOOZE_DAYS: 7,
  /** AI wording hard timeout; any failure → deterministic fallback. */
  AI_WORDING_TIMEOUT_MS: 5000,
  AI_WORDING_ENABLED: true,
  /** Versioned prompt contract (bump on any prompt change). */
  AI_PROMPT_VERSION: "relationship-recommendation-v1",
});

export type RelationshipIntelligenceConfig = typeof RELATIONSHIP_INTELLIGENCE_CONFIG;

/** One timestamped meaningful interaction (timestamps only — never content). */
export type RelationshipEvidenceItem = {
  kind: RelationshipEvidenceKind;
  occurredAt: string;
};

/**
 * Derived relationship evidence for ONE person. Built from viewer-owned
 * edges only; contains timestamps and the person kind — nothing else.
 */
export type RelationshipEvidence = {
  personId: string;
  kind: BcMobileRelIntelPersonKind;
  relationshipStartedAt: string | null;
  lastMeaningfulInteraction: RelationshipEvidenceItem | null;
};

/** Deterministic signals derived from evidence (6A: recency only). */
export type RelationshipSignals = Readonly<{
  daysSinceLastInteraction: number | null;
}>;

/** The only recommendation type whose evidence contract ships in 6A. */
export type RelationshipRecommendationType = "reconnect";

/** Structured reason — the UI localizes it; the server sends numbers. */
export type RelationshipRecommendationReason = {
  kind: "last_interaction";
  days: number;
  evidenceKind: RelationshipEvidenceKind;
};

/** Privacy-safe person projection for a recommendation row. */
export type RelationshipRecommendationPerson = {
  personId: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  /** Canonical industry label when the source record carries one (saved cards). */
  industryLabel: string | null;
  /** Coarse area label derived from the canonical address (city/last segment). */
  areaLabel: string | null;
};

export type RelationshipRecommendation = {
  /** Deterministic id: `${personId}:${type}` (dismissal + React key). */
  id: string;
  person: RelationshipRecommendationPerson;
  type: RelationshipRecommendationType;
  reason: RelationshipRecommendationReason;
  /** Validated AI wording; null → UI uses the deterministic i18n template. */
  aiSuggestion: string | null;
  wordingSource: "deterministic" | "ai";
  generatedAt: string;
};

export type BcMobileTodayRecommendationsResult = {
  recommendations: RelationshipRecommendation[];
};

export type BcMobilePersonRecommendationResult = {
  recommendation: RelationshipRecommendation | null;
};

export type BcMobileDismissRecommendationResult = { ok: true };

/** Input locale for AI wording (matches the viewer's UI language). */
export type RelationshipWordingLocale = Lang;
