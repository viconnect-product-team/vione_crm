# BC-Mobile-3B — Guest Contact Exchange + Guest Relationship Acquisition

Status: FROZEN (implementation gate: `BC_MOBILE_3B_GUEST_GATE.md`)
Extends: BC-Mobile-3A (Public Digital Card + QR Presentation + Guest Save Contact)

## 1. Scope

A guest viewing a published public card (`/b/<slug>`) can voluntarily share
their own contact back with the card owner — without an account. The owner
sees that guest as a first-class person across Network, Person Detail,
Journey, and Moments.

IN:
- Canonical `guest_contacts` domain (owner-scoped, minimal PII)
- Anonymous `POST /api/public/card/<slug>/contact` endpoint
- Explicit, versioned guest consent (hard gate, client + server + DB)
- Public-card CTA "Chia sẻ liên hệ của bạn" + minimal guest form
- Server-side-only slug → card → owner resolution
- Idempotency (client token), rate limiting, silent-drop honeypot
- Network / Person Detail (`g:<uuid>`) / Journey origin milestone / Moment target

OUT (unchanged): guest accounts, guest → owner messaging, notifications,
marketing consent, AI/ML use of guest data, public listing of guests.

## 2. Privacy & security posture

- Guest PII is NEVER public. `guest_contacts` has no `anon` grant and RLS
  limits reads/deletes to the owner (`owner_user_id = auth.uid()`).
- Writes happen ONLY through the `share_guest_contact` SECURITY DEFINER RPC
  (executable by `anon` + `authenticated`). There are no authenticated
  INSERT/UPDATE policies — direct table writes are impossible from clients.
- The anonymous request carries NO owner id, card id, or guest id. The RPC
  resolves slug → published+public card → owner independently. A response
  contains only `{ ok, result | error }` — never internal identifiers.
- Fail-closed card states (unknown slug, unpublished, members_only, private)
  collapse into the single `card_unavailable` error — no slug enumeration
  signal. `exchange_disabled` is safe to distinguish because the same state
  is already public via the card DTO (`allowContactExchange`).
- Consent is a hard gate: the checkbox is never pre-checked, and the RPC
  rejects any payload whose `consentVersion` does not equal the frozen
  `bc-guest-exchange-v1` constant. `consented_at` is stamped server-side.

## 3. Canonical model — `public.guest_contacts`

| column | rule |
| --- | --- |
| `owner_user_id` | card owner, resolved server-side |
| `source_card_id` | FK `member_business_cards`, ON DELETE CASCADE |
| `display_name` | required, 1–160 chars, control chars stripped, whitespace collapsed |
| `phone` / `email` | nullable, AT LEAST ONE required (CHECK) |
| `company_name` / `title` | optional, capped 200 / 160 |
| `consent_version` / `consented_at` | versioned consent proof |
| `source` | frozen `public_card_exchange` |
| `client_token` | guest-generated UUID; `UNIQUE (source_card_id, client_token)` = idempotency key |
| `first_shared_at` / `last_shared_at` | immutable origin / latest resubmission |

Normalization (mirrored 1:1 in TS `guest-contact.ts` and SQL):
- phone → digits only, single leading `+` preserved, ≥ 6 digits, ≤ 40 chars
- email → trim + lowercase, RFC-ish single-recipient pattern, ≤ 160 chars

## 4. Submission pipeline

```text
Guest form (consent checked)
  → client validation (guest-contact.ts, instant feedback)
  → POST /api/public/card/<slug>/contact
      rate limit: 8/min per client IP, 20/min per card slug
      honeypot "website" field filled → SILENT DROP (fake success)
      validateGuestContactSubmission (shape, consent, token, lengths)
  → share_guest_contact RPC (SECURITY DEFINER)
      consent version hard gate
      slug → published + public card → owner (fail closed)
      allow_contact_exchange gate
      normalize + re-validate (defense in depth)
      replay: (source_card_id, client_token) hit → "replay"
      dedupe: email match beats phone match
        both match DIFFERENT rows → ambiguous → NEVER merge → new row
        resubmission → update guest-owned fields + last_shared_at → "merged"
        new → insert → "created"  (unique race → "replay")
  → { ok: true, result } | { ok: false, error, detail? }
```

Bounded error codes: `card_unavailable`, `exchange_disabled`,
`invalid_payload` (+ `detail`: `consent_required`, `name_required`,
`contact_method_required`, `invalid_phone`, `invalid_email`,
`invalid_client_token`, `field_too_long`), `rate_limited`,
`submission_failed`. No field echo, no internals.

## 5. Dedupe semantics (frozen)

1. Same `(source_card_id, client_token)` → idempotent replay, no mutation.
2. Else, match the OWNER's guest contacts: normalized email first, then
   normalized phone.
3. Exactly one matched row → merge: overwrite guest-owned fields
   (display_name, and resubmitted phone/email), fill still-null company/title,
   refresh `consented_at`/`last_shared_at`. `first_shared_at` never moves.
4. Email and phone match DIFFERENT rows → ambiguous → never merge → create a
   new row (safe conflict path).
5. No match → create.

## 6. Guest person identity — `g:<uuid>`

Third opaque person namespace alongside `u:<userId>` and `c:<cardId>`:

- Network: third source, additive (guests carry no card slug, so slug-dedupe
  never applies; precedence stays connection > saved card > guest). Mapping
  omits everything except name/title/company/context timestamps.
- Person Detail: owner-scoped `guest_contacts` read IS the authorization
  (fail-closed "unavailable"). Contact channels come from the guest row
  itself — phone/email the guest explicitly shared. No social links, no
  website, no card slug, no Connect CTA (no platform identity).
- Journey: origin milestone `contact_shared` (occurredAt =
  `first_shared_at`) merged with the owner's Moments, exact composite-cursor
  pagination unchanged.
- Moments: `target_kind = 'guest_contact'` + `target_guest_id` (FK CASCADE),
  three-way XOR CHECK, `brm_validate_moment_target` trigger guest branch
  (owner-scoped existence). Capture UI needs zero changes — it speaks the
  opaque person id.

## 7. Owner controls

- `member_business_cards.allow_contact_exchange` (default `true`): when
  false, the public card hides the CTA and the RPC rejects with
  `exchange_disabled`. Default ON because every submission is individually
  consented by the guest; the owner can opt out at any time.
- Owner may DELETE a guest contact (RLS). CASCADE removes linked moments.

## 8. Abuse controls

- 8 submissions/min per client IP + 20/min per card (in-memory limiter,
  same mechanism as the 3A .vcf endpoint).
- Silent-drop honeypot (bots get a fake `created` success, nothing persists).
- Idempotency key kills double-tap / retry duplicates.
- Field caps + control-char stripping at three layers (client, route, RPC).

## 9. Test gate

`src/__tests__/business-card-guest.bcm3b.test.ts` — validation/normalization,
dedupe decision, response leak shape, `g:` id parsing (person + journey),
guest journey composition, network merge/mapping, i18n key presence.
Regressions: bcm3a (public card), bcm2a/bcm2c/bcm2d (network/person/journey).
