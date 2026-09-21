# BC-0.1 — Blockers & Risks

Direct answers to the BC-0.1 architectural questions, each backed by a real
artifact. No assumptions.

---

### 1. Can a user without a `members` row log in?

**Yes.** `handle_new_user` creates `profiles` + `user_roles` + `memberships`
(default assoc) but **not** a `members` row. `/m` `beforeLoad` only checks
`supabase.auth.getUser()`. So the account authenticates and can enter the
member app shell — but `current_member_id()` returns NULL.

### 2. Which routes fail when `current_member_id()` is null?

Any surface whose server fn calls `resolveMemberId` (throws
`"Tài khoản chưa được liên kết hồ sơ hội viên."`):

- `/m/business-cards` (create/save/publish/setPrimary/delete)
- `/network` (send/accept/message — `net_*` RPCs also `RAISE 'No member profile'`)
- `/marketplace/workspace`, `/marketplace/my-quotes` (create/quote paths)
- `/m/opportunities` (interest paths), member activity feed, member notifications inbox.

Read paths using `resolveMemberIdOrNull` degrade gracefully (empty state):
`getNetworkStateFn`, interaction history. Association-only fns
(`resolveAssociationId`) still work as long as the user has a membership:
`/ai`, benefits, reply-templates, profile.

### 3. Which Business Card operations require `member_id`?

All owner mutations: `saveBusinessCardFn`, publish/unpublish, set-primary,
delete, and owner reads (`listMyBusinessCardsFn`, `getMyBusinessCardFn`).
RLS `Owner *` policies key on `member_id = current_member_id()`.
Public read (`getPublicBusinessCardFn`) and admin list
(`business-card-admin.functions.ts`) do **not** require a member_id.

### 4. Which Networking operations require `member_id`?

**All write operations.** `net_send_request`, `net_accept_request`,
`net_decline_request`, `net_remove_connection` all resolve
`current_member_id()` and `RAISE EXCEPTION 'No member profile'` when null.
Messages insert requires `resolveMemberId`. Only read state degrades.

### 5. Is Company ownership user-based or member-based?

**Member-based (derived).** `companies.functions.ts` builds history from
`members` + `activity_log` scoped by association RLS; there is no
user-owned company entity. Companies are effectively a view over member data.

### 6. Is Meeting ownership user-based or member-based?

**Neither — association-admin based.** `meetings` RLS
(`meetings_admin_insert/update/delete`) gates on
`has_assoc_role(association_id,'admin') OR is_platform_admin()`. Members read
via `is_member_of`. No per-user host column is enforced.

### 7. Are campaigns association-scoped?

**Yes, admin-scoped.** `email_campaigns` RLS uses
`has_assoc_role(association_id,'admin') OR is_platform_admin()` for all CRUD.
No member-facing "join" concept exists.

### 8. Which tables already use `auth.uid()` ownership? (platform-ready)

- `card_settings` — `auth.uid() = user_id` (all CRUD).
- `profiles` — `id = auth.uid()`.
- `user_roles` — user/platform scoped.
  These support non-member users unchanged.

### 9. Which public tables have anon SELECT?

Only four, all narrow: `associations` (`landing_published=true`),
`member_business_cards` (`status=published AND public_mode=public`),
`business_card_services`, `business_card_needs`. Everything else is
authenticated-only or reached through service-role server functions.
(Anon exposure is locked by `src/__tests__/rls-anon-exposure.e2e.test.ts`,
whitelist = `associations` only for the raw Data API; card publics are read
via a server fn that instantiates its own anon client.)

### 10. Which functions use service role / admin client?

`@/integrations/supabase/client.server` (`supabaseAdmin`, RLS-bypass) is
imported inside handlers of: `ai.functions.ts`, `ai-audit.functions.ts`,
`business-card.functions.ts`, `card.functions.ts`, `marketplace.functions.ts`,
`member-account/{assignment,status,shared.server}`, `member-app/renewal`,
`member-checkin`, `member-identity-pass/{my-pass,verify}`,
`opportunities.functions.ts`, `platform.functions.ts`.

### 11. Which modules can be reused unchanged?

- `card.functions.ts` (card_settings) — user-based, platform-ready.
- Auth/role helpers (`has_role`, `is_platform_admin`, `user_roles`, `profiles`).
- Public card read (`getPublicBusinessCardFn`) and `/verify` — already
  identity-agnostic public reads.
- AI (`ai.functions.ts`) — works with association-only (no member row), if
  the target BC tenant model still resolves an association.

---

## Top architectural blockers for Business Connect

