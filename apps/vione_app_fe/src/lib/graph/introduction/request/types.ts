// BC-6.2 — Introduction Request Workflow — client-safe DTOs & constants.
import type { IntroductionConfidence, IntroductionReasonCode } from "../types";

export const INTRODUCTION_REQUEST_VERSION = "1.0.0" as const;
export const INTRODUCTION_REQUEST_MAX_NOTE = 500;
export const INTRODUCTION_REQUEST_EXPIRY_DAYS = 14;

export type IntroductionRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export const INTRODUCTION_REQUEST_STATUSES: readonly IntroductionRequestStatus[] = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
] as const;

export const INTRODUCTION_REQUEST_TERMINAL: ReadonlySet<IntroductionRequestStatus> = new Set([
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);

export interface IntroductionRequestParticipantDTO {
  personNodeId: string;
}

export interface SelectedPathSummaryDTO {
  pathId: string;
  depth: 2 | 3;
  confidence: IntroductionConfidence;
  reasonCodes: IntroductionReasonCode[];
  introductionVersion: string;
  strengthVersion: string;
}

export interface IntroductionRequestDTO {
  id: string;
  requester: IntroductionRequestParticipantDTO;
  intermediary: IntroductionRequestParticipantDTO;
  target: IntroductionRequestParticipantDTO;
  status: IntroductionRequestStatus;
  /** Present only when viewer is participant. Never rendered as HTML. */
  requestNote?: string;
  selectedPath: SelectedPathSummaryDTO;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
}

export interface SendIntroductionRequestInput {
  targetPersonNodeId: string;
  pathId: string;
  requestNote?: string;
  idempotencyKey?: string;
}

export interface ListRequestsOptions {
  status?: "pending" | "terminal" | "all";
  limit?: number;
  cursor?: string | null;
}

export interface IntroductionRequestPageDTO {
  items: IntroductionRequestDTO[];
  nextCursor: string | null;
}

/** Immutable snapshot persisted at send time — no hidden topology, no raw scores. */
export interface IntroductionPathSnapshot {
  pathId: string;
  introductionVersion: string;
  strengthVersion: string;
  depth: 2 | 3;
  intermediaryNodeIds: string[];
  targetNodeId: string;
  confidence: IntroductionConfidence;
  reasonCodes: IntroductionReasonCode[];
  generatedAt: string;
}

export const INTRODUCTION_REQUEST_ERROR_CODES = [
  "INTRO_REQUEST_NOT_FOUND",
  "INTRO_REQUEST_NOT_PENDING",
  "INTRO_REQUEST_NOT_OWNED",
  "INTRO_REQUEST_ALREADY_EXISTS",
  "INTRO_REQUEST_PATH_INVALID",
  "INTRO_REQUEST_PATH_UNSUPPORTED",
  "INTRO_REQUEST_INTERMEDIARY_UNAVAILABLE",
  "INTRO_REQUEST_TARGET_ALREADY_CONNECTED",
  "INTRO_REQUEST_BLOCKED",
  "INTRO_REQUEST_EXPIRED",
  "INTRO_REQUEST_NOTE_INVALID",
  "INTRO_REQUEST_IDEMPOTENCY_CONFLICT",
  "INTRO_REQUEST_FORBIDDEN",
  "INTRO_REQUEST_INTERNAL_ERROR",
] as const;

export type IntroductionRequestErrorCode = (typeof INTRODUCTION_REQUEST_ERROR_CODES)[number];

export class IntroductionRequestError extends Error {
  readonly code: IntroductionRequestErrorCode;
  constructor(code: IntroductionRequestErrorCode, message?: string) {
    super(message ?? code);
    this.name = "IntroductionRequestError";
    this.code = code;
  }
}

const CODE_SET: ReadonlySet<string> = new Set(INTRODUCTION_REQUEST_ERROR_CODES);

/** Normalize any unknown error into a stable IntroductionRequestError. */
export function toIntroductionRequestError(err: unknown): IntroductionRequestError {
  if (err instanceof IntroductionRequestError) return err;
  const anyErr = err as { code?: string; message?: string } | null;
  const raw = anyErr?.code ?? anyErr?.message ?? "";
  const match = INTRODUCTION_REQUEST_ERROR_CODES.find((c) => raw.includes(c));
  if (match) return new IntroductionRequestError(match);
  if (raw && CODE_SET.has(raw))
    return new IntroductionRequestError(raw as IntroductionRequestErrorCode);
  return new IntroductionRequestError("INTRO_REQUEST_INTERNAL_ERROR");
}

/** State-machine transition guard (pure). */
export function canTransition(
  from: IntroductionRequestStatus,
  to: IntroductionRequestStatus,
): boolean {
  if (from !== "pending") return false;
  return to === "accepted" || to === "declined" || to === "cancelled" || to === "expired";
}
