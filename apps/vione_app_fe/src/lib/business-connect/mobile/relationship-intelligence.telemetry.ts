// BC-Mobile-6A — Relationship Intelligence telemetry (allowlist only).
//
// Metrics are enumerable names with coarse, non-identifying metadata.
// NEVER log: person ids, tokens, names, suggestion text, prompts, or AI
// payloads. Same discipline as identity.telemetry.ts (5A–5E).

export type RelationshipIntelMetric =
  | "RELATIONSHIP_RECOMMENDATION_REQUESTED"
  | "RELATIONSHIP_RECOMMENDATION_RENDERED"
  | "RELATIONSHIP_RECOMMENDATION_OPENED"
  | "RELATIONSHIP_RECOMMENDATION_DISMISSED"
  | "RELATIONSHIP_RECOMMENDATION_RENDER_BLOCKED_MISSING_EVIDENCE"
  | "RELATIONSHIP_AI_GROUNDING_REJECTED"
  | "RELATIONSHIP_AI_FALLBACK_USED"
  // BC-Mobile-6B — human-confirmed action intents. NEVER "call completed" /
  // "email sent" — tel:/mailto: handoffs are unknowable by design (§12/§14).
  | "RELATIONSHIP_ACTION_SHEET_OPENED"
  | "RELATIONSHIP_ACTION_SELECTED"
  | "RELATIONSHIP_CALL_OPENED"
  | "RELATIONSHIP_EMAIL_OPENED"
  | "RELATIONSHIP_MOMENT_FLOW_OPENED"
  | "RELATIONSHIP_ACTION_FAILED"
  // BC-Mobile-6C — personalization lifecycle. Coarse metadata only.
  | "PERSONALIZATION_SETTINGS_UPDATED"
  | "PERSONALIZATION_RESET"
  | "PERSONALIZATION_ADAPTATION_APPLIED"
  | "PERSONALIZATION_FALLBACK_DEFAULT";

export type RelationshipIntelSurface = "home" | "person";

type Meta = {
  surface?: RelationshipIntelSurface;
  /** Coarse counts only (e.g. rendered rows) — never identifiers. */
  count?: number;
  /** Allowlisted rejection/fallback reasons. */
  reason?: "no_evidence" | "grounding" | "schema" | "timeout" | "gateway" | "disabled";
  /** 6B: allowlisted action kind (vocabulary from relationship-actions.ts). */
  action?:
    | "call"
    | "email"
    | "save_meeting_moment"
    | "create_follow_up"
    | "schedule_meeting";
  /** 6B: allowlisted recommendation type. */
  recommendationType?: "reconnect";
  /** 6B: truthful result category — never "completed"/"sent" for handoffs. */
  result?: "navigated" | "handoff_opened" | "canonical_created" | "cancelled" | "failed";
};

export function trackRelationshipIntel(metric: RelationshipIntelMetric, meta?: Meta): void {
  try {
    console.info("[BC-Mobile][6A]", metric, meta ?? {});
  } catch {
    /* telemetry must never break UX */
  }
}
