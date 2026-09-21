import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { useServerData } from "@/hooks/use-server-data";
import { useLang } from "@/lib/i18n";
import { getCtaFunnel, type CtaBucket, type CtaFunnel } from "@/lib/demo-admin.functions";

export const Route = createFileRoute("/admin/cta-analytics")({
  component: CtaAnalyticsPage,
  head: () => ({
    meta: [
      { title: "Phân tích nguồn CTA | Business Connect" },
      {
        name: "description",
        content:
          "Dashboard theo dõi nguồn CTA từ landing page: tỷ lệ chuyển đổi theo source và intent của lead đặt lịch demo.",
      },
      { property: "og:title", content: "Phân tích nguồn CTA" },
      {
        property: "og:description",
        content: "Tỷ lệ chuyển đổi lead demo theo source/intent từ landing page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Bi = { vi: string; en: string };

const EMPTY: CtaFunnel = {
  totals: { total: 0, contacted: 0, scheduled: 0, completed: 0, cancelled: 0, conversionRate: 0 },
  bySource: [],
  byIntent: [],
  matrix: [],
  daily: [],
};

function CtaAnalyticsPage() {
  const { lang } = useLang();
  const tx = useCallback((b: Bi) => (lang === "vi" ? b.vi : b.en), [lang]);
  const { isAdmin, isPlatformAdmin, loading: roleLoading } = useRole();
  const allowed = isAdmin || isPlatformAdmin;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ from: "", to: "" });

  const fetcher = useCallback(
    () => (allowed ? getCtaFunnel({ data: applied }) : Promise.resolve(EMPTY)),
    [allowed, applied],
  );
  const { data, loading, error, reload } = useServerData<CtaFunnel>(fetcher, EMPTY);

  const maxDaily = useMemo(() => Math.max(1, ...data.daily.map((d) => d.total)), [data.daily]);

  const exportCsv = () => {
    const rows = [
      [
        "scope",
        "key",
        "total",
        "contacted",
        "scheduled",
        "completed",
        "cancelled",
        "conversion_rate_%",
      ],
      ...data.bySource.map((b) => [
        "source",
        b.key,
        b.total,
        b.contacted,
        b.scheduled,
        b.completed,
        b.cancelled,
        b.conversionRate,
      ]),
      ...data.byIntent.map((b) => [
        "intent",
        b.key,
        b.total,
        b.contacted,
        b.scheduled,
        b.completed,
        b.cancelled,
        b.conversionRate,
      ]),
    ];
    const csv = rows
      .map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cta-attribution-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis: { label: Bi; value: string }[] = [
    { label: { vi: "Tổng lead", en: "Total leads" }, value: String(data.totals.total) },
    { label: { vi: "Đã liên hệ", en: "Contacted" }, value: String(data.totals.contacted) },
    { label: { vi: "Đã lên lịch", en: "Scheduled" }, value: String(data.totals.scheduled) },
    { label: { vi: "Hoàn tất", en: "Completed" }, value: String(data.totals.completed) },
    {
      label: { vi: "Tỷ lệ chuyển đổi", en: "Conversion rate" },
      value: `${data.totals.conversionRate}%`,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={tx({ vi: "Phân tích nguồn CTA", en: "CTA source analytics" })}
        subtitle={tx({
          vi: "Tỷ lệ chuyển đổi lead demo theo source và intent từ landing page.",
          en: "Demo lead conversion by landing page source and intent.",
        })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/demo-leads"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {tx({ vi: "Danh sách lead", en: "Lead list" })}
            </Link>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {tx({ vi: "Làm mới", en: "Refresh" })}
            </button>
          </div>
        }
      />

      {!roleLoading && !allowed ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {tx({
            vi: "Bạn không có quyền xem dữ liệu này.",
            en: "You do not have permission to view this data.",
          })}
        </Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="cta-from"
                  className="mb-1 block text-xs font-semibold text-muted-foreground"
                >
                  {tx({ vi: "Từ ngày", en: "From" })}
                </label>
                <input
                  id="cta-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="cta-to"
                  className="mb-1 block text-xs font-semibold text-muted-foreground"
                >
                  {tx({ vi: "Đến ngày", en: "To" })}
                </label>
                <input
                  id="cta-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setApplied({ from, to })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {tx({ vi: "Áp dụng", en: "Apply" })}
              </button>
              {(applied.from || applied.to) && (
                <button
                  type="button"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setApplied({ from: "", to: "" });
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {tx({ vi: "Xoá lọc", en: "Clear" })}
                </button>
              )}
            </div>
          </Card>

          {error && (
            <Card className="mb-4 border-destructive/40 p-4 text-sm text-destructive">{error}</Card>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {kpis.map((k) => (
              <Card key={k.label.en} className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{tx(k.label)}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
              </Card>
            ))}
          </div>

          {loading ? (
            <Card className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tx({ vi: "Đang tải dữ liệu…", en: "Loading data…" })}
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <BucketTable
                title={tx({ vi: "Theo nguồn CTA (source)", en: "By CTA source" })}
                rows={data.bySource}
                tx={tx}
              />
              <BucketTable
                title={tx({ vi: "Theo ý định (intent)", en: "By intent" })}
                rows={data.byIntent}
                tx={tx}
              />

              <Card className="p-4 lg:col-span-2">
                <h2 className="mb-3 text-sm font-bold text-foreground">
                  {tx({ vi: "Ma trận source × intent", en: "Source × intent matrix" })}
                </h2>
                {data.matrix.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tx({ vi: "Chưa có dữ liệu.", en: "No data yet." })}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-muted-foreground">
                          <th className="py-2">Source</th>
                          <th className="py-2">Intent</th>
                          <th className="py-2 text-right">{tx({ vi: "Lead", en: "Leads" })}</th>
                          <th className="py-2 text-right">
                            {tx({ vi: "Hoàn tất", en: "Completed" })}
                          </th>
                          <th className="py-2 text-right">
                            {tx({ vi: "Chuyển đổi", en: "Conv." })}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.matrix.map((m) => (
                          <tr key={`${m.source}|${m.intent}`} className="border-t border-border">
                            <td className="py-2 font-medium text-foreground">{m.source}</td>
                            <td className="py-2 text-muted-foreground">{m.intent}</td>
                            <td className="py-2 text-right">{m.total}</td>
                            <td className="py-2 text-right">{m.completed}</td>
                            <td className="py-2 text-right">
                              {m.total ? Math.round((m.completed / m.total) * 1000) / 10 : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="p-4 lg:col-span-2">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {tx({
                    vi: "Lead theo ngày (30 ngày gần nhất)",
                    en: "Leads per day (last 30 days)",
                  })}
                </h2>
                {data.daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tx({ vi: "Chưa có dữ liệu.", en: "No data yet." })}
                  </p>
                ) : (
                  <div
                    className="flex h-40 items-end gap-1"
                    role="img"
                    aria-label={tx({ vi: "Biểu đồ lead theo ngày", en: "Leads per day chart" })}
                  >
                    {data.daily.map((d) => (
                      <div
                        key={d.date}
                        className="flex flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div
                          className="w-full rounded-t bg-primary/70"
                          style={{ height: `${(d.total / maxDaily) * 100}%` }}
                          title={`${d.date}: ${d.total}`}
                        />
                        <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function BucketTable({
  title,
  rows,
  tx,
}: {
  title: string;
  rows: CtaBucket[];
  tx: (b: Bi) => string;
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-bold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tx({ vi: "Chưa có dữ liệu.", en: "No data yet." })}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">{tx({ vi: "Khoá", en: "Key" })}</th>
                <th className="py-2 text-right">{tx({ vi: "Lead", en: "Leads" })}</th>
                <th className="py-2 text-right">{tx({ vi: "Hoàn tất", en: "Completed" })}</th>
                <th className="py-2 text-right">{tx({ vi: "Tương tác", en: "Engaged" })}</th>
                <th className="py-2 text-right">{tx({ vi: "Chuyển đổi", en: "Conv." })}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.key} className="border-t border-border">
                  <td className="py-2 font-medium text-foreground">{b.key}</td>
                  <td className="py-2 text-right">{b.total}</td>
                  <td className="py-2 text-right">{b.completed}</td>
                  <td className="py-2 text-right">{b.engagementRate}%</td>
                  <td className="py-2 text-right">
                    <Pill
                      color={
                        b.conversionRate >= 20
                          ? "success"
                          : b.conversionRate > 0
                            ? "info"
                            : "neutral"
                      }
                    >
                      {b.conversionRate}%
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
