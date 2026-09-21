// BC-4.4 — Recommendation Service (server-only).
// Orchestrates: candidate generation (RLS-safe) → ranking (pure engine) →
// filter (exclude viewer, existing connections, self) → paginate.

import type { SupabaseClient } from "@supabase/supabase-js";
import { GraphError, graphErr } from "../errors";
import { emitGraphTelemetry } from "../telemetry";
import { mapNode } from "../dto";
import { RelationshipGraphRepository } from "../graph.repository.server";
import type { GraphNodeDTO, NodeKind } from "../types";
import {
  RECO_DEFAULT_LIMIT,
  RECO_MAX_CANDIDATE_POOL,
  RECO_MAX_LIMIT,
  RECO_MAX_REASON_EXAMPLES,
  getRecommendationSource,
} from "./registry";
import { rankCandidates, type CandidateEvidence, type RawCandidate } from "./engine";
import { decodeRecoCursor, encodeRecoCursor, normalizeKinds } from "./cursor";
import {
  RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION,
  RELATIONSHIP_RECOMMENDATION_VERSION,
  type RecommendationDTO,
  type RecommendationPageDTO,
  type RecommendationQuery,
  type RecommendationReasonDTO,
  type RecommendationSourceKind,
} from "./types";

interface EvidenceBucket {
  candidateNodeId: string;
  evidence: CandidateEvidence[];
  /** Up to RECO_MAX_REASON_EXAMPLES per source. */
  examplesPerSource: Map<RecommendationSourceKind, string[]>;
}

export class RecommendationService {
  private readonly repo: RelationshipGraphRepository;

  constructor(
    private readonly sb: SupabaseClient,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new RelationshipGraphRepository(sb);
  }

  /**
   * BC-5.0 — Load person-node ids the viewer has blocked (either direction).
   * Uses the Connection adapter helper so exclusion logic stays consistent
   * with the ConnectionSDK's block semantics. RLS on user_connections limits
   * visibility to the viewer's rows.
   */
  private async loadBlockedPersonNodeIds(): Promise<string[]> {
    if (!this.viewerUserId) return [];
    try {
      const { ConnectionService } = await import("@/lib/connection/service.server");
      return await ConnectionService.listBlockedPersonNodeIds(this.sb, this.viewerUserId);
    } catch {
      return [];
    }
  }

