// BC-9.0 — Business Connect Intelligence: frozen error contract (§64).

export const BUSINESS_CONNECT_AI_ERROR_CODES = [
  "BUSINESS_CONNECT_AI_UNAUTHENTICATED",
  "BUSINESS_CONNECT_AI_FORBIDDEN",
  "BUSINESS_CONNECT_AI_CAPABILITY_DISABLED",
  "BUSINESS_CONNECT_AI_SCOPE_INVALID",
  "BUSINESS_CONNECT_AI_INSUFFICIENT_DATA",
  "BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE",
  "BUSINESS_CONNECT_AI_RATE_LIMITED",
  "BUSINESS_CONNECT_AI_CONTEXT_TOO_LARGE",
  "BUSINESS_CONNECT_AI_INVALID_RESPONSE",
  "BUSINESS_CONNECT_AI_RESULT_STALE",
  "BUSINESS_CONNECT_AI_TOOL_FAILED",
  "BUSINESS_CONNECT_AI_TIMEOUT",
  "BUSINESS_CONNECT_AI_INTERNAL_ERROR",
] as const;
export type BusinessConnectAIErrorCode = (typeof BUSINESS_CONNECT_AI_ERROR_CODES)[number];

export class BusinessConnectAIError extends Error {
  readonly code: BusinessConnectAIErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: BusinessConnectAIErrorCode,
    message?: string,
    details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "BusinessConnectAIError";
    this.code = code;
    this.details = details ? Object.freeze({ ...details }) : undefined;
  }
}

export function toBusinessConnectAIErrorCode(err: unknown): BusinessConnectAIErrorCode {
  if (err instanceof BusinessConnectAIError) return err.code;
  return "BUSINESS_CONNECT_AI_INTERNAL_ERROR";
}
