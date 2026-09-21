// BC-7.8 Turn C — Meeting-scoped timeline metadata projection allowlist.
//
// Mirrors the safety envelope of the relationship-timeline projection
// (BC-7.5B): only stable, PII-safe scalar fields flow into the UI.

const ALLOWED_KEYS = [
  "proposalId",
  "proposalVersion",
  "previousStatus",
  "newStatus",
  "responseStatus",
  "reasonCode",
  "sourceType",
  "timezone",
  "durationMinutes",
] as const;

export function projectMeetingEventMetadata(
  raw: unknown,
): Record<string, string | number | boolean | null> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string | number | boolean | null> = {};
  const src = raw as Record<string, unknown>;
  for (const key of ALLOWED_KEYS) {
    const v = src[key];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
      out[key] = v;
    }
  }
  return out;
}
