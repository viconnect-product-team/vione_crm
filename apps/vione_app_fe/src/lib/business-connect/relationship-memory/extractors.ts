// BC-9.1 Turn B2b-i — Deterministic extractor bodies (pure, server-safe).
//
// Every extractor:
//   * is a pure function of an already-loaded safe source DTO
//   * emits stable RelationshipMemoryCandidate objects
//   * uses only memory kinds registered for its extractor id
//   * obeys its registered visibility ceiling
//   * NEVER calls an AI provider or network
//   * produces stable output ordering (deterministic sort)
//   * NEVER activates unresolved subjects (subjectResolved must be true
//     BEFORE persistence — pipeline enforces this)
//
// Sensitive inference is explicitly forbidden: extractors project ONLY the
// facts explicitly present in the DTO. Nothing is inferred from company
// name, industry, or free-form text patterns beyond canonical normalization.

import type { RelationshipMemoryCandidate } from "./candidate";
import { getExtractor } from "./extractor-registry";
import { RelationshipMemoryError } from "./errors";
import {
  candidateCanonicalKey,
  normalizeCasing,
  normalizeOrgName,
  normalizeWhitespace,
} from "./normalizers";
import type {
  AgendaExtractionSourceDTO,
  BusinessCardExtractionSourceDTO,
  FollowUpExtractionSourceDTO,
  IntroductionExtractionSourceDTO,
  ManualMemoryExtractionSourceDTO,
  MeetingOutcomeExtractionSourceDTO,
  RelationshipProfileExtractionSourceDTO,
  SafeSourceDTO,
} from "./source-dtos";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sortCandidates(list: RelationshipMemoryCandidate[]): RelationshipMemoryCandidate[] {
  return [...list].sort((a, b) => {
    if (a.canonicalPredicate !== b.canonicalPredicate)
      return a.canonicalPredicate < b.canonicalPredicate ? -1 : 1;
    if (a.canonicalText !== b.canonicalText) return a.canonicalText < b.canonicalText ? -1 : 1;
    return a.subjectRef < b.subjectRef ? -1 : 1;
  });
}

function cap<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(0, n) : arr;
}

// Regex used to detect commitment phrasing in explicit outcome summaries.
// Requires an explicit commitment verb, not general discussion.
const COMMITMENT_LINE =
  /^\s*(?:[-*•]\s*)?(?:I|we|they|he|she|team|owner)?\s*(?:will|shall|commit(?:s|ted)? to|agree(?:s|d)? to|promise(?:s|d)? to)\s+(.+?)\s*$/im;
const DUE_HINT = /\b(?:by|before|on|due)\s+(\d{4}-\d{2}-\d{2})\b/i;

// ---------------------------------------------------------------------------
// meeting_outcome.commitments.v1
// ---------------------------------------------------------------------------
export function extractMeetingOutcomeCommitments(
  dto: MeetingOutcomeExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("meeting_outcome.commitments.v1")!;
  if (!dto.finalized) return [];
  if (
    dto.outcomeType !== "commitment" &&
    dto.outcomeType !== "decision" &&
    dto.outcomeType !== "next_step"
  ) {
    return [];
  }
  const lines = dto.summary
    .split(/\n+/)
    .map(normalizeWhitespace)
    .filter((l: any) => l.length > 0);
  const out: RelationshipMemoryCandidate[] = [];
  for (const line of lines) {
    const m = COMMITMENT_LINE.exec(line);
    if (!m) continue; // do not infer commitment from general discussion
    const commitment = normalizeWhitespace(m[1]!);
    if (commitment.length < 3 || commitment.length > 400) continue;
    const due = DUE_HINT.exec(line)?.[1] ?? null;
    // Target: for B2b-i emit one candidate per meeting participant so
    // downstream persistence can dedupe against subject.
    for (const p of dto.participants) {
      const canonicalText = commitment.toLowerCase();
      out.push({
        extractorId: def.extractorId,
        extractorVersion: def.extractorVersion,
        sourceDomain: dto.sourceDomain,
        sourceRecordId: dto.sourceRecordId,
        sourceVersion: dto.sourceVersion,
        scopeType: "meeting",
        scopeRecordId: dto.meetingId,
        subjectType: "person",
        subjectRef: p.personNodeId,
        subjectResolved: false, // pipeline resolves before persistence
        memoryKind: "commitment",
        canonicalPredicate: "committed_to",
        canonicalText,
        structuredValue: {
          commitment: canonicalText,
          dueAt: due,
          canonicalKey: candidateCanonicalKey("commitment", "committed_to", canonicalText),
        },
        evidenceType: "explicit_commitment",
        evidenceStrength: due ? "high" : "medium",
        occurredAt: dto.occurredAt,
        visibilityClass: def.sourceVisibilityCeiling,
      });
    }
  }
  return sortCandidates(cap(out, def.maxCandidates));
}

