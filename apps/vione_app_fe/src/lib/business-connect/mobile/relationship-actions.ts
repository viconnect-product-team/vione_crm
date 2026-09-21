// BC-Mobile-6B — Relationship action vocabulary + deterministic availability
// resolver (client-safe, pure).
//
// Hard rules encoded here:
// - The shipped vocabulary is bounded: call / email / save_meeting_moment
//   (view_person is the row-level navigation and lives outside the sheet).
//   CREATE_FOLLOW_UP and SCHEDULE_MEETING are deliberately NOT in the shipped
//   union — the 6B audit found no safe person-scoped creation contract
//   (docs/mobile/BC_MOBILE_6B_ACTIONABILITY_AUDIT.md). Reserved kinds must
//   never be accepted from model output; unknown kinds fail safe.
// - Availability derives ONLY from the CURRENT authorized person DTO
//   (2C fail-closed resolution) — never from the cached recommendation
//   payload, which by 6A design carries no phone/email.
// - tel:/mailto: destinations are REBUILT through the centralized 5D
//   sanitizers at resolution time, never copied from arbitrary text.
// - ZERO LLM involvement: this module is deterministic policy mapping.

import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";
import { safeMailtoHref, safeTelHref } from "./public-actions";

/** Shipped action vocabulary (frozen). Order inside a policy is the render order.
 *  BC-Mobile-6D: create_follow_up + schedule_meeting are now shipped, backed by
 *  the owner-private person-plan domain (person authorization re-checked by the
 *  server fn AND by the brpp_validate_plan_target trigger). They create data
 *  visible ONLY to the viewer — no invitation, no notification to the person. */
export const RELATIONSHIP_ACTION_KINDS = [
  "call",
  "email",
  "save_meeting_moment",
  "create_follow_up",
  "schedule_meeting",
] as const;
export type RelationshipActionKind = (typeof RELATIONSHIP_ACTION_KINDS)[number];

/** Truthful result categories (§39). Call/Email handoffs are NEVER "completed". */
export type RelationshipActionResultCategory =
  | "navigated"
  | "handoff_opened"
  | "canonical_created"
  | "cancelled"
  | "failed";

export type RelationshipActionItem = {
  kind: RelationshipActionKind;
  /** Safe handoff destination (tel:/mailto:) rebuilt from the current
   *  authorized person DTO; null for in-app navigation actions. */
  destination: string | null;
};

export type RelationshipActionAvailability = {
  personId: string;
  /** Enabled actions only — unavailable actions are omitted, never disabled. */
  actions: RelationshipActionItem[];
};

/**
 * Deterministic recommendation → action policy (§34/§35). Only the 6A
 * evidence-backed "reconnect" type ships; unknown/future types fail safe to
 * zero actions (VIEW_PERSON navigation still works at row level).
 */
const ACTION_POLICY: Record<string, readonly RelationshipActionKind[]> = Object.freeze({
  reconnect: Object.freeze([
    "call",
    "email",
    "save_meeting_moment",
    "create_follow_up",
    "schedule_meeting",
  ] as const),
});

/**
 * Resolve which actions are genuinely available for THIS viewer → THIS person
 * right now. `person === null` (unavailable/blocked/error) fails closed to
 * zero actions — a stale recommendation can never authorize an action (§46).
 */
export function resolveRelationshipActions(
  person: BcMobilePersonDetail | null,
  recommendationType: string,
): RelationshipActionAvailability {
  if (!person) return { personId: "", actions: [] };
  const policy = ACTION_POLICY[recommendationType];
  if (!policy) return { personId: person.personId, actions: [] };

  const actions: RelationshipActionItem[] = [];
  for (const kind of policy) {
    switch (kind) {
      case "call": {
        const href = safeTelHref(person.contact?.phone);
        if (href) actions.push({ kind, destination: href });
        break;
      }
      case "email": {
        const href = safeMailtoHref(person.contact?.email);
        if (href) actions.push({ kind, destination: href });
        break;
      }
      case "create_follow_up":
      case "schedule_meeting": {
        // 6D: owner-private plan creation. Eligible for every authorized
        // person kind; the server fn + DB trigger re-check authorization.
        actions.push({ kind, destination: null });
        break;
      }
      case "save_meeting_moment": {
        // All three canonical person kinds are Moment-eligible (2E); the
        // composer + server re-enforce authorization. No speculative enable.
        actions.push({ kind, destination: null });
        break;
      }
    }
  }
  return { personId: person.personId, actions };
}
