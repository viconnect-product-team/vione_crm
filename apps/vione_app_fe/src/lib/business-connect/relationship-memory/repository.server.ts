// BC-9.1 Turn A — Server-only repository for Relationship Memory.
//
// Owner-scoped bounded reads and writes through the authenticated Supabase
// client. RLS enforces the same rule as the explicit `owner_user_id` filter
// (defense in depth). No admin client. No cross-owner reads.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RELATIONSHIP_MEMORY_PAGE_SIZE_DEFAULT,
  RELATIONSHIP_MEMORY_PAGE_SIZE_MAX,
  type RelationshipMemoryDTO,
  type RelationshipMemoryListFilters,
  type RelationshipMemoryListDTO,
} from "./types";
import {
  RELATIONSHIP_MEMORY_VERSION,
  type RelationshipMemoryKind,
  type RelationshipMemorySensitivity,
  type RelationshipMemoryStatus,
  type RelationshipMemorySubjectType,
} from "./registry";
import { assertSourceDomainEligible, assertSourceRefNotBlocked } from "./eligibility";
import { RelationshipMemoryError } from "./errors";

type Sb = SupabaseClient<any, any, any>;

interface MemoryRow {
  id: string;
  owner_user_id: string;
  subject_type: RelationshipMemorySubjectType;
  subject_ref: string;
  memory_kind: RelationshipMemoryKind;
  canonical_key: string;
  canonical_value: Record<string, unknown> | null;
  confidence: number | string;
  source_count: number;
  status: RelationshipMemoryStatus;
  sensitivity: RelationshipMemorySensitivity;
  first_observed_at: string;
  last_observed_at: string;
  last_reviewed_at: string | null;
  registry_version: string;
  created_at: string;
  updated_at: string;
}

function toDTO(row: MemoryRow): RelationshipMemoryDTO {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    subject: { type: row.subject_type, ref: row.subject_ref },
    kind: row.memory_kind,
    canonicalKey: row.canonical_key,
    canonicalValue: Object.freeze({ ...(row.canonical_value ?? {}) }),
    confidence: typeof row.confidence === "string" ? Number(row.confidence) : row.confidence,
    sourceCount: row.source_count,
    status: row.status,
    sensitivity: row.sensitivity,
    firstObservedAt: row.first_observed_at,
    lastObservedAt: row.last_observed_at,
    lastReviewedAt: row.last_reviewed_at,
    registryVersion: row.registry_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const RelationshipMemoryRepository = {
  async list(
    sb: Sb,
    ownerUserId: string,
    filters: RelationshipMemoryListFilters,
  ): Promise<RelationshipMemoryListDTO> {
    const limit = Math.min(
      Math.max(1, filters.limit ?? RELATIONSHIP_MEMORY_PAGE_SIZE_DEFAULT),
      RELATIONSHIP_MEMORY_PAGE_SIZE_MAX,
    );
    let q = sb
      .from("business_relationship_memories")
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .order("last_observed_at", { ascending: false })
      .limit(limit + 1);

    if (filters.subject) {
      q = q.eq("subject_type", filters.subject.type).eq("subject_ref", filters.subject.ref);
    }
    if (filters.kinds?.length) q = q.in("memory_kind", filters.kinds as unknown as string[]);
    if (filters.statuses?.length) q = q.in("status", filters.statuses as unknown as string[]);
    if (typeof filters.minConfidence === "number") q = q.gte("confidence", filters.minConfidence);

    const { data, error } = await q;
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
    const rows = (data ?? []) as MemoryRow[];
    const page = rows.slice(0, limit).map(toDTO);
    const nextCursor = rows.length > limit ? (page[page.length - 1]?.id ?? null) : null;
    return { items: page, nextCursor, registryVersion: RELATIONSHIP_MEMORY_VERSION };
  },

  async getById(sb: Sb, ownerUserId: string, id: string): Promise<RelationshipMemoryDTO | null> {
    const { data, error } = await sb
      .from("business_relationship_memories")
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
    return data ? toDTO(data as MemoryRow) : null;
  },

  /** Turn A ships write helpers so Turn B extractors have a single insertion point. */
  async attachSource(
    sb: Sb,
    ownerUserId: string,
    input: {
      memoryId: string;
      sourceDomain: string;
      sourceRef: string;
      observedAt?: string;
      weight?: number;
      extractorVersion?: string;
      snippetSafe?: string | null;
    },
  ): Promise<void> {
    assertSourceDomainEligible(input.sourceDomain);
    assertSourceRefNotBlocked(input.sourceRef);
    const { error } = await sb.from("business_relationship_memory_sources").insert({
      owner_user_id: ownerUserId,
      memory_id: input.memoryId,
      source_domain: input.sourceDomain,
      source_ref: input.sourceRef,
      observed_at: input.observedAt ?? new Date().toISOString(),
      weight: input.weight ?? 1,
      extractor_version: input.extractorVersion ?? RELATIONSHIP_MEMORY_VERSION,
      snippet_safe: input.snippetSafe ?? null,
    });
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
  },
};
