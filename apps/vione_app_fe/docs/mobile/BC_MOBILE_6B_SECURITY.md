# BC-Mobile-6B — Security Contract: Relationship Intelligence Actions

## Authorization model
- **No new authority.** Action availability derives ONLY from the current
  authorized person DTO resolved by the 2C fail-closed resolver
  (`useBusinessConnect-person`): the owner-scoped DB read IS the
  authorization. Viewer-scoped query keys (6A) remain the cache boundary.
- **Stale recommendations are not authority.** The cached 6A recommendation
  DTO carries no phone/email and is never consulted for availability. The
  resolver receives the live person DTO; `null` (unavailable/blocked/error)
  → zero actions.
- **Server-side authZ unchanged:** Moment creation re-enforces eligibility
  in `moment.service.ts` (prepare/finalize). No new server endpoints, no
  new mutations, no RLS changes in 6B.

## Transport safety (tel:/mailto:)
- Destinations are REBUILT at resolution time from the DTO raw values via
  the centralized 5D sanitizers (`safeTelHref` / `safeMailtoHref`):
  - tel: digits/`+` only, 6–16 digits.
  - mailto: single address, no `?`/`&`/newline — header-injection proof.
  - `javascript:`/`data:`/any other scheme is structurally impossible.
- Stored `phoneHref`/`emailHref` strings are never trusted; the resolver
  re-derives from raw values (test-pinned with hostile fixtures).

## Deterministic action routing (anti-hallucination)
- Action availability is **deterministic policy mapping**
  (`relationship-actions.ts`): recommendation type → ordered action list.
- **No LLM anywhere in 6B.** The 6A wording generator is untouched; its
  output is display-only text and can never name an action (the shipped
  action union has no CREATE_FOLLOW_UP/SCHEDULE_MEETING kinds).
- Unknown/future recommendation types fail safe to zero actions.

## Telemetry (allowlist, no PII)
- New metrics: `RELATIONSHIP_ACTION_SHEET_OPENED`,
  `RELATIONSHIP_ACTION_SELECTED`, `RELATIONSHIP_CALL_OPENED`,
  `RELATIONSHIP_EMAIL_OPENED`, `RELATIONSHIP_MOMENT_FLOW_OPENED`,
  `RELATIONSHIP_ACTION_FAILED`.
- Meta allowlist: `surface`, `action`, `recommendationType`, `result`.
  Truthful result categories only (`navigated` / `handoff_opened` /
  `canonical_created` / `cancelled` / `failed`) — never "call completed"
  or "email sent".
- No person identifiers, names, phone numbers, or emails in any payload
  (test-pinned against serialized console output).

## Static gates (test-pinned)
- 6A intelligence modules + 6B action modules never import
  mutation/creation machinery (`createMeetingFollowUpFn`,
  `createMeetingDraftFn`, `moment.functions`, email/notification senders).
- 6B action layer contains zero LLM imports.

## Deliberately NOT available in 6B
| Action | Reason |
| --- | --- |
| CREATE_FOLLOW_UP | Only meeting-scoped contract exists (`meetingId` required); Work Hub is a frozen read-model. No person-scoped creation contract. |
| SCHEDULE_MEETING | Server draft contract exists but has no UI composer surface; building one is out of 6B scope. |
Both are omitted — not faked — and excluded from the shipped action union.
