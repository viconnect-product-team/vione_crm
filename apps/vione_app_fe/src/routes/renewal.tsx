import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Send,
  Undo2,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { useT, type TKey } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";
import {
  renewalKpis,
  type RenewalRecord,
  type RenewalStatus,
  type PaymentStatus,
} from "@/lib/renewal-data";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  listRenewalsFn,
  renewMembershipFn,
  bulkRenewMembershipFn,
  sendRenewalReminderFn,
  cancelRenewalFn,
  setPaymentStatusFn,
} from "@/lib/renewals.functions";

export const Route = createFileRoute("/renewal")({
  ssr: false,
  loader: () => listRenewalsFn(),
  component: RenewalPage,
});

const TABS: { key: RenewalStatus | "all"; label: TKey }[] = [
  { key: "all", label: "renewal.tab.all" },
  { key: "upcoming", label: "renewal.tab.upcoming" },
  { key: "due", label: "renewal.tab.due" },
  { key: "overdue", label: "renewal.tab.overdue" },
  { key: "renewed", label: "renewal.tab.renewed" },
];

const STATUS_STYLE: Record<RenewalStatus, { bg: string; fg: string; label: TKey }> = {
  upcoming: {
    bg: "oklch(0.94 0.05 220)",
    fg: "oklch(0.42 0.15 220)",
    label: "renewal.status.upcoming",
  },
  due: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)", label: "renewal.status.due" },
  overdue: {
    bg: "oklch(0.93 0.06 25)",
    fg: "oklch(0.50 0.20 25)",
    label: "renewal.status.overdue",
  },
  renewed: {
    bg: "oklch(0.93 0.07 155)",
    fg: "oklch(0.40 0.16 155)",
    label: "renewal.status.renewed",
  },
};

function StatusPill({ status }: { status: RenewalStatus }) {
  const t = useT();
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {t(s.label)}
    </span>
  );
}

const PAYMENT_STYLE: Record<PaymentStatus, { bg: string; fg: string; label: TKey }> = {
  unpaid: { bg: "oklch(0.93 0.06 25)", fg: "oklch(0.50 0.20 25)", label: "renewal.payment.unpaid" },
  pending: {
    bg: "oklch(0.94 0.09 75)",
    fg: "oklch(0.45 0.14 65)",
    label: "renewal.payment.pending",
  },
  paid: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)", label: "renewal.payment.paid" },
};

const PAYMENT_ORDER: PaymentStatus[] = ["unpaid", "pending", "paid"];

