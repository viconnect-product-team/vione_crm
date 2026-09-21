// BC-Mobile-6C — Relationship Intelligence Personalization types (client-safe).
//
// The personalization domain stores ONLY: explicit viewer switches, allowlisted
// enums, and coarse interaction events (kind + timestamp). It NEVER stores:
// notes, moment content, contact details, person ids on events, scores,
// probabilities, business value, or any per-person ranking. Learning is
// viewer-global (platform-user scope, same as 6A dismissals) and fully
// resettable.

/** Explicit reconnect cadence. "auto" = NORMAL baseline + bounded adaptation. */
export type RelationshipReconnectCadence = "auto" | "more_often" | "normal" | "less_often";

/** Explicit preferred contact action. "auto" = adapt from action selections. */
export type RelationshipPreferredContactAction = "auto" | "call" | "email";

/** Allowlisted behavioral interaction kinds — the ONLY recordable events. */
export type RelationshipIntelInteractionKind =
  | "recommendation_opened"
  | "recommendation_dismissed"
  | "action_call_selected"
  | "action_email_selected"
  | "action_person_opened"
  | "action_moment_selected";

export const RELATIONSHIP_INTEL_INTERACTION_KINDS: readonly RelationshipIntelInteractionKind[] =
  Object.freeze([
    "recommendation_opened",
    "recommendation_dismissed",
    "action_call_selected",
    "action_email_selected",
    "action_person_opened",
    "action_moment_selected",
  ]);

/** Transparent personalization constants — no black boxes. */
export const RELATIONSHIP_PERSONALIZATION_CONFIG = Object.freeze({
  /** Versioned policy contract (bump on any rule change). */
  POLICY_VERSION: "v1",
  /** Reconnect threshold per explicit cadence (days since last interaction). */
  RECONNECT_MORE_OFTEN_DAYS: 30,
  /** Baseline — identical to the frozen 6A RECONNECT_AFTER_DAYS. */
  RECONNECT_NORMAL_DAYS: 45,
  RECONNECT_LESS_OFTEN_DAYS: 60,
  /** Behavioral learning window; older events are ignored and pruned. */
  BEHAVIOR_WINDOW_DAYS: 90,
  /** Minimum reconnect outcomes before any adaptive cadence shift. */
  MIN_RECONNECT_EVENTS_FOR_ADAPTATION: 5,
  /** Dismiss ratio (dismissed / (opened + dismissed)) that shifts cadence quieter. */
  RECONNECT_DISMISS_ADAPT_RATIO: 0.8,
  /** Minimum contact-action selections before an adaptive preference forms. */
  MIN_ACTION_EVENTS_FOR_PREFERENCE: 5,
  /** Only the most recent N contact selections are considered. */
  ACTION_PREFERENCE_WINDOW: 10,
  /** Share of recent selections needed for one channel to be preferred. */
  ACTION_PREFERENCE_THRESHOLD: 0.7,
});

export type RelationshipPersonalizationConfig = typeof RELATIONSHIP_PERSONALIZATION_CONFIG;

/** Explicit viewer preferences (one row per viewer; conservative defaults). */
export type RelationshipIntelPreferencesDTO = {
  recommendationsEnabled: boolean;
  reconnectEnabled: boolean;
  reconnectCadence: RelationshipReconnectCadence;
  preferredContactAction: RelationshipPreferredContactAction;
  behavioralAdaptationEnabled: boolean;
  policyVersion: string;
  updatedAt: string | null;
};

export const DEFAULT_RELATIONSHIP_INTEL_PREFERENCES: RelationshipIntelPreferencesDTO =
  Object.freeze({
    recommendationsEnabled: true,
    reconnectEnabled: true,
    reconnectCadence: "auto",
    preferredContactAction: "auto",
    behavioralAdaptationEnabled: true,
    policyVersion: RELATIONSHIP_PERSONALIZATION_CONFIG.POLICY_VERSION,
    updatedAt: null,
  });

export type UpdateRelationshipIntelPreferencesInput = Partial<
  Pick<
    RelationshipIntelPreferencesDTO,
    | "recommendationsEnabled"
    | "reconnectEnabled"
    | "reconnectCadence"
    | "preferredContactAction"
    | "behavioralAdaptationEnabled"
  >
>;

/** One recorded interaction — kind + timestamp only, never content/person. */
export type RelationshipIntelInteraction = {
  kind: RelationshipIntelInteractionKind;
  recommendationType: "reconnect" | null;
  occurredAt: string;
};

/** Derived profile — the only output personalization may feed downstream. */
export type RelationshipPersonalizationProfile = Readonly<{
  /** Effective reconnect threshold in days (30 | 45 | 60). */
  reconnectThresholdDays: number;
  cadenceSource: "explicit" | "adaptive" | "default";
  /** Preferred contact channel for action ORDERING; null = default order. */
  preferredAction: "call" | "email" | null;
  actionSource: "explicit" | "adaptive" | "default";
}>;

/** Policy consumed by 6A composition (server-side suppression + threshold). */
export type RelationshipPersonalizationPolicy = Readonly<{
  recommendationsEnabled: boolean;
  reconnectEnabled: boolean;
  reconnectThresholdDays: number;
  cadenceSource: "explicit" | "adaptive" | "default";
}>;

export type BcMobileGetPersonalizationResult = {
  preferences: RelationshipIntelPreferencesDTO;
  profile: RelationshipPersonalizationProfile;
};

export type BcMobileUpdateRelationshipIntelPreferencesResult = BcMobileGetPersonalizationResult;
export type BcMobileRecordInteractionResult = { ok: true; recorded: boolean };
export type BcMobileResetPersonalizationResult = { ok: true };
