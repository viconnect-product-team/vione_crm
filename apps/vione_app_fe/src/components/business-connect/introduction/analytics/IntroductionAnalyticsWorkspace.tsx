// BC-6.7 — Introduction Analytics workspace.
// Read-only observational analytics. No AI scoring, no leaderboards, no PII.
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useT, useFmt, type TKey } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { AnalyticsFilters } from "./AnalyticsFilters";
import {
  useIntroductionAnalyticsConfidencePerformance,
  useIntroductionAnalyticsIntermediaryImpact,
  useIntroductionAnalyticsOverview,
  useIntroductionAnalyticsPathPerformance,
  useIntroductionAnalyticsTimeToOutcome,
  useIntroductionAnalyticsTrend,
  introductionAnalyticsKeys,
} from "@/hooks/use-introduction-analytics";
import {
  isLowSample,
  type AnalyticsFilters as Filters,
  type FunnelCountsDTO,
  type TimeMetricKind,
} from "@/lib/graph/introduction/analytics";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatPct(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function useDurationFmt() {
  const t = useT();
  return (seconds: number | null): string => {
    if (seconds === null || !Number.isFinite(seconds)) return "—";
    if (seconds < 60) return t("bc.introAnalytics.duration.sec", { n: Math.round(seconds) });
    if (seconds < 3600) return t("bc.introAnalytics.duration.min", { n: Math.round(seconds / 60) });
    if (seconds < 86400)
      return t("bc.introAnalytics.duration.hour", { n: Math.round(seconds / 3600) });
    return t("bc.introAnalytics.duration.day", { n: Math.round(seconds / 86400) });
  };
}

const FUNNEL_ORDER: Array<{ key: keyof FunnelCountsDTO; label: TKey }> = [
  { key: "requested", label: "bc.introAnalytics.funnel.requested" },
  { key: "accepted", label: "bc.introAnalytics.funnel.accepted" },
  { key: "delivered", label: "bc.introAnalytics.funnel.delivered" },
  { key: "acknowledged", label: "bc.introAnalytics.funnel.acknowledged" },
  { key: "connected", label: "bc.introAnalytics.funnel.connected" },
];

const OUTCOME_MIX: Array<{ key: keyof FunnelCountsDTO; label: TKey; color: string }> = [
  { key: "connected", label: "bc.introAnalytics.funnel.connected", color: "hsl(var(--primary))" },
  { key: "progressed", label: "bc.introAnalytics.funnel.progressed", color: "hsl(142 71% 45%)" },
  { key: "notConnected", label: "bc.introAnalytics.funnel.notConnected", color: "hsl(38 92% 50%)" },
  {
    key: "closedNoOutcome",
    label: "bc.introAnalytics.funnel.closedNoOutcome",
    color: "hsl(var(--muted-foreground))",
  },
  { key: "expired", label: "bc.introAnalytics.funnel.expired", color: "hsl(0 72% 51%)" },
];

const TIME_METRIC_LABELS: Record<TimeMetricKind, TKey> = {
  accept: "bc.introAnalytics.metric.accept",
  deliver: "bc.introAnalytics.metric.deliver",
  ack: "bc.introAnalytics.metric.ack",
  connect: "bc.introAnalytics.metric.connect",
  progressed: "bc.introAnalytics.metric.progressed",
};

export function IntroductionAnalyticsWorkspace() {
  const t = useT();
  const fmt = useFmt();
  const fmtDuration = useDurationFmt();
  const qc = useQueryClient();
  const { isAdmin, isPlatformAdmin } = useRole();
  const canPlatform = isAdmin || isPlatformAdmin;

  const [filters, setFilters] = useState<Filters>({
    scope: "self_requester",
    fromDate: isoDaysAgo(29),
    toDate: isoDaysAgo(0),
    pathDepth: 0,
    confidence: "all",
  });

  const overview = useIntroductionAnalyticsOverview(filters);
  const trend = useIntroductionAnalyticsTrend(filters);
  const tto = useIntroductionAnalyticsTimeToOutcome(filters);
  const path = useIntroductionAnalyticsPathPerformance(filters);
  const conf = useIntroductionAnalyticsConfidencePerformance(filters);
  const impact = useIntroductionAnalyticsIntermediaryImpact(
    filters.fromDate,
    filters.toDate,
    filters.scope === "self_intermediary",
  );

  const anyLoading =
    overview.isLoading || trend.isLoading || tto.isLoading || path.isLoading || conf.isLoading;
  const anyError =
    overview.error || trend.error || tto.error || path.error || conf.error || impact.error;

  const overviewLowSample = overview.data?.lowSample ?? isLowSample(overview.data?.sampleSize ?? 0);

  const funnelData = useMemo(() => {
    if (!overview.data) return [];
    return FUNNEL_ORDER.map((f) => ({
      name: t(f.label),
      value: overview.data!.counts[f.key],
    }));
  }, [overview.data, t]);

  const outcomeMixData = useMemo(() => {
    if (!overview.data) return [];
    return OUTCOME_MIX.map((o) => ({
      name: t(o.label),
      value: overview.data!.counts[o.key],
      color: o.color,
    })).filter((d) => d.value > 0);
  }, [overview.data, t]);

  const trendData = useMemo(() => {
    if (!trend.data) return [];
    return trend.data.points.map((p) => ({
      date: p.metricDate,
      requested: p.counts.requested,
      delivered: p.counts.delivered,
      connected: p.counts.connected,
    }));
  }, [trend.data]);

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: introductionAnalyticsKeys.root });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("bc.introAnalytics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={anyLoading}
          aria-label={t("bc.introAnalytics.refresh")}
        >
          {anyLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          )}
          {t("bc.introAnalytics.refresh")}
        </Button>
      </header>

      <AnalyticsFilters value={filters} onChange={setFilters} isAdmin={canPlatform} />

      {anyError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {t("bc.introAnalytics.error")}
        </div>
      ) : null}

      {overviewLowSample && overview.data ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {t("bc.introAnalytics.lowSample")}
        </div>
      ) : null}

      {/* Overview KPI grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("bc.introAnalytics.section.overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.isLoading || !overview.data ? (
            <div className="text-sm text-muted-foreground">{t("bc.introAnalytics.loading")}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                {
                  label: "bc.introAnalytics.rate.acceptance",
                  value: overview.data.rates.acceptanceRate,
                },
                {
                  label: "bc.introAnalytics.rate.delivery",
                  value: overview.data.rates.deliveryRate,
                },
                {
                  label: "bc.introAnalytics.rate.acknowledgment",
                  value: overview.data.rates.acknowledgmentRate,
                },
                {
                  label: "bc.introAnalytics.rate.connection",
                  value: overview.data.rates.connectionConversion,
                },
                {
                  label: "bc.introAnalytics.rate.progression",
                  value: overview.data.rates.progressionRate,
                },
              ].map((r: any) => (
                <div key={r.label} className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">{t(r.label as TKey)}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {formatPct(r.value, fmt.locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("bc.introAnalytics.section.funnel")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {funnelData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Outcome mix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("bc.introAnalytics.section.outcomeMix")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {outcomeMixData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={outcomeMixData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {outcomeMixData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("bc.introAnalytics.section.trend")}</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => fmt.date(d as string)} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(d) => fmt.date(d as string)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requested"
                  name={t("bc.introAnalytics.funnel.requested")}
                  stroke="hsl(var(--muted-foreground))"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  name={t("bc.introAnalytics.funnel.delivered")}
                  stroke="hsl(38 92% 50%)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="connected"
                  name={t("bc.introAnalytics.funnel.connected")}
                  stroke="hsl(var(--primary))"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Time to outcome */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("bc.introAnalytics.section.tto")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tto.isLoading || !tto.data ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.loading")}</p>
          ) : tto.data.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{t("bc.introAnalytics.section.tto")}</th>
                    <th className="py-2 pr-4 font-medium">{t("bc.introAnalytics.tto.p50")}</th>
                    <th className="py-2 pr-4 font-medium">{t("bc.introAnalytics.tto.p75")}</th>
                    <th className="py-2 pr-4 font-medium">{t("bc.introAnalytics.tto.p90")}</th>
                    <th className="py-2 pr-4 font-medium">
                      {t("bc.introAnalytics.tto.sample", { n: "" })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tto.data.rows.map((r: any) => (
                    <tr key={r.metric} className="border-t">
                      <td className="py-2 pr-4">{t((TIME_METRIC_LABELS as any)[r.metric])}</td>
                      <td className="py-2 pr-4 tabular-nums">{fmtDuration(r.p50Seconds)}</td>
                      <td className="py-2 pr-4 tabular-nums">{fmtDuration(r.p75Seconds)}</td>
                      <td className="py-2 pr-4 tabular-nums">{fmtDuration(r.p90Seconds)}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {fmt.num(r.sampleSize)}
                        {r.lowSample ? (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {t("bc.introAnalytics.lowSample")}
                          </Badge>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Path performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("bc.introAnalytics.section.path")}</CardTitle>
        </CardHeader>
        <CardContent>
          {path.isLoading || !path.data ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.loading")}</p>
          ) : path.data.buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {path.data.buckets.map((b) => (
                <div key={b.pathDepth} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t(`bc.introAnalytics.pathDepth.${b.pathDepth}` as TKey)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("bc.introAnalytics.tto.sample", { n: fmt.num(b.sampleSize) })}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.acceptance")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.acceptanceRate, fmt.locale)}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.delivery")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.deliveryRate, fmt.locale)}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.connection")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.connectionConversion, fmt.locale)}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("bc.introAnalytics.section.confidence")}</CardTitle>
        </CardHeader>
        <CardContent>
          {conf.isLoading || !conf.data ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.loading")}</p>
          ) : conf.data.buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {conf.data.buckets.map((b) => (
                <div key={b.bucket} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t(`bc.introAnalytics.confidence.${b.bucket}` as TKey)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("bc.introAnalytics.tto.sample", { n: fmt.num(b.sampleSize) })}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.acceptance")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.acceptanceRate, fmt.locale)}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.acknowledgment")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.acknowledgmentRate, fmt.locale)}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t("bc.introAnalytics.rate.connection")}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPct(b.rates.connectionConversion, fmt.locale)}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intermediary impact — visible only when scope = self_intermediary */}
      {filters.scope === "self_intermediary" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("bc.introAnalytics.section.impact")}</CardTitle>
          </CardHeader>
          <CardContent>
            {impact.isLoading || !impact.data ? (
              <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.loading")}</p>
            ) : impact.data.sampleSize === 0 ? (
              <p className="text-sm text-muted-foreground">{t("bc.introAnalytics.empty")}</p>
            ) : (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("bc.introAnalytics.impact.notice")}
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat
                    label={t("bc.introAnalytics.funnel.delivered")}
                    value={fmt.num(impact.data.counts.delivered)}
                  />
                  <Stat
                    label={t("bc.introAnalytics.funnel.acknowledged")}
                    value={fmt.num(impact.data.counts.acknowledged)}
                  />
                  <Stat
                    label={t("bc.introAnalytics.funnel.connected")}
                    value={fmt.num(impact.data.counts.connected)}
                  />
                  <Stat
                    label={t("bc.introAnalytics.impact.medianDeliver")}
                    value={fmtDuration(impact.data.medianDeliverSeconds)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("bc.introAnalytics.disclaimer")}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
