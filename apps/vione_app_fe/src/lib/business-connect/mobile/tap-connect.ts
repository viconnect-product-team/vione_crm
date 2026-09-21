import { isValidPublicToken } from "./identity.validation";

export type TapConnectTarget = { kind: "token"; token: string } | { kind: "unknown" };

function pathFromSameOrigin(raw: string, origin: string): string | null {
  try {
    const url = new URL(raw, origin);
    if (origin && url.origin !== origin) {
      if (url.protocol.startsWith("http")) {
        return url.pathname;
      }
      return null;
    }
    return url.pathname;
  } catch {
    return null;
  }
}

/**
 * Extract target identifier (token, card slug, member code) from tapped NFC / scanned QR value.
 * Supports all ViOne QR formats:
 * - /c/<64-hex-token> (Share link QR)
 * - /b/<slug> (Business card QR)
 * - /card/<slug-or-code>
 * - /verify?t=<token> or /verify?code=<code> (Member VIP card QR)
 * - VBA-MEMBER:<code>
 * - Bare tokens / slugs
 */
export function parseTapConnectValue(raw: string, origin: string): TapConnectTarget {
  const value = (raw || "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!value) return { kind: "unknown" };

  // 0. vCard parser: Look for URL:, NOTE:, or UID: inside BEGIN:VCARD ... END:VCARD
  if (/BEGIN:VCARD/i.test(value)) {
    const urlMatch = /URL(?:;[^:]*)?:(https?:\/\/[^\r\n]+)/i.exec(value);
    if (urlMatch && urlMatch[1]) {
      const nested = parseTapConnectValue(urlMatch[1].trim(), origin);
      if (nested.kind === "token") return nested;
    }
    const noteCodeMatch = /(?:Mã hội viên|MEMBER_CODE|MEMBER|CODE)[:\s]+([a-zA-Z0-9_-]+)/i.exec(value);
    if (noteCodeMatch && noteCodeMatch[1]) {
      return { kind: "token", token: noteCodeMatch[1].trim() };
    }
    const uidMatch = /UID[:\s]+([a-zA-Z0-9_.-]+)/i.exec(value);
    if (uidMatch && uidMatch[1]) {
      return { kind: "token", token: uidMatch[1].trim() };
    }
  }

  // 0b. Universal URL parser (any domain)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsedUrl = new URL(value);
      const cardM = /\/(?:m\/)?card\/([^/?#\s]+)/i.exec(parsedUrl.pathname);
      if (cardM && cardM[1]) return { kind: "token", token: decodeURIComponent(cardM[1]) };
      const bM = /\/b\/([^/?#\s]+)/i.exec(parsedUrl.pathname);
      if (bM && bM[1]) return { kind: "token", token: decodeURIComponent(bM[1]) };
      const cM = /\/c\/([^/?#\s]+)/i.exec(parsedUrl.pathname);
      if (cM && cM[1]) return { kind: "token", token: decodeURIComponent(cM[1]) };
      const memM = /\/m\/members\/([^/?#\s]+)/i.exec(parsedUrl.pathname);
      if (memM && memM[1]) return { kind: "token", token: decodeURIComponent(memM[1]) };
      const codeParam = parsedUrl.searchParams.get("code") || parsedUrl.searchParams.get("t");
      if (codeParam) return { kind: "token", token: decodeURIComponent(codeParam) };
    } catch {}
  }

  // 1. Bare token (64-hex or JWT ey...)
  if (isValidPublicToken(value)) return { kind: "token", token: value.toLowerCase() };
  if (/^ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
    return { kind: "token", token: value };
  }

  // 2. Direct match for /c/<token> anywhere in URL / text
  const cTokenMatch = /\/c\/([^/?#\s]+)(?:[\/?#\s]|$)/i.exec(value);
  if (cTokenMatch && cTokenMatch[1]) {
    return { kind: "token", token: decodeURIComponent(cTokenMatch[1]) };
  }

  // 3. Match for /verify?t=<token> or /verify?code=<code>
  const verifyTMatch = /[?&]t=([^&#\s]+)(?:[&#\s]|$)/i.exec(value);
  if (verifyTMatch && verifyTMatch[1]) {
    return { kind: "token", token: decodeURIComponent(verifyTMatch[1]) };
  }
  const verifyCodeMatch = /[?&]code=([^&#\s]+)/i.exec(value);
  if (verifyCodeMatch && verifyCodeMatch[1]) {
    return { kind: "token", token: decodeURIComponent(verifyCodeMatch[1]) };
  }

  // 4. Match for /b/<slug>
  const bSlugMatch = /\/b\/([^/?#\s]+)/i.exec(value);
  if (bSlugMatch && bSlugMatch[1]) {
    return { kind: "token", token: decodeURIComponent(bSlugMatch[1]) };
  }

  // 5. Match for /card/<slug-or-code> or /m/card/<slug-or-code>
  const cardMatch = /\/(?:m\/)?card\/([^/?#\s]+)/i.exec(value);
  if (cardMatch && cardMatch[1]) {
    return { kind: "token", token: decodeURIComponent(cardMatch[1]) };
  }

  // 6. Match for /m/members/<code-or-id>
  const memberMatch = /\/m\/members\/([^/?#\s]+)/i.exec(value);
  if (memberMatch && memberMatch[1]) {
    return { kind: "token", token: decodeURIComponent(memberMatch[1]) };
  }

  // 7. Match for VBA-MEMBER:<code> or CEO1983:<code>
  const vbaMemberMatch = /^(?:VBA-MEMBER|CEO1983|MEMBER):([^\s]+)$/i.exec(value);
  if (vbaMemberMatch && vbaMemberMatch[1]) {
    return { kind: "token", token: decodeURIComponent(vbaMemberMatch[1]) };
  }

  // 8. Same origin path matching
  const path = pathFromSameOrigin(value, origin);
  if (path) {
    const cMatch = /^\/c\/([^/]+)\/?$/.exec(path);
    if (cMatch && cMatch[1]) return { kind: "token", token: decodeURIComponent(cMatch[1]) };
    const bMatch = /^\/b\/([^/]+)\/?$/.exec(path);
    if (bMatch && bMatch[1]) return { kind: "token", token: decodeURIComponent(bMatch[1]) };
    const cardM = /^\/(?:m\/)?card\/([^/]+)\/?$/.exec(path);
    if (cardM && cardM[1]) return { kind: "token", token: decodeURIComponent(cardM[1]) };
    const netM = /^\/connect-app\/network\/(?:u:)?([^/]+)\/?$/.exec(path);
    if (netM && netM[1]) return { kind: "token", token: decodeURIComponent(netM[1]) };
    const memM = /^\/m\/members\/([^/]+)\/?$/.exec(path);
    if (memM && memM[1]) return { kind: "token", token: decodeURIComponent(memM[1]) };
  }

  // 9. If value is a clean alphanumeric slug / code / token (3-512 chars), allow trying it
  if (/^[a-zA-Z0-9_.-]{3,512}$/.test(value)) {
    return { kind: "token", token: value };
  }

  return { kind: "unknown" };
}
