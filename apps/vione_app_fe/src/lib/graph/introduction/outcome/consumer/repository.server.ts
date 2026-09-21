// BC-6.6 — Consumer repository. Thin wrapper over the SECURITY DEFINER RPCs.
// Runs under service_role (or via admin server fn). Never called by clients.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DispatchStatus, OutcomeEventEnvelope } from "./types";
import {
  CONSUMER_BATCH_DEFAULT,
  CONSUMER_BATCH_MAX,
  OUTCOME_EVENT_SCHEMA_VERSION,
  isSupportedOutcomeEventKind,
} from "./types";

type DB = SupabaseClient<any>;

interface ClaimedRow {
  id: string;
  event_kind: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: {
    outcomeId?: string;
    status?: string | null;
    outcomeType?: string | null;
    outcomeSource?: string | null;
    occurredAt?: string;
  } | null;
  idempotency_key: string;
  occurred_at: string;
  attempt_count: number;
  created_at: string;
}

export class OutcomeEventConsumerRepository {
  constructor(private readonly sb: DB) {}

  async claimBatch(batch: number = CONSUMER_BATCH_DEFAULT): Promise<OutcomeEventEnvelope[]> {
    const n = Math.min(Math.max(1, batch | 0), CONSUMER_BATCH_MAX);
    const { data, error } = await this.sb.rpc("outcome_consumer_claim_batch", { _batch: n });
    if (error) throw new Error(`claimBatch failed: ${error.message}`);
    const rows = (data ?? []) as ClaimedRow[];
    return rows.map((r: any) => this.toEnvelope(r)).filter((e): e is OutcomeEventEnvelope => e !== null);
  }

  private toEnvelope(r: ClaimedRow): OutcomeEventEnvelope | null {
    if (!isSupportedOutcomeEventKind(r.event_kind)) return null;
    const p = r.payload ?? {};
    const outcomeId = (p.outcomeId as string | undefined) ?? r.aggregate_id;
    return {
      eventId: r.id,
      idempotencyKey: r.idempotency_key,
      eventType: r.event_kind,
      aggregateType: "introduction_outcome",
      aggregateId: r.aggregate_id,
      outcomeId,
      status: p.status ?? null,
      outcomeType: p.outcomeType ?? null,
      outcomeSource: p.outcomeSource ?? null,
      occurredAt: (p.occurredAt as string) ?? r.occurred_at,
      schemaVersion: OUTCOME_EVENT_SCHEMA_VERSION,
      attemptCount: r.attempt_count,
      firstSeenAt: r.created_at,
      lastAttemptAt: new Date().toISOString(),
    };
  }

  async hasEarlierPending(outboxEventId: string): Promise<boolean> {
    const { data, error } = await this.sb.rpc("outcome_consumer_has_earlier_pending", {
      _outbox_id: outboxEventId,
    });
    if (error) throw new Error(`hasEarlierPending failed: ${error.message}`);
    return Boolean(data);
  }

  async recordDispatch(input: {
    outboxEventId: string;
    adapterName: string;
    status: DispatchStatus;
    errorCode?: string | null;
    nextAttemptAt?: Date | null;
  }): Promise<void> {
    const { error } = await this.sb.rpc("outcome_dispatch_record", {
      _outbox_event_id: input.outboxEventId,
      _adapter_name: input.adapterName,
      _status: input.status,
      _error_code: input.errorCode ?? null,
      _next_attempt_at: input.nextAttemptAt ? input.nextAttemptAt.toISOString() : null,
    });
    if (error) throw new Error(`recordDispatch failed: ${error.message}`);
  }

  async finalize(outboxEventId: string, requiredAdapters: string[]): Promise<boolean> {
    const { data, error } = await this.sb.rpc("outcome_consumer_finalize", {
      _outbox_event_id: outboxEventId,
      _required_adapters: requiredAdapters,
    });
    if (error) throw new Error(`finalize failed: ${error.message}`);
    return Boolean(data);
  }

  async release(outboxEventId: string, nextAvailableAt: Date): Promise<void> {
    const { error } = await this.sb.rpc("outcome_consumer_release", {
      _outbox_event_id: outboxEventId,
      _next_available_at: nextAvailableAt.toISOString(),
    });
    if (error) throw new Error(`release failed: ${error.message}`);
  }

  async replay(outboxEventId: string, adapterName?: string): Promise<number> {
    const { data, error } = await this.sb.rpc("outcome_consumer_replay", {
      _outbox_event_id: outboxEventId,
      _adapter_name: adapterName ?? null,
    });
    if (error) throw new Error(`replay failed: ${error.message}`);
    return Number(data ?? 0);
  }

  async metrics(): Promise<{
    pending: number;
    oldestPendingAgeSec: number | null;
    deadLettered: number;
    retryScheduled: number;
  }> {
    const [pendRes, deadRes, retryRes] = await Promise.all([
      this.sb
        .from("graph_outbox_events")
        .select("id, created_at", { count: "exact" })
        .eq("aggregate_type", "introduction_outcome")
        .is("processed_at", null)
        .order("created_at", { ascending: true })
        .limit(1),
      this.sb
        .from("outcome_event_dispatches")
        .select("id", { count: "exact", head: true })
        .eq("status", "dead_lettered"),
      this.sb
        .from("outcome_event_dispatches")
        .select("id", { count: "exact", head: true })
        .eq("status", "retry_scheduled"),
    ]);
    const oldest = (pendRes.data as { created_at: string }[] | null)?.[0]?.created_at;
    return {
      pending: pendRes.count ?? 0,
      oldestPendingAgeSec: oldest
        ? Math.max(0, Math.floor((Date.now() - Date.parse(oldest)) / 1000))
        : null,
      deadLettered: deadRes.count ?? 0,
      retryScheduled: retryRes.count ?? 0,
    };
  }
}
