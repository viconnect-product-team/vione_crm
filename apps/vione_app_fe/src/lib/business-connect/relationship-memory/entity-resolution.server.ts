// BC-9.1 Turn B1 — Authorized entity resolution (server-only).
//
// Resolves a candidate subject ONLY against canonical entities the viewer is
// already authorized to see. Never mints new hidden person records from free
// text. Ambiguous or unresolved subjects surface stable errors.

import type { SupabaseClient } from "@supabase/supabase-js";
import { RelationshipMemoryError } from "./errors";
import type { RelationshipMemorySubjectType } from "./registry";

type Sb = SupabaseClient<any, any, any>;

export interface EntityResolutionInput {
  subjectType: RelationshipMemorySubjectType;
  /** Any of: canonical UUID, exact normalized email/domain (already authorized),
   *  known org identifier, explicit source-linked participant id. */
  candidateRef: string;
  /** Optional scope hint to disambiguate (e.g. meeting_id, introduction_id). */
  scopeType?: "meeting" | "introduction" | "profile" | "work_item" | "none";
  scopeRecordId?: string | null;
}

export interface EntityResolutionResult {
  subjectType: RelationshipMemorySubjectType;
  subjectRef: string;
  resolved: true;
  resolutionMethod:
    | "exact_canonical_id"
    | "authorized_email_domain"
    | "known_org_identity"
    | "scoped_participant";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve `person` by canonical person_node_id (RLS-scoped read). */
async function resolvePerson(
  sb: Sb,
  ownerUserId: string,
  ref: string,
  scope: EntityResolutionInput,
): Promise<EntityResolutionResult> {
  if (UUID.test(ref)) {
    // Confirm viewer can see this graph node under RLS.
    const { data } = await sb
      .from("graph_nodes")
      .select("id")
      .eq("id", ref)
      .eq("node_type", "person")
      .maybeSingle();
    if (data?.id) {
      return {
        subjectType: "person",
        subjectRef: data.id,
        resolved: true,
        resolutionMethod: "exact_canonical_id",
      };
    }
  }

  // Scoped participant: e.g., meeting participant the owner is authorized on.
  if (scope.scopeType === "meeting" && scope.scopeRecordId) {
    const { data } = await sb
      .from("business_meeting_participants")
      .select("person_node_id")
      .eq("meeting_id", scope.scopeRecordId)
      .eq("participant_ref", ref)
      .maybeSingle();
    if (data?.person_node_id) {
      return {
        subjectType: "person",
        subjectRef: data.person_node_id,
        resolved: true,
        resolutionMethod: "scoped_participant",
      };
    }
  }

  // Ownership guard: never invent a new hidden person from free text.
  void ownerUserId;
  throw new RelationshipMemoryError(
    "RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED",
    "Person subject could not be resolved to an authorized canonical entity.",
    { subjectType: "person", candidateRef: ref },
  );
}

/** Resolve `organization` by canonical org id or normalized identity. */
async function resolveOrganization(
  sb: Sb,
  _ownerUserId: string,
  ref: string,
): Promise<EntityResolutionResult> {
  if (UUID.test(ref)) {
    const { data } = await sb.from("companies").select("id").eq("id", ref).maybeSingle();
    if (data?.id) {
      return {
        subjectType: "organization",
        subjectRef: data.id,
        resolved: true,
        resolutionMethod: "exact_canonical_id",
      };
    }
  }
  // Slug-based lookup (companies domain uses slug identity for many reads).
  const { data: bySlug } = await sb
    .from("companies")
    .select("id, slug")
    .eq("slug", ref)
    .maybeSingle();
  if (bySlug?.id) {
    return {
      subjectType: "organization",
      subjectRef: bySlug.id,
      resolved: true,
      resolutionMethod: "known_org_identity",
    };
  }
  throw new RelationshipMemoryError(
    "RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED",
    "Organization subject could not be resolved to an authorized canonical entity.",
    { subjectType: "organization", candidateRef: ref },
  );
}

/** Resolve `relationship` or `opportunity`: only exact canonical id in B1. */
async function resolveAbstractSubject(
  sb: Sb,
  subjectType: "relationship" | "opportunity",
  ref: string,
): Promise<EntityResolutionResult> {
  if (!UUID.test(ref)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED",
      `${subjectType} subject must be given as a canonical id.`,
      { subjectType, candidateRef: ref },
    );
  }
  const table = subjectType === "opportunity" ? "opportunities" : "connections";
  const { data } = await sb.from(table).select("id").eq("id", ref).maybeSingle();
  if (!data?.id) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED",
      `${subjectType} subject not visible to viewer.`,
      { subjectType, candidateRef: ref },
    );
  }
  return {
    subjectType,
    subjectRef: data.id,
    resolved: true,
    resolutionMethod: "exact_canonical_id",
  };
}

export async function resolveSubject(
  sb: Sb,
  ownerUserId: string,
  input: EntityResolutionInput,
): Promise<EntityResolutionResult> {
  const ref = input.candidateRef.trim();
  if (!ref) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED",
      "Empty subject reference.",
    );
  }
  switch (input.subjectType) {
    case "person":
      return resolvePerson(sb, ownerUserId, ref, input);
    case "organization":
      return resolveOrganization(sb, ownerUserId, ref);
    case "relationship":
    case "opportunity":
      return resolveAbstractSubject(sb, input.subjectType, ref);
  }
}

/**
 * Bulk resolution helper: returns resolved + rejected. Ambiguous conditions
 * (multiple simultaneous matches) currently surface as UNRESOLVED because B1
 * lookups are exact-only. A future disambiguation path will emit
 * RELATIONSHIP_MEMORY_ENTITY_AMBIGUOUS instead.
 */
export async function resolveSubjects(
  sb: Sb,
  ownerUserId: string,
  inputs: ReadonlyArray<EntityResolutionInput>,
): Promise<{
  resolved: EntityResolutionResult[];
  rejected: Array<{ input: EntityResolutionInput; code: string; message: string }>;
}> {
  const resolved: EntityResolutionResult[] = [];
  const rejected: Array<{ input: EntityResolutionInput; code: string; message: string }> = [];
  for (const input of inputs) {
    try {
      resolved.push(await resolveSubject(sb, ownerUserId, input));
    } catch (err) {
      if (err instanceof RelationshipMemoryError) {
        rejected.push({ input, code: err.code, message: err.message });
      } else {
        rejected.push({
          input,
          code: "RELATIONSHIP_MEMORY_INTERNAL_ERROR",
          message: (err as Error)?.message ?? "unknown",
        });
      }
    }
  }
  return { resolved, rejected };
}
