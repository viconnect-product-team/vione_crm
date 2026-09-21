// BC-7.10 Turn A — Frozen agenda registry.

import { MEETING_AGENDA_STATUSES, type MeetingAgendaStatus } from "./types";

export const MEETING_COLLABORATION_VERSION = "1.0.0" as const;

const STATUS_SET: ReadonlySet<string> = new Set(MEETING_AGENDA_STATUSES);

export function isKnownAgendaStatus(v: unknown): v is MeetingAgendaStatus {
  return typeof v === "string" && STATUS_SET.has(v);
}

/** Frozen transitions per BC-7.10 spec. Terminal: discussed, skipped. */
export function isAllowedAgendaTransition(
  from: MeetingAgendaStatus,
  to: MeetingAgendaStatus,
): boolean {
  if (from === "planned" && (to === "in_discussion" || to === "discussed" || to === "skipped")) {
    return true;
  }
  if (from === "in_discussion" && (to === "discussed" || to === "skipped")) {
    return true;
  }
  return false;
}

export const MeetingAgendaRegistry = Object.freeze({
  version: MEETING_COLLABORATION_VERSION,
  statuses: MEETING_AGENDA_STATUSES,
  isKnownStatus: isKnownAgendaStatus,
  isAllowedTransition: isAllowedAgendaTransition,
});
