# ADR-BC-010 — Shared Business Services (FROZEN)

Status: **Accepted / Frozen** (BC-0.4). Documentation-only. Full per-domain
attributes live in SHARED_SERVICE_CATALOG.md; this ADR freezes the principles.

## Decision — Shared Business Services layer

Reusable business domains sit **above** Platform Core and **below** Product
Surfaces. Each is scope-agnostic (parameterized by ResourceScope, ADR-BC-008),
consumes only Platform Core, and is consumable by any product.

### Frozen service list

Business Card, Networking, Companies, Meetings, Marketplace Foundation, Events
Foundation, Messaging, Documents, Search, AI, Media, Analytics, Notification.

### Contract every service must declare (see catalog)

Purpose · Owner · Inputs · Outputs · Dependencies · Identity Context · Scope(s) ·
Reusable by (Association Hub / Member PWA / Business Connect / Community /
Enterprise / Future).

## Platform Core (frozen, zero business logic)

Authentication · Identity · Authorization · Audit · Notification infrastructure ·
Storage · Search infrastructure · AI Gateway · Realtime · Observability ·
Configuration · Feature Flags · Billing foundation · Analytics foundation.

Platform Core **must not** contain: members, fees, renewals, business cards,
marketplace listings, community feeds, or any product concept.

## AI: one gateway, three personas (frozen)

- **Shared:** AI Gateway, memory, knowledge, workflow, tools, provider (already
  live: `google/gemini-3-flash-preview` via Lovable AI Gateway; `app_settings.
ai_provider = {"mode":"real"}`; audited in `ai_request_audit`).
- **Different per persona:** context, capability, permission.
  - **Association AI** — association data, member support, admin tasks.
  - **Business AI** — global profile/cards/marketplace/networking assist.
  - **Community AI** — community feed/rules/moderation assist.

## Networking: coexistence (frozen, no merge)

- Legacy association networking → **Association product**.
- Global user-to-user networking → **Shared Service**.
- Community networking → **Business Connect / Community**.
- Future enterprise → **Shared Service**.
- A read-only adapter unifies display; underlying stores are not merged in BC-1.

## Marketplace: one engine, many scopes (frozen)

Marketplace Foundation is a Shared Service. Association / Business / Community
marketplaces are the same engine under different ResourceScopes.

## Dependency rules (frozen, same as ADR-BC-007 §13)

Core → (nothing). Shared → Core only. Products → Shared + Core. No product or
association imports into Core or Shared. No circular dependencies.

## Consequences

New products get business capability by consuming existing services, not by
re-implementing. BC-1 adapters (identity, networking, public projection) are the
only glue permitted.
