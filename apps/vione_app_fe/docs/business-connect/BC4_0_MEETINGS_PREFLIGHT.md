# BC-4.0 — Business Meetings & Follow-up Preflight

Architecture Version: **Business Connect v1 — FROZEN**
Phase type: **Audit / Contract / Domain design / Implementation planning only.**
No production schema, no UI, no external calendar sync in this phase.

---

## 1. Scope statement

This preflight designs and validates the **Business Meetings & Follow-up** domain.
Business Connect must support structured business meetings and personal follow-up
**without** becoming chat, a CRM pipeline, project management, a calendar
replacement, video-conferencing infrastructure, community events, or Association
event management.

Deliverable of BC-4.0 is the **gate result** (§ Gate) plus the documentation set.
Stop after the gate. Implementation begins only at BC-4.1A after approval.

---

## 2. Core domain principle (frozen distinctions)

| Concept                  | Definition                                                 | Owner scope      |
| ------------------------ | ---------------------------------------------------------- | ---------------- |
| **Connection**           | Mutual user→user relationship (BC-3.1A)                    | pair             |
| **Saved Card**           | Private one-sided relationship edge (BC-2.4)               | one user         |
| **Business Interaction** | Immutable record that something happened (BC-2.6)          | one user (owner) |
| **Meeting**              | Planned or completed structured business encounter         | participants     |
| **Follow-up**            | Private action owned by one user, before/after a meeting   | one user         |
| **Calendar Event**       | External scheduling representation — _not_ source of truth | integration      |
| **Association Event**    | Formal event managed by an Association                     | Association      |
| **CRM Activity**         | Future sales-domain behavior — out of scope                | n/a              |

These concepts remain separate tables and separate services. A Meeting is a new,
distinct platform domain; it is **not** a specialization of the legacy
Association `meetings` table.

---

## 3. Existing-artifact audit

Classification legend: **A** Reusable · **B** Reusable via adapter ·
**C** Domain-specific, isolated · **D** Must not be reused.

| Artifact                                  | Location                                                                                                        | Class           | Notes                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy Association meetings table + route | `meetings`, `src/lib/meetings.functions.ts`, `src/routes/meetings.tsx`                                          | **D**           | Association board/committee/general meetings. Different domain, different auth (association-scoped, `code`-keyed). Do NOT extend for Business Meetings. |
| `BusinessInteractionService`              | `src/lib/business-card/interaction.service.ts`                                                                  | **B**           | Meeting lifecycle emits immutable interaction events via this service (adapter). Interaction types already include `meeting`, `follow_up`.              |
| Interaction repository/types              | `src/lib/business-card/interaction.*`                                                                           | **B**           | Reused to persist derived interaction events; not extended in-place.                                                                                    |
| Global connection state machine           | `src/lib/global-network/state-machine.ts`                                                                       | **A (pattern)** | Copy the pure-function + DB-guard mirror pattern for the meeting state machine. Do NOT modify or overload it.                                           |
| Domain error taxonomy                     | `src/lib/global-network/errors.ts`                                                                              | **A (pattern)** | Mirror `toXError` mapping; create a new `MEETING_*` taxonomy, do not extend `NETWORK_*`.                                                                |
| Source normalization                      | `src/lib/global-network/source.ts`                                                                              | **A (pattern)** | Reuse the normalize/allow-list pattern for meeting `source_type`/`source_id`.                                                                           |
| Telemetry                                 | `src/lib/global-network/telemetry.ts`                                                                           | **B**           | Reuse `withTelemetry` shape; add a meeting op union. Low-cardinality only.                                                                              |
| Notification infra                        | `gn_notifications`, `gn_notification_prefs`, `gn_emit_notification_from_event()` trigger, `NotificationService` | **B**           | Meeting notifications reuse the recipient-scoped notification pattern + preference gate. New event → notification mapping, not new delivery infra.      |
| Rate-limit + cooldown infra               | `global_connection_send_request_guarded()`, `user_connection_events` counters                                   | **A (pattern)** | Reuse hourly/daily counting + pair-cooldown pattern for proposal spam control.                                                                          |
| Idempotency infra                         | `global_connection_mutations` (actor_user_id, mutation_key)                                                     | **A (pattern)** | Reuse the `(actor, mutation_key) → cached result` idempotency table pattern per meeting mutation.                                                       |
| Identity bridge / owner resolution        | `src/lib/identity/identity-bridge.server.ts`, `resolveBusinessCardOwnerContext`                                 | **A**           | Resolve target user from card slug server-side; never trust client target ids.                                                                          |
| Global identity guard                     | `src/lib/global-network/identity.ts`, `gn_require_user()`                                                       | **A**           | Meeting auth uses `auth.uid()` + account status. No `members` row, no `current_member_id()`.                                                            |
| UnifiedRelationshipView                   | `src/lib/global-network/unified-relationship.*`                                                                 | **B**           | Add optional `meetingSummary` (viewer-scoped). Compose is a pure fold; extend additively.                                                               |
| Company platform                          | `src/lib/company/*`                                                                                             | **B**           | Company is _context only_ on a meeting. No company-wide calendar, no admin read of employee meetings.                                                   |
| Association events                        | events tables/wizard                                                                                            | **C**           | Association context only; no dual-write, no shared access.                                                                                              |
| i18n                                      | `src/lib/i18n.ts`                                                                                               | **A**           | Add `connect.meeting.*` namespace additively.                                                                                                           |
| Date/format helpers                       | `useFmt`/`useT` in `src/lib/i18n.ts`, `src/components/ui/calendar.tsx`                                          | **C/D**         | `calendar.tsx` is a UI date picker only. No robust IANA/UTC helper exists — **must build** a timezone utility for BC-4.                                 |
| ICS / calendar export utility             | —                                                                                                               | **absent**      | No ICS generator exists. Build new in BC-4.1F. `src/lib/ticket-qr.ts` is unrelated (QR only).                                                           |
| Audit/outbox                              | activity_log, business_card_audit, `user_connection_events`                                                     | **B**           | Reuse event-log pattern for meeting audit.                                                                                                              |

