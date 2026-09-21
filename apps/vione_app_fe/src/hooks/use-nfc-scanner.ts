import { useEffect, useRef, useState } from "react";

export type NfcStatus = "idle" | "scanning" | "denied" | "unsupported" | "insecure" | "error";

export interface NdefRecordLike {
  recordType: string;
  mediaType?: string;
  id?: string;
  encoding?: string;
  data?: BufferSource;
}

export interface NdefMessageLike {
  records: NdefRecordLike[];
}

export interface NdefReadingEventLike {
  message: NdefMessageLike;
  serialNumber?: string;
}

interface NDEFReaderLike {
  scan(opts?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((e: NdefReadingEventLike) => void) | null;
  onreadingerror: ((e: Event) => void) | null;
}

type NDEFReaderCtor = new () => NDEFReaderLike;

/**
 * Robust decoder for NDEF records compliant with NFC Forum RTD-TEXT / RTD-URI / MIME.
 * Correctly handles the 1-byte status header + language code offset in Text records.
 */
export function decodeNdefRecord(rec: NdefRecordLike): string {
  if (!rec.data) return "";
  try {
    const rawBuffer = rec.data instanceof ArrayBuffer ? rec.data : rec.data.buffer;
    const offset = "byteOffset" in rec.data ? rec.data.byteOffset : 0;
    const length = rec.data.byteLength;
    const uint8 = new Uint8Array(rawBuffer, offset, length);
    if (uint8.length === 0) return "";

    if (rec.recordType === "text") {
      // NFC Forum Text Record:
      // Byte 0: Status byte (Bit 7: 0=UTF-8, 1=UTF-16; Bits 5..0: language code length L)
      const status = uint8[0];
      const isUtf16 = (status & 0x80) !== 0;
      const langLen = status & 0x3f;

      // Check if byte 0 looks like a valid RFC status byte followed by ASCII language code
      if (langLen > 0 && uint8.length > 1 + langLen) {
        let isAsciiLang = true;
        for (let i = 1; i <= langLen; i++) {
          if (uint8[i] < 0x20 || uint8[i] > 0x7e) {
            isAsciiLang = false;
            break;
          }
        }
        if (isAsciiLang) {
          const textDecoder = new TextDecoder(isUtf16 ? "utf-16" : (rec.encoding || "utf-8"));
          const textBytes = uint8.subarray(1 + langLen);
          return textDecoder.decode(textBytes).trim();
        }
      }
      const decoder = new TextDecoder(rec.encoding || "utf-8");
      return decoder.decode(uint8).trim();
    }

    // For url, mime, or raw text records
    const decoder = new TextDecoder(rec.encoding || "utf-8");
    return decoder.decode(uint8).trim();
  } catch {
    return "";
  }
}

/**
 * Extract the best possible payload from an NDEF reading event.
 * Prefers URL records, then text/vcard records, then MIME records, and falls back to serialNumber.
 */
export function extractNdefPayload(event: NdefReadingEventLike): string {
  if (!event.message?.records || event.message.records.length === 0) {
    return (event.serialNumber ?? "").trim();
  }

  // 1. Try url record first
  for (const rec of event.message.records) {
    if (rec.recordType === "url") {
      const val = decodeNdefRecord(rec);
      if (val) return val;
    }
  }

  // 2. Try text / mime records
  for (const rec of event.message.records) {
    if (rec.recordType === "text" || rec.recordType === "mime" || !rec.recordType) {
      const val = decodeNdefRecord(rec);
      if (val) return val;
    }
  }

  // 3. Fall back to any decoded record
  for (const rec of event.message.records) {
    const val = decodeNdefRecord(rec);
    if (val) return val;
  }

  return (event.serialNumber ?? "").trim();
}

/**
 * Universal NFC reader hook.
 * Supports:
 * 1. Native Android WebView via CustomEvent ('vione:nfc_tag') & window message ('VIONE_NFC_TAG')
 * 2. Web NFC (Google Chrome / Edge on Android with NDEFReader)
 */
export function useNfcScanner(opts: { active: boolean; onDetect: (value: string) => void }) {
  const { active, onDetect } = opts;
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;
  const [status, setStatus] = useState<NfcStatus>("idle");

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      return;
    }

    if (typeof window === "undefined") {
      setStatus("unsupported");
      return;
    }

    let isHandledByNative = false;

    // Check if running in native app (Capacitor / Android WebView)
    const isCapacitor = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ||
      (window as unknown as { Capacitor?: any }).Capacitor ||
      (window as unknown as { __VIONE_LAST_NFC__?: any }).__VIONE_LAST_NFC__ !== undefined
    );

    // Native NFC event handler
    const handleNativeNfcData = (data: any) => {
      if (!data) return;
      const targetPayload = (data.url || data.rawText || data.serialNumber || "").trim();
      if (targetPayload) {
        onDetectRef.current(targetPayload);
      }
    };

    const onCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        handleNativeNfcData(customEvt.detail);
      }
    };

    const onMessageEvent = (e: MessageEvent) => {
      if (e.data && (e.data.type === "VIONE_NFC_TAG" || e.data.type === "nfc_tag")) {
        const payload = e.data.payload || e.data.detail || e.data;
        handleNativeNfcData(payload);
      }
    };

    window.addEventListener("vione:nfc_tag", onCustomEvent);
    window.addEventListener("message", onMessageEvent);

    if (isCapacitor) {
      // In native app, native ForegroundDispatch is running in MainActivity.java
      setStatus("scanning");
      isHandledByNative = true;

      // Check if tag was tapped immediately before sheet opened
      const lastNfc = (window as unknown as { __VIONE_LAST_NFC__?: any }).__VIONE_LAST_NFC__;
      if (lastNfc && typeof lastNfc.timestamp === "number" && Date.now() - lastNfc.timestamp < 3000) {
        handleNativeNfcData(lastNfc);
      }
    }

    // Also attempt Web NFC (if available in standard browser)
    const Ctor = (window as unknown as { NDEFReader?: NDEFReaderCtor }).NDEFReader;
    const aborter = new AbortController();
    let stopped = false;

    if (Ctor && typeof Ctor === "function") {
      async function startWebNfc() {
        try {
          const reader = new Ctor!();
          await reader.scan({ signal: aborter.signal });
          if (stopped) return;
          setStatus("scanning");

          reader.onreading = (event: NdefReadingEventLike) => {
            if (stopped) return;
            const payload = extractNdefPayload(event);
            if (payload) {
              onDetectRef.current(payload);
            }
          };

          reader.onreadingerror = () => {
            // Keep scanning
          };
        } catch (e: any) {
          if (stopped || aborter.signal.aborted) return;
          if (!isHandledByNative) {
            if (e?.name === "NotAllowedError" || e?.message?.includes("not allowed") || e?.message?.includes("permission")) {
              setStatus("denied");
            } else if (e?.name === "NotSupportedError") {
              setStatus("unsupported");
            } else {
              setStatus("error");
            }
          }
        }
      }

      void startWebNfc();
    } else if (!isHandledByNative) {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocal) {
        setStatus("insecure");
      } else {
        setStatus("unsupported");
      }
    }

    return () => {
      stopped = true;
      window.removeEventListener("vione:nfc_tag", onCustomEvent);
      window.removeEventListener("message", onMessageEvent);
      try {
        aborter.abort();
      } catch {
        /* ignore abort errors */
      }
    };
  }, [active]);

  return { status };
}

