// BC-9.1 Turn C1 — Display helpers for Relationship Memory DTOs.
//
// The plain RelationshipMemoryDTO does not carry a pre-rendered canonicalText
// (that's only in the search DTO). We derive a safe, deterministic display
// string from canonicalValue without leaking arbitrary raw structures.

import type { RelationshipMemoryDTO } from "@/lib/business-connect/relationship-memory";

const TEXT_FIELDS = ["text", "label", "summary", "title", "value"] as const;

/**
 * Extract a short human-readable string from a memory's canonical value.
 * Never returns raw JSON dumps — falls back to canonicalKey.
 */
export function memoryDisplayText(m: RelationshipMemoryDTO): string {
  const v = m.canonicalValue ?? {};
  for (const f of TEXT_FIELDS) {
    const raw = (v as Record<string, unknown>)[f];
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim().slice(0, 280);
    }
  }
  // Fall back to canonicalKey (a hashed / normalized key). Keep it short.
  return m.canonicalKey.slice(0, 80);
}

/** Compact secondary description if available; never leaks structure. */
export function memoryDetail(m: RelationshipMemoryDTO): string | null {
  const v = m.canonicalValue ?? {};
  const raw = (v as Record<string, unknown>)["detail"];
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().slice(0, 400);
  }
  return null;
}
