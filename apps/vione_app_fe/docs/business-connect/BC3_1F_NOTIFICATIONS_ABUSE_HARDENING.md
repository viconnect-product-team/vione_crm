# BC-3.1F — Global Networking Notifications, Abuse Controls & Production Hardening

**Architecture Version:** Business Connect v1 — FROZEN
**Status:** Implemented
**Scope guard:** Additive only. Does **not** modify the frozen BC-3.1A connection
state machine RPCs. No messaging, community, CRM, or legacy migration.

## 1. Objective

Complete the Global Networking MVP for production:

- In-app notification delivery for new requests and accepted connections.
- Server-enforced request rate limits (hourly/daily) and re-request cooldowns.
- Report + block abuse controls with a privacy-preserving model.
- Observability/audit continuity and a production-readiness posture.

## 2. Data model (additive)

| Object                  | Purpose                                                     | Access model                                                                                                              |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `gn_notifications`      | Per-recipient in-app notification center                    | Recipient reads own; only `read_at` is user-updatable. Insert only via SECURITY DEFINER trigger. No client insert/delete. |
| `gn_notification_prefs` | Per-user delivery preferences (request / accepted / status) | Owner reads & upserts own row only.                                                                                       |
| `gn_reports`            | Abuse reports                                               | Reporter reads own; platform admins read/triage all. Reported user sees nothing. Created only via `gn_report_user` RPC.   |

Enums: `gn_notification_type`, `gn_report_category`, `gn_report_status` (frozen, additive).

## 3. Notification emission

`trg_gn_emit_notification` fires `AFTER INSERT ON user_connection_events`:

- `connection_requested` → notify the recipient (`connection_request`).
- `connection_accepted` → notify the original requester (`connection_accepted`).
- other transitions do not notify the counterpart.

Guarantees:

- **Idempotent** — unique on `origin_event_id`; mutation replay never re-logs an
  event (BC-3.1A mutation cache), so one event yields at most one notification.
- **Preference-gated** — honors `gn_notification_prefs` (default allow).
- **Privacy-safe payload** — `actor_summary` is a snapshot from
  `gn_actor_public_summary()`, which projects ONLY a published + public business
  card (display name, avatar, headline, company, slug). Never phone/email/notes.
- **Recipient derived server-side** — from the event row, never client input.

## 4. Rate limits & cooldowns

`global_connection_send_request_guarded()` wraps the frozen
`global_connection_send_request()` without changing its semantics:

- Idempotent replays (cached mutation key) bypass all counting.
- Pair cooldown: 7 days after a `declined`, 24 hours after a `cancelled` pair →
  `NETWORK_PAIR_COOLDOWN`.
- Hourly cap 20 / daily cap 100 outgoing requests (counted from authoritative
  `user_connection_events`) → `NETWORK_RATE_LIMITED`.

`GlobalConnectionService.sendRequest` now calls the guarded RPC.

Report submission: max 5/hour per reporter → `NETWORK_REPORT_RATE_LIMITED`.

## 5. Abuse controls

- `gn_report_user(reported, category, details, connectionId)` — auth-required,
  self-report blocked, rate limited, details capped at 2000 chars.
- `gn_report_set_status(report, status, note)` — platform admins only.
- Block reuses the existing frozen `global_connection_block` path via the SDK.

## 6. Application layers

- Services: `abuse.ts` (`AbuseService`), `notifications.ts` (`NotificationService`).
- Server functions: `src/lib/global-network-abuse.functions.ts`
  (`reportUserFn`, `listNetworkNotificationsFn`, `countUnreadNotificationsFn`,
  `markNotificationsReadFn`, `getNotificationPrefsFn`, `setNotificationPrefsFn`).
- SDK: `GlobalNetworkSDK.abuse` and `GlobalNetworkSDK.notifications`.
- Hook: `useNetworkNotifications`.
- UI: `ReportUserDialog`, per-row Report/Block actions in `NetworkSectionView`,
  and the `NetworkNotificationsView` tab at `/connect/network/notifications`.

## 7. Security posture

- All new SECURITY DEFINER functions revoke EXECUTE from `PUBLIC`/`anon`;
  each internally calls `gn_require_user()` (or `is_platform_admin()`).
- No service-role usage in server functions; RLS scopes every read.
- Stable domain error codes only — raw SQL/RLS text never reaches clients.

## 8. Verification

- Migration linter: the 5 new functions are no longer anon-executable
  (remaining warnings are pre-existing, unrelated tables).
- `src/__tests__/global-network-abuse.bc31f.test.ts` — 7 guardrail tests
  (error mapping, taxonomy, module boundaries, guarded send routing).
- Typecheck clean; i18n check clean (vi + en for all new keys).

## 9. Explicit non-goals

Messaging/DM, community feeds, CRM pipelines, and legacy member-network
migration remain out of scope and untouched.
