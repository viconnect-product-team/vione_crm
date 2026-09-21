# BC-6.2 — State Machine

```
              accept  → accepted   (terminal)
             /
pending  ──── decline → declined   (terminal)
             \
              cancel  → cancelled  (terminal)
              expire  → expired    (terminal)
```

- Only the intermediary can `accept` / `decline`.
- Only the requester can `cancel`.
- `expired` is set lazily by `intro_request_accept` / `intro_request_decline`
  when `expires_at < now()`. Default expiry is 14 days.
- Terminal states are immutable — enforced by the `ir_enforce_terminal`
  trigger and mirrored by the pure `canTransition` guard for UI reasoning.
- Replay of a matching terminal call is idempotent (returns the same row);
  a call that would change state after terminal fails with
  `INTRO_REQUEST_NOT_PENDING`.
