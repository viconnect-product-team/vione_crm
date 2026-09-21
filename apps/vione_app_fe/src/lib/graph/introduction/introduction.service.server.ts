// BC-6.0 → BC-6.1 — Smart Introduction Service (server-only).
// Orchestrates: viewer-derived source → target validation → RLS-safe path
// discovery (bounded, batched) → block filter → real strength + shared
// context hydration (batched) → pure engine ranking → diversity → cursor.
// NEVER touches hidden topology. All hydration is bounded to ≤6 round trips.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "../errors";
import { RelationshipGraphRepository } from "../graph.repository.server";
import { RELATIONSHIP_STRENGTH_VERSION } from "../strength/types";
import { batchLoadPairStrengths, pairKey } from "../strength/strength.batch.repository.server";
import { INTRODUCTION_BUDGETS } from "./registry";
import { rankAndBuildPaths, type EnginePathInput } from "./engine";
import { decodeCursor, encodeCursor } from "./cursor";
import {
  SMART_INTRODUCTION_VERSION,
  type SmartIntroductionPageDTO,
  type SmartIntroductionPageState,
  type SmartIntroductionPathDTO,
  type SmartIntroductionQuery,
} from "./types";
import {
  batchLoadAffiliations,
  sharedContextsBetween,
  type PersonAffiliations,
} from "./context.service.server";

const RECENT_MS = 30 * 86_400_000; // reserved for future granular use
const STALE_MS = 180 * 86_400_000; // reserved for future granular use
void RECENT_MS;
void STALE_MS;

function emptyPage(state: SmartIntroductionPageState): SmartIntroductionPageDTO {
  return {
    items: [],
    nextCursor: null,
    introductionVersion: SMART_INTRODUCTION_VERSION,
    state,
  };
}

export class SmartIntroductionService {
  private readonly repo: RelationshipGraphRepository;

  constructor(
    private readonly sb: SupabaseClient,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new RelationshipGraphRepository(sb);
  }

  private async loadBlockedPersonNodeIds(): Promise<Set<string>> {
    if (!this.viewerUserId) return new Set();
    try {
      const { ConnectionService } = await import("@/lib/connection/service.server");
      return new Set(await ConnectionService.listBlockedPersonNodeIds(this.sb, this.viewerUserId));
    } catch {
      return new Set();
    }
  }

  private async resolveSourcePersonNodeId(): Promise<string> {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    const node = await this.repo.findNodeByExternalRef("person", "user_profile", this.viewerUserId);
    if (!node) throw graphErr("SOURCE_NODE_NOT_FOUND");
    return node.id;
  }

