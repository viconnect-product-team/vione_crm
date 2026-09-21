// BC-9.1 Turn A — Pure memory policy: canonical keys, confidence, merge,
// lifecycle transitions, and visibility gating.
//
// This module is IO-free and deterministic. Runtime services (Turn B) will
// call these functions; Turn A ships them so every rule is unit-testable.

import {
  RELATIONSHIP_MEMORY_TERMINAL_STATUSES,
  type RelationshipMemoryKind,
  type RelationshipMemorySensitivity,
  type RelationshipMemoryStatus,
} from "./registry";
import { RelationshipMemoryError } from "./errors";
import type { RelationshipMemoryDTO } from "./types";

/** Canonical key for dedupe: lowercase, whitespace-collapsed, punctuation-stripped. */
export function canonicalKey(kind: RelationshipMemoryKind, rawValue: string): string {
  const norm = rawValue
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${kind}:${norm}`;
}

/** Bound a confidence to [0, 1] and round to 3 decimals (matches DB precision). */
export function clampConfidence(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  const bounded = Math.min(1, Math.max(0, value));
  return Math.round(bounded * 1000) / 1000;
}

/**
 * Confidence update on a new corroborating observation. Deterministic and
 * monotonic-with-diminishing-returns. `sourceWeight` is 0..1.
 */
export function bumpConfidenceOnCorroboration(current: number, sourceWeight: number): number {
  const c = clampConfidence(current);
  const w = clampConfidence(sourceWeight);
  // Bayesian-ish: gap shrinks by w/2 of the remaining distance to 1.
  return clampConfidence(c + (1 - c) * (w / 2));
}

/** Confidence decay on contradictory observation. */
export function decayConfidenceOnContradiction(current: number, sourceWeight: number): number {
  const c = clampConfidence(current);
  const w = clampConfidence(sourceWeight);
  return clampConfidence(c - c * (w / 2));
}

/** Legal lifecycle transitions. */
const TRANSITIONS: Readonly<
  Record<RelationshipMemoryStatus, ReadonlyArray<RelationshipMemoryStatus>>
> = Object.freeze({
  candidate: ["active", "dismissed", "expired"],
  active: ["superseded", "dismissed", "expired"],
  superseded: ["dismissed"],
  dismissed: [],
  expired: [],
});

export function canTransition(
  from: RelationshipMemoryStatus,
  to: RelationshipMemoryStatus,
): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(
  from: RelationshipMemoryStatus,
  to: RelationshipMemoryStatus,
): void {
  if (RELATIONSHIP_MEMORY_TERMINAL_STATUSES.includes(from)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_TERMINAL_STATUS",
      `Memory in terminal status '${from}' cannot transition.`,
      { from, to },
    );
  }
  if (!canTransition(from, to)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_INVALID_TRANSITION",
      `Illegal transition ${from} → ${to}.`,
      { from, to },
    );
  }
}

/** Merge policy: prefer the higher-confidence memory; keep the older `firstObservedAt`
 *  and the newer `lastObservedAt`. Deterministic. */
export function mergeMemories(
  a: RelationshipMemoryDTO,
  b: RelationshipMemoryDTO,
): RelationshipMemoryDTO {
  if (a.canonicalKey !== b.canonicalKey || a.kind !== b.kind) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_INVALID_INPUT",
      "Cannot merge memories with different canonical keys or kinds.",
    );
  }
  const primary = a.confidence >= b.confidence ? a : b;
  const secondary = primary === a ? b : a;
  const merged: RelationshipMemoryDTO = {
    ...primary,
    canonicalValue: { ...secondary.canonicalValue, ...primary.canonicalValue },
    confidence: clampConfidence(
      primary.confidence + (1 - primary.confidence) * (secondary.confidence / 2),
    ),
    sourceCount: primary.sourceCount + secondary.sourceCount,
    firstObservedAt:
      new Date(a.firstObservedAt) <= new Date(b.firstObservedAt)
        ? a.firstObservedAt
        : b.firstObservedAt,
    lastObservedAt:
      new Date(a.lastObservedAt) >= new Date(b.lastObservedAt)
        ? a.lastObservedAt
        : b.lastObservedAt,
    // Highest sensitivity wins (never lower).
    sensitivity: maxSensitivity(a.sensitivity, b.sensitivity),
  };
  return merged;
}

const SENSITIVITY_ORDER: Record<RelationshipMemorySensitivity, number> = {
  public_ok: 0,
  standard: 1,
  sensitive: 2,
  restricted: 3,
};

export function maxSensitivity(
  x: RelationshipMemorySensitivity,
  y: RelationshipMemorySensitivity,
): RelationshipMemorySensitivity {
  return SENSITIVITY_ORDER[x] >= SENSITIVITY_ORDER[y] ? x : y;
}

/**
 * Visibility for downstream AI context builders (BC-9.0). A memory is visible
 * when it is `active` AND its sensitivity does not exceed the requested tier.
 * `candidate` and terminal statuses are NEVER surfaced to intelligence prompts.
 */
export function isMemoryVisibleToIntelligence(
  memory: Pick<RelationshipMemoryDTO, "status" | "sensitivity">,
  allowedMaxSensitivity: RelationshipMemorySensitivity = "standard",
): boolean {
  if (memory.status !== "active") return false;
  return SENSITIVITY_ORDER[memory.sensitivity] <= SENSITIVITY_ORDER[allowedMaxSensitivity];
}

/** Coarse conflict detector on canonical values (shallow shape mismatch). */
export function detectShallowConflict(
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
): boolean {
  for (const k of Object.keys(a)) {
    if (k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) return true;
  }
  return false;
}
