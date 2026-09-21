# BC-7.0 — Graph Integration

The Meeting domain contributes to the Relationship Graph (BC-4.x) as a
**signal source**, not a graph writer. It does NOT mutate
`person_nodes` / `person_edges` directly.

## Signals emitted

- `meeting_completed` — increments Relationship Strength for every
  participant pair on `completed` transition.
- `meeting_no_show` — dampens strength for the affected pair.
- `meeting_cancelled` — no signal (neutral).

## Delivery

Signals are emitted via the platform outbox (`meeting_events`) and
consumed by the Relationship Strength recorder (see BC-4.3). Delivery is
idempotent; retries are safe.

## Read integrations

- Meeting UI reads viewer↔counterpart edges through the Graph SDK to
  surface relationship badges in `MeetingCounterpart.tsx`.
- Smart Introduction reads meeting completion counts to reinforce path
  confidence (BC-6.1).

## Non-goals

- No direct FK from meetings to graph tables.
- No graph reads inside SECURITY DEFINER meeting RPCs (avoids RLS
  bypass leakage).
