import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Inbox,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useT } from "@/lib/i18n";
import type {
  OpsAdapterRow,
  OpsAlert as OpsAlertT,
  OpsConsumerRun,
  OpsJobRun,
  OpsSubsystemStatus,
} from "@/lib/graph/introduction/ops";
import {
  useAcknowledgeIntroOpsAlert,
  useIntroOpsAccess,
  useIntroOpsAdapterStats,
  useIntroOpsAlerts,
  useIntroOpsConsumerRuns,
  useIntroOpsDeliveriesStats,
  useIntroOpsHealth,
  useIntroOpsOutboxStats,
  useIntroOpsOutcomesStats,
  useIntroOpsRequestsStats,
  useIntroOpsSchedulerRuns,
  useInvalidateIntroOps,
  useResolveIntroOpsAlert,
} from "@/hooks/use-introduction-ops";

export const Route = createFileRoute("/platform/introduction-operations")({
  component: IntroductionOperationsPage,
});

type Scope = "platform" | "association";

const STATUS_TONE: Record<
  OpsSubsystemStatus,
  { bg: string; fg: string; icon: typeof CheckCircle2 }
> = {
  healthy: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)", icon: CheckCircle2 },
  degraded: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)", icon: Clock },
  unhealthy: { bg: "oklch(0.94 0.06 25)", fg: "oklch(0.50 0.18 25)", icon: XCircle },
};

const SEVERITY_TONE: Record<"info" | "warning" | "critical", { bg: string; fg: string }> = {
  info: { bg: "oklch(0.94 0.05 220)", fg: "oklch(0.42 0.15 220)" },
  warning: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
  critical: { bg: "oklch(0.94 0.06 25)", fg: "oklch(0.50 0.18 25)" },
};

