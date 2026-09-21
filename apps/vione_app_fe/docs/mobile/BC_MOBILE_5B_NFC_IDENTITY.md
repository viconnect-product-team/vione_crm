# BC-Mobile-5B — NFC Identity & Physical Tap-to-Connect

## Scope

NFC is a **transport only**. It carries the BC-Mobile-5A opaque public share
URL (`https://<domain>/c/<64-hex-token>`) to a physical card or tag. It creates
no new identity system, no second privacy implementation, and no NFC-specific
recipient behavior.

## Architecture

```
share link (5A token)
  → NfcSheet (Me Hub > Share > NFC Card)
    → isValidIdentityShareUrl (strict validation: https, origin match,
       /c/<64-hex> path, no query/fragment/userinfo)
    → NfcWriterAdapter.writeIdentityUrl (Web NDEF, feature-detected)
      → single NDEF URI record on the tag
  → recipient taps tag → opens /c/:token
    → bcIdentityPublicByTokenFn (existing public resolver)
      → toPublicIdentityCard (existing ONE privacy projection)
        → RecipientCardView / Save Contact vCard
```

### Modules

| File | Responsibility |
| --- | --- |
| `src/lib/nfc/types.ts` | `NfcCapability`, `NfcErrorKind`, `NfcWriteState` |
| `src/lib/nfc/capability.ts` | Real feature detection (`NDEFReader` + `prototype.write` + secure context; localhost dev allowed over http) |
| `src/lib/nfc/ndef.ts` | NDEF URI record builder + strict share-URL validator |
| `src/lib/nfc/writer.ts` | `NfcWriterAdapter` interface + Web NFC implementation; validates URL before touching hardware |
| `src/lib/nfc/errors.ts` | `NfcWriteError` + `toNfcErrorKind` (DOMException → product error kind) |
| `src/lib/nfc/write-machine.ts` | Pure reducer state machine; `START_WRITE` is ignored unless READY with write support (double-write impossible) |
| `src/components/business-connect/mobile/me/NfcSheet.tsx` | Management UI: supported write flow, unsupported/read-only fallbacks, localized error states, privacy note |

## Capability matrix

| Capability | Meaning | Product behavior |
| --- | --- | --- |
| `SUPPORTED_WRITE` | Web NDEF write available | In-app write flow enabled |
| `READ_ONLY_OR_EXTERNAL` | API exists but no `write()` | Fallback: Copy NFC Link + external NFC writer app guidance |
| `UNSUPPORTED` | No Web NFC / insecure context | Fallback: Copy NFC Link; QR and Wallet remain primary |

There is **no fake success path**: a success state is only reachable from a
resolved real `NDEFReader.write()` call.

## NDEF payload contract

- Exactly ONE record: `{ recordType: "url", data: "https://<origin>/c/<token>" }`.
- No vCard, no JSON profile, no PII, no internal ids, no query params or
  fragments on the tag.
- The writer validates the URL against `PUBLIC_TOKEN_RE` and the expected
  origin before any hardware interaction (`LINK_NOT_CONFIRMED` otherwise).

## Privacy & rotation invariants

- Recipient experience is identical for QR, link, Wallet and NFC: all resolve
  through `/c/:token` → `toPublicIdentityCard` (PRIVATE fields hard-nulled
  server-side).
- Link rotation revokes the old token server-side; any NFC tag carrying the
  old URL converges to the neutral `unavailable` state. The rotation
  confirmation copy explicitly warns that physical NFC cards deactivate.
- The sheet always writes the CURRENT link prop, so post-rotation writes use
  the new token only.
- Visiting an NFC-shared identity never creates a connection and never grants
  access to the owner's full profile.

## Error mapping (product copy, never raw exceptions)

| `NfcErrorKind` | Trigger | UX |
| --- | --- | --- |
| `UNSUPPORTED` | no Web NFC | fallback screen |
| `PERMISSION_DENIED` | `NotAllowedError` | permission explanation + retry |
| `NO_TAG` | `NotReadableError` / `AbortError` (timeout) | reposition guidance + retry |
| `READ_ONLY` | read-only tag | replace-card guidance |
| `WRITE_FAILED` | other DOMExceptions | generic retry |
| `CANCELLED` | user cancels | neutral cancelled state |
| `LINK_NOT_CONFIRMED` | URL failed validation | defensive; cannot occur in-app |

Raw DOMException names/messages never render; telemetry events
(`NFC_WRITE_STARTED/SUCCESS/FAILED/CANCELLED`) carry allowlisted metric names
only.

## Test coverage

`src/__tests__/business-connect-mobile-me-nfc.bcm5b.test.tsx` — 32 tests:
capability detection, NDEF payload contract, URL validation, adapter
guards, state machine, full write flow, double-write prevention, cancellation,
unsupported/read-only fallbacks, all error mappings, raw-exception redaction,
privacy note, rotation warnings and token freshness, recipient-resolver source
guards, PRIVATE-field projection (email/phone/address), no-connection source
guard, vCard projection, axe, and VI/EN i18n parity.
