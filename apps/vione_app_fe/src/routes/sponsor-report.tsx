import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, FileBarChart, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, StatCard, TableShell } from "@/components/dashboard/PageKit";
import { listSponsorsFn, type Sponsor } from "@/lib/sponsors.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/sponsor-report")({
  ssr: false,
  loader: () => listSponsorsFn(),
  component: ReportPage,
});

const TIER_KEY: Record<Sponsor["tier"], TKey> = {
  platinum: "sponsors.tier.platinum",
  gold: "sponsors.tier.gold",
  silver: "sponsors.tier.silver",
  bronze: "sponsors.tier.bronze",
};

function ReportPage() {
  const t = useT();
  const fmt = useFmt();
  const SPONSORS = Route.useLoaderData() as Sponsor[];
  const total = SPONSORS.reduce((s, x) => s + x.amount, 0);
  const byTier = (["platinum", "gold", "silver", "bronze"] as Sponsor["tier"][]).map((tier) => {
    const list = SPONSORS.filter((s) => s.tier === tier);
    const amount = list.reduce((s, x) => s + x.amount, 0);
    return {
      tier,
      count: list.length,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    };
  });
  const top = [...SPONSORS].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title={t("sreport.title")}
        subtitle={t("sreport.subtitle")}
        actions={
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted">
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("common.exportPdf")}
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("sreport.kpi.total")}
          value={fmt.money(total)}
          tone="success"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label={t("sreport.kpi.count")}
          value={SPONSORS.length}
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          label={t("sreport.kpi.avg")}
          value={fmt.money(Math.round(total / SPONSORS.length))}
          tone="info"
          icon={<FileBarChart className="h-4 w-4" />}
        />
        <StatCard
          label={t("sreport.kpi.retention")}
          value="92%"
          hint={t("common.versus")}
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("sreport.byTier")}</h3>
          <div className="space-y-3.5">
            {byTier.map((b) => (
              <div key={b.tier}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-foreground">
                    {t(TIER_KEY[b.tier])} · {b.count} {t("common.units")}
                  </span>
                  <span className="font-semibold text-muted-foreground">
                    {fmt.money(b.amount)} · {b.pct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${b.pct}%`, background: "var(--gradient-primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("sreport.top5")}</h3>
          <div className="space-y-3">
            {top.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(TIER_KEY[s.tier])} · {s.events} {t("events.title").toLowerCase()}
                  </div>
                </div>
                <div className="text-sm font-bold text-primary">{fmt.money(s.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">{t("sreport.detail")}</h3>
      <TableShell
        columns={[
          t("sponsors.col.name"),
          t("sponsors.col.tier"),
          t("sreport.col.events"),
          t("sreport.col.contrib"),
          t("sponsors.col.since"),
        ]}
      >
        {SPONSORS.map((s) => (
          <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
            <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
            <td className="px-4 py-3 text-foreground">{t(TIER_KEY[s.tier])}</td>
            <td className="px-4 py-3 text-foreground">{s.events}</td>
            <td className="px-4 py-3 font-semibold text-primary">{fmt.money(s.amount)}</td>
            <td className="px-4 py-3 text-muted-foreground">{fmt.date(s.since)}</td>
          </tr>
        ))}
      </TableShell>
    </AppShell>
  );
}