  async findIntroductionPaths(q: SmartIntroductionQuery): Promise<SmartIntroductionPageDTO> {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    if (!q?.targetPersonNodeId) throw graphErr("INTRODUCTION_QUERY_INVALID");
    const limit = Math.min(
      Math.max(1, q.limit ?? INTRODUCTION_BUDGETS.defaultLimit),
      INTRODUCTION_BUDGETS.maxLimit,
    );
    const maxDepth = (q.maxDepth === 3 ? 3 : 2) as 2 | 3;
    decodeCursor(q.cursor ?? null, q.targetPersonNodeId, maxDepth);

    const sourceId = await this.resolveSourcePersonNodeId();
    if (sourceId === q.targetPersonNodeId) {
      throw graphErr("INTRODUCTION_QUERY_INVALID");
    }

    const target = await this.repo.getNode(q.targetPersonNodeId);
    if (!target || target.node_kind !== "person" || target.status !== "active") {
      throw graphErr("TARGET_NOT_FOUND");
    }

    const blocked = await this.loadBlockedPersonNodeIds();
    if (blocked.has(q.targetPersonNodeId)) {
      throw graphErr("INTRODUCTION_NOT_AVAILABLE");
    }

    const [srcNeighbors, tgtNeighbors] = await Promise.all([
      this.repo.neighborIds(sourceId, {
        edgeKinds: ["CONNECTED_TO"],
        nodeKinds: ["person"],
      }),
      this.repo.neighborIds(q.targetPersonNodeId, {
        edgeKinds: ["CONNECTED_TO"],
        nodeKinds: ["person"],
      }),
    ]);

    if (srcNeighbors.includes(q.targetPersonNodeId)) {
      // BC-6.1 — return as page state, not error, so UI can render context.
      return emptyPage("TARGET_ALREADY_CONNECTED");
    }

    const srcSet = new Set(
      srcNeighbors
        .slice(0, INTRODUCTION_BUDGETS.maxFirstDegreeFanOut)
        .filter((id) => !blocked.has(id)),
    );
    const tgtSet = new Set(
      tgtNeighbors
        .slice(0, INTRODUCTION_BUDGETS.maxFirstDegreeFanOut)
        .filter((id) => !blocked.has(id)),
    );

    const twoHop: string[] = [];
    for (const id of srcSet) {
      if (id === sourceId || id === q.targetPersonNodeId) continue;
      if (tgtSet.has(id)) twoHop.push(id);
    }

    const threeHop: Array<[string, string]> = [];
    if (maxDepth === 3 && twoHop.length < limit) {
      const srcNeighborList = [...srcSet].slice(0, INTRODUCTION_BUDGETS.maxIntermediaryFanOut);
      const batch = await this.repo.batchNeighborIds(srcNeighborList, {
        edgeKinds: ["CONNECTED_TO"],
        nodeKinds: ["person"],
        perNodeCap: INTRODUCTION_BUDGETS.maxIntermediaryFanOut,
      });
      for (const [a, bs] of batch) {
        for (const b of bs) {
          if (
            b === sourceId ||
            b === q.targetPersonNodeId ||
            b === a ||
            blocked.has(b) ||
            srcSet.has(b)
          ) {
            continue;
          }
          if (tgtSet.has(b)) threeHop.push([a, b]);
          if (threeHop.length >= INTRODUCTION_BUDGETS.maxCandidatePaths) break;
        }
        if (threeHop.length >= INTRODUCTION_BUDGETS.maxCandidatePaths) break;
      }
    }

    const allIntermediaryIds = Array.from(new Set([...twoHop, ...threeHop.flatMap((p) => p)]));
    if (allIntermediaryIds.length === 0) return emptyPage("NO_PATH");

    const nodes = await this.repo.getNodes(allIntermediaryIds);
    const activeIds = new Set(
      nodes.filter((n) => n.status === "active" && n.node_kind === "person").map((n: any) => n.id),
    );

    // ---- BC-6.1 — batched hydration ----
    // Collect every unique (a,b) pair actually needed for scoring.
    const pairs: Array<{ a: string; b: string }> = [];
    const pushPair = (a: string, b: string) => pairs.push({ a, b });
    for (const mid of twoHop) {
      if (!activeIds.has(mid)) continue;
      pushPair(sourceId, mid);
      pushPair(mid, q.targetPersonNodeId);
    }
    for (const [a, b] of threeHop) {
      if (!activeIds.has(a) || !activeIds.has(b)) continue;
      pushPair(sourceId, a);
      pushPair(a, b);
      pushPair(b, q.targetPersonNodeId);
    }

    const personIdsForAffil = Array.from(
      new Set([
        sourceId,
        q.targetPersonNodeId,
        ...twoHop.filter((id) => activeIds.has(id)),
        ...threeHop.flatMap(([a, b]) => [a, b]).filter((id) => activeIds.has(id)),
      ]),
    );

    const [strengthMap, affilMap] = await Promise.all([
      batchLoadPairStrengths(this.sb, pairs),
      batchLoadAffiliations(this.sb, personIdsForAffil),
    ]);

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    let usedFallback = false;

    const hopFor = (a: string, b: string) => {
      const key = pairKey(a, b);
      const s = strengthMap.get(key);
      if (!s) {
        usedFallback = true;
        return { strength: 0.5, available: false, stale: true, recent: false };
      }
      return {
        strength: s.score,
        available: true,
        stale: s.freshness !== "fresh",
        recent: s.freshness === "fresh",
      };
    };

    const contextsFor = (mid: string) => {
      const midAffil = affilMap.get(mid);
      const tgtAffil = affilMap.get(q.targetPersonNodeId);
      const srcAffil = affilMap.get(sourceId);
      if (!midAffil) return { shared: [], dominant: undefined as string | undefined };
      // Prefer contexts that tie mid ↔ target (path terminates there).
      const withTarget = tgtAffil
        ? sharedContextsBetween(midAffil as PersonAffiliations, tgtAffil as PersonAffiliations)
        : [];
      const withSource = srcAffil
        ? sharedContextsBetween(midAffil as PersonAffiliations, srcAffil as PersonAffiliations)
        : [];
      const merged = [...withTarget, ...withSource];
      // Dominant = highest-count kind for diversity capping.
      const dominant = merged.sort((a, b) => b.count - a.count)[0]?.kind;
      return { shared: merged, dominant };
    };

    const candidates: EnginePathInput[] = [];

    for (const mid of twoHop) {
      if (!activeIds.has(mid)) continue;
      const h1 = hopFor(sourceId, mid);
      const h2 = hopFor(mid, q.targetPersonNodeId);
      const ctx = contextsFor(mid);
      candidates.push({
        nodeChain: [sourceId, mid, q.targetPersonNodeId],
        hopStrengths: [h1.strength, h2.strength],
        hopStrengthAvailable: [h1.available, h2.available],
        hopStale: [h1.stale, h2.stale],
        hopRecent: [h1.recent, h2.recent],
        sharedContexts: ctx.shared,
        priorIntroductionSuccess: false,
        dominantContextKey: ctx.dominant,
      });
    }
    for (const [a, b] of threeHop) {
      if (!activeIds.has(a) || !activeIds.has(b)) continue;
      const h1 = hopFor(sourceId, a);
      const h2 = hopFor(a, b);
      const h3 = hopFor(b, q.targetPersonNodeId);
      const ctxA = contextsFor(a);
      const ctxB = contextsFor(b);
      const shared = [...ctxA.shared, ...ctxB.shared];
      candidates.push({
        nodeChain: [sourceId, a, b, q.targetPersonNodeId],
        hopStrengths: [h1.strength, h2.strength, h3.strength],
        hopStrengthAvailable: [h1.available, h2.available, h3.available],
        hopStale: [h1.stale, h2.stale, h3.stale],
        hopRecent: [h1.recent, h2.recent, h3.recent],
        sharedContexts: shared,
        priorIntroductionSuccess: false,
        dominantContextKey: ctxB.dominant ?? ctxA.dominant,
      });
    }

    if (candidates.length === 0) return emptyPage("NO_PATH");

    const ranked = rankAndBuildPaths({
      candidates,
      options: {
        strengthVersion: RELATIONSHIP_STRENGTH_VERSION,
        generatedAt: nowIso,
        limit,
      },
    });

    if (ranked.length === 0) return emptyPage("NO_PATH");

    let nextCursor: string | null = null;
    if (ranked.length === limit) {
      const last = ranked[ranked.length - 1]!;
      nextCursor = encodeCursor({
        v: SMART_INTRODUCTION_VERSION,
        t: q.targetPersonNodeId,
        d: maxDepth,
        k: `${last.score.toFixed(6)}.${last.pathId}`,
      });
    }

    return {
      items: ranked as SmartIntroductionPathDTO[],
      nextCursor,
      introductionVersion: SMART_INTRODUCTION_VERSION,
      state: "OK",
      usedStrengthFallback: usedFallback,
    };
  }
}
