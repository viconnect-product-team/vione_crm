// BC-4.1A — Business Meetings shared domain — public barrel.
//
// Backend foundation only (schema, RLS, versioned proposals, state machine,
// eligibility, repository reads). NO UI, notes, follow-ups, notifications,
// ICS/calendar sync, messaging or CRM in this slice.
//
// The controlled lifecycle mutations live in the DB as SECURITY DEFINER
// functions (business_meeting_create_draft / _propose / _propose_new_time /
// _accept / _decline / _cancel / _complete / _mark_no_show). Ordinary reads go
// through MeetingRepository. A MeetingService / SDK is intentionally deferred
// to a later slice.

export * from "./types";
export * from "./errors";
export * from "./state-machine";
export {
  classifyEligibility,
  isPairBlocked,
  requireMeetingProposalEligibility,
} from "./eligibility";
export { MeetingRepository } from "./repository";
export { mapMeetingRow, mapParticipantRow, mapProposalRow } from "./mappers";

// BC-4.1B — application service, capabilities, SDK, telemetry, query keys.
// (target.server is intentionally NOT re-exported: server-only.)
export { requireGlobalMeetingUser, type GlobalMeetingUser } from "./identity";
export { deriveMeetingViewerCapabilities, type MeetingViewerContext } from "./capabilities";
export { BusinessMeetingService, type MeetingServiceDeps } from "./service";
export { createBusinessMeetingSDK, type BusinessMeetingSDK } from "./sdk";
export { businessMeetingKeys, type MeetingListFilters } from "./query-keys";
export {
  emitMeetingTelemetry,
  withMeetingTelemetry,
  type MeetingTelemetryEvent,
  type MeetingTelemetryOp,
} from "./telemetry";
