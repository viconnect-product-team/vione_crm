import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Filter, PieChart, Search, Tags, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { useT, type TKey } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";
import {
  type IndustryKey,
  type Member,
  type MemberLevelKey,
  type MemberStatus,
  type RegionKey,
} from "@/lib/members-data";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/segments")({
  component: SegmentsPage,
});

const LEVELS: MemberLevelKey[] = [
  "memberLevel.large",
  "memberLevel.medium",
  "memberLevel.small",
  "memberLevel.individual",
];
const INDUSTRIES: IndustryKey[] = [
  "ind.trade",
  "ind.it",
  "ind.manufacturing",
  "ind.realestate",
  "ind.finance",
];
const REGIONS: RegionKey[] = ["region.north", "region.central", "region.south"];
const STATUSES: MemberStatus[] = ["active", "pending", "expired"];

const LEVEL_COLORS: Record<MemberLevelKey, string> = {
  "memberLevel.large": "oklch(0.62 0.18 265)",
  "memberLevel.medium": "oklch(0.70 0.16 200)",
  "memberLevel.small": "oklch(0.78 0.15 145)",
  "memberLevel.individual": "oklch(0.74 0.16 75)",
};

type Dim = "level" | "industry" | "region" | "status";

function groupBy<K extends string>(arr: Member[], key: (m: Member) => K) {
  const map = new Map<K, number>();
  for (const m of arr) map.set(key(m), (map.get(key(m)) ?? 0) + 1);
  return map;
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function StatusDot({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, string> = {
    active: "oklch(0.55 0.16 155)",
    pending: "oklch(0.65 0.14 75)",
    expired: "oklch(0.58 0.20 25)",
  };
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: map[status] }} />;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const bg: Record<string, string> = {
    primary: "var(--gradient-primary)",
    success: "linear-gradient(135deg, oklch(0.65 0.15 155), oklch(0.78 0.14 155))",
    warning: "linear-gradient(135deg, oklch(0.70 0.16 75), oklch(0.82 0.13 75))",
    info: "linear-gradient(135deg, oklch(0.65 0.15 220), oklch(0.78 0.13 220))",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
          style={{ background: bg[tone] }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DonutChart({ data }: { data: { key: MemberLevelKey; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const radius = 70;
  const stroke = 22;
  const c = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="oklch(0.94 0.01 250)"
          strokeWidth={stroke}
        />
        {data.map((d) => {
          const len = (d.count / total) * c;
          const seg = (
            <circle
              key={d.key}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={LEVEL_COLORS[d.key]}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          {total}
        </text>
        <text
          x="100"
          y="116"
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 10 }}
        >
          members
        </text>
      </svg>
    </div>
  );
}

function normalizeMember(m: Member): Member {
  let level = m.level;
  if (!LEVELS.includes(level as any)) {
    const l = String(level || "").toLowerCase();
    if (l.includes("large") || l.includes("vip") || l.includes("diamond") || l.includes("kim")) level = "memberLevel.large";
    else if (l.includes("medium") || l.includes("gold") || l.includes("vang")) level = "memberLevel.medium";
    else if (l.includes("small") || l.includes("silver") || l.includes("bac")) level = "memberLevel.small";
    else level = "memberLevel.individual";
  }

  let industry = m.industry;
  if (!INDUSTRIES.includes(industry as any)) {
    const ind = String(industry || "").toLowerCase();
    if (ind.includes("it") || ind.includes("công nghệ") || ind.includes("phần mềm")) industry = "ind.it";
    else if (ind.includes("sản xuất") || ind.includes("manufacturing")) industry = "ind.manufacturing";
    else if (ind.includes("bất động sản") || ind.includes("realestate") || ind.includes("địa ốc")) industry = "ind.realestate";
    else if (ind.includes("tài chính") || ind.includes("finance") || ind.includes("ngân hàng")) industry = "ind.finance";
    else industry = "ind.trade";
  }

  let region = m.region;
  if (!REGIONS.includes(region as any)) {
    const reg = String(region || "").toLowerCase();
    if (reg.includes("trung") || reg.includes("đà nẵng") || reg.includes("huế") || reg.includes("central")) region = "region.central";
    else if (reg.includes("nam") || reg.includes("hồ chí minh") || reg.includes("hcm") || reg.includes("sài gòn") || reg.includes("south")) region = "region.south";
    else region = "region.north";
  }

  let status = m.status;
  if (!STATUSES.includes(status as any)) {
    status = "active";
  }

  return {
    ...m,
    level,
    industry,
    region,
    status,
  };
}

function SegmentsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data: MEMBERS = [] } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () =>
      fetchNestApi<Member[]>("/members")
        .then((res) => (Array.isArray(res) ? res.map(normalizeMember) : []))
        .catch(() => []),
  });

  const [q, setQ] = useState("");
  const [level, setLevel] = useState<MemberLevelKey | "all">("all");
  const [region, setRegion] = useState<RegionKey | "all">("all");
  const [industry, setIndustry] = useState<IndustryKey | "all">("all");
  const [status, setStatus] = useState<MemberStatus | "all">("all");
  const [dim, setDim] = useState<Dim>("level");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return MEMBERS.filter((m) => {
      if (level !== "all" && m.level !== level) return false;
      if (region !== "all" && m.region !== region) return false;
      if (industry !== "all" && m.industry !== industry) return false;
      if (status !== "all" && m.status !== status) return false;
      if (ql && !m.name.toLowerCase().includes(ql) && !m.code.toLowerCase().includes(ql))
        return false;
      return true;
    });
  }, [q, level, region, industry, status, MEMBERS]);

  const total = filtered.length;

  const handleExport = () => {
    downloadCsv("segments", filtered, [
      { header: "Code", value: (m) => m.code },
      { header: "Name", value: (m) => m.name },
      { header: "Email", value: (m) => m.email },
      { header: "Level", value: (m) => m.level },
      { header: "Industry", value: (m) => m.industry },
      { header: "Region", value: (m) => m.region },
      { header: "Status", value: (m) => m.status },
    ]);
  };
  const byLevel = useMemo(() => groupBy(filtered, (m) => m.level), [filtered]);
  const byRegion = useMemo(() => groupBy(filtered, (m) => m.region), [filtered]);
  const byIndustry = useMemo(() => groupBy(filtered, (m) => m.industry), [filtered]);
  const byStatus = useMemo(() => groupBy(filtered, (m) => m.status), [filtered]);

  const activeCount = byStatus.get("active") ?? 0;
  const pendingCount = byStatus.get("pending") ?? 0;
  const largeCount = byLevel.get("memberLevel.large") ?? 0;

  const donutData = LEVELS.map((k) => ({ key: k, count: byLevel.get(k) ?? 0 })).filter(
    (d) => d.count > 0,
  );

  const dimMap: Record<Dim, { keys: readonly string[]; map: Map<string, number>; label: TKey }> = {
    level: { keys: LEVELS, map: byLevel as Map<string, number>, label: "seg.byLevel" },
    industry: { keys: INDUSTRIES, map: byIndustry as Map<string, number>, label: "seg.byIndustry" },
    region: { keys: REGIONS, map: byRegion as Map<string, number>, label: "seg.byRegion" },
    status: {
      keys: STATUSES.map((s) => `status.${s}`),
      map: new Map(Array.from(byStatus.entries()).map(([k, v]) => [`status.${k}`, v])),
      label: "seg.byStatus",
    },
  };
  const breakdown = dimMap[dim];

  const reset = () => {
    setQ("");
    setLevel("all");
    setRegion("all");
    setIndustry("all");
    setStatus("all");
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-foreground">
            {t("seg.page.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("seg.page.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("seg.export")}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("seg.kpi.total")}
          value={total}
          icon={Users}
          hint={t("seg.kpi.totalHint")}
          tone="primary"
        />
        <KpiCard
          label={t("seg.kpi.active")}
          value={activeCount}
          icon={TrendingUp}
          hint={`${pct(activeCount, total)}% ${t("seg.ofTotal")}`}
          tone="success"
        />
        <KpiCard
          label={t("seg.kpi.large")}
          value={largeCount}
          icon={Tags}
          hint={`${pct(largeCount, total)}% ${t("seg.ofTotal")}`}
          tone="info"
        />
        <KpiCard
          label={t("seg.kpi.pending")}
          value={pendingCount}
          icon={PieChart}
          hint={t("seg.kpi.pendingHint")}
          tone="warning"
        />
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("seg.search")}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as MemberLevelKey | "all")}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
          >
            <option value="all">
              {t("seg.filter.level")}: {t("members.filter.all")}
            </option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {t(l)}
              </option>
            ))}
          </select>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryKey | "all")}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
          >
            <option value="all">
              {t("members.filter.industry")}: {t("members.filter.all")}
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {t(i)}
              </option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionKey | "all")}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
          >
            <option value="all">
              {t("members.filter.region")}: {t("members.filter.all")}
            </option>
            {REGIONS.map((r: any) => (
              <option key={r} value={r}>
                {t(r)}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MemberStatus | "all")}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
          >
            <option value="all">
              {t("tbl.status")}: {t("members.filter.all")}
            </option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}` as TKey)}
              </option>
            ))}
          </select>
          <button
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            {t("members.filter.reset")}
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-semibold text-foreground">{t("seg.byLevel")}</h3>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("members.empty")}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {LEVELS.map((k) => {
              const c = byLevel.get(k) ?? 0;
              return (
                <div key={k} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: LEVEL_COLORS[k] }}
                    />
                    <span className="text-foreground">{t(k)}</span>
                  </div>
                  <span className="font-semibold text-muted-foreground">
                    {c} · {pct(c, total)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">{t("seg.distribution")}</h3>
            <div className="inline-flex rounded-lg border border-border bg-secondary p-0.5 text-xs font-semibold">
              {(["level", "industry", "region", "status"] as Dim[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDim(d)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    dim === d
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`seg.dim.${d}` as TKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {breakdown.keys.map((k) => {
              const c = breakdown.map.get(k) ?? 0;
              const p = pct(c, total);
              return (
                <div key={k}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-foreground">{t(k as TKey)}</span>
                    <span className="font-semibold text-muted-foreground">
                      {c} · {p}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member list in selected segment */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">{t("seg.results")}</h3>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {t("members.count")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{t("tbl.code")}</th>
                <th className="px-4 py-3">{t("tbl.name")}</th>
                <th className="px-4 py-3">{t("detail.level")}</th>
                <th className="px-4 py-3">{t("tbl.industry")}</th>
                <th className="px-4 py-3">{t("tbl.region")}</th>
                <th className="px-4 py-3">{t("tbl.status")}</th>
                <th className="px-4 py-3 text-right">{t("tbl.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {t("members.empty")}
                  </td>
                </tr>
              )}
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a,button")) return;
                    navigate({
                      to: "/members/$memberId",
                      params: { memberId: m.id },
                      search: REVIEW_SEARCH_RESET,
                    });
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate({
                        to: "/members/$memberId",
                        params: { memberId: m.id },
                        search: REVIEW_SEARCH_RESET,
                      });
                    }
                  }}
                  className="cursor-pointer border-b border-border last:border-0 transition-all duration-150 hover:bg-secondary/60 hover:shadow-[inset_3px_0_0_0_var(--primary)] active:bg-secondary active:scale-[0.998] focus-within:bg-secondary/60"
                >
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-primary">
                    {m.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold text-primary-foreground"
                      style={{ background: LEVEL_COLORS[m.level] }}
                    >
                      {t(m.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{t(m.industry)}</td>
                  <td className="px-4 py-3 text-foreground">{t(m.region)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                      <StatusDot status={m.status} />
                      {t(`status.${m.status}` as TKey)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/members/$memberId"
                      params={{ memberId: m.id }}
                      search={REVIEW_SEARCH_RESET}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      {t("tbl.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
