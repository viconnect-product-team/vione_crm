# BC-4.0 — Meeting Domain Contract

Business Connect v1 — FROZEN. Design contract; no implementation.

## Aggregate: `business_meetings`

| Field                      | Type                       | Null | Notes                               |
| -------------------------- | -------------------------- | ---- | ----------------------------------- |
| id                         | uuid PK                    | no   | `gen_random_uuid()`                 |
| created_by_user_id         | uuid                       | no   | `auth.users` (initiator)            |
| organizer_user_id          | uuid                       | no   | authoritative organizer             |
| title                      | text                       | no   | ≤ 200 chars                         |
| description                | text                       | yes  | ≤ 4000 chars                        |
| meeting_type               | enum `meeting_type`        | no   | see §Meeting types                  |
| status                     | enum `meeting_status`      | no   | default `draft`                     |
| start_at                   | timestamptz                | yes  | UTC; set from accepted proposal     |
| end_at                     | timestamptz                | yes  | UTC                                 |
| timezone                   | text                       | no   | IANA (e.g. `Asia/Ho_Chi_Minh`)      |
| location_type              | enum `location_type`       | no   | default `unspecified`               |
| location_text              | text                       | yes  | participant-private                 |
| meeting_url                | text                       | yes  | participant-private                 |
| source_type                | enum `meeting_source_type` | no   | default `manual`                    |
| source_id                  | uuid                       | yes  | server-resolved only                |
| company_id                 | uuid                       | yes  | context only                        |
| association_id             | uuid                       | yes  | context only                        |
| external_calendar_provider | text                       | yes  | integration ref (later)             |
| external_calendar_event_id | text                       | yes  | integration ref (later)             |
| version                    | integer                    | no   | increments on reschedule; default 1 |
| created_at / updated_at    | timestamptz                | no   | now() + trigger                     |
| cancelled_at               | timestamptz                | yes  |                                     |
| completed_at               | timestamptz                | yes  |                                     |

Rules: `organizer_user_id`, `source_id`, `company_id`, `association_id` are
server-resolved; client-supplied values are rejected/ignored. `location_text`,
`meeting_url` never appear in public projections or default notification payloads.

## `business_meeting_participants`

| Field                               | Type                        | Notes                                                         |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------- |
| id                                  | uuid PK                     |                                                               |
| meeting_id                          | uuid FK → business_meetings |                                                               |
| user_id                             | uuid                        | server-resolved                                               |
| role                                | enum `participant_role`     | organizer / required / optional                               |
| response_status                     | enum `participant_response` | pending / accepted / declined / tentative / proposed_new_time |
| proposed_start_at / proposed_end_at | timestamptz null            | references a counter-proposal                                 |
| response_message                    | text null                   | ≤ 1000; not leaked to notifications                           |
| responded_at                        | timestamptz null            |                                                               |
| joined_at / left_at                 | timestamptz null            |                                                               |
| created_at / updated_at             | timestamptz                 |                                                               |

Unique `(meeting_id, user_id)`. No arbitrary participant injection — participants
are added only by server logic resolving trusted identity. Another participant's
private connections/notes are never exposed here.

## `business_meeting_proposals` (immutable, versioned)

| Field               | Type             | Notes                         |
| ------------------- | ---------------- | ----------------------------- |
| id                  | uuid PK          |                               |
| meeting_id          | uuid FK          |                               |
| version             | integer          | monotonic per meeting         |
| proposed_by_user_id | uuid             | server-resolved               |
| start_at / end_at   | timestamptz      | UTC                           |
| timezone            | text             | IANA at proposal time         |
| message             | text null        |                               |
| created_at          | timestamptz      |                               |
| superseded_at       | timestamptz null | set when a newer version wins |

Immutable rows. Acceptance targets `(meeting_id, version)`; stale version →
`MEETING_STALE_VERSION`.

## `business_meeting_followups` — see `BC4_0_FOLLOWUP_MODEL.md`.

## `business_meeting_notes` — see `BC4_0_PARTICIPANT_AND_PRIVACY_MODEL.md`.

## Meeting types (`meeting_type`)

`in_person, video_call, phone_call, business_lunch, demo, consultation,
interview, networking, site_visit, other`. Business semantics, additive.

## Location types (`location_type`)

`physical, online, phone, hybrid, unspecified`. Physical text & URL are
participant-private; phone numbers are never auto-copied from hidden card fields.

## Source taxonomy (`meeting_source_type`)

`global_connection, saved_card, business_profile, company, association, event,
qr, nfc, manual, referral`. Source is contextual only, never implies ownership;
source ids are server-resolved; arbitrary client source ids rejected.

## Business Interaction integration

On `confirmed` → `meeting_confirmed`; on `completed` → `meeting_completed`
(may increment relationship score); on reschedule → `meeting_rescheduled`; on
cancel → `meeting_cancelled`; follow-up create/complete → `followup_created` /
`followup_completed`. `meeting_proposed` is optional/automatic. All events are
immutable and deduped by idempotency key; private note content is never copied.
Automatic: confirmed, completed, cancelled, rescheduled. User-generated context:
followup_created/completed.

## UnifiedRelationshipView addition (BC-4.1E, additive)

```ts
meetingSummary?: {
  upcomingCount: number;
  nextMeetingAt?: string | null;
  lastMeetingAt?: string | null;
  openFollowUpCount: number; // viewer-owned only
}
```

Viewer-scoped, bounded aggregate query, no N+1, no notes/URL/other-user data.
