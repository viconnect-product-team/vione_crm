// BC-4.2 — Metadata validation for graph writes.
// Enforces the registry allowlist: allowlisted keys only, scalar values only,
// bounded string length and key count. Unknown fields are deterministically
// dropped (not rejected) to keep replays idempotent.

import type { GraphMetadata } from "./types";

const MAX_KEYS = 32;
const MAX_STRING = 512;

export function validateAndProject(
  metadata: Record<string, unknown> | undefined | null,
  allowlist: readonly string[],
): GraphMetadata {
  const out: GraphMetadata = {};
  if (!metadata) return out;
  if (typeof metadata !== "object" || Array.isArray(metadata)) return out;

  let count = 0;
  for (const key of allowlist) {
    if (count >= MAX_KEYS) break;
    if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;
    const v = (metadata as Record<string, unknown>)[key];
    if (v === null) {
      out[key] = null;
      count++;
      continue;
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
      count++;
      continue;
    }
    if (typeof v === "boolean") {
      out[key] = v;
      count++;
      continue;
    }
    if (typeof v === "string") {
      out[key] = v.length > MAX_STRING ? v.slice(0, MAX_STRING) : v;
      count++;
      continue;
    }
    // Non-scalar → dropped
  }
  return out;
}

/** Deterministic dedupe key: `edge:<id>` matches the DB helper. */
export function timelineDedupeKey(edgeId: string): string {
  return `edge:${edgeId}`;
}
