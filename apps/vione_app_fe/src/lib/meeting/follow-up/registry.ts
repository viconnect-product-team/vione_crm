// BC-7.9 Turn B — Frozen follow-up registry.

import {
  MEETING_FOLLOW_UP_PRIORITIES,
  MEETING_FOLLOW_UP_STATUSES,
  type MeetingFollowUpPriority,
  type MeetingFollowUpStatus,
} from "./types";

export const MEETING_FOLLOW_UP_VERSION = "1.0.0" as const;

const STATUS_SET: ReadonlySet<string> = new Set(MEETING_FOLLOW_UP_STATUSES);
const PRIORITY_SET: ReadonlySet<string> = new Set(MEETING_FOLLOW_UP_PRIORITIES);

export function isKnownFollowUpStatus(v: unknown): v is MeetingFollowUpStatus {
  return typeof v === "string" && STATUS_SET.has(v);
}

export function isKnownFollowUpPriority(v: unknown): v is MeetingFollowUpPriority {
  return typeof v === "string" && PRIORITY_SET.has(v);
}

export const MeetingFollowUpRegistry = Object.freeze({
  version: MEETING_FOLLOW_UP_VERSION,
  statuses: MEETING_FOLLOW_UP_STATUSES,
  priorities: MEETING_FOLLOW_UP_PRIORITIES,
  isKnownStatus: isKnownFollowUpStatus,
  isKnownPriority: isKnownFollowUpPriority,
});
