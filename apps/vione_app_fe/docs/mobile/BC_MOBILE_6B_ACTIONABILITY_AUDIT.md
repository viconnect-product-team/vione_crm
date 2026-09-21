# BC-Mobile-6B — Actionability Audit

Date: 2026-08-10. Auditor: engineering pass against the live repository.
Scope: every capability the 6B action layer could route into, classified as
`LIVE_REUSABLE` / `LIVE_NEEDS_ADAPTER` / `PARTIAL` / `NOT_AVAILABLE` /
`FORBIDDEN_FOR_6B`.

## Person resolution & contact channels

| Capability | Evidence | Classification |
| --- | --- | --- |
| Safe person resolution `u:`/`c:`/`g:` | `src/hooks/use-business-connect-person.ts` — 2C fail-closed resolver; the owner-scoped read IS the authorization; viewer-scoped query key | LIVE_REUSABLE |
| Person Detail DTO with visibility-cleared contact | `BcMobilePersonDetail.contact` (`phone`, `email`, `phoneHref`, `emailHref`) — cleared by the card's own visibility settings, sanitized via `sanitizePhoneHref`/`sanitizeEmailHref` | LIVE_REUSABLE |
| Centralized tel:/mailto: sanitizers | `src/lib/business-connect/mobile/public-actions.ts` — `safeTelHref` (digits/+ only, 6–16 digits) and `safeMailtoHref` (single recipient, no header injection). Structurally blocks `javascript:`/`data:` | LIVE_REUSABLE |
| Person Detail Call/Email actions | `PersonDetail.tsx` contact-action row — truthfully rendered only when a cleared channel exists | LIVE_REUSABLE |

## Canonical action destinations

| Capability | Evidence | Classification |
| --- | --- | --- |
| VIEW_PERSON | Route `/connect-app/network/$personId` (2C) | LIVE_REUSABLE |
| CALL | `tel:` handoff from the authorized person DTO; OS owns the call; completion unknowable | LIVE_REUSABLE |
| EMAIL | `mailto:` handoff; send unknowable | LIVE_REUSABLE |
| SAVE_MEETING_MOMENT | Route `/connect-app/moment/$personId` → `MomentComposer` (2E); supports all three person kinds (`moment.service.ts` target union: connection / saved_card / guest_contact); explicit Save; server-side prepare/finalize authZ | LIVE_REUSABLE |
| CREATE_FOLLOW_UP | The ONLY follow-up creation contract is `createMeetingFollowUpFn` (`src/lib/meeting/follow-up/functions.ts`) — **meeting-scoped** (`meetingId` required, organizer/participant authZ). The Work Hub (`src/lib/business-connect/work-hub/`) is a frozen READ-MODEL: "never mutates canonical records itself". No person-scoped task/follow-up creation contract exists | NOT_AVAILABLE — omitted, not faked (spec §20) |
| SCHEDULE_MEETING | Server contract `createMeetingDraftFn` exists (`src/lib/business-meetings.functions.ts`, `targetCardSlug` + explicit input), but **no UI composer/route consumes it** — no existing meeting-creation handoff surface. Building a new calendar/composer is explicitly out of 6B scope (spec §24–§26) | NOT_AVAILABLE — omitted, documented for a future phase |
| DISMISS_RECOMMENDATION | 6A dismiss (snooze metadata only) | LIVE_REUSABLE (unchanged) |

## Forbidden for 6B (confirmed absent)

AI-generated autonomous messages, automatic email send / phone call / meeting
booking / task creation, WhatsApp/Zalo/Telegram bots, AI SDR, mass outreach,
CRM pipeline, lead/relationship scoring, calendar auto-scheduling, AI chat —
none exist and none are introduced.

## Decisions frozen by this audit

1. Shipped action vocabulary: `VIEW_PERSON` (row navigation), `CALL`, `EMAIL`,
   `SAVE_MEETING_MOMENT`. `CREATE_FOLLOW_UP` / `SCHEDULE_MEETING` stay OUT of
   the shipped union so neither UI nor any model output can name them.
2. Action availability derives from the CURRENT authorized person DTO
   (`useBusinessConnectPerson`), never from the cached recommendation DTO —
   which by 6A design carries no phone/email.
3. Home remains one-tap-to-Person (no action buttons on Home rows).
4. Person Detail gains ONE contextual entry ([Liên hệ]) →
   `RelationshipActionSheet` with available actions only.
