# ADR-BC-008 — Resource Scope Contract (FROZEN)

Status: **Accepted / Frozen** (BC-0.4). Documentation-only.

## Context

ADR-BC-004 froze four authorization _models_ (personal/association/community/
public). BC-0.4 formalizes the orthogonal concept of **ResourceScope** — the
tag every resource carries that determines owner, resolver, visibility, and the
future RLS pattern. A resource may support multiple scopes over its lifetime
(e.g. a Business Card is `personal` and optionally `association`/`public`).

## Decision — five frozen scopes

```ts
type ResourceScope = "personal" | "community" | "association" | "platform" | "public";
```

### personal

- **Owner:** a single Platform User (`owner_user_id = auth.uid()`).
- **Identity/Resolver:** `requireSupabaseAuth` → `context.userId` (server-resolved).
- **Visibility:** owner only (unless a `public` projection is also declared).
- **Moderation:** platform-only (no association/community override).
- **Audit:** owner-scoped audit rows; actor recorded.
- **Public projection:** none by default; opt-in via a separate `public` scope.
- **Future RLS:** `owner_user_id = auth.uid()`, `TO authenticated`.
- **Examples:** `user_profiles`, global Business Cards, `saved_business_cards`,
  personal notes/analytics, personal Meetings.

### association

- **Owner:** an association; membership/role gated.
- **Identity/Resolver:** `current_member_id()` + `current_association_id()` +
  `is_member_of` / `has_assoc_role` / `is_assoc_manager` (SECURITY DEFINER).
- **Visibility:** members of the association; managers see more.
- **Moderation:** association managers within their association only.
- **Audit:** association audit tables (e.g. `business_card_audit`, role audit).
- **Public projection:** via safe RPC only (e.g. public association profile).
- **Future RLS:** `association_id` + membership/role guards, `TO authenticated`.
- **Examples:** members, fees, renewals, Membership Identity, campaigns,
  association Marketplace/Events.

### community (future)

- **Owner:** a community; server-resolved active membership + role.
- **Identity/Resolver:** `requireSupabaseAuth` + `community_id` + community-role
  query (future `requireCommunityIdentity`).
- **Visibility:** honors community visibility (public/private/secret); private &
  secret require active membership.
- **Moderation:** community owner/admin/moderator within that community only.
- **Audit:** community moderation/audit log.
- **Public projection:** public community profile via safe RPC.
- **Future RLS:** `community_id` + active membership/role, `TO authenticated`.
- **Examples:** community feed, rules, community Marketplace/Events/Documents.

### platform

- **Owner:** the platform; explicit platform permission.
- **Identity/Resolver:** `is_platform_admin()` / `user_roles` (role table only).
- **Visibility:** platform admins/moderators.
- **Moderation:** platform-level; overrides product lifecycle where authorized.
- **Audit:** platform audit (`role_audit_log`, `ai_request_audit`, etc.).
- **Public projection:** none.
- **Future RLS:** `is_platform_admin()`; least-privilege EXECUTE grants.
- **Examples:** feature flags, global config, platform moderation, provider settings.

### public

- **Owner:** derived from the underlying resource's owner; read-only surface.
- **Identity/Resolver:** anon or any authenticated user via **safe server
  function/RPC** — never raw table access.
- **Visibility:** only explicitly-published, visibility-filtered fields.
- **Moderation:** inherits from owner/association/community + platform override.
- **Audit:** access may be rate-limited/logged; no private audit exposed.
- **Public projection:** explicit column projection; no private/analytics/leads.
- **Future RLS:** no direct `TO anon` on raw tables (ADR-BC-005); RPC/server-fn
  projection with rate limiting and safe failure states.
- **Examples:** public Business Card, public community profile, membership
  verification, public association profile.

## Frozen rules

1. Every resource declares one or more supported scopes; each scope maps to the
   matching ADR-BC-004 model.
2. Scope-defining identity (`owner_user_id`, `association_id`, `community_id`,
   role) is **always server-resolved**; client input is untrusted (invariant 11).
3. `public` scope is a _projection_, never a raw grant.
4. A single lifecycle status must not conflate owner lifecycle with
   association/community moderation (ADR-BC-006 §1).
5. Cross-scope role bleed is prohibited (association role ≠ community role ≠
   platform role).

## Consequences

Scope mapping per domain is frozen in RESOURCE_SCOPE_MATRIX.md and ADR-BC-007 §6.
