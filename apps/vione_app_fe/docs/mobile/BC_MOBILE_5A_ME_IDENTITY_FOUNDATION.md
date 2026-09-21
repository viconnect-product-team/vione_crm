# BC-Mobile-5A — Me / My Digital Identity Foundation (Acceptance Gate)

Status: **CLOSED** · Scope: mobile-first PWA, `/connect-app/me` + `/c/:token`

## 1. What this phase is

A **privacy-controlled professional identity primitive**: the canonical digital
self of an authenticated Business Connect user. It is the trusted source for
everything later phases build on (share links, QR exchange, digital card,
recipient view, Save Contact).

## 2. Domain boundary (hard rule)

A **Business Identity** is NOT:

- a **guest contact** (`guest_contacts`),
- a **scanned card** (Card Scan / OCR sessions, BC-Mobile-4A/4B),
- a **connection** (Global Network),
- a **member/association business card** (`member_business_cards` — that model
  is member-scoped, slug-addressed, and has no per-field visibility or
  rotatable opaque tokens; it stays untouched).

**No silent merge** with any of those domains occurs anywhere in 5A — not in
the schema (separate tables, no FKs into them), not in the services, not in
the UI. Import/scan suggestions are an explicit later-phase feature.

## 3. Canonical model

Tables (all `public`, RLS enabled, owner-only policies, grants to
`authenticated` + `service_role`):

- `business_identities` — one canonical identity per user (`owner_user_id`
  unique). Fields: display name, headline, job title, company, bio, avatar,
  primary email/phone, website, LinkedIn, address, city, country code,
  preferred locale, status (`active`/`disabled`).
- `identity_field_visibility` — `(identity_id, field_key)` →
  `PRIVATE`/`SHARED`. `field_key` is a CHECK-enum of the fixed allowlist.
- `identity_share_links` — one active opaque token per identity; `token` is
  64 lowercase hex chars from 32 crypto-random bytes (**256 bits**), unique;
  tracks `created_at`, `rotated_at`, `last_used_at`.

## 4. Privacy contract

```
PUBLIC RESPONSE ⊆ ALLOWED SHAREABLE FIELDS ∩ OWNER-SHARED FIELDS
```

- `IDENTITY_FIELD_KEYS` (`identity.projection.ts`) is the **fixed server-side
  allowlist**. A column existing in the DB never implies it is public;
  future/internal columns are unreachable by crafted visibility updates
  (allowlist enum + strict Zod + DB CHECK — three layers).
- `toPublicIdentityCard` is the **single projection**. The anonymous public
  resolver AND the owner's "Preview as recipient" both call it — no second
  privacy implementation can drift. PRIVATE fields are hard-nulled
  server-side, never hidden in React afterwards.
- **Recipient responses contain ONLY** the shareable display fields. No
  ownership metadata, internal ids, visibility values, audit fields,
  timestamps of record, or share-link internals.
- **Defaults**: profile fields start SHARED; contact coordinates
  (`primary_email`, `primary_phone`, `address`) start **PRIVATE** — disclosure
  is an explicit owner decision.
- The recipient UI stays clean even when the owner hides everything
  (fallback: neutral "card unavailable" is only for invalid/disabled links;
  a valid link with all-private fields renders the card shell without
  leaking that fields exist-but-are-hidden).

## 5. Share-link behavior

- Public URL: `/c/<token>` — opaque, high-entropy, **no** slugs, user ids,
  names, or guessable sequences. Token format validated (`/^[a-f0-9]{64}$/`)
  BEFORE any DB work.
- **One active link per identity.** Rotation (owner action, confirmed in the
  UI) generates a fresh token in the same row; the old token immediately
  resolves to the neutral unavailable state. No token internals are exposed
  to recipients.
- Public resolver is rate-limited per client IP (60 / 10 min, best-effort
  per edge instance) to blunt enumeration/scraping, and uses the privileged
  server path (not an `anon`-executable `SECURITY DEFINER` RPC — forbidden by
  `scripts/security-guard.sql`).
- `/c/:token` is `noindex, nofollow` and uses **static** metadata — the
  recipient URL never leaks the person's name via `<title>` into crawlers or
  browser history.

## 6. Recipient view behavior

- Valid token + active identity → renders `PublicIdentityCard` via the same
  `DigitalBusinessCard` component the owner previews with.
- Invalid / revoked / rotated-away / disabled / malformed → **one neutral
  unavailable state**. No directory enumeration, no oracle for whether a
  user, identity, or token ever existed (unit-tested indistinguishability).
