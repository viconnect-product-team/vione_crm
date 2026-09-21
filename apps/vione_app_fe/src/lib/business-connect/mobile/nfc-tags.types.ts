// BC-Mobile-5C — NFC tag registry domain types (client-safe).
//
// NFC remains a pure TRANSPORT of the BC-Mobile-5A identity (see 5B): a tag
// carries only the opaque share URL. This registry is a MANAGEMENT view of
// the physical tags the owner programmed — it is NOT a new identity domain
// and stores no recipient data, no tag UIDs, and no PII.
//
// Status model:
//   - REVOKED: the owner explicitly retired the tag (registry state).
//   - STALE:   derived at read time — the linked share link is no longer
//              active (the owner rotated the link, so the tag's URL now
//              resolves to "unavailable"). No sync job needed.
//   - ACTIVE:  registry state active AND the linked share link is active.

export type IdentityNfcTagStatus = "ACTIVE" | "STALE" | "REVOKED";

/**
 * Owner-facing NFC tag DTO. Contains no internal identity ids, no share
 * token, no owner reference.
 *
 * lastTappedAt is the LINK-level last-resolved timestamp: the tag payload
 * is exactly the share URL (privacy contract — no per-tag identifier may
 * be embedded), so taps cannot be attributed per physical tag. The UI
 * labels it accordingly.
 */
export type IdentityNfcTagInfo = {
  id: string;
  label: string | null;
  status: IdentityNfcTagStatus;
  writtenAt: string;
  lastTappedAt: string | null;
  updatedAt: string;
};
