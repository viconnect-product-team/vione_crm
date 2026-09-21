// BC-Mobile-6C — Personalization engine (PURE).
//
// No I/O, no Supabase, no AI, no randomness. Given explicit preferences +
// coarse interaction events + a clock, derives the effective profile:
// reconnect threshold (30/45/60) and preferred contact action for ORDERING.
// Same inputs ⇒ same outputs (tests pin this). Explicit settings always win
// over behavioral adaptation. Moment selections NEVER influence contact
// ordering. Per-person ranking/scoring is impossible by construction —
// events carry no personId.

import type {
  RelationshipIntelInteraction,
  RelationshipIntelPreferencesDTO,
  RelationshipPersonalizationConfig,
  RelationshipPersonalizationProfile,
  RelationshipReconnectCadence,
} from "./relationship-personalization.types";
import type { RelationshipActionItem } from "./relationship-actions";

const MS_PER_DAY = 86_400_000;

const EXPLICIT_CADENCE_DAYS: Record<Exclude<RelationshipReconnectCadence, "auto">, number> = {
  more_often: 30,
  normal: 45,
  less_often: 60,
};

function inWindow(iso: string, nowMs: number, windowDays: number): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return t <= nowMs && t >= nowMs - windowDays * MS_PER_DAY;
}

/** Adaptive cadence: high dismiss ratio ⇒ one step quieter (45 → 60). */
function deriveAdaptiveThresholdDays(
  interactions: readonly RelationshipIntelInteraction[],
  nowMs: number,
  config: RelationshipPersonalizationConfig,
): number | null {
  const relevant = interactions.filter(
    (i) =>
      i.recommendationType === "reconnect" &&
      (i.kind === "recommendation_opened" || i.kind === "recommendation_dismissed") &&
      inWindow(i.occurredAt, nowMs, config.BEHAVIOR_WINDOW_DAYS),
  );
  const opened = relevant.filter((i) => i.kind === "recommendation_opened").length;
  const dismissed = relevant.filter((i) => i.kind === "recommendation_dismissed").length;
  const total = opened + dismissed;
  if (total < config.MIN_RECONNECT_EVENTS_FOR_ADAPTATION) return null;
  if (dismissed / total >= config.RECONNECT_DISMISS_ADAPT_RATIO) {
    return config.RECONNECT_LESS_OFTEN_DAYS;
  }
  return null;
}

/** Adaptive action preference from the most recent contact selections. */
function deriveAdaptivePreferredAction(
  interactions: readonly RelationshipIntelInteraction[],
  nowMs: number,
  config: RelationshipPersonalizationConfig,
): "call" | "email" | null {
  const contactEvents = interactions
    .filter(
      (i) =>
        (i.kind === "action_call_selected" || i.kind === "action_email_selected") &&
        inWindow(i.occurredAt, nowMs, config.BEHAVIOR_WINDOW_DAYS),
    )
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, config.ACTION_PREFERENCE_WINDOW);
  if (contactEvents.length < config.MIN_ACTION_EVENTS_FOR_PREFERENCE) return null;
  const calls = contactEvents.filter((i) => i.kind === "action_call_selected").length;
  const emails = contactEvents.length - calls;
  if (calls / contactEvents.length >= config.ACTION_PREFERENCE_THRESHOLD) return "call";
  if (emails / contactEvents.length >= config.ACTION_PREFERENCE_THRESHOLD) return "email";
  return null;
}

/**
 * Derive the effective personalization profile.
 * Precedence: EXPLICIT setting > ADAPTIVE (auto + learning on) > DEFAULT.
 */
export function derivePersonalizationProfile(
  preferences: RelationshipIntelPreferencesDTO,
  interactions: readonly RelationshipIntelInteraction[],
  nowMs: number,
  config: RelationshipPersonalizationConfig,
): RelationshipPersonalizationProfile {
  // ── Cadence ─────────────────────────────────────────────────────────────
  let reconnectThresholdDays: number;
  let cadenceSource: RelationshipPersonalizationProfile["cadenceSource"];
  if (preferences.reconnectCadence !== "auto") {
    reconnectThresholdDays = EXPLICIT_CADENCE_DAYS[preferences.reconnectCadence];
    cadenceSource = "explicit";
  } else if (!preferences.behavioralAdaptationEnabled) {
    reconnectThresholdDays = config.RECONNECT_NORMAL_DAYS;
    cadenceSource = "default";
  } else {
    const adaptive = deriveAdaptiveThresholdDays(interactions, nowMs, config);
    reconnectThresholdDays = adaptive ?? config.RECONNECT_NORMAL_DAYS;
    cadenceSource = adaptive === null ? "default" : "adaptive";
  }

  // ── Contact action ──────────────────────────────────────────────────────
  let preferredAction: "call" | "email" | null;
  let actionSource: RelationshipPersonalizationProfile["actionSource"];
  if (preferences.preferredContactAction !== "auto") {
    preferredAction = preferences.preferredContactAction;
    actionSource = "explicit";
  } else if (!preferences.behavioralAdaptationEnabled) {
    preferredAction = null;
    actionSource = "default";
  } else {
    const adaptive = deriveAdaptivePreferredAction(interactions, nowMs, config);
    preferredAction = adaptive;
    actionSource = adaptive === null ? "default" : "adaptive";
  }

  return Object.freeze({ reconnectThresholdDays, cadenceSource, preferredAction, actionSource });
}

/**
 * Reorder quick actions by preferred contact channel. Presentation-only:
 * the input list (already availability-resolved by 6B) is preserved — no
 * action is added, removed, enabled, or disabled. Contact actions lead,
 * the preferred one first; MOMENT is never placed above contact actions.
 */
export function orderRelationshipActions(
  actions: readonly RelationshipActionItem[],
  preferredAction: "call" | "email" | null,
): RelationshipActionItem[] {
  if (actions.length < 2) return [...actions];
  const contacts = actions.filter((a: any) => a.kind === "call" || a.kind === "email");
  const moment = actions.filter((a: any) => a.kind === "save_meeting_moment");
  const others = actions.filter(
    (a) => a.kind !== "call" && a.kind !== "email" && a.kind !== "save_meeting_moment",
  );
  const orderedContacts =
    preferredAction === null
      ? contacts
      : [...contacts].sort((a, b) =>
          a.kind === preferredAction ? -1 : b.kind === preferredAction ? 1 : 0,
        );
  return [...orderedContacts, ...others, ...moment];
}