- No assumption of an authenticated app shell.

## 7. Me experience (`/connect-app/me`)

Calm, premium, mobile-native; large touch targets (≥44px), readable type,
clear focus states, safe-area friendly sheets; no admin-dashboard density.

Sections, in order:

1. **Identity Hero** — avatar/initials, display name (email fallback),
   headline, job title · company, completeness meter (informational only —
   **privacy choices are never punished**: a filled-but-PRIVATE field counts).
2. **My Digital Card** — "Preview as recipient" runs the real projection.
3. **Share** — "My QR" (materializes the link on first open), "Share link"
   (Web Share API → clipboard fallback).
4. **Privacy** — per-field PRIVATE/SHARED switches; one atomic batch save.
5. **Account** — link to account & security.

Sheets (dialog semantics, Escape/backdrop close — inert while busy):

- **Edit identity** — all canonical fields; client Zod mirrors the server
  contract; empty string clears a field; invalid emails/phones/URLs are
  REJECTED with field errors, never silently dropped.
- **Privacy controls** — `role="switch"` + `aria-checked` per field.
- **QR / share hub** — QR for the CURRENT token, hint text, copy/share,
  and a **confirmed** "Reset sharing link" flow ("your previous QR/link
  will stop working immediately").

## 8. Save Contact behavior

- Available on the recipient view and the owner's recipient-preview.
- Generates the vCard **from the recipient projection only**
  (`identity.vcard.ts` → `buildIdentityVCard`): vCard 3.0, UTF-8, CRLF,
  RFC 2425 line folding, safe N fallback for Vietnamese names, URL recorded
  as the public `/c/<token>` link, no base64 photos, no proprietary X- props.
- Delivery: Web Share API (files) → anchor download fallback.
- Save Contact **never** creates a Business Connect connection.
- No display name on the projection → no export (button disabled).

## 9. Security gates (all PASS)

| Gate | Status |
| --- | --- |
| Actor derived server-side from `requireSupabaseAuth` (never client input) | PASS |
| RLS owner-only on all three tables; no `anon` access | PASS |
| Strict Zod `.strict()` payloads — forged `owner_user_id`/`id`/`status` rejected | PASS |
| Recipient responses contain no internal/audit/ownership fields | PASS |
| Token entropy 256-bit, format-validated pre-DB, unique, rotatable | PASS |
| No `SECURITY DEFINER` RPC executable by `anon` (security-guard convention) | PASS |
| Public resolver rate-limited; neutral failure for every invalid case | PASS |
| `noindex` + static metadata on `/c/:token` | PASS |

## 10. Privacy / visibility gates (all PASS)

- PRIVATE fields never appear in: recipient responses, recipient vCards, or
  the recipient preview (same projection).
- Visibility defaults documented + tested.
- Visibility changes take effect on the next public read (projection is
  recomputed per request — no cached public copies).

## 11. UX / mobile gates (all PASS)

- Responsive at mobile-first widths; semantic `--bc-mobile-*` tokens only.
- Keyboard: Tab/Enter/Escape across all sheets and toggles; `aria-modal`,
  labelled dialogs, `aria-busy` while saving/rotating; progressbar semantics
  on the completeness meter; `role="switch"` on privacy toggles.
- axe: recipient card + privacy sheet — no violations.

## 12. Telemetry (privacy-safe)

`identity.telemetry.ts` — allowlisted names only:
`IDENTITY_VIEWED/UPDATED/PRIVACY_UPDATED/CARD_PREVIEWED/QR_VIEWED/
LINK_SHARED/LINK_ROTATED/PUBLIC_RESOLVED/PUBLIC_UNAVAILABLE`.
Never logged: display name, email, phone, address, bio, token (full or
partial), user/identity ids, vCard content, QR payload.

## 13. Explicit non-goals (later phases)

Import/scan suggestions into the identity, audience-level ACLs, multiple
share links, analytics for recipients, connection creation from Save Contact,
association/member card migration.

## 14. Tests

`src/__tests__/business-connect-mobile-me.bcm5a.test.tsx` — 15 tests:
projection gating + metadata absence, visibility defaults, unknown-key
defense, privacy-neutral completeness, token format, vCard projection-only
output (+null-anchor), neutral-unavailable indistinguishability, recipient
render without PRIVATE leakage, Save Contact disabled without a name,
switch semantics, atomic visibility batch, Escape-while-idle, QR targets
current token, rotation requires confirm. Full suite green.
