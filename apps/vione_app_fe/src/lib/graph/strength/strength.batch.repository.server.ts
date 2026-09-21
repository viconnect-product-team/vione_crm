// BC-6.1 — Strength batch repository. RLS-filtered pair-wise strength hydration
// in bounded round trips for Smart Introduction path scoring.
//
// Contract: given a set of unique node pairs (unordered), return a map from
// canonical pair-key ("min|max") to the folded RelationshipStrengthResult.
// Missing/private pairs are absent from the map — callers substitute a neutral
// fallback and MUST mark the hop as unavailable so downstream reason gating
// suppresses "STRONG_*" evidence for that hop.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "../errors";
import { computeStrength } from "./engine";
import {
  STRENGTH_MAX_TIMELINE_EVENTS,
  STRENGTH_TIMELINE_LOOKBACK_DAYS,
  foldObservations,
} from "./strength.repository.server";
import type { RelationshipStrengthResult } from "./types";

const EDGE_SIGNAL_KINDS = ["CONNECTED_TO", "SAVED_CARD", "WORKS_FOR", "MEMBER_OF"];
const TIMELINE_SIGNAL_KINDS = [
  "MET",
  "MESSAGED",
  "ATTENDED",
  "CHECKED_IN",
  "INTRODUCED",
  "REFERRED",
  "PURCHASED",
  "SOLD",
];

export const STRENGTH_BATCH_MAX_PAIRS = 200;

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export interface PairInput {
  a: string;
  b: string;
}

export async function batchLoadPairStrengths(
  sb: SupabaseClient,
  pairsIn: PairInput[],
): Promise<Map<string, RelationshipStrengthResult>> {
  const out = new Map<string, RelationshipStrengthResult>();
  if (pairsIn.length === 0) return out;

  // Dedupe by canonical key.
  const uniq = new Map<string, PairInput>();
  for (const p of pairsIn) {
    if (!p.a || !p.b || p.a === p.b) continue;
    const k = pairKey(p.a, p.b);
    if (!uniq.has(k)) uniq.set(k, { a: p.a, b: p.b });
  }
  const pairs = [...uniq.values()].slice(0, STRENGTH_BATCH_MAX_PAIRS);
  if (pairs.length === 0) return out;

  const nodeIds = [...new Set(pairs.flatMap((p) => [p.a, p.b]))];
  const csv = nodeIds.join(",");
  const since = new Date(Date.now() - STRENGTH_TIMELINE_LOOKBACK_DAYS * 86_400_000).toISOString();

  // Two batched queries total (edges + timeline) regardless of pair count.
  const [edgesRes, evRes] = await Promise.all([
    sb
      .from("graph_edges")
      .select("edge_kind,source_node_id,target_node_id,created_at,status,archived_at")
      .in("edge_kind", EDGE_SIGNAL_KINDS)
      .eq("status", "active")
      .is("archived_at", null)
      .or(`source_node_id.in.(${csv}),target_node_id.in.(${csv})`)
      .limit(Math.min(4000, pairs.length * 20)),
    sb
      .from("graph_timeline_events")
      .select("event_kind,occurred_at,subject_node_id,related_node_id")
      .in("event_kind", TIMELINE_SIGNAL_KINDS)
      .is("archived_at", null)
      .gte("occurred_at", since)
      .or(`subject_node_id.in.(${csv}),related_node_id.in.(${csv})`)
      .order("occurred_at", { ascending: false })
      .limit(Math.min(STRENGTH_MAX_TIMELINE_EVENTS * 4, pairs.length * 100)),
  ]);
  if (edgesRes.error || evRes.error) throw graphErr("INTERNAL_ERROR");
  const edges = (edgesRes.data ?? []) as Array<{
    edge_kind: string;
    source_node_id: string;
    target_node_id: string;
    created_at: string;
  }>;
  const events = (evRes.data ?? []) as Array<{
    event_kind: string;
    occurred_at: string;
    subject_node_id: string;
    related_node_id: string | null;
  }>;

  // Fold per pair in-memory.
  for (const p of pairs) {
    const k = pairKey(p.a, p.b);
    const pairEdges = edges.filter(
      (e) =>
        (e.source_node_id === p.a && e.target_node_id === p.b) ||
        (e.source_node_id === p.b && e.target_node_id === p.a),
    );
    const pairEvents = events.filter(
      (e) =>
        (e.subject_node_id === p.a && e.related_node_id === p.b) ||
        (e.subject_node_id === p.b && e.related_node_id === p.a),
    );
    if (pairEdges.length === 0 && pairEvents.length === 0) continue;
    const obs = foldObservations({
      sourceNodeId: p.a,
      targetNodeId: p.b,
      edges: pairEdges,
      events: pairEvents,
    });
    const result = computeStrength({
      sourceNodeId: p.a,
      targetNodeId: p.b,
      observations: obs,
    });
    out.set(k, result);
  }
  return out;
}
