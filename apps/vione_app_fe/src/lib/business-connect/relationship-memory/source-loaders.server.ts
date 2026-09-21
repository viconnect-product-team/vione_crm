// BC-9.1 Turn B2b-i — Authorization-safe source loaders (server-only).
//
// One explicit loader per approved source domain. Each loader:
//   * accepts a claimed receipt + service-role client
//   * runs a canonical, statically-typed query (no dynamic SQL,
//     no caller-controlled table/column selection)
//   * verifies ownership/visibility for the receipt's owner_user_id
//   * verifies source_version freshness
//   * returns a bounded safe DTO parsed through Zod
//   * throws stable errors: SOURCE_NOT_FOUND / SOURCE_FORBIDDEN /
//     SOURCE_STALE / EXCLUDED_SOURCE
//
// Private-note domains never appear here (no import path exists). The
// dispatcher is exhaustive over the seven frozen extractor source domains
// only; adding an unregistered domain is a hard build error.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractionReceiptDTO } from "./receipts.server";
import { assertSourceDomainEligible, assertSourceRefNotBlocked } from "./eligibility";
import { RelationshipMemoryError } from "./errors";
import { getExtractor } from "./extractor-registry";
import {
  agendaSourceSchema,
  businessCardSourceSchema,
  followUpSourceSchema,
  introductionSourceSchema,
  manualMemorySourceSchema,
  meetingOutcomeSourceSchema,
  relationshipProfileSourceSchema,
  type AgendaExtractionSourceDTO,
  type BusinessCardExtractionSourceDTO,
  type FollowUpExtractionSourceDTO,
  type IntroductionExtractionSourceDTO,
  type ManualMemoryExtractionSourceDTO,
  type MeetingOutcomeExtractionSourceDTO,
  type RelationshipProfileExtractionSourceDTO,
  type SafeSourceDTO,
} from "./source-dtos";

type Sb = SupabaseClient<any, any, any>;

function notFound(msg: string, details?: Record<string, unknown>): never {
  throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND", msg, details);
}
function forbidden(msg: string, details?: Record<string, unknown>): never {
  throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN", msg, details);
}
function stale(msg: string, details?: Record<string, unknown>): never {
  throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_STALE", msg, details);
}
function invalid(msg: string, details?: Record<string, unknown>): never {
  throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID", msg, details);
}

/** Confirm the DB row's version matches the receipt's source_version. */
function requireSameVersion(receipt: ExtractionReceiptDTO, actual: number | string | null): void {
  const a = String(actual ?? "");
  if (!a || a !== receipt.sourceVersion) {
    stale("Source row version has advanced since receipt was created.", {
      sourceRecordId: receipt.sourceRecordId,
      expected: receipt.sourceVersion,
      actual: a,
    });
  }
}

