// BC-9.1 Turn A — Relationship Memory registry (frozen).
//
// SINGLE source of truth for memory kinds, subject types, source domains,
// link kinds, feedback kinds, lifecycle statuses, and sensitivity tiers.
// Bumps go through RELATIONSHIP_MEMORY_VERSION.
//
// The excluded-source list is a HARD architecture invariant: private meeting
// notes MUST never appear as a memory source. Structural + runtime + DB CHECK
// gates enforce this (see BC-9.1 Turn A migration and eligibility.ts).

export const RELATIONSHIP_MEMORY_VERSION = "1.0.0" as const;

/** Subject a memory attaches to. */
export const RELATIONSHIP_MEMORY_SUBJECT_TYPES = [
  "person",
  "organization",
  "relationship",
  "opportunity",
] as const;
export type RelationshipMemorySubjectType = (typeof RELATIONSHIP_MEMORY_SUBJECT_TYPES)[number];

/** Semantic memory kinds. */
export const RELATIONSHIP_MEMORY_KINDS = [
  "preference",
  "interest",
  "role_context",
  "communication_style",
  "goal",
  "constraint",
  "shared_history",
  "commitment",
  "milestone",
  "risk_flag",
  "opportunity_signal",
  "personal_context",
] as const;
export type RelationshipMemoryKind = (typeof RELATIONSHIP_MEMORY_KINDS)[number];

/** Lifecycle status (mirrors DB CHECK). */
export const RELATIONSHIP_MEMORY_STATUSES = [
  "candidate",
  "active",
  "superseded",
  "dismissed",
  "expired",
] as const;
export type RelationshipMemoryStatus = (typeof RELATIONSHIP_MEMORY_STATUSES)[number];

/** Sensitivity tiers gate exposure to intelligence context builders. */
export const RELATIONSHIP_MEMORY_SENSITIVITY = [
  "public_ok",
  "standard",
  "sensitive",
  "restricted",
] as const;
export type RelationshipMemorySensitivity = (typeof RELATIONSHIP_MEMORY_SENSITIVITY)[number];

/** Semantic edge kinds between two memories. */
export const RELATIONSHIP_MEMORY_LINK_KINDS = [
  "supports",
  "refines",
  "contradicts",
  "supersedes",
  "related",
] as const;
export type RelationshipMemoryLinkKind = (typeof RELATIONSHIP_MEMORY_LINK_KINDS)[number];

/** Owner feedback signals. */
export const RELATIONSHIP_MEMORY_FEEDBACK_KINDS = [
  "accept",
  "reject",
  "edit",
  "flag_sensitive",
  "request_forget",
] as const;
export type RelationshipMemoryFeedbackKind = (typeof RELATIONSHIP_MEMORY_FEEDBACK_KINDS)[number];

/** Safe source domains a memory may be extracted from. Mirrors DB CHECK. */
export const RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS = [
  "meeting_safe",
  "meeting_outcome_safe",
  "follow_up_safe",
  "agenda_safe",
  "shared_notes_safe",
  "introduction_safe",
  "connection_relationship_safe",
  "person_profile_safe",
  "association_company_safe",
  "relationship_graph_safe",
  "work_hub_items",
  "notification_action_safe",
] as const;
export type RelationshipMemoryAllowedSourceDomain =
  (typeof RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS)[number];

/**
 * HARD-excluded source domains. Anything in this list MUST NOT flow into a
 * memory extraction pipeline. Enforced structurally (context builders do not
 * fetch these), at runtime (eligibility.ts guard), AND at the DB (CHECK
 * constraint on business_relationship_memory_sources.source_domain).
 */
export const RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS = [
  "private_meeting_notes",
  "hidden_contact_details",
  "raw_email_inbox",
  "unrestricted_notification_payloads",
  "raw_audit_logs",
  "raw_timeline_metadata",
  "provider_secrets",
  "auth_identifiers",
  "cross_tenant_data",
] as const;
export type RelationshipMemoryExcludedSourceDomain =
  (typeof RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS)[number];

/** Per-memory-kind default sensitivity. Extractors MAY escalate, never lower. */
export const RELATIONSHIP_MEMORY_KIND_DEFAULT_SENSITIVITY: Readonly<
  Record<RelationshipMemoryKind, RelationshipMemorySensitivity>
> = Object.freeze({
  preference: "standard",
  interest: "standard",
  role_context: "public_ok",
  communication_style: "standard",
  goal: "sensitive",
  constraint: "sensitive",
  shared_history: "standard",
  commitment: "sensitive",
  milestone: "public_ok",
  risk_flag: "restricted",
  opportunity_signal: "sensitive",
  personal_context: "restricted",
});

/** Terminal statuses cannot transition further. */
export const RELATIONSHIP_MEMORY_TERMINAL_STATUSES: ReadonlyArray<RelationshipMemoryStatus> =
  Object.freeze(["dismissed", "expired"]);
