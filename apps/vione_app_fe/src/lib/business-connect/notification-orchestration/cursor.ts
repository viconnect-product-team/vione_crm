// BC-8.1 §68 — Cursor codec bound to policy version + filter fingerprint.

import { NotificationError } from "./errors";
import {
  NOTIFICATION_POLICY_VERSION,
  type NotificationCursor,
  type NotificationListFilters,
} from "./types";

function b64encode(s: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(s)));
  return Buffer.from(s, "utf8").toString("base64");
}

function b64decode(s: string): string {
  if (typeof atob === "function") return decodeURIComponent(escape(atob(s)));
  return Buffer.from(s, "base64").toString("utf8");
}

/** Deterministic fingerprint of the caller-visible filters. */
export function fingerprintFilters(f: NotificationListFilters | null | undefined): string | null {
  if (!f) return null;
  const norm = {
    status: f.status ?? null,
    category: f.category ?? null,
    unreadOnly: f.unreadOnly ?? null,
    limit: f.limit ?? null,
  };
  return b64encode(JSON.stringify(norm));
}

export function encodeCursor(input: {
  referenceTs: string;
  itemId: string;
  filters?: NotificationListFilters | null;
}): string {
  const payload: NotificationCursor = {
    v: NOTIFICATION_POLICY_VERSION,
    t: input.referenceTs,
    i: input.itemId,
    f: fingerprintFilters(input.filters ?? null),
  };
  return b64encode(JSON.stringify(payload));
}

export function decodeCursor(
  cursor: string | null | undefined,
  filters?: NotificationListFilters | null,
): NotificationCursor | null {
  if (!cursor) return null;
  let parsed: NotificationCursor;
  try {
    parsed = JSON.parse(b64decode(cursor)) as NotificationCursor;
  } catch {
    throw new NotificationError("NOTIFICATION_INVALID_CURSOR");
  }
  if (parsed.v !== NOTIFICATION_POLICY_VERSION) {
    throw new NotificationError("NOTIFICATION_INVALID_CURSOR", "Cursor policy version mismatch");
  }
  const expected = fingerprintFilters(filters ?? null);
  if (parsed.f !== expected) {
    throw new NotificationError("NOTIFICATION_INVALID_CURSOR", "Cursor filter mismatch");
  }
  if (typeof parsed.i !== "string" || typeof parsed.t !== "string") {
    throw new NotificationError("NOTIFICATION_INVALID_CURSOR");
  }
  return parsed;
}
