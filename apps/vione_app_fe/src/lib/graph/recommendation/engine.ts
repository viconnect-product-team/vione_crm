// BC-4.4 — Recommendation Engine v1 — Pure deterministic ranking.
// No I/O. No randomness. Same inputs → same output. All candidates and
// signals passed in are assumed already visibility-filtered by the service.

import {
  RECO_CATEGORY_CAPS,
  RECO_MAX_CONSECUTIVE_SAME_CATEGORY,
  RECO_RECENCY_BONUS_CAP,
  getRecommendationSource,
  listRecommendationSources,
  type RecommendationSource,
} from "./registry";
import type { RecommendationCategory, RecommendationSourceKind } from "./types";

const MS_PER_DAY = 86_400_000;

/** One raw evidence row from a single source about a single candidate. */
export interface CandidateEvidence {
  sourceKind: RecommendationSourceKind;
  /** Raw count (mutuals, shared contexts, etc). */
  count: number;
  /** Most-recent related activity for recency; optional. */
  lastAt?: string;
  /**
   * Trusted-mutual contribution (0..1) if the caller pre-computed strength
   * for the mutual connectors. Optional.
   */
  strengthWeight?: number;
}

export interface RawCandidate {
  candidateNodeId: string;
  evidence: CandidateEvidence[];
}

export interface RankedCandidateContribution {
  sourceKind: RecommendationSourceKind;
  category: RecommendationCategory;
  count: number;
  effectiveCount: number;
  contribution: number;
}

export interface RankedCandidate {
  candidateNodeId: string;
  score: number;
  contributions: RankedCandidateContribution[];
  /** Freshest last-activity timestamp across evidence, if any. */
  mostRecentAt?: string;
}

function freqFactor(
  src: RecommendationSource,
  count: number,
): {
  factor: number;
  effective: number;
} {
  if (count <= 0) return { factor: 0, effective: 0 };
  if (src.frequencyModel === "single") return { factor: 1, effective: 1 };
  const eff = Math.min(count, src.frequencyCap);
  return {
    factor: Math.log(1 + eff) / Math.log(1 + src.frequencyCap),
    effective: eff,
  };
}

function recencyBonus(lastAt: string | undefined, nowMs: number): number {
  if (!lastAt) return 0;
  const t = Date.parse(lastAt);
  if (!Number.isFinite(t)) return 0;
  const days = Math.max(0, (nowMs - t) / MS_PER_DAY);
  // Half-life 90d, capped at RECO_RECENCY_BONUS_CAP.
  const b = RECO_RECENCY_BONUS_CAP * Math.pow(0.5, days / 90);
  return Math.max(0, Math.min(RECO_RECENCY_BONUS_CAP, b));
}

export interface RankInput {
  candidates: RawCandidate[];
  now?: Date;
}

/**
 * Deterministic multi-factor ranking.
 * 1. Per-evidence contribution = base × freq × sign
 * 2. Merge per candidate; group by category
 * 3. Apply per-category caps
 * 4. Add bounded recency bonus
 * 5. Clamp to [0,1]
 * 6. Sort by (score DESC, candidateId ASC)
 * 7. Diversity rerank — no more than N consecutive from same category
 */
