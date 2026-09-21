# BC-2.7 — Organization & Company Platform

Status: **Shipped**. Architecture: Business Connect v1 (Frozen).
Prerequisites: BC-2.4 (Relationship), BC-2.5 (Intelligence), BC-2.6 (Interaction).

## Objective

Introduce **Company** as a first-class Platform entity. People belong to
companies; a Business Profile may optionally represent a company; relationships
and interactions may optionally reference a company. This prepares future B2B
networking **without** implementing CRM, Marketplace, Community, Messaging, or
Networking.

## Non-negotiable boundaries (honored)

- Companies are **not** merged into Associations and do **not** reuse the
  Association schema or Marketplace company fields.
- The Business Profile is **not** duplicated; `BusinessCardService` and Identity
  are **not** rewritten.
- No CRM / Marketplace / Community / Messaging. No networking implementation yet.

## 1. Organization Model

### `companies`

`id, owner_user_id, name, slug, logo_url, cover_url, industry, size, country,
city, website, email, phone, description, verified, visibility, status,
created_at, updated_at`.

- `visibility`: `public | members_only | private`.
- `status`: `draft | active | suspended | archived`.
- Public read policy (anon) restricts to `visibility = 'public' AND status =
'active'`; a hidden row therefore resolves to `not_found`.
- Owner-scoped and member-scoped SELECT policies keep drafts/private rows
  visible to their owner and members.

### `company_members`

`id, company_id, user_id, email, role, status, invited_by, created_at,
updated_at`. Roles: `owner | admin | manager | member | viewer`. Status:
`active | invited` (invitation-ready; no email sending in BC-2.7).

Security-definer helpers: `owns_company`, `is_company_member`,
`is_company_manager`.

## 2. Optional references (additive)

- `saved_business_cards.company_id` — a relationship may optionally point at a
  first-class company (distinct from the free-text `company` field).
- `business_interactions.company_id` — an interaction may optionally reference a
  company.

Both are nullable and default null; existing rows and flows are unaffected.

## 3. Domain layering

`src/lib/company/`

- `company.types.ts` — DTOs, enums, input types, `PublicCompany`,
  `PublicCompanyResult`.
- `company.mappers.ts` — pure row→DTO, `slugifyCompany`, public projection
  (drops `email`, `phone`, `owner_user_id`).
- `company.repository.ts` — data access only.
- `company.service.ts` — invariants: owner = `auth.uid()`, valid
  visibility/status/role, deterministic unique slug, owner-membership on create.
- `company.functions.ts` — `createServerFn` adapters (`requireSupabaseAuth`);
  `getPublicCompanyFn` uses the publishable/anon client for SSR.
- `company.sdk.ts` — client-facing `CompanySDK`.

## 4. SDK surface

`CompanySDK`: `createCompany`, `updateCompany`, `deleteCompany`, `getCompany`,
`listCompanies`, `listVisibleCompanies`, `getPublicCompany`, `inviteMember`,
`listMembers`, `removeMember`.

`BusinessCardSDK.companies` re-exposes `createCompany / updateCompany /
listCompanies / inviteMember` as a thin passthrough so surfaces already holding
`BusinessCardSDK` reach companies without a second import.

## 5. Public profile

`/company/{slug}` (`src/routes/company.$slug.tsx`) renders SSR-first using the
same head/OG conventions as the Business Profile: title, description,
canonical, `og:*`, `twitter:card`, and `og:image` derived from cover/logo.
Non-public slugs return `noindex` + a not-found view.

## 6. Future B2B graph (prepared, not built)

The `company_id` links on relationships and interactions, plus the membership
role model, are the seams for future CRM, Marketplace (company-scoped),
Community, Enterprise, Meetings, Affiliate, and AI features. None are
implemented here.

## 7. Tests

`src/__tests__/company.bc27.test.ts` — slug determinism, row mapping, public
projection privacy (no email/phone/owner), create (owner + unique slug + slug
suffixing + empty-name rejection), `getPublic` public/not_found, and invite
membership rules. All green; typecheck clean. Interaction/relationship
regression suites updated for the additive `companyId` field.

## Acceptance

Company is a first-class Platform entity with owner-aware RLS, a public profile,
an SDK, and optional relationship/interaction links. No CRM, Marketplace,
Community, Messaging, or networking implementation. Typecheck clean, tests
green. **STOP.**