| #   | Blocker                                                                                                                                                                         | Evidence                                             | Impact                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| B1  | **Member identity gate.** Business Cards, Networking, Marketplace all hard-require `current_member_id()`. BC targets non-association users who will never have a `members` row. | `resolveMemberId` throws; `net_*` RPCs `RAISE`.      | Blocks card/networking/marketplace for BC users.                                     |
| B2  | **Tenant = association.** Ownership + RLS are keyed on `association_id` via `memberships`. A standalone BC user has no association context → `current_association_id()` NULL.   | `current_association_id()`, most `*_assoc` policies. | Need a user-based or "personal tenant" model.                                        |
| B3  | **Networking is member-graph only.** `connections.owner_id/peer_id` = member ids, same-association only.                                                                        | `net_send_request` peer-in-assoc check.              | Cross-tenant / user-to-user connections impossible today.                            |
| B4  | **Messages are association-scoped.** `messages` requires member + assoc.                                                                                                        | `messages_*` policies.                               | No user-to-user DM outside an association.                                           |
| B5  | **Signup provisioning omits members.** `handle_new_user` never creates a member row, but member surfaces assume one.                                                            | trigger body.                                        | Silent runtime throws instead of a graceful "become a member / create profile" flow. |

## Recommended adapter strategy (for later phases, not this task)

1. Introduce a user-based ownership path (`auth.uid()`) alongside `member_id`
   for cards / listings (classify C items), so BC users transact without a
   `members` row.
2. Add a personal/BC tenant so `association_id` is never NULL for BC users, or
   make BC tables tenant-optional.
3. Rework networking + messaging to a user-graph model (or dual-key
   member_id/user_id) for cross-tenant connections.
4. Keep D-class modules (fees, renewals, membership lifecycle, identity pass)
   fully isolated to the association domain.

**No code, schema, migration, route or RLS changes were made in BC-0.1.**

---

## BC-0.2 addendum — newly identified identity risks

Additive only; prior BC-0.1 findings above are unchanged. See
`GLOBAL_IDENTITY_CONTRACT.md` and ADR-BC-001/002/003.

| #   | Risk                                                                                                                                                    | Impact                                                                                        | Mitigation (contract)                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| R1  | **Fake member row temptation.** Devs may auto-create a `members` row so BC users can own cards/listings.                                                | Pollutes association registry; corrupts fee/renewal/identity semantics; cross-tenant leakage. | Invariant 4 + Prohibited Patterns; use `owner_user_id` path (ADR-BC-001/003).                                    |
| R2  | **Backfill mis-assignment.** `owner_user_id = members.user_id` where `members.user_id` is null/ambiguous or a member links to multiple users over time. | Silent mis-ownership or detached cards.                                                       | ADR-BC-003: deterministic, idempotent backfill; unlinked rows reported and handled explicitly; no silent detach. |
| R3  | **Association over-moderation.** Global (unlinked) cards moderated by unrelated associations.                                                           | Privilege boundary violation.                                                                 | Invariant 8/10; ADR-BC-003 moderation rule; guarantee in Contract §7.                                            |
| R4  | **BC QR treated as membership identity.** Card QR/NFC scan mistaken for `member_identity_passes` verification.                                          | Fraudulent benefit grants.                                                                    | Invariant 9; Membership Identity stays member+pass based.                                                        |
| R5  | **Profile scope creep.** Association lifecycle fields (member code, fee status) added to global `user_profiles`.                                        | Data leak + privilege confusion.                                                              | Contract §2.B forbidden fields; roles stay in `user_roles`.                                                      |
| R6  | **Client-trusted ownership.** `owner_user_id`/`member_id`/`community_id`/role from client input.                                                        | Ownership spoofing / privilege escalation.                                                    | Invariant 11; all identity server-resolved.                                                                      |
| R7  | **Duplicate networking state.** Legacy `connections` + future `user_connections` show the same relationship twice.                                      | Confusing/inconsistent UX.                                                                    | ADR-BC-003 adapter: unified state, no duplicate visible connections.                                             |

**No code, schema, migration, route or RLS changes were made in BC-0.2.**

---

## BC-0.3 addendum — ownership/RLS/public-access security risks

Additive only; BC-0.1/BC-0.2 findings above are unchanged. See ADR-BC-004/005/006,
`BC0_SECURITY_MATRIX.md`, `BC0_SECURITY_TEST_PLAN.md`,
`BC0_PUBLIC_ACCESS_HARDENING_PLAN.md`, `BC0_SECURITY_BACKLOG.md`.

