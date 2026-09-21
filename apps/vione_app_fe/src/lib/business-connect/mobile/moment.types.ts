// BC-Mobile-2E — Meeting Moment domain types, limits, and pure validators.
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2E_MOMENT_ARCHITECTURE.md
//
// Client-safe: no server-only imports. These DTOs cross the RPC boundary, so
// they stay JSON-safe and whitelist-only. A Moment is owner-private by
// construction — nothing here ever reaches the counterpart's surfaces.

export const MOMENT_MAX_PHOTOS = 5;
export const MOMENT_MAX_EVENT_NAME_LEN = 120;
export const MOMENT_MAX_PLACE_LABEL_LEN = 120;
export const MOMENT_MAX_NOTE_LEN = 1000;
/** occurred_at may lead server time by at most this much (clock skew). */
export const MOMENT_OCCURRED_FUTURE_SKEW_MS = 10 * 60_000;
/** occurred_at must be a real calendar instant within this lookback. */
export const MOMENT_OCCURRED_MAX_AGE_MS = 50 * 365.25 * 24 * 60 * 60_000;

export type BcMobileMomentTargetKind = "connection" | "saved_card" | "guest_contact";
export type BcMobileMomentStatus = "pending" | "active";

export type BcMobileMomentErrorCode =
  | "invalid_input"
  | "invalid_occurred_at"
  | "photo_count"
  | "relationship_not_authorized"
  | "not_found"
  | "unavailable";

export type BcMobileMomentError = {
  ok: false;
  error: BcMobileMomentErrorCode;
};

/** One upload slot prepared server-side. The storage path is a UUID path the
 * client MUST upload to verbatim — client file names never influence it. */
export type BcMobileMomentPhotoSlot = {
  mediaId: string;
  storagePath: string;
  sortOrder: number;
};

export type BcMobileMomentPrepareOk = {
  ok: true;
  /** True when clientToken already resolved to a saved Moment (idempotent
   * replay of a completed save). No upload slots are returned. */
  alreadySaved: boolean;
  momentId: string;
  photos: BcMobileMomentPhotoSlot[];
};

export type BcMobileMomentPrepareResult = BcMobileMomentPrepareOk | BcMobileMomentError;

export type BcMobileMomentFinalizeResult = { ok: true; momentId: string } | BcMobileMomentError;

/** BC-Mobile-7C — quản lý khoảnh khắc đã lưu (sửa nội dung / xoá hẳn). */
export type BcMobileMomentUpdateResult = { ok: true; momentId: string } | BcMobileMomentError;
export type BcMobileMomentDeleteResult = { ok: true; momentId: string } | BcMobileMomentError;

/** Strips control characters (keeping newlines for notes), collapses nothing
 * else, trims. React escapes on render; we never render as HTML. */
export function sanitizeMomentPlainText(input: string, maxLen: number): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return cleaned.trim().slice(0, maxLen);
}

export function validateMomentOccurredAt(
  iso: string,
  nowMs: number = Date.now(),
): { ok: true; occurredAt: string } | { ok: false } {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { ok: false };
  if (ms > nowMs + MOMENT_OCCURRED_FUTURE_SKEW_MS) return { ok: false };
  if (ms < nowMs - MOMENT_OCCURRED_MAX_AGE_MS) return { ok: false };
  return { ok: true, occurredAt: new Date(ms).toISOString() };
}

export function isValidMomentPhotoCount(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= MOMENT_MAX_PHOTOS;
}

/** Opaque person id shared with 2A/2C/3B (`u:<userId>` | `c:<targetCardId>` | `g:<guestContactId>`). */
export function parseMomentPersonId(
  raw: string,
):
  | { ok: true; namespace: "u"; id: string }
  | { ok: true; namespace: "c"; id: string }
  | { ok: true; namespace: "g"; id: string }
  | { ok: false } {
  const m = /^([ucg]):([0-9a-fA-F-]{36})$/.exec(raw);
  if (!m) return { ok: false };
  return { ok: true, namespace: m[1] as "u" | "c" | "g", id: m[2].toLowerCase() };
}
