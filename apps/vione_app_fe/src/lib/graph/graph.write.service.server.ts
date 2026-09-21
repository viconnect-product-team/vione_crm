// BC-4.2 — Relationship Graph Engine — Write & timeline service (server-only).
// Owns write orchestration: registry validation, metadata allowlist projection,
// scope resolution, actor identity, error normalization. The Repository handles
// persistence via approved SECURITY DEFINER RPCs.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr, GraphError } from "./errors";
import { graphRegistry } from "./registry";
import { validateAndProject } from "./metadata";
import { mapNode } from "./dto";
import { emitGraphTelemetry } from "./telemetry";
import {
  RelationshipGraphWriteRepository,
  type TimelineRow,
} from "./graph.write.repository.server";
import { RelationshipGraphRepository, REPO_LIMITS } from "./graph.repository.server";
import type { EdgeKind, GraphNodeDTO, NodeKind, TenantScopeType, VisibilityClass } from "./types";
import type {
  GraphTimelineEventDTO,
  PairTimelineQuery,
  TimelinePage,
  TimelineQuery,
} from "./timeline.types";

export interface RegisterNodeInput {
  nodeKind: NodeKind;
  externalRefType: string;
  externalRefId: string;
  visibility?: VisibilityClass;
  tenantScopeType?: TenantScopeType;
  tenantScopeId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateEdgeInput {
  edgeKind: EdgeKind;
  sourceNodeId: string;
  targetNodeId: string;
  visibility?: VisibilityClass;
  tenantScopeType?: TenantScopeType;
  tenantScopeId?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
}

export class RelationshipGraphWriteService {
  private readonly writes: RelationshipGraphWriteRepository;
  private readonly reads: RelationshipGraphRepository;

  constructor(
    sb: SupabaseClient,
    private readonly viewerUserId: string | null,
  ) {
    this.writes = new RelationshipGraphWriteRepository(sb);
    this.reads = new RelationshipGraphRepository(sb);
  }

  private requireViewer(): string {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    return this.viewerUserId;
  }

  async registerNode(input: RegisterNodeInput): Promise<GraphNodeDTO> {
    this.requireViewer();
    const reg = graphRegistry.getNode(input.nodeKind);
    if (!reg) throw graphErr("INVALID_NODE_KIND", undefined, { kind: input.nodeKind });
    if (reg.externalRefType !== input.externalRefType) {
      throw graphErr("METADATA_INVALID", undefined, { field: "externalRefType" });
    }
    if (!input.externalRefId?.trim()) {
      throw graphErr("METADATA_INVALID", undefined, { field: "externalRefId" });
    }
    const visibility = input.visibility ?? reg.visibilityDefault;
    if (visibility === "system") throw graphErr("VISIBILITY_INVALID");

    const metadata = validateAndProject(input.metadata, reg.metadataAllowlist);
    const nodeId = await this.writes.registerNode({
      nodeKind: input.nodeKind,
      externalRefType: input.externalRefType,
      externalRefId: input.externalRefId,
      tenantScopeType: input.tenantScopeType ?? "global",
      tenantScopeId: input.tenantScopeId ?? null,
      visibility,
      metadata,
      registryVersion: reg.version,
    });
    emitGraphTelemetry({ event: "graph_node_registered", nodeKind: input.nodeKind });
    const row = await this.reads.getNode(nodeId);
    if (!row) throw graphErr("INTERNAL_ERROR");
    return mapNode(row);
  }

  async resolveOrRegisterNode(input: RegisterNodeInput): Promise<GraphNodeDTO> {
    // registerNode is already idempotent in the DB; alias for clarity.
    return this.registerNode(input);
  }

  async createEdge(input: CreateEdgeInput): Promise<{ edgeId: string; replayed: boolean }> {
    this.requireViewer();
    const reg = graphRegistry.getEdge(input.edgeKind);
    if (!reg) throw graphErr("INVALID_EDGE_KIND", undefined, { kind: input.edgeKind });
    if (input.sourceNodeId === input.targetNodeId && !reg.allowSelfEdge) {
      throw graphErr("SELF_EDGE_FORBIDDEN");
    }

    // Endpoint kind validation
    const [srcRow, tgtRow] = await Promise.all([
      this.reads.getNode(input.sourceNodeId),
      this.reads.getNode(input.targetNodeId),
    ]);
    if (!srcRow) throw graphErr("SOURCE_NODE_NOT_FOUND");
    if (!tgtRow) throw graphErr("TARGET_NODE_NOT_FOUND");
    if (!reg.fromKinds.includes(srcRow.node_kind)) {
      throw graphErr("INVALID_EDGE_KIND", undefined, { reason: "source_kind" });
    }
    if (!reg.toKinds.includes(tgtRow.node_kind)) {
      throw graphErr("INVALID_EDGE_KIND", undefined, { reason: "target_kind" });
    }

    const visibility = input.visibility ?? reg.visibilityDefault;
    if (visibility === "system") throw graphErr("VISIBILITY_INVALID");

    const metadata = validateAndProject(input.metadata, reg.metadataAllowlist);

    // Detect replay before write (best-effort — RPC is authoritative).
    let replayed = false;
    if (input.idempotencyKey) {
      // Not strictly needed; RPC returns existing id transparently.
      replayed = false;
    }

    const edgeId = await this.writes.createEdge({
      edgeKind: input.edgeKind,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      directionality: reg.directionality,
      visibility,
      tenantScopeType: input.tenantScopeType ?? "global",
      tenantScopeId: input.tenantScopeId ?? null,
      metadata,
      registryVersion: reg.version,
      idempotencyKey: input.idempotencyKey ?? null,
      timelineEmit: reg.timeline,
      timelineSummaryKey: `graph.timeline.${input.edgeKind.toLowerCase()}`,
    });
    emitGraphTelemetry({ event: "graph_edge_created", edgeKind: input.edgeKind });
    return { edgeId, replayed };
  }

