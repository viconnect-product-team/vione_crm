// BC-3.1A — Stable global-network domain errors.
// Raw PostgreSQL / RLS error text must never reach clients; map to these.

export const NETWORK_ERROR_CODES = [
  "NETWORK_AUTH_REQUIRED",
  "NETWORK_ACCOUNT_INACTIVE",
  "NETWORK_ACCOUNT_SUSPENDED",
  "NETWORK_SELF_CONNECTION",
  "NETWORK_TARGET_NOT_FOUND",
  "NETWORK_TARGET_UNAVAILABLE",
  "NETWORK_ALREADY_PENDING",
  "NETWORK_ALREADY_CONNECTED",
  "NETWORK_BLOCKED",
  "NETWORK_CONNECTION_NOT_FOUND",
  "NETWORK_NOT_PARTICIPANT",
  "NETWORK_INVALID_TRANSITION",
  "NETWORK_NOT_REQUESTER",
  "NETWORK_NOT_RECIPIENT",
  "NETWORK_RATE_LIMITED",
  "NETWORK_PAIR_COOLDOWN",
  "NETWORK_REPORT_RATE_LIMITED",
  "NETWORK_MUTATION_CONFLICT",
  "NETWORK_IMMUTABLE_FIELD",
  "NETWORK_UNKNOWN",
] as const;

export type NetworkErrorCode = (typeof NETWORK_ERROR_CODES)[number];

export class GlobalNetworkError extends Error {
  readonly code: NetworkErrorCode;
  constructor(code: NetworkErrorCode, message?: string) {
    super(message ?? code);
    this.name = "GlobalNetworkError";
    this.code = code;
  }
}

const KNOWN = new Set<string>(NETWORK_ERROR_CODES);

/**
 * Translate a raw DB/RLS error into a stable domain error. Any error whose
 * message contains one of the known NETWORK_* codes is surfaced as that code;
 * everything else collapses to NETWORK_UNKNOWN so raw SQL never leaks.
 */
export function toGlobalNetworkError(err: unknown): GlobalNetworkError {
  if (err instanceof GlobalNetworkError) return err;
  const raw = err instanceof Error ? err.message : String(err ?? "");
  for (const code of NETWORK_ERROR_CODES) {
    if (raw.includes(code)) return new GlobalNetworkError(code);
  }
  // Common Postgres signals mapped defensively.
  if (/duplicate key|unique_violation|user_connections_active_pair_uq/i.test(raw)) {
    return new GlobalNetworkError("NETWORK_MUTATION_CONFLICT");
  }
  if (/row-level security|permission denied/i.test(raw)) {
    return new GlobalNetworkError("NETWORK_NOT_PARTICIPANT");
  }
  return new GlobalNetworkError("NETWORK_UNKNOWN");
}

export function isNetworkErrorCode(value: string): value is NetworkErrorCode {
  return KNOWN.has(value);
}
