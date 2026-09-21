// BC-7.5B — Relationship Timeline Projection Consumer.
//
// Reads pending rows from `graph_outbox_events` for the Introduction
// Delivery, Introduction Outcome, and Business Meeting lifecycle event
// kinds and projects them into `graph_timeline_events` via the frozen
// `graph_record_timeline_event` RPC. Idempotent by construction:
//
//   - Outbox emitters use deterministic `idempotency_key`s per logical event,
//     so replays never enqueue duplicates.
//   - Each projected timeline row carries `dedupe_key = 'outbox:<event_id>'`,
//     and `graph_record_timeline_event` swallows duplicates on that key.
//
// The consumer never mutates source-domain tables, never creates new graph
// edges, and never widens visibility. Metadata is projected through the
// per-kind allowlist inside the SQL layer.

import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

interface OutboxRow {
  id: string;
  event_kind: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  attempt_count: number;
}

export interface ProjectionReport {
  claimed: number;
  projected: number;
  skipped: number;
  failed: number;
  perKind: Record<string, number>;
}

const RELEVANT_KINDS = [
  "INTRO_DELIVERY_CREATED",
  "INTRO_DELIVERY_DELIVERED",
  "INTRO_DELIVERY_ACKNOWLEDGED",
  "INTRO_DELIVERY_DECLINED",
  "INTRO_DELIVERY_EXPIRED",
  "INTRO_OUTCOME_CREATED",
  "INTRO_OUTCOME_CONNECTED",
  "INTRO_OUTCOME_PROGRESSING",
  "INTRO_OUTCOME_CLOSED_SUCCESS",
  "INTRO_OUTCOME_CLOSED_NO_FIT",
  "INTRO_OUTCOME_CLOSED_LOST",
  "MEETING_CREATED",
  "MEETING_PROPOSED",
  "MEETING_CONFIRMED",
  "MEETING_COMPLETED",
  "MEETING_CANCELLED",
  "MEETING_RESCHEDULED",
  "MEETING_DECLINED",
];

const CONNECT_SCHEMA_SCALAR_KEYS = [
  "introductionRequestId",
  "requesterPersonNodeId",
  "intermediaryPersonNodeId",
  "targetPersonNodeId",
  "meetingId",
  "meetingType",
  "status",
] as const;

function projectMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of CONNECT_SCHEMA_SCALAR_KEYS) {
    const v = raw[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return out;
}

interface ProjectionTarget {
  subjectNodeId: string;
  relatedNodeId: string | null;
  actorNodeId: string | null;
  visibility: "private" | "connected" | "association";
  tenantScopeType: "global" | "association" | "tenant";
  tenantScopeId: string | null;
}

function deriveTarget(
  aggregate: string,
  payload: Record<string, unknown>,
): ProjectionTarget | null {
  const requester =
    typeof payload.requesterPersonNodeId === "string"
      ? (payload.requesterPersonNodeId as string)
      : null;
  const intermediary =
    typeof payload.intermediaryPersonNodeId === "string"
      ? (payload.intermediaryPersonNodeId as string)
      : null;
  const target =
    typeof payload.targetPersonNodeId === "string" ? (payload.targetPersonNodeId as string) : null;

  if (aggregate === "introduction_delivery") {
    if (!intermediary || !target) return null;
    return {
      subjectNodeId: intermediary,
      relatedNodeId: target,
      actorNodeId: intermediary,
      visibility: "private",
      tenantScopeType: "global",
      tenantScopeId: null,
    };
  }
  if (aggregate === "introduction_outcome") {
    if (!requester || !target) return null;
    return {
      subjectNodeId: requester,
      relatedNodeId: target,
      actorNodeId: requester,
      visibility: "private",
      tenantScopeType: "global",
      tenantScopeId: null,
    };
  }
  if (aggregate === "business_meeting") {
    // Meetings fan out through participants; the projection stores a single
    // organizer-scoped row here. Per-participant fan-out is intentionally
    // deferred (see RELATIONSHIP_TIMELINE_PROJECTION.md).
    return null;
  }
  return null;
}

export class RelationshipTimelineProjectionConsumer {
  constructor(private readonly sb: DB) {}

  async consumeBatch(batch = 100): Promise<ProjectionReport> {
    const report: ProjectionReport = {
      claimed: 0,
      projected: 0,
      skipped: 0,
      failed: 0,
      perKind: {},
    };

    const { data, error } = await this.sb
      .from("graph_outbox_events")
      .select("id,event_kind,aggregate_type,aggregate_id,payload,occurred_at,attempt_count")
      .is("processed_at", null)
      .in("event_kind", RELEVANT_KINDS)
      .lte("available_at", new Date().toISOString())
      .order("available_at", { ascending: true })
      .limit(batch);

    if (error) throw new Error(`projection_claim_failed:${error.code ?? "?"}`);
    const rows = (data ?? []) as OutboxRow[];
    report.claimed = rows.length;

    for (const row of rows) {
      try {
        const target = deriveTarget(row.aggregate_type, row.payload ?? {});
        if (!target) {
          await this.markProcessed(row.id);
          report.skipped += 1;
          continue;
        }
        const summaryKey = `graph.timeline.${row.event_kind.toLowerCase()}`;
        const metadata = projectMetadata(row.payload ?? {});
        const { error: rpcErr } = await this.sb.rpc("graph_record_timeline_event", {
          _event_kind: row.event_kind,
          _subject_node_id: target.subjectNodeId,
          _related_node_id: target.relatedNodeId,
          _edge_id: null,
          _actor_node_id: target.actorNodeId,
          _actor_user_id: null,
          _tenant_scope_type: target.tenantScopeType,
          _tenant_scope_id: target.tenantScopeId,
          _visibility_class: target.visibility,
          _summary_key: summaryKey,
          _metadata: metadata as never,
          _registry_version: 1,
          _dedupe_key: `outbox:${row.id}`,
          _collapse_key: null,
        });
        if (rpcErr) throw new Error(`rpc:${rpcErr.code ?? "?"}`);
        await this.markProcessed(row.id);
        report.projected += 1;
        report.perKind[row.event_kind] = (report.perKind[row.event_kind] ?? 0) + 1;
      } catch {
        await this.releaseWithBackoff(row).catch(() => undefined);
        report.failed += 1;
      }
    }
    return report;
  }

  private async markProcessed(id: string) {
    await this.sb
      .from("graph_outbox_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", id);
  }

  private async releaseWithBackoff(row: OutboxRow) {
    const next = new Date(Date.now() + Math.min(60_000 * 2 ** row.attempt_count, 3_600_000));
    await this.sb
      .from("graph_outbox_events")
      .update({
        available_at: next.toISOString(),
        attempt_count: row.attempt_count + 1,
      })
      .eq("id", row.id);
  }
}
