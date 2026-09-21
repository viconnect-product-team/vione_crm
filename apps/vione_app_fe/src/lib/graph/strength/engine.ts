// BC-4.3 — Relationship Strength Engine v1 — Pure deterministic scoring.
// No I/O, no randomness, no product coupling. Same inputs → same output.

import {
  CATEGORY_CAPS,
  getContribution,
  listContributions,
  tierFor,
  type StrengthContribution,
} from "./registry";
import {
  RELATIONSHIP_STRENGTH_REGISTRY_VERSION,
  RELATIONSHIP_STRENGTH_VERSION,
  type RelationshipStrengthResult,
  type StrengthCategory,
  type StrengthContributionRecord,
  type StrengthFreshness,
  type StrengthSignalObservation,
} from "./types";

const MS_PER_DAY = 86_400_000;

/** Canonical ordering for symmetric pairs — lexicographic on nodeId. */
export function canonicalPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function recencyFactor(c: StrengthContribution, lastAt: string | undefined, nowMs: number): number {
  if (c.decayModel === "none" || !lastAt || !c.decayHalfLifeDays) return 1;
  const t = Date.parse(lastAt);
  if (!Number.isFinite(t)) return c.minResidual;
  const ageDays = Math.max(0, (nowMs - t) / MS_PER_DAY);
  let f = 1;
  switch (c.decayModel) {
    case "exponential":
      f = Math.pow(0.5, ageDays / c.decayHalfLifeDays);
      break;
    case "linear":
      f = Math.max(0, 1 - ageDays / (c.decayHalfLifeDays * 2));
      break;
    case "step":
      f = ageDays <= c.decayHalfLifeDays ? 1 : c.minResidual;
      break;
  }
  return Math.max(c.minResidual, Math.min(1, f));
}

function frequencyFactor(
  c: StrengthContribution,
  count: number,
): {
  factor: number;
  effective: number;
} {
  if (count <= 0) return { factor: 0, effective: 0 };
  if (c.frequencyModel === "single") return { factor: 1, effective: 1 };
  // capped_log: factor = ln(1+min(count,cap)) / ln(1+cap) → 0..1
  const eff = Math.min(count, c.frequencyCap);
  const factor = Math.log(1 + eff) / Math.log(1 + c.frequencyCap);
  return { factor, effective: eff };
}

function computeFreshness(
  observations: StrengthSignalObservation[],
  nowMs: number,
): StrengthFreshness {
  const times = observations
    .map((o) => (o.lastAt ? Date.parse(o.lastAt) : NaN))
    .filter((t) => Number.isFinite(t)) as number[];
  if (times.length === 0) return "cold";
  const mostRecent = Math.max(...times);
  const days = (nowMs - mostRecent) / MS_PER_DAY;
  if (days <= 30) return "fresh";
  if (days <= 180) return "stale";
  return "cold";
}

export interface ComputeInput {
  sourceNodeId: string;
  targetNodeId: string;
  /** Observations already filtered to signals VISIBLE to the viewer. */
  observations: StrengthSignalObservation[];
  now?: Date;
}

/**
 * Pure scoring. Sums per-signal capped contributions, then per-category caps,
 * then clamps to [0,1]. Contributions returned in registry order for stability.
 */
export function computeStrength(input: ComputeInput): RelationshipStrengthResult {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  // Deduplicate observations by signal kind — engine sums per kind only.
  const merged = new Map<string, StrengthSignalObservation>();
  for (const o of input.observations) {
    if (!getContribution(o.signalKind)) continue; // ignore disabled/unregistered
    if (o.count <= 0) continue;
    const prev = merged.get(o.signalKind);
    if (!prev) {
      merged.set(o.signalKind, { ...o });
    } else {
      const lastAt =
        prev.lastAt && o.lastAt
          ? prev.lastAt >= o.lastAt
            ? prev.lastAt
            : o.lastAt
          : (prev.lastAt ?? o.lastAt);
      merged.set(o.signalKind, {
        signalKind: o.signalKind,
        count: prev.count + o.count,
        lastAt,
      });
    }
  }

  const contributions: StrengthContributionRecord[] = [];
  const byCategory = new Map<StrengthCategory, number>();

  // Iterate the frozen registry to guarantee output ordering.
  for (const c of listContributions()) {
    const obs = merged.get(c.signalKind);
    if (!obs) continue;
    const { factor: freqF, effective } = frequencyFactor(c, obs.count);
    const recF = recencyFactor(c, obs.lastAt, nowMs);
    const raw = c.baseWeight * freqF * recF * c.sign;
    const capped = Math.max(-c.perSignalCap, Math.min(c.perSignalCap, raw));
    contributions.push({
      signalKind: c.signalKind,
      category: c.category,
      rawCount: obs.count,
      effectiveCount: effective,
      baseWeight: c.baseWeight,
      frequencyFactor: freqF,
      recencyFactor: recF,
      cappedContribution: capped,
      explanationKey: c.explanationKey,
    });
    byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + capped);
  }

  // Apply category caps by scaling that category's contributions.
  let total = 0;
  for (const [cat, sum] of byCategory) {
    const cap = CATEGORY_CAPS[cat] ?? 1;
    const clamped = Math.max(-cap, Math.min(cap, sum));
    total += clamped;
    if (Math.abs(sum) > cap && sum !== 0) {
      const scale = clamped / sum;
      for (const rec of contributions) {
        if (rec.category === cat) rec.cappedContribution *= scale;
      }
    }
  }

  const score = Math.max(0, Math.min(1, total));
  const tier = tierFor(score);

  return {
    sourceNodeId: input.sourceNodeId,
    targetNodeId: input.targetNodeId,
    score,
    tier,
    scoringVersion: RELATIONSHIP_STRENGTH_VERSION,
    contributionVersion: 1,
    registryVersion: RELATIONSHIP_STRENGTH_REGISTRY_VERSION,
    calculatedAt: now.toISOString(),
    freshness: computeFreshness([...merged.values()], nowMs),
    contributions,
    explanationKeys: contributions.map((c: any) => c.explanationKey),
  };
}
