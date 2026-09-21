# ADR-BC-007 — Domain Boundaries (FROZEN)

Status: **Accepted / Frozen** (BC-0.4). Documentation-only. No code, schema,
migration, RLS, grant, route, or refactor. Builds on BC-0.1…BC-0.3.

## Context

BC-0.1…BC-0.3 froze identity (Platform User ≠ Association Member), the four
authorization models (ADR-BC-004), public access (ADR-BC-005), and moderation
boundaries (ADR-BC-006). What remains unfrozen is _which layer owns which
domain_ and _who may consume it_. This ADR freezes those boundaries so BC-1+
work never re-couples business logic into Platform Core or into a single product.

## Decision — three layers, strict downward dependency

```
Platform Core   (no business logic)
      ↓  consumed by
Shared Business Services   (reusable business domains)
      ↓  consumed by
Product Surfaces   (Association Admin, Member PWA, Business Connect, Community)
```

- **Platform Core** owns only cross-cutting infrastructure (see ADR-BC-010 /
  PLATFORM_LAYER_DIAGRAM). It must contain **zero business-specific logic** and
  must never know member lifecycle, fees, or association concepts.
- **Shared Business Services** own reusable business domains (Business Card,
  Networking, Marketplace, Companies, Meetings, Events, Messaging, Documents,
  AI, Media, Analytics, Notification). Each is scope-agnostic and consumes only
  Platform Core.
- **Product Surfaces** compose Shared Services under a specific identity context
  and route namespace. They own no reusable domain logic — only composition,
  navigation, and surface-specific policy.

## Frozen domain ownership (summary; full grid in DOMAIN_BOUNDARY_MATRIX.md)

- **Platform Core:** Authentication, Identity, Authorization, Audit, Storage,
  Search infra, AI Gateway, Realtime, Notifications infra, Config, Feature Flags,
  Billing foundation, Analytics foundation, Observability.
- **Shared Business Service:** Business Card, Networking (global), Companies,
  Meetings, Marketplace Foundation, Events Foundation, Messaging, Documents,
  Search (business), AI personas, Media, Analytics (business), Notification
  templates.
- **Association product:** members, fees, renewals, Membership Identity, campaigns,
  association admin, legacy association Networking, association Marketplace/Events
  (as _scoped consumers_ of the shared engines).
- **Business Connect product:** global profile surface, global Business Card
  surface, global Networking surface, business Marketplace surface, Business AI.
- **Community product (future):** community membership, feed, rules, moderation,
  community Marketplace/Events/Documents (scoped consumers), Community AI.

## Key boundary freezes

1. **Business Card ∈ Shared Business Services** — not Association, not Business
   Connect. All products _consume_ it (ADR-BC-007 §8, PRODUCT_BOUNDARY_GUIDE).
2. **Business Card ≠ Membership Identity** — identity pass stays association +
   member scoped (invariant 9, BC-0.2).
3. **Networking splits by scope** — legacy association `connections`/`net_*` stay
   in the Association product; global `user_connections` is a Shared Service;
   Community networking is consumed by Business Connect/Community. No merge; a
   read-only adapter unifies display (ADR-BC-006 §3).
4. **Marketplace Foundation ∈ Shared Business Services** — one engine, multiple
   scopes (association today; business/community later).
5. **Community ≠ Association** — separate roles, membership, moderation; no fake
   `members` rows (invariant 4).
6. **One AI Gateway, three personas** — shared gateway/memory/knowledge/workflow/
   tools/provider; different context/capability/permission (§12, ADR-BC-010).

## Dependency direction rules (frozen)

- Platform Core **must never** import Association (or any product).
- Shared Services **must never** import Association UI or product-specific code.
- Association / Business Connect / Community **may** consume Shared Services.
- Shared Services consume **only** Platform Core.
- **No circular dependencies**; dependencies point strictly downward.

## Architecture Must / Must-Not (examples)

- Platform Core **must not** know member lifecycle.
- Networking **must not** know fees.
- Business Card **must not** know membership renewal.
- Community **must not** become Association.
- A product surface **must not** own reusable domain logic — it composes services.

## Consequences

- BC-1 features are placed by asking "which layer owns this?" before coding.
- Future products (Enterprise/Healthcare/Education/CRM/HRM/ERP) reuse Platform
  Core + Shared Services with new surfaces (§15, PRODUCT_BOUNDARY_GUIDE).

## Security / migration / operational impact

No change now. Prevents re-coupling that would break tenant isolation and the
frozen authorization models.
