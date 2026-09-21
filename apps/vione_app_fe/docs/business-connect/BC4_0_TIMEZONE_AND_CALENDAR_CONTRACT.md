# BC-4.0 — Timezone & Calendar Contract

Business Connect v1 — FROZEN.

## Timezone contract (frozen)

- Store all timestamps in **UTC** (`timestamptz`).
- Store the originating **IANA timezone** string on the meeting and each proposal
  (e.g. `Asia/Ho_Chi_Minh`, `America/New_York`).
- Render in the **viewer's** timezone, always showing the explicit meeting
  timezone alongside.
- Daylight-saving-safe; **no naive local datetime** is ever persisted.
- Participant responses reference a specific proposal **version**.
- ICS export uses valid VTIMEZONE handling.

### Test cases to cover (BC-4.1x)

DST transition day; cross-timezone participants; midnight boundary; locale
formatting; reschedule across a timezone change; ICS SEQUENCE increments.

## Duration & scheduling rules

- Minimum duration **15 min**, maximum **8 h**.
- No scheduling in the past (`MEETING_TIME_INVALID`).
- Allowed horizon: configurable (default up to 12 months out).
- Overlap: **soft warning only** in MVP; do not hard-block overlaps unless a
  future authoritative calendar source exists (`MEETING_TIME_CONFLICT` reserved).

## Calendar export & sync (staged; preflight only)

**Phase 1 (BC-4.1F):** ICS download + "add to calendar" links.
**Phase 2 (post-MVP):** Google Calendar & Outlook one-way create/update.
**Phase 3 (if justified):** bidirectional sync.

Frozen principles:

- The Business Meeting is always the **source of truth**.
- `external_calendar_event_id` is an integration reference only.
- Sync failure must never corrupt meeting state.
- Provider auth tokens live in the integration boundary — **never** in meeting
  tables.
- All external updates are idempotent; provider webhooks require signature
  verification (later, under `/api/public/*`).
- No external sync in BC-4.0.

## ICS contract

- `UID` stable per meeting.
- `SEQUENCE` increments on each reschedule.
- Cancelled meetings emit `STATUS:CANCELLED` with `METHOD:CANCEL`.
- Valid timezone representation (VTIMEZONE / TZID).
- Private meetings marked `CLASS:PRIVATE`.
- No private notes unless the exporting participant explicitly selects them.
- No hidden contact fields.
- `URL`/location included only in an **authorized participant's** export.
- No existing ICS utility — build new in BC-4.1F (Worker-safe, pure string
  generation; do not add Node-only calendar libraries).
