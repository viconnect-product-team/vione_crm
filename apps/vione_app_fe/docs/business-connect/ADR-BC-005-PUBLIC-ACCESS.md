# ADR-BC-005 — Public Access & Anon Exposure (FROZEN)

Status: **Accepted / Frozen** (BC-0.3). Documentation-only. Grounded in RLS facts
re-verified this turn.

## Context — current anon exposure (verified this turn)

`pg_policies` inspection confirms **direct anon SELECT** on Business Card data:

| Table                        | Anon SELECT policy (verified)                                    | Predicate                                     |
| ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| `member_business_cards`      | `Public reads published public cards` (`{anon,authenticated}`)   | `status='published' AND public_mode='public'` |
| `business_card_needs`        | `Public reads needs of public cards` (`{anon,authenticated}`)    | `is_public_business_card(card_id)`            |
| `business_card_services`     | `Public reads services of public cards` (`{anon,authenticated}`) | `is_public_business_card(card_id)`            |
| `business_card_skills`       | `Public reads skills of public cards` (`{anon,authenticated}`)   | `is_public_business_card(card_id)`            |
| `business_card_leads`        | **no anon** — owner/requester/manager only                       | —                                             |
| `business_card_interactions` | **no anon** — owner/manager only                                 | —                                             |
| `business_card_audit`        | **no anon** — owner/manager only                                 | —                                             |

`is_public_business_card()` (SECURITY DEFINER) checks
`status='published' AND public_mode='public'`.

**Finding P0-A:** anon reads the **raw** `member_business_cards` row (36 columns),
including any private contact / analytics-adjacent columns present on the row, not
a curated projection. Public data currently leaks through the table policy, not a
safe RPC. The server path `getPublicBusinessCardFn` / `b.$slug.tsx` exists but is
**not the only** public path — the raw anon grant coexists with it.

Storage (verified): both buckets private. `product-media` read is
`TO authenticated` via membership; `association-logos` read is member-scoped.
**No anon storage SELECT policy exists** — good baseline.

## Decision — frozen target public-access policy

All public Business Card (and future public Community/profile) access must
ultimately flow through a safe server function / RPC (e.g. `getPublicBusinessCardFn`):

- only `published` **and** publicly-accessible cards
- `visibility_settings` applied **server-side**
- explicit safe column projection — no raw private columns
- no owner-only analytics, no private contact channels
- no leads, audit rows, or raw interactions
- no direct public mutation (public writes only via validated RPC, e.g. lead capture)
- rate limiting where appropriate (precedent: `check_and_increment_sync_rate`)
- safe failure states (not-found / hidden indistinguishable where needed)

## Staged hardening plan (documented only; NOT executed in BC-0.3)

1. **Verify function completeness** — confirm `getPublicBusinessCardFn` returns
   every field the public UI needs (card + needs/services/skills projection).
2. **Output parity** — diff the safe-function output against current raw anon
   SELECT to ensure no public UI regression before removing table grants.
3. **Remove direct anon grants/policies** — drop the four anon SELECT policies
   above; route all public reads through the server function (server publishable
   client or a `TO anon`-safe RPC with fixed projection).
4. **Regression tests** — add anon/public e2e tests asserting: private columns
   unreachable, hidden/private/draft cards 404, child tables not directly anon-readable
   (extend `rls-anon-exposure.e2e.test.ts`).
5. **Monitor rollout** — watch for public-card breakage post-cutover.

## Alternatives considered

- **Keep raw anon SELECT with tightened column-level grants** — rejected: Postgres
  column privileges don't apply `visibility_settings` per-card; still leaks
  owner-controlled private fields.
- **Views with `security_invoker`** — viable middle step but still couples public
  contract to table shape; RPC/server-fn chosen for explicit projection + rate limit.

## Consequences / risk

Cutover (step 3) is the only breaking change and is deferred with a parity gate
(step 2). Until then anon exposure remains a tracked P0 finding (BC0_SECURITY_BACKLOG).

## Security / migration / operational impact

No change now. Freezes that raw-table anon exposure is a defect to be removed, not
a supported pattern.
