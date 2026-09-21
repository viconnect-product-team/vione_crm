// Helpers for resolving scanned QR/NFC payloads into an attendee identifier or event ID.
// A badge QR/NFC may encode the attendee id directly, a verify URL such as
// `https://.../verify?code=HV-000123`, a vCard text, or a raw event UUID.

export function extractScanCode(raw: string): string {
  // Strip non-printable ASCII and control characters (except newlines/spaces)
  const value = (raw || "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!value) return "";

  // 1. If payload is a vCard, parse internal URL, NOTE, or code
  if (value.includes("BEGIN:VCARD")) {
    const urlMatch = /URL(?:;[^:]+)?:(\S+)/i.exec(value);
    if (urlMatch && urlMatch[1]) {
      const nested = extractScanCode(urlMatch[1]);
      if (nested) return nested;
    }
    const noteMatch = /NOTE:(?:Member|Mã hội viên)?\s*([^\r\n]+)/i.exec(value);
    if (noteMatch && noteMatch[1]) {
      return noteMatch[1].trim();
    }
    const codeParamMatch = /[?&](?:code|c|t)=([^&\s]+)/i.exec(value);
    if (codeParamMatch && codeParamMatch[1]) {
      return decodeURIComponent(codeParamMatch[1]).trim();
    }
  }

  // 2. URL-style payloads
  try {
    const url = new URL(value);
    const code =
      url.searchParams.get("code") ??
      url.searchParams.get("c") ??
      url.searchParams.get("t") ??
      url.searchParams.get("eventId");
    if (code) return decodeURIComponent(code).trim();

    // Segments for /card/CODE, /verify/CODE, /c/TOKEN, /checkin/UUID
    const segs = url.pathname.split("/").filter(Boolean);
    const lastSeg = segs.pop();
    if (lastSeg) return decodeURIComponent(lastSeg).trim();
  } catch {
    // Not a full URL — check for query params embedded in partial URLs
    const qMatch = /[?&](?:code|c|t)=([^&\s]+)/i.exec(value);
    if (qMatch && qMatch[1]) {
      return decodeURIComponent(qMatch[1]).trim();
    }
  }

  // 3. Check for standard UUID format
  const uuidMatch = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(value);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  return value;
}

export function resolveAttendeeId<T extends { id: string }>(raw: string, attendees: T[]): T | null {
  const code = extractScanCode(raw).toLowerCase();
  if (!code) return null;
  return (
    attendees.find((a) => a.id.toLowerCase() === code) ??
    attendees.find((a) => a.id.toLowerCase().endsWith(code)) ??
    null
  );
}

