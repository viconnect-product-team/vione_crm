# BC-Mobile-6B — Closure Report

## Scope delivered
Human-confirmed action routing for 6A Relationship Intelligence:
recommendation → contextual [ Liên hệ ] entry (Person Detail) →
RelationshipActionSheet → truthful handoffs (tel:/mailto:) and canonical
navigation (Moment composer). Home surface intentionally unchanged.

## Actionability audit outcome
- LIVE_REUSABLE: VIEW_PERSON, CALL, EMAIL, SAVE_MEETING_MOMENT,
  DISMISS_RECOMMENDATION (docs/mobile/BC_MOBILE_6B_ACTIONABILITY_AUDIT.md).
- NOT_AVAILABLE (omitted, not faked): CREATE_FOLLOW_UP (no person-scoped
  creation contract; follow-ups are meeting-scoped), SCHEDULE_MEETING
  (server contract exists, no UI composer surface).

## Implementation
- `relationship-actions.ts` — frozen vocabulary + deterministic resolver;
  availability from current authorized person DTO only; tel:/mailto:
  rebuilt via 5D sanitizers.
- `RelationshipActionSheet.tsx` — vaul Drawer, available-actions-only,
  a11y labels, semantic tokens.
- `PersonSuggestion.tsx` — [ Liên hệ ] pill gated on authorized person +
  ≥1 available action; sheet wiring.
- Telemetry: 6 new allowlisted metrics; truthful result categories; no PII.
- i18n: 11 new typed keys, VI + EN.
- Zero migrations, zero new server functions, zero LLM calls.

## Verification
- `relationship-actions.bcm6b.test.ts` — 10 tests: policy order, omission
  semantics, hostile phone/email fixtures, stored-href distrust, unknown
  types fail safe, null person fails closed, u:/c:/g: parity, static
  no-autonomy gate, static no-LLM gate.
- `relationship-action-sheet.bcm6b.test.tsx` — 6 tests: authorization
  gating, truthful handoffs + PII-free telemetry, unavailable-action
  omission, moment navigation, handoff_opened semantics, EN copy + axe
  light/dark.
- 6B suite: 16/16 pass. 6A regression: 47/47 pass.
- `tsgo --noEmit` clean; `check-i18n.mjs` clean (3577 keys).

## Known limits / follow-ups
- CREATE_FOLLOW_UP and SCHEDULE_MEETING remain out of the action union
  until real person-scoped contracts/UI composers exist; the audit doc is
  the entry point for that future phase.
- Call/Email outcomes are unknowable by design (OS handoffs) — telemetry
  intentionally stops at "opened".
