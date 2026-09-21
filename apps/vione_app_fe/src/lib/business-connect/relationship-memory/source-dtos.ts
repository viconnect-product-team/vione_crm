// BC-9.1 Turn B2b-i — Safe extraction Source DTOs (client-safe types + Zod).
//
// One DTO shape per approved source domain. Loaders MUST project ONLY these
// fields from canonical tables. Never include owner_user_id, tenant_id,
// auth identifiers, raw private fields, internal hashes, audit metadata,
// provider payloads, or arbitrary JSON blobs. Zod parsing at the loader
// boundary is the last-line runtime gate — if a field leaks, tests fail.

import { z } from "zod";
import type { RelationshipMemoryAllowedSourceDomain } from "./registry";

/** Common envelope shared by every source DTO. `sourceVersion` MUST match
 *  the receipt's `source_version` or the loader raises SOURCE_STALE. */
export interface SafeSourceEnvelope {
  readonly sourceDomain: RelationshipMemoryAllowedSourceDomain;
  readonly sourceRecordId: string;
  readonly sourceVersion: string;
  readonly occurredAt: string; // ISO-8601 UTC
  readonly visibilityCeiling: "public_ok" | "standard" | "sensitive" | "restricted";
}

export const safeSourceEnvelopeSchema = z.object({
  sourceDomain: z.string().min(1),
  sourceRecordId: z.string().min(1).max(200),
  sourceVersion: z.string().min(1).max(80),
  occurredAt: z.string().datetime(),
  visibilityCeiling: z.enum(["public_ok", "standard", "sensitive", "restricted"]),
});

// ---------------------------------------------------------------------------
// Meeting Outcome — commitment/decision surface
// ---------------------------------------------------------------------------

export const meetingOutcomeSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("meeting_outcome_safe"),
  meetingId: z.string().uuid(),
  outcomeType: z.enum(["decision", "commitment", "next_step", "no_action", "cancelled"]),
  outcomeStatus: z.enum(["draft", "finalized", "superseded"]),
  summary: z.string().min(1).max(8_000),
  finalized: z.boolean(),
  participants: z
    .array(
      z.object({
        personNodeId: z.string().uuid(),
        role: z.enum(["organizer", "participant", "optional", "observer"]),
      }),
    )
    .max(50),
});
export type MeetingOutcomeExtractionSourceDTO = z.infer<typeof meetingOutcomeSourceSchema>;

// ---------------------------------------------------------------------------
// Meeting Follow-up — planned action + due date
// ---------------------------------------------------------------------------

export const followUpSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("follow_up_safe"),
  meetingId: z.string().uuid().nullable(),
  followUpId: z.string().uuid(),
  title: z.string().min(1).max(400),
  description: z.string().max(4_000).nullable(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "normal", "high"]).nullable(),
  dueAt: z.string().datetime().nullable(),
  assigneePersonNodeId: z.string().uuid().nullable(),
});
export type FollowUpExtractionSourceDTO = z.infer<typeof followUpSourceSchema>;

// ---------------------------------------------------------------------------
// Meeting Agenda — explicit topics
// ---------------------------------------------------------------------------

export const agendaSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("agenda_safe"),
  meetingId: z.string().uuid(),
  items: z
    .array(
      z.object({
        agendaItemId: z.string().uuid(),
        title: z.string().min(1).max(300),
        status: z.enum(["proposed", "accepted", "in_progress", "completed", "dropped"]),
        estimatedMinutes: z.number().int().nonnegative().max(600).nullable(),
      }),
    )
    .max(30),
  counterpartPersonNodeIds: z.array(z.string().uuid()).max(50),
});
export type AgendaExtractionSourceDTO = z.infer<typeof agendaSourceSchema>;

// ---------------------------------------------------------------------------
// Person / relationship profile — explicit role/title/org
// ---------------------------------------------------------------------------

export const relationshipProfileSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("person_profile_safe"),
  subjectPersonNodeId: z.string().uuid(),
  displayName: z.string().max(200).nullable(),
  professionalTitle: z.string().max(200).nullable(),
  companyName: z.string().max(200).nullable(),
  industry: z.string().max(120).nullable(),
});
export type RelationshipProfileExtractionSourceDTO = z.infer<
  typeof relationshipProfileSourceSchema
>;

// ---------------------------------------------------------------------------
// Business card — explicit offered services
// ---------------------------------------------------------------------------

export const businessCardSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("person_profile_safe"),
  cardId: z.string().uuid(),
  cardSlug: z.string().min(1).max(200),
  subjectPersonNodeId: z.string().uuid(),
  services: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        category: z.string().max(120).nullable(),
      }),
    )
    .max(30),
});
export type BusinessCardExtractionSourceDTO = z.infer<typeof businessCardSourceSchema>;

// ---------------------------------------------------------------------------
// Introduction — canonical context/reason
// ---------------------------------------------------------------------------

export const introductionSourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("introduction_safe"),
  introductionRequestId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "declined", "cancelled", "delivered", "expired"]),
  requesterPersonNodeId: z.string().uuid(),
  intermediaryPersonNodeId: z.string().uuid().nullable(),
  targetPersonNodeId: z.string().uuid(),
  purpose: z.string().min(1).max(2_000),
});
export type IntroductionExtractionSourceDTO = z.infer<typeof introductionSourceSchema>;

// ---------------------------------------------------------------------------
// Manual owner-authored memory input
// ---------------------------------------------------------------------------

export const manualMemorySourceSchema = safeSourceEnvelopeSchema.extend({
  sourceDomain: z.literal("work_hub_items"),
  subjectType: z.enum(["person", "organization", "relationship", "opportunity"]),
  subjectRef: z.string().min(1).max(200),
  memoryKind: z.enum([
    "preference",
    "interest",
    "shared_history",
    "commitment",
    "milestone",
    "personal_context",
  ]),
  canonicalPredicate: z.string().min(1).max(120),
  canonicalText: z.string().min(1).max(800),
  authoredByOwner: z.literal(true),
});
export type ManualMemoryExtractionSourceDTO = z.infer<typeof manualMemorySourceSchema>;

// ---------------------------------------------------------------------------
// Discriminated union — every loader returns one of these.
// ---------------------------------------------------------------------------

export type SafeSourceDTO =
  | MeetingOutcomeExtractionSourceDTO
  | FollowUpExtractionSourceDTO
  | AgendaExtractionSourceDTO
  | RelationshipProfileExtractionSourceDTO
  | BusinessCardExtractionSourceDTO
  | IntroductionExtractionSourceDTO
  | ManualMemoryExtractionSourceDTO;
