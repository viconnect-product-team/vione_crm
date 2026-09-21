# ADR-BC-004 — Ownership & RLS Authorization Models (FROZEN)

Status: **Accepted / Frozen** (BC-0.3). Documentation-only. No source, schema,
migration, RLS, grant, RPC, or route change was made. Grounded in BC-0.1/BC-0.2
findings and RLS/grant/storage facts re-verified this turn.

## Context

BC-0.2 froze the identity model (Platform User ≠ Association Member; global
resources key on `owner_user_id`). Before any BC schema work, the authorization
patterns must be frozen so every future table maps to exactly one model.

## Decision — four frozen authorization models

### A. Personal ownership (`owner_user_id = auth.uid()`)

- **Use for:** `user_profiles` (future), global business cards, `saved_business_cards`
  (future), personal notes, personal analytics, user-owned leads where applicable.
- **Rule:** `owner_user_id` is **always server-resolved** from `requireSupabaseAuth`
  context (`context.userId`) — never accepted from client input (invariant 11).
  Ownership predicate is `owner_user_id = auth.uid()` in RLS.
- **Existing precedent verified this turn:** `card_settings` uses this exact model —
  `card_settings_select/insert/update/delete_own` all gate on `auth.uid() = user_id`,
  `TO authenticated`, no anon. `profiles` (`id = auth.uid()`) and `user_roles`
  follow the same pattern. These are the template for BC personal tables.

### B. Association scope (`association_id` + membership/role guards)

- **Use for:** `members`, fees, renewals, `member_identity_passes`,
  `member_identity_events`, association administration, existing association
  Marketplace (`products`), official association events/documents.
- **Rule:** predicate combines `association_id` with `is_member_of()`,
  `has_assoc_role()`, or `is_assoc_manager()` (all SECURITY DEFINER, verified in
  db-functions). Ownership stays member-scoped via `current_member_id()`.
- **Frozen:** BC never synthesizes a fake `members` row (invariant 4); association
  scope is authoritative only inside association domains.

### C. Community scope (`community_id` + active membership/role) — future

- **Use for:** community membership, private community feed, rules, reports,
  moderation, community opportunities/events/documents.
- **Rule:** `community_id` + **server-resolved** active community membership and
  role. Role never trusted from client. Detailed in ADR-BC-006 §Community.

### D. Public-safe projection (RPC / server function only)

- **Use for:** public Business Card, public Community profile, membership
  verification, public association profile.
- **Rule:** no general raw-table exposure; access via explicit server
  function/RPC with explicit column projection, server-side visibility filtering,
  rate limiting where appropriate, and safe failure states. See ADR-BC-005.

## Model assignment (frozen mapping)

| Table / resource                               | Current scope (verified)             | Frozen future model                         |
| ---------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| `profiles`                                     | `auth.uid()` owned                   | A (kept; NOT extended for BC)               |
| `card_settings`                                | `auth.uid()` owned                   | A                                           |
| `user_roles`                                   | user/platform scoped                 | A (roles stay here; never on profile)       |
| `user_profiles` (future)                       | —                                    | A                                           |
| global business cards (future `owner_user_id`) | —                                    | A + D for public reads                      |
| `saved_business_cards` (future)                | —                                    | A (private)                                 |
| `user_connections` (future)                    | —                                    | A (dual-participant, see ADR-BC-006)        |
| `members`                                      | assoc/member scoped                  | B                                           |
| fees / renewals / invoices                     | assoc scoped                         | B                                           |
| `member_identity_passes` / `_events`           | member scoped                        | B + D (verification)                        |
| `products` (Marketplace)                       | member scoped                        | B (global deferred)                         |
| `member_business_cards` (legacy)               | member scoped + **anon public read** | B/A hybrid during transition → D for public |
| `business_card_needs/services/skills`          | owner/manager + **anon public read** | child of card; D for public                 |
| `business_card_leads/interactions/audit`       | owner/manager, no anon               | A/B private (never public)                  |
| community\_\* (future)                         | —                                    | C + D for public profile                    |

## Frozen rules

1. Every new BC table maps to exactly one of A/B/C/D; hybrids justified in-ADR.
2. `owner_user_id`, `member_id`, `association_id`, `community_id`, role — all
   server-resolved; client-supplied values are ignored (invariant 11).
3. Personal-ownership tables are `TO authenticated`, gated on `auth.uid()`, never
   `TO anon`.
4. Public reads never hit raw personal/association tables — only model D.
5. New public-schema tables always ship GRANTs in the same migration (platform rule).

## Consequences

- BC-1 schema work has an unambiguous pattern per table.
- Legacy `member_business_cards` needs staged migration (A/B hybrid → D public),
  tracked in ADR-BC-005 and BC0_SECURITY_BACKLOG.

## Security / migration / operational impact

No changes now. Freezes intent so later migrations are additive and reviewable.
