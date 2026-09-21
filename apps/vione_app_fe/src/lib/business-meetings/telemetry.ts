// BC-4.1B — Safe, structured telemetry for Business Meetings.
// Low-cardinality operational events only. NEVER logs meeting URL, proposal
// message, description, private location text, hidden contacts, full participant
// payloads, or auth tokens. Correlation ids (mutation key / meeting id) are safe.

import type { MeetingErrorCode } from "./errors";

export type MeetingTelemetryOp =
  | "create_draft"
  | "propose"
  | "accept"
  | "decline"
  | "tentative"
  | "reschedule"
  | "cancel"
  | "complete"
  | "mark_no_show"
  | "get_detail"
  | "list"
  | "count"
  | "proposal_history"
  | "target_resolution";

export type MeetingTelemetryEvent = {
  op: MeetingTelemetryOp;
  outcome: "ok" | "error" | "replay";
  errorCode?: MeetingErrorCode;
  /** Safe correlation id (mutation key or meeting id) — never PII. */
  correlationId?: string | null;
  durationMs?: number;
  itemCount?: number;
};

export function emitMeetingTelemetry(event: MeetingTelemetryEvent): void {
  try {
    console.info("[business-meetings]", JSON.stringify(event));
  } catch {
    // Telemetry must never throw into the request path.
  }
}

/** Measure + emit around an async op, mapping outcome/error code automatically. */
export async function withMeetingTelemetry<T>(
  op: MeetingTelemetryOp,
  correlationId: string | null | undefined,
  fn: () => Promise<T>,
  meta?: (result: T) => Partial<MeetingTelemetryEvent>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    emitMeetingTelemetry({
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
        ? (err as { code: MeetingErrorCode }).code
        : undefined;
    emitMeetingTelemetry({
      op,
      outcome: "error",
      correlationId: correlationId ?? null,
      durationMs: Date.now() - start,
      errorCode: code,
    });
    throw err;
  }
}
