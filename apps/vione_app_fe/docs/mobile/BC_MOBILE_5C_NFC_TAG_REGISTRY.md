# BC-Mobile-5C — NFC Tag Registry

Management view of the physical NFC tags an owner programmed from their
BC-Mobile-5A digital identity. NFC remains a pure transport (5B): the
registry is bookkeeping only — no new identity domain, no tag UIDs, no
recipient data, no PII.

## Model

- Table `identity_nfc_tags` (owner-scoped RLS, owner = `auth.uid()` only).
  Columns: `owner_user_id`, `identity_id`, `share_link_id`, `label?`,
  `status` (`active|revoked`), `written_at`, `revoked_at`, timestamps.
- Product status is DERIVED, never trusted from one column:
  - `REVOKED` — owner explicitly retired the tag (registry state).
  - `STALE` — linked share link is no longer active (link rotated). Derived
    at read time via join; no sync/batch job.
  - `ACTIVE` — tag row active AND link active.
- `lastTappedAt` = link-level `identity_share_links.last_used_at`. The tag
  payload is exactly the share URL (5B privacy contract), so taps cannot be
  attributed per physical card; the UI labels this honestly.

## Flows

- **Register**: `NfcSheet` calls `registerTag` (injected by the Me page)
  fire-and-forget ONLY after the browser confirms the write. Failure is
  telemetry-only (`NFC_TAG_REGISTER_FAILED`) and never fakes write success.
  Server re-verifies ownership + active link from the share token.
- **List / revoke**: `/connect-app/nfc-tags` (Me Hub row "Manage NFC Cards").
  Revoke is a two-step inline confirmation, owner-filtered server-side
  (`tag_not_found` on mismatch). Revoke retires the tag in the registry;
  the copy teaches that rotating the link is what kills a lost card.

## Files

- `src/lib/business-connect/mobile/nfc-tags.{types,validation,service,functions}.ts`
- `src/components/business-connect/mobile/me/NfcTagsList.tsx`
- `src/routes/connect-app.nfc-tags.tsx` (+ row in `connect-app.me.tsx`,
  `registerTag` prop on `NfcSheet.tsx`)
- Telemetry: `NFC_TAGS_VIEWED`, `NFC_TAG_REGISTERED`,
  `NFC_TAG_REGISTER_FAILED`, `NFC_TAG_REVOKED` (allowlist only)
- Tests: `src/__tests__/business-connect-mobile-me-nfc-tags.bcm5c.test.tsx`
  (35 tests, axe-clean)
