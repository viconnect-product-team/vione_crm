# BC-7.0 — Participant Model

Canonical artifact: `business_meeting_participants` +
`BC4_0_PARTICIPANT_AND_PRIVACY_MODEL.md`.

## Roles

- `organizer` — exactly one per meeting; sole proposer / canceller.
- `required` — must accept for the meeting to reach `confirmed`.
- `optional` — informational; response does not gate confirmation.

## Response states

`invited`, `accepted`, `declined`, `tentative`, `no_response`.

## Privacy

Participant identity is scoped by Platform Identity (`user_profiles`).
RLS restricts SELECT to actual participants; non-participants see nothing
(no leakage via count or existence checks). Cross-tenant traversal is
forbidden — participants are always resolved through the identity bridge.

## Capability derivation

Viewer capabilities derive from `(status, viewerRole)` via
`deriveMeetingViewerCapabilities` in
`src/lib/business-meetings/capabilities.ts` — the only source of truth
for UI enablement. See `business-meetings.bc41b.test.ts`.
