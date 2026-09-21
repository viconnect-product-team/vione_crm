# Enterprise Architecture Specification (FROZEN — BC-0.5)

**Architecture Version:** Business Connect v1 Architecture
**Status:** Frozen. Documentation-only — no code, schema, migration, RLS, routes,
server functions, UI, or tests. This is the final architecture step before BC-1.

This document consolidates every BC-0 audit and decision into one authoritative
specification. Where detail lives elsewhere, this doc references the canonical
file rather than restating it.

## 1. Canonical inputs consolidated

- Inventory: `BC0_PLATFORM_INVENTORY.md`
- Dependency: `BC0_DEPENDENCY_MATRIX.md`, `BC0_CALL_GRAPHS.md`
- Identity: `ADR-BC-001/002/003`, `GLOBAL_IDENTITY_CONTRACT.md`, `IDENTITY_HELPER_MATRIX.md`
- Authorization/security: `ADR-BC-004/005/006`, `BC0_SECURITY_MATRIX.md`,
  `BC0_SECURITY_TEST_PLAN.md`, `BC0_SECURITY_BACKLOG.md`, `BC0_PUBLIC_ACCESS_HARDENING_PLAN.md`
- Domains/scopes/surfaces: `ADR-BC-007/008/009/010`, `DOMAIN_BOUNDARY_MATRIX.md`,
  `RESOURCE_SCOPE_MATRIX.md`, `PRODUCT_BOUNDARY_GUIDE.md`, `PLATFORM_LAYER_DIAGRAM.md`,
  `SHARED_SERVICE_CATALOG.md`
- Risk: `BC0_BLOCKERS_AND_RISKS.md`

## 2. Frozen enterprise hierarchy

```text
Platform Core            (zero business logic)
      ↓
Shared Business Services (reusable, scope-agnostic)
      ↓
Product Domains          (owned business logic: Members/Fees, Community, etc.)
      ↓
Product Surfaces         (Association Admin /app, Member PWA /m,
                          Business Connect /connect, Community /community)
      ↓
Future Products          (Enterprise/Healthcare/Education/CRM/HRM/ERP)
```

- **Ownership:** every domain has exactly one owner layer (DOMAIN_BOUNDARY_MATRIX).
- **Dependency direction:** strictly downward; Core imports nothing above it;
  Shared imports only Core; Products import Shared + Core; no circular deps.
- **Scope:** five ResourceScopes — personal/community/association/platform/public
  (ADR-BC-008); `public` is always an RPC projection, never a raw anon grant.
- **Identity:** Platform User (`auth.uid()`) ≠ Association Member (`members`);
  login does not require a member row; identity is server-resolved (ADR-BC-001/002,
  GLOBAL_IDENTITY_CONTRACT invariants).

## 3. Layer definitions (frozen)

- **Platform Core:** Authentication, Identity, Authorization, Audit, Notification
  infra, Storage, Search infra, AI Gateway, Realtime, Observability, Config,
  Feature Flags, Billing foundation, Analytics foundation. No business concepts.
- **Shared Business Services:** Business Card, Networking (global), Companies,
  Meetings, Marketplace Foundation, Events Foundation, Messaging, Documents,
  Search, AI personas, Media, Analytics, Notification templates
  (SHARED_SERVICE_CATALOG).
- **Product Domains (owned logic):** Members, Fees/Renewals, Membership Identity,
  Campaigns (Association); Community membership/roles/rules/feed/moderation
  (Community). These are not reusable engines — they compose Shared Services.
- **Product Surfaces:** ADR-BC-009 — `/app`, `/m`, `/connect`, `/community`,
  `/company` (future). Reserved namespaces; only `/app`, `/m`, `/b` exist today.

## 4. Cross-cutting frozen contracts

- **Business Card ∈ Shared Services**, ≠ Membership Identity (ADR-BC-007 §8).
- **Networking coexistence:** legacy (Association) + global (Shared) + community;
  no merge — adapter only (ADR-BC-006/010).
- **Marketplace:** one Foundation engine, many scopes.
- **AI:** one Gateway (live: `google/gemini-3-flash-preview`, `app_settings.
ai_provider={"mode":"real"}`, audited via `ai_request_audit`), three personas.
- **Public access:** all public reads via safe server-fn/RPC projections; remove
  raw anon table grants (ADR-BC-005, BC0_PUBLIC_ACCESS_HARDENING_PLAN).

## 5. Companion documents

Capability grid → `PLATFORM_CAPABILITY_MATRIX.md`. Phased plan →
`IMPLEMENTATION_ROADMAP.md`. Gates → `IMPLEMENTATION_GATES.md`. Migration rules →
`MIGRATION_GUIDELINES.md`. Per-phase acceptance → `BC_PHASE_ACCEPTANCE.md`.
Risks → `BC_RISK_REGISTER.md`. Decisions → `ARCHITECTURE_DECISION_INDEX.md`.
Freeze statement → `PLATFORM_ARCHITECTURE_FREEZE.md`.

## 6. Freeze

Everything after BC-0.5 must follow this specification. Deviations require a new
ADR and re-approval at Gate A.
