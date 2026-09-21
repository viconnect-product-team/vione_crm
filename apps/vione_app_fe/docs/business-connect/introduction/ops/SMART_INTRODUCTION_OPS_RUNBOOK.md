# BC-6.8 — Smart Introduction Ops Runbook

## Signal → Action

### `outbox.pending.*` (warn ≥250 / crit ≥500)

1. Check `outcome_consumer_batch` in Scheduler runs — is it running?
2. If stale, inspect `/api/public/hooks/outcome-consumer` — trigger manually.
3. If running but not draining, check `consumer.failure_ratio.*` next.

### `outbox.lag.*` (warn ≥15m / crit ≥60m)

Same as pending. Likely correlated. If both critical and consumer is healthy,
scale batch size (env `OUTCOME_CONSUMER_BATCH_SIZE`).

### `consumer.failure_ratio.*`

1. Inspect `list_intro_ops_consumer_runs` for `adapter_breakdown`.
2. Identify failing adapter (analytics / audit / notification).
3. Check adapter target availability; failures auto-retry with backoff.
4. If a single adapter is flapping, temporarily disable via registry flag
   (adapter-side); do NOT mutate outbox rows.

### `consumer.dead_letter.critical`

Any DLQ transition pages on-call. Root-cause the failing adapter before
replaying — replay path is out-of-band.

### `scheduler.stale.*` (warn ≥10m / crit ≥30m)

1. Verify `pg_cron` schedule for `outcome_consumer_batch`.
2. Check Cloudflare/edge invocation logs for the hook route.
3. Manual kick: POST `/api/public/hooks/outcome-consumer` with the shared secret.

### `requests.failure_ratio.critical` (≥0.40 over 24h, n≥20)

1. Compare vs. baseline — is a specific association surging?
2. Inspect requests tab for status breakdown (expired vs cancelled).
3. If expired dominates, verify intermediary reachability (notification adapter).

## Verification checklist after any mitigation

- Re-run `intro_ops_alerts_evaluate` (auto every minute) — the alert should
  auto-resolve within one evaluation cycle.
- Confirm the health strip returns to `healthy`.
- Record incident notes in the alert `context` peek is unnecessary — write
  the postmortem in the on-call doc, not in ops tables.

## Escalation

Two consecutive critical alerts of the same code without auto-resolve within
15 minutes → page the Smart Introduction owner.
