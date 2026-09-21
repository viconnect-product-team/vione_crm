# BC-7.0 — Meeting Domain Architecture

**Status:** Ratified (Option A). No schema, RLS, SDK, or graph changes.
BC-7.0 formally adopts the Business Meetings implementation shipped under
BC-4.0 / BC-4.1A–C as the canonical Meeting domain.

## Layering

```
UI (src/components/business-meetings/*, src/routes/connect.meetings.*)
  → Hooks (src/hooks/use-business-meetings.ts)
    → SDK (src/lib/business-meetings/client-sdk.ts)
      → Server functions (src/lib/business-meetings/*.functions.ts)
        → Service + Repository (src/lib/business-meetings/*)
          → Postgres (business_meetings + 4 supporting tables, FORCE RLS)
```

All UI reaches the domain exclusively through the hooks + SDK boundary.
Direct imports of Supabase client, service, or server functions from
components are prohibited (see BC4_1A_DOMAIN_AND_TESTS.md).

## Domain boundary

The Meeting domain owns: meetings, participants, versioned proposals,
proposal history, and eligibility resolution (Policy B). It DOES NOT own:
Events (BC-Events), Introductions (BC-6.x), Connections (BC-5.x),
Calendar sync (deferred). Cross-domain reads happen through published SDKs.

## BC-7.0 terminology mapping

| BC-7.0 term            | BC-4.x artifact                                             |
| ---------------------- | ----------------------------------------------------------- |
| Meeting aggregate      | `business_meetings` row + participants + latest proposal    |
| Participant model      | `business_meeting_participants`                             |
| Versioned proposal     | `business_meeting_proposals` with `version` monotonic guard |
| Provenance             | `source`, `source_ref`, `created_by`, `organizer_user_id`   |
| State machine          | `src/lib/business-meetings/state-machine.ts`                |
| Eligibility (Policy B) | `src/lib/business-meetings/eligibility.ts`                  |
| Graph integration      | Meeting completion → Relationship Strength signal (BC-4.3)  |
| Event contract         | Outbox rows emitted by mutation RPCs                        |

## Intentional deviations from BC-7.0 spec

1. **No `scheduling_mode` column.** Scheduling mode is inferred from
   `source` + participant count. Adding a redundant column would break
   frozen SDK contracts.
2. **Richer status registry.** BC-4.1A ships
   `draft | proposed | confirmed | declined | cancelled | completed | no_show`
   — a superset of the BC-7.0 spec's minimum set. Kept as-is.
3. **Richer participant roles.** `organizer | required | optional` retained.
4. **Calendar integration deferred** to a later slice; not in scope for BC-7.0.

## BC-7.9 Turn A — Outcome addendum

The Meeting Outcome domain (`src/lib/meeting/outcome/*`) attaches an
organizer-authored canonical record to a meeting. It is additive: the
Meeting aggregate does not gain any columns, and meeting completion is
not gated on outcome presence. See
`docs/business-connect/meeting/outcome/MEETING_OUTCOME_ARCHITECTURE.md`.

Deferred (BC-7.9 Turn B/C): follow-up domain, UI/timeline/workspace
integration, graph signals, AI summary/transcription.

## BC-7.10 — Collaboration addendum

Three additive sibling sub-domains attach to the meeting aggregate:

- **Agenda** — `business_meeting_agenda_items` (Turn A)
- **Private Notes** — `business_meeting_private_notes` (Turn B, FORCE RLS, owner-only)
- **Shared Notes** — `business_meeting_shared_notes` (Turn B, FORCE RLS, organizer-managed, draft→published terminal)

All mutations go through SECURITY DEFINER RPCs with version-guarded
optimistic concurrency. Product surface (Turn C) lives at
`/business-connect/meetings/$meetingId`. Final gate (Turn F) — CLOSED / GO.

See `collaboration/MEETING_COLLABORATION_ARCHITECTURE.md`,
`collaboration/MEETING_COLLABORATION_UI.md`,
`collaboration/MEETING_COLLABORATION_TIMELINE.md`,
`collaboration/MEETING_COLLABORATION_FINAL_VERIFICATION.md`, and
`collaboration/MEETING_COLLABORATION_TEST_MATRIX.md`.

Deferred (documented, non-blocking): nested agenda UI (Option B), AI
summarization, live transcription, recording, CRDT / real-time
collaborative editing, note attachments, public export.
