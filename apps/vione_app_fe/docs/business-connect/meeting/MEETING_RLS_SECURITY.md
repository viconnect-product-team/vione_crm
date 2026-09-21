# BC-7.0 — RLS & Security

Canonical artifact: `BC4_1A_RLS_AND_PRIVACY.md`. This document freezes
the security posture under BC-7.0 with **no policy changes**.

## RLS posture

All 5 meeting tables have `ENABLE ROW LEVEL SECURITY` **and**
`FORCE ROW LEVEL SECURITY`. Service role bypass is scoped to explicit
maintenance jobs only.

## Read policies

- `business_meetings`: SELECT allowed when `auth.uid()` is a participant
  (organizer or invited).
- `business_meeting_participants`: SELECT allowed for co-participants.
- `business_meeting_proposals` + `_history`: SELECT allowed for
  participants of the parent meeting.
- `business_meeting_eligibility_snapshots`: SELECT allowed to organizer
  only.

## Write posture

All writes flow through SECURITY DEFINER RPCs invoked by server functions
under `.middleware([requireSupabaseAuth])`. Direct client-side writes are
denied by RLS. Server functions never accept `service_role`-scoped writes
for user-initiated mutations.

## Abuse controls

- Rate limits per-user via `BC4_1A_RATE_LIMITS_AND_ABUSE.md`.
- Block-list re-checks on every accept/decline/propose (server-side).
- No PII exfiltration paths — DTOs strip email/phone unless explicitly
  authorized by connection state.

## GRANT posture

All public tables carry explicit GRANTs to `authenticated` and
`service_role`. No `anon` grants (meeting data is auth-only).
