# BC-7.0 — Source & Provenance

Every meeting row records its origin so downstream domains (graph,
analytics, ops) can attribute Relationship Strength signals correctly.

## Columns

- `source` — enum: `manual`, `introduction`, `event`, `card_share`,
  `imported`.
- `source_ref` — free-form ref (introduction_id, event_id, card_share_id,
  etc.). Never dereferenced by the meeting domain; opaque to consumers
  outside the originating domain.
- `created_by` — auth.uid() at insert time.
- `organizer_user_id` — always the initial proposer; immutable after
  insert (enforced by trigger).

## Rules

- Provenance fields are immutable after insert. Mutation attempts raise
  `MEETING_IMMUTABLE_FIELD`.
- `source_ref` MUST be null when `source = 'manual'`.
- Scheduling mode is INFERRED from `source` + participant count — no
  `scheduling_mode` column is added (see architecture doc, deviation #1).