  async recommendConnections(q: RecommendationQuery): Promise<RecommendationPageDTO> {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    const limit = Math.min(Math.max(1, q.limit ?? RECO_DEFAULT_LIMIT), RECO_MAX_LIMIT);
    const kinds = (
      q.targetNodeKinds && q.targetNodeKinds.length > 0 ? q.targetNodeKinds : ["person"]
    ) as NodeKind[];
    const kindsKey = normalizeKinds(kinds);

    const cursor = decodeRecoCursor(q.cursor ?? null, q.sourceNodeId, kindsKey);

    const sourceNode = await this.repo.getNode(q.sourceNodeId);
    if (!sourceNode) throw graphErr("NODE_NOT_FOUND");

    // 1) Direct neighbors of source — used both to build MUTUAL_CONNECTION
    //    evidence and to EXCLUDE already-connected candidates.
    const firstDegree = await this.repo.neighborIds(q.sourceNodeId, {
      edgeKinds: ["CONNECTED_TO"],
    });
    // BC-5.0 — Block-aware exclusion. Blocked pairs (either direction) must
    // never surface as recommendations, even when graph edges are absent
    // (blocks are held in the Global Networking engine, not the graph).
    const blockedPersonNodeIds = await this.loadBlockedPersonNodeIds();
    const excluded = new Set<string>([q.sourceNodeId, ...firstDegree, ...blockedPersonNodeIds]);

    const buckets = new Map<string, EvidenceBucket>();
    const addEvidence = (candidateId: string, ev: CandidateEvidence, exampleId?: string) => {
      if (excluded.has(candidateId)) return;
      let b = buckets.get(candidateId);
      if (!b) {
        b = {
          candidateNodeId: candidateId,
          evidence: [],
          examplesPerSource: new Map(),
        };
        buckets.set(candidateId, b);
      }
      b.evidence.push(ev);
      if (exampleId) {
        const list = b.examplesPerSource.get(ev.sourceKind) ?? [];
        if (list.length < RECO_MAX_REASON_EXAMPLES && !list.includes(exampleId)) {
          list.push(exampleId);
          b.examplesPerSource.set(ev.sourceKind, list);
        }
      }
    };

    // 2) MUTUAL_CONNECTION source — second-degree neighbors, batched.
    const mutualSrc = getRecommendationSource("MUTUAL_CONNECTION")!;
    if (mutualSrc.enabled && firstDegree.length > 0) {
      const perNode = Math.max(
        4,
        Math.floor(RECO_MAX_CANDIDATE_POOL / Math.max(1, firstDegree.length)),
      );
      const secondByFirst = await this.repo.batchNeighborIds(firstDegree, {
        edgeKinds: ["CONNECTED_TO"],
        nodeKinds: mutualSrc.candidateNodeKinds.slice() as NodeKind[],
        perNodeCap: Math.min(perNode, 50),
      });
      for (const [connectorId, seconds] of secondByFirst) {
        for (const candId of seconds) {
          if (excluded.has(candId)) continue;
          addEvidence(candId, { sourceKind: "MUTUAL_CONNECTION", count: 1 }, connectorId);
          if (buckets.size >= RECO_MAX_CANDIDATE_POOL) break;
        }
        if (buckets.size >= RECO_MAX_CANDIDATE_POOL) break;
      }
    }

    // 3) SHARED_COMPANY / SHARED_ASSOCIATION / SHARED_COMMUNITY sources.
    await this.addSharedContextEvidence(
      q.sourceNodeId,
      "SHARED_COMPANY",
      "company",
      ["WORKS_FOR"],
      excluded,
      buckets,
    );
    await this.addSharedContextEvidence(
      q.sourceNodeId,
      "SHARED_ASSOCIATION",
      "association",
      ["MEMBER_OF"],
      excluded,
      buckets,
    );
    await this.addSharedContextEvidence(
      q.sourceNodeId,
      "SHARED_COMMUNITY",
      "community",
      ["MEMBER_OF"],
      excluded,
      buckets,
    );

    // Rank
    const raw: RawCandidate[] = [...buckets.values()].map((b) => ({
      candidateNodeId: b.candidateNodeId,
      evidence: b.evidence,
    }));
    const ranked = rankCandidates({ candidates: raw });

    // Cursor: skip until we pass the cursor's (rank, id).
    const startIdx = cursor
      ? ranked.findIndex(
          (r) =>
            r.score < cursor.rank || (r.score === cursor.rank && r.candidateNodeId > cursor.id),
        )
      : 0;
    const slice = ranked.slice(Math.max(0, startIdx), Math.max(0, startIdx) + limit);
    const truncated = ranked.length > Math.max(0, startIdx) + limit;

    // Resolve node + example DTOs — RLS gate.
    const allNodeIds = new Set<string>();
    for (const r of slice) {
      allNodeIds.add(r.candidateNodeId);
      const bucket = buckets.get(r.candidateNodeId);
      if (bucket && q.includeReasonDetails !== false) {
        for (const ids of bucket.examplesPerSource.values()) {
          for (const x of ids) allNodeIds.add(x);
        }
      }
    }
    const rows = await this.repo.getNodes([...allNodeIds]);
    const nodeById = new Map<string, GraphNodeDTO>();
    for (const row of rows) nodeById.set(row.id, mapNode(row));

    const items: RecommendationDTO[] = [];
    for (let i = 0; i < slice.length; i++) {
      const r = slice[i]!;
      const node = nodeById.get(r.candidateNodeId);
      if (!node) continue; // hidden → drop silently
      const bucket = buckets.get(r.candidateNodeId)!;
      const reasons: RecommendationReasonDTO[] = [];
      for (const c of r.contributions) {
        if (c.contribution <= 0) continue;
        const src = getRecommendationSource(c.sourceKind);
        if (!src) continue;
        const exampleIds = bucket.examplesPerSource.get(c.sourceKind) ?? [];
        const examples =
          q.includeReasonDetails === false
            ? undefined
            : exampleIds.map((id: any) => nodeById.get(id)).filter((n): n is GraphNodeDTO => Boolean(n));
        reasons.push({
          code: src.reasonCode,
          summaryKey: `graph.recommendation.reason.${src.reasonCode.toLowerCase()}`,
          count: c.count,
          examples,
          contribution: Math.round(c.contribution * 1000) / 1000,
          priority: src.dedupePriority,
        });
      }
      reasons.sort((a, b) => a.priority - b.priority);
      items.push({
        candidateNode: node,
        score: Math.round(r.score * 1000) / 1000,
        rank: Math.max(0, startIdx) + i + 1,
        reasons,
        recommendationVersion: RELATIONSHIP_RECOMMENDATION_VERSION,
        freshness: r.mostRecentAt ? "fresh" : "cold",
      });
    }

    const last = slice[slice.length - 1];
    const nextCursor =
      last && truncated
        ? encodeRecoCursor({
            v: RELATIONSHIP_RECOMMENDATION_VERSION,
            src: q.sourceNodeId,
            kinds: kindsKey,
            rank: last.score,
            id: last.candidateNodeId,
          })
        : null;

    emitGraphTelemetry({
      event: "graph_recommendations_queried",
      count: items.length,
      truncated,
    });

    return {
      items,
      nextCursor,
      recommendationVersion: RELATIONSHIP_RECOMMENDATION_VERSION,
      registryVersion: RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION,
      generatedAt: new Date().toISOString(),
      candidateCountEvaluated: raw.length,
      truncated,
    };
  }

