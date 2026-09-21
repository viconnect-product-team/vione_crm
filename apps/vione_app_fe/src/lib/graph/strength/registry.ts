// BC-4.3 — Relationship Strength Engine v1 — Contribution registry (FROZEN).
// Only signals declared here contribute. Changing weights, decay, or caps
// REQUIRES a new RELATIONSHIP_STRENGTH_VERSION.

import type { StrengthCategory, StrengthSignalKind } from "./types";

export type DecayModel = "none" | "exponential" | "linear" | "step";
export type FrequencyModel = "single" | "capped_log";
export type Directionality = "symmetric" | "directional";

export interface StrengthContribution {
  contributes: true;
  signalKind: StrengthSignalKind;
  category: StrengthCategory;
  /** Contribution ceiling before category & global caps. 0..1. */
  baseWeight: number;
  /** How repeated events grow. */
  frequencyModel: FrequencyModel;
  /** Diminishing-returns cap on effective count (single = ignored). */
  frequencyCap: number;
  /** Recency decay model. */
  decayModel: DecayModel;
  /** Half-life in days for exponential; window for linear/step. */
  decayHalfLifeDays?: number;
  /** Minimum residual factor after decay (0..1). */
  minResidual: number;
  /** Direction semantics. */
  directionality: Directionality;
  /** +1 or -1. v1 uses only +1; negative contributions deferred. */
  sign: 1 | -1;
  /** Absolute per-signal cap on cappedContribution (0..1). */
  perSignalCap: number;
  /** i18n key for user-visible explanation. */
  explanationKey: string;
}

// Frozen v1 registry. Alphabetized by signal kind for determinism.
const REGISTRY: readonly StrengthContribution[] = Object.freeze([
  {
    contributes: true,
    signalKind: "CONNECTED_TO",
    category: "direct_connection",
    baseWeight: 0.35,
    frequencyModel: "single",
    frequencyCap: 1,
    decayModel: "none",
    minResidual: 1,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.35,
    explanationKey: "strength.signal.connected_to",
  },
  {
    contributes: true,
    signalKind: "SAVED_CARD",
    category: "identity_context",
    baseWeight: 0.06,
    frequencyModel: "single",
    frequencyCap: 1,
    decayModel: "exponential",
    decayHalfLifeDays: 180,
    minResidual: 0.25,
    directionality: "directional",
    sign: 1,
    perSignalCap: 0.06,
    explanationKey: "strength.signal.saved_card",
  },
  {
    contributes: true,
    signalKind: "MET",
    category: "meeting",
    baseWeight: 0.22,
    frequencyModel: "capped_log",
    frequencyCap: 8,
    decayModel: "exponential",
    decayHalfLifeDays: 120,
    minResidual: 0.15,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.22,
    explanationKey: "strength.signal.met",
  },
  {
    contributes: true,
    signalKind: "INTRODUCED",
    category: "introduction",
    baseWeight: 0.14,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    decayModel: "exponential",
    decayHalfLifeDays: 240,
    minResidual: 0.25,
    directionality: "directional",
    sign: 1,
    perSignalCap: 0.14,
    explanationKey: "strength.signal.introduced",
  },
  {
    contributes: true,
    signalKind: "REFERRED",
    category: "commercial",
    baseWeight: 0.14,
    frequencyModel: "capped_log",
    frequencyCap: 4,
    decayModel: "exponential",
    decayHalfLifeDays: 240,
    minResidual: 0.25,
    directionality: "directional",
    sign: 1,
    perSignalCap: 0.14,
    explanationKey: "strength.signal.referred",
  },
  {
    contributes: true,
    signalKind: "MESSAGED",
    category: "interaction",
    baseWeight: 0.16,
    frequencyModel: "capped_log",
    frequencyCap: 20,
    decayModel: "exponential",
    decayHalfLifeDays: 60,
    minResidual: 0.1,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.16,
    explanationKey: "strength.signal.messaged",
  },
  {
    contributes: true,
    signalKind: "ATTENDED",
    category: "shared_context",
    baseWeight: 0.08,
    frequencyModel: "capped_log",
    frequencyCap: 6,
    decayModel: "exponential",
    decayHalfLifeDays: 180,
    minResidual: 0.2,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.08,
    explanationKey: "strength.signal.attended",
  },
  {
    contributes: true,
    signalKind: "CHECKED_IN",
    category: "shared_context",
    baseWeight: 0.05,
    frequencyModel: "capped_log",
    frequencyCap: 6,
    decayModel: "exponential",
    decayHalfLifeDays: 180,
    minResidual: 0.2,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.05,
    explanationKey: "strength.signal.checked_in",
  },
  {
    contributes: true,
    signalKind: "WORKS_FOR",
    category: "shared_context",
    baseWeight: 0.08,
    frequencyModel: "single",
    frequencyCap: 1,
    decayModel: "none",
    minResidual: 1,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.08,
    explanationKey: "strength.signal.works_for",
  },
  {
    contributes: true,
    signalKind: "MEMBER_OF",
    category: "shared_context",
    baseWeight: 0.06,
    frequencyModel: "single",
    frequencyCap: 1,
    decayModel: "none",
    minResidual: 1,
    directionality: "symmetric",
    sign: 1,
    perSignalCap: 0.06,
    explanationKey: "strength.signal.member_of",
  },
  {
    contributes: true,
    signalKind: "PURCHASED",
    category: "commercial",
    baseWeight: 0.12,
    frequencyModel: "capped_log",
    frequencyCap: 5,
    decayModel: "exponential",
    decayHalfLifeDays: 365,
    minResidual: 0.3,
    directionality: "directional",
    sign: 1,
    perSignalCap: 0.12,
    explanationKey: "strength.signal.purchased",
  },
  {
    contributes: true,
    signalKind: "SOLD",
    category: "commercial",
    baseWeight: 0.12,
    frequencyModel: "capped_log",
    frequencyCap: 5,
    decayModel: "exponential",
    decayHalfLifeDays: 365,
    minResidual: 0.3,
    directionality: "directional",
    sign: 1,
    perSignalCap: 0.12,
    explanationKey: "strength.signal.sold",
  },
] as const satisfies readonly StrengthContribution[]);

