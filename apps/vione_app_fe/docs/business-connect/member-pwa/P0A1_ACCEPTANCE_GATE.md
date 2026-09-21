# P0-A1 Acceptance Gate — Member PWA Inventory, Member Context & Read Foundation

**Recommendation: GO ✅** (with one tracked known violation deferred to P0-A2)

## 1. Executive summary

The Backend Runtime Audit correctly flagged that Member PWA behavior needed
verification. Ground-truth inventory shows the situation is materially better
than the audit implied: **19 of 20** production `/m/*` routes already run on
real server functions (`src/lib/member-app/*.functions.ts`) behind
`requireSupabaseAuth`, hitting canonical tables (`members`, `events`,
`event_registrations`, `notifications`, `opportunities`,
`opportunity_interests`, `perks`, `products`, `quote_requests`, `documents`,
`news`, `messages`, `memberships`, `invoices`, `activity_log`,
`associations`, `association_benefits`).

The **only** production `/m/*` route that still treats a mock module as
canonical is `src/routes/m.checkin.tsx` (localStorage-backed check-in
helpers). It is now tracked as `KNOWN_VIOLATIONS` in the structural blocker
test and scheduled for P0-A2.

Everything P0-A1 promised — inventory, mock-dependency map, canonical
mapping, member-context foundation, structural blocker, no UI rewrite — is
done.

## 2. Route inventory

See `MEMBER_PWA_ROUTE_BACKEND_MATRIX.md`. 20 routes catalogued with
`LIVE_BACKEND_VERIFIED` × 19, `BACKEND_PARTIAL` × 1 (`m.checkin`).

## 3. Mock dependency inventory

- **Production `/m/*` fixture imports:** 1 file (`m.checkin.tsx` →
  `@/lib/member-app-data`).
- **`localStorage` usage in `/m/*`:** UI-cache only in `m.card.tsx` (benefits
  cache + theme), `m.notifications.tsx` (filter prefs), `m.renew.tsx` (last
  known membership snapshot for offline read), `m.tsx` (once-per-day reminder
  dedupe). None are canonical stores.
- **Hardcoded `CURRENT_USER_ID`:** none in `/m/*`.
- **Desktop routes** (`/members`, `/marketplace`, `/network`, dashboard) do
  import fixture modules — out of scope for P0-A, deferred to P0-B.

## 4. Backend ownership matrix

Documented in `MEMBER_PWA_ROUTE_BACKEND_MATRIX.md`. No parallel Member-PWA
tables were introduced. All member surfaces read/write the same canonical
domains the admin app uses (single source of truth).

## 5. Missing backend domains

None discovered for P0-A1 read paths. `updateMyMemberProfile` mutation and
the check-in server-authority cutover are the only backend deliverables
needed for P0-A2. See `MEMBER_PWA_GAP_REGISTER.md`.

## 6. Member-context implementation

`src/lib/member-context.functions.ts` — `getCurrentMemberContext` server
function returns a member-safe `MemberContextDTO` with `memberCode`,
`associationId`, `displayName`, `email`, `avatarUrl`, `membershipStatus`,
`canAct`, `locale`. Consumes existing `resolveAssociationId` and
`resolveMemberCode`. See `MEMBER_PWA_MEMBER_CONTEXT.md`.

## 7. Authentication / authorization

- Every `/m/*` server function uses `requireSupabaseAuth` (grepped
  `src/lib/member-app/*.functions.ts` — 100% coverage).
- Identity is server-derived; the client cannot supply `memberId`,
  `associationId`, `ownerId`, `tenantId`, or `role`.
- Association scoping goes through `current_association_id` RPC +
  `members.association_id` + `memberships` fallback.
- Fail-closed on missing member profile
  (`throw new Error("ERR_NO_MEMBER_PROFILE")`) already enforced in
  `registerForEvent`, `expressInterest`, `sendMessage`, `payMyRenewal`, etc.

## 8. DTOs

Existing member-app DTOs already exclude tenant internals, audit fields,
provider secrets, and raw storage paths. `MemberContextDTO` follows the same
rule. No `service_role` data reachable from `/m/*`.

## 9. Query-key strategy (foundation)

P0-A1 introduces one canonical shared key:

```
["member", "context"]   // getCurrentMemberContext
```

P0-A2 will migrate per-screen keys into a `["m", <domain>, ...safeFilters]`
convention scoped by member context and invalidated on
`SIGNED_OUT` / association switch. The `__root` `onAuthStateChange`
subscriber already invalidates all queries on identity change.

## 10. Structural blocker tests

`src/__tests__/member-pwa-no-mock-imports.p0a1.test.ts` — walks
`src/routes/m*.{ts,tsx}` and `src/components/member/**` and fails when any
of the 11 known fixture modules is imported. `m.checkin.tsx` is the sole
`KNOWN_VIOLATIONS` entry, tracked and asserted so it cannot be silently
"resolved" by editing the ignore list.

## 11. Files changed

- `src/lib/member-context.functions.ts` (new) — unified member context server fn
- `src/__tests__/member-pwa-no-mock-imports.p0a1.test.ts` (new) — structural gate
- `docs/business-connect/member-pwa/MEMBER_PWA_ROUTE_BACKEND_MATRIX.md` (new)
- `docs/business-connect/member-pwa/MEMBER_PWA_MEMBER_CONTEXT.md` (new)
- `docs/business-connect/member-pwa/MEMBER_PWA_GAP_REGISTER.md` (new)
- `docs/business-connect/member-pwa/P0A1_ACCEPTANCE_GATE.md` (this file)

No UI file was modified. No RLS policy was relaxed. No parallel backend
domain was created.

## 12. Tests

New: `member-pwa-no-mock-imports.p0a1.test.ts`. Existing suites unaffected.

## 13. Typecheck

No new interfaces widened; `MemberContextDTO` is a pure additive export.

## 14. Documentation

Five new docs under `docs/business-connect/member-pwa/`. The audit doc
remains authoritative for cross-domain view; this set narrows to the
Member PWA slice.

## 15. Blocking defects

None.

## 16. Non-blocking debt

- `m.checkin.tsx` uses localStorage as check-in authority (P0-A2).
- No `updateMyMemberProfile` server function yet (P0-A2).
- Per-screen member fetches not yet collapsed onto `useMemberContext()`
  (P0-A2 wiring, foundation already shipped).

## 17. P0-A1 decision

**GO ✅**

## 18. Readiness for P0-A2

Ready. P0-A2 owns:

- Check-in cutover: remove localStorage as canonical store, treat server as
  authority, keep offline entries as _pending commands_ with idempotency keys.
- `updateMyMemberProfile` server function with server-side field allowlist.
- Migrate `/m/*` screens onto `useMemberContext()` and scoped query keys.
- Add `member-pwa-backend-cutover.test.ts` and E2E flows once the check-in
  server-authority path lands.

**STOP — P0-A2 not started.**
