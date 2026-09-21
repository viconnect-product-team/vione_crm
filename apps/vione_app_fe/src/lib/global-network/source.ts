// BC-3.1A — Server-side source normalization for global connections.
// Rejects arbitrary client strings; falls back to a safe default.

import { GLOBAL_CONNECTION_SOURCE_TYPES, type GlobalConnectionSourceType } from "./types";

const ALLOWED = new Set<string>(GLOBAL_CONNECTION_SOURCE_TYPES);

export const DEFAULT_SOURCE_TYPE: GlobalConnectionSourceType = "manual";

/** Normalize a caller-supplied source type to a known enum value. */
export function normalizeSourceType(input: unknown): GlobalConnectionSourceType {
  if (typeof input === "string" && ALLOWED.has(input)) {
    return input as GlobalConnectionSourceType;
  }
  return DEFAULT_SOURCE_TYPE;
}

/** Normalize an optional source id (uuid) — anything else becomes null. */
export function normalizeSourceId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuid.test(input) ? input : null;
}