// Category caps prevent any single category from monopolizing the score.
export const CATEGORY_CAPS: Readonly<Record<StrengthCategory, number>> = Object.freeze({
  identity_context: 0.1,
  direct_connection: 0.35,
  interaction: 0.2,
  meeting: 0.25,
  introduction: 0.18,
  shared_context: 0.15,
  commercial: 0.2,
  continuity: 0.15,
});

// Deterministic tier bands aligned with the frozen BC-4.0 model.
export interface TierBand {
  tier: import("./types").StrengthTier;
  min: number;
  max: number;
}
export const TIER_BANDS: readonly TierBand[] = Object.freeze([
  { tier: "very_weak", min: 0.0, max: 0.15 },
  { tier: "weak", min: 0.15, max: 0.35 },
  { tier: "normal", min: 0.35, max: 0.6 },
  { tier: "strong", min: 0.6, max: 0.85 },
  { tier: "champion", min: 0.85, max: 1.0 },
]);

const BY_KIND: ReadonlyMap<StrengthSignalKind, StrengthContribution> = new Map(
  REGISTRY.map((c: any) => [c.signalKind, c] as const),
);

// Integrity checks (module-load time).
for (const c of REGISTRY) {
  if (c.baseWeight < 0 || c.baseWeight > 1)
    throw new Error(`[strength.registry] baseWeight out of range: ${c.signalKind}`);
  if (c.perSignalCap < 0 || c.perSignalCap > c.baseWeight + 1e-9)
    throw new Error(`[strength.registry] perSignalCap > baseWeight: ${c.signalKind}`);
  if (c.minResidual < 0 || c.minResidual > 1)
    throw new Error(`[strength.registry] minResidual invalid: ${c.signalKind}`);
  if (c.frequencyCap < 1) throw new Error(`[strength.registry] frequencyCap < 1: ${c.signalKind}`);
  if (c.decayModel !== "none" && !c.decayHalfLifeDays)
    throw new Error(`[strength.registry] decay requires half-life: ${c.signalKind}`);
}

export function getContribution(kind: string): StrengthContribution | undefined {
  return BY_KIND.get(kind as StrengthSignalKind);
}
export function listContributions(): readonly StrengthContribution[] {
  return REGISTRY;
}

export function tierFor(score: number): import("./types").StrengthTier {
  const s = Math.max(0, Math.min(1, score));
  for (const b of TIER_BANDS) {
    if (s >= b.min && s < b.max) return b.tier;
  }
  return "champion"; // s === 1.0
}
