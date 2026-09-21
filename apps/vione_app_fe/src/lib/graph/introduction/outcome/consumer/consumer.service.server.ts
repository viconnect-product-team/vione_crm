// BC-6.6 — OutcomeEventConsumer.
//
// One process pass:
//   consumeBatch() ▶ claim ▶ per event: order guard ▶ validate ▶ fan-out ▶
//                    retry classification ▶ finalize|release ▶ metrics.
//
// Business semantics live in BC-6.4/6.5 — this service must NEVER mutate
// introduction_outcomes rows.

import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultRegistry, OutcomeDispatchRegistry } from "./registry.server";
import { OutcomeEventConsumerRepository } from "./repository.server";
import type {
  AdapterResult,
  ConsumerErrorCode,
  OutcomeEventDispatchAdapter,
  OutcomeEventEnvelope,
} from "./types";
import {
  CONSUMER_BATCH_DEFAULT,
  OUTCOME_EVENT_SCHEMA_VERSION,
  computeNextAttemptAt,
} from "./types";

type DB = SupabaseClient<any>;

export interface ConsumeReport {
  claimed: number;
  delivered: number;
  retried: number;
  deadLettered: number;
  deferred: number; // order-guard deferrals
  finalized: number;
  perAdapter: Record<string, { delivered: number; retried: number; deadLettered: number }>;
}

function emptyReport(): ConsumeReport {
  return {
    claimed: 0,
    delivered: 0,
    retried: 0,
    deadLettered: 0,
    deferred: 0,
    finalized: 0,
    perAdapter: {},
  };
}

function bump(
  report: ConsumeReport,
  adapter: string,
  key: "delivered" | "retried" | "deadLettered",
) {
  const b = (report.perAdapter[adapter] ??= { delivered: 0, retried: 0, deadLettered: 0 });
  b[key] += 1;
  report[key] += 1;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("ADAPTER_TIMEOUT")), ms)),
  ]);
}

export class OutcomeEventConsumer {
  private readonly repo: OutcomeEventConsumerRepository;
  private readonly registry: OutcomeDispatchRegistry;

  constructor(sb: DB, registry: OutcomeDispatchRegistry = defaultRegistry) {
    this.repo = new OutcomeEventConsumerRepository(sb);
    this.registry = registry;
  }

  /** Public metrics passthrough. */
  metrics() {
    return this.repo.metrics();
  }

  /** Admin/service replay. */
  replay(outboxEventId: string, adapterName?: string) {
    return this.repo.replay(outboxEventId, adapterName);
  }

  async consumeBatch(batch: number = CONSUMER_BATCH_DEFAULT): Promise<ConsumeReport> {
    const events = await this.repo.claimBatch(batch);
    const report = emptyReport();
    report.claimed = events.length;
    for (const evt of events) {
      try {
        await this.processOne(evt, report);
      } catch (e) {
        // Isolate consumer failures: schedule short retry via release.
        await this.repo.release(evt.eventId, new Date(Date.now() + 60_000)).catch(() => undefined);
        console.error("outcome_consumer.process_error", {
          eventId: evt.eventId,
          error: (e as Error).message,
        });
      }
    }
    return report;
  }

  private permanentFail(reason: ConsumerErrorCode) {
    return { kind: "permanent_failure" as const, errorCode: reason };
  }

