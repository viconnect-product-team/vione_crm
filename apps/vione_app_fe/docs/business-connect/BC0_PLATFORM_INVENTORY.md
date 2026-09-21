# BC-0.1 — Platform Inventory

**Scope:** Report-only audit of the Association Hub codebase to map how the
current system binds identity, tenancy and ownership before any Business
Connect work. No source, schema, migration, route or RLS change was made.

**Baseline:** Source unchanged, so typecheck was not run. Last known state per
prior turns: `tsgo`/build passing. This document references only real files,
functions, tables and policies verified this turn.

---

## 1. Identity & tenancy primitives

| Primitive                                | Definition                                           | Source of truth                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.uid()`                             | Supabase JWT subject                                 | `requireSupabaseAuth` middleware (`src/integrations/supabase/auth-middleware.ts`) validates the Bearer token via `supabase.auth.getClaims`, exposes `context.userId` + RLS-scoped `context.supabase`. |
| `current_member_id()`                    | text member id for the active association            | SECURITY DEFINER SQL fn; resolves `members.user_id = auth.uid()` scoped to `current_association_id()`. Returns **NULL** when the user has no linked member row.                                       |
| `current_association_id()`               | uuid of the user's active (default) association      | SECURITY DEFINER; reads `memberships` ordered by `is_default DESC, created_at ASC`.                                                                                                                   |
| `resolveMemberId(supabase)`              | throws "chưa được liên kết hồ sơ hội viên" when null | `src/lib/current-member.ts` — wraps `rpc("current_member_id")`.                                                                                                                                       |
| `resolveMemberIdOrNull(supabase)`        | graceful null                                        | same file. Used by read paths that must degrade (networking, interactions).                                                                                                                           |
| `resolveAssociationId(supabase)`         | throws "chưa thuộc hiệp hội nào" when null           | `src/lib/current-member.ts` — wraps `rpc("current_association_id")`.                                                                                                                                  |
| `resolveAssociationId(supabase, userId)` | fallback resolver (rpc → members → memberships)      | `src/lib/member-app/shared.ts` (different signature; used by member-app domain).                                                                                                                      |

### Role helpers (SECURITY DEFINER)

- `has_role(uid, app_role)` — global `user_roles`.
- `has_assoc_role(assoc, role)` / `is_assoc_manager(assoc)` — per-association admin (admin OR platform admin).
- `is_member_of(assoc)` — membership existence.
- `is_platform_admin()` — global `platform_admin`.
- `my_bc_admin_level()` / `bc_admin_level(uid)` — business-card admin tier (`full`/`moderator`/`viewer`/`none`) from `bc_admin_grants` + membership admin.
- `owns_business_card(card_id)` / `manages_business_card(card_id)` / `is_public_business_card(card_id)` — card ownership predicates.

### Account provisioning (`handle_new_user` trigger)

On signup the trigger inserts into **`profiles`**, **`user_roles`** (first user = admin, else member) and **`memberships`** (default association if a `default`-slug association exists). It does **NOT** create a **`members`** row.

> **Consequence:** A newly signed-up account is authenticated, has a profile,
> a role and (possibly) a membership, but `current_member_id()` returns NULL
> until an admin creates/links a `members` row (`link_my_member_profile`).
> This is the single most important fact for Business Connect: **login does
> not require a member identity, but nearly every member-domain server
> function does.**

---

## 2. Server-function domains (`src/lib/*`)

All app-internal logic uses `createServerFn` (`@tanstack/react-start`) + `requireSupabaseAuth`. 60+ `*.functions.ts` modules. Grouped by identity dependency:

### Member-identity dependent (call `resolveMemberId`)

`business-card.functions.ts`, `marketplace.functions.ts`, `networking.functions.ts`, `opportunities.functions.ts`, `member-activity.functions.ts`, `member-app/notifications.functions.ts`.

### Association dependent (call `resolveAssociationId`, no member needed)

`ai.functions.ts`, `benefits.functions.ts`, `reply-templates.functions.ts`, `member-app/profile.functions.ts`, `member-app/shared.ts`.

### User dependent only (`context.userId` / `auth.uid()`)

`card.functions.ts` (`card_settings.user_id = auth.uid()`), `current-member.functions.ts` (link/unlink), `settings.functions.ts`, `ai-settings.functions.ts`.

### RLS-only (no explicit identity resolution in the fn; DB policies enforce)

`meetings.functions.ts`, `campaigns.functions.ts`, `companies.functions.ts`, `news.functions.ts`, `notifications.functions.ts`, `documents.functions.ts`, `finance.functions.ts`, `fees.functions.ts`, `events.functions.ts`.

### Service-role (bypasses RLS — `@/integrations/supabase/client.server`)

`ai.functions.ts`, `ai-audit.functions.ts`, `business-card.functions.ts` (gated existence check + public path), `card.functions.ts`, `marketplace.functions.ts`, `member-account/*`, `member-app/renewal.functions.ts`, `member-checkin.functions.ts`, `member-identity-pass/{my-pass,verify}.functions.ts`, `opportunities.functions.ts`, `platform.functions.ts`.

---

## 3. Public (unauthenticated) surfaces

| Route                       | Data path                                                                                                                                                                                                                | Auth |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `/b/$slug`                  | `getPublicBusinessCardFn` — **no middleware**; server creates a fresh anon publishable client, reads `member_business_cards` where `status=published`; a service-role check distinguishes `members_only` vs `not_found`. | anon |
| `/card/$code`               | `getPublicCard` (`card.functions.ts`)                                                                                                                                                                                    | anon |
| `/verify`                   | `verifyMemberPassFn` — **no middleware**; uses `supabaseAdmin` service role to read passes/members/associations.                                                                                                         | anon |
| `/h/$slug`, `/landing`, `/` | association landing (`landing-route.functions.ts`), public where `landing_published = true`.                                                                                                                             | anon |
| `/demo`                     | `demo_requests` insert.                                                                                                                                                                                                  | anon |

Anon SELECT RLS policies exist only for: `associations` (landing_published), `member_business_cards` (published+public), `business_card_services`, `business_card_needs`. Everything else is authenticated-only or service-role-mediated.

---

## 4. Route guards

- **`/m` (member app root):** `beforeLoad` checks `supabase.auth.getUser()` only → redirects to `/auth` if unauthenticated. **Does not check for a member row.** `ssr: false`.
- **`/admin/business-cards`:** early `my_bc_admin_level()` check before data load; renders unified "Unauthorized" UI for `none`.
- **`/platform/*`:** platform-admin gated.
- No generic `_authenticated/` layout route exists; each protected surface guards itself (`/m` root guard + per-function `requireSupabaseAuth`).

See `BC0_DEPENDENCY_MATRIX.md` for per-artifact classification,
`BC0_CALL_GRAPHS.md` for flow traces, and `BC0_BLOCKERS_AND_RISKS.md` for
architectural blockers.