export function rankCandidates(input: RankInput): RankedCandidate[] {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  const ranked: RankedCandidate[] = [];
  const sourceOrder = new Map<RecommendationSourceKind, number>(
    listRecommendationSources().map((s, i) => [s.sourceKind, i] as const),
  );

  for (const cand of input.candidates) {
    // Merge duplicate evidence per source
    const bySource = new Map<RecommendationSourceKind, CandidateEvidence>();
    for (const ev of cand.evidence) {
      const src = getRecommendationSource(ev.sourceKind);
      if (!src || !src.enabled) continue;
      const prev = bySource.get(ev.sourceKind);
      if (!prev) {
        bySource.set(ev.sourceKind, { ...ev });
      } else {
        const lastAt =
          prev.lastAt && ev.lastAt
            ? prev.lastAt >= ev.lastAt
              ? prev.lastAt
              : ev.lastAt
            : (prev.lastAt ?? ev.lastAt);
        bySource.set(ev.sourceKind, {
          sourceKind: ev.sourceKind,
          count: prev.count + ev.count,
          lastAt,
          strengthWeight: Math.max(prev.strengthWeight ?? 0, ev.strengthWeight ?? 0) || undefined,
        });
      }
    }

    const contributions: RankedCandidateContribution[] = [];
    const byCategory = new Map<RecommendationCategory, number>();
    let mostRecentAt: string | undefined;

    // Iterate in registry order for stability.
    for (const src of listRecommendationSources()) {
      const ev = bySource.get(src.sourceKind);
      if (!ev) continue;
      const { factor, effective } = freqFactor(src, ev.count);
      // Base per-source contribution.
      let contrib = src.baseWeight * factor;
      // STRONG_MUTUAL blends optional strengthWeight of mutual connectors.
      if (src.sourceKind === "STRONG_MUTUAL" && ev.strengthWeight != null) {
        contrib *= Math.max(0, Math.min(1, ev.strengthWeight));
      }
      contrib = Math.max(0, Math.min(src.baseWeight, contrib));
      contributions.push({
        sourceKind: src.sourceKind,
        category: src.diversityCategory,
        count: ev.count,
        effectiveCount: effective,
        contribution: contrib,
      });
      byCategory.set(src.diversityCategory, (byCategory.get(src.diversityCategory) ?? 0) + contrib);
      if (ev.lastAt) {
        if (!mostRecentAt || ev.lastAt > mostRecentAt) mostRecentAt = ev.lastAt;
      }
    }

    // Apply per-category cap by proportional scaling.
    let base = 0;
    for (const [cat, sum] of byCategory) {
      const cap = RECO_CATEGORY_CAPS[cat] ?? 1;
      const clamped = Math.min(cap, sum);
      if (sum > cap && sum > 0) {
        const scale = clamped / sum;
        for (const c of contributions) {
          if (c.category === cat) c.contribution *= scale;
        }
      }
      base += clamped;
    }

    const bonus = recencyBonus(mostRecentAt, nowMs);
    const score = Math.max(0, Math.min(1, base + bonus));

    ranked.push({
      candidateNodeId: cand.candidateNodeId,
      score,
      contributions,
      mostRecentAt,
    });
  }

  // Deterministic base ordering.
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Secondary: number of distinct sources DESC (more evidence wins ties).
    const na = a.contributions.length;
    const nb = b.contributions.length;
    if (nb !== na) return nb - na;
    // Tertiary: registry order of first contribution.
    const oa = a.contributions[0] ? (sourceOrder.get(a.contributions[0].sourceKind) ?? 999) : 999;
    const ob = b.contributions[0] ? (sourceOrder.get(b.contributions[0].sourceKind) ?? 999) : 999;
    if (oa !== ob) return oa - ob;
    // Final tie-break: candidate id ASC.
    return a.candidateNodeId < b.candidateNodeId
      ? -1
      : a.candidateNodeId > b.candidateNodeId
        ? 1
        : 0;
  });

  return diversityRerank(ranked);
}

/**
 * Deterministic diversity rerank: no more than
 * RECO_MAX_CONSECUTIVE_SAME_CATEGORY items from the same dominant
 * category may appear consecutively. Ties preserve base ordering.
 */
export function diversityRerank(input: RankedCandidate[]): RankedCandidate[] {
  const out: RankedCandidate[] = [];
  const remaining = input.slice();
  const dominant = (c: RankedCandidate): RecommendationCategory | null => {
    let best: RankedCandidateContribution | null = null;
    for (const x of c.contributions) {
      if (!best || x.contribution > best.contribution) best = x;
    }
    return best?.category ?? null;
  };
  while (remaining.length > 0) {
    let pickIdx = 0;
    if (out.length >= RECO_MAX_CONSECUTIVE_SAME_CATEGORY) {
      const tail = out.slice(-RECO_MAX_CONSECUTIVE_SAME_CATEGORY);
      const tailCat = dominant(tail[0]!);
      const allSame = tailCat && tail.every((t) => dominant(t) === tailCat);
      if (allSame) {
        const alt = remaining.findIndex((c) => dominant(c) !== tailCat);
        if (alt !== -1) pickIdx = alt;
      }
    }
    out.push(remaining.splice(pickIdx, 1)[0]!);
  }
  return out;
}