### Call graph (target, BC-4.1x)

```text
UI (BC-4.1C/D)
  → MeetingSDK (client façade)
    → *.functions.ts (createServerFn + requireSupabaseAuth)
      → MeetingService (invariants, actor resolution)
        → MeetingRepository (RLS-scoped reads)
        → RPC: meeting_propose / _respond / _reschedule / _cancel / _complete (SECURITY DEFINER, guarded)
          → meeting state machine guard (DB) mirrors pure evaluateMeetingTransition()
          → meeting_mutations (idempotency)
          → meeting_events (audit) → notification trigger → gn/meeting notifications
        → BusinessInteractionService.create (adapter, on confirmed/completed/followup)
```

---

## 4. Chosen domain model

**Option B — Meeting aggregate with proposal/version rows.**

Tables:

- `business_meetings` (aggregate root, current agreed state + `version`)
- `business_meeting_participants` (participant rows, per-user response)
- `business_meeting_proposals` (immutable scheduling proposals, versioned)
- `business_meeting_followups` (private, owner-scoped)
- private notes → **separate `business_meeting_notes` table** (see §Notes)

**Why B over A and C:**

- Option A (single table + participants) cannot retain reschedule history nor
  bind acceptance to a specific proposed time → stale-acceptance races unsolved.
- Option C (generic negotiation state machine) over-generalizes; adds complexity
  the MVP does not need and risks drifting into a scheduling engine.
- Option B keeps the aggregate authoritative (one agreed time), while
  **immutable proposal rows** give version-safe reschedule, deterministic
  concurrent counter-proposal resolution, and a clean audit trail — satisfying
  every required capability (proposal/accept/decline/reschedule/cancel/complete,
  per-participant private metadata, timezone-safe scheduling, auditability,
  future calendar sync, no chat dependency).

Full field-level contract: `BC4_0_MEETING_DOMAIN_CONTRACT.md`.

---

## 5. State machine (summary)

Statuses: `draft → proposed → confirmed → {completed | no_show}`, plus
`declined`/`cancelled` terminals; `proposed`/`confirmed → proposed` via
**versioned reschedule**. `completed`/`cancelled`/`declined` are terminal.
Client-supplied target statuses are rejected; the actor is resolved server-side.
Full table + actor permissions: `BC4_0_STATE_MACHINE.md`.

---

## 6. Reschedule model (recommendation)

Use **immutable proposal rows** (`business_meeting_proposals`), each carrying a
monotonic `version`. Acceptance references `(meeting_id, version)`; if the
meeting's current `version` has advanced, acceptance fails with
`MEETING_STALE_VERSION`. Concurrent counter-proposals resolve deterministically
by `version` ordering + row locking in the RPC. The agreed time on
`business_meetings` is never silently overwritten — it is set only when a
specific proposal version is accepted. Prior proposals are retained forever.

---

## 7. Connection requirement policy (recommendation)

**Policy B — Saved Card OR accepted Global Connection OR shared context.**

A user may propose a meeting when any of the following holds:

- an accepted Global Connection exists with the target, OR
- the proposer has saved the target's Business Card, OR
- a shared context is present and permitted (same Association / originating
  Company page / event / QR-NFC encounter), OR
- the target has a discoverable **public** Business Profile (rate-limited harder
  for otherwise-unrelated proposers).

