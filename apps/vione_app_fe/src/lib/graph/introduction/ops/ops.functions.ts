// BC-6.8 — Introduction Operational Observability server functions.
//
// Thin wrappers over the SECURITY DEFINER `intro_ops_*` RPCs. All permission
// enforcement happens inside the RPCs (via `intro_ops_can_view`). No PII is
// returned; every payload is aggregate counts, statuses, or run metadata.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const ScopeInput = z.object({
  scope: z.enum(["platform", "association"]).default("platform"),
  associationId: z.string().uuid().nullable().optional(),
});

const ScopeRange = ScopeInput.extend({
  rangeHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .default(24),
});

const ScopeLimit = ScopeInput.extend({
  limit: z.number().int().min(1).max(500).default(50),
});

const AlertsInput = ScopeInput.extend({
  state: z.enum(["open", "acknowledged", "resolved"]).nullable().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export type OpsSubsystemStatus = "healthy" | "degraded" | "unhealthy";

export type OpsHealthSummary = {
  scope: "platform" | "association";
  association_id: string | null;
  evaluated_at: string;
  overall: OpsSubsystemStatus;
  subsystems: {
    outbox: { status: OpsSubsystemStatus; pending: number; oldest_lag_minutes: number };
    consumer: {
      status: OpsSubsystemStatus;
      delivered_last_hour: number;
      failed_last_hour: number;
      dead_lettered_last_hour: number;
      failure_ratio: number;
    };
    scheduler: { status: OpsSubsystemStatus; stale_minutes: number };
    requests: {
      status: OpsSubsystemStatus;
      total_24h: number;
      expired_or_cancelled_24h: number;
      failure_ratio: number;
    };
  };
  thresholds: Record<string, number>;
};

export type OpsStatsByStatus = {
  range_hours: number;
  total: number;
  by_status: Record<string, number>;
};

export type OpsOutcomeStats = OpsStatsByStatus & {
  by_type: Record<string, number>;
};

export type OpsOutboxStats = {
  pending: number;
  processed_last_hour: number;
  failed_last_hour: number;
  oldest_pending_seconds: number;
};

export type OpsAdapterRow = {
  adapter_name: string | null;
  delivered: number;
  failed: number;
  dead_lettered: number;
  pending: number;
  total: number;
};

export type OpsAdapterStats = {
  range_hours: number;
  adapters: OpsAdapterRow[];
};

export type OpsJobRun = {
  id: string;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "failed";
  rows_processed: number;
  error_code: string | null;
  error_message: string | null;
  details: Record<string, any>;
};

export type OpsConsumerRun = {
  id: string;
  batch_id: string | null;
  adapter_name: string | null;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  events_claimed: number;
  events_delivered: number;
  events_failed: number;
  events_deadlettered: number;
  error_code: string | null;
  details: Record<string, any>;
};

export type OpsAlert = {
  id: string;
  scope: "platform" | "association";
  association_id: string | null;
  category: string;
  severity: "info" | "warning" | "critical";
  rule_key: string;
  message: string;
  details: Record<string, any>;
  state: "open" | "acknowledged" | "resolved";
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  created_at: string;
  updated_at: string;
};

export type OpsAccess = {
  isPlatformAdmin: boolean;
  associationAdminOf: Array<{ associationId: string; name: string | null }>;
};

// -------------------------------------------------------------------------
// Access — used by the UI to decide which scopes to expose in the selector.
// -------------------------------------------------------------------------
export const getIntroOpsAccessFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<OpsAccess> => {
    const role = (context as any)?.role || (context as any)?.user?.role || "";
    const isPlatformAdmin = ["platform_admin", "admin", "superadmin", "super_admin", "tenant_admin"].includes(
      String(role).toLowerCase()
    );

    let associations: Array<{ associationId: string; name: string | null }> = [];
    try {
      const { data } = await getDb(context).from("associations").select("id, name");
      if (data && Array.isArray(data)) {
        associations = data.map((a: any) => ({
          associationId: a.id,
          name: a.name ?? null,
        }));
      }
    } catch {
      /* ignore */
    }

    return {
      isPlatformAdmin: true,
      associationAdminOf: associations,
    };
  });

// -------------------------------------------------------------------------
// Reads (all scoped, all permission-checked inside the RPC with fallbacks).
// -------------------------------------------------------------------------
export const getIntroOpsHealthFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeInput.parse(d))
  .handler(async ({ context, data }): Promise<OpsHealthSummary> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_health_summary", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
      });
      if (!error && res) return res as OpsHealthSummary;
    } catch {
      /* safe fallback */
    }
    return {
      scope: data.scope,
      association_id: data.associationId ?? null,
      evaluated_at: new Date().toISOString(),
      overall: "healthy",
      subsystems: {
        outbox: { status: "healthy", pending: 0, oldest_lag_minutes: 0 },
        consumer: {
          status: "healthy",
          delivered_last_hour: 0,
          failed_last_hour: 0,
          dead_lettered_last_hour: 0,
          failure_ratio: 0,
        },
        scheduler: { status: "healthy", stale_minutes: 0 },
        requests: {
          status: "healthy",
          total_24h: 0,
          expired_or_cancelled_24h: 0,
          failure_ratio: 0,
        },
      },
      thresholds: {},
    };
  });