| #   | Risk                                                                                                                                                          | Impact                                                  | Mitigation (frozen)                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| R8  | **Direct anon SELECT on card tables (verified).** `member_business_cards` + needs/services/skills expose raw rows to `anon`, bypassing `visibility_settings`. | Public scraping of fields beyond intended projection.   | ADR-BC-005 + hardening plan; SEC-01 (blocks external pilot).                                         |
| R9  | **Status conflation.** One `status`/`public_mode` field mixes owner lifecycle and association moderation.                                                     | Owner action overrides moderation or vice versa.        | ADR-BC-006 §1: separate lifecycle vs moderation status fields.                                       |
| R10 | **Saved-card privacy leak.** Saver identity / private notes exposed to card owner; stale snapshots after delete.                                              | Privacy violation.                                      | ADR-BC-006 §2: aggregate-only to owner; private note/tags/follow_up; tombstone on delete.            |
| R11 | **Global connection spoofing.** Client-supplied participant/role/status on `user_connections`.                                                                | Relationship spoofing; self/duplicate pairs.            | ADR-BC-006 §3: requester server-resolved; role never trusted; dedupe + self-connection block.        |
| R12 | **Legacy adapter dual-write.** Global network auto-writes into `connections` or calls `current_member_id()`.                                                  | Corrupts association network; breaks global-only users. | ADR-BC-006 §3: read-only adapter, no auto dual-write, migration only for unique mappings + rollback. |
| R13 | **Community/association role bleed.** Community role implies association access or vice versa; suspended member retains access.                               | Cross-scope privilege escalation.                       | ADR-BC-006 §4: roles server-resolved & independent; immediate loss on suspend/remove.                |
| R14 | **Admin/service client as authz.** `supabaseAdmin` server fn without caller check on published site.                                                          | Unauthenticated privileged endpoint.                    | ADR-BC-004 §9 / SEC-07: admin client never replaces authorization.                                   |

## BC-0.3 frozen security decisions

- Four authorization models A/B/C/D (ADR-BC-004) — every BC table maps to one.
- All ownership/scope/role identity is server-resolved; client input untrusted.
- Public card access must go through a safe server function/RPC; raw anon table
  grants are a defect to remove (ADR-BC-005).
- Owner lifecycle status ≠ association moderation status.
- Saved-card privacy, global-connection authority, and community role isolation
  frozen per ADR-BC-006.
- Storage: no anon buckets; future public media must be explicit and path-validated.

## Blockers before BC-0.4

- **R2/SEC-02** backfill policy for unresolved legacy card ownership — approve
  "unique valid mapping only, report the rest" before any ownership migration.
- **R8/SEC-01** confirm `getPublicBusinessCardFn` output parity before scheduling
  removal of anon card-table policies.
- **SEC-06/SEC-07** approve SECURITY DEFINER execute-grant review + admin-client
  authorization audit scope.

**No code, schema, migration, route or RLS changes were made in BC-0.3.**

## BC-0.4 domain boundary decisions (frozen)

Documentation-only. Deliverables: ADR-BC-007 (Domain Boundaries), ADR-BC-008
(Resource Scope), ADR-BC-009 (Product Surfaces), ADR-BC-010 (Shared Services),
DOMAIN_BOUNDARY_MATRIX, RESOURCE_SCOPE_MATRIX, PRODUCT_BOUNDARY_GUIDE,
PLATFORM_LAYER_DIAGRAM, SHARED_SERVICE_CATALOG.

- Three layers frozen: Platform Core → Shared Business Services → Product Surfaces.
  Platform Core carries zero business logic; dependencies point strictly downward;
  no circular deps.
- Every domain has exactly one owner (see DOMAIN_BOUNDARY_MATRIX). Split domains
  (Networking, Notifications, AI, Search): infra in Core, composition above.
- Business Card ∈ Shared Services (not Association, not Business Connect);
  Business Card ≠ Membership Identity.
- Five ResourceScopes frozen: personal/community/association/platform/public;
  `public` is always an RPC projection, never a raw anon grant.
- Networking: legacy (Association) + global (Shared) + community coexist; no merge
  in BC-1, adapter only.
- Marketplace: one foundation engine, multiple scopes.
- AI: one Gateway, three personas (Association/Business/Community).

### New risks (BC-0.4)

- **R15 — layer leakage:** existing association-coupled code (cards/networking
  hard-requiring `member_id`) violates the frozen Shared-Service boundary; BC-1
  adapters must resolve this without back-porting business logic into Core/Shared.
- **R16 — split-domain drift:** Networking/AI/Notifications/Search could re-merge
  infra and product logic under delivery pressure; enforce the split in review.
- **R17 — scope conflation:** adding `community`/`personal` scopes later to
  association-only domains (Marketplace/Documents) risks changing existing owner/
  visibility if not strictly additive.
