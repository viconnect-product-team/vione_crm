import { decodeNdefRecord, extractNdefPayload } from "@/hooks/use-nfc-scanner";
import { extractScanCode } from "@/lib/scan";

// Business Card NFC / tap flow. Uses the Web NFC (NDEF) API where available
// (Chrome on Android over HTTPS). The card's public URL is the identity — NFC
// tag IDs are never trusted. Writing a badge stores the URL + a vCard so any
// phone that taps it opens the card instantly; scanning reads a badge's URL.

export type NfcSupport = "supported" | "unsupported" | "insecure";

export function nfcSupport(): NfcSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("NDEFReader" in window)) return "unsupported";
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor));
  if (!window.isSecureContext && !isLocal) return "insecure";
  return "supported";
}

export type CardTapPayload = {
  url: string;
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
};

function buildVCard(p: CardTapPayload): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${p.name}`,
    p.title ? `TITLE:${p.title}` : "",
    p.company ? `ORG:${p.company}` : "",
    p.phone ? `TEL;TYPE=WORK,VOICE:${p.phone}` : "",
    p.email ? `EMAIL;TYPE=WORK:${p.email}` : "",
    `URL:${p.url}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

/** NDEF records written to a physical badge / shared via tap. */
export function buildCardNdefRecords(p: CardTapPayload): {
  recordType: string;
  data: string;
}[] {
  return [
    { recordType: "url", data: p.url },
    { recordType: "text", data: buildVCard(p) },
  ];
}

export type NfcResult = { ok: true } | { ok: false; error: string };

export async function writeCardNfc(p: CardTapPayload): Promise<NfcResult> {
  const support = nfcSupport();
  if (support === "unsupported") return { ok: false, error: "unsupported" };
  if (support === "insecure") return { ok: false, error: "insecure" };
  try {
    const ndef = new (window as any).NDEFReader();
    await ndef.write({ records: buildCardNdefRecords(p) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "write_failed" };
  }
}


/**
 * Scan a nearby NFC badge and resolve the first URL record found.
 * Resolves with the URL string, or rejects on error/abort.
 */
export function scanCardNfc(signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const support = nfcSupport();
    if (support !== "supported") {
      reject(new Error(support));
      return;
    }
    try {
      const ndef = new (window as any).NDEFReader();
      ndef
        .scan({ signal })
        .then(() => {
          ndef.onreading = (event: any) => {
            const raw = extractNdefPayload(event);
            if (!raw) return;

            // 1. If it's a direct URL
            if (/^https?:\/\//i.test(raw)) {
              resolve(raw);
              return;
            }

            // 2. If it's a vCard, find URL: or NOTE:
            const codeOrUrl = extractScanCode(raw);
            if (codeOrUrl) {
              resolve(codeOrUrl);
              return;
            }

            resolve(raw);
          };

          ndef.onreadingerror = () => reject(new Error("read_failed"));
        })
        .catch((e: unknown) => reject(e instanceof Error ? e : new Error("scan_failed")));
    } catch (e) {
      reject(e instanceof Error ? e : new Error("scan_failed"));
    }
  });
}

