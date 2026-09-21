// NFC digital identity abstraction. Uses the Web NFC (NDEF) API where available
// (Chrome on Android). Physical NFC cards and native apps can share the same
// identity because everything resolves to the member's public verify URL — NFC
// tag IDs are never hardcoded or trusted for identity; the URL is the identity.

import type { MembershipPass } from "@/lib/membership-pass";

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

/** NDEF records written to a physical card / shared via tap. */
export function buildNdefRecords(pass: MembershipPass): { recordType: string; data: string }[] {
  return [
    { recordType: "url", data: pass.verifyUrl },
    {
      recordType: "text",
      data: [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${pass.memberName}`,
        pass.organization ? `ORG:${pass.organization}` : "",
        `URL:${pass.verifyUrl}`,
        `NOTE:Member ${pass.memberCode}`,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export type NfcWriteResult = { ok: true } | { ok: false; error: string };

export async function writeNfc(pass: MembershipPass): Promise<NfcWriteResult> {
  const support = nfcSupport();
  if (support === "unsupported") return { ok: false, error: "Thiết bị hoặc trình duyệt chưa hỗ trợ Web NFC (chỉ hỗ trợ trên Chrome Android)." };
  if (support === "insecure") return { ok: false, error: "Cần kết nối HTTPS bảo mật để dùng NFC." };
  try {
    const ndef = new (window as any).NDEFReader();
    await ndef.write({ records: buildNdefRecords(pass) });
    return { ok: true };
  } catch (e: any) {
    if (e?.name === "NotAllowedError" || e?.message?.includes("not allowed")) {
      return { ok: false, error: "Quyền truy cập NFC bị từ chối trong trình duyệt." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Ghi NFC thất bại. Hãy áp thẻ vào giữa mặt lưng điện thoại." };
  }
}

