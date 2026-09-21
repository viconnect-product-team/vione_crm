// BC-8.1 §Z — Pure error classification. No PII in outputs.

export type NotificationDispatchClassification =
  | "retryable"
  | "permanent"
  | "suppressed"
  | "provider_unavailable"
  | "malformed"
  | "unknown";

/** Stable internal error codes. Never persist raw provider errors. */
export const NOTIFICATION_INTERNAL_ERROR_CODES = [
  "timeout",
  "rate_limited",
  "provider_5xx",
  "provider_temporary_unavailable",
  "provider_unavailable",
  "invalid_recipient",
  "revoked_token",
  "unsupported_channel",
  "malformed_payload",
  "recipient_ineligible",
  "network_error",
  "unknown",
] as const;
export type NotificationInternalErrorCode = (typeof NOTIFICATION_INTERNAL_ERROR_CODES)[number];

const RETRYABLE = new Set<NotificationInternalErrorCode>([
  "timeout",
  "rate_limited",
  "provider_5xx",
  "provider_temporary_unavailable",
  "network_error",
]);
const PERMANENT = new Set<NotificationInternalErrorCode>([
  "invalid_recipient",
  "revoked_token",
  "recipient_ineligible",
]);

export function classifyNotificationDispatchError(input: {
  code?: string | null;
  message?: string | null;
}): { classification: NotificationDispatchClassification; code: NotificationInternalErrorCode } {
  const raw = (input.code ?? "").toLowerCase();
  if (!raw) return { classification: "unknown", code: "unknown" };

  const canonical = (NOTIFICATION_INTERNAL_ERROR_CODES as readonly string[]).includes(raw)
    ? (raw as NotificationInternalErrorCode)
    : mapExternalCode(raw);

  if (canonical === "provider_unavailable")
    return { classification: "provider_unavailable", code: canonical };
  if (canonical === "unsupported_channel")
    return { classification: "provider_unavailable", code: canonical };
  if (canonical === "malformed_payload") return { classification: "malformed", code: canonical };
  if (RETRYABLE.has(canonical)) return { classification: "retryable", code: canonical };
  if (PERMANENT.has(canonical)) return { classification: "permanent", code: canonical };
  return { classification: "unknown", code: canonical };
}

function mapExternalCode(raw: string): NotificationInternalErrorCode {
  if (raw.includes("timeout")) return "timeout";
  if (raw.includes("rate")) return "rate_limited";
  if (raw.startsWith("5")) return "provider_5xx";
  if (raw.includes("network") || raw.includes("econn")) return "network_error";
  if (raw.includes("invalid") && raw.includes("recipient")) return "invalid_recipient";
  if (raw.includes("token") && raw.includes("revok")) return "revoked_token";
  if (raw.includes("unsupported")) return "unsupported_channel";
  if (raw.includes("malformed")) return "malformed_payload";
  return "unknown";
}
