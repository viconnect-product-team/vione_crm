// BC-6.8R — SmartIntroductionOpsSDK (client-safe façade).
// The single stable entry point application code uses for the ops surface.
// Never touches Supabase directly, never composes RPC arguments — every
// method delegates to the server-fn stubs, which enforce scope inside the
// SECURITY DEFINER RPCs. All returns are aggregate DTOs (no PII).

import {
  acknowledgeIntroOpsAlertFn,
  getIntroOpsAccessFn,
  getIntroOpsAdapterStatsFn,
  getIntroOpsDeliveriesStatsFn,
  getIntroOpsHealthFn,
  getIntroOpsOutboxStatsFn,
  getIntroOpsOutcomesStatsFn,
  getIntroOpsRequestsStatsFn,
  listIntroOpsAlertsFn,
  listIntroOpsConsumerRunsFn,
  listIntroOpsSchedulerRunsFn,
  resolveIntroOpsAlertFn,
  type OpsAccess,
  type OpsAdapterStats,
  type OpsAlert,
  type OpsConsumerRun,
  type OpsHealthSummary,
  type OpsJobRun,
  type OpsOutboxStats,
  type OpsOutcomeStats,
  type OpsStatsByStatus,
} from "./ops.functions";
import {
  INTRODUCTION_OPS_VERSION,
  type OpsScopeArgs,
  type OpsScopeLimitArgs,
  type OpsScopeRangeArgs,
} from "./types";

export const SmartIntroductionOpsSDK = {
  getAccess: (): Promise<OpsAccess> => getIntroOpsAccessFn(),
  getHealth: (a: OpsScopeArgs): Promise<OpsHealthSummary> => getIntroOpsHealthFn({ data: a }),
  getRequestsStats: (a: OpsScopeRangeArgs): Promise<OpsStatsByStatus> =>
    getIntroOpsRequestsStatsFn({ data: a }),
  getDeliveriesStats: (a: OpsScopeRangeArgs): Promise<OpsStatsByStatus> =>
    getIntroOpsDeliveriesStatsFn({ data: a }),
  getOutcomesStats: (a: OpsScopeRangeArgs): Promise<OpsOutcomeStats> =>
    getIntroOpsOutcomesStatsFn({ data: a }),
  getOutboxStats: (a: OpsScopeArgs): Promise<OpsOutboxStats> =>
    getIntroOpsOutboxStatsFn({ data: a }),
  getAdapterStats: (a: OpsScopeRangeArgs): Promise<OpsAdapterStats> =>
    getIntroOpsAdapterStatsFn({ data: a }),
  listSchedulerRuns: (a: OpsScopeLimitArgs): Promise<OpsJobRun[]> =>
    listIntroOpsSchedulerRunsFn({ data: a }),
  listConsumerRuns: (a: OpsScopeLimitArgs): Promise<OpsConsumerRun[]> =>
    listIntroOpsConsumerRunsFn({ data: a }),
  listAlerts: (
    a: OpsScopeArgs & { state: "open" | "acknowledged" | "resolved" | null; limit: number },
  ): Promise<OpsAlert[]> => listIntroOpsAlertsFn({ data: a }),
  acknowledgeAlert: (alertId: string): Promise<OpsAlert> =>
    acknowledgeIntroOpsAlertFn({ data: { alertId } }),
  resolveAlert: (alertId: string): Promise<OpsAlert> =>
    resolveIntroOpsAlertFn({ data: { alertId } }),
} as const;

export type SmartIntroductionOpsSDKType = typeof SmartIntroductionOpsSDK;

/**
 * Centralized query keys. Every key is scope-encoded so cache entries can
 * never leak across scopes (platform vs association) or tenants.
 */
export const introductionOpsKeys = {
  root: ["intro-ops", INTRODUCTION_OPS_VERSION] as const,
  access: () => ["intro-ops", INTRODUCTION_OPS_VERSION, "access"] as const,
  health: (a: OpsScopeArgs) =>
    ["intro-ops", INTRODUCTION_OPS_VERSION, "health", a.scope, a.associationId] as const,
  requests: (a: OpsScopeRangeArgs) =>
    [
      "intro-ops",
      INTRODUCTION_OPS_VERSION,
      "requests",
      a.scope,
      a.associationId,
      a.rangeHours,
    ] as const,
  deliveries: (a: OpsScopeRangeArgs) =>
    [
      "intro-ops",
      INTRODUCTION_OPS_VERSION,
      "deliveries",
      a.scope,
      a.associationId,
      a.rangeHours,
    ] as const,
  outcomes: (a: OpsScopeRangeArgs) =>
    [
      "intro-ops",
      INTRODUCTION_OPS_VERSION,
      "outcomes",
      a.scope,
      a.associationId,
      a.rangeHours,
    ] as const,
  outbox: (a: OpsScopeArgs) =>
    ["intro-ops", INTRODUCTION_OPS_VERSION, "outbox", a.scope, a.associationId] as const,
  adapters: (a: OpsScopeRangeArgs) =>
    [
      "intro-ops",
      INTRODUCTION_OPS_VERSION,
      "adapters",
      a.scope,
      a.associationId,
      a.rangeHours,
    ] as const,
  scheduler: (a: OpsScopeArgs) =>
    ["intro-ops", INTRODUCTION_OPS_VERSION, "scheduler", a.scope, a.associationId] as const,
  consumer: (a: OpsScopeArgs) =>
    ["intro-ops", INTRODUCTION_OPS_VERSION, "consumer", a.scope, a.associationId] as const,
  alerts: (a: OpsScopeArgs, state: string | null) =>
    ["intro-ops", INTRODUCTION_OPS_VERSION, "alerts", a.scope, a.associationId, state] as const,
} as const;
