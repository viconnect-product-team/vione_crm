// BC-4.3 — Strength Service (server-only). Orchestrates registry, repo, engine.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "../errors";
import { emitGraphTelemetry } from "../telemetry";
import { computeStrength } from "./engine";
import { StrengthRepository, foldObservations } from "./strength.repository.server";
import { RELATIONSHIP_STRENGTH_VERSION, type RelationshipStrengthResult } from "./types";

export interface RelationshipStrengthInput {
  sourceNodeId: string;
  targetNodeId: string;
  scoringVersion?: string;
}

export class RelationshipStrengthService {
  private readonly repo: StrengthRepository;
  constructor(
    sb: SupabaseClient,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new StrengthRepository(sb);
  }

  async relationshipStrength(
    input: RelationshipStrengthInput,
  ): Promise<RelationshipStrengthResult> {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    if (input.scoringVersion && input.scoringVersion !== RELATIONSHIP_STRENGTH_VERSION) {
      emitGraphTelemetry({ event: "graph_strength_version_mismatch" });
      throw graphErr("STRENGTH_VERSION_UNSUPPORTED");
    }
    if (input.sourceNodeId === input.targetNodeId) {
      throw graphErr("STRENGTH_SIGNAL_INVALID");
    }

    const canSee = await this.repo.canSeeBothNodes(input.sourceNodeId, input.targetNodeId);
    if (!canSee) {
      emitGraphTelemetry({
        event: "graph_strength_query_denied",
        errorCode: "STRENGTH_PRIVACY_RESTRICTED",
      });
      throw graphErr("STRENGTH_PRIVACY_RESTRICTED");
    }

    const [edges, events] = await Promise.all([
      this.repo.loadPairEdges(input.sourceNodeId, input.targetNodeId),
      this.repo.loadPairTimeline(input.sourceNodeId, input.targetNodeId),
    ]);
    const observations = foldObservations({
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      edges,
      events,
    });
    const result = computeStrength({
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      observations,
    });

    emitGraphTelemetry({
      event: "graph_strength_computed",
      count: result.contributions.length,
    });
    return result;
  }
}
