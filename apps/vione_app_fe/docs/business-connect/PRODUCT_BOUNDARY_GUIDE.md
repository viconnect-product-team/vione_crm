# Product Boundary Guide (FROZEN — BC-0.4)

How to decide where new work lives, and how products relate to shared domains.
Documentation-only. Companion to ADR-BC-007…010.

## Placement decision (ask in order)

1. **Is it cross-cutting infrastructure** (auth, storage, audit, config, gateway,
   realtime, flags, billing/analytics foundation)? → **Platform Core**. It must
   have zero business meaning.
2. **Is it a reusable business capability** usable by more than one product
   (cards, networking, marketplace, meetings, events, documents, AI, messaging)?
   → **Shared Business Service**, parameterized by ResourceScope.
3. **Is it composition / navigation / product-specific policy** for one audience?
   → **Product Surface** (Association Admin / Member PWA / Business Connect /
   Community). It owns no reusable domain logic.

If a feature seems to belong in two layers, split it: infra down, composition up
(see split domains: Networking, Notifications, AI, Search).

## Product ↔ domain consumption

| Domain              | Assoc Admin      | Member PWA           | Business Connect      | Community             |
| ------------------- | ---------------- | -------------------- | --------------------- | --------------------- |
| Business Card       | moderate (assoc) | own (personal)       | own (personal/global) | directory (community) |
| Membership Identity | manage           | own                  | —                     | —                     |
| Networking          | legacy admin     | legacy + own global  | global + community    | community             |
| Marketplace         | assoc scope      | assoc scope (browse) | business scope        | community scope       |
| Events              | manage (assoc)   | attend/check-in      | browse                | community scope       |
| Meetings            | assoc            | personal/assoc       | personal/community    | community             |
| Documents           | assoc            | assoc-shared         | personal              | community             |
| AI                  | assoc persona    | assoc persona        | business persona      | community persona     |
| Notifications       | assoc            | personal/assoc       | personal              | community             |

## Business Card boundary (frozen — §8 of ADR-BC-007)

Business Card is a **Shared Business Service**. Association _consumes_ it (moderate
only), Business Connect _consumes_ it (personal/global ownership), Enterprise and
future products _consume_ it. Business Card **≠ Membership Identity**: the card is
user-owned; the membership pass is member/association-owned. Never merge them.

## Networking boundary (frozen — §9)

Legacy association networking stays in the Association product. Global networking
is a Shared Service. Community networking is consumed by Business Connect/Community.
**No merge in BC-1** — a read-only adapter unifies presentation.

## Marketplace boundary (frozen — §10)

One Marketplace Foundation engine; Association/Business/Community marketplaces are
scopes of it, not separate implementations.

## Community domain (frozen — §11)

Community is **not** Association. A Community owns: members, roles, rules, feed,
events, marketplace, documents, moderation, affiliate foundation, business-card
directory, AI assistant — all as scoped consumers of Shared Services. No schema
defined here; boundaries only. No fake `members` rows (invariant 4).

## Future products (frozen — §15)

Enterprise OS, Healthcare OS, Education OS, Real Estate OS, Affiliate OS, CRM, HRM,
ERP all consume **Platform Core + Shared Services** with their own Product Surfaces
and route namespaces. None re-implement shared domains; none inject business logic
into Platform Core.

## Hard rules recap

- Platform Core must not know member lifecycle.
- Networking must not know fees.
- Business Card must not know membership renewal.
- Community must not become Association.
- Products compose services; they don't own reusable domain logic.
