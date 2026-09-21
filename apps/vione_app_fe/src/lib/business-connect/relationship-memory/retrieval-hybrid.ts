// BC-9.1 Turn B2c — Hybrid ranking (pure).
//
// Combines semantic similarity, subject/scope specificity, verified evidence,
// freshness, and (optional) graph support into a single [0..1] score.
// Deterministic; no IO. Never reveals raw vectors or distances.

export interface HybridRankingInputs {
  semanticSimilarity: number | null; // 0..1 cosine similarity
  subjectMatch: boolean;
  scopeMatch: boolean;
  typeMatch: boolean;
  verified: boolean; // >= 2 corroborating sources OR verified status
  sourceCount: number;
  lastObservedAt: string; // ISO
  now: string; // ISO
  confidence: number; // 0..1
  graphSupport?: number; // 0..1 optional graph-supported boost
}

export interface HybridRankingOutput {
  score: number; // 0..1
  band: "high" | "medium" | "low";
  freshness: "fresh" | "recent" | "aging" | "stale";
  matchedOn: string[]; // deterministic order
}

function freshnessBand(
  lastObservedAt: string,
  now: string,
): { band: "fresh" | "recent" | "aging" | "stale"; weight: number } {
  const t = Date.parse(lastObservedAt);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return { band: "stale", weight: 0.2 };
  const days = Math.max(0, (n - t) / (1000 * 60 * 60 * 24));
  if (days <= 14) return { band: "fresh", weight: 1.0 };
  if (days <= 60) return { band: "recent", weight: 0.8 };
  if (days <= 180) return { band: "aging", weight: 0.55 };
  return { band: "stale", weight: 0.3 };
}

function clamp01(v: number): number {
  if (Number.isNaN(v) || !Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function rankHybrid(inputs: HybridRankingInputs): HybridRankingOutput {
  const sim = clamp01(inputs.semanticSimilarity ?? 0);
  const conf = clamp01(inputs.confidence);
  const fresh = freshnessBand(inputs.lastObservedAt, inputs.now);
  const specificity =
    (inputs.subjectMatch ? 0.6 : 0) + (inputs.scopeMatch ? 0.3 : 0) + (inputs.typeMatch ? 0.1 : 0);
  const verifiedBoost = inputs.verified ? 0.1 : 0;
  const multiSource = Math.min(0.1, Math.max(0, inputs.sourceCount - 1) * 0.03);
  const graph = clamp01(inputs.graphSupport ?? 0) * 0.08;

  // Weighted blend (deterministic constants).
  const base = sim * 0.5 + specificity * 0.25 + conf * 0.15 + fresh.weight * 0.1;

  const score = clamp01(base + verifiedBoost + multiSource + graph);

  const matchedOn: string[] = [];
  if (sim >= 0.55) matchedOn.push("semantic_match");
  if (inputs.subjectMatch) matchedOn.push("subject_match");
  if (inputs.scopeMatch) matchedOn.push("scope_match");
  if (inputs.typeMatch) matchedOn.push("type_match");
  if (inputs.verified) matchedOn.push("verified");
  if (fresh.band === "fresh" || fresh.band === "recent") matchedOn.push("fresh");
  if ((inputs.graphSupport ?? 0) > 0) matchedOn.push("graph_supported");
  if (inputs.sourceCount >= 2) matchedOn.push("multiple_sources");

  const band: "high" | "medium" | "low" = score >= 0.7 ? "high" : score >= 0.45 ? "medium" : "low";

  return { score, band, freshness: fresh.band, matchedOn };
}