// ---------------------------------------------------------------------------
// follow_up.commitments.v1
// ---------------------------------------------------------------------------
export function extractFollowUpCommitments(
  dto: FollowUpExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("follow_up.commitments.v1")!;
  // Never emit completion via memory extraction.
  if (dto.status !== "open" && dto.status !== "in_progress") return [];
  if (!dto.assigneePersonNodeId) return []; // no active subject → cannot activate
  const title = normalizeWhitespace(dto.title);
  if (!title) return [];
  const canonicalText = title.toLowerCase().slice(0, 400);
  const candidate: RelationshipMemoryCandidate = {
    extractorId: def.extractorId,
    extractorVersion: def.extractorVersion,
    sourceDomain: dto.sourceDomain,
    sourceRecordId: dto.sourceRecordId,
    sourceVersion: dto.sourceVersion,
    scopeType: "meeting",
    scopeRecordId: dto.meetingId ?? null,
    subjectType: "person",
    subjectRef: dto.assigneePersonNodeId,
    subjectResolved: false,
    memoryKind: "commitment",
    canonicalPredicate: "planned_follow_up",
    canonicalText,
    structuredValue: {
      followUp: canonicalText,
      dueAt: dto.dueAt,
      priority: dto.priority,
      canonicalKey: candidateCanonicalKey("commitment", "planned_follow_up", canonicalText),
    },
    evidenceType: "explicit_commitment",
    evidenceStrength: dto.dueAt ? "high" : "medium",
    occurredAt: dto.occurredAt,
    visibilityClass: def.sourceVisibilityCeiling,
  };
  return [candidate];
}

