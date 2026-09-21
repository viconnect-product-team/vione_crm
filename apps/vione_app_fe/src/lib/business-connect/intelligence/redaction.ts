// BC-9.0 — Redaction (§14). Allowlist-first. Applied to every context envelope
// before it reaches the prompt builder or provider.
//
// Redaction is defense-in-depth. Context builders are already bound to safe
// projections; this pass proves it by walking the envelope and stripping any
// value that does not match the safe-fact allowlist.

import { BUSINESS_CONNECT_AI_SOURCE_DOMAINS } from "./registry";
import type { BusinessConnectAIContextEnvelope, BusinessConnectSafeFact, SafeRef } from "./types";

const FORBIDDEN_FACT_KEYS = new Set<string>([
  "auth_uid",
  "authUid",
  "user_id",
  "userId",
  "tenant_id",
  "tenantId",
  "email",
  "phone",
  "tax_code",
  "taxCode",
  "provider_secret",
  "providerSecret",
  "api_key",
  "apiKey",
  "private_note",
  "privateNote",
  "private_notes",
  "privateNotes",
  "password",
  "session_token",
  "sessionToken",
  "raw_row",
  "rawRow",
]);

const ALLOWED_SOURCE_DOMAINS = new Set<string>(BUSINESS_CONNECT_AI_SOURCE_DOMAINS);

function isSafeRef(v: unknown): v is SafeRef {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.label === "string";
}

/**
 * Assert a single fact matches its declared safe shape. Throws on structural
 * violations — the caller (context builder) has a bug that must fail loud in
 * tests rather than silently ship sensitive data to a provider.
 */
export function assertSafeFact(fact: BusinessConnectSafeFact): void {
  if (!ALLOWED_SOURCE_DOMAINS.has(fact.sourceDomain)) {
    throw new Error(`[BC-9.0 redaction] fact.sourceDomain not in allowlist: ${fact.sourceDomain}`);
  }
  if (!isSafeRef(fact.ref)) {
    throw new Error(`[BC-9.0 redaction] fact.ref missing safe shape`);
  }
  for (const key of Object.keys(fact)) {
    if (FORBIDDEN_FACT_KEYS.has(key)) {
      throw new Error(`[BC-9.0 redaction] forbidden field on ${fact.kind}: ${key}`);
    }
  }
}

/** Redact an entire context envelope. Pure — returns a new envelope. */
export function redactBusinessConnectAIContext(
  envelope: BusinessConnectAIContextEnvelope,
): BusinessConnectAIContextEnvelope {
  for (const fact of envelope.safeFacts) assertSafeFact(fact);

  // Envelope-level scrub: strip any accidental raw ids from viewerContext.
  const viewerRef = envelope.viewerContext.viewerRef;
  if (!isSafeRef(viewerRef)) {
    throw new Error("[BC-9.0 redaction] viewerContext.viewerRef unsafe");
  }
  if (viewerRef.id.length > 128) {
    throw new Error("[BC-9.0 redaction] viewerContext.viewerRef.id too long");
  }

  return Object.freeze({
    ...envelope,
    safeFacts: Object.freeze([...envelope.safeFacts]),
    exclusions: Object.freeze([
      "private meeting notes",
      "hidden contact details",
      "cross-tenant data",
      ...envelope.exclusions,
    ]),
    sourceVersions: Object.freeze({ ...envelope.sourceVersions }),
  });
}
