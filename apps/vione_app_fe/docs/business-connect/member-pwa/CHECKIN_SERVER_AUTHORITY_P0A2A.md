# Member PWA · Check-in Server Authority (P0-A2A)

Scope: **hard blocker only** — remove `localStorage` as canonical check-in
state from `/m/checkin` and route through backend-authoritative server
functions. This slice does NOT cover `updateMyMemberProfile`, the
`useMemberContext` fan-out, live E2E, or other P0-A2 items. Those remain
open under P0-A2B.

## Decision

Backend (`public.member_checkins`) is the single source of truth for
member check-in state. The Member PWA no longer reads or writes
authoritative check-in records to `localStorage`.

**Offline policy: Option A — online-required.** Offline scans are
rejected in the UI with a controlled "offline" state; nothing is
persisted locally and nothing is later replayed as a completed check-in.

## Before / after

**Before**

```
/m/checkin
  → loadCheckins()/saveCheckins()  // localStorage (canonical)
  → pendingCheckins queue           // localStorage
  → syncMemberCheckins() best-effort flush → attendees
```

Client owned the truth: status, timestamp, member id, event title all
came from device state.

**After**

```
/m/checkin
  → useServerFn(checkInMyself)      // src/lib/member-app/checkin.functions.ts
  → requireSupabaseAuth middleware  // server-derived userId (auth.uid())
  → members lookup by user_id       // trusted member_code + association_id
  → events lookup by (id, association_id)  // trusted event_title
  → member_checkins upsert on client_id `chk:<member_code>:<event_id>`
  → authoritative MyCheckinRecord DTO
  → UI
```

`getMyCheckinState` reads the last 50 rows scoped server-side to the
caller's `member_code` and `association_id`.

## Backend call chain

| Layer            | Symbol                                                                      | File                                        |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| Route            | `CheckinScreen`                                                             | `src/routes/m.checkin.tsx`                  |
| RPC client       | `useServerFn(getMyCheckinState \| checkInMyself)`                           | route                                       |
| Server fn        | `getMyCheckinState`, `checkInMyself`                                        | `src/lib/member-app/checkin.functions.ts`   |
| Middleware       | `requireSupabaseAuth` (userId + supabase client)                            | `src/integrations/supabase/auth-middleware` |
| Identity resolve | `members` where `user_id = auth.uid()` → `code`, `association_id`, `status` | server fn                                   |
| Event resolve    | `events` where `id = payload AND association_id = me.association_id`        | server fn                                   |
| Persist          | `member_checkins.upsert({...}, onConflict: "client_id")`                    | server fn                                   |

## Database / RPC evidence

`public.member_checkins` columns (verified via `information_schema`):

```
id uuid | client_id text | member_code text | event_id text
| event_title text | status text | method text
| checked_at timestamptz | created_at timestamptz | association_id uuid
```

Unique index (verified via `pg_indexes`):

```
member_checkins_client_id_key ON public.member_checkins (client_id)  -- UNIQUE
```

This is the physical enforcement point behind idempotency.

## localStorage remediation

Removed from `src/routes/m.checkin.tsx`:

- `loadCheckins` / `saveCheckins` / `pendingCheckins` imports and calls.
- The `syncMemberCheckins` offline flush loop and its "pending sync" UI.
- Local history rendering from `localStorage`.

Enforced by two structural gates that grep the route source at build/test
time:

- `src/__tests__/member-pwa-no-mock-imports.p0a1.test.ts` (regression) —
  `m.checkin.tsx` is no longer on `KNOWN_VIOLATIONS`; any re-import of
  `@/lib/member-app-data` from `/m/*` fails the build.
- `src/__tests__/member-pwa-checkin-server-authority.p0a2.test.ts` (new) —
  asserts no `member-app-data` import, no `localStorage.(get|set|remove)Item`,
  no `syncMemberCheckins`, and that both `getMyCheckinState` and
  `checkInMyself` are referenced.

## Idempotency proof

Client input is limited to `{ payload: string, method: "qr"|"nfc" }`
(Zod-validated, 1–200 chars). The server:

1. Derives `member_code`, `association_id` from `auth.uid()`.
2. Rejects unknown events within the caller's association as `status="invalid"`.
3. For valid scans, computes `client_id = "chk:<member_code>:<event_id>"`.
4. Checks for a prior `status="success"` row via `(member_code, event_id)`.
5. Upserts with `onConflict: "client_id"` — physical uniqueness enforced by
   `member_checkins_client_id_key`.
6. Returns `status="success"` on the first insert, `status="already"` on
   every replay, reusing the original `checked_at`.

The idempotency key is bound to `(member_code, event_id)`, so a replayed
scan cannot be reassigned to another event or another member.

## RLS and tenant-isolation proof

Existing policies on `member_checkins` scoped writes/reads to association
admins only — that would have blocked the authenticated-member path. This
slice ships an additive migration (2026-07-23) with two member-scoped
policies plus explicit `GRANT`s:

```sql
GRANT SELECT, INSERT ON public.member_checkins TO authenticated;
GRANT ALL ON public.member_checkins TO service_role;

CREATE POLICY member_checkins_self_select
  ON public.member_checkins FOR SELECT TO authenticated
  USING (member_code IN (
    SELECT m.code FROM public.members m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY member_checkins_self_insert
  ON public.member_checkins FOR INSERT TO authenticated
  WITH CHECK (member_code IN (
    SELECT m.code FROM public.members m
    WHERE m.user_id = auth.uid()
      AND m.association_id = member_checkins.association_id
  ));
```

Tenant isolation: the `WITH CHECK` requires the inserting user's own
member row AND that its `association_id` matches the row being inserted,
so cross-tenant forgery fails closed even if the server function were
bypassed. Admin policies (`member_checkins_*_admin_*`) are unchanged. No
service-role client is used on the happy path — everything runs as
`authenticated` under RLS.

## Tests and runtime results

Structural + regression suites (Vitest):

```
$ bunx vitest run \
    src/__tests__/member-pwa-checkin-server-authority.p0a2.test.ts \
    src/__tests__/member-pwa-no-mock-imports.p0a1.test.ts

✓ member-pwa-checkin-server-authority.p0a2.test.ts (4 tests)
✓ member-pwa-no-mock-imports.p0a1.test.ts        (27 tests)
Test Files  2 passed (2)
     Tests  31 passed (31)
```

DB evidence gathered directly via `supabase--read_query`:

- Columns of `public.member_checkins` (above).
- Unique index `member_checkins_client_id_key` on `client_id`.
- Pre-existing admin policies preserved; new self-scoped policies
  installed by the P0-A2A migration.

Full live E2E (real user session hitting the deployed route + DB) is not
part of P0-A2A and is tracked under P0-A2B.

## What is NOT in P0-A2A

- `updateMyMemberProfile` mutation and profile-edit UI wiring.
- `useMemberContext()` client hook and per-account cache reset.
- Query-key context scoping across `/m/*`.
- Full events / renewal / opportunities server-authority sweep.
- Live-DB end-to-end runs against the deployed environment.
- Deletion of `src/lib/member-app-data.ts` (still referenced by desktop
  routes; scheduled with P0-B).

These remain open. See gap register entries #2, #3 and audit follow-ups.
