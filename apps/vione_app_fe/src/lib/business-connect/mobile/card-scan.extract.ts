// BC-Mobile-4A — deterministic extraction + evidence-backed candidate builder.
//
// Pure module (no I/O, no supabase, no provider) so every rule is unit-testable.
// Emails, phones, and websites are extracted DETERMINISTICALLY from OCR lines —
// a model may classify which line is a name/title/company, but it can never
// "correct" a phone number or invent an email: every field value is derived
// from its sourceText line.

import type {
  BusinessCardCandidate,
  CandidateField,
  CandidatePhone,
  CandidateWarning,
  OcrLine,
  OcrModelOutput,
  PhoneLabel,
} from "./card-scan.types";
import { CARD_SCAN_SCHEMA_VERSION } from "./card-scan.types";

// ── Normalization ────────────────────────────────────────────────────────────

/** Safe normalization only: NFC + whitespace collapse. Never re-spells names. */
export function normalizeText(s: string): string {
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Email (deterministic) ────────────────────────────────────────────────────

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
// OCR-common suspect: "name@company,com" — surfaced as uncertain, never fixed silently.
const EMAIL_SUSPECT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*,[A-Za-z]{2,}/g;

export function extractEmails(lines: OcrLine[], warnings: CandidateWarning[]): CandidateField[] {
  const out: CandidateField[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    for (const m of line.text.matchAll(EMAIL_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      out.push({ value, confidence: clamp01(line.confidence), sourceText: line.text });
    }
    for (const m of line.text.matchAll(EMAIL_SUSPECT_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      uncertain = true;
      // Value kept AS EVIDENCE (with the comma) — the human decides in 4B.
      out.push({
        value,
        confidence: round2(clamp01(line.confidence) * 0.5),
        sourceText: line.text,
      });
    }
  }
  if (uncertain) warnings.push("email_uncertain");
  return out;
}

// ── Phone (deterministic, label-aware) ───────────────────────────────────────

const PHONE_RE = /\+?\d[\d\s().-]{5,}\d/g;

export function detectPhoneLabel(lineText: string): PhoneLabel | undefined {
  const s = lineText.toLowerCase();
  if (s.includes("fax")) return "fax";
  if (s.includes("hotline")) return "hotline";
  // Token split over Latin + Vietnamese ranges — \b does not bound non-ASCII
  // letters like "đ", so "ĐT:" would never match with plain word boundaries.
  const tokens = s.split(/[^a-z0-9à-ỹ]+/u).filter(Boolean);
  const has = (set: readonly string[]) => tokens.some((tok) => set.includes(tok));
  if (has(["mobile", "mobi", "cell", "hp"]) || s.includes("di động") || s.includes("di dong")) {
    return "mobile";
  }
  if (
    has(["office", "tel", "phone", "đt", "dt"]) ||
    s.includes("văn phòng") ||
    s.includes("van phong")
  ) {
    return "office";
  }
  return undefined;
}

function normalizePhoneDigits(raw: string): string {
  const plus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

export function extractPhones(lines: OcrLine[], warnings: CandidateWarning[]): CandidatePhone[] {
  const out: CandidatePhone[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    // A line that is an email line can still contain a phone — both are parsed.
    for (const m of line.text.matchAll(PHONE_RE)) {
      const digits = m[0].replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) continue; // ITU E.164 bounds
      const value = normalizePhoneDigits(m[0]);
      if (seen.has(value)) continue;
      seen.add(value);
      const label = detectPhoneLabel(line.text);
      // Low legibility or an odd digit count gets flagged, not dropped.
      if (line.confidence < 0.5 || digits.length < 8) uncertain = true;
      out.push({
        value,
        confidence: clamp01(line.confidence),
        sourceText: line.text,
        ...(label ? { label } : {}),
      });
    }
  }
  if (uncertain) warnings.push("phone_uncertain");
  return out;
}

// ── Website (deterministic, safe schemes only) ───────────────────────────────

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

export function extractWebsite(lines: OcrLine[]): CandidateField | undefined {
  for (const line of lines) {
    for (const m of line.text.matchAll(URL_RE)) {
      let raw = m[0].replace(/[.,;:!?)}\]]+$/, ""); // trailing punctuation is layout, not URL
      if (raw.includes("@")) continue; // email tail, not a website
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      // Only http/https can exist here by construction — no javascript:/data:/file:.
      try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") continue;
        return { value: u.toString(), confidence: clamp01(line.confidence), sourceText: line.text };
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

// ── Model-classified semantic fields (evidence-guarded) ─────────────────────

const CONTACT_PATTERN = /@|\(?\+?\d[\d\s().-]{6,}\d/;

/**
 * Resolves a model-classified line index into a candidate field. Returns
 * undefined when the index is null, out of range, overlong, or (for names)
 * actually a contact line — the caller records a *_needs_review warning when
 * the model DID point somewhere but the evidence guard dropped it.
 */
export function pickClassifiedLine(
  lines: OcrLine[],
  index: number | null,
  opts: { maxLen: number; forbidContactPattern?: boolean },
): CandidateField | undefined {
  if (index === null) return undefined;
  const line = lines[index];
  if (!line) return undefined;
  const value = normalizeText(line.text);
  if (!value || value.length > opts.maxLen) return undefined;
  if (opts.forbidContactPattern && CONTACT_PATTERN.test(value)) return undefined;
  return { value, confidence: clamp01(line.confidence), sourceText: line.text };
}

// ── Candidate builder ────────────────────────────────────────────────────────

export type CandidateBuild =
  | { ok: true; candidate: BusinessCardCandidate }
  | { ok: false; code: "unusable" };

/**
 * Builds the reviewable candidate from a STRICTLY VALIDATED model output.
 * Truthful unusable threshold: a plausible name OR ≥1 communication channel.
 */
export function buildCandidateFromModel(model: OcrModelOutput, scanId: string): CandidateBuild {
  if (!model.isBusinessCard) return { ok: false, code: "unusable" };

  const lines: OcrLine[] = model.lines
    .map((l: any) => ({ text: normalizeText(l.text), confidence: clamp01(l.confidence) }))
    .filter((l: any) => l.text.length > 0);
  if (lines.length === 0) return { ok: false, code: "unusable" };

  const warnings: CandidateWarning[] = [];
  if (model.qrPresent) warnings.push("qr_present");

  const displayName = pickClassifiedLine(lines, model.displayNameLine, {
    maxLen: 80,
    forbidContactPattern: true,
  });
  if (model.displayNameLine !== null && !displayName) warnings.push("name_needs_review");

  const title = pickClassifiedLine(lines, model.titleLine, { maxLen: 120 });
  if (model.titleLine !== null && !title) warnings.push("title_needs_review");

  const companyName = pickClassifiedLine(lines, model.companyNameLine, { maxLen: 120 });
  if (model.companyNameLine !== null && !companyName) warnings.push("company_needs_review");

  const address = pickClassifiedLine(lines, model.addressLine, { maxLen: 160 });
  if (model.addressLine !== null && !address) warnings.push("address_needs_review");

  const emails = extractEmails(lines, warnings);
  const phones = extractPhones(lines, warnings);
  const website = extractWebsite(lines);

  if (!displayName) warnings.push("no_name");
  const hasChannel = phones.length > 0 || emails.length > 0 || website !== undefined;
  if (!hasChannel) warnings.push("no_contact_channel");
  if (!displayName && !hasChannel) return { ok: false, code: "unusable" };

  const present: CandidateField[] = [
    ...(displayName ? [displayName] : []),
    ...(title ? [title] : []),
    ...(companyName ? [companyName] : []),
    ...(website ? [website] : []),
    ...(address ? [address] : []),
    ...phones,
    ...emails,
  ];
  const overallConfidence =
    present.length === 0
      ? 0
      : round2(present.reduce((sum, f) => sum + f.confidence, 0) / present.length);

  return {
    ok: true,
    candidate: {
      schemaVersion: CARD_SCAN_SCHEMA_VERSION,
      scanId,
      status: "candidate",
      fields: {
        ...(displayName ? { displayName } : {}),
        ...(title ? { title } : {}),
        ...(companyName ? { companyName } : {}),
        phones,
        emails,
        ...(website ? { website } : {}),
        ...(address ? { address } : {}),
      },
      warnings,
      overallConfidence,
    },
  };
}
