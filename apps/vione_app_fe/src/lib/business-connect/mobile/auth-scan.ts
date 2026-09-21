// Pre-auth business-card scan parsing (client-safe, pure).
//
// The sign-in screen can scan a QR code from a printed or digital business
// card. Only two outcomes are actionable before the user has a session:
//   - an email address  → prefill the sign-in form
//   - a same-origin link to a public card/activation page → navigate there
// Anything else is reported as unknown; we never invent data.

/** Human-readable fields lifted from a scanned card, shown for confirmation. */
export type ScannedCardFields = {
  fullName?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  website?: string;
};

export type AuthScanResult =
  | { kind: "email"; email: string; card: ScannedCardFields }
  | { kind: "link"; path: string; card: ScannedCardFields }
  | { kind: "unknown" };

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/** Same-origin relative paths only — never follow an external QR target. */
function sameOriginPath(raw: string, origin: string): string | null {
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return null;
    const path = url.pathname + url.search + url.hash;
    return path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

function extractEmail(text: string): string | null {
  const match = EMAIL_RE.exec(text);
  return match ? match[0].toLowerCase() : null;
}

function clean(v: string | undefined | null): string | undefined {
  const out = (v ?? "")
    .replace(/\\([,;\\nN])/g, (_m, c: string) => (c === "n" || c === "N" ? " " : c))
    .replace(/\s+/g, " ")
    .trim();
  return out ? out.slice(0, 120) : undefined;
}

/** QUOTED-PRINTABLE (accented Vietnamese cards from older exporters). */
function decodeQuotedPrintable(input: string): string {
  const bytes: number[] = [];
  const text = input.replace(/=\r?\n/g, "");
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "=" && /^[0-9a-f]{2}$/i.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      for (const b of new TextEncoder().encode(ch)) bytes.push(b);
    }
  }
  try {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch {
    return input;
  }
}

type VLine = { name: string; params: string[]; value: string };

/** Unfold continuation lines, then split into name/params/value triples. */
function parseVCardLines(raw: string): VLine[] {
  const rawLines = raw.split(/\r?\n/);
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else if (unfolded.length && /=$/.test(unfolded[unfolded.length - 1])) {
      // soft line break from quoted-printable encoding
      unfolded[unfolded.length - 1] = unfolded[unfolded.length - 1].replace(/=$/, "") + line;
    } else {
      unfolded.push(line);
    }
  }

  const out: VLine[] = [];
  for (const line of unfolded) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const head = line.slice(0, idx);
    let value = line.slice(idx + 1);
    const segments = head.split(";");
    // Grouped properties look like "item1.EMAIL" — drop the group prefix.
    const nameRaw = segments[0].includes(".")
      ? segments[0].slice(segments[0].indexOf(".") + 1)
      : segments[0];
    const params = segments.slice(1).map((p) => p.trim().toUpperCase());
    if (params.some((p) => p.includes("QUOTED-PRINTABLE"))) {
      value = decodeQuotedPrintable(value);
    }
    out.push({ name: nameRaw.trim().toUpperCase(), params, value });
  }
  return out;
}

function score(params: string[]): number {
  const joined = params.join(",");
  let s = 0;
  if (joined.includes("PREF")) s += 3;
  if (joined.includes("WORK")) s += 2;
  if (joined.includes("CELL") || joined.includes("MOBILE")) s += 1;
  if (joined.includes("HOME") || joined.includes("FAX")) s -= 1;
  return s;
}

/** Best value among all occurrences of a property, preferring PREF/WORK. */
function pick(lines: VLine[], names: string[]): string | undefined {
  let best: { value: string; s: number } | null = null;
  for (const line of lines) {
    if (!names.includes(line.name)) continue;
    if (!line.value.trim()) continue;
    const s = score(line.params);
    if (!best || s > best.s) best = { value: line.value, s };
  }
  return best?.value;
}

