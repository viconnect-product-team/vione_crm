// BC-3.1B — Safe, structured telemetry for global networking.
// Emits low-cardinality operational events only. NEVER logs private note
// content, hidden contact data, sensitive reason text, or full profile
// payloads. Correlation/mutation identifiers are safe to include.

import type { NetworkErrorCode } from "./errors";

export type NetworkTelemetryEvent = {
  op:
    | "send_request"
    | "accept"
    | "decline"
    | "cancel"
    | "disconnect"
    | "block"
    | "unblock"
    | "get_state"
    | "list"
    | "count";
  outcome: "ok" | "error" | "replay";
  errorCode?: NetworkErrorCode;
  /** Safe correlation id (mutation key or connection id) — never PII. */
  correlationId?: string | null;
  durationMs?: number;
  itemCount?: number;
};

/**
 * Structured emit. Kept dependency-free so it is safe in the Worker runtime.
 * A future sink (audit table / metrics) can replace the console emit without
 * touching call sites.
 */
export function emitNetworkTelemetry(event: NetworkTelemetryEvent): void {
  try {
    console.info("[global-network]", JSON.stringify(event));
  } catch {
    // Telemetry must never throw into the request path.
  }
}

/** Measure and emit around an async operation, mapping outcome automatically. */
export async function withTelemetry<T>(
  op: NetworkTelemetryEvent["op"],
  correlationId: string | null | undefined,
  fn: () => Promise<T>,
  meta?: (result: T) => Partial<NetworkTelemetryEvent>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    emitNetworkTelemetry({
      op,
      outcome: "ok",
      correlationId: correlationId ?? null,
      durationMs: Date.now() - start,
      ...(meta ? meta(result) : {}),
    });
    return result;
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: NetworkErrorCode }).code
        : undefined;
    emitNetworkTelemetry({
      op,
      outcome: "error",
      correlationId: correlationId ?? null,
      durationMs: Date.now() - start,
      errorCode: code,
    });
    throw err;
  }
}