function StatusPill({ status, label }: { status: OpsSubsystemStatus; label: string }) {
  const s = STATUS_TONE[status];
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function IntroductionOperationsPage() {
  const t = useT();
  const invalidateAll = useInvalidateIntroOps();

  const [scope, setScope] = useState<Scope>("platform");
  const [associationId, setAssociationId] = useState<string | null>(null);
  const [rangeHours, setRangeHours] = useState<number>(24);
  const [alertFilter, setAlertFilter] = useState<"open" | "acknowledged" | "resolved" | null>(
    "open",
  );

  const accessQ = useIntroOpsAccess();
  const access = accessQ.data;
  const scopeReady =
    scope === "platform"
      ? Boolean(access?.isPlatformAdmin)
      : scope === "association" && Boolean(associationId);

  // Auto-pick a sensible default scope once access loads.
  const autoScopeApplied = useMemo(() => {
    if (!access) return true;
    if (access.isPlatformAdmin) return true;
    if (!access.isPlatformAdmin && access.associationAdminOf.length > 0) {
      if (scope !== "association" || !associationId) {
        setScope("association");
        setAssociationId(access.associationAdminOf[0].associationId);
      }
      return true;
    }
    return true;
  }, [access, scope, associationId]);
  void autoScopeApplied;

  const canView =
    (access?.isPlatformAdmin ?? false) || (access?.associationAdminOf.length ?? 0) > 0;

  const args = useMemo(
    () => ({ scope, associationId: scope === "association" ? associationId : null }),
    [scope, associationId],
  );
  const argsRange = useMemo(() => ({ ...args, rangeHours }), [args, rangeHours]);
  const enabled = Boolean(scopeReady && canView);

  const healthQ = useIntroOpsHealth(args, enabled);
  const requestsQ = useIntroOpsRequestsStats(argsRange, enabled);
  const deliveriesQ = useIntroOpsDeliveriesStats(argsRange, enabled);
  const outcomesQ = useIntroOpsOutcomesStats(argsRange, enabled);
  const outboxQ = useIntroOpsOutboxStats(args, enabled);
  const adaptersQ = useIntroOpsAdapterStats(argsRange, enabled);
  const schedulerQ = useIntroOpsSchedulerRuns(args, 25, enabled);
  const consumerQ = useIntroOpsConsumerRuns(args, 25, enabled);
  const alertsQ = useIntroOpsAlerts(args, alertFilter, 100, enabled);

  const ackMut = useAcknowledgeIntroOpsAlert();
  const resolveMut = useResolveIntroOpsAlert();

  function refreshAll() {
    invalidateAll();
  }

  if (accessQ.isLoading) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading…</Card>
      </PlatformShell>
    );
  }

  if (!canView) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("bc.introOps.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const health = healthQ.data;
  const subsystems = health?.subsystems;

  return (
    <PlatformShell>
      <PageHeader
        title={t("bc.introOps.title")}
        subtitle={t("bc.introOps.subtitle")}
        actions={
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("bc.introOps.refresh")}
          </button>
        }
      />

      {/* Scope + range controls */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("bc.introOps.scope.label")}
          </label>
          <div className="flex rounded-lg border border-border bg-secondary/40 p-0.5">
            {access?.isPlatformAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setScope("platform");
                  setAssociationId(null);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  scope === "platform"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={scope === "platform"}
              >
                {t("bc.introOps.scope.platform")}
              </button>
            ) : null}
            {(access?.associationAdminOf.length ?? 0) > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setScope("association");
                  if (!associationId && access?.associationAdminOf[0]) {
                    setAssociationId(access.associationAdminOf[0].associationId);
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  scope === "association"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={scope === "association"}
              >
                {t("bc.introOps.scope.association")}
              </button>
            ) : null}
          </div>
          {scope === "association" && (access?.associationAdminOf.length ?? 0) > 1 ? (
            <select
              value={associationId ?? ""}
              onChange={(e) => setAssociationId(e.target.value || null)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
              aria-label={t("bc.introOps.scope.association")}
            >
              {access!.associationAdminOf.map(
                (a: { associationId: string; name: string | null }) => (
                  <option key={a.associationId} value={a.associationId}>
                    {a.name ?? a.associationId.slice(0, 8)}
                  </option>
                ),
              )}
            </select>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("bc.introOps.range.label")}
          </label>
          <div className="flex rounded-lg border border-border bg-secondary/40 p-0.5">
            {[
              { h: 1, label: t("bc.introOps.range.1h") },
              { h: 24, label: t("bc.introOps.range.24h") },
              { h: 24 * 7, label: t("bc.introOps.range.7d") },
            ].map((r: any) => (
              <button
                key={r.h}
                type="button"
                onClick={() => setRangeHours(r.h)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  rangeHours === r.h
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={rangeHours === r.h}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {health ? (
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            {t("bc.introOps.evaluatedAt")}: {fmtTime(health.evaluated_at)}
          </div>
        ) : null}
      </Card>

      {/* Health overview */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.health")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HealthTile
            title={t("bc.introOps.sub.outbox")}
            status={subsystems?.outbox.status}
            icon={Inbox}
            metrics={[
              { label: t("bc.introOps.metric.pending"), value: subsystems?.outbox.pending ?? 0 },
              {
                label: t("bc.introOps.metric.lagMin"),
                value: subsystems?.outbox.oldest_lag_minutes ?? 0,
              },
            ]}
            t={t}
          />
          <HealthTile
            title={t("bc.introOps.sub.consumer")}
            status={subsystems?.consumer.status}
            icon={Cpu}
            metrics={[
              {
                label: t("bc.introOps.metric.delivered"),
                value: subsystems?.consumer.delivered_last_hour ?? 0,
              },
              {
                label: t("bc.introOps.metric.deadLetter"),
                value: subsystems?.consumer.dead_lettered_last_hour ?? 0,
              },
            ]}
            t={t}
          />
          <HealthTile
            title={t("bc.introOps.sub.scheduler")}
            status={subsystems?.scheduler.status}
            icon={Clock}
            metrics={[
              {
                label: t("bc.introOps.metric.staleMin"),
                value: subsystems?.scheduler.stale_minutes ?? 0,
              },
            ]}
            t={t}
          />
          <HealthTile
            title={t("bc.introOps.sub.requests")}
            status={subsystems?.requests.status}
            icon={Activity}
            metrics={[
              { label: t("bc.introOps.metric.total"), value: subsystems?.requests.total_24h ?? 0 },
              {
                label: t("bc.introOps.metric.expired"),
                value: subsystems?.requests.expired_or_cancelled_24h ?? 0,
              },
            ]}
            t={t}
          />
        </div>
      </section>

      {/* Pipeline stats */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.pipeline")}
        </h3>
        <div className="grid gap-3 lg:grid-cols-3">
          <StatByStatusCard title={t("bc.introOps.pipeline.requests")} data={requestsQ.data} />
          <StatByStatusCard title={t("bc.introOps.pipeline.deliveries")} data={deliveriesQ.data} />
          <StatByStatusCard
            title={t("bc.introOps.pipeline.outcomes")}
            data={outcomesQ.data}
            extra={outcomesQ.data?.by_type}
          />
        </div>
      </section>

      {/* Outbox */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.outbox")}
        </h3>
        <Card className="grid gap-4 p-5 sm:grid-cols-4">
          <Metric label={t("bc.introOps.metric.pending")} value={outboxQ.data?.pending ?? 0} />
          <Metric
            label={t("bc.introOps.metric.delivered")}
            value={outboxQ.data?.processed_last_hour ?? 0}
          />
          <Metric
            label={t("bc.introOps.metric.failed")}
            value={outboxQ.data?.failed_last_hour ?? 0}
          />
          <Metric
            label={t("bc.introOps.metric.lagMin")}
            value={Math.round((outboxQ.data?.oldest_pending_seconds ?? 0) / 60)}
          />
        </Card>
      </section>

      {/* Consumer runs */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.consumer")}
        </h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.startedAt")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.adapter")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.status")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.col.claimed")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.delivered")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.failed")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.deadLetter")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.error")}</th>
                </tr>
              </thead>
              <tbody>
                {(consumerQ.data ?? []).map((r: OpsConsumerRun) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {fmtTime(r.started_at)}
                    </td>
                    <td className="px-4 py-2 text-xs">{r.adapter_name ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{r.status}</td>
                    <td className="px-4 py-2 text-right text-xs">{r.events_claimed}</td>
                    <td className="px-4 py-2 text-right text-xs">{r.events_delivered}</td>
                    <td className="px-4 py-2 text-right text-xs">{r.events_failed}</td>
                    <td className="px-4 py-2 text-right text-xs">{r.events_deadlettered}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.error_code ?? "—"}
                    </td>
                  </tr>
                ))}
                {(consumerQ.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-xs text-muted-foreground">
                      {t("bc.introOps.empty.consumer")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Scheduler runs */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.scheduler")}
        </h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.startedAt")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.job")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.status")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.col.rows")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.finishedAt")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.error")}</th>
                </tr>
              </thead>
              <tbody>
                {(schedulerQ.data ?? []).map((r: OpsJobRun) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {fmtTime(r.started_at)}
                    </td>
                    <td className="px-4 py-2 text-xs font-medium">{r.job_name}</td>
                    <td className="px-4 py-2 text-xs">{r.status}</td>
                    <td className="px-4 py-2 text-right text-xs">{r.rows_processed}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {fmtTime(r.finished_at)}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.error_code ?? "—"}
                    </td>
                  </tr>
                ))}
                {(schedulerQ.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-muted-foreground">
                      {t("bc.introOps.empty.scheduler")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Adapters */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("bc.introOps.section.adapters")}
        </h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.adapter")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.delivered")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.failed")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.deadLetter")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.pending")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.metric.total")}</th>
                </tr>
              </thead>
              <tbody>
                {(adaptersQ.data?.adapters ?? []).map((a: OpsAdapterRow) => (
                  <tr
                    key={a.adapter_name ?? "unknown"}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2 text-xs font-medium">{a.adapter_name ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-xs">{a.delivered}</td>
                    <td className="px-4 py-2 text-right text-xs">{a.failed}</td>
                    <td className="px-4 py-2 text-right text-xs">{a.dead_lettered}</td>
                    <td className="px-4 py-2 text-right text-xs">{a.pending}</td>
                    <td className="px-4 py-2 text-right text-xs">{a.total}</td>
                  </tr>
                ))}
                {(adaptersQ.data?.adapters ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-muted-foreground">
                      {t("bc.introOps.empty.adapters")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Alerts */}
      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("bc.introOps.section.alerts")}
          </h3>
          <div className="flex rounded-lg border border-border bg-secondary/40 p-0.5">
            {(
              [
                { k: null, label: t("bc.introOps.alerts.filter.all") },
                { k: "open" as const, label: t("bc.introOps.alerts.filter.open") },
                { k: "acknowledged" as const, label: t("bc.introOps.alerts.filter.acknowledged") },
                { k: "resolved" as const, label: t("bc.introOps.alerts.filter.resolved") },
              ] as const
            ).map((f) => (
              <button
                key={String(f.k)}
                type="button"
                onClick={() => setAlertFilter(f.k as any)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  alertFilter === f.k
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={alertFilter === f.k}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.severity")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.rule")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.message")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.col.occurrences")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.lastSeen")}</th>
                  <th className="px-4 py-2 text-left">{t("bc.introOps.col.status")}</th>
                  <th className="px-4 py-2 text-right">{t("bc.introOps.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {(alertsQ.data ?? []).map((a: OpsAlertT) => {
                  const sev = SEVERITY_TONE[a.severity];
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-xs">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: sev.bg, color: sev.fg }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {t(`bc.introOps.alerts.severity.${a.severity}` as any)}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px]">{a.rule_key}</td>
                      <td className="px-4 py-2 text-xs">{a.message}</td>
                      <td className="px-4 py-2 text-right text-xs">{a.occurrence_count}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {fmtTime(a.last_seen_at)}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {t(`bc.introOps.alerts.state.${a.state}` as any)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {a.state === "open" ? (
                          <button
                            type="button"
                            onClick={() => ackMut.mutate(a.id)}
                            className="mr-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary/60"
                          >
                            {t("bc.introOps.alerts.acknowledge")}
                          </button>
                        ) : null}
                        {a.state !== "resolved" ? (
                          <button
                            type="button"
                            onClick={() => resolveMut.mutate(a.id)}
                            className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary/60"
                          >
                            {t("bc.introOps.alerts.resolve")}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {(alertsQ.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">
                      {t("bc.introOps.alerts.empty")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </PlatformShell>
  );
}

function HealthTile({
  title,
  status,
  icon: Icon,
  metrics,
  t,
}: {
  title: string;
  status: OpsSubsystemStatus | undefined;
  icon: typeof Cpu;
  metrics: { label: string; value: number }[];
  t: ReturnType<typeof useT>;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <StatusPill
          status={status ?? "healthy"}
          label={t(`bc.introOps.status.${status ?? "unknown"}`)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.label}
            </div>
            <div className="text-lg font-semibold text-foreground">{m.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatByStatusCard({
  title,
  data,
  extra,
}: {
  title: string;
  data: { total: number; by_status: Record<string, number> } | undefined;
  extra?: Record<string, number>;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <div className="text-lg font-bold text-foreground">{data?.total ?? 0}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data?.by_status &&
          Object.entries(data.by_status).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px]"
            >
              <span className="font-medium">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </span>
          ))}
      </div>
      {extra ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(extra).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[11px]"
            >
              <span className="font-medium">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
