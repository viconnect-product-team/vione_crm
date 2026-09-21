# Notification Center — Product Surface (BC-8.1 Turn C)

Recipient-scoped Business Connect notification UI. Consumes only the public
`NotificationOrchestrationSDK` through React Query hooks in
`src/hooks/use-bc-notifications.ts`. Runtime worker methods (consume /
dispatch / retry / reconcile / escalate / replay) are NEVER reachable from
this surface.

## Routes

- `/business-connect/notifications` — `BcNotificationCenter`. Lists the
  viewer's notifications with status tabs, unread filter, mark
  read/unread, archive, archive-all-read, refresh.
- `/account-settings/notifications` — Notification preferences editor:
  global toggle, channels, digest mode + time, timezone, quiet hours,
  critical bypass, per-kind overrides grouped by category.

## Hooks (public surface)

`use-bc-notifications.ts` exports:

- `useNotifications(filters)`
- `useUnreadNotificationCount()`
- `useMarkNotificationRead()` / `useMarkNotificationUnread()`
- `useArchiveNotification()` / `useArchiveAllRead()`
- `useNotificationPreferences()`
- `useUpdateNotificationPreferences()`
- `useUpdateNotificationOverride()` / `useClearNotificationOverride()`
- `NOTIFICATION_CHANNEL_AVAILABILITY` — mirrors runtime posture (email /
  push = `unavailable`).

Query keys (frozen, PII-free) live in `notificationKeys`. Mutations
invalidate the entire `bc/notifications` subtree; preference mutations
invalidate only `preferences`.

## Provider posture (§L §Q)

Email and push toggles render as available but are labeled _not available
yet_ with an explanation. This matches the runtime, which records
unsupported dispatches with `unavailable_provider` so preferences remain
forward-compatible when providers are activated later.

## Accessibility

- `role="list"` on the notification stream; each row is a semantic `<li>`.
- `aria-live="polite"` for the unread count.
- `aria-busy` reflects background refetches.
- `role="tablist"` / `aria-selected` for the status filter tabs.
- Per-kind override buttons use `aria-pressed` and `role="group"`.
- All actionable controls expose `aria-label` and `focus-visible` rings.

## i18n

All strings live under the `bc.notif.*` namespace in `src/lib/i18n.ts`.
`fallbackText()` guards dynamic `titleKey` / `bodyKey` / `labelKey` values
sourced from persisted notifications so unknown keys degrade to a safe
default rather than throwing.

## Phase 0 — Runtime endpoint security

`src/routes/api/public/hooks/notification-runtime.ts` requires
`Authorization: Bearer $NOTIFICATION_RUNTIME_CRON_SECRET`. See
`NOTIFICATION_RUNTIME_SECURITY.md`. The Supabase anon key is public and is
NOT accepted. Tests: `src/__tests__/notification-runtime-auth.bc81.test.ts`
(9 cases including no-auth, anon-only, user JWT, malformed bearer,
incorrect secret, action allowlist, SDK isolation).
