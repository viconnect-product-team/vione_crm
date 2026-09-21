# BC-Mobile-4B — Human Review + Duplicate Resolution + Save Gate

Chain: **Candidate (4A) → Human Review → Duplicate Resolution → Explicit Save →
Guest Contact / Existing Person → Network → Journey.**

OCR proposes. The human confirms. The database decides.

## Commands

- `bunx vitest run src/__tests__/business-connect-mobile-card-scan-save.bcm4b.test.tsx` — 4B suite
- `bunx vitest run src/__tests__/business-connect-mobile-card-scan.bcm4a.test.tsx` — 4A regressions
- `bunx vitest run src/__tests__/business-connect-mobile-person-journey.bcm2d.test.tsx src/__tests__/business-connect-mobile-shell.bcm0b.test.tsx` — touchpoint regressions
- `bunx tsgo --noEmit` — typecheck

## Result

| Suite | Result |
| --- | --- |
| `…card-scan-save.bcm4b` (23 tests) | PASS |
| `…card-scan.bcm4a` (43 tests) | PASS |
| `…person-journey.bcm2d` + `…shell.bcm0b` (46 tests) | PASS |
| `tsgo --noEmit` | PASS |

Total: 112 tests across the 4B blast radius.

## Scope shipped (and what is still NOT shipped)

- Editable review form pre-filled from the candidate; textual confidence
  cues (Needs review / Unclear) survive into review; every field is editable.
- Fax numbers are dropped at candidate construction (documented 4B omission).
- One primary phone + one primary email (mirrors `guest_contacts` scalar
  contract); all review values are sanitized, length-capped, and
  re-normalized **server-side** inside the RPC (client validation mirrors,
  never replaces, server validation).
- Owner-scoped duplicate search (Guests + Saved Cards, accepted
  `user_connections` included) via SECURITY DEFINER
  `resolve_scanned_card_duplicates`; classification is deterministic
  (exact-normalized **email/phone ONLY** — name similarity can never create
  a match; 0 → none, 1 → exact, ≥2 → ambiguous).
- Save via SECURITY DEFINER `save_scanned_guest_contact`: actor-derived,
  `scan_id` + `client_token` idempotent, TOCTOU match recheck
  (`match_required` / `unexpected_match`), guest-only writes in 4B
  (`saved_card` / `connection` targets → `target_not_supported`).
- Journey: guests saved from a scan get the truthful
  `business_card_scanned` milestone (`contact_shared` is reserved for
  explicit guest shares — provenance is never fabricated); Network shows
  the `card_scanned` context.
- Telemetry: `OCR_REVIEW_OPENED`, `OCR_REVIEW_SAVED_NEW`,
  `OCR_REVIEW_MATCHED_EXISTING`, `OCR_REVIEW_AMBIGUOUS`,
  `OCR_REVIEW_CANCELLED` (privacy-safe codes only, same consent pipeline).
- NO auto-merge (the human picks the update target explicitly), NO writing
  into Saved Cards or Connections, NO retroactive Journey backfill, NO raw
  OCR / card-image persistence (image never leaves the client; the scan
  result DTO stays free of images by construction).

## Adversarial review (post-review hardening)

1. **TOCTOU on resolution** — between duplicate resolution and save, the DB
   state could change. The save RPC re-runs the identical match computation
   and rejects mismatches (`match_required` / `unexpected_match`); the
   client re-runs read-only resolution and re-opens the sheet.
2. **Client token reuse** — a token is minted per scan attempt (not per
   click), so a retried save replays to the same row; tokens only replay to
   rows of the same owner.
3. **Saved-card target writes** — 4B deliberately refuses to update Saved
   Cards (sync authority, `BC_SAVED_CARD_SYNC_CONTRACT`): ambiguous
   decisions may only update `g:` guests or keep a new guest.
4. **Website / field injection** — client strips control chars, allows
   http(s) only, caps lengths; the RPC re-does all of it with its own
   normalizers and NULLs invalid optional values rather than trusting them.
5. **RLS recursion in duplicate search** — the resolver RPC is SECURITY
   DEFINER with an explicit `auth.uid()` owner scope (matching the guest
   owner SELECT policy shape); no cross-owner enumeration, fail-closed.
6. **Consistency with Guest Contact Sync** — scanned saves insert into the
   same `guest_contacts` table the sync contract owns, distinguished by
   `source = 'business_card_scan'` (CHECK-constrained enum); sync-owned
   fields are untouched.

## Explicitly NOT shipped (deferred)

- Auto-merge / merge proposals; connection-side dedupe UX.
- Multi-phone/multi-email persistence beyond one primary each.
- Raw OCR payload or card-image storage; per-scan duplicate analytics.
- Backfilling `source` for historical guest rows (they read as
  `public_card_exchange` — they came from the exchange flow).
