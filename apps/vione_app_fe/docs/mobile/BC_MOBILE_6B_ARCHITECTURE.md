# BC-Mobile-6B — Architecture: Relationship Intelligence Actions

## Overview
6B turns the 6A evidence-backed recommendations into human-confirmed
actions by **routing into existing canonical surfaces only**. No new
domains, tables, RLS, server functions, or LLM calls.

```text
6A recommendation (cached, display-only)
        │  (viewer taps [ Liên hệ ] on Person Detail)
        ▼
useBusinessConnectPerson ──► CURRENT authorized person DTO (2C fail-closed)
        │
        ▼
resolveRelationshipActions(person, recommendation.type)   [deterministic]
        │  availability from DTO contact fields via safeTelHref/safeMailtoHref
        ▼
RelationshipActionSheet (available actions only)
   ├─ call  → <a href="tel:…">        (OS handoff — "opened", never "completed")
   ├─ email → <a href="mailto:…">     (OS handoff — "opened", never "sent")
   └─ save_meeting_moment → navigate /connect-app/moment/:personId
                                  (2E composer owns canonical creation;
                                   server re-enforces authZ)
```

## Modules
| File | Role |
| --- | --- |
| `src/lib/business-connect/mobile/relationship-actions.ts` | Frozen action vocabulary (`call`/`email`/`save_meeting_moment`), truthful result categories, deterministic availability resolver. Client-safe, pure, no LLM. |
| `src/components/business-connect/mobile/RelationshipActionSheet.tsx` | Bottom sheet listing available actions; rebuilds nothing, consumes resolver output; emits allowlisted telemetry. |
| `src/components/business-connect/mobile/PersonSuggestion.tsx` | 6B integration point: [ Liên hệ ] entry gated on recommendation + authorized person + ≥1 available action. |
| `src/lib/business-connect/mobile/relationship-intelligence.telemetry.ts` | 6 new allowlisted metrics + `action`/`recommendationType`/`result` meta fields. |
| `docs/mobile/BC_MOBILE_6B_ACTIONABILITY_AUDIT.md` | LIVE/NOT_AVAILABLE audit for every routed capability. |

## Invariants
1. **One authority:** the 2C person DTO. Recommendations never carry
   contact data and never authorize actions.
2. **Determinism:** recommendation type → action list is a static policy
   map; unknown types fail safe to zero actions.
3. **No autonomy:** zero automatic sends/calls/bookings; every effect
   requires an explicit user gesture (tap), and canonical creation only
   happens inside existing composers.
4. **No schema change:** 6B ships with zero migrations; dismissal table
   (6A) untouched; nothing else persisted.
5. **Home stays calm:** one-tap-to-Person; no action affordances on Home.

## Failure behavior
- Person query loading/error/unavailable → [ Liên hệ ] absent; sheet
  cannot open.
- Resolver yields zero actions → button hidden (sheet, if already open,
  shows one neutral unavailable line).
- Sheet close on Escape/backdrop is always inert-safe (no busy state — the
  sheet performs no async work; moment navigation hands off to the
  composer route).
