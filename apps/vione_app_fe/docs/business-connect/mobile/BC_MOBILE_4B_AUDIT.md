# BC-Mobile-4B — Pre-Implementation Audit

> Master prompt: "OCR REVIEW → DUPLICATE RESOLUTION → SAVE TO NETWORK".
> Convention note: project docs live under `docs/business-connect/mobile/`
> (the prompt's `docs/mobile/` path maps here). This audit documents the
> existing 4A/4B implementation BEFORE the tiered-matching + field-resolution
> hardening, per §2 "Audit before implementation".

## 1. Reusable primitives found

| Primitive | Location | Reused for |
|---|---|---|
| OCR candidate model (`BusinessCardCandidate`, multi phone/email, per-field confidence) | `src/lib/business-connect/mobile/card-scan.types.ts` | Review draft derivation |
| OCR server runtime (Gemini via Lovable AI Gateway, no persistence, no client secrets) | `card-scan.server.ts`, `card-scan.functions.ts` | unchanged |
| Review draft + validation mirroring the save RPC | `card-scan.review.ts` | extended with tiered DTO + field-resolution model |
| Guest Contact canonical model (`guest_contacts`, `source='business_card_scan'`, `capture_scan_id`, `first_captured_at`) | `src/lib/business-card/guest-contact.ts` + migration `20260809102507` | provenance §9 (already semantic-equivalent to `source_type = BUSINESS_CARD_SCAN`) |
| Owner-scoped guest reads (RLS IS the authorization) | `guest-contact.sdk.ts` (`GuestContactSDK.getMine`) | field-resolution target fetch |
| Deterministic duplicate resolver RPC (owner-scoped, SECURITY DEFINER, grants revoked from anon) | `resolve_card_scan_duplicates` | extended to tiered matching |
| Canonical save RPC (atomic, TOCTOU re-check, idempotent on `(owner, client_token)`) | `save_scanned_guest_contact` | extended with `confirmed_new` + per-field choices |
| Journey milestone `business_card_scanned` ("Đã lưu từ danh thiếp") | `person-journey.compose.ts` | §10 — already live, derived from `guest_contacts.source` (no separate write → atomic by construction) |
| Person Detail provenance ("Nguồn liên hệ · Danh thiếp") | `PersonDetail.tsx` (source-aware copy) | §16 — already live |
| Idempotency: per-attempt `clientToken` + partial unique index `guest_contacts_scan_token_uq` | `CardScanFlow.tsx` + migration | §13 — kept |
| Recognition-session TTL (10 min, expiry guards on save/export) | `card-scan.session.ts` | kept |
| Scoped TanStack Query invalidation (`["bc-mobile","network"]`, `["bc-mobile","home"]`) | `CardScanFlow.tsx` | §15 — kept |

## 2. Canonical write path (existing, kept)

```
CardScanFlow (browser, human-confirmed draft)
  → bcMobileCardScanSaveFn (createServerFn, requireSupabaseAuth, zod, rate budget)
    → save_scanned_guest_contact (SECURITY DEFINER SQL, single atomic call)
        re-normalizes → re-computes duplicates (TOCTOU) → INSERT/UPDATE guest_contacts
        idempotent replay on (owner_user_id, client_token)
  → Journey/PersonDetail/Network read models derive provenance from the row
```

No parallel contact model exists or is added. OCR never writes canonical identity.

## 3. Gaps found vs the master prompt

1. **§5 Tiered matching** — the 4B freeze shipped Tier-1 only (exact email/phone).
   The master prompt adds Tier-2 STRONG (name+organization, name+email-domain)
   and Tier-3 POSSIBLE (name-only, company-only) with `EXACT/STRONG/POSSIBLE`
   levels. The earlier "similarity never matches" freeze is superseded by this
   prompt — similarity still can NEVER auto-merge; it only surfaces candidates
   for a human decision.
2. **§6 "Lưu thành người mới" dead-end** — `save_scanned_guest_contact`
   returned `match_conflict` for `resolution='new'` whenever exactly one match
   existed, with no way for the client to say "the human saw the sheet and
   confirmed NEW". Fixed via an explicit `p_confirmed_new` flag (human-decision
   proof), still re-checked server-side.
3. **§7 Field-level resolution** — the update path overwrote `display_name`
   unconditionally and coalesce-filled the rest; no per-field human choice.
   Fixed via a field-resolution sheet + `p_field_choices` jsonb (default:
   keep-current on conflict, fill-if-empty).
4. **§3 match-evidence labels** — the duplicate sheet only labeled
   phone/email reasons; tier reasons ("Cùng tên và công ty", …) added.

## 4. Security constraints (verified, unchanged)

- All RPCs `SECURITY DEFINER`, `search_path=public`, `EXECUTE` revoked from
  PUBLIC/anon, granted to authenticated only; every body fail-closes on
  `auth.uid() IS NULL`.
- Duplicate lookup is owner-scoped across all three sources
  (guest_contacts / saved_business_cards / accepted connections). No
  cross-tenant discovery.
- Update targets restricted to `g:` guest refs — OCR can never mutate a
  connection's or saved card's canonical identity (client + SQL both enforce).
- The card image is never persisted (4A privacy decision — stricter than §11
  requires; "Xem danh thiếp gốc" is therefore N/A, documented as a deliberate
  deviation in the closure report).
- `LOVABLE_API_KEY` stays server-side; the resolve/save wrappers add rate
  budgets and defensive DTO mapping.

## 5. Implementation plan (this milestone)

1. SQL migration: tiered `resolve_card_scan_duplicates(email, phone, name,
   company)` returning `matchLevel`+`reason` per candidate; hardened
   `save_scanned_guest_contact` (+`p_confirmed_new`, +`p_field_choices`,
   update-target eligibility extended to strong/possible guest matches,
   per-field merge that never silently overwrites).
2. Client: extend `card-scan.review.ts` (tier DTO, pure classifier, field-
   resolution computation), pass-through in `card-scan-save.functions.ts`,
   new `CardScanFieldResolutionSheet`, tier labels + progressive disclosure in
   `CardScanDuplicateSheet`, wiring in `CardScanFlow`, i18n vi/en.
3. Tests: tier classification, defensive mapping, field-resolution model,
   confirmed-new contract, field-choice contract, sheet UX, axe.
4. Docs: this audit + closure report with honest verdict (browser UAT gate).
