// BC-Mobile-5B — NFC writer adapter.
//
// UI NEVER calls browser NFC APIs directly. This adapter is the single
// boundary: capability detection, URL validation, NDEF write, abort, and
// error mapping all live here so the write flow is testable and the UI is
// deterministic.

import { detectNfcCapability, getNdefWriterCtor } from "./capability";
import { buildIdentityNdefRecords, isValidIdentityShareUrl } from "./ndef";
import { NfcWriteError, toNfcErrorKind } from "./errors";
import type { NfcCapability } from "./types";

export interface NfcWriterAdapter {
  getCapability(): NfcCapability;
  /**
   * Program the identity share URL onto a tag. Resolves only when the
   * browser API actually reports success — a resolved promise IS the write
   * confirmation. Rejects with NfcWriteError (product error kinds only).
   */
  writeIdentityUrl(shareUrl: string, opts?: { signal?: AbortSignal }): Promise<void>;
}

/** Create a Web-NFC-backed adapter bound to the current window. */
export function createWebNfcWriter(expectedOrigin?: string): NfcWriterAdapter {
  return {
    getCapability: () => detectNfcCapability(),
    async writeIdentityUrl(shareUrl, opts) {
      // Validate BEFORE touching hardware: origin allowlist, /c/<token>
      // shape, no query/fragment PII. Not a generic NFC writer.
      if (!isValidIdentityShareUrl(shareUrl, expectedOrigin)) {
        throw new NfcWriteError("LINK_NOT_CONFIRMED");
      }
      const capability = detectNfcCapability();
      if (capability !== "SUPPORTED_WRITE") throw new NfcWriteError("UNSUPPORTED");
      const Ctor = getNdefWriterCtor();
      if (!Ctor) throw new NfcWriteError("UNSUPPORTED");
      if (opts?.signal?.aborted) throw new NfcWriteError("CANCELLED");
      try {
        const writer = new Ctor();
        await writer.write(
          { records: buildIdentityNdefRecords(shareUrl) },
          opts?.signal ? { signal: opts.signal } : undefined,
        );
      } catch (e) {
        throw new NfcWriteError(toNfcErrorKind(e));
      }
    },
  };
}
