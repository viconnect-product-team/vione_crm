// BC-6.1 — Shared context resolver for Smart Introduction.
// Given a set of person node ids, batch-load the context nodes each person is
// affiliated with via WORKS_FOR/MEMBER_OF/ATTENDED (Company/Association/
// Community/Event/Meeting). Purely RLS-filtered — invisible affiliations
// simply don't appear. Two queries total.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "../errors";

export type SharedContextKind =
  | "SAME_COMPANY_CONTEXT"
  | "SAME_ASSOCIATION"
  | "SHARED_COMMUNITY"
  | "SHARED_EVENT";

const EDGE_TO_KIND: Record<string, SharedContextKind> = {
  WORKS_FOR: "SAME_COMPANY_CONTEXT",
  MEMBER_OF_ASSOCIATION: "SAME_ASSOCIATION",
  MEMBER_OF_COMMUNITY: "SHARED_COMMUNITY",
  ATTENDED: "SHARED_EVENT",
};

const NODE_KIND_TO_CONTEXT: Record<string, SharedContextKind> = {
  company: "SAME_COMPANY_CONTEXT",
  association: "SAME_ASSOCIATION",
  community: "SHARED_COMMUNITY",
  event: "SHARED_EVENT",
};

export interface PersonAffiliations {
  /** Map contextNodeId → kind. */
  contexts: Map<string, SharedContextKind>;
}

export async function batchLoadAffiliations(
  sb: SupabaseClient,
  personIds: string[],
): Promise<Map<string, PersonAffiliations>> {
  const out = new Map<string, PersonAffiliations>();
  for (const id of personIds) out.set(id, { contexts: new Map() });
  if (personIds.length === 0) return out;

  const csv = personIds.join(",");
  const { data: edges, error } = await sb
    .from("graph_edges")
    .select("source_node_id,target_node_id,edge_kind")
    .in("edge_kind", ["WORKS_FOR", "MEMBER_OF", "ATTENDED"])
    .eq("status", "active")
    .is("archived_at", null)
    .or(`source_node_id.in.(${csv}),target_node_id.in.(${csv})`)
    .limit(4000);
  if (error) throw graphErr("INTERNAL_ERROR");

  const personSet = new Set(personIds);
  const contextIds = new Set<string>();
  const raw: Array<{ person: string; ctx: string; edge: string }> = [];
  for (const e of (edges ?? []) as Array<{
    source_node_id: string;
    target_node_id: string;
    edge_kind: string;
  }>) {
    const [person, ctx] = personSet.has(e.source_node_id)
      ? [e.source_node_id, e.target_node_id]
      : [e.target_node_id, e.source_node_id];
    if (!personSet.has(person)) continue;
    raw.push({ person, ctx, edge: e.edge_kind });
    contextIds.add(ctx);
  }
  if (contextIds.size === 0) return out;

  const { data: nodes, error: nErr } = await sb
    .from("graph_nodes")
    .select("id,node_kind,status")
    .in("id", [...contextIds]);
  if (nErr) throw graphErr("INTERNAL_ERROR");
  const kindById = new Map<string, string>();
  for (const n of (nodes ?? []) as Array<{ id: string; node_kind: string; status: string }>) {
    if (n.status === "active") kindById.set(n.id, n.node_kind);
  }

  for (const r of raw) {
    const nodeKind = kindById.get(r.ctx);
    const contextKind = (nodeKind && NODE_KIND_TO_CONTEXT[nodeKind]) || EDGE_TO_KIND[r.edge];
    if (!contextKind) continue;
    out.get(r.person)!.contexts.set(r.ctx, contextKind);
  }
  return out;
}

/** Intersect affiliations across two persons → tag list with counts. */
export function sharedContextsBetween(
  a: PersonAffiliations,
  b: PersonAffiliations,
): Array<{ kind: SharedContextKind; count: number; example?: string }> {
  const counts = new Map<SharedContextKind, { count: number; example?: string }>();
  for (const [ctxId, kind] of a.contexts) {
    if (b.contexts.get(ctxId) === kind) {
      const prev = counts.get(kind);
      counts.set(kind, { count: (prev?.count ?? 0) + 1, example: prev?.example ?? ctxId });
    }
  }
  return [...counts.entries()].map(([kind, v]) => ({ kind, ...v }));
}
