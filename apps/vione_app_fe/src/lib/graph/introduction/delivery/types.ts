// BC-6.3 — Introduction Delivery — client-safe DTOs, constants, errors.
import type { IntroductionConfidence, IntroductionReasonCode } from "../types";

export const INTRODUCTION_DELIVERY_VERSION = "1.0.0" as const;
export const INTRODUCTION_DELIVERY_MAX_NOTE = 500;
export const INTRODUCTION_DELIVERY_EXPIRY_DAYS = 30;

export type IntroductionDeliveryStatus = "delivered" | "acknowledged" | "revoked" | "expired";

export const INTRODUCTION_DELIVERY_STATUSES: readonly IntroductionDeliveryStatus[] = [
  "delivered",
  "acknowledged",
  "revoked",
  "expired",
] as const;

export const INTRODUCTION_DELIVERY_TERMINAL: ReadonlySet<IntroductionDeliveryStatus> = new Set([
  "acknowledged",
  "revoked",
  "expired",
]);

export interface IntroductionDeliveryParticipantDTO {
  personNodeId: string;
}

export interface IntroductionDeliverySummaryDTO {
  pathId: string;
  depth: 2 | 3;
  confidence: IntroductionConfidence;
  reasonCodes: IntroductionReasonCode[];
  introductionVersion: string;
  strengthVersion: string;
}

export interface IntroductionDeliveryDTO {
  id: string;
  introductionRequestId: string;
  requester: IntroductionDeliveryParticipantDTO;
  intermediary: IntroductionDeliveryParticipantDTO;
  target: IntroductionDeliveryParticipantDTO;
  status: IntroductionDeliveryStatus;
  /** Present only to intermediary + target. Never rendered as HTML. */
  deliveryNote?: string;
  deliverySummary: IntroductionDeliverySummaryDTO;
  createdAt: string;
  deliveredAt?: string | null;
  acknowledgedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
}

export interface DeliverIntroductionInput {
  introductionRequestId: string;
  deliveryNote?: string;
  idempotencyKey?: string;
}

export interface ListDeliveriesOptions {
  status?: "active" | "terminal" | "all";
  limit?: number;
  cursor?: string | null;
}

export interface IntroductionDeliveryPageDTO {
  items: IntroductionDeliveryDTO[];
  nextCursor: string | null;
}

/** Row from `accepted introduction_requests` awaiting delivery. */
export interface PendingDeliveryItemDTO {
  introductionRequestId: string;
  requester: IntroductionDeliveryParticipantDTO;
  intermediary: IntroductionDeliveryParticipantDTO;
  target: IntroductionDeliveryParticipantDTO;
  selectedPath: IntroductionDeliverySummaryDTO;
  acceptedAt: string;
}

export const INTRODUCTION_DELIVERY_ERROR_CODES = [
  "INTRO_DELIVERY_REQUEST_NOT_ACCEPTED",
  "INTRO_DELIVERY_NOT_FOUND",
  "INTRO_DELIVERY_ALREADY_EXISTS",
  "INTRO_DELIVERY_NOT_OWNED",
  "INTRO_DELIVERY_TARGET_UNAVAILABLE",
  "INTRO_DELIVERY_BLOCKED",
  "INTRO_DELIVERY_NOTE_INVALID",
  "INTRO_DELIVERY_NOT_DELIVERED",
  "INTRO_DELIVERY_ALREADY_ACKNOWLEDGED",
  "INTRO_DELIVERY_CANNOT_REVOKE",
  "INTRO_DELIVERY_EXPIRED",
  "INTRO_DELIVERY_IDEMPOTENCY_CONFLICT",
  "INTRO_DELIVERY_FORBIDDEN",
  "INTRO_DELIVERY_INTERNAL_ERROR",
] as const;

export type IntroductionDeliveryErrorCode = (typeof INTRODUCTION_DELIVERY_ERROR_CODES)[number];

export class IntroductionDeliveryError extends Error {
  readonly code: IntroductionDeliveryErrorCode;
  constructor(code: IntroductionDeliveryErrorCode, message?: string) {
    super(message ?? code);
    this.name = "IntroductionDeliveryError";
    this.code = code;
  }
}

const CODE_SET: ReadonlySet<string> = new Set(INTRODUCTION_DELIVERY_ERROR_CODES);

export function toIntroductionDeliveryError(err: unknown): IntroductionDeliveryError {
  if (err instanceof IntroductionDeliveryError) return err;
  const anyErr = err as { code?: string; message?: string } | null;
  const raw = anyErr?.code ?? anyErr?.message ?? "";
  const match = INTRODUCTION_DELIVERY_ERROR_CODES.find((c) => raw.includes(c));
  if (match) return new IntroductionDeliveryError(match);
  if (raw && CODE_SET.has(raw))
    return new IntroductionDeliveryError(raw as IntroductionDeliveryErrorCode);
  return new IntroductionDeliveryError("INTRO_DELIVERY_INTERNAL_ERROR");
}

/** Pure state-machine transition guard. */
export function canTransition(
  from: IntroductionDeliveryStatus,
  to: IntroductionDeliveryStatus,
): boolean {
  if (from !== "delivered") return false;
  return to === "acknowledged" || to === "revoked" || to === "expired";
}
