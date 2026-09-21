// BC-6.0 — Smart Introduction pure engine.
// IO-free, deterministic. Given resolved candidate paths + viewer-safe signals,
// produces ranked, diverse, versioned SmartIntroductionPathDTO[].
//
// Privacy: this module NEVER sees hidden topology. Callers must supply only
// viewer-visible nodes and viewer-safe evidence (blocked/hidden paths are
// filtered before reaching here).

// Browser-safe deterministic hash (FNV-1a 64-bit, hex). Sync + isomorphic.
function fnv1a64Hex(input: string): string {
  // Use BigInt to keep 64-bit determinism across environments.
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, "0");
}
import {
  INTRODUCTION_BUDGETS,
  INTRODUCTION_DIVERSITY,
  INTRODUCTION_REASON_PRIORITY,
  INTRODUCTION_WEIGHTS,
  confidenceFromScore,
} from "./registry";
import {
  SMART_INTRODUCTION_VERSION,
  type IntroductionReasonCode,
  type SmartIntroductionPathDTO,
  type SmartIntroductionReasonDTO,
} from "./types";

export interface EnginePathInput {
  /** Ordered [source, intermediary, (intermediaryB,) target] node ids. */
  nodeChain: string[];
  /** Per-hop strengths in [0,1] aligned with edges of nodeChain. */
  hopStrengths: number[];
  /** BC-6.1 — true when hop strength was really measured (not fallback). */
  hopStrengthAvailable?: boolean[];
  /** true when a hop signal is stale (>180d) or cold. */
  hopStale: boolean[];
  /** true when a hop has a recent interaction (<=30d). */
  hopRecent: boolean[];
  /** Viewer-safe shared-context tags contributing this path (deduped). */
  sharedContexts: Array<{ kind: string; count?: number; example?: string }>;
  /** Prior introduction success recorded for this pair (viewer-safe). */
  priorIntroductionSuccess: boolean;
  /** Optional dominant context key used for diversity capping. */
  dominantContextKey?: string;
}

