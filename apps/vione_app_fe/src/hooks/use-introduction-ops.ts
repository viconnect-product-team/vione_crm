// BC-6.8R — Centralized React Query bindings for the Introduction Ops surface.
// The route consumes ONLY these hooks; no direct server-fn imports at UI level.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SmartIntroductionOpsSDK,
  introductionOpsKeys,
  type OpsAccess,
  type OpsAdapterStats,
  type OpsAlert,
  type OpsConsumerRun,
  type OpsHealthSummary,
  type OpsJobRun,
  type OpsOutboxStats,
  type OpsOutcomeStats,
  type OpsScopeArgs,
  type OpsScopeRangeArgs,
  type OpsStatsByStatus,
} from "@/lib/graph/introduction/ops";

const FAST = 15_000;
const NORMAL = 30_000;
const SLOW = 60_000;

export { introductionOpsKeys };

export function useIntroOpsAccess() {
  return useQuery<OpsAccess>({
    queryKey: introductionOpsKeys.access(),
    queryFn: () => SmartIntroductionOpsSDK.getAccess(),
    staleTime: SLOW,
  });
}

export function useIntroOpsHealth(a: OpsScopeArgs, enabled: boolean) {
  return useQuery<OpsHealthSummary>({
    queryKey: introductionOpsKeys.health(a),
    queryFn: () => SmartIntroductionOpsSDK.getHealth(a),
    enabled,
    staleTime: FAST,
    refetchInterval: NORMAL,
  });
}

export function useIntroOpsRequestsStats(a: OpsScopeRangeArgs, enabled: boolean) {
  return useQuery<OpsStatsByStatus>({
    queryKey: introductionOpsKeys.requests(a),
    queryFn: () => SmartIntroductionOpsSDK.getRequestsStats(a),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsDeliveriesStats(a: OpsScopeRangeArgs, enabled: boolean) {
  return useQuery<OpsStatsByStatus>({
    queryKey: introductionOpsKeys.deliveries(a),
    queryFn: () => SmartIntroductionOpsSDK.getDeliveriesStats(a),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsOutcomesStats(a: OpsScopeRangeArgs, enabled: boolean) {
  return useQuery<OpsOutcomeStats>({
    queryKey: introductionOpsKeys.outcomes(a),
    queryFn: () => SmartIntroductionOpsSDK.getOutcomesStats(a),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsOutboxStats(a: OpsScopeArgs, enabled: boolean) {
  return useQuery<OpsOutboxStats>({
    queryKey: introductionOpsKeys.outbox(a),
    queryFn: () => SmartIntroductionOpsSDK.getOutboxStats(a),
    enabled,
    staleTime: FAST,
    refetchInterval: NORMAL,
  });
}

export function useIntroOpsAdapterStats(a: OpsScopeRangeArgs, enabled: boolean) {
  return useQuery<OpsAdapterStats>({
    queryKey: introductionOpsKeys.adapters(a),
    queryFn: () => SmartIntroductionOpsSDK.getAdapterStats(a),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsSchedulerRuns(a: OpsScopeArgs, limit: number, enabled: boolean) {
  return useQuery<OpsJobRun[]>({
    queryKey: introductionOpsKeys.scheduler(a),
    queryFn: () => SmartIntroductionOpsSDK.listSchedulerRuns({ ...a, limit }),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsConsumerRuns(a: OpsScopeArgs, limit: number, enabled: boolean) {
  return useQuery<OpsConsumerRun[]>({
    queryKey: introductionOpsKeys.consumer(a),
    queryFn: () => SmartIntroductionOpsSDK.listConsumerRuns({ ...a, limit }),
    enabled,
    staleTime: NORMAL,
  });
}

export function useIntroOpsAlerts(
  a: OpsScopeArgs,
  state: "open" | "acknowledged" | "resolved" | null,
  limit: number,
  enabled: boolean,
) {
  return useQuery<OpsAlert[]>({
    queryKey: introductionOpsKeys.alerts(a, state),
    queryFn: () => SmartIntroductionOpsSDK.listAlerts({ ...a, state, limit }),
    enabled,
    staleTime: FAST,
    refetchInterval: 45_000,
  });
}

export function useAcknowledgeIntroOpsAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => SmartIntroductionOpsSDK.acknowledgeAlert(alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intro-ops"] }),
  });
}

export function useResolveIntroOpsAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => SmartIntroductionOpsSDK.resolveAlert(alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intro-ops"] }),
  });
}

export function useInvalidateIntroOps() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["intro-ops"] });
}