- **R18 — route namespace collision:** `/connect/*` and `/community/*` are frozen
  but not yet created; premature routes could clash with `/app`, `/m`, `/b`.

### Requires approval before BC-0.5

1. Confirm the frozen layer/owner assignments in DOMAIN_BOUNDARY_MATRIX (esp.
   split domains) — one owner per domain.
2. Approve the coexistence (no-merge) networking strategy and adapter-only glue.
3. Approve `/connect/*` and `/community/*` as reserved namespaces (freeze, not build).
4. Confirm Community is scoped as a distinct product (not an Association variant)
   before any BC-0.5 identity-helper design.

**No code, schema, migration, route or RLS changes were made in BC-0.4.**

## BC-0.5 enterprise architecture freeze (frozen)

Documentation-only. Deliverables: ENTERPRISE_ARCHITECTURE_SPECIFICATION,
PLATFORM_ARCHITECTURE_FREEZE, PLATFORM_CAPABILITY_MATRIX, IMPLEMENTATION_ROADMAP,
IMPLEMENTATION_GATES, MIGRATION_GUIDELINES, BC_PHASE_ACCEPTANCE, BC_RISK_REGISTER,
ARCHITECTURE_DECISION_INDEX.

- **Architecture version:** Business Connect v1 Architecture — FROZEN.
- 5-layer hierarchy frozen: Platform Core → Shared Business Services → Product
  Domains → Product Surfaces → Future Products. Downward deps only.
- 10 ADRs, 5 scopes, 4 authorization models, 4 surfaces (+`/company` future),
  13 shared services, 11 phases (BC-1…BC-11 fixed order), 7 gates (A–G).
- Migration rules frozen: additive, backward-compatible, idempotent, rollback-safe;
  GRANT+RLS+POLICY+indexes+tests+audit mandatory; no renames, no downtime, no
  compat removal before cutover, no raw anon grants, no fake identity.
- Enterprise risk register consolidates R1–R18 + SEC-01…09 into E-\* IDs.

### Deferred items (post-v1)

- Wallet (Apple/Google), membership payment gateway, enterprise/vertical product
  surfaces, community schema detail (designed in BC-6/BC-8).

### Approval required before BC-1

1. Gate A sign-off on the frozen enterprise architecture.
2. Approve card-ownership backfill policy (unique valid mappings only) — E-MIG-2.
3. Confirm public-card RPC parity plan before any anon-policy removal — E-SEC-1.
4. Approve BC-1 (Global Identity) as the single starting phase; no parallel phases.

**No code, schema, migration, route, server function, UI or test changes were made in BC-0.5.**

## BC-1.2 update — Identity Bridge Contracts (2026-07-13)

- **E-MIG-2 (card-ownership backfill):** de-risked by the read-only
  `resolveBusinessCardOwnerContext()` bridge — derives owner only from a unique
  valid `members.user_id` mapping; null/ambiguous → `unresolved` (never guesses).
  Schema/RLS still unchanged; actual `owner_user_id` migration deferred to BC-2.
- **Active-association tenancy:** confirmed a trusted persistence mechanism
  already exists (`set_active_association` security-definer RPC +
  `memberships.is_default`). `setActiveAssociationContext` delegates to it — no
  new client-trusted tenancy state, no gap to document.
- **my-pass technical debt:** RESOLVED — raw `current_member_id` RPC call
  replaced with `resolveMemberIdOrNull` (identical behavior, no logic change).
- **Community:** contract types frozen (`CommunityIdentityContext` etc.);
  no schema, no fabricated data — deferred to BC-6.

## BC-2.0 update — Card Ownership Preflight (2026-07-13)

- **E-MIG-2 RESOLVED for current data:** read-only preflight classifies all rows;
  measured **totalCards=0, eligibleBackfillCount=0, blockingCount=0** →
  clean-slate **GO**. Backfill is a deterministic no-op on current data.
- **E-PUB-1:** public parity measured — no P0/P1 gap; public policies retained.
- **Storage:** compatible — media stored as URL text, no bucket ownership coupling.
- **No ownership cutover, no schema/RLS/UI/route change made in BC-2.0.**
- Next gate: **Gate C** before BC-2.1 applies the additive migration + backfill.

## BC-2.1B update — Ownership Backfill (2026-07-13)

- **Backfill deployed** as platform-admin-only SECURITY DEFINER functions with
  run/item trackers (platform-admin RLS). Deterministic, idempotent, rollback-safe.
- **Production:** 0 cards → no-op; eligible=updated=0, 0 exceptions.
- **No RLS/UI/route/public-card behavior change.** Owner-priority RLS deferred to BC-2.1C/D.