Rationale: allows legitimate first meetings and business-card use cases without
opening a spam vector; stricter per-hour/day caps apply to the "public profile
only" path. A **blocked** pair may never propose (§Blocking). This policy is a
_product freeze_ recorded here; it does not change the Global Connection state
machine.

---

## 8. Blocking semantics (frozen baseline)

- Blocked pair **cannot** create new meeting proposals (`MEETING_BLOCKED`).
- Pending proposals between a newly-blocked pair are **cancelled by policy**
  (status → `cancelled`, reason recorded, no counterpart notification of blocker
  identity).
- Confirmed future meetings are **not silently deleted**; cancellation requires
  explicit user action (surfaced to both as a normal cancel).
- Completed meeting history remains **participant-private and visible**.
- Blocker identity is never exposed.
- Follow-ups (owner-private) remain accessible to their owner after blocking.

---

## 9. Timezone strategy (frozen)

Store all timestamps in **UTC (`timestamptz`)**; store the originating IANA
`timezone` string on the meeting and on each proposal. Render in the viewer's
timezone with the meeting timezone shown explicitly. DST-safe, no naive local
datetime in the DB. ICS uses valid VTIMEZONE handling. Detail:
`BC4_0_TIMEZONE_AND_CALENDAR_CONTRACT.md`.

---

## 10. Notification / reminder strategy (summary)

Reuse the recipient-scoped notification pattern (`gn_notifications` style):
events `meeting_proposed / accepted / declined / new_time_proposed / confirmed /
cancelled / reminder` and owner-private `followup_due`. Payload is privacy-safe
(title, public counterpart summary, scheduled time, safe location type, deep
link, correlation id) — **never** notes, hidden contact data, or (by default)
meeting URL. Reminders (24h / 1h / custom) reuse existing scheduling; reschedule
updates reminders, cancellation invalidates them, retries are idempotent.
Detail: `BC4_0_NOTIFICATION_AND_REMINDER_CONTRACT.md`.

---

## 11. ICS / calendar strategy (staged, preflight only)

Phase 1: ICS download + "add to calendar" links. Phase 2: one-way Google/Outlook
create/update. Phase 3: bidirectional only if justified. The Business Meeting is
always the source of truth; the external event id is an integration reference
stored on the meeting; provider tokens live in the integration boundary, never in
meeting tables. No external sync in BC-4.0. Detail:
`BC4_0_TIMEZONE_AND_CALENDAR_CONTRACT.md`.

---

## 12. Rate limits (recommendation)

Reuse the guarded-RPC counting pattern: **10 proposals/hour, 30/day**;
per-pair cooldown after repeated decline; reschedule cap per meeting; stricter
caps for "public-profile-only" proposers. Report/abuse integrates with existing
`gn_reports`.

---

## 13. Migration risk

Low. All artifacts are **additive** (new enums, four/five new tables, indexes,
RLS, transition RPCs, grants/revokes, notification mapping). No changes to
Global Connections, Saved Cards, Business Interactions, Companies, Association
Events, or legacy networking. Rollback drops only BC-4 artifacts. Detail:
`BC4_0_IMPLEMENTATION_RUNBOOK.md`.

---

## 14. Recommended BC-4.1A scope

Schema + RLS + meeting state machine + proposal versioning only:
enums (`meeting_type`, `meeting_status`, `location_type`, `participant_role`,
`participant_response`, `followup_status`, `meeting_source_type`); tables
`business_meetings`, `business_meeting_participants`, `business_meeting_proposals`,
`business_meeting_followups`, `business_meeting_notes`; participant-scoped RLS;
SECURITY DEFINER transition RPCs with idempotency + guarded rate limits;
grants/revokes. No service/SDK/UI (those are BC-4.1B+).

---

## 15. Approvals required before BC-4.1A

1. Product sign-off on **connection requirement Policy B** (§7).
2. Product sign-off on **blocking baseline** (§8).
3. Confirmation to persist **private notes in a dedicated table** (§Notes).
4. Explicit approval to write production schema (this phase writes none).

---

## Gate

See §39 of the request. Full audited artifacts, chosen model, state machine,
authorization matrix, connection policy, block behavior, timezone strategy,
notification/reminder strategy, ICS strategy, rate limits, migration risk, and
BC-4.1A scope are all specified above and in the linked contracts.

**GATE RESULT: CONDITIONAL GO.**

Rationale: the core meeting model is safe and complete — deterministic state
machine, version-safe reschedule, complete participant privacy, UTC+IANA
timezone model, frozen blocking + connection policy, viable notification/reminder
design, bounded implementation slices, and rollback that does not touch existing
domains. The **conditional** qualifier is solely because external calendar
integration (Google/Outlook) and any shared notes remain **deferred** beyond
MVP — there is no privacy, state-machine, or timezone blocker. Proceed to
BC-4.1A upon the approvals in §15.
