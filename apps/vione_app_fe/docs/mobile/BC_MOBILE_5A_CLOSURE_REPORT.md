# BC-Mobile-5A — Closure Report

**Phase:** Me / My Digital Identity Foundation
**Result:** CLOSED — all acceptance gates PASS (see
`BC_MOBILE_5A_ME_IDENTITY_FOUNDATION.md` §9–12).

## Delivered

### Data (migration, previously applied)
- `public.business_identities` (canonical identity, one per user)
- `public.identity_field_visibility` (PRIVATE/SHARED per field, enum CHECK)
- `public.identity_share_links` (one active 64-hex token per identity)
- RLS owner-only on all three; grants `authenticated` + `service_role`;
  `updated_at` trigger.

### Domain modules (`src/lib/business-connect/mobile/`)
- `identity.types.ts` — owner DTO, recipient projection, neutral result,
  share-link DTO (no internal ids).
- `identity.projection.ts` — field allowlist, defaults, `resolveIdentityVisibility`,
  `toPublicIdentityCard` (single privacy gate), `identityCompleteness`.
- `identity.validation.ts` — strict Zod schemas, normalizers (text/email/
  phone/URL), 64-hex token schema; invalid values REJECTED, never nulled.
- `identity.service.ts` — owner CRUD, visibility batch, 256-bit token
  generation/rotation, privileged public resolver (no directory enumeration).
- `identity.functions.ts` — thin RPC wrappers; owner fns behind
  `requireSupabaseAuth`; public resolver rate-limited per client IP.
- `identity.vcard.ts` — vCard 3.0 from the recipient projection only.
- `identity.telemetry.ts` — allowlisted, PII-free metrics.

### UI (`src/components/business-connect/mobile/me/`)
- `MeSheet` — shared sheet chrome (dialog semantics, busy-inert close).
- `IdentityHero` — avatar/initials, name/headline/title, completeness meter.
- `DigitalBusinessCard` — the ONE card renderer (owner preview = recipient
  view), Save Contact with Web Share → download fallback.
- `IdentityEditSheet`, `IdentityPrivacySheet` (switch semantics, atomic
  batch), `IdentityQrSheet` (current-token QR, copy/share, confirmed reset).
- `RecipientCardView` — public card or ONE neutral unavailable state.

### Routes
- `/connect-app/me` — private identity command center (5 sections).
- `/c/$token` — anonymous recipient route; SSR loader; `noindex, nofollow`;
  static metadata.

### Tests
- `src/__tests__/business-connect-mobile-me.bcm5a.test.tsx` — 15/15 green.
- Full repo suite green at closure (see PR gates below).

## Decisions locked
1. **No merge with `member_business_cards`** — that model lacks per-field
   visibility and rotatable opaque tokens; 5A stands up its own domain.
2. **Contact coordinates default PRIVATE** — disclosure is opt-in.
3. **One active link per identity**; rotation revokes the old token instantly.
4. **No `SECURITY DEFINER` RPC for the public path** — privileged server
   function instead (security-guard.sql convention).
5. **Static metadata on `/c/:token`** — no name leakage via `<title>`.

## Known limits (accepted)
- Rate limiting is best-effort per edge instance (same convention as the
  public .vcf endpoint).
- `last_used_at` is recorded but not yet surfaced in the UI.
