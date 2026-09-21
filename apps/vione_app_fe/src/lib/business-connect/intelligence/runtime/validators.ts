// BC-9.0 Turn B2 — Pure factuality & privacy validators.
//
// The model's structured response is validated against the envelope's safe
// facts before persistence. Any citation pointing at a ref not present in
// the envelope, or any payload containing raw identifiers, private-note
// markers, or forbidden PII patterns, is rejected.

import type { BusinessConnectAIContextEnvelope } from "../types";

export type ValidationIssue = {
  code:
    | "unsupported_citation"
    | "raw_uuid_leak"
    | "raw_email_leak"
    | "raw_phone_leak"
    | "private_note_reference"
    | "auth_identifier_leak"
    | "excluded_domain_reference";
  path: string;
  detail: string;
};

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const PHONE_RE = /\b\+?\d[\d\s().-]{7,}\d\b/;

const PRIVATE_MARKERS = [
  "private note",
  "ghi chú riêng",
  "private_meeting_note",
  "private_meeting_notes",
];

const AUTH_MARKERS = ["auth.uid", "service_role", "bearer ", "sb_secret_"];

const EXCLUDED_MARKERS = [
  "hidden_contact_details",
  "raw_email_inbox",
  "raw_audit_logs",
  "cross_tenant_data",
  "provider_secrets",
];

function walkStrings(value: unknown, path: string, cb: (s: string, p: string) => void): void {
  if (value == null) return;
  if (typeof value === "string") {
    cb(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, cb));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      walkStrings(v, path ? `${path}.${k}` : k, cb);
    }
  }
}

export function validateBusinessConnectAIPrivacy(payload: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  walkStrings(payload, "", (s, p) => {
    if (UUID_RE.test(s))
      issues.push({ code: "raw_uuid_leak", path: p, detail: "raw uuid in text" });
    if (EMAIL_RE.test(s))
      issues.push({ code: "raw_email_leak", path: p, detail: "raw email in text" });
    if (PHONE_RE.test(s))
      issues.push({ code: "raw_phone_leak", path: p, detail: "raw phone in text" });
    const low = s.toLowerCase();
    for (const m of PRIVATE_MARKERS)
      if (low.includes(m)) issues.push({ code: "private_note_reference", path: p, detail: m });
    for (const m of AUTH_MARKERS)
      if (low.includes(m)) issues.push({ code: "auth_identifier_leak", path: p, detail: m });
    for (const m of EXCLUDED_MARKERS)
      if (low.includes(m)) issues.push({ code: "excluded_domain_reference", path: p, detail: m });
  });
  return issues;
}

/**
 * Every citation.sourceRef.id in the payload must correspond to a fact.ref.id
 * present in the envelope. Reject fabricated references.
 */
export function validateBusinessConnectAIFactuality(
  payload: unknown,
  envelope: BusinessConnectAIContextEnvelope,
): ValidationIssue[] {
  const knownIds = new Set<string>();
  for (const f of envelope.safeFacts) knownIds.add(f.ref.id);
  const issues: ValidationIssue[] = [];

  const walk = (value: unknown, path: string): void => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    const obj = value as Record<string, unknown>;
    if (
      "sourceRef" in obj &&
      typeof obj.sourceRef === "object" &&
      obj.sourceRef !== null &&
      "id" in (obj.sourceRef as Record<string, unknown>)
    ) {
      const id = (obj.sourceRef as { id: unknown }).id;
      if (typeof id === "string" && !knownIds.has(id)) {
        issues.push({
          code: "unsupported_citation",
          path: `${path}.sourceRef.id`,
          detail: `citation ${id} not in envelope`,
        });
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(payload, "");
  return issues;
}
