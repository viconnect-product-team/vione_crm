// BC-Mobile-5B — NFC error taxonomy.
//
// Maps raw browser DOMExceptions into stable product error kinds. Raw
// DOMException names/messages MUST NOT reach the UI — they leak browser
// internals and are not localized.

import type { NfcErrorKind } from "./types";

/** Thrown by the writer adapter; `kind` is the only information UI consumes. */
export class NfcWriteError extends Error {
  readonly kind: NfcErrorKind;
  constructor(kind: NfcErrorKind) {
    super(kind);
    this.name = "NfcWriteError";
    this.kind = kind;
  }
}

/** Map any thrown value to a product error kind. */
export function toNfcErrorKind(e: unknown): NfcErrorKind {
  if (e instanceof NfcWriteError) return e.kind;
  const name = (e as { name?: unknown })?.name;
  const message = String((e as { message?: unknown })?.message ?? "").toLowerCase();
  if (name === "AbortError") return "CANCELLED";
  if (name === "NotAllowedError") return "PERMISSION_DENIED";
  if (name === "NotSupportedError") {
    return message.includes("read-only") || message.includes("not modifiable")
      ? "READ_ONLY"
      : "UNSUPPORTED";
  }
  // NotReadableError covers both "no tag in range / I/O timeout" and, on some
  // Android stacks, hardware write rejection — both surface as a retry path.
  if (name === "NotReadableError") {
    return message.includes("read-only") ? "READ_ONLY" : "NO_TAG";
  }
  return "WRITE_FAILED";
}

/** True when a thrown value represents a user-initiated cancellation. */
export function isNfcCancellation(e: unknown): boolean {
  return toNfcErrorKind(e) === "CANCELLED";
}
