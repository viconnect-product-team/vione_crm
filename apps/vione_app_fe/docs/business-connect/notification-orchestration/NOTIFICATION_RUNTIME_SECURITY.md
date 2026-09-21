# Runtime Security

## RLS posture

- `business_notifications`: FORCE RLS. `SELECT` allowed to `authenticated` for
  own rows only. No direct `INSERT/UPDATE/DELETE` grants — mutation exclusively
  via `SECURITY DEFINER` RPCs owned by this domain.
- `business_notification_schedules`,
  `business_notification_dispatches`,
  `business_notification_escalations`,
  `business_notification_event_receipts`:
  FORCE RLS + no user grants. Only `service_role` can read/write.

## RPCs

| RPC                       | Grant           | Purpose                                |
| ------------------------- | --------------- | -------------------------------------- |
| `bnotif_mark_read`        | `authenticated` | Recipient mark own notification read   |
| `bnotif_mark_unread`      | `authenticated` | Recipient mark own notification unread |
| `bnotif_archive`          | `authenticated` | Recipient archive own notification     |
| `bnotif_archive_all_read` | `authenticated` | Bulk archive own read notifications    |
| `bnotif_unread_count`     | `authenticated` | Own unread count                       |
| `bnotif_claim_schedules`  | `service_role`  | SKIP-LOCKED schedule claim             |
| `bnotif_claim_dispatches` | `service_role`  | SKIP-LOCKED dispatch claim             |
| `bnotif_recover_stuck`    | `service_role`  | Recover stuck processing rows          |

Each user RPC checks `auth.uid()`, targets only rows where
`recipient_user_id = auth.uid()`, and returns `not_found` if no row matches.
Recipient cannot forge another user's id, mutate templates, priority, action
target, dedupe key, or policy version.

## Adapter hygiene

- No raw provider strings persisted; `classifyNotificationDispatchError` maps
  to a stable internal code set.
- No PII or secrets in metrics/logs — dispatcher logs error code and row id only.

---

## BC-8.1 Turn C Phase 0 — Runtime endpoint hardening

`/api/public/hooks/notification-runtime` — worker entrypoint invoked by
pg_cron / external schedulers to trigger bounded runtime work.

### Authorization

Server-only Bearer secret: `NOTIFICATION_RUNTIME_CRON_SECRET` (env-only,
never bundled to client, never logged, never returned in responses).

- Header contract: `Authorization: Bearer <secret>`
- Comparison: length-then-XOR constant-time equality
  (`timingSafeEqual` in `notification-runtime.ts`)
- Absent / malformed / empty / mismatched → `401 unauthorized`
- Supabase anon `apikey` alone → `401` (public key is NOT accepted)
- Ordinary authenticated user JWT → `401`
- Unsupported action → `400 unsupported_action`

Action allowlist (frozen): `consume`, `dispatch`, `schedule`, `reconcile`.
Concurrency: in-process `Set<Action>` guard returns `202 already_running`
when the same action is already executing.

### Rotation

1. Generate a new value via `secrets.generate_secret` (`length: 64`).
2. Deploy the app with both secrets active if pg_cron rotation cannot be
   simultaneous (grace window supported by keeping old secret readable).
3. Update pg_cron / external scheduler `Authorization` header to the new
   secret.
4. Delete the old secret.

### Logging

Only safe metadata is logged: action, elapsed ms, error message string
(no headers, no bodies, no PII, no secret material). Response body never
echoes the secret or request headers.

### Tests

`src/__tests__/notification-runtime-auth.bc81.test.ts` — 9 cases proving
no-auth, anon-only, authenticated-user JWT, malformed bearer, incorrect
secret, correct secret, missing env, action allowlist freeze, and
runtime-worker methods absent from the public SDK.
