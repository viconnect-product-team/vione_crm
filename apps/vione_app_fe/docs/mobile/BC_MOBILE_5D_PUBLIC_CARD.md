# BC-Mobile-5D — Public Digital Card Experience

Scope: upgrade `/c/<token>` into the production-grade public recipient
experience. ONE identity, ONE privacy model, ONE projection — QR, NFC, and
shared links converge on this single surface.

## Invariants

1. **ONE privacy projection.** The page renders only the server-side
   `PublicIdentityCard` projection (`toPublicIdentityCard`). The owner
   preview and the recipient view are the same component fed by the same
   projection — a false preview is impossible.
2. **Safe hrefs, centralized.** Every recipient-facing link is produced by
   `src/lib/business-connect/mobile/public-actions.ts`
   (`safeTelHref` / `safeMailtoHref` / `safeWebHref`). A value that fails
   validation renders **no action at all** — `javascript:`, `data:`, `file:`,
   protocol relatives, and credentialed URLs are structurally impossible.
3. **Truthful Save Contact.** The vCard is generated client-side from the
   already-disclosed projection; PRIVATE fields are null and can never leak
   into the export. After Web Share / download delivery we show "Open the
   contact to save it" — never "Đã lưu" (a browser cannot know the native
   Contacts save completed).
4. **Share Contact back = 3B Guest Exchange, not Connect.** The recipient
   can share their own contact back via
   `POST /api/public/identity/<token>/contact`, reusing the frozen 3B
   contract (validation, versioned consent v1 never pre-checked, per-session
   idempotency token, honeypot silent drop, per-IP + per-token rate limits).
   Owner resolution is server-side only: token → active share link → active
   identity → owner. The row carries `source_identity_id` (DB-enforced XOR
   with `source_card_id`). Success copy is "Đã chia sẻ liên hệ" — never
   "Đã kết nối". Connect is deferred to the Connection Engine.
5. **No public-unsafe widgets.** No Connect button, no verification badges,
   no metrics, no Network/Journey/Moment/chrome from the authenticated app.
6. **Neutral unavailable state.** Invalid, revoked, rotated-away, and
   disabled all render one identical state — no enumeration oracle. The
   opaque token is never rendered in the UI.
7. **Private-by-design SEO.** `robots: noindex, nofollow` always. OG
   metadata is built only from the PUBLIC projection (name, company,
   headline, avatar); an unavailable token falls back to static generic
   metadata, so crawlers cannot distinguish token validity either.

## Telemetry (allowlisted, payload-free)

`PUBLIC_CARD_SAVE_CONTACT_TAPPED`, `PUBLIC_CARD_CALL_TAPPED`,
`PUBLIC_CARD_EMAIL_TAPPED`, `PUBLIC_CARD_WEBSITE_TAPPED`,
`PUBLIC_CARD_SOCIAL_TAPPED`, `PUBLIC_CARD_SHARE_CARD_TAPPED`,
`PUBLIC_CARD_SHARE_CONTACT_OPENED`, `PUBLIC_CARD_SHARE_CONTACT_SUBMITTED`,
`PUBLIC_CARD_SHARE_CONTACT_FAILED`. Transport-neutral (a `/c/<token>` visit
cannot be attributed to QR vs NFC vs link). No name/phone/email/token/ids.

## Files

- `src/routes/c.$token.tsx` — route: loader (neutral catch), dynamic head,
  calm skeleton pending state.
- `src/routes/api/public/identity.$token.contact.ts` — anonymous exchange
  endpoint (privileged writes after verification only).
- `src/components/business-connect/mobile/me/RecipientCardView.tsx` — page
  composition: card → Share Card status → exchange panel → attribution.
- `src/components/business-connect/mobile/me/DigitalBusinessCard.tsx` —
  hierarchy: person → context → Save Contact → quick actions → bio →
  details.
- `src/components/business-connect/mobile/me/IdentityShareContactPanel.tsx`
  — progressive-disclosure exchange form (teaser → form → success).
- `src/lib/business-connect/mobile/public-actions.ts` — safe href builders.
- Migration: `guest_contacts.source_identity_id` + XOR check + idempotency
  index.
- Tests: `src/__tests__/business-connect-mobile-me-public-card.bcm5d.test.tsx`.

## Deferred

- Connect CTA on the public card (needs the Connection Engine contract).
- Claim/verification badges.
- vCard photo embedding (by-reference https URI only today).
