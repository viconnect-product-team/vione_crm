// BC-7.7 Turn B1 — Application-layer authority checks.
// The DB re-checks under lock; these are the fast rejects that keep the
// service from issuing an RPC guaranteed to fail authority.

import { CalendarError } from "./errors";

export interface MeetingAuthorityInputs {
  organizerUserId: string;
  participantUserIds: string[];
}

export function requireOrganizer(callerUserId: string, m: MeetingAuthorityInputs): void {
  if (callerUserId !== m.organizerUserId) {
    throw new CalendarError("MEETING_TIME_PROPOSAL_FORBIDDEN");
  }
}

export function requireParticipant(callerUserId: string, m: MeetingAuthorityInputs): void {
  if (callerUserId !== m.organizerUserId && !m.participantUserIds.includes(callerUserId)) {
    throw new CalendarError("MEETING_TIME_PROPOSAL_FORBIDDEN");
  }
}
