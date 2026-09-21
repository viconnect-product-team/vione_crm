// BC-Mobile-5B — NFC domain types (client-safe).
//
// NFC is a TRANSPORT of the single Business Digital Identity created in
// BC-Mobile-5A. There is no nfc_identity / nfc_profile domain: a physical
// tag carries only the opaque public share URL (/c/<token>), and recipients
// resolve through the exact same server-side privacy projection as QR and
// copied links.

/** Actual NFC writing capability of the current device/browser. */
export type NfcCapability =
  /** Web NFC NDEF write is available (e.g. Chrome on Android). */
  | "SUPPORTED_WRITE"
  /** NFC may exist but writing is not available — use an external writer. */
  | "READ_ONLY_OR_EXTERNAL"
  /** No Web NFC at all (e.g. iPhone Safari, most desktop browsers). */
  | "UNSUPPORTED"
  /** Cannot determine (SSR / pre-check). Never shown as a product state. */
  | "UNKNOWN";

/** Product-level error kinds. Raw DOMExceptions never cross this boundary. */
export type NfcErrorKind =
  | "PERMISSION_DENIED"
  | "NO_TAG"
  | "READ_ONLY"
  | "WRITE_FAILED"
  | "UNSUPPORTED"
  | "CANCELLED"
  | "LINK_NOT_CONFIRMED";

/**
 * Deterministic NFC write state machine. Critical UI derives ONLY from this
 * union — never from scattered isLoading/isWriting booleans.
 */
export type NfcWriteState =
  | { status: "IDLE" }
  | { status: "CAPABILITY_CHECKING" }
  | { status: "READY"; capability: Exclude<NfcCapability, "UNKNOWN"> }
  | { status: "UNSUPPORTED" }
  | { status: "WAITING_FOR_TAG" }
  | { status: "WRITING" }
  | { status: "SUCCESS" }
  | { status: "ERROR"; kind: Exclude<NfcErrorKind, "CANCELLED"> }
  | { status: "CANCELLED" };

/** Minimal structural typing for the Web NFC API (not in TS DOM lib). */
export interface NdefRecordInit {
  recordType: string;
  data?: string | BufferSource;
}
export interface NdefWriteMessage {
  records: NdefRecordInit[];
}
export interface NdefWriterLike {
  write(message: NdefWriteMessage, opts?: { signal?: AbortSignal }): Promise<void>;
}
export type NdefWriterCtor = new () => NdefWriterLike;
