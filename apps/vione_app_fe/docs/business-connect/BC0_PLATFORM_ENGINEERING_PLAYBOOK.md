# BC-0.6 — Platform Engineering Playbook

**Status:** Frozen (Engineering Standards Baseline v1)
**Depends on:** BC-0.1 → BC-0.5 (Enterprise Architecture Freeze)
**Scope:** Documentation-only. Defines _how_ engineers build on Business Connect v1 — the mandatory rules, patterns, and gates for every code change from BC-1 onward.

---

## 0. Purpose

BC-0.1 → BC-0.5 froze _what_ the platform is (identity, security, domains, scopes, architecture).
This playbook freezes _how_ we build it — a single source of truth for engineering conventions so every phase, PR, and contributor produces consistent, secure, reviewable code.

Nothing here overrides the frozen ADRs. Where this document and an ADR conflict, the ADR wins and this document is corrected.

---

## 1. Golden Rules (non-negotiable)

1. **Additive & reversible.** Every migration is additive, idempotent, backward-compatible, and rollback-safe (per `MIGRATION_GUIDELINES.md`). No destructive column drops in the same release that stops writing them.
2. **No raw `anon` grants on business tables.** Public data is exposed only through vetted RPC / server-fn projections (ADR-BC-005).
3. **Scope before query.** Every read/write is scoped to a `ResourceScope` (`personal | community | association | platform | public`) before it touches the DB (ADR-BC-008).
4. **Server owns authorization.** Client-side checks are UX only. Real enforcement lives in RLS + server functions (ADR-BC-004).
5. **No business logic in Platform Core.** Platform Core stays scope-agnostic; business rules live in Shared Services; composition lives in Product Surfaces (ADR-BC-007/010).
6. **i18n by default.** No hardcoded UI strings. Vietnamese first, English + future locales supported.
7. **Every table ships GRANTs + RLS + policies in the same migration.** A table without policies is a broken table.

---

## 2. Layering Contract (enforced in review)

| Layer                                                            | May import from           | Must NOT contain                         |
| ---------------------------------------------------------------- | ------------------------- | ---------------------------------------- |
| **Platform Core** (`src/integrations/*`, identity, auth)         | nothing business-specific | scope logic, product rules               |
| **Shared Business Services** (`src/lib/*.functions.ts`, engines) | Platform Core             | route/UI concerns, hardcoded product IDs |
| **Product Surfaces** (`src/routes/*`, components)                | Shared Services + Core    | direct DB writes, service-role usage     |

**Rule:** dependencies point downward only. A route never talks to the DB directly; it calls a Shared Service. A Shared Service never renders UI.

---

## 3. Server Function Standard

- App-internal logic → `createServerFn` from `@tanstack/react-start` in `*.functions.ts` (client-safe module path).
- External callers (webhooks/cron/public API) → server routes under `src/routes/api/public/*` with signature/secret verification.
- Read `process.env.*` **inside** `.handler()`, never at module scope.
- Authenticated fns use `.middleware([requireSupabaseAuth])`; never call these from a public-route loader (SSR/prerender has no session).
- `supabaseAdmin` (service role) only for verified webhooks/admin/maintenance, loaded lazily inside the handler. Never the default Data API client, never in a route module top-level import.
- Every mutating fn returns a typed result and a stable error code (see §6).

**Canonical shape**

```ts
export const doThing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Schema.parse(d))
  .handler(async ({ data, context }) => {
    // scope check → authorize → mutate → audit → return
  });
```

---

## 4. Data & Migration Standard

Required order in every table-creating migration:

1. `CREATE TABLE public.<name> (...)`
2. `GRANT` per role the policies allow (+ `service_role` `ALL`)
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY ...`

Rules:

- Roles live in a separate `user_roles` table checked via `has_role()` security-definer (never on profiles).
- No writes to reserved schemas (`auth`, `storage`, `realtime`, `supabase_functions`, `vault`).
- Seed/demo data belongs in migrations, not runtime code.
- Every scope-bearing table has a `scope` discriminator and owner column consistent with `RESOURCE_SCOPE_MATRIX.md`.

---

## 5. Security Standard

- Default deny. Add the narrowest policy that satisfies the use case.
- Public projections go through RPC/server-fn that select only whitelisted fields.
- All mutations on sensitive domains (cards, payments, roles, moderation) write an **audit log** entry (actor, action, before/after, timestamp).
- Follow `BC0_SECURITY_MATRIX.md`, `BC0_SECURITY_TEST_PLAN.md`, and `BC0_PUBLIC_ACCESS_HARDENING_PLAN.md`. New public surface = new entry in the security test plan.

---

## 6. Error Handling & Contracts

- Stable, prefixed error codes per domain (e.g. `BC_ERR`, `CARD_ERR`, `PAY_ERR`).
- Server returns codes; client maps codes → i18n messages (never raw server text in the UI).
- User-facing failures always offer a next action (retry / contact / adjust input).
- AI provider failures fall back gracefully and surface provider/fallback status in the UI.

---

## 7. Accessibility Standard (a11y contract)

- WCAG 2.1 AA baseline. `wcag2a` + `wcag2aa` enforced via `jest-axe` in e2e/a11y suites.
- Interactive groups: `role`, `aria-label`, `aria-pressed`, full keyboard nav (Tab/Enter/Escape), `focus-visible:ring`.
- Dynamic lists: correct `role="list"`, `aria-live`, and `aria-busy` during reloads.
- New interactive surfaces add to `docs/a11y-checklist.md` and get an a11y e2e test.

---

## 8. UI/UX Standard

- Design language: Stripe / Notion / Linear / Vercel — minimal, premium, spacious, strong type hierarchy, soft shadows, rounded corners.
- Semantic design tokens only (no hardcoded colors). White bg, neutral grayscale, deep-blue accent, 8px grid, Inter/Geist.
- Responsive: desktop, tablet, mobile; mobile must feel native.
- Avoid clutter, heavy gradients, legacy-admin density.

---

## 9. Testing & CI Gates

Minimum bar per PR:

- Unit tests for scope/permission logic.
- e2e for multi-step flows (wizards, check-in, renewal).
- a11y e2e (axe) for any interactive change.
- i18n key check (`i18n:check`) in `prebuild`.
- Build + typecheck green (`tsgo`, `bunx vitest run`).

CI must **fail the build** when: a11y contract breaks (aria-live/role="list"/aria-pressed), i18n keys are missing, or typecheck/tests fail.

---

## 10. Definition of Done (per feature)

- [ ] Scope + authorization enforced server-side (RLS + fn)
- [ ] Migration additive/idempotent with GRANT+RLS+policies
- [ ] Audit logging on sensitive mutations
- [ ] i18n keys added (vi + en), no hardcoded text
- [ ] a11y attributes + a11y e2e passing
- [ ] Unit + e2e tests passing, build/typecheck green
- [ ] Docs updated (relevant matrix / checklist / ADR index)
- [ ] Meets UI/UX standard, responsive on 3 breakpoints

---

## 11. Change Control

- Architecture-affecting changes require a new ADR and Gate review (`IMPLEMENTATION_GATES.md`).
- This playbook is versioned; amendments bump the baseline version and are logged in `ARCHITECTURE_DECISION_INDEX.md`.

---

_End of BC-0.6 — Platform Engineering Playbook (Engineering Standards Baseline v1)._
