# ADR-BC-002 — Global Identity is Additive

Status: **Accepted** (BC-0.2). Documentation-only.

## Context

BC-0.1 shows `profiles` (`id = auth.uid()`) is platform-ready but minimal, and
association attributes live on `members` (member code, level, fee status,
renewal). Business Connect needs a global professional profile and a global
identity context usable even with no association membership.

## Decision

Introduce (in later phases) an additive **Global User Profile**
(`user_profiles`, keyed by `owner_user_id = auth.users.id`) and a
**GlobalIdentityContext** assembled server-side from `requireSupabaseAuth` plus
an optional list of association memberships. Global profile holds only
platform-level data (name, avatar, title, company display, industry, region,
bio, locale, onboarding). It must not hold association lifecycle data.

## Alternatives considered

1. **Extend `profiles` with professional fields** — viable but reserved;
   `user_profiles` gives a clean BC surface and avoids coupling auth-profile
   semantics. Either can satisfy the contract; `user_profiles` chosen for clarity.
2. **Derive global profile from the linked `members` row** — rejected: undefined
   for BC users with no member; leaks association data into the global scope.
3. **Client-assembled identity context** — rejected: violates invariant 11
   (client input untrusted); context must be server-resolved.

## Consequences

- `GlobalIdentityContext.associationMemberships` may be `[]` and remain valid.
- New helpers (`buildGlobalIdentityContext`, `resolveUserProfile`, etc.) are
  additive; existing helpers untouched.

## Migration impact

Future additive table + backfill of `onboarding`/profile defaults; no changes to
`members`/`profiles` ownership.

## Security impact

Profile is `owner_user_id`-scoped; no membership/role data stored on it (roles
remain in `user_roles`). Prevents privilege escalation via profile fields.

## Operational impact

Enables BC onboarding independent of association provisioning.
