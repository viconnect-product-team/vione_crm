// BC-6.6 — Outcome Event Consumer: internal contract.
//
// Infrastructure layer. Consumes introduction_outcome events produced by
// BC-6.5 and dispatches them to internal adapters. Does NOT redefine
// outcome semantics — the event kind + status + outcomeType are the
// canonical contract owned by BC-6.4/6.5.
//
// Not part of the public SDK. Do not export from src/lib/graph/index.ts.

export const OUTCOME_EVENT_SCHEMA_VERSION = "1.0.0" as const;

/** Frozen allowlist. Must mirror `intro_outcome_emit_event` kinds. */
export const OUTCOME_EVENT_KINDS = [
  "introduction_outcome_created",
  "introduction_outcome_connected",
  "introduction_outcome_progressed",
  "introduction_outcome_no_outcome",
  "introduction_outcome_expired",
] as const;
export type OutcomeEventKind = (typeof OUTCOME_EVENT_KINDS)[number];

export function isSupportedOutcomeEventKind(k: string): k is OutcomeEventKind {
  return (OUTCOME_EVENT_KINDS as readonly string[]).includes(k);
}

/** Frozen dispatch status vocabulary. Mirrors DB check constraint. */
export const DISPATCH_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "retry_scheduled",
  "dead_lettered",
] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

/**
 * Normalized internal envelope crossing the adapter boundary. Intentionally
 * PII-free: only ids + coarse enums + timestamps.
 */
export interface OutcomeEventEnvelope {
  eventId: string; // graph_outbox_events.id
  idempotencyKey: string;
  eventType: OutcomeEventKind;
  aggregateType: "introduction_outcome";
  aggregateId: string; // introduction_outcomes.id
  outcomeId: string;
  status: string | null; // outcome.status
  outcomeType: string | null; // outcome.outcome_type
  outcomeSource: string | null; // outcome.outcome_source
  occurredAt: string; // ISO timestamp
  schemaVersion: string;
  // Transport metadata
  attemptCount: number;
  firstSeenAt: string;
  lastAttemptAt: string;
}

export type AdapterResultKind = "success" | "retryable_failure" | "permanent_failure";

export interface AdapterResult {
  kind: AdapterResultKind;
  errorCode?: string;
  errorMessage?: string; // debug only, never persisted with PII
}

export interface OutcomeEventDispatchAdapter {
  readonly name: string;
  readonly enabled: boolean;
  readonly required: boolean;
  readonly subscribedEventTypes: readonly OutcomeEventKind[];
  readonly timeoutMs: number;
  readonly maxAttempts: number;
  dispatch(event: OutcomeEventEnvelope): Promise<AdapterResult>;
}

/** Frozen retry backoff schedule (minutes). Index = attemptCount (1-based). */
export const RETRY_BACKOFF_MINUTES: readonly number[] = [1, 5, 15, 60, 360];

/** Bounded jitter (±%) applied to backoff scheduling. Operational only. */
export const RETRY_JITTER_RATIO = 0.15;

/** Batch policy — bounded per docs/OUTCOME_EVENT_ARCHITECTURE. */
export const CONSUMER_BATCH_DEFAULT = 100;
export const CONSUMER_BATCH_MAX = 500;

export const CONSUMER_ERROR_CODES = [
  "UNSUPPORTED_EVENT_KIND",
  "UNSUPPORTED_SCHEMA_VERSION",
  "MALFORMED_PAYLOAD",
  "UNKNOWN_ADAPTER",
  "ADAPTER_DISABLED",
  "ADAPTER_TIMEOUT",
  "ADAPTER_TRANSIENT",
  "ADAPTER_PERMANENT",
  "ORDER_GUARD_DEFER",
  "INTERNAL_ERROR",
] as const;
export type ConsumerErrorCode = (typeof CONSUMER_ERROR_CODES)[number];

export function computeNextAttemptAt(
  attempt: number,
  now: Date = new Date(),
): { nextAt: Date; exhausted: boolean } {
  const idx = Math.min(Math.max(attempt - 1, 0), RETRY_BACKOFF_MINUTES.length - 1);
  const baseMin = RETRY_BACKOFF_MINUTES[idx];
  // Deterministic-ish jitter based on attempt to avoid RNG in tests.
  const jitter = 1 + (((attempt * 7) % 100) / 100) * RETRY_JITTER_RATIO - RETRY_JITTER_RATIO / 2;
  const ms = Math.round(baseMin * 60_000 * jitter);
  return {
    nextAt: new Date(now.getTime() + ms),
    exhausted: attempt >= RETRY_BACKOFF_MINUTES.length,
  };
}
