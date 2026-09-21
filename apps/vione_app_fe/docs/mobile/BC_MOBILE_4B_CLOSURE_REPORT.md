# BC-Mobile-4B — Closure Report

OCR REVIEW → DUPLICATE RESOLUTION → SAVE TO NETWORK

## 1. Executive summary

The last mile from scanned business card to canonical Network person is
complete and hardened. The existing 4B foundation (review draft, exact-only
duplicate sheet, atomic save RPC, provenance, journey) was audited and then
extended with **tiered duplicate detection** and **field-level merge
confirmation** per this master prompt. All identity-changing actions require
explicit human confirmation; nothing merges or overwrites silently.

## 2. Files changed

- `supabase/migrations/20260809123000_bc4b_tiered_matching_field_resolution.sql`
  — tiered `resolve_card_scan_duplicates`; `save_scanned_guest_contact` gains
  `p_confirmed_new` + `p_field_choices` (transactional, TOCTOU re-check).
- `src/lib/business-connect/mobile/card-scan.review.ts` — `ScanMatchLevel`
  (exact/strong/possible), extended reasons, tiered `classifyScanDuplicates`,
  `computeScanFieldResolutions` (fill/conflict model, normalized equality).
- `src/lib/business-connect/mobile/card-scan-save.functions.ts` — resolve
  input + defensive mapping (matchLevel required); save input + RPC params.
- `src/components/business-connect/mobile/card-scan/CardScanDuplicateSheet.tsx`
  — tier labels, guest-only selection, possible-tier progressive disclosure.
- `src/components/business-connect/mobile/card-scan/CardScanFieldResolutionSheet.tsx`
  — NEW: per-field human choice (default keep-current), fill transparency.
- `src/components/business-connect/mobile/card-scan/CardScanFlow.tsx` — wiring:
  tiered refresh, guest-only preselect, `beginUpdateExisting`, confirmed-new.
- `src/lib/i18n.ts` — vi/en keys for new reasons, disclosure toggle, field sheet.
- `src/__tests__/business-connect-mobile-card-scan-save.bcm4b.test.tsx` — 34 tests.
- `docs/business-connect/mobile/BC_MOBILE_4B_AUDIT.md` — audit (§2).

## 3. Schema/migrations

One additive migration (applied). No RLS weakening; RPCs stay
`security definer` + owner-scoped, revoked from `anon`. No new tables.

## 4. Reused canonical primitives

Person ref codec (`parseBcMobilePersonId`), guest contact model + owner-scoped
`GuestContactSDK.getMine`, save RPC transaction, journey/provenance from
`guest_contacts.source = 'business_card_scan'`, scan session TTL, idempotency
client token, Network/Home query keys.

## 5. OCR review implementation

Unchanged from 4B foundation: editable draft, normalization mirroring the RPC,
minimum one meaningful field, no confidence percentages in UI.

## 6. Duplicate matching rules

- exact: normalized email / phone (deterministic).
- strong: name + organization, or name + email domain.
- possible: name-only / company-only — disclosure-only, NEVER selectable,
  NEVER merges, never produces the `exact` state.
- Viewer-scoped only (owner's guest contacts, saved cards, connections).
  No cross-tenant discovery. Semantic levels only — no raw AI percentages.

## 7. Existing-person resolution

Guest targets only (saved cards/connections are read-only). Before save, the
stored contact is fetched owner-scoped; conflicting populated fields open the
field-resolution sheet (default: keep current; only `'card'` choices are
sent). Empty canonical fields auto-fill and are listed for transparency.

## 8. New-person creation

Canonical `guest_contacts` path — identical to other acquisition channels;
`confirmedNew: true` proves the human decision when matches were shown.

## 9. Provenance / Journey behavior

`source = 'business_card_scan'` + scan/asset linkage persisted by the RPC;
Journey shows "Đã lưu từ danh thiếp" (human copy, no model internals).

## 10. Security review

Update targets restricted to `g:` refs both client- and server-side; RPC
re-validates in the same transaction; field sheet fetch is RLS-scoped;
no service-role or provider secrets on client; card image never persisted
beyond the private pipeline; negative paths tested (invalid refs, junk
matchLevel, weak-tier escalation).

## 11. RLS/authorization evidence

RLS policies untouched; `resolve`/`save` RPCs execute as the caller with
`owner_user_id = auth.uid()` predicates; anon has no EXECUTE.

## 12. Idempotency strategy

Per-attempt `clientToken` (uuid) + scan id; double-submit locked by `saving`
state and the RPC's replay semantics (`result: replay`). Late saves blocked
by the recognition-session TTL guard.

## 13. Test results

`business-connect-mobile-card-scan-save.bcm4b.test.tsx`: **34/34 pass** —
covers §20 items incl. tiered matching, weak-tier non-escalation, field
conflict/fill/silent-keep, no silent overwrite, confirmedNew, match_conflict
refresh, idempotent token reuse, defensive mapping, axe-clean sheets.

## 14. Typecheck/lint/build evidence

TypeScript: clean (harness build gate green after each edit). Lint: clean.
Production build: clean.

## 15. Browser golden-path evidence

NOT EXECUTED — `LOVABLE_BROWSER_AUTH_STATUS=signed_out`: no authenticated
session was available in this environment, so golden paths A/B/C could not be
driven in a real browser. This is an **OPEN RELEASE GATE**.

## 16. Known limitations

- Tiered SQL signals are conservative (normalized equality on
  name/organization), deliberately avoiding fuzzy thresholds that could
  over-surface.
- Field resolution is per-field all-or-nothing (no partial value merge).
- Authenticated device/browser UAT outstanding (§15).

## 17. Final verdict

**CONDITIONAL PASS — DEVICE/BROWSER UAT REMAINS OPEN**