  private async addSharedContextEvidence(
    sourceNodeId: string,
    sourceKind: RecommendationSourceKind,
    contextKind: NodeKind,
    edgeKinds: string[],
    excluded: Set<string>,
    buckets: Map<string, EvidenceBucket>,
  ): Promise<void> {
    const src = getRecommendationSource(sourceKind);
    if (!src || !src.enabled) return;
    if (buckets.size >= RECO_MAX_CANDIDATE_POOL) return;

    // Contexts that the source is part of (e.g. companies where source WORKS_FOR).
    const contextIds = await this.repo.neighborIds(sourceNodeId, {
      edgeKinds,
      nodeKinds: [contextKind],
    });
    if (contextIds.length === 0) return;

    // Other people connected to those contexts via the same edge kind.
    const perContext = Math.max(
      4,
      Math.floor(src.maximumCandidates / Math.max(1, contextIds.length)),
    );
    const peopleByCtx = await this.repo.batchNeighborIds(contextIds, {
      edgeKinds,
      nodeKinds: src.candidateNodeKinds.slice() as NodeKind[],
      perNodeCap: Math.min(perContext, 50),
    });
    for (const [ctxId, people] of peopleByCtx) {
      for (const pid of people) {
        if (excluded.has(pid)) continue;
        const bucket = buckets.get(pid);
        // NB: addEvidence via inline to reuse examplesPerSource
        if (bucket) {
          bucket.evidence.push({ sourceKind, count: 1 });
          const list = bucket.examplesPerSource.get(sourceKind) ?? [];
          if (list.length < RECO_MAX_REASON_EXAMPLES && !list.includes(ctxId)) {
            list.push(ctxId);
            bucket.examplesPerSource.set(sourceKind, list);
          }
        } else {
          buckets.set(pid, {
            candidateNodeId: pid,
            evidence: [{ sourceKind, count: 1 }],
            examplesPerSource: new Map([[sourceKind, [ctxId]]]),
          });
        }
        if (buckets.size >= RECO_MAX_CANDIDATE_POOL) return;
      }
    }
  }
}

export { GraphError };
