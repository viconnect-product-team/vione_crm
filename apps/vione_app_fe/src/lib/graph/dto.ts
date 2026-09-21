// BC-4.1 — Relationship Graph Engine — Row → DTO mapping & metadata redaction.

import { graphRegistry } from "./registry";
import type {
  GraphEdgeDTO,
  GraphMetadata,
  GraphNodeDTO,
  TenantScopeType,
  VisibilityClass,
  Directionality,
} from "./types";

export interface GraphNodeRow {
  id: string;
  node_kind: string;
  external_ref_type: string;
  external_ref_id: string;
  tenant_scope_type: string;
  tenant_scope_id: string | null;
  visibility_class: string;
  status: string;
  metadata: Record<string, unknown> | null;
  registry_version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface GraphEdgeRow {
  id: string;
  edge_kind: string;
  source_node_id: string;
  target_node_id: string;
  directionality: string;
  visibility_class: string;
  tenant_scope_type: string;
  tenant_scope_id: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  registry_version: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function pickAllowlisted(
  metadata: Record<string, unknown> | null | undefined,
  allowlist: readonly string[],
): GraphMetadata {
  const out: GraphMetadata = {};
  if (!metadata) return out;
  for (const key of allowlist) {
    if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;
    const v = metadata[key];
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[key] = v;
    }
  }
  return out;
}

export function mapNode(row: GraphNodeRow): GraphNodeDTO {
  const reg = graphRegistry.getNode(row.node_kind);
  const metadata = pickAllowlisted(row.metadata, reg?.metadataAllowlist ?? []);
  return {
    id: row.id,
    kind: row.node_kind,
    externalRef: { type: row.external_ref_type, id: row.external_ref_id },
    tenant: {
      type: row.tenant_scope_type as TenantScopeType,
      id: row.tenant_scope_id,
    },
    visibility: row.visibility_class as VisibilityClass,
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEdge(row: GraphEdgeRow): GraphEdgeDTO {
  const reg = graphRegistry.getEdge(row.edge_kind);
  const metadata = pickAllowlisted(row.metadata, reg?.metadataAllowlist ?? []);
  return {
    id: row.id,
    kind: row.edge_kind,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    directionality: row.directionality as Directionality,
    visibility: row.visibility_class as VisibilityClass,
    metadata,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
