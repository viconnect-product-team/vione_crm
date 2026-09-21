// BC-Mobile-6A — Deterministic Relationship Intelligence engine.
//
// PURE module: no I/O, no Supabase, no AI, no randomness. Given evidence +
// dismissals + a clock, it derives signals and selects/ranks reconnect
// candidates. Same inputs ⇒ same outputs (tests pin this). AI never decides
// ranking — it may only rephrase wording downstream.

import type {
  BcMobileRelIntelPersonKind,
  RelationshipEvidence,
  RelationshipEvidenceItem,
  RelationshipEvidenceKind,
  RelationshipIntelligenceConfig,
  RelationshipSignals,
} from "./relationship-intelligence.types";

const MS_PER_DAY = 86_400_000;

/** Whole days elapsed since an ISO timestamp. Future/bad input is clamped. */
export function daysSince(iso: string, nowMs: number): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / MS_PER_DAY));
}

/** Signals are derived ONLY from the last meaningful interaction. */
export function deriveSignals(evidence: RelationshipEvidence, nowMs: number): RelationshipSignals {
  const last = evidence.lastMeaningfulInteraction;
  return {
    daysSinceLastInteraction: last ? daysSince(last.occurredAt, nowMs) : null,
  };
}

/** Active dismissal (snooze) record read from the owner-scoped table. */
export type RelationshipDismissal = {
  personId: string;
  recommendationType: string;
  dismissedUntil: string;
};

/** A dismissal suppresses ONLY its exact (person, type) pair, until expiry. */
export function isDismissed(
  dismissals: readonly RelationshipDismissal[],
  personId: string,
  type: string,
  nowMs: number,
): boolean {
  return dismissals.some(
    (d) =>
      d.personId === personId &&
      d.recommendationType === type &&
      Date.parse(d.dismissedUntil) > nowMs,
  );
}

/** A selected reconnect candidate (pre-display-data, pre-wording). */
export type ReconnectCandidate = {
  personId: string;
  kind: BcMobileRelIntelPersonKind;
  days: number;
  evidenceKind: RelationshipEvidenceKind;
};

/**
 * Reconnect selection — all guards must pass:
 *  1. evidence exists (NO last meaningful interaction → no recommendation),
 *  2. recent-interaction suppression (< RECENT_INTERACTION_SUPPRESS_DAYS),
 *  3. staleness threshold (≥ RECONNECT_AFTER_DAYS),
 *  4. active dismissal suppresses.
 */
export function selectReconnectCandidate(
  evidence: RelationshipEvidence,
  dismissals: readonly RelationshipDismissal[],
  nowMs: number,
  config: RelationshipIntelligenceConfig,
): ReconnectCandidate | null {
  const last = evidence.lastMeaningfulInteraction;
  if (!last) return null; // unknown/incomplete data ⇒ stay silent
  const days = daysSince(last.occurredAt, nowMs);
  if (days === null) return null;
  if (days < config.RECENT_INTERACTION_SUPPRESS_DAYS) return null;
  if (days < config.RECONNECT_AFTER_DAYS) return null;
  if (isDismissed(dismissals, evidence.personId, "reconnect", nowMs)) return null;
  return {
    personId: evidence.personId,
    kind: evidence.kind,
    days,
    evidenceKind: last.kind,
  };
}

/** Deterministic ranking: staleness DESC, tie → personId ASC (stable). */
export function rankReconnectCandidates<T extends ReconnectCandidate>(
  candidates: readonly T[],
): T[] {
  return [...candidates].sort((a, b) => b.days - a.days || (a.personId < b.personId ? -1 : 1));
}

const ORIGIN_KIND_BY_PERSON: Record<BcMobileRelIntelPersonKind, RelationshipEvidenceKind> = {
  connection: "connected",
  saved_card: "card_saved",
  guest_contact: "contact_shared",
};

/** Input for evidence building — already viewer-authorized, minimal fields. */
export type RelationshipEdgeInput = {
  personId: string;
  kind: BcMobileRelIntelPersonKind;
  /** Canonical origin timestamp: connectedAt | savedAt | firstSharedAt. */
  startedAt: string | null;
  /** Source detail for guest origins (e.g. card scan → card_scanned). */
  originSource?: string | null;
  /** Latest moment timestamp for this person (null = none in window). */
  latestMomentAt: string | null;
};

function validItem(item: RelationshipEvidenceItem): boolean {
  return Number.isFinite(Date.parse(item.occurredAt));
}

/**
 * Build the evidence object for one person from edge timestamps ONLY.
 * The last meaningful interaction = max(origin, latest moment). No note,
 * photo, or free-text field can enter this structure by construction.
 */
export function buildEvidence(input: RelationshipEdgeInput): RelationshipEvidence {
  const items: RelationshipEvidenceItem[] = [];
  if (input.startedAt) {
    const originKind =
      input.kind === "guest_contact" && input.originSource === "card_scan"
        ? "card_scanned"
        : ORIGIN_KIND_BY_PERSON[input.kind];
    items.push({ kind: originKind, occurredAt: input.startedAt });
  }
  if (input.latestMomentAt) {
    items.push({ kind: "moment", occurredAt: input.latestMomentAt });
  }
  const last =
    items
      .filter(validItem)
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0] ?? null;
  return {
    personId: input.personId,
    kind: input.kind,
    relationshipStartedAt: input.startedAt,
    lastMeaningfulInteraction: last,
  };
}

/** Latest moment timestamp per person from a bounded owner-scoped window. */
export function latestMomentByPerson(
  moments: readonly { personId: string; occurredAt: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of moments) {
    if (!Number.isFinite(Date.parse(m.occurredAt))) continue;
    const existing = map.get(m.personId);
    if (!existing || Date.parse(m.occurredAt) > Date.parse(existing)) {
      map.set(m.personId, m.occurredAt);
    }
  }
  return map;
}
