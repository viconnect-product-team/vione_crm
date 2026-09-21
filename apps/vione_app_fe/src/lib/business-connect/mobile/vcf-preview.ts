// vCard preview parser — what-you-see-is-what-you-export.
//
// The preview sheet never reconstructs "what would be included" from source
// data; it parses the ACTUAL generated .vcf document, so the human-readable
// field list is guaranteed to match the file the user is about to share.
// Pure module: no DOM, no network — unit-testable and reusable for any
// vCard 3.0 document this app produces (person detail, scan review draft).

export type VcfPreviewField =
  | "name"
  | "company"
  | "title"
  | "phone"
  | "email"
  | "website"
  | "cardUrl"
  | "photo"
  | "address"
  | "source";

export type VcfPreviewRow = { field: VcfPreviewField; value: string };

/**
 * Inverse of escapeVCardValue (src/lib/business-card/vcard.ts). Single-pass
 * scan so escaped-backslash sequences (`\\`) never re-trigger unescaping.
 * `\n` / `\N` render as a space for one-line preview display.
 */
export function unescapeVCardValue(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === "n" || next === "N") {
        out += " ";
        i++;
        continue;
      }
      if (next === "\\" || next === ";" || next === ",") {
        out += next;
        i++;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

/**
 * Undo RFC 2425 §5.8.1 line folding: continuation lines begin with a single
 * space or tab and are appended to the previous content line.
 */
export function unfoldVCardLines(vcf: string): string[] {
  const lines: string[] = [];
  for (const raw of vcf.split(/\r\n|\n/)) {
    if (raw === "") continue;
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else {
      lines.push(raw);
    }
  }
  return lines;
}

/** Split a structured vCard value on UNESCAPED semicolons only. */
function splitStructured(raw: string): string[] {
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      cur += ch + raw[i + 1];
      i++;
      continue;
    }
    if (ch === ";") {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

/**
 * Person-detail exports carry the owner's public digital card as
 * `URL;TYPE=WORK` under the `/b/<slug>` path; every other URL is a plain
 * website link. Scan-draft exports only ever carry a website.
 */
function urlField(value: string): "cardUrl" | "website" {
  try {
    const u = new URL(unescapeVCardValue(value));
    if (u.pathname === "/b" || u.pathname.startsWith("/b/")) return "cardUrl";
  } catch {
    // Not a parseable absolute URL — still shown, labeled as a website.
  }
  return "website";
}

/**
 * Parse a generated vCard 3.0 document into labeled preview rows, in file
 * order. Envelope properties (BEGIN/END/VERSION/PRODID) and the machine-only
 * `N` fallback (always mirrors FN in our generators) are skipped. Empty
 * values never reach the file, so every row shown is exported content.
 */
export function parseVCardPreview(vcf: string): VcfPreviewRow[] {
  const rows: VcfPreviewRow[] = [];
  for (const line of unfoldVCardLines(vcf)) {
    const sep = line.indexOf(":");
    if (sep <= 0) continue;
    const prop = line.slice(0, sep).split(";")[0]?.toUpperCase();
    const value = line.slice(sep + 1);
    switch (prop) {
      case "FN":
        rows.push({ field: "name", value: unescapeVCardValue(value) });
        break;
      case "ORG":
        rows.push({ field: "company", value: unescapeVCardValue(splitStructured(value)[0] ?? "") });
        break;
      case "TITLE":
        rows.push({ field: "title", value: unescapeVCardValue(value) });
        break;
      case "TEL":
        rows.push({ field: "phone", value: unescapeVCardValue(value) });
        break;
      case "EMAIL":
        rows.push({ field: "email", value: unescapeVCardValue(value) });
        break;
      case "URL":
        rows.push({ field: urlField(value), value: unescapeVCardValue(value) });
        break;
      case "PHOTO":
        rows.push({ field: "photo", value: unescapeVCardValue(value) });
        break;
      case "ADR": {
        // Our generators place the free-form address in the street slot.
        const street = splitStructured(value)[2] ?? "";
        const v = unescapeVCardValue(street).trim();
        if (v) rows.push({ field: "address", value: v });
        break;
      }
      case "SOURCE":
        // Provenance (platform origin / canonical public card URL) is
        // human-meaningful, so it is shown — unlike PRODID, which stays a
        // machine-only product identifier and remains skipped.
        rows.push({ field: "source", value: unescapeVCardValue(value) });
        break;
      default:
        break;
    }
  }
  return rows.filter((r) => r.value.trim() !== "");
}