/** vCard 2.1/3.0/4.0 including grouped, encoded and X- prefixed variants. */
export function parseVCardFields(raw: string): ScannedCardFields {
  const lines = parseVCardLines(raw);

  const fn = clean(pick(lines, ["FN", "X-FULLNAME"]));
  const n = pick(lines, ["N"]);
  let nameFromN: string | undefined;
  if (n) {
    const [family, given, middle] = n.split(";");
    nameFromN = clean([given, middle, family].filter(Boolean).join(" "));
  }

  const orgRaw = pick(lines, ["ORG", "X-ORGANIZATION", "COMPANY"]);
  const orgParts = (orgRaw ?? "")
    .split(";")
    .map((p) => clean(p))
    .filter(Boolean);
  const company = orgParts[0];

  const title = clean(pick(lines, ["TITLE", "ROLE", "X-TITLE"]));

  const emailValue = pick(lines, ["EMAIL", "X-EMAIL", "MAIL"]);
  const email = (emailValue ? extractEmail(emailValue) : null) ?? extractEmail(raw) ?? undefined;

  const telRaw = pick(lines, ["TEL", "X-PHONE", "PHONE"]);
  const phone = telRaw ? clean(telRaw.replace(/^tel:/i, "")) : undefined;

  const urlRaw = pick(lines, ["URL", "X-URL", "WEBSITE"]);
  const website = urlRaw ? clean(urlRaw) : undefined;

  return {
    ...((fn ?? nameFromN) ? { fullName: fn ?? nameFromN } : {}),
    ...(email ? { email } : {}),
    ...(company ? { company } : {}),
    ...(title ? { title } : {}),
    ...(phone ? { phone } : {}),
    ...(website ? { website } : {}),
  };
}

/** MECARD:N:...;ORG:...;TITLE:...;EMAIL:...;TEL:...;URL:...;; */
export function parseMeCardFields(raw: string): ScannedCardFields {
  const body = raw.slice(raw.indexOf(":") + 1);
  const out: Record<string, string> = {};
  for (const part of body.split(/(?<!\\);/)) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toUpperCase();
    if (!out[key]) out[key] = part.slice(idx + 1);
  }
  const name = out["N"] ?? out["NAME"];
  const email = out["EMAIL"] ? extractEmail(out["EMAIL"]) : extractEmail(raw);
  const fullName = name ? clean(name.split(",").filter(Boolean).reverse().join(" ")) : undefined;
  const company = clean(out["ORG"]);
  const title = clean(out["TITLE"] ?? out["ROLE"]);
  const phone = clean(out["TEL"] ?? out["TEL-AV"]);
  const website = clean(out["URL"]);
  return {
    ...(fullName ? { fullName } : {}),
    ...(email ? { email } : {}),
    ...(company ? { company } : {}),
    ...(title ? { title } : {}),
    ...(phone ? { phone } : {}),
    ...(website ? { website } : {}),
  };
}

export function parseScannedCard(raw: string, origin: string): AuthScanResult {
  const value = raw.trim();
  if (!value) return { kind: "unknown" };

  const lower = value.toLowerCase();

  if (lower.startsWith("mailto:")) {
    const email = extractEmail(value.slice(7));
    return email ? { kind: "email", email, card: { email } } : { kind: "unknown" };
  }

  // vCard / MECARD payloads: prefer the declared email field.
  if (lower.includes("begin:vcard") || lower.startsWith("mecard:")) {
    const fields = lower.startsWith("mecard:") ? parseMeCardFields(value) : parseVCardFields(value);
    if (!fields.email) return { kind: "unknown" };
    return { kind: "email", email: fields.email, card: fields };
  }

  if (lower.startsWith("http://") || lower.startsWith("https://") || value.startsWith("/")) {
    const path = sameOriginPath(value, origin);
    return path ? { kind: "link", path, card: {} } : { kind: "unknown" };
  }

  if (EMAIL_RE.test(value) && !value.includes(" ")) {
    const email = extractEmail(value);
    if (email) return { kind: "email", email, card: { email } };
  }

  return { kind: "unknown" };
}

const SCANNED_CARD_KEY = "bc.mobile.scannedCard";

/** Hand the confirmed card to the next screen (sign-up / activation prefill). */
export function rememberScannedCard(card: ScannedCardFields): void {
  try {
    sessionStorage.setItem(SCANNED_CARD_KEY, JSON.stringify(card));
  } catch {
    /* storage unavailable — prefill is best-effort only */
  }
}

export function takeScannedCard(): ScannedCardFields | null {
  try {
    const raw = sessionStorage.getItem(SCANNED_CARD_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SCANNED_CARD_KEY);
    const parsed = JSON.parse(raw) as ScannedCardFields;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