function PaymentControl({
  status,
  onChange,
}: {
  status: PaymentStatus;
  onChange: (s: PaymentStatus) => void;
}) {
  const t = useT();
  const s = PAYMENT_STYLE[status];
  return (
    <select
      value={status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as PaymentStatus)}
      aria-label={t("renewal.payment.set")}
      className="cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring/30"
      style={{ background: s.bg, color: s.fg }}
    >
      {PAYMENT_ORDER.map((p) => (
        <option key={p} value={p}>
          {t(PAYMENT_STYLE[p].label)}
        </option>
      ))}
    </select>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  hint?: string;
  tone: "info" | "warning" | "danger" | "success";
}) {
  const bg: Record<typeof tone, string> = {
    info: "linear-gradient(135deg, oklch(0.65 0.15 220), oklch(0.78 0.13 220))",
    warning: "linear-gradient(135deg, oklch(0.70 0.16 75), oklch(0.82 0.13 75))",
    danger: "linear-gradient(135deg, oklch(0.62 0.20 25), oklch(0.74 0.17 25))",
    success: "linear-gradient(135deg, oklch(0.65 0.15 155), oklch(0.78 0.14 155))",
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

function DaysCell({ rec }: { rec: RenewalRecord }) {
  const t = useT();
  if (rec.status === "renewed") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const overdue = rec.daysLeft < 0;
  const color = overdue
    ? "oklch(0.50 0.20 25)"
    : rec.daysLeft <= 14
      ? "oklch(0.55 0.16 65)"
      : "oklch(0.50 0.10 220)";
  return (
    <span className="text-sm font-semibold" style={{ color }}>
      {Math.abs(rec.daysLeft)} {overdue ? t("renewal.daysOverdue") : t("renewal.daysLeft")}
    </span>
  );
}

function RenewalPage() {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const records = Route.useLoaderData() as RenewalRecord[];
  const renewFn = useServerFn(renewMembershipFn);
  const bulkRenewFn = useServerFn(bulkRenewMembershipFn);
  const remindFn = useServerFn(sendRenewalReminderFn);
  const cancelFn = useServerFn(cancelRenewalFn);
  const paymentFn = useServerFn(setPaymentStatusFn);

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<RenewalStatus | "all">("all");

  const kpis = useMemo(() => renewalKpis(records), [records]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return records
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) => {
        if (!ql) return true;
        const m = r.member;
        return (
          m.name.toLowerCase().includes(ql) ||
          m.code.toLowerCase().includes(ql) ||
          m.email.toLowerCase().includes(ql)
        );
      });
  }, [q, tab, records]);

  const accessors = useMemo(
    () => ({
      code: (r: RenewalRecord) => r.member.code,
      name: (r: RenewalRecord) => r.member.name,
      level: (r: RenewalRecord) => r.member.level,
      termEnd: (r: RenewalRecord) => r.currentTermEnd,
      daysLeft: (r: RenewalRecord) => r.daysLeft,
      reminders: (r: RenewalRecord) => r.reminderCount,
      status: (r: RenewalRecord) => r.status,
      payment: (r: RenewalRecord) => r.paymentStatus,
    }),
    [],
  );

  const tc = useTableControls(filtered, accessors, {
    initialPageSize: 10,
    initialSortKey: "daysLeft",
    initialSortDir: "asc",
  });

  const handleRenew = async (rec: RenewalRecord) => {
    if (!confirm(t("renewal.confirmRenew"))) return;
    await renewFn({ data: { id: rec.id } });
    toast.success(t("renewal.toast.renewed"));
    router.invalidate();
  };

  const handleRemind = async (rec: RenewalRecord) => {
    await remindFn({ data: { id: rec.id } });
    toast.success(t("renewal.toast.reminded"));
    router.invalidate();
  };

  const handleCancel = async (rec: RenewalRecord) => {
    if (!confirm(t("renewal.confirmCancel"))) return;
    await cancelFn({ data: { id: rec.id } });
    toast.success(t("renewal.toast.cancelled"));
    router.invalidate();
  };

  const handlePayment = async (rec: RenewalRecord, status: PaymentStatus) => {
    await paymentFn({ data: { id: rec.id, status } });
    toast.success(t("renewal.toast.payment"));
    router.invalidate();
  };

  const handleBulkRemind = async () => {
    const targets = filtered.filter((r) => r.status === "due" || r.status === "overdue");
    await Promise.all(targets.map((r: any) => remindFn({ data: { id: r.id } })));
    toast.success(t("renewal.toast.bulk").replace("{n}", String(targets.length)));
    router.invalidate();
  };

  const handleBulkRenew = async () => {
    const targets = filtered.filter((r) => r.status !== "renewed");
    if (targets.length === 0) {
      toast.error(t("renewal.toast.noneToRenew"));
      return;
    }
    if (!confirm(t("renewal.confirmBulkRenew").replace("{n}", String(targets.length)))) return;
    const res = await bulkRenewFn({ data: { ids: targets.map((r: any) => r.id) } });
    toast.success(t("renewal.toast.bulkRenewed").replace("{n}", String(res.renewed)));
    router.invalidate();
  };

  const handleExport = () => {
    downloadCsv("renewals", filtered, [
      { header: "Code", value: (r) => r.member.code },
      { header: "Name", value: (r) => r.member.name },
      { header: "Email", value: (r) => r.member.email },
      { header: "Level", value: (r) => r.member.level },
      { header: "TermEnd", value: (r) => r.currentTermEnd },
      { header: "DaysLeft", value: (r) => r.daysLeft },
      { header: "Status", value: (r) => r.status },
      { header: "Payment", value: (r) => r.paymentStatus },
      { header: "Reminders", value: (r) => r.reminderCount },
      { header: "LastReminder", value: (r) => r.lastReminder ?? "" },
      { header: "RenewedAt", value: (r) => r.renewedAt ?? "" },
      { header: "NewTermEnd", value: (r) => r.newTermEnd ?? "" },
    ]);
  };

  const counts: Record<RenewalStatus | "all", number> = {
    all: records.length,
    upcoming: kpis.upcoming,
    due: kpis.due,
    overdue: kpis.overdue,
    renewed: kpis.renewed,
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-foreground">
            {t("renewal.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("renewal.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("renewal.export")}
          </button>
          <button
            onClick={handleBulkRenew}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4 text-primary" />
            {t("renewal.bulkRenew")}
          </button>
          <button
            onClick={handleBulkRemind}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send className="h-4 w-4" />
            {t("renewal.bulkRemind")}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("renewal.kpi.upcoming")} value={kpis.upcoming} icon={Clock} tone="info" />
        <KpiCard
          label={t("renewal.kpi.due")}
          value={kpis.due}
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label={t("renewal.kpi.overdue")}
          value={kpis.overdue}
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label={t("renewal.kpi.renewed")}
          value={kpis.renewed}
          icon={CheckCircle2}
          hint={`${kpis.renewalRate}% ${t("renewal.kpi.rate").toLowerCase()}`}
          tone="success"
        />
      </div>

      {/* Progress */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t("renewal.progress")}</h3>
          </div>
          <div className="text-sm font-bold text-foreground">
            {kpis.renewed}/{kpis.total} · {kpis.renewalRate}%
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${kpis.renewalRate}%`, background: "var(--gradient-primary)" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("renewal.search")}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs font-semibold shadow-[var(--shadow-card)]">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-md px-3 py-1.5 transition ${
                tab === tb.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(tb.label)}
              <span className="ml-1.5 rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {counts[tb.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto relative">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-secondary px-3 py-3 text-center border-r border-b border-border">
                  STT
                </th>
                <th className="sticky left-[56px] z-20 min-w-[110px] bg-secondary px-4 py-3 border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Mã
                </th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.member")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.tier")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.termEnd")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.daysLeft")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.reminders")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.status")}</th>
                <th className="px-4 py-3 border-b border-border">{t("renewal.col.payment")}</th>
                <th className="sticky right-0 z-20 min-w-[140px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  {t("renewal.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {tc.pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {t("renewal.empty")}
                  </td>
                </tr>
              )}
              {tc.pageRows.map((r: any, idx: number) => (
                <tr
                  key={r.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a,button")) return;
                    navigate({
                      to: "/members/$memberId",
                      params: { memberId: r.member.id },
                      search: REVIEW_SEARCH_RESET,
                    });
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate({
                        to: "/members/$memberId",
                        params: { memberId: r.member.id },
                        search: REVIEW_SEARCH_RESET,
                      });
                    }
                  }}
                  className="group cursor-pointer border-b border-border transition-all duration-150 hover:bg-secondary/60 hover:shadow-[inset_3px_0_0_0_var(--primary)] active:bg-secondary"
                >
                  <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center font-medium text-muted-foreground border-r border-b border-border transition-colors">
                    {(tc.page - 1) * tc.pageSize + idx + 1}
                  </td>
                  <td className="sticky left-[56px] z-10 min-w-[110px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                    {r.member.code}
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {r.member.name
                          .split(" ")
                          .slice(-2)
                          .map((p: string) => p[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {r.member.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {r.member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground border-b border-border">{t(r.member.level)}</td>
                  <td className="px-4 py-3 text-foreground border-b border-border">
                    {new Date(r.currentTermEnd).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <DaysCell rec={r} />
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-semibold text-foreground">{r.reminderCount}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.lastReminder
                        ? `${t("renewal.lastReminder")}: ${new Date(r.lastReminder).toLocaleDateString("vi-VN")}`
                        : t("renewal.never")}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <PaymentControl
                      status={r.paymentStatus}
                      onChange={(s) => handlePayment(r, s)}
                    />
                  </td>
                  <td className="sticky right-0 z-10 min-w-[140px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status !== "renewed" && (
                        <>
                          <button
                            onClick={() => handleRemind(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {t("renewal.action.remind")}
                          </button>
                          <button
                            onClick={() => handleRenew(r)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {t("renewal.action.renew")}
                          </button>
                        </>
                      )}
                      {r.status === "renewed" && (
                        <>
                          {r.newTermEnd && (
                            <span className="text-[11px] text-muted-foreground">
                              → {new Date(r.newTermEnd).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          <button
                            onClick={() => handleCancel(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-background px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            {t("renewal.action.cancel")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={tc.page}
          pageCount={tc.pageCount}
          pageSize={tc.pageSize}
          total={tc.total}
          from={tc.from}
          to={tc.to}
          onPage={tc.setPage}
          onPageSize={tc.setPageSize}
        />
      </div>
    </AppShell>
  );
}
