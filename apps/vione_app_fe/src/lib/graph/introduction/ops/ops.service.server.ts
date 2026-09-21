// BC-6.8R — SmartIntroductionOpsService (server boundary).
//
// Thin service class bound to an authenticated Supabase client. Delegates
// entirely to the `intro_ops_*` SECURITY DEFINER RPCs — never queries
// tables directly. Exists so server-fn handlers, the alerts-evaluation
// endpoint (if added later), and tests all share one boundary that can be
// mocked and reasoned about. No PII.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  OpsAccess,
  OpsAdapterStats,
  OpsAlert,
  OpsConsumerRun,
  OpsHealthSummary,
  OpsJobRun,
  OpsOutboxStats,
  OpsOutcomeStats,
  OpsStatsByStatus,
} from "./ops.functions";

type DB = SupabaseClient<Database>;

function orThrow<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export class SmartIntroductionOpsService {
  constructor(private readonly supabase: DB) {}

  async getAccess(): Promise<OpsAccess> {
    const { data: platform } = await this.supabase.rpc("is_platform_admin");
    const { data: memberships } = await this.supabase
      .from("memberships")
      .select("association_id, role, associations(name)")
      .eq("role", "admin");
    return {
      isPlatformAdmin: Boolean(platform),
      associationAdminOf: ((memberships ?? []) as any[]).map((m) => ({
        associationId: m.association_id,
        name: m.associations?.name ?? null,
      })),
    };
  }

  async getHealth(
    scope: "platform" | "association",
    associationId: string | null,
  ): Promise<OpsHealthSummary> {
    return orThrow(
      await this.supabase.rpc("intro_ops_health_summary", {
        _scope: scope,
        _association_id: associationId ?? undefined,
      }),
    ) as unknown as OpsHealthSummary;
  }

  async getRequestsStats(
    scope: "platform" | "association",
    associationId: string | null,
    rangeHours: number,
  ): Promise<OpsStatsByStatus> {
    return orThrow(
      await this.supabase.rpc("intro_ops_requests_stats", {
        _scope: scope,
        _association_id: associationId ?? undefined,
        _range_hours: rangeHours,
      }),
    ) as unknown as OpsStatsByStatus;
  }

  async getDeliveriesStats(
    scope: "platform" | "association",
    associationId: string | null,
    rangeHours: number,
  ): Promise<OpsStatsByStatus> {
    return orThrow(
      await this.supabase.rpc("intro_ops_deliveries_stats", {
        _scope: scope,
        _association_id: associationId ?? undefined,
        _range_hours: rangeHours,
      }),
    ) as unknown as OpsStatsByStatus;
  }

  async getOutcomesStats(
    scope: "platform" | "association",
    associationId: string | null,
    rangeHours: number,
  ): Promise<OpsOutcomeStats> {
    return orThrow(
      await this.supabase.rpc("intro_ops_outcomes_stats", {
        _scope: scope,
        _association_id: associationId ?? undefined,
        _range_hours: rangeHours,
      }),
    ) as unknown as OpsOutcomeStats;
  }

  async getOutboxStats(
    scope: "platform" | "association",
    associationId: string | null,
  ): Promise<OpsOutboxStats> {
    return orThrow(
      await this.supabase.rpc("intro_ops_outbox_stats", {
        _scope: scope,
        _association_id: associationId ?? undefined,
      }),
    ) as unknown as OpsOutboxStats;
  }

  async getAdapterStats(
    scope: "platform" | "association",
    associationId: string | null,
    rangeHours: number,
  ): Promise<OpsAdapterStats> {
    return orThrow(
      await this.supabase.rpc("intro_ops_adapter_stats", {
        _scope: scope,
        _association_id: associationId ?? undefined,
        _range_hours: rangeHours,
      }),
    ) as unknown as OpsAdapterStats;
  }

  async listSchedulerRuns(
    scope: "platform" | "association",
    associationId: string | null,
    limit: number,
  ): Promise<OpsJobRun[]> {
    const res = await this.supabase.rpc("intro_ops_scheduler_runs", {
      _scope: scope,
      _association_id: associationId ?? undefined,
      _limit: limit,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []) as unknown as OpsJobRun[];
  }

  async listConsumerRuns(
    scope: "platform" | "association",
    associationId: string | null,
    limit: number,
  ): Promise<OpsConsumerRun[]> {
    const res = await this.supabase.rpc("intro_ops_consumer_runs", {
      _scope: scope,
      _association_id: associationId ?? undefined,
      _limit: limit,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []) as unknown as OpsConsumerRun[];
  }

  async listAlerts(
    scope: "platform" | "association",
    associationId: string | null,
    state: "open" | "acknowledged" | "resolved" | null,
    limit: number,
  ): Promise<OpsAlert[]> {
    const res = await this.supabase.rpc("intro_ops_alerts_list", {
      _scope: scope,
      _association_id: associationId ?? undefined,
      _state: state ?? undefined,
      _limit: limit,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []) as unknown as OpsAlert[];
  }

  async acknowledgeAlert(alertId: string): Promise<OpsAlert> {
    return orThrow(
      await this.supabase.rpc("intro_ops_alert_acknowledge", { _alert_id: alertId }),
    ) as unknown as OpsAlert;
  }

  async resolveAlert(alertId: string): Promise<OpsAlert> {
    return orThrow(
      await this.supabase.rpc("intro_ops_alert_resolve", { _alert_id: alertId }),
    ) as unknown as OpsAlert;
  }
}

export function createSmartIntroductionOpsService(supabase: DB) {
  return new SmartIntroductionOpsService(supabase);
}