// ---------------------------------------------------------------------------
// agenda.topics.v1
// ---------------------------------------------------------------------------
export function extractAgendaTopics(dto: AgendaExtractionSourceDTO): RelationshipMemoryCandidate[] {
  const def = getExtractor("agenda.topics.v1")!;
  const seen = new Set<string>();
  const topics = dto.items
    .filter(
      (it) => it.status === "accepted" || it.status === "in_progress" || it.status === "completed",
    )
    .map((it) => normalizeWhitespace(it.title).toLowerCase())
    .filter((t) => {
      if (!t || t.length < 3 || t.length > 200) return false;
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  const out: RelationshipMemoryCandidate[] = [];
  const counterparts = dto.counterpartPersonNodeIds.length ? dto.counterpartPersonNodeIds : [];
  for (const topic of topics) {
    for (const cp of counterparts) {
      out.push({
        extractorId: def.extractorId,
        extractorVersion: def.extractorVersion,
        sourceDomain: dto.sourceDomain,
        sourceRecordId: dto.sourceRecordId,
        sourceVersion: dto.sourceVersion,
        scopeType: "meeting",
        scopeRecordId: dto.meetingId,
        subjectType: "person",
        subjectRef: cp,
        subjectResolved: false,
        memoryKind: "shared_history",
        canonicalPredicate: "discussed_topic",
        canonicalText: topic,
        structuredValue: {
          topic,
          canonicalKey: candidateCanonicalKey("shared_history", "discussed_topic", topic),
        },
        evidenceType: "structured_field",
        evidenceStrength: "low",
        occurredAt: dto.occurredAt,
        visibilityClass: def.sourceVisibilityCeiling,
      });
    }
  }
  return sortCandidates(cap(out, def.maxCandidates));
}

// ---------------------------------------------------------------------------
// person_profile.role.v1
// ---------------------------------------------------------------------------
export function extractPersonProfileRole(
  dto: RelationshipProfileExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("person_profile.role.v1")!;
  const title = dto.professionalTitle
    ? normalizeCasing(normalizeWhitespace(dto.professionalTitle))
    : "";
  const org = dto.companyName ? normalizeOrgName(dto.companyName) : "";
  if (!title && !org) return [];
  const canonicalText = normalizeWhitespace(
    [title, org ? `at ${org}` : ""].filter(Boolean).join(" "),
  );
  if (!canonicalText) return [];
  return [
    {
      extractorId: def.extractorId,
      extractorVersion: def.extractorVersion,
      sourceDomain: dto.sourceDomain,
      sourceRecordId: dto.sourceRecordId,
      sourceVersion: dto.sourceVersion,
      scopeType: "profile",
      scopeRecordId: dto.subjectPersonNodeId,
      subjectType: "person",
      subjectRef: dto.subjectPersonNodeId,
      subjectResolved: false,
      memoryKind: "role_context",
      canonicalPredicate: "current_role",
      canonicalText,
      structuredValue: {
        title: title || null,
        organization: org || null,
        canonicalKey: candidateCanonicalKey("role_context", "current_role", canonicalText),
      },
      evidenceType: "structured_field",
      evidenceStrength: "high",
      occurredAt: dto.occurredAt,
      visibilityClass: def.sourceVisibilityCeiling,
    },
  ];
}

// ---------------------------------------------------------------------------
// business_card.services.v1
// ---------------------------------------------------------------------------
export function extractBusinessCardServices(
  dto: BusinessCardExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("business_card.services.v1")!;
  const seen = new Set<string>();
  const out: RelationshipMemoryCandidate[] = [];
  for (const s of dto.services) {
    const label = normalizeWhitespace(normalizeCasing(s.title));
    if (!label || label.length < 2 || label.length > 120) continue;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({
      extractorId: def.extractorId,
      extractorVersion: def.extractorVersion,
      sourceDomain: dto.sourceDomain,
      sourceRecordId: dto.sourceRecordId,
      sourceVersion: dto.sourceVersion,
      scopeType: "profile",
      scopeRecordId: dto.subjectPersonNodeId,
      subjectType: "person",
      subjectRef: dto.subjectPersonNodeId,
      subjectResolved: false,
      memoryKind: "interest",
      canonicalPredicate: "offers_service",
      canonicalText: label,
      structuredValue: {
        service: label,
        category: s.category ? normalizeCasing(s.category) : null,
        canonicalKey: candidateCanonicalKey("interest", "offers_service", label),
      },
      evidenceType: "structured_field",
      evidenceStrength: "medium",
      occurredAt: dto.occurredAt,
      visibilityClass: def.sourceVisibilityCeiling,
    });
  }
  return sortCandidates(cap(out, def.maxCandidates));
}

// ---------------------------------------------------------------------------
// introduction.context.v1
// ---------------------------------------------------------------------------
export function extractIntroductionContext(
  dto: IntroductionExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("introduction.context.v1")!;
  // Only introductions that are actually in-flight or delivered carry
  // meaningful context. Cancelled/expired do not activate memory.
  if (dto.status === "cancelled" || dto.status === "expired" || dto.status === "declined") {
    return [];
  }
  const purpose = normalizeWhitespace(dto.purpose);
  if (!purpose || purpose.length < 3) return [];
  const canonicalText = purpose.slice(0, 400).toLowerCase();
  const subjects: string[] = Array.from(
    new Set([dto.targetPersonNodeId, dto.requesterPersonNodeId]),
  );
  const out: RelationshipMemoryCandidate[] = [];
  for (const subject of subjects) {
    out.push({
      extractorId: def.extractorId,
      extractorVersion: def.extractorVersion,
      sourceDomain: dto.sourceDomain,
      sourceRecordId: dto.sourceRecordId,
      sourceVersion: dto.sourceVersion,
      scopeType: "introduction",
      scopeRecordId: dto.introductionRequestId,
      subjectType: "person",
      subjectRef: subject,
      subjectResolved: false,
      memoryKind: "shared_history",
      canonicalPredicate: "introduction_purpose",
      canonicalText,
      structuredValue: {
        purpose: canonicalText,
        status: dto.status,
        canonicalKey: candidateCanonicalKey(
          "shared_history",
          "introduction_purpose",
          canonicalText,
        ),
      },
      evidenceType: "direct_statement",
      evidenceStrength: "medium",
      occurredAt: dto.occurredAt,
      visibilityClass: def.sourceVisibilityCeiling,
    });
  }
  return sortCandidates(cap(out, def.maxCandidates));
}

// ---------------------------------------------------------------------------
// manual.owner_authored.v1
// ---------------------------------------------------------------------------
const MANUAL_ALLOWED_KINDS = new Set([
  "preference",
  "interest",
  "shared_history",
  "commitment",
  "milestone",
  "personal_context",
]);
// Deny extractor from minting a sensitive inference on manual input.
const SENSITIVE_INFERENCE =
  /(salary|net worth|medical|diagnosis|password|ssn|social security|criminal)/i;

export function extractManualOwnerAuthored(
  dto: ManualMemoryExtractionSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor("manual.owner_authored.v1")!;
  if (!dto.authoredByOwner) return [];
  if (!MANUAL_ALLOWED_KINDS.has(dto.memoryKind)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
      `manual extractor: kind '${dto.memoryKind}' not on allowlist`,
    );
  }
  const text = normalizeWhitespace(dto.canonicalText);
  if (!text) return [];
  if (SENSITIVE_INFERENCE.test(text)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
      "manual extractor: sensitive-content gate rejected input",
    );
  }
  const canonicalText = text.toLowerCase().slice(0, 400);
  return [
    {
      extractorId: def.extractorId,
      extractorVersion: def.extractorVersion,
      sourceDomain: dto.sourceDomain,
      sourceRecordId: dto.sourceRecordId,
      sourceVersion: dto.sourceVersion,
      scopeType: "none",
      scopeRecordId: null,
      subjectType: dto.subjectType,
      subjectRef: dto.subjectRef,
      subjectResolved: false,
      memoryKind: dto.memoryKind,
      canonicalPredicate: normalizeWhitespace(dto.canonicalPredicate).toLowerCase().slice(0, 120),
      canonicalText,
      structuredValue: {
        text: canonicalText,
        canonicalKey: candidateCanonicalKey(dto.memoryKind, dto.canonicalPredicate, canonicalText),
      },
      evidenceType: "direct_statement",
      evidenceStrength: "medium",
      occurredAt: dto.occurredAt,
      visibilityClass: def.sourceVisibilityCeiling,
    },
  ];
}

