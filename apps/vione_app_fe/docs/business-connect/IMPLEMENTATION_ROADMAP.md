# Implementation Roadmap (FROZEN — BC-0.5)

Documentation-only. Phases run in fixed order (see §Implementation Order in
`ENTERPRISE_ARCHITECTURE_SPECIFICATION`); no parallel phases unless explicitly
documented here. Estimates are planning-level (S ≤3d, M ~1wk, L ~2wk, XL ~3wk+).
Every phase inherits `MIGRATION_GUIDELINES` and `BC_PHASE_ACCEPTANCE`.

---

## BC-1 — Global Identity

- **Objective:** additive `user_profiles`; server helpers `requirePlatformUser()`,
  `buildGlobalIdentityContext()`; login works with no member row.
- **Schema:** new `public.user_profiles` (additive); no changes to `members`.
- **Functions:** identity helpers + profile CRUD server functions.
- **Routes:** none (helpers only).
- **Tests:** identity resolution (member/non-member), RLS owner-only, no-member login.
- **Rollback:** drop new table/functions; nothing else references them yet.
- **Dependencies:** none (foundation).
- **Acceptance:** non-member can sign in and hold a global profile; member flows unchanged.
- **Risk:** R-ID1 identity leakage. **Estimate:** M.

## BC-2 — Business Card Globalization

- **Objective:** add `owner_user_id` to cards (additive), backfill unique valid
  mappings only, keep `member_id` compatibility.
- **Schema:** add nullable `owner_user_id`; index; no rename.
- **Functions:** update card fns to resolve ownership via `owner_user_id` with
  member fallback.
- **Routes:** none new.
- **Tests:** dual-ownership reads, backfill correctness, association moderation intact.
- **Rollback:** stop reading `owner_user_id`; column stays nullable/unused.
- **Dependencies:** BC-1.
- **Acceptance:** cards resolvable by user; legacy member cards unaffected.
- **Risk:** R-MIG2 backfill ambiguity (approve "unique mapping only"). **Estimate:** L.

## BC-3 — Saved Cards

- **Objective:** personal saved-cards collection (personal scope).
- **Schema:** `saved_business_cards` (owner_user_id, card_id).
- **Functions:** save/unsave/list.
- **Tests:** owner-only privacy, no leakage of who saved whom.
- **Rollback:** drop table/functions.
- **Dependencies:** BC-2.
- **Acceptance:** users save/list cards privately. **Risk:** R-SEC saved privacy. **Estimate:** S.

## BC-4 — Global Networking

- **Objective:** `user_connections` global edges + read-only adapter unifying
  legacy association connections for display. No merge.
- **Schema:** `user_connections`; no change to legacy tables.
- **Functions:** request/accept/list; adapter read fn.
- **Tests:** coexistence, adapter parity, no cross-scope role bleed.
- **Rollback:** drop global tables/fns; legacy untouched.
- **Dependencies:** BC-1.
- **Acceptance:** global connections work; legacy still works; unified view reads both.
- **Risk:** R-NET merge temptation. **Estimate:** L.

## BC-5 — Business Connect App Shell

- **Objective:** `/connect/*` surface composing global profile, cards, networking.
- **Schema:** none.
- **Functions:** none new (composition).
- **Routes:** `/connect/*` (first creation of reserved namespace).
- **Tests:** a11y, identity context (non-member), navigation.
- **Rollback:** remove routes; services unaffected.
- **Dependencies:** BC-1..BC-4.
- **Acceptance:** signed-in non-member uses Business Connect end-to-end. **Estimate:** L.

## BC-6 — Communities

- **Objective:** community membership/roles/rules foundation (community scope).
- **Schema:** community tables + GRANT/RLS/policies/indexes.
- **Functions:** membership/role mgmt; `requireCommunityIdentity`.
- **Routes:** none yet (foundation).
- **Tests:** role isolation vs association/platform, visibility (public/private/secret).
- **Rollback:** drop community tables/fns.
- **Dependencies:** BC-1.
- **Acceptance:** communities exist with isolated roles; not Association variants.
- **Risk:** R-COM scope conflation. **Estimate:** XL.

## BC-7 — Marketplace Scope

- **Objective:** parameterize Marketplace Foundation by scope (assoc/business/community).
- **Schema:** add `scope` + scope keys (additive) to listings.
- **Functions:** scope-aware listing fns.
- **Tests:** per-scope visibility, no cross-scope leakage.
- **Rollback:** default scope=association; ignore new scopes.
- **Dependencies:** BC-6.
- **Acceptance:** same engine serves multiple scopes. **Estimate:** L.

## BC-8 — Community Workspace

- **Objective:** `/community/*` surface: feed, events, marketplace, documents, moderation.
- **Schema:** feed/moderation additive as needed.
- **Routes:** `/community/*`.
- **Tests:** a11y, moderation boundaries, community-only access.
- **Rollback:** remove routes/feed tables.
- **Dependencies:** BC-6, BC-7.
- **Acceptance:** communities operate a full workspace. **Estimate:** XL.

## BC-9 — Business AI

- **Objective:** Business persona over shared Gateway; community persona wiring.
- **Schema:** persona/config rows (additive).
- **Functions:** persona routing + audit tagging.
- **Tests:** persona permission isolation, fallback status, audit correctness.
- **Rollback:** disable business persona; assoc AI unaffected.
- **Dependencies:** BC-5.
- **Acceptance:** business persona answers with correct context/permissions. **Estimate:** M.

## BC-10 — Affiliate Foundation

- **Objective:** community affiliate primitives (foundation only).
- **Schema:** affiliate tables + RLS/grants.
- **Tests:** attribution integrity, no PII leakage.
- **Rollback:** drop affiliate tables.
- **Dependencies:** BC-8.
- **Acceptance:** affiliate foundation ready. **Estimate:** L.

## BC-11 — Platform Hardening

- **Objective:** remove raw anon grants, finalize public RPC projections, perf
  indexes, observability, security backlog closure.
- **Schema:** drop/replace anon policies after parity confirmed.
- **Tests:** full security test plan (P0–P11), perf/load, public projection parity.
- **Rollback:** re-enable prior policies (kept until cutover).
- **Dependencies:** all prior phases.
- **Acceptance:** BC0_SECURITY_BACKLOG closed to production gate. **Estimate:** L.
