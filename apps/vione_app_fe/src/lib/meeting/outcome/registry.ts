// BC-7.9 Turn A — Frozen outcome registry (types, statuses, transitions).

import {
  MEETING_OUTCOME_STATUSES,
  MEETING_OUTCOME_TYPES,
  type MeetingOutcomeStatus,
  type MeetingOutcomeType,
} from "./types";

export const MEETING_OUTCOME_VERSION = "1.0.0" as const;

const TYPE_SET: ReadonlySet<string> = new Set(MEETING_OUTCOME_TYPES);
const STATUS_SET: ReadonlySet<string> = new Set(MEETING_OUTCOME_STATUSES);

export function isKnownOutcomeType(v: unknown): v is MeetingOutcomeType {
  return typeof v === "string" && TYPE_SET.has(v);
}

export function isKnownOutcomeStatus(v: unknown): v is MeetingOutcomeStatus {
  return typeof v === "string" && STATUS_SET.has(v);
}

/** draft → finalized is the only allowed transition; finalize→finalize is idempotent. */
export function isAllowedStatusTransition(
  from: MeetingOutcomeStatus,
  to: MeetingOutcomeStatus,
): boolean {
  if (from === "draft" && to === "finalized") return true;
  if (from === "finalized" && to === "finalized") return true; // idempotent
  return false;
}

export const MeetingOutcomeRegistry = Object.freeze({
  version: MEETING_OUTCOME_VERSION,
  types: MEETING_OUTCOME_TYPES,
  statuses: MEETING_OUTCOME_STATUSES,
  isKnownType: isKnownOutcomeType,
  isKnownStatus: isKnownOutcomeStatus,
  isAllowedTransition: isAllowedStatusTransition,
});