// ---------------------------------------------------------------------------
// Dispatcher (exhaustive over the seven frozen extractor ids)
// ---------------------------------------------------------------------------
export function runDeterministicExtractor(
  extractorId: string,
  source: SafeSourceDTO,
): RelationshipMemoryCandidate[] {
  const def = getExtractor(extractorId);
  if (!def) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
      `Unknown extractor '${extractorId}'`,
    );
  }
  if (def.sourceDomain !== source.sourceDomain) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
      `Extractor ${extractorId} cannot run on source domain ${source.sourceDomain}`,
    );
  }
  switch (extractorId) {
    case "meeting_outcome.commitments.v1":
      return extractMeetingOutcomeCommitments(source as MeetingOutcomeExtractionSourceDTO);
    case "follow_up.commitments.v1":
      return extractFollowUpCommitments(source as FollowUpExtractionSourceDTO);
    case "agenda.topics.v1":
      return extractAgendaTopics(source as AgendaExtractionSourceDTO);
    case "person_profile.role.v1":
      return extractPersonProfileRole(source as RelationshipProfileExtractionSourceDTO);
    case "business_card.services.v1":
      return extractBusinessCardServices(source as BusinessCardExtractionSourceDTO);
    case "introduction.context.v1":
      return extractIntroductionContext(source as IntroductionExtractionSourceDTO);
    case "manual.owner_authored.v1":
      return extractManualOwnerAuthored(source as ManualMemoryExtractionSourceDTO);
    default:
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
        `No deterministic body wired for '${extractorId}'`,
      );
  }
}
