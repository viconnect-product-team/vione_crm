// BC-9.0 — Context minimization windows & bounds (§11, §12, §38, §44, §58).
// These are frozen policy constants consumed by context builders and the
// runtime. Changes require a new BUSINESS_CONNECT_AI_VERSION.

import type { BusinessConnectAICapability } from "./registry";

export const BUSINESS_CONNECT_AI_POLICY_VERSION = "1.0.0" as const;

export const CONTEXT_WINDOWS = Object.freeze({
  relationshipRecentActivityDays: 90,
  relationshipRecentActivityMax: 20,
  meetingHistoryMax: 10,
  followUpsMax: 20,
  introductionsMax: 10,
  workHubItemsMax: 30,
  sharedNotesMax: 20,
  agendaItemsMax: 50,
});

export const RESULT_EXPIRY_SECONDS: Readonly<Record<BusinessConnectAICapability, number>> =
  Object.freeze({
    relationship_briefing: 24 * 60 * 60,
    meeting_preparation: 6 * 60 * 60, // or until meeting starts (runtime enforced)
    introduction_draft: 24 * 60 * 60,
    follow_up_draft: 24 * 60 * 60,
    next_action_suggestion: 60 * 60,
    opportunity_signal_summary: 24 * 60 * 60,
    network_query: 60 * 60,
    work_hub_assistant: 60 * 60,
  });

export const TOOL_LOOP_LIMITS = Object.freeze({
  maxToolCallsPerRequest: 8,
  maxIterations: 6,
  maxTotalFacts: 100,
  maxWallClockMs: 45_000,
});

/** Per-user daily rate limits (§58). Tenants/plans may override at runtime. */
export const DEFAULT_DAILY_RATE_LIMITS: Readonly<Record<BusinessConnectAICapability, number>> =
  Object.freeze({
    relationship_briefing: 20,
    meeting_preparation: 20,
    introduction_draft: 30,
    follow_up_draft: 30,
    next_action_suggestion: 50,
    opportunity_signal_summary: 20,
    network_query: 50,
    work_hub_assistant: 50,
  });

/**
 * Structural cap on prompt+context payload size (chars). Runtime enforces a
 * stricter token budget per model; this is a defensive outer bound so a
 * pathological context can never reach the provider.
 */
export const MAX_CONTEXT_ENVELOPE_CHARS = 48_000;
