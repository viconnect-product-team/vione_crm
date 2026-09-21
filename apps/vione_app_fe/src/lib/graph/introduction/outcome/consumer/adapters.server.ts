// BC-6.6 — Built-in outcome event adapters.
//
// Adapters MUST:
// - be PII-safe (accept only ids + enums + timestamps).
// - be idempotent on the receiving side (the consumer already dedupes per
//   (outbox_event_id, adapter_name), but adapters shipping to external
//   pipelines should also use eventId as their dedupe key).
// - classify failures via AdapterResult.

import type { AdapterResult, OutcomeEventDispatchAdapter, OutcomeEventEnvelope } from "./types";
import { OUTCOME_EVENT_KINDS } from "./types";

const ALL_KINDS = OUTCOME_EVENT_KINDS;

/** Analytics adapter — feeds internal analytics pipeline. Required. */
export class AnalyticsAdapter implements OutcomeEventDispatchAdapter {
  readonly name = "analytics";
  readonly enabled = true;
  readonly required = true;
  readonly subscribedEventTypes = ALL_KINDS;
  readonly timeoutMs = 5_000;
  readonly maxAttempts = 5;

  async dispatch(event: OutcomeEventEnvelope): Promise<AdapterResult> {
    try {
      // Emit compact, PII-free row. The upstream analytics table is owned by
      // the platform; here we just log to stdout so the platform log
      // aggregator picks it up. Swap this transport when a first-class
      // analytics ingest exists.
      console.log(
        JSON.stringify({
          _channel: "bc.analytics.introduction_outcome",
          eventId: event.eventId,
          eventType: event.eventType,
          outcomeType: event.outcomeType,
          outcomeSource: event.outcomeSource,
          status: event.status,
          occurredAt: event.occurredAt,
          schemaVersion: event.schemaVersion,
        }),
      );
      return { kind: "success" };
    } catch (e) {
      return {
        kind: "retryable_failure",
        errorCode: "ADAPTER_TRANSIENT",
        errorMessage: (e as Error).message,
      };
    }
  }
}

/** Notification adapter — emits a notification INTENT only. Optional. */
export class NotificationIntentAdapter implements OutcomeEventDispatchAdapter {
  readonly name = "notification";
  readonly enabled = true;
  readonly required = false;
  readonly subscribedEventTypes = [
    "introduction_outcome_connected",
    "introduction_outcome_progressed",
    "introduction_outcome_expired",
  ] as const;
  readonly timeoutMs = 5_000;
  readonly maxAttempts = 5;

  async dispatch(event: OutcomeEventEnvelope): Promise<AdapterResult> {
    try {
      console.log(
        JSON.stringify({
          _channel: "bc.notification.intent",
          eventId: event.eventId,
          intent: "introduction_outcome_" + (event.outcomeType ?? event.status ?? "update"),
          outcomeId: event.outcomeId,
          occurredAt: event.occurredAt,
        }),
      );
      return { kind: "success" };
    } catch (e) {
      return {
        kind: "retryable_failure",
        errorCode: "ADAPTER_TRANSIENT",
        errorMessage: (e as Error).message,
      };
    }
  }
}

/** Audit / observability adapter — records consumption metrics. Required. */
export class AuditAdapter implements OutcomeEventDispatchAdapter {
  readonly name = "audit";
  readonly enabled = true;
  readonly required = true;
  readonly subscribedEventTypes = ALL_KINDS;
  readonly timeoutMs = 3_000;
  readonly maxAttempts = 5;

  async dispatch(event: OutcomeEventEnvelope): Promise<AdapterResult> {
    try {
      console.log(
        JSON.stringify({
          _channel: "bc.audit.outcome_event",
          eventId: event.eventId,
          eventType: event.eventType,
          attemptCount: event.attemptCount,
          firstSeenAt: event.firstSeenAt,
          lastAttemptAt: event.lastAttemptAt,
        }),
      );
      return { kind: "success" };
    } catch (e) {
      return {
        kind: "retryable_failure",
        errorCode: "ADAPTER_TRANSIENT",
        errorMessage: (e as Error).message,
      };
    }
  }
}
