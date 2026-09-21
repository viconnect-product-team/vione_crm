// BC-4.2 — Relationship Graph Engine — Write & timeline repository (server-only).
// Thin wrapper over the approved SECURITY DEFINER RPCs. No product logic.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr, graphErrorFromPg } from "./errors";
import type { GraphMetadata, EdgeKind, VisibilityClass, TenantScopeType, NodeKind } from "./types";
import type { GraphEdgeRow, GraphNodeRow } from "./dto";

const TIMELINE_ROW_SELECT =
  "id,event_kind,subject_node_id,related_node_id,edge_id,actor_node_id,visibility_class,summary_key,metadata,registry_version,occurred_at,dedupe_key,collapse_key,archived_at";

export interface TimelineRow {
  id: string;
  event_kind: string;
  subject_node_id: string;
  related_node_id: string | null;
  edge_id: string | null;
  actor_node_id: string | null;
  visibility_class: string;
  summary_key: string;
  metadata: Record<string, unknown> | null;
  registry_version: number;
  occurred_at: string;
  dedupe_key: string | null;
  collapse_key: string | null;
  archived_at: string | null;
}

export class RelationshipGraphWriteRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async registerNode(input: {
    nodeKind: NodeKind;
    externalRefType: string;
    externalRefId: string;
    tenantScopeType: TenantScopeType;
    tenantScopeId: string | null;
    visibility: VisibilityClass;
    metadata: GraphMetadata;
    registryVersion: number;
  }): Promise<string> {
    const { data, error } = await this.sb.rpc("graph_register_node", {
      _node_kind: input.nodeKind,
      _external_ref_type: input.externalRefType,
      _external_ref_id: input.externalRefId,
      _tenant_scope_type: input.tenantScopeType,
      _tenant_scope_id: input.tenantScopeId,
      _visibility_class: input.visibility,
      _metadata: input.metadata as unknown as Record<string, unknown>,
      _registry_version: input.registryVersion,
    });
    if (error) throw graphErrorFromPg(error);
    if (typeof data !== "string") throw graphErr("INTERNAL_ERROR");
    return data;
  }

  async archiveNode(nodeId: string): Promise<void> {
    const { error } = await this.sb.rpc("graph_archive_node", { _node_id: nodeId });
    if (error) throw graphErrorFromPg(error);
  }
  async restoreNode(nodeId: string): Promise<void> {
    const { error } = await this.sb.rpc("graph_restore_node", { _node_id: nodeId });
    if (error) throw graphErrorFromPg(error);
  }

  async createEdge(input: {
    edgeKind: EdgeKind;
    sourceNodeId: string;
    targetNodeId: string;
    directionality: "directed" | "undirected";
    visibility: VisibilityClass;
    tenantScopeType: TenantScopeType;
    tenantScopeId: string | null;
    metadata: GraphMetadata;
    registryVersion: number;
    idempotencyKey: string | null;
    timelineEmit: boolean;
    timelineSummaryKey: string | null;
  }): Promise<string> {
    const { data, error } = await this.sb.rpc("graph_create_edge", {
      _edge_kind: input.edgeKind,
      _source_node_id: input.sourceNodeId,
      _target_node_id: input.targetNodeId,
      _directionality: input.directionality,
      _visibility_class: input.visibility,
      _tenant_scope_type: input.tenantScopeType,
      _tenant_scope_id: input.tenantScopeId,
      _metadata: input.metadata as unknown as Record<string, unknown>,
      _registry_version: input.registryVersion,
      _idempotency_key: input.idempotencyKey,
      _timeline_emit: input.timelineEmit,
      _timeline_summary_key: input.timelineSummaryKey,
    });
    if (error) throw graphErrorFromPg(error);
    if (typeof data !== "string") throw graphErr("INTERNAL_ERROR");
    return data;
  }

  async archiveEdge(edgeId: string): Promise<void> {
    const { error } = await this.sb.rpc("graph_archive_edge", { _edge_id: edgeId });
    if (error) throw graphErrorFromPg(error);
  }
  async restoreEdge(edgeId: string): Promise<void> {
    const { error } = await this.sb.rpc("graph_restore_edge", { _edge_id: edgeId });
    if (error) throw graphErrorFromPg(error);
  }
  async updateEdgeMetadata(edgeId: string, metadata: GraphMetadata): Promise<void> {
    const { error } = await this.sb.rpc("graph_update_edge_metadata", {
      _edge_id: edgeId,
      _metadata: metadata as unknown as Record<string, unknown>,
    });
    if (error) throw graphErrorFromPg(error);
  }

  async findActiveEdge(
    edgeKind: EdgeKind,
    sourceNodeId: string,
    targetNodeId: string,
  ): Promise<GraphEdgeRow | null> {
    const { data, error } = await this.sb
      .from("graph_edges")
      .select("*")
      .eq("edge_kind", edgeKind)
      .eq("source_node_id", sourceNodeId)
      .eq("target_node_id", targetNodeId)
      .eq("status", "active")
      .is("archived_at", null)
      .maybeSingle();
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphEdgeRow | null) ?? null;
  }

  async findNodeByExternalRef(
    nodeKind: NodeKind,
    externalRefType: string,
    externalRefId: string,
  ): Promise<GraphNodeRow | null> {
    const { data, error } = await this.sb
      .from("graph_nodes")
      .select("*")
      .eq("node_kind", nodeKind)
      .eq("external_ref_type", externalRefType)
      .eq("external_ref_id", externalRefId)
      .maybeSingle();
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphNodeRow | null) ?? null;
  }

  // ── Timeline reads (cursor over occurred_at DESC, id DESC) ──
  async listTimeline(input: {
    subjectNodeId?: string;
    subjectOrRelatedNodeId?: string;
    pairNodeIds?: [string, string];
    eventKinds?: EdgeKind[];
    cursor?: string | null;
    limit: number;
  }): Promise<{ rows: TimelineRow[]; nextCursor: string | null }> {
    let q = this.sb
      .from("graph_timeline_events")
      .select(TIMELINE_ROW_SELECT)
      .is("archived_at", null)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(input.limit + 1);

    if (input.subjectNodeId) q = q.eq("subject_node_id", input.subjectNodeId);
    if (input.subjectOrRelatedNodeId) {
      q = q.or(
        `subject_node_id.eq.${input.subjectOrRelatedNodeId},related_node_id.eq.${input.subjectOrRelatedNodeId}`,
      );
    }
    if (input.pairNodeIds) {
      const [a, b] = input.pairNodeIds;
      q = q.or(
        `and(subject_node_id.eq.${a},related_node_id.eq.${b}),and(subject_node_id.eq.${b},related_node_id.eq.${a})`,
      );
    }
    if (input.eventKinds?.length) q = q.in("event_kind", input.eventKinds);

    // Cursor: base64 JSON { o: occurred_at, i: id }
    if (input.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(input.cursor, "base64").toString("utf8")) as {
          o?: string;
          i?: string;
        };
        if (!decoded?.o || !decoded?.i) throw graphErr("INVALID_CURSOR");
        // Keyset: (occurred_at, id) < (o, i)
        q = q.or(`occurred_at.lt.${decoded.o},and(occurred_at.eq.${decoded.o},id.lt.${decoded.i})`);
      } catch {
        throw graphErr("INVALID_CURSOR");
      }
    }

    const { data, error } = await q;
    if (error) throw graphErr("INTERNAL_ERROR");
    const rows = (data ?? []) as TimelineRow[];
    const truncated = rows.length > input.limit;
    const page = truncated ? rows.slice(0, input.limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      truncated && last
        ? Buffer.from(JSON.stringify({ o: last.occurred_at, i: last.id })).toString("base64")
        : null;
    return { rows: page, nextCursor };
  }

  // BC-7.5B — Direct by-id timeline read (SECURITY INVOKER RPC).
  async getTimelineEventById(eventId: string): Promise<TimelineRow | null> {
    const { data, error } = await this.sb.rpc("graph_timeline_event_get", {
      _event_id: eventId,
    });
    if (error) throw graphErr("INTERNAL_ERROR");
    const rows = (data ?? []) as TimelineRow[];
    return rows[0] ?? null;
  }
}