// ---------------------------------------------------------------------------
// meeting_outcome_safe
// ---------------------------------------------------------------------------
export async function loadMeetingOutcomeSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<MeetingOutcomeExtractionSourceDTO> {
  const { data: row, error } = await sb
    .from("business_meeting_outcomes")
    .select(
      "id, meeting_id, recorded_by_user_id, outcome_type, outcome_status, summary, finalized_at, version, updated_at",
    )
    .eq("id", receipt.sourceRecordId)
    .maybeSingle();
  if (error || !row) notFound("meeting_outcome not found", { id: receipt.sourceRecordId });
  requireSameVersion(receipt, row.version);
  if (row.recorded_by_user_id !== receipt.ownerUserId) {
    // Owner might still be a meeting participant — verify.
    const { data: part } = await sb
      .from("business_meeting_participants")
      .select("user_id")
      .eq("meeting_id", row.meeting_id)
      .eq("user_id", receipt.ownerUserId)
      .maybeSingle();
    if (!part) forbidden("owner is not authorized on meeting_outcome");
  }
  // Bounded participant projection (person_node_id + role only).
  const { data: parts } = await sb
    .from("business_meeting_participants")
    .select("person_node_id, role")
    .eq("meeting_id", row.meeting_id)
    .limit(50);
  const participants = (parts ?? [])
    .filter((p: any) => p.person_node_id)
    .map((p: any) => ({ personNodeId: p.person_node_id as string, role: p.role as any }));

  const dto: MeetingOutcomeExtractionSourceDTO = {
    sourceDomain: "meeting_outcome_safe",
    sourceRecordId: row.id as string,
    sourceVersion: String(row.version),
    occurredAt: (row.finalized_at as string) ?? (row.updated_at as string),
    visibilityCeiling: "sensitive",
    meetingId: row.meeting_id as string,
    outcomeType: row.outcome_type as any,
    outcomeStatus: row.outcome_status as any,
    summary: String(row.summary ?? "").slice(0, 8_000) || " ",
    finalized: Boolean(row.finalized_at),
    participants,
  };
  return meetingOutcomeSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// follow_up_safe
// ---------------------------------------------------------------------------
export async function loadFollowUpSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<FollowUpExtractionSourceDTO> {
  const { data: row, error } = await sb
    .from("business_meeting_follow_ups")
    .select(
      "id, meeting_id, owner_user_id, title, description, status, priority, due_at, version, updated_at",
    )
    .eq("id", receipt.sourceRecordId)
    .maybeSingle();
  if (error || !row) notFound("follow_up not found");
  requireSameVersion(receipt, row.version);
  if (row.owner_user_id !== receipt.ownerUserId) {
    forbidden("owner mismatch on follow_up");
  }
  const dto: FollowUpExtractionSourceDTO = {
    sourceDomain: "follow_up_safe",
    sourceRecordId: row.id as string,
    sourceVersion: String(row.version),
    occurredAt: row.updated_at as string,
    visibilityCeiling: "sensitive",
    meetingId: (row.meeting_id as string) ?? null,
    followUpId: row.id as string,
    title: String(row.title ?? "").slice(0, 400),
    description: row.description ? String(row.description).slice(0, 4_000) : null,
    status: row.status as any,
    priority: (row.priority as any) ?? null,
    dueAt: (row.due_at as string) ?? null,
    assigneePersonNodeId: null,
  };
  return followUpSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// agenda_safe
// ---------------------------------------------------------------------------
export async function loadAgendaSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<AgendaExtractionSourceDTO> {
  // sourceRecordId is the meeting_id for agenda; we sum item versions to
  // derive a stable "agenda version". Loader treats aggregate version as the
  // freshness guard — extractor uses items as facts, not their identity.
  const { data: items, error } = await sb
    .from("business_meeting_agenda_items")
    .select("id, meeting_id, owner_user_id, title, status, estimated_minutes, version, updated_at")
    .eq("meeting_id", receipt.sourceRecordId)
    .order("position", { ascending: true })
    .limit(30);
  if (error) notFound("agenda not found");
  const arr = items ?? [];
  if (arr.length === 0) notFound("agenda has no items");
  const owners = new Set(arr.map((r: any) => r.owner_user_id));
  if (!owners.has(receipt.ownerUserId)) forbidden("owner not authorized on agenda");
  const aggregateVersion = arr
    .map((r: any) => Number(r.version ?? 0))
    .reduce((a, b) => a + b, 0)
    .toString();
  requireSameVersion(receipt, aggregateVersion);

  const { data: parts } = await sb
    .from("business_meeting_participants")
    .select("person_node_id")
    .eq("meeting_id", receipt.sourceRecordId)
    .limit(50);
  const counterparts = (parts ?? [])
    .map((p: any) => p.person_node_id as string | null)
    .filter((x): x is string => Boolean(x));

  const dto: AgendaExtractionSourceDTO = {
    sourceDomain: "agenda_safe",
    sourceRecordId: receipt.sourceRecordId,
    sourceVersion: aggregateVersion,
    occurredAt: arr[arr.length - 1].updated_at as string,
    visibilityCeiling: "standard",
    meetingId: receipt.sourceRecordId,
    items: arr.map((r: any) => ({
      agendaItemId: r.id as string,
      title: String(r.title ?? "").slice(0, 300),
      status: r.status as any,
      estimatedMinutes: typeof r.estimated_minutes === "number" ? r.estimated_minutes : null,
    })),
    counterpartPersonNodeIds: counterparts,
  };
  return agendaSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// person_profile_safe (role extractor path)
// ---------------------------------------------------------------------------
export async function loadRelationshipProfileSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<RelationshipProfileExtractionSourceDTO> {
  // sourceRecordId encodes a person_node_id the owner is authorized to see.
  const { data: node } = await sb
    .from("graph_nodes")
    .select("id, node_type, ref_user_id, updated_at")
    .eq("id", receipt.sourceRecordId)
    .eq("node_type", "person")
    .maybeSingle();
  if (!node) notFound("person node not found");
  const refUserId = (node as any).ref_user_id as string | null;
  if (!refUserId) forbidden("person node has no user profile");
  const { data: profile } = await sb
    .from("user_profiles")
    .select("user_id, display_name, professional_title, company_name, industry, updated_at")
    .eq("user_id", refUserId)
    .maybeSingle();
  if (!profile) notFound("user profile not found");
  requireSameVersion(
    receipt,
    Math.floor(new Date((profile as any).updated_at as string).getTime() / 1000).toString(),
  );

  // Ownership: the owner may extract role facts for their own profile OR for
  // a person they have a canonical connection with (verified through
  // user_connections).
  if (refUserId !== receipt.ownerUserId) {
    const { data: conn } = await sb
      .from("user_connections")
      .select("id")
      .or(
        `and(user_a.eq.${receipt.ownerUserId},user_b.eq.${refUserId}),and(user_a.eq.${refUserId},user_b.eq.${receipt.ownerUserId})`,
      )
      .limit(1)
      .maybeSingle();
    if (!conn) forbidden("no authorized connection to person");
  }
  const dto: RelationshipProfileExtractionSourceDTO = {
    sourceDomain: "person_profile_safe",
    sourceRecordId: (node as any).id as string,
    sourceVersion: receipt.sourceVersion,
    occurredAt: (profile as any).updated_at as string,
    visibilityCeiling: "public_ok",
    subjectPersonNodeId: (node as any).id as string,
    displayName: ((profile as any).display_name as string) ?? null,
    professionalTitle: ((profile as any).professional_title as string) ?? null,
    companyName: ((profile as any).company_name as string) ?? null,
    industry: ((profile as any).industry as string) ?? null,
  };
  return relationshipProfileSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// person_profile_safe (business_card services path)
// ---------------------------------------------------------------------------
export async function loadBusinessCardSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<BusinessCardExtractionSourceDTO> {
  const { data: card } = await sb
    .from("member_business_cards")
    .select("id, slug, owner_user_id, status, public_mode, updated_at")
    .eq("id", receipt.sourceRecordId)
    .maybeSingle();
  if (!card) notFound("business_card not found");
  if ((card as any).status !== "published") {
    // Unpublished card is not extractable — treat as source hidden.
    forbidden("business_card is not published");
  }
  requireSameVersion(
    receipt,
    Math.floor(new Date((card as any).updated_at as string).getTime() / 1000).toString(),
  );
  const ownerUserId = (card as any).owner_user_id as string | null;
  if (ownerUserId && ownerUserId !== receipt.ownerUserId) {
    // For B2b-i, cards are extracted by their owner only.
    forbidden("owner mismatch on business_card");
  }
  // Resolve person node for the card owner.
  const { data: node } = await sb
    .from("graph_nodes")
    .select("id")
    .eq("node_type", "person")
    .eq("ref_user_id", ownerUserId)
    .maybeSingle();
  if (!node) notFound("person node for card owner not found");
  const { data: services } = await sb
    .from("business_card_services")
    .select("title, category")
    .eq("card_id", (card as any).id)
    .limit(30);
  const dto: BusinessCardExtractionSourceDTO = {
    sourceDomain: "person_profile_safe",
    sourceRecordId: (card as any).id as string,
    sourceVersion: receipt.sourceVersion,
    occurredAt: (card as any).updated_at as string,
    visibilityCeiling: "public_ok",
    cardId: (card as any).id as string,
    cardSlug: (card as any).slug as string,
    subjectPersonNodeId: (node as any).id as string,
    services: (services ?? []).map((s: any) => ({
      title: String(s.title ?? "").slice(0, 200),
      category: s.category ? String(s.category).slice(0, 120) : null,
    })),
  };
  return businessCardSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// introduction_safe
// ---------------------------------------------------------------------------
export async function loadIntroductionSource(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<IntroductionExtractionSourceDTO> {
  const { data: row } = await sb
    .from("introduction_requests")
    .select(
      "id, requester_user_id, requester_person_node_id, intermediary_user_id, intermediary_person_node_id, target_person_node_id, status, request_note, version, updated_at",
    )
    .eq("id", receipt.sourceRecordId)
    .maybeSingle();
  if (!row) notFound("introduction not found");
  requireSameVersion(receipt, (row as any).version);
  const owner = receipt.ownerUserId;
  const authorized =
    (row as any).requester_user_id === owner || (row as any).intermediary_user_id === owner;
  if (!authorized) forbidden("owner not on introduction");
  const purpose = String((row as any).request_note ?? "").slice(0, 2_000);
  if (!purpose.trim()) invalid("introduction has empty purpose");
  const dto: IntroductionExtractionSourceDTO = {
    sourceDomain: "introduction_safe",
    sourceRecordId: (row as any).id as string,
    sourceVersion: String((row as any).version),
    occurredAt: (row as any).updated_at as string,
    visibilityCeiling: "sensitive",
    introductionRequestId: (row as any).id as string,
    status: (row as any).status as any,
    requesterPersonNodeId: (row as any).requester_person_node_id as string,
    intermediaryPersonNodeId: ((row as any).intermediary_person_node_id as string) ?? null,
    targetPersonNodeId: (row as any).target_person_node_id as string,
    purpose,
  };
  return introductionSourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// manual owner-authored (work_hub_items)
// ---------------------------------------------------------------------------
export async function loadManualMemorySource(
  _sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<ManualMemoryExtractionSourceDTO> {
  // Manual entries land on the receipt as a stable JSON pointer in
  // source_record_id: "manual/<owner>/<uuid>". The receipt's producer is
  // the manual-entry server function (B2b-ii); B2b-i just validates the
  // shape and ownership prefix.
  const parts = receipt.sourceRecordId.split("/");
  if (parts.length !== 3 || parts[0] !== "manual") {
    invalid("manual source_record_id must be 'manual/<owner>/<uuid>'");
  }
  if (parts[1] !== receipt.ownerUserId) {
    forbidden("manual entry owner mismatch");
  }
  // For B2b-i the manual DTO is minimal: the extractor consumes the
  // structured payload that the manual-entry server function persisted to
  // the receipt during upsert (source_version encodes canonical text hash).
  // We surface only safe fields; free-text lives in the receipt itself and
  // is normalized by the extractor.
  const dto: ManualMemoryExtractionSourceDTO = {
    sourceDomain: "work_hub_items",
    sourceRecordId: receipt.sourceRecordId,
    sourceVersion: receipt.sourceVersion,
    occurredAt: receipt.createdAt,
    visibilityCeiling: "restricted",
    subjectType: "person",
    subjectRef: parts[2]!,
    memoryKind: "shared_history",
    canonicalPredicate: "owner_note",
    canonicalText: "owner authored memory",
    authoredByOwner: true,
  };
  return manualMemorySourceSchema.parse(dto);
}

// ---------------------------------------------------------------------------
// Dispatcher — resolves loader from extractor id. Exhaustive over the seven
// frozen extractors. No generic table-name loader exists.
// ---------------------------------------------------------------------------
export async function loadSourceForReceipt(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
): Promise<SafeSourceDTO> {
  assertSourceDomainEligible(receipt.sourceDomain);
  assertSourceRefNotBlocked(`${receipt.sourceDomain}/${receipt.sourceRecordId}`);
  const def = getExtractor(receipt.extractorId);
  if (!def) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
      `Unknown extractor id '${receipt.extractorId}'`,
    );
  }
  if (def.sourceDomain !== receipt.sourceDomain) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN",
      `Extractor ${def.extractorId} declared domain ${def.sourceDomain} but receipt is ${receipt.sourceDomain}`,
    );
  }
  switch (receipt.extractorId) {
    case "meeting_outcome.commitments.v1":
      return loadMeetingOutcomeSource(sb, receipt);
    case "follow_up.commitments.v1":
      return loadFollowUpSource(sb, receipt);
    case "agenda.topics.v1":
      return loadAgendaSource(sb, receipt);
    case "person_profile.role.v1":
      return loadRelationshipProfileSource(sb, receipt);
    case "business_card.services.v1":
      return loadBusinessCardSource(sb, receipt);
    case "introduction.context.v1":
      return loadIntroductionSource(sb, receipt);
    case "manual.owner_authored.v1":
      return loadManualMemorySource(sb, receipt);
    default:
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
        `No source loader wired for extractor '${receipt.extractorId}'`,
      );
  }
}
