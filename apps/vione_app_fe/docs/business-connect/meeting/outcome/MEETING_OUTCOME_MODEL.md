# Meeting Outcome — Data Model

## Table `public.business_meeting_outcomes`

| Column                    | Type                       | Notes                                                                              |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| `id`                      | uuid PK                    | server-generated                                                                   |
| `meeting_id`              | uuid NOT NULL              | FK → `business_meetings(id)` ON DELETE CASCADE, `UNIQUE` (one outcome per meeting) |
| `recorded_by_user_id`     | uuid NOT NULL              | organizer at time of create; never mutated                                         |
| `outcome_type`            | text NOT NULL              | CHECK ∈ frozen 10-value registry                                                   |
| `outcome_status`          | text NOT NULL              | CHECK ∈ `{'draft','finalized'}`                                                    |
| `summary`                 | text NULL                  | trimmed, ≤ 2000 chars, HTML untrusted                                              |
| `finalized_at`            | timestamptz NULL           | required iff `outcome_status='finalized'`                                          |
| `version`                 | integer NOT NULL DEFAULT 1 | monotonic; optimistic concurrency                                                  |
| `client_request_id`       | text NULL                  | UNIQUE per meeting for idempotent create                                           |
| `created_at`/`updated_at` | timestamptz                | standard                                                                           |

## Constraints & indexes

- `bmo_meeting_unique` — one outcome per meeting.
- `bmo_meeting_client_req_unique` — partial UNIQUE for idempotency.
- `bmo_finalized_consistency_ck` — `finalized_at` ↔ status coherence.
- `bmo_guard_immutable_trg` — freezes `meeting_id`, `recorded_by_user_id`,
  and post-finalization fields.
- `bmo_block_delete_trg` — DELETE always raises `MEETING_OUTCOME_FINALIZED`.

## Outcome Type Registry (frozen v1)

`positive_progress, agreement_reached, opportunity_created, follow_up_required,
no_decision, blocked, not_a_fit, completed_objective, informational, other`.

## Status Registry (frozen v1)

`draft, finalized`. Transitions: `draft → finalized` (only). Re-finalize is
idempotent, not a transition.

## Version constant

`MEETING_OUTCOME_VERSION = "1.0.0"`.
