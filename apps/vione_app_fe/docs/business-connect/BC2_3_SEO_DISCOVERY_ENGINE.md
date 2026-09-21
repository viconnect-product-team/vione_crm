# BC-2.3 — Business Profile SEO & Discovery Engine

**Architecture Version:** Business Connect v1 (Frozen)
**Status:** Shipped
**Scope:** Public Profile + SEO only. No Networking, Saved Cards, Marketplace globalization, or Community.

## Objective

Transform every public Business Card into a fully optimized **Business Profile**
discoverable by search engines, social platforms, and AI systems — without any
ownership, authorization, or UI-redesign changes.

## What shipped

### 1. Pure SEO engine — `src/lib/business-card/seo-engine.ts`

Behavior-free, deterministic, client-safe (no network / supabase / window). Consumes
only the already-projected **public** DTO, so it can never leak private data.

- **Structured data (JSON-LD `@graph`)**: auto-selected primary entity
  (`Person` / `Organization` / `LocalBusiness` / `ProfessionalService`) plus
  `ProfilePage`, `BreadcrumbList`, and `WebSite`. Wires `contactPoint`,
  `image` (`ImageObject`), `makesOffer` (`Offer`/`Service`), `sameAs`,
  `address`, `worksFor`, `datePublished`/`dateModified`.
- **Metadata**: title (≤70), description (≤160), deduped keywords.
- **Canonical + robots**: self-referential `/b/{slug}` canonical; indexable
  profiles get `index, follow, max-image-preview:large`; everything else
  (drafts, members-only, private, preview, not-found) gets `noindex, nofollow`.
- **OpenGraph** (`og:type=profile`) for Facebook, LinkedIn, Zalo, Telegram,
  WhatsApp, Messenger, Discord, Slack; **Twitter Card** (large image → summary
  fallback when no image).
- **hreflang** alternates (`vi`, `en`, `x-default`).
- **AI discovery** signals (`ai-content-type=business-profile`, `ai-crawlable`).
- **Apple** smart app banner (only when an app id is configured) + web-app tags.
- **Sitemap** helpers: `buildProfileSitemapEntry`, `renderSitemapXml` (XML-escaped).

### 2. Shared-service reads (no direct table access outside the service)

- `BusinessCardRepository.listPublishedPublicSlugs` — published + fully-public
  slugs and `updatedAt` only (no PII), `limit(50000)`.
- `BusinessCardService.listPublicProfileSlugs` — via the anon publishable client.
- `listPublicProfileSlugsFn` — thin server-function adapter.

### 3. Public route SSR — `src/routes/b.$slug.tsx`

- `ssr: true` so crawlers receive a fully-rendered `<head>`.
- Loader fetches the public projection (non-auth) and never touches the
  auth-protected preview during SSR/prerender.
- `head()` delegates to `buildProfileHead` for indexable public profiles;
  non-public states emit `noindex`.
- `PublicScreen` is **seeded** from the loader result so the SSR body contains
  the real profile HTML (not a spinner); it still hydrates client-side.

### 4. Discovery surfaces

- `src/routes/sitemap[.]xml.tsx` — server route emitting static routes + every
  public profile, `Cache-Control: max-age=3600`.
- `public/robots.txt` — `Allow: /` for standard crawlers **and** major AI
  crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot,
  Google-Extended, Applebot-Extended); advertises the sitemap.

## Invariants preserved

- No ownership/authorization changes.
- No UI redesign — only `<head>` + SSR seeding.
- Private data never emitted (public DTO only; non-public states are `noindex`).
- `BusinessCardService`/`BusinessCardRepository` remain the only readers of
  `member_business_cards`.

## Verification

- `src/__tests__/business-card-seo.bc23.test.ts` — 20 deterministic cases
  (URL/text helpers, schema selection, JSON-LD graph, head assembly incl.
  noindex/no-JSON-LD leakage, sitemap XML). All green.
- Typecheck clean. Existing ownership/scoping regression tests unaffected.
