// BC-4.3 — Strength Repository (server-only).
// RLS-filtered reads only. No product logic. Bounded lookback.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "../errors";
import type { StrengthSignalObservation, StrengthSignalKind } from "./types";

/** Maximum timeline events considered per pair per lookup. */
export const STRENGTH_MAX_TIMELINE_EVENTS = 500;
/** Maximum lookback in days for timeline signals. */
export const STRENGTH_TIMELINE_LOOKBACK_DAYS = 730;

/** Event kinds we treat as strength signals in the timeline. */
const TIMELINE_SIGNAL_KINDS: readonly string[] = [
  "MET",
  "MESSAGED",
  "ATTENDED",
  "CHECKED_IN",
  "INTRODUCED",
  "REFERRED",
  "PURCHASED",
  "SOLD",
];

/** Edge kinds we treat as strength signals (steady-state). */
const EDGE_SIGNAL_KINDS: readonly string[] = [
  "CONNECTED_TO",
  "SAVED_CARD",
  "WORKS_FOR",
  "MEMBER_OF",
];

export class StrengthRepository {
  constructor(private readonly sb: SupabaseClient) {}

  /**
   * Load RLS-visible edges directly between (a,b). Symmetric edges match
   * either orientation; directional edges preserve source→target.
   */
  async loadPairEdges(
    a: string,
    b: string,
  ): Promise<
    Array<{ edge_kind: string; source_node_id: string; target_node_id: string; created_at: string }>
  > {
    const { data, error } = await this.sb
      .from("graph_edges")
      .select("edge_kind,source_node_id,target_node_id,created_at,status,archived_at")
      .in("edge_kind", EDGE_SIGNAL_KINDS)
      .eq("status", "active")
      .is("archived_at", null)
      .or(
        `and(source_node_id.eq.${a},target_node_id.eq.${b}),and(source_node_id.eq.${b},target_node_id.eq.${a})`,
      )
      .limit(200);
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data ?? []) as never;
  }

  /**
   * Load RLS-visible timeline events involving both nodes as subject/related
   * (either orientation), bounded by lookback + row cap.
   */
  async loadPairTimeline(
    a: string,
    b: string,
  ): Promise<
    Array<{
      event_kind: string;
      occurred_at: string;
      subject_node_id: string;
      related_node_id: string | null;
    }>
  > {
    const since = new Date(Date.now() - STRENGTH_TIMELINE_LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data, error } = await this.sb
      .from("graph_timeline_events")
      .select("event_kind,occurred_at,subject_node_id,related_node_id")
      .in("event_kind", TIMELINE_SIGNAL_KINDS)
      .is("archived_at", null)
      .gte("occurred_at", since)
      .or(
        `and(subject_node_id.eq.${a},related_node_id.eq.${b}),and(subject_node_id.eq.${b},related_node_id.eq.${a})`,
      )
      .order("occurred_at", { ascending: false })
      .limit(STRENGTH_MAX_TIMELINE_EVENTS);
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data ?? []) as never;
  }

  /** Verify the viewer can see both endpoint nodes (RLS gate). */
  async canSeeBothNodes(a: string, b: string): Promise<boolean> {
    const { data, error } = await this.sb.from("graph_nodes").select("id").in("id", [a, b]);
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data?.length ?? 0) === 2;
  }
}

/**
 * Fold RLS-filtered rows into per-signal observations. Directional signals
 * are recorded separately per orientation; the pure engine treats them
 * source→target for the requested pair.
 */
export function foldObservations(args: {
  sourceNodeId: string;
  targetNodeId: string;
  edges: Array<{
    edge_kind: string;
    source_node_id: string;
    target_node_id: string;
    created_at: string;
  }>;
  events: Array<{
    event_kind: string;
    occurred_at: string;
    subject_node_id: string;
    related_node_id: string | null;
  }>;
}): StrengthSignalObservation[] {
  const acc = new Map<StrengthSignalKind, { count: number; lastAt?: string }>();
  const bump = (k: StrengthSignalKind, at?: string) => {
    const prev = acc.get(k);
    if (!prev) {
      acc.set(k, { count: 1, lastAt: at });
      return;
    }
    const lastAt = prev.lastAt && at ? (prev.lastAt >= at ? prev.lastAt : at) : (prev.lastAt ?? at);
    acc.set(k, { count: prev.count + 1, lastAt });
  };

  const DIRECTIONAL: readonly string[] = [
    "SAVED_CARD",
    "INTRODUCED",
    "REFERRED",
    "PURCHASED",
    "SOLD",
  ];

  for (const e of args.edges) {
    if (DIRECTIONAL.includes(e.edge_kind)) {
      if (e.source_node_id === args.sourceNodeId && e.target_node_id === args.targetNodeId) {
        bump(e.edge_kind as StrengthSignalKind, e.created_at);
      }
      // opposite direction ignored for directional signals
    } else {
      bump(e.edge_kind as StrengthSignalKind, e.created_at);
    }
  }
  for (const ev of args.events) {
    if (DIRECTIONAL.includes(ev.event_kind)) {
      if (ev.subject_node_id === args.sourceNodeId && ev.related_node_id === args.targetNodeId) {
        bump(ev.event_kind as StrengthSignalKind, ev.occurred_at);
      }
    } else {
      bump(ev.event_kind as StrengthSignalKind, ev.occurred_at);
    }
  }

  return [...acc.entries()].map(([signalKind, v]) => ({
    signalKind,
    count: v.count,
    lastAt: v.lastAt,
  }));
}
