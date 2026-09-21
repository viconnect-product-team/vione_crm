// BC-7.7 Turn B2 — Reconciliation orchestrator.
// Periodically nudges stalled projections and re-verifies that the canonical
// meeting state matches externally-synced state. Runs under service role
// (invoked by pg_cron via /api/public/hooks/calendar-reconcile in a later
// turn — the service function itself is provider-agnostic and testable).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdapterResolver, CalendarSyncService } from "./sync.service.server";
import { createCalendarSyncService } from "./sync.service.server";

export interface ReconciliationReport {
  scanned: number;
  synced: number;
  retried: number;
  failed: number;
  cancelled: number;
  startedAt: string;
  finishedAt: string;
}

export interface ReconciliationDeps {
  supabase: SupabaseClient;
  adapters: AdapterResolver;
  batchLimit?: number;
  maxBatches?: number;
  now?: () => Date;
  random?: () => number;
}

export function createReconciliationService(deps: ReconciliationDeps) {
  const sync: CalendarSyncService = createCalendarSyncService({
    supabase: deps.supabase,
    adapters: deps.adapters,
    now: deps.now,
    random: deps.random,
  });
  const now = deps.now ?? (() => new Date());
  const batchLimit = deps.batchLimit ?? 20;
  const maxBatches = deps.maxBatches ?? 5;

  async function runOnce(): Promise<ReconciliationReport> {
    const startedAt = now().toISOString();
    const report: ReconciliationReport = {
      scanned: 0,
      synced: 0,
      retried: 0,
      failed: 0,
      cancelled: 0,
      startedAt,
      finishedAt: startedAt,
    };
    for (let i = 0; i < maxBatches; i++) {
      const outcomes = await sync.claimAndProcessBatch(batchLimit);
      if (outcomes.length === 0) break;
      report.scanned += outcomes.length;
      for (const o of outcomes) {
        if (o.decision === "synced") report.synced++;
        else if (o.decision === "retry_scheduled") report.retried++;
        else if (o.decision === "failed") report.failed++;
        else if (o.decision === "cancelled") report.cancelled++;
      }
    }
    report.finishedAt = now().toISOString();
    return report;
  }

  return { runOnce };
}

export type ReconciliationService = ReturnType<typeof createReconciliationService>;
