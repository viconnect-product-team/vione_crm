// BC-7.8 Turn A — Pure bucket derivation (spec §4).
// Never treats past scheduled_end_at as completed; lifecycle state is authoritative.

import type { BusinessMeetingStatus } from "@/lib/business-meetings/types";
import { TERMINAL_STATUSES } from "@/lib/business-meetings/state-machine";
import type { MeetingSchedulingMode, MeetingWorkspaceBucket } from "./types";

export interface DeriveBucketInput {
  status: BusinessMeetingStatus;
  schedulingMode: MeetingSchedulingMode;
  scheduledStartAt: string | null;
  /** Server-provided reference time; injected for determinism. */
  now: string;
}

export function isTerminalMeetingStatus(status: BusinessMeetingStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Deterministic classification (§4):
 *   HISTORY     = completed | cancelled | declined | no_show
 *   UPCOMING    = confirmed AND scheduled AND start >= now
 *   UNSCHEDULED = non-terminal active AND no canonical selected schedule
 *   OVERVIEW    = fallback bucket for anything else non-terminal
 *                 (e.g. confirmed + scheduled but start < now — NOT completed)
 *
 * Past scheduled_end_at NEVER implies completed.
 */
export function deriveBucket(input: DeriveBucketInput): MeetingWorkspaceBucket {
  const { status, schedulingMode, scheduledStartAt, now } = input;

  // Terminal — history bucket.
  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "declined" ||
    status === "no_show"
  ) {
    return "history";
  }

  // Draft / proposed / confirmed-but-not-scheduled → unscheduled bucket.
  if (schedulingMode !== "scheduled" || !scheduledStartAt) {
    return "unscheduled";
  }

  // Confirmed + scheduled + still in the future → upcoming.
  if (status === "confirmed" && scheduledStartAt >= now) {
    return "upcoming";
  }

  // Scheduled meeting whose start has already passed while still non-terminal:
  // lifecycle is authoritative, so it stays under overview until an authority
  // (organizer/participant) transitions it. Spec §4/§27.
  return "overview";
}
