// BC-9.0 — Business Connect Intelligence: capability & risk registry (frozen).
//
// This registry is the SINGLE source of truth for which AI capabilities exist
// in Business Connect, what risk tier each capability carries, and what safe
// source domains each capability may consume. Any code path that produces or
// audits an AI response MUST reference this registry — arbitrary capability
// names are rejected.
//
// Everything in this file is a frozen constant. Bumps go through a new
// BUSINESS_CONNECT_AI_VERSION and, where applicable, a new prompt version.

export const BUSINESS_CONNECT_AI_VERSION = "1.0.0" as const;

/** All AI capabilities exposed by Business Connect Intelligence. */
export const BUSINESS_CONNECT_AI_CAPABILITIES = [
  "relationship_briefing",
  "meeting_preparation",
  "introduction_draft",
  "follow_up_draft",
  "next_action_suggestion",
  "opportunity_signal_summary",
  "network_query",
  "work_hub_assistant",
] as const;
export type BusinessConnectAICapability = (typeof BUSINESS_CONNECT_AI_CAPABILITIES)[number];

/** Risk tiers. BC-9.0 forbids `prohibited_autonomous_action` at runtime. */
export const BUSINESS_CONNECT_AI_RISK_LEVELS = [
  "read_only_analysis",
  "draft_generation",
  "decision_support",
  "prohibited_autonomous_action",
] as const;
export type BusinessConnectAIRiskLevel = (typeof BUSINESS_CONNECT_AI_RISK_LEVELS)[number];

/** Capability → risk tier mapping. No capability maps to autonomous action. */
export const BUSINESS_CONNECT_AI_CAPABILITY_RISK: Readonly<
  Record<BusinessConnectAICapability, BusinessConnectAIRiskLevel>
> = Object.freeze({
  relationship_briefing: "read_only_analysis",
  meeting_preparation: "read_only_analysis",
  introduction_draft: "draft_generation",
  follow_up_draft: "draft_generation",
  next_action_suggestion: "decision_support",
  opportunity_signal_summary: "decision_support",
  network_query: "read_only_analysis",
  work_hub_assistant: "decision_support",
});

/** Safe source domains an AI capability may draw context from. */
export const BUSINESS_CONNECT_AI_SOURCE_DOMAINS = [
  "person_profile_safe",
  "connection_relationship_safe",
  "relationship_graph_safe",
  "introduction_safe",
  "meeting_safe",
  "agenda_safe",
  "shared_notes_safe",
  "meeting_outcome_safe",
  "follow_up_safe",
  "work_hub_items",
  "notification_action_safe",
  "association_company_safe",
  "documents_authorized",
] as const;
export type BusinessConnectAISourceDomain = (typeof BUSINESS_CONNECT_AI_SOURCE_DOMAINS)[number];

/**
 * Explicitly excluded source domains. Enforcement is structural (context
 * builders never fetch these) AND runtime (redactor asserts).
 *
 * `private_meeting_notes` is a HARD architecture invariant — see
 * docs/business-connect/intelligence/BUSINESS_CONNECT_AI_PRIVACY.md.
 */
export const BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS = [
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
export type BusinessConnectAIExcludedDomain = (typeof BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS)[number];

/** Per-capability source allowlist. Everything else is forbidden by policy. */
export const BUSINESS_CONNECT_AI_CAPABILITY_SOURCES: Readonly<
  Record<BusinessConnectAICapability, ReadonlyArray<BusinessConnectAISourceDomain>>
> = Object.freeze({
  relationship_briefing: [
    "person_profile_safe",
    "connection_relationship_safe",
    "relationship_graph_safe",
    "meeting_safe",
    "meeting_outcome_safe",
    "follow_up_safe",
    "association_company_safe",
  ],
  meeting_preparation: [
    "meeting_safe",
    "agenda_safe",
    "shared_notes_safe",
    "meeting_outcome_safe",
    "person_profile_safe",
    "connection_relationship_safe",
    "follow_up_safe",
  ],
  introduction_draft: [
    "person_profile_safe",
    "connection_relationship_safe",
    "introduction_safe",
    "association_company_safe",
  ],
  follow_up_draft: [
    "meeting_safe",
    "meeting_outcome_safe",
    "follow_up_safe",
    "shared_notes_safe",
    "person_profile_safe",
    "connection_relationship_safe",
  ],
  next_action_suggestion: [
    "work_hub_items",
    "meeting_safe",
    "follow_up_safe",
    "introduction_safe",
    "connection_relationship_safe",
  ],
  opportunity_signal_summary: [
    "relationship_graph_safe",
    "connection_relationship_safe",
    "person_profile_safe",
    "association_company_safe",
  ],
  network_query: [
    "person_profile_safe",
    "connection_relationship_safe",
    "relationship_graph_safe",
    "association_company_safe",
    "meeting_safe",
    "introduction_safe",
  ],
  work_hub_assistant: [
    "work_hub_items",
    "meeting_safe",
    "follow_up_safe",
    "introduction_safe",
    "connection_relationship_safe",
    "notification_action_safe",
  ],
});

/** AI result status lifecycle. */
export const BUSINESS_CONNECT_AI_RESULT_STATUS = [
  "generated",
  "reviewed",
  "accepted",
  "rejected",
  "expired",
] as const;
export type BusinessConnectAIResultStatus = (typeof BUSINESS_CONNECT_AI_RESULT_STATUS)[number];

/** Request status lifecycle. */
export const BUSINESS_CONNECT_AI_REQUEST_STATUS = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const;
export type BusinessConnectAIRequestStatus = (typeof BUSINESS_CONNECT_AI_REQUEST_STATUS)[number];

/** Session scope types (BC-9.0 §54). */
export const BUSINESS_CONNECT_AI_SESSION_SCOPES = [
  "global_business_connect",
  "person",
  "organization",
  "meeting",
  "introduction",
  "work_hub",
] as const;
export type BusinessConnectAISessionScope = (typeof BUSINESS_CONNECT_AI_SESSION_SCOPES)[number];

/** Confidence label — never expose raw numeric scores in DTOs. */
export const BUSINESS_CONNECT_AI_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type BusinessConnectAIConfidence = (typeof BUSINESS_CONNECT_AI_CONFIDENCE_LEVELS)[number];

export function isBusinessConnectAICapability(
  value: unknown,
): value is BusinessConnectAICapability {
  return (
    typeof value === "string" &&
    (BUSINESS_CONNECT_AI_CAPABILITIES as readonly string[]).includes(value)
  );
}

export function riskFor(capability: BusinessConnectAICapability): BusinessConnectAIRiskLevel {
  return BUSINESS_CONNECT_AI_CAPABILITY_RISK[capability];
}

export function allowedSourcesFor(
  capability: BusinessConnectAICapability,
): ReadonlyArray<BusinessConnectAISourceDomain> {
  return BUSINESS_CONNECT_AI_CAPABILITY_SOURCES[capability];
}
