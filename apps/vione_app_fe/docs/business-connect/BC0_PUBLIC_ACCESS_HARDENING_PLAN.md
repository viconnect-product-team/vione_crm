# BC0_PUBLIC_ACCESS_HARDENING_PLAN — Anon Exposure Removal (BC-0.3)

Documentation-only. Sequenced plan to move all public Business Card access behind
a safe server function and remove direct anon table exposure. **Not executed in
BC-0.3.**

## Verified starting state (this turn)

Direct anon SELECT policies exist on:

- `member_business_cards` — `Public reads published public cards`
  (`status='published' AND public_mode='public'`, `{anon,authenticated}`)
- `business_card_needs` / `business_card_services` / `business_card_skills` —
  `Public reads ... of public cards` via `is_public_business_card(card_id)`,
  `{anon,authenticated}`

Safe server path already present: `getPublicBusinessCardFn` (`b.$slug.tsx`,
`business-card.functions.ts`). Both paths currently coexist → raw exposure defect.

No anon storage SELECT policies (buckets private) — no storage hardening needed now.

## Target end state

- Single public entry point: `getPublicBusinessCardFn` (or equivalent safe RPC).
- Only published + publicly-accessible cards; `visibility_settings` applied server-side.
- Explicit column projection; no raw private columns, analytics, leads, audit, or
  private contact channels.
- Rate limiting on public reads (precedent: `check_and_increment_sync_rate`).
- No direct public mutation (lead capture only via validated RPC).

## Staged plan

### Stage 1 — Function completeness (no DB change)

- Enumerate every field the public card UI renders.
- Confirm `getPublicBusinessCardFn` returns card + needs/services/skills with a
  fixed safe projection. Add missing safe fields to the function output.
- Exit: function output is a superset of public UI needs.

### Stage 2 — Output parity gate (no DB change)

- Snapshot current raw anon SELECT output vs. server-function output.
- Diff to prove no public regression and no extra private leakage.
- Exit: documented parity report; sign-off to proceed.

### Stage 3 — Remove direct anon grants/policies (migration)

- Drop the 4 anon SELECT policies above.
- Route public reads through the server function (server publishable client with
  narrow projection, or a `TO anon`-safe RPC returning a fixed type).
- Keep authenticated owner/manager policies unchanged.
- Exit: `pg_policies` shows no `{anon}` on card family tables.

### Stage 4 — Regression tests (code)

- Extend `rls-anon-exposure.e2e.test.ts`: anon cannot raw-select
  `member_business_cards`/needs/services/skills; hidden/private/draft → 404;
  private columns absent from public projection.
- Add spoof test: client cannot request extra columns.
- Exit: tests green in CI (deploy pipeline gate).

### Stage 5 — Monitor rollout

- Watch public card render + error rates post-cutover; rollback = re-add policies.
- Exit: stable window observed.

## Rollback

Each stage is independently reversible; Stage 3 rollback is re-adding the dropped
policies verbatim (kept in migration comments).

## Dependencies / ordering

Stage 3 depends on Stage 2 sign-off. Runs independently of Global Identity /
Community work but should precede External Pilot (see BC0_SECURITY_BACKLOG).
