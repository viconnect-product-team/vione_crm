# BC-4.0 — Security & Test Plan

Business Connect v1 — FROZEN. Tests defined for later implementation (BC-4.1x).

## Error contract (stable; no raw SQL/RLS/provider errors to clients)

`MEETING_AUTH_REQUIRED, MEETING_ACCOUNT_INACTIVE, MEETING_ACCOUNT_SUSPENDED,
MEETING_TARGET_NOT_FOUND, MEETING_TARGET_UNAVAILABLE, MEETING_BLOCKED,
MEETING_CONNECTION_REQUIRED, MEETING_NOT_FOUND, MEETING_NOT_PARTICIPANT,
MEETING_NOT_ORGANIZER, MEETING_INVALID_TRANSITION, MEETING_STALE_VERSION,
MEETING_TIME_INVALID, MEETING_TIME_CONFLICT, MEETING_RATE_LIMITED,
MEETING_MUTATION_CONFLICT, FOLLOWUP_NOT_FOUND, FOLLOWUP_FORBIDDEN,
MEETING_UNKNOWN`.

Mapping mirrors `toGlobalNetworkError`: any raw message containing a known code
surfaces that code; everything else → `MEETING_UNKNOWN`.

## Rate limiting & abuse

Server-enforced: 10 proposals/hour, 30/day; per-pair cooldown after repeated
decline; reschedule cap per meeting; stricter caps for "public-profile-only"
proposers. Reuse Global Network guarded-RPC counting + `gn_reports`.

## Audit & observability

Audit: proposal, response, reschedule, cancellation, completion, no_show,
moderator action, (later) calendar sync. Telemetry (low-cardinality): action,
result, stable error code, latency, meeting_type, source_type, timezone-offset
category, notification-enqueue result, reminder-delivery result, conflict/stale
count. **Never log**: private notes, meeting URL, hidden contact data, full
participant lists, auth tokens.

## Data retention

No hard delete of lifecycle records (proposed/declined/cancelled/completed).
Participants may hide/archive from UI. Private notes soft-deleted per policy.
Audit is immutable. GDPR deletion workflow documented. Deleting a Business
Profile must not silently destroy meeting history.

## Test matrix

**State machine:** draft→proposed; proposed→confirmed; proposed→declined;
proposed→cancelled; confirmed→completed; confirmed→cancelled; terminal-state
mutation rejected; stale proposal version rejected.

**Authorization:** global user w/o member row can participate; unrelated user
cannot read; Association admin cannot read; Company admin cannot read employee
meeting; participant can read; organizer permissions enforced; participant
response permissions enforced; private follow-up owner-only.

**Security:** target spoofing rejected; arbitrary participant injection rejected;
direct status update denied; anonymous denied; blocked pair cannot propose;
hidden contact data not copied; meeting URL participant-private; raw SQL/RLS
errors not exposed.

**Concurrency:** duplicate proposal idempotent; concurrent accept safe;
cancel/accept race deterministic; concurrent reschedule version-safe; reminder
dedupe; interaction event dedupe.

**Timezone:** UTC storage; IANA preserved; DST transition correct; cross-tz
rendering correct; ICS SEQUENCE increments; cancelled ICS valid.

**Follow-up:** participant creates own; counterpart cannot read; completion
creates expected interaction event; cancellation doesn't delete private follow-up
unexpectedly.

**Regression:** Global Networking unchanged; Saved Cards unchanged; Business
Profile SEO unchanged; Association Events unchanged; legacy networking unchanged;
typecheck clean; i18n complete; accessibility plan complete.