  private async processOne(evt: OutcomeEventEnvelope, report: ConsumeReport): Promise<void> {
    // 1. Schema-version guard.
    if (evt.schemaVersion !== OUTCOME_EVENT_SCHEMA_VERSION) {
      await this.deadLetterAllRequired(evt, "UNSUPPORTED_SCHEMA_VERSION", report);
      await this.repo.finalize(evt.eventId, this.registry.requiredNames());
      report.finalized += 1;
      return;
    }
    // 2. Payload minimum contract.
    if (!evt.outcomeId || !evt.aggregateId) {
      await this.deadLetterAllRequired(evt, "MALFORMED_PAYLOAD", report);
      await this.repo.finalize(evt.eventId, this.registry.requiredNames());
      report.finalized += 1;
      return;
    }
    // 3. Aggregate order guard.
    if (await this.repo.hasEarlierPending(evt.eventId)) {
      report.deferred += 1;
      await this.repo.release(evt.eventId, new Date(Date.now() + 30_000));
      return;
    }

    // 4. Fan-out per subscribed enabled adapter.
    const targets = this.registry.subscribed(evt.eventType);
    if (!targets.length) {
      // Nothing subscribed → treat as finalized to prevent replays.
      await this.repo.finalize(evt.eventId, this.registry.requiredNames());
      report.finalized += 1;
      return;
    }

    const nextTimes: Date[] = [];
    for (const adapter of targets) {
      const result = await this.dispatchOne(adapter, evt);
      await this.persistResult(adapter, evt, result, report, nextTimes);
    }

    // 5. Finalize when required adapters are terminal; otherwise release.
    const required = this.registry.requiredNames();
    const finalized = await this.repo.finalize(evt.eventId, required);
    if (finalized) {
      report.finalized += 1;
    } else if (nextTimes.length) {
      const nextAt = nextTimes.reduce((a, b) => (a < b ? a : b));
      await this.repo.release(evt.eventId, nextAt);
    }
  }

  private async dispatchOne(
    adapter: OutcomeEventDispatchAdapter,
    evt: OutcomeEventEnvelope,
  ): Promise<AdapterResult> {
    try {
      return await withTimeout(adapter.dispatch(evt), adapter.timeoutMs);
    } catch (e) {
      const msg = (e as Error).message;
      return {
        kind: "retryable_failure",
        errorCode: msg === "ADAPTER_TIMEOUT" ? "ADAPTER_TIMEOUT" : "ADAPTER_TRANSIENT",
        errorMessage: msg,
      };
    }
  }

  private async persistResult(
    adapter: OutcomeEventDispatchAdapter,
    evt: OutcomeEventEnvelope,
    result: AdapterResult,
    report: ConsumeReport,
    nextTimes: Date[],
  ) {
    if (result.kind === "success") {
      await this.repo.recordDispatch({
        outboxEventId: evt.eventId,
        adapterName: adapter.name,
        status: "delivered",
      });
      bump(report, adapter.name, "delivered");
      return;
    }
    if (result.kind === "permanent_failure") {
      await this.repo.recordDispatch({
        outboxEventId: evt.eventId,
        adapterName: adapter.name,
        status: "dead_lettered",
        errorCode: result.errorCode ?? "ADAPTER_PERMANENT",
      });
      bump(report, adapter.name, "deadLettered");
      return;
    }
    // Retryable — track attempts against adapter.maxAttempts using outbox
    // attemptCount as a proxy (dispatch attempts advance in lockstep with
    // outbox claims for the typical single-adapter case; multi-adapter case
    // is bounded by adapter.maxAttempts through per-adapter attempt_count
    // stored in the receipt).
    const attempt = evt.attemptCount;
    const { nextAt, exhausted } = computeNextAttemptAt(attempt);
    if (exhausted || attempt >= adapter.maxAttempts) {
      await this.repo.recordDispatch({
        outboxEventId: evt.eventId,
        adapterName: adapter.name,
        status: "dead_lettered",
        errorCode: result.errorCode ?? "ADAPTER_TRANSIENT",
      });
      bump(report, adapter.name, "deadLettered");
      return;
    }
    await this.repo.recordDispatch({
      outboxEventId: evt.eventId,
      adapterName: adapter.name,
      status: "retry_scheduled",
      errorCode: result.errorCode ?? "ADAPTER_TRANSIENT",
      nextAttemptAt: nextAt,
    });
    bump(report, adapter.name, "retried");
    nextTimes.push(nextAt);
  }

  private async deadLetterAllRequired(
    evt: OutcomeEventEnvelope,
    code: ConsumerErrorCode,
    report: ConsumeReport,
  ) {
    for (const name of this.registry.requiredNames()) {
      await this.repo
        .recordDispatch({
          outboxEventId: evt.eventId,
          adapterName: name,
          status: "dead_lettered",
          errorCode: code,
        })
        .catch(() => undefined);
      bump(report, name, "deadLettered");
    }
  }
}