  async connect(input: {
    sourceNodeId: string;
    targetNodeId: string;
    idempotencyKey?: string | null;
  }): Promise<{ edgeId: string }> {
    return this.createEdge({
      edgeKind: "CONNECTED_TO",
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      idempotencyKey: input.idempotencyKey ?? null,
    });
  }

  async disconnect(edgeId: string): Promise<void> {
    this.requireViewer();
    await this.writes.archiveEdge(edgeId);
    emitGraphTelemetry({ event: "graph_edge_archived" });
  }

  async archiveEdge(edgeId: string): Promise<void> {
    this.requireViewer();
    await this.writes.archiveEdge(edgeId);
    emitGraphTelemetry({ event: "graph_edge_archived" });
  }
  async restoreEdge(edgeId: string): Promise<void> {
    this.requireViewer();
    await this.writes.restoreEdge(edgeId);
    emitGraphTelemetry({ event: "graph_edge_restored" });
  }
  async updateEdgeMetadata(edgeId: string, patch: Record<string, unknown>): Promise<void> {
    this.requireViewer();
    // Fetch to resolve allowlist by edge kind
    const row = await this.reads.getEdge(edgeId);
    if (!row) throw graphErr("EDGE_NOT_FOUND");
    const reg = graphRegistry.getEdge(row.edge_kind);
    if (!reg) throw graphErr("KIND_NOT_REGISTERED");
    const metadata = validateAndProject(patch, reg.metadataAllowlist);
    await this.writes.updateEdgeMetadata(edgeId, metadata);
    emitGraphTelemetry({ event: "graph_edge_metadata_updated" });
  }

  // ── Timeline reads ──
  private validateLimit(limit?: number): number {
    const n = limit ?? REPO_LIMITS.defaultLimit;
    return Math.min(Math.max(n, 1), REPO_LIMITS.maxLimit);
  }

  private mapTimelineRow(row: TimelineRow): GraphTimelineEventDTO {
    const reg = graphRegistry.getEdge(row.event_kind);
    const metadata = validateAndProject(row.metadata, reg?.metadataAllowlist ?? []);
    return {
      id: row.id,
      eventKind: row.event_kind,
      subjectNodeId: row.subject_node_id,
      relatedNodeId: row.related_node_id,
      edgeId: row.edge_id,
      actorNodeId: row.actor_node_id,
      visibility: row.visibility_class as VisibilityClass,
      summaryKey: row.summary_key,
      metadata,
      occurredAt: row.occurred_at,
      dedupeKey: row.dedupe_key,
      collapseKey: row.collapse_key,
    };
  }

  async timeline(q: TimelineQuery): Promise<TimelinePage> {
    this.requireViewer();
    const limit = this.validateLimit(q.limit);
    const res = await this.writes.listTimeline({
      subjectOrRelatedNodeId: q.nodeId,
      eventKinds: q.eventKinds,
      cursor: q.cursor ?? null,
      limit,
    });
    emitGraphTelemetry({ event: "graph_timeline_queried", count: res.rows.length });
    return { items: res.rows.map((r: any) => this.mapTimelineRow(r)), nextCursor: res.nextCursor };
  }

  async pairTimeline(q: PairTimelineQuery): Promise<TimelinePage> {
    this.requireViewer();
    const limit = this.validateLimit(q.limit);
    const res = await this.writes.listTimeline({
      pairNodeIds: [q.nodeA, q.nodeB],
      eventKinds: q.eventKinds,
      cursor: q.cursor ?? null,
      limit,
    });
    emitGraphTelemetry({ event: "graph_timeline_queried", count: res.rows.length });
    return { items: res.rows.map((r: any) => this.mapTimelineRow(r)), nextCursor: res.nextCursor };
  }

  async history(q: TimelineQuery): Promise<TimelinePage> {
    // Alias — history is subject-scoped timeline
    return this.timeline({ ...q, nodeId: q.nodeId });
  }

  // BC-7.5B — Direct by-id timeline read. RLS on graph_timeline_events
  // still governs visibility; this method only removes the scan overhead.
  async getTimelineEventById(eventId: string): Promise<GraphTimelineEventDTO | null> {
    this.requireViewer();
    const row = await this.writes.getTimelineEventById(eventId);
    if (!row) return null;
    return this.mapTimelineRow(row);
  }

  // BC-RC1 (M-05) — Sanctioned read-only passthrough for person-node
  // resolution by external ref. Server consumers (e.g. person-journey) use
  // this entrypoint instead of importing the raw repository internals.
  // SELECT-only; registerNode is never reachable through this method.
  async findPersonNodeByExternalRef(externalRefId: string): Promise<{ id: string } | null> {
    const row = await this.reads.findNodeByExternalRef("person", "user_profile", externalRefId);
    return row ? { id: row.id } : null;
  }
}

export { GraphError };
