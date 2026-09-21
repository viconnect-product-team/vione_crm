// BC-6.4 — Introduction Outcome — client-safe DTOs, constants, errors.

export const INTRODUCTION_OUTCOME_VERSION = "1.0.0" as const;
export const INTRODUCTION_OUTCOME_MAX_NOTE = 500;
export const INTRODUCTION_OUTCOME_WINDOW_DAYS = 60;

export type IntroductionOutcomeStatus = "pending" | "resolved" | "expired";

export const INTRODUCTION_OUTCOME_STATUSES: readonly IntroductionOutcomeStatus[] = [
  "pending",
  "resolved",
  "expired",
] as const;

export type IntroductionOutcomeType =
  | "connected"
  | "progressed"
  | "not_connected"
  | "closed_no_outcome";

export const INTRODUCTION_OUTCOME_TYPES: readonly IntroductionOutcomeType[] = [
  "connected",
  "progressed",
  "not_connected",
  "closed_no_outcome",
] as const;

export type IntroductionOutcomeSource =
  | "observed_connection"
  | "declared_requester"
  | "declared_intermediary"
  | "window_expired"
  | "system_event";

export interface IntroductionOutcomeParticipantDTO {
  personNodeId: string;
}

export interface IntroductionOutcomeDTO {
  id: string;
  introductionDeliveryId: string;
  introductionRequestId: string;
  status: IntroductionOutcomeStatus;
  outcomeType: IntroductionOutcomeType | null;
  outcomeSource: IntroductionOutcomeSource | null;
  requester: IntroductionOutcomeParticipantDTO;
  intermediary: IntroductionOutcomeParticipantDTO;
  target: IntroductionOutcomeParticipantDTO;
  /** Only visible to requester + intermediary. */
  outcomeNote?: string;
  acknowledgedAt: string | null;
  connectionObservedAt: string | null;
  progressedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntroductionOutcomePageDTO {
  items: IntroductionOutcomeDTO[];
  nextCursor: string | null;
}

export interface ListOutcomesOptions {
  status?: "pending" | "resolved" | "expired" | "all";
  limit?: number;
  cursor?: string | null;
}

export interface MarkProgressedInput {
  outcomeId: string;
  note?: string;
}

export const INTRODUCTION_OUTCOME_ERROR_CODES = [
  "INTRO_OUTCOME_NOT_FOUND",
  "INTRO_OUTCOME_NOT_PENDING",
  "INTRO_OUTCOME_ALREADY_RESOLVED",
  "INTRO_OUTCOME_EXPIRED",
  "INTRO_OUTCOME_NOT_OWNED",
  "INTRO_OUTCOME_INVALID_TRANSITION",
  "INTRO_OUTCOME_NOTE_INVALID",
  "INTRO_OUTCOME_FORBIDDEN",
  "INTRO_OUTCOME_INTERNAL_ERROR",
] as const;

export type IntroductionOutcomeErrorCode = (typeof INTRODUCTION_OUTCOME_ERROR_CODES)[number];

export class IntroductionOutcomeError extends Error {
  readonly code: IntroductionOutcomeErrorCode;
  constructor(code: IntroductionOutcomeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "IntroductionOutcomeError";
    this.code = code;
  }
}

const CODE_SET: ReadonlySet<string> = new Set(INTRODUCTION_OUTCOME_ERROR_CODES);

export function toIntroductionOutcomeError(err: unknown): IntroductionOutcomeError {
  if (err instanceof IntroductionOutcomeError) return err;
  const anyErr = err as { code?: string; message?: string } | null;
  const raw = anyErr?.code ?? anyErr?.message ?? "";
  const match = INTRODUCTION_OUTCOME_ERROR_CODES.find((c) => raw.includes(c));
  if (match) return new IntroductionOutcomeError(match);
  if (raw && CODE_SET.has(raw))
    return new IntroductionOutcomeError(raw as IntroductionOutcomeErrorCode);
  return new IntroductionOutcomeError("INTRO_OUTCOME_INTERNAL_ERROR");
}

/** Pure state-machine guard. pending → resolved | expired, both terminal. */
export function canTransition(
  from: IntroductionOutcomeStatus,
  to: IntroductionOutcomeStatus,
): boolean {
  if (from !== "pending") return false;
  return to === "resolved" || to === "expired";
}

export const INTRODUCTION_OUTCOME_TERMINAL: ReadonlySet<IntroductionOutcomeStatus> = new Set([
  "resolved",
  "expired",
]);