export interface EngineOptions {
  strengthVersion: string;
  generatedAt: string;
  limit: number;
  now?: number;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

function reasonsFor(input: EnginePathInput): SmartIntroductionReasonDTO[] {
  const out: SmartIntroductionReasonDTO[] = [];
  const push = (code: IntroductionReasonCode, extras: Partial<SmartIntroductionReasonDTO> = {}) =>
    out.push({
      code,
      summaryKey: `businessConnect.introduction.reason.${code}`,
      priority: INTRODUCTION_REASON_PRIORITY[code],
      ...extras,
    });

  const [s1, s2] = input.hopStrengths;
  const avail = input.hopStrengthAvailable;
  const availAll = !avail || avail.every(Boolean);
  const a1 = !avail || avail[0] === true;
  const a2 = !avail || avail[1] === true;
  // Gate STRONG_* reasons: only when the underlying hop is actually measured.
  if (a1 && s1 !== undefined && s1 >= 0.7) push("STRONG_DIRECT_INTERMEDIARY");
  if (a2 && s2 !== undefined && s2 >= 0.7) push("STRONG_TARGET_RELATIONSHIP");
  const minPair = Math.min(...input.hopStrengths);
  if (availAll && input.hopStrengths.length === 2 && minPair >= 0.55) push("MUTUAL_TRUST_PATH");

  const ctxByKind = new Map<string, { count: number; examples: string[] }>();
  for (const c of input.sharedContexts) {
    const entry = ctxByKind.get(c.kind) ?? { count: 0, examples: [] };
    entry.count += c.count ?? 1;
    if (c.example && entry.examples.length < 3 && !entry.examples.includes(c.example)) {
      entry.examples.push(c.example);
    }
    ctxByKind.set(c.kind, entry);
  }
  const kindToCode: Record<string, IntroductionReasonCode> = {
    association: "SAME_ASSOCIATION",
    company: "SAME_COMPANY_CONTEXT",
    community: "SHARED_COMMUNITY",
    event: "SHARED_EVENT",
  };
  for (const [kind, entry] of ctxByKind) {
    const code = kindToCode[kind];
    if (!code) continue;
    push(code, { count: entry.count, examples: entry.examples });
  }

  if (input.hopRecent.some(Boolean)) push("RECENT_INTERACTION");
  if (input.priorIntroductionSuccess) push("PRIOR_INTRODUCTION_HISTORY");
  if (out.length === 0) push("SHORTEST_TRUSTED_PATH");

  return out.sort((a, b) => b.priority - a.priority);
}

export function scorePath(input: EnginePathInput): number {
  const w = INTRODUCTION_WEIGHTS;
  const depth = input.nodeChain.length - 1; // 2 or 3
  const weakest = input.hopStrengths.length ? Math.min(...input.hopStrengths) : 0;
  let s = weakest * w.relationshipTrust;
  if (depth > 2) s -= w.pathLengthPenaltyPerExtraHop * (depth - 2);

  const distinctContextKinds = new Set(input.sharedContexts.map((c: any) => c.kind));
  if (distinctContextKinds.size > 0) s += w.sharedContext;
  if (input.hopRecent.some(Boolean)) s += w.recency;
  if (input.priorIntroductionSuccess) s += w.introductionHistory;

  const staleHops = input.hopStale.filter(Boolean).length;
  if (staleHops > 0) s -= w.staleHopPenalty * staleHops;

  // Evidence diversity (bounded).
  const reasonCount = reasonsFor(input).length;
  if (reasonCount > 1) {
    s += w.diversityAdjustment * Math.min(1, (reasonCount - 1) / 4);
  }
  return clamp01(s);
}

export function computePathId(chain: string[]): string {
  const payload = `${SMART_INTRODUCTION_VERSION}|${chain.join(">")}`;
  // 32 hex chars = two concatenated 64-bit FNV-1a rounds (salted) for spread.
  return `${fnv1a64Hex(payload)}${fnv1a64Hex(`salt:${payload}`)}`.slice(0, 32);
}

/** Deterministic diversity re-rank; caller has already produced ranked paths. */
export function applyDiversity(
  ranked: SmartIntroductionPathDTO[],
  dominantContextByPathId: Map<string, string | undefined>,
): SmartIntroductionPathDTO[] {
  const perIntermediary = new Map<string, number>();
  const perContext = new Map<string, number>();
  const kept: SmartIntroductionPathDTO[] = [];
  for (const p of ranked) {
    const primary = p.intermediaries[0]?.personNodeId ?? "";
    const ctx = dominantContextByPathId.get(p.pathId) ?? "";
    const nI = perIntermediary.get(primary) ?? 0;
    const nC = ctx ? (perContext.get(ctx) ?? 0) : 0;
    if (nI >= INTRODUCTION_DIVERSITY.maxPathsPerPrimaryIntermediary) continue;
    if (ctx && nC >= INTRODUCTION_DIVERSITY.maxPathsPerDominantContext) continue;
    kept.push(p);
    perIntermediary.set(primary, nI + 1);
    if (ctx) perContext.set(ctx, nC + 1);
  }
  return kept;
}

export interface RankArgs {
  candidates: EnginePathInput[];
  options: EngineOptions;
}

export function rankAndBuildPaths(args: RankArgs): SmartIntroductionPathDTO[] {
  const { candidates, options } = args;
  const capped = candidates.slice(0, INTRODUCTION_BUDGETS.maxCandidatePaths);
  const scored: Array<{
    dto: SmartIntroductionPathDTO;
    dominantContextKey?: string;
  }> = capped.map((c: any) => {
    const depth = (c.nodeChain.length - 1) as 2 | 3;
    const score = scorePath(c);
    const confidence = confidenceFromScore(score, depth);
    const reasons = reasonsFor(c);
    const chain = c.nodeChain;
    const target = chain[chain.length - 1]!;
    const intermediaries = chain.slice(1, -1).map((id: any, i: any) => ({
      personNodeId: id,
      hop: i + 1,
    }));
    const pathId = computePathId(chain);
    const dto: SmartIntroductionPathDTO = {
      pathId,
      target: { personNodeId: target },
      intermediaries,
      depth,
      score,
      confidence,
      reasons,
      introductionVersion: SMART_INTRODUCTION_VERSION,
      strengthVersion: options.strengthVersion,
      generatedAt: options.generatedAt,
    };
    return { dto, dominantContextKey: c.dominantContextKey };
  });

  // Deterministic sort: score DESC, depth ASC, confidencePriority DESC, pathId ASC.
  const confRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  scored.sort((a, b) => {
    if (b.dto.score !== a.dto.score) return b.dto.score - a.dto.score;
    if (a.dto.depth !== b.dto.depth) return a.dto.depth - b.dto.depth;
    const cr = confRank[b.dto.confidence]! - confRank[a.dto.confidence]!;
    if (cr !== 0) return cr;
    return a.dto.pathId.localeCompare(b.dto.pathId);
  });

  const dominant = new Map<string, string | undefined>(
    scored.map((s) => [s.dto.pathId, s.dominantContextKey]),
  );
  const diverse = applyDiversity(
    scored.map((s) => s.dto),
    dominant,
  );
  return diverse.slice(0, Math.max(1, Math.min(options.limit, INTRODUCTION_BUDGETS.maxLimit)));
}
