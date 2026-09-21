# BC-4.1A — Schema & Aggregate

Business Connect v1 — FROZEN. Backend foundation only (no UI).

## Tables (all `public`, additive, isolated from legacy Association meetings/events)

- **business_meetings** — aggregate root. `created_by_user_id`, `organizer_user_id`
  (both server-derived, immutable), `title`, `description`, `meeting_type`,
  `status`, `active_proposal_version`, `confirmed_proposal_id`, `timezone` (IANA,
  validated by `bm_valid_timezone`), `source_type`, `source_id`, `company_id`,
  `association_id` (context only, non-authorizing), lifecycle timestamps.
- **business_meeting_participants** — `(meeting_id, user_id)` unique; exactly one
  `organizer` per meeting (partial unique index); `role`, `response_status`,
  `response_message`, lifecycle fields. Identity immutable.
- **business_meeting_proposals** — immutable, versioned. `(meeting_id, version)`
  unique; `version >= 1`; `end_at > start_at`; duration ∈ [15 min, 8 h];
  `location_type`, `location_text`, `meeting_url` (participant-private),
  `proposal_message`; `superseded_at`, `accepted_at` are the only mutable fields.
- **business_meeting_events** — immutable audit/domain-event trail.
- **business_meeting_mutations** — idempotency ledger `(actor_user_id, mutation_key)`.

## Enums

`business_meeting_status`, `business_meeting_participant_role`,
`business_meeting_response_status`, `business_meeting_type`,
`business_meeting_location_type`, `business_meeting_source_type` — additive.

## Guards

- `bm_valid_timezone(text)` — IANA validation used by CHECK + timing validation.
- Triggers `bm_meetings_immutable`, `bm_participants_immutable`,
  `bm_proposals_immutable` reject identity/immutable-field edits
  (`MEETING_IMMUTABLE_FIELD`).
- `updated_at` maintained via shared `update_updated_at_column` trigger.

## Not in this slice

No follow-ups, notes, notifications, ICS, calendar sync, messaging, CRM, UI,
Business Interaction writes.
