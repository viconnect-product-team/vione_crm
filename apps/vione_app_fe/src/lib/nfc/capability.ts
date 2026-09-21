// BC-Mobile-5B — real NFC capability detection.
//
// NON-NEGOTIABLE: never fake NFC. The UI derives from actual feature
// detection — Web NFC write exists today only on Chrome/Android. iPhone
// Safari and desktop browsers report UNSUPPORTED and get the fallback UX.

import type { NdefWriterCtor, NfcCapability } from "./types";

/** Resolve the NDEFReader constructor, if the browser exposes one. */
export function getNdefWriterCtor(win?: Window): NdefWriterCtor | null {
  const w = win ?? (typeof window !== "undefined" ? window : undefined);
  if (!w) return null;
  const ctor = (w as unknown as { NDEFReader?: unknown }).NDEFReader;
  return typeof ctor === "function" ? (ctor as NdefWriterCtor) : null;
}

/**
 * Detect actual NFC write capability.
 * - non-secure context (http, non-localhost) → UNSUPPORTED (Web NFC requires HTTPS)
 * - no NDEFReader → UNSUPPORTED
 * - NDEFReader without write → READ_ONLY_OR_EXTERNAL
 */
export function detectNfcCapability(win?: Window): NfcCapability {
  const w = win ?? (typeof window !== "undefined" ? window : undefined);
  if (!w) return "UNKNOWN";
  const isLocalDev = w.location?.hostname === "localhost" || w.location?.hostname === "127.0.0.1";
  if (!w.isSecureContext && !isLocalDev) return "UNSUPPORTED";
  const ctor = getNdefWriterCtor(w);
  if (!ctor) return "UNSUPPORTED";
  if (typeof ctor.prototype?.write !== "function") return "READ_ONLY_OR_EXTERNAL";
  return "SUPPORTED_WRITE";
}
