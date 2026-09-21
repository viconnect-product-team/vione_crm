# BC-Mobile-6A — Relationship Intelligence Audit (REUSE / EXTEND / REPLACE)

Status: FROZEN audit. Date: 2026-08.

6A adds a calm intelligence layer on top of EXISTING relationship data. It
builds no new identity, no new social graph, no CRM, no scoring UI. Every
claim below was verified against source before implementation.

## 1. Source audit — exact data sources and access paths

| Source | Table | Access path (existing, reused) | Edge timestamp | Missing-field behavior |
|---|---|---|---|---|
| Connection (BC-3.1A/B) | `user_connections` | `GlobalConnectionRepository` pattern: participant-scoped `.or(requester/recipient)`, RLS + explicit filter | `responded_at` (fallback `updated_at`) = `connectedAt` | null → row excluded |
| Saved Card (BC-2A/3.0) | `saved_business_cards` + embed `member_business_cards` | `RelationshipRepository` embed pattern — MINIMAL projection (no notes/tags/private org fields) | `saved_at` | null → excluded |
| Guest Contact (BC-3B) | `guest_contacts` | `GuestContactSDK` pattern: owner-scoped (RLS), minimal columns | `first_shared_at` | null → excluded |
| Moments (BC-2E) | `business_relationship_moments` | `moment.server.ts` pattern: owner-scoped, `status=active`, target cols only (note/photos NEVER selected) | `occurred_at` | no moments → origin timestamp is last interaction |
| Counterpart summary | `member_business_cards` | `resolvePublicCounterpartsFn` projection (PUBLISHED + PUBLIC, allowlist only) | — | no public card → name fallback "—" |
| Dismissals | `relationship_recommendation_dismissals` (NEW) | owner-scoped RLS, upsert snooze | `dismissed_until` | — |

## 2. Known gaps (documented, NOT hidden)

- **Meetings**: the Meetings domain has no counterpart-person mapping
  (`counterpartDisplayName` free text only) → `PREPARE_FOR_MEETING` unavailable
  in 6A. Deferred. No heuristic name-matching is used (would be ambiguous).
- **Work Hub tasks**: items carry no person identity → `FOLLOW_UP_EXISTING_TASK`
  unavailable in 6A. Deferred.
- **Graph V1** (`src/lib/graph/recommendation/`) is a DESKTOP workspace engine
  with different ranking; 6A does not reuse its scoring (it would couple
  mobile to workspace heuristics) but reuses its deterministic-ranking
  discipline. No parallel connection system is created.
- **Notifications**: trigger-driven (BC-3.1F) already reflects connection
  events; 6A adds no notification surface.

## 3. Privacy model

- **Allowlist (may inform)**: personId (viewer-side), display/avatar/headline/
  company (public projection), edge timestamps, moment timestamps+count.
- **Denylist (NEVER inform, never selected)**: private notes, tags, photos,
  OCR payloads, audio, transcripts, email/phone/address (guest rows excluded
  from AI input entirely), raw payloads, internal connection ids, other
  users' private data.
- **AI input**: exactly `{ daysSinceLastInteraction, locale }` — a number and
  a language code. No name, no person id, no free text. Prompt injection via
  input is structurally impossible (no user-controlled string enters the
  prompt); output is validated (strict zod, grounding numbers ⊆ supplied
  values, no URL/HTML/markdown) and ANY failure silently falls back to the
  deterministic template.
- **Server composition only** (`requireSupabaseAuth`): recommendation data
  never readable by anonymous/public traffic. Owner id / counterpart raw ids
  never serialized beyond the privacy-safe summary.
- **One recommendation per person per surface**, max 3 on Home. Deterministic
  ranking: `daysSinceLastInteraction` DESC, tie → `personId` ASC.

## 4. Integration points

| Surface | Integration |
|---|---|
| Home | `RelationshipSuggestions` section under Today; own query, never blocks Home; error → inline retry row |
| Person Detail | `PersonSuggestion` section above PersonJourney; fail-closed (any auth/parse failure → section omitted) |
| Invalidation | moment finalize + 5E accept/decline invalidate `["bc-mobile","rel-intel"]` |
| Dismiss | per-row "Ẩn" → server upsert snooze 7 days, invalidate |
| Telemetry | allowlisted names only (`RELATIONSHIP_*`), no ids/tokens/text |

## 5. REUSE / EXTEND / REPLACE

| Capability | Decision |
|---|---|
| Pair/edge reads, person id format `u:`/`c:`/`g:`, fail-closed authorization | REUSE (2C/3.1 patterns verbatim) |
| Counterpart privacy projection | REUSE (`resolvePublicCounterpartsFn` query) |
| AI Gateway call discipline (timeout, zod, fallback) | REUSE (`card-scan.server.ts` pattern) |
| Dismissal persistence | EXTEND: one new table `relationship_recommendation_dismissals` |
| Deterministic signals engine | EXTEND: new pure module `relationship-intelligence.engine.ts` |
| AI wording | EXTEND: `relationship-intelligence.ai.server.ts` (wording-only, prompt versioned) |
| Graph V1 / ConnectionsWorkspace / Meetings / Notifications / Person model | REPLACE: none — untouched |