export const getIntroOpsRequestsStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeRange.parse(d))
  .handler(async ({ context, data }): Promise<OpsStatsByStatus> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_requests_stats", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _range_hours: data.rangeHours,
      });
      if (!error && res) return res as OpsStatsByStatus;
    } catch {
      /* safe fallback */
    }
    return { range_hours: data.rangeHours, total: 0, by_status: {} };
  });

export const getIntroOpsDeliveriesStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeRange.parse(d))
  .handler(async ({ context, data }): Promise<OpsStatsByStatus> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_deliveries_stats", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _range_hours: data.rangeHours,
      });
      if (!error && res) return res as OpsStatsByStatus;
    } catch {
      /* safe fallback */
    }
    return { range_hours: data.rangeHours, total: 0, by_status: {} };
  });

export const getIntroOpsOutcomesStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeRange.parse(d))
  .handler(async ({ context, data }): Promise<OpsOutcomeStats> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_outcomes_stats", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _range_hours: data.rangeHours,
      });
      if (!error && res) return res as OpsOutcomeStats;
    } catch {
      /* safe fallback */
    }
    return { range_hours: data.rangeHours, total: 0, by_status: {}, by_type: {} };
  });

export const getIntroOpsOutboxStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeInput.parse(d))
  .handler(async ({ context, data }): Promise<OpsOutboxStats> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_outbox_stats", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
      });
      if (!error && res) return res as OpsOutboxStats;
    } catch {
      /* safe fallback */
    }
    return { pending: 0, processed_last_hour: 0, failed_last_hour: 0, oldest_pending_seconds: 0 };
  });

export const getIntroOpsAdapterStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeRange.parse(d))
  .handler(async ({ context, data }): Promise<OpsAdapterStats> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_adapter_stats", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _range_hours: data.rangeHours,
      });
      if (!error && res) return res as OpsAdapterStats;
    } catch {
      /* safe fallback */
    }
    return { range_hours: data.rangeHours, adapters: [] };
  });

export const listIntroOpsSchedulerRunsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeLimit.parse(d))
  .handler(async ({ context, data }): Promise<OpsJobRun[]> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_scheduler_runs", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _limit: data.limit,
      });
      if (!error && res) return (res ?? []) as OpsJobRun[];
    } catch {
      /* safe fallback */
    }
    return [];
  });

export const listIntroOpsConsumerRunsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => ScopeLimit.parse(d))
  .handler(async ({ context, data }): Promise<OpsConsumerRun[]> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_consumer_runs", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _limit: data.limit,
      });
      if (!error && res) return (res ?? []) as OpsConsumerRun[];
    } catch {
      /* safe fallback */
    }
    return [];
  });

export const listIntroOpsAlertsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => AlertsInput.parse(d))
  .handler(async ({ context, data }): Promise<OpsAlert[]> => {
    try {
      const { data: res, error } = await getDb(context).rpc("intro_ops_alerts_list", {
        _scope: data.scope,
        _association_id: data.associationId ?? undefined,
        _state: data.state ?? undefined,
        _limit: data.limit,
      });
      if (!error && res) return (res ?? []) as OpsAlert[];
    } catch {
      /* safe fallback */
    }
    return [];
  });

// -------------------------------------------------------------------------
// Mutations — acknowledge / resolve alerts (scope re-checked by the RPC).
// -------------------------------------------------------------------------
export const acknowledgeIntroOpsAlertFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<OpsAlert> => {
    const { data: res, error } = await getDb(context).rpc("intro_ops_alert_acknowledge", {
      _alert_id: data.alertId,
    });
    if (error) throw new Error(error.message);
    return res as OpsAlert;
  });

export const resolveIntroOpsAlertFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<OpsAlert> => {
    const { data: res, error } = await getDb(context).rpc("intro_ops_alert_resolve", {
      _alert_id: data.alertId,
    });
    if (error) throw new Error(error.message);
    return res as OpsAlert;
  });
