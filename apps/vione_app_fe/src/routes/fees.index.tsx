import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Wallet,
  Search,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
  Filter,
  ArrowRight,
  Trash2,
  Pencil,
  X,
  LayoutGrid,
  List as ListIcon,
  CalendarClock,
  Users,
  ListChecks,
  BellRing,
  CheckSquare,
  Square,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { EmptyState, NoSearchResult } from "@/components/dashboard/StateKit";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import { useT, type TKey } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { downloadCsv } from "@/lib/csv";
import { useTableControls } from "@/hooks/use-table-controls";
import { useUrlState } from "@/hooks/use-url-state";
import { Pagination, SortHeader } from "@/components/dashboard/DataTablePagination";
import { feeKpis, formatVnd, DEFAULT_FEE_INVOICES, type FeeRecord, type FeeStatus } from "@/lib/fees-data";
import {
  listInvoicesFn,
  createInvoiceFn,
  deleteInvoiceFn,
  addReminderFn,
} from "@/lib/fees.functions";
import { fetchNestApi } from "@/lib/api-client";
import type { Member } from "@/lib/members-data";

export const Route = createFileRoute("/fees/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hội phí — ViOne" },
      { name: "description", content: "Quản lý thu hội phí, hóa đơn và nhắc nhở thanh toán." },
      { property: "og:title", content: "Hội phí — ViOne" },
      { property: "og:description", content: "Theo dõi tỷ lệ thu hội phí của hiệp hội." },
    ],
  }),
  loader: async () => {
    const [invoices, members] = await Promise.all([
      listInvoicesFn().catch(() => DEFAULT_FEE_INVOICES),
      fetchNestApi<Member[]>("/members").then((res) => (Array.isArray(res) ? res : [])).catch(() => []),
    ]);
    const finalInvoices = Array.isArray(invoices) && invoices.length > 0 ? invoices : DEFAULT_FEE_INVOICES;
    return { invoices: finalInvoices, members };
  },
  component: FeesPage,
});

const statusMeta: Record<FeeStatus, { label: TKey; dot: string; text: string; bg: string }> = {
  paid: { label: "fees.status.paid", dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  unpaid: {
    label: "fees.status.unpaid",
    dot: "bg-warning",
    text: "text-[oklch(0.45_0.16_65)]",
    bg: "bg-warning/15",
  },
  overdue: {
    label: "fees.status.overdue",
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
  },
};

function StatusBadge({ s }: { s: FeeStatus }) {
  const t = useT();
  const m = statusMeta[s];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {t(m.label)}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-[oklch(0.45_0.16_65)]",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{label}</div>
    </div>
  );
}

type SortOption = "newest" | "due" | "amount" | "name";
type QuickFilter = "all" | "paid" | "unpaid" | "overdue" | "dueSoon";
type TypeFilter = "all" | "company" | "individual";

const sortMap: Record<SortOption, { key: string; dir: "asc" | "desc" }> = {
  newest: { key: "due", dir: "desc" },
  due: { key: "due", dir: "asc" },
  amount: { key: "amount", dir: "desc" },
  name: { key: "member", dir: "asc" },
};

function daysUntil(iso: string) {
  const to = new Date(iso);
  to.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((to.getTime() - today.getTime()) / 86400000);
}

function isDueSoon(r: FeeRecord) {
  if (r.status !== "unpaid") return false;
  const d = daysUntil(r.dueDate);
  return d >= 0 && d <= 30;
}

function FeesPage() {
  const t = useT();
  const router = useRouter();
  const { invoices: allRecords, members } = Route.useLoaderData() as {
    invoices: FeeRecord[];
    members: Member[];
  };
  const createFn = useServerFn(createInvoiceFn);
  const deleteFn = useServerFn(deleteInvoiceFn);
  const remindFn = useServerFn(addReminderFn);
  const { isAdmin, isModerator } = useRole();
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const YEARS = useMemo(() => {
    const ys = Array.from(new Set(allRecords.map((r: any) => r.year)));
    if (!ys.includes(new Date().getFullYear())) ys.push(new Date().getFullYear());
    return ys.sort((a, b) => b - a);
  }, [allRecords]);
  const [year, setYear] = useState<number>(YEARS[0]);
  const [status, setStatus] = useState<QuickFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [q, setQ] = useUrlState<string>("q", "");
  const [view, setView] = useUrlState<"card" | "list">("view", "list");
  const [sortKey, setSortKey] = useState<string>(sortMap.due.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(sortMap.due.dir);
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = async (r: FeeRecord) => {
    if (!window.confirm(t("fees.deleteConfirm"))) return;
    try {
      await deleteFn({ data: { id: r.id } });
      toast.success(t("fees.deleted"));
      router.invalidate();
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    }
  };

  const handleRemind = async (r: FeeRecord) => {
    setRemindingId(r.id);
    try {
      await remindFn({ data: { invoiceId: r.id, channel: "email" } });
      toast.success(t("fees.queue.reminded"));
      router.invalidate();
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setRemindingId(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const yearRecords = useMemo(() => allRecords.filter((r) => r.year === year), [allRecords, year]);

  const records = useMemo(() => {
    return yearRecords
      .filter((r) => {
        if (status === "all") return true;
        if (status === "dueSoon") return isDueSoon(r);
        return r.status === status;
      })
      .filter((r) => typeFilter === "all" || r.member.type === typeFilter)
      .filter((r) => {
        if (!q) return true;
        const k = q.toLowerCase();
        return (
          r.member.name.toLowerCase().includes(k) ||
          r.member.code.toLowerCase().includes(k) ||
          r.invoiceNo.toLowerCase().includes(k)
        );
      });
  }, [yearRecords, status, typeFilter, q]);

  const sortedRecords = useMemo(() => {
    const acc: Record<string, (r: FeeRecord) => string | number> = {
      invoice: (r) => r.invoiceNo,
      member: (r) => r.member.name,
      amount: (r) => r.amount,
      due: (r) => r.dueDate,
      paid: (r) => r.paidAt ?? "",
      status: (r) => r.status,
    };
    const get = acc[sortKey] ?? acc.due;
    const copy = [...records];
    copy.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  const tc = useTableControls<FeeRecord>(
    sortedRecords,
    {},
    { initialPageSize: view === "card" ? 12 : 20 },
  );

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const currentSort: SortOption =
    (Object.keys(sortMap) as SortOption[]).find(
      (o) => sortMap[o].key === sortKey && sortMap[o].dir === sortDir,
    ) ?? "due";

  const applySort = (opt: SortOption) => {
    setSortKey(sortMap[opt].key);
    setSortDir(sortMap[opt].dir);
  };

  const kpi = useMemo(() => feeKpis(yearRecords), [yearRecords]);
  const dueSoonCount = useMemo(() => yearRecords.filter(isDueSoon).length, [yearRecords]);
  const recentPayments = useMemo(
    () =>
      yearRecords
        .filter((r) => r.status === "paid" && r.paidAt)
        .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
        .slice(0, 5),
    [yearRecords],
  );

  const hasActiveFilters = status !== "all" || typeFilter !== "all" || q !== "";
  const clearFilters = () => {
    setStatus("all");
    setTypeFilter("all");
    setQ("");
  };

  const handleExport = () => {
    downloadCsv(`fees-${year}`, records, [
      { header: "InvoiceNo", value: (r) => r.invoiceNo },
      { header: "Code", value: (r) => r.member.code },
      { header: "Name", value: (r) => r.member.name },
      { header: "Year", value: (r) => r.year },
      { header: "Amount", value: (r) => r.amount },
      { header: "Status", value: (r) => r.status },
      { header: "DueDate", value: (r) => r.dueDate },
      { header: "PaidAt", value: (r) => r.paidAt ?? "" },
      { header: "Method", value: (r) => r.method ?? "" },
    ]);
  };

  // Collection queue — overdue first (highest priority), then due-soon, then remaining unpaid.
  const queue = useMemo(() => {
    const overdue = yearRecords
      .filter((r) => r.status === "overdue")
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
    const dueSoon = yearRecords
      .filter(isDueSoon)
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
    const unpaid = yearRecords
      .filter((r) => r.status === "unpaid" && !isDueSoon(r))
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
    return { overdue, dueSoon, unpaid };
  }, [yearRecords]);

  const selectedRecords = useMemo(
    () => yearRecords.filter((r) => selected.has(r.id)),
    [yearRecords, selected],
  );

  const exportRows = (rows: FeeRecord[], name: string) => {
    if (rows.length === 0) return;
    downloadCsv(name, rows, [
      { header: "InvoiceNo", value: (r) => r.invoiceNo },
      { header: "Code", value: (r) => r.member.code },
      { header: "Name", value: (r) => r.member.name },
      { header: "Year", value: (r) => r.year },
      { header: "Amount", value: (r) => r.amount },
      { header: "Status", value: (r) => r.status },
      { header: "DueDate", value: (r) => r.dueDate },
      { header: "Reminders", value: (r) => r.member.reminderCount ?? 0 },
      { header: "LastReminder", value: (r) => r.member.lastReminder ?? "" },
    ]);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("fees.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fees.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t("fees.export")}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("fees.newInvoice")}
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          icon={Wallet}
          label={t("fees.kpi.total")}
          value={formatVnd(kpi.total)}
          hint={`${t("fees.year")} ${year}`}
        />
        <KpiCard
          icon={CheckCircle2}
          label={t("fees.kpi.collected")}
          value={formatVnd(kpi.collected)}
          tone="success"
          hint={`${kpi.collectionRate}%`}
        />
        <KpiCard
          icon={Clock}
          label={t("fees.kpi.outstanding")}
          value={formatVnd(kpi.outstanding)}
          tone="warning"
        />
        <KpiCard
          icon={CalendarClock}
          label={t("fees.kpi.dueSoon")}
          value={`${dueSoonCount}`}
          tone="warning"
          hint={t("fees.kpi.members")}
        />
        <KpiCard
          icon={AlertTriangle}
          label={t("fees.kpi.overdue")}
          value={`${kpi.overdueCount}`}
          tone="destructive"
          hint={t("fees.kpi.invoices")}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Collection progress */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">{t("fees.progress")}</h3>
            </div>
            <span className="text-xs font-bold text-primary">{kpi.collectionRate}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${kpi.collectionRate}%`, background: "var(--gradient-primary)" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>
              {t("fees.collectedSoFar")}: {formatVnd(kpi.collected)}
            </span>
            <span>
              {t("fees.target")}: {formatVnd(kpi.total)}
            </span>
          </div>
        </div>

        {/* Recent payments */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">{t("fees.recent.title")}</h3>
          </div>
          {recentPayments.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t("fees.recent.empty")}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {recentPayments.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{r.member.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.paidAt && new Date(r.paidAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-success">
                    {formatVnd(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Collection queue */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("fees.queue.title")}</h3>
              <p className="text-[12px] text-muted-foreground">{t("fees.queue.subtitle")}</p>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {t("fees.queue.selected", { n: selected.size })}
              </span>
              <button
                onClick={() => exportRows(selectedRecords, `fees-queue-${year}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t("fees.queue.exportSel")}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("fees.queue.clearSel")}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QueueColumn
            title={t("fees.queue.overdue")}
            tone="destructive"
            count={queue.overdue.length}
            rows={queue.overdue}
            emptyLabel={t("fees.queue.empty.overdue")}
            priority="high"
            selected={selected}
            onToggle={toggleSelect}
            onRemind={handleRemind}
            remindingId={remindingId}
            canRemind={isModerator}
            onFilter={() => setStatus("overdue")}
          />
          <QueueColumn
            title={t("fees.queue.dueSoon")}
            tone="warning"
            count={queue.dueSoon.length}
            rows={queue.dueSoon}
            emptyLabel={t("fees.queue.empty.dueSoon")}
            priority="medium"
            selected={selected}
            onToggle={toggleSelect}
            onRemind={handleRemind}
            remindingId={remindingId}
            canRemind={isModerator}
            onFilter={() => setStatus("dueSoon")}
          />
          <QueueColumn
            title={t("fees.queue.unpaid")}
            tone="primary"
            count={queue.unpaid.length}
            rows={queue.unpaid}
            emptyLabel={t("fees.queue.empty.unpaid")}
            priority="low"
            selected={selected}
            onToggle={toggleSelect}
            onRemind={handleRemind}
            remindingId={remindingId}
            canRemind={isModerator}
            onFilter={() => setStatus("unpaid")}
          />
        </div>
      </div>

      <div className="sm:sticky sm:top-18 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("fees.searchPlaceholder")}
            aria-label={t("fees.searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          {t("fees.filterBy")}
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label={t("fees.year")}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {t("fees.year")} {y}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label={t("fees.filter.type")}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
        >
          <option value="all">{t("fees.type.all")}</option>
          <option value="company">{t("fees.type.company")}</option>
          <option value="individual">{t("fees.type.individual")}</option>
        </select>
        <select
          value={currentSort}
          onChange={(e) => applySort(e.target.value as SortOption)}
          aria-label={t("fees.sort.label")}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
        >
          <option value="newest">{t("fees.sort.newest")}</option>
          <option value="due">{t("fees.sort.due")}</option>
          <option value="amount">{t("fees.sort.amount")}</option>
          <option value="name">{t("fees.sort.name")}</option>
        </select>
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1">
          {(["all", "paid", "unpaid", "overdue", "dueSoon"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setStatus(k)}
              aria-pressed={status === k}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                status === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`fees.tab.${k}` as TKey)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <button
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            aria-label={t("fees.view.list")}
            title={t("fees.view.list")}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setView("card")}
            aria-pressed={view === "card"}
            aria-label={t("fees.view.card")}
            title={t("fees.view.card")}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
              view === "card"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Content */}
      {tc.total === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          {hasActiveFilters ? (
            <NoSearchResult />
          ) : (
            <EmptyState
              icon={<Wallet className="h-6 w-6" />}
              title={t("fees.empty")}
              action={
                hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                  >
                    {t("fees.clearFilters")}
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      ) : view === "card" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tc.pageRows.map((r: any) => (
              <FeeCard key={r.id} r={r} onDelete={handleDelete} onRemind={handleRemind} canManage={isAdmin} />
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
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
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[1050px] whitespace-nowrap border-separate border-spacing-0 text-sm">
              <thead className="bg-secondary/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 w-14 bg-secondary/90 px-3 py-3 text-center text-xs font-bold border-b border-border">STT</th>
                  <SortHeader
                    label={t("fees.col.invoice")}
                    columnKey="invoice"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="sticky left-[56px] z-20 bg-secondary/90 border-b border-border"
                  />
                  <SortHeader
                    label={t("fees.col.member")}
                    columnKey="member"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="border-b border-border"
                  />
                  <SortHeader
                    label={t("fees.col.amount")}
                    columnKey="amount"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="right"
                    className="border-b border-border"
                  />
                  <SortHeader
                    label={t("fees.col.due")}
                    columnKey="due"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="border-b border-border"
                  />
                  <SortHeader
                    label={t("fees.col.paid")}
                    columnKey="paid"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="border-b border-border"
                  />
                  <SortHeader
                    label={t("fees.col.status")}
                    columnKey="status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="border-b border-border"
                  />
                  <th className="sticky right-0 z-20 bg-secondary/90 px-4 py-3 text-right font-bold border-b border-border">{t("fees.col.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tc.pageRows.map((r: any, idx: number) => (
                  <FeeRow key={r.id} r={r} index={(tc.page - 1) * tc.pageSize + idx + 1} onDelete={handleDelete} onRemind={handleRemind} canManage={isAdmin} />
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
      )}

      {showCreate && (
        <CreateInvoiceModal
          members={members}
          defaultYear={year}
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => {
            try {
              await createFn({ data: payload });
              toast.success(t("fees.created"));
              setShowCreate(false);
              router.invalidate();
            } catch (e) {
              toast.error(String((e as Error).message ?? e));
            }
          }}
        />
      )}
    </AppShell>
  );
}

const toneStyles: Record<string, { chip: string; dot: string }> = {
  destructive: { chip: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  warning: { chip: "bg-warning/15 text-[oklch(0.45_0.16_65)]", dot: "bg-warning" },
  primary: { chip: "bg-primary/10 text-primary", dot: "bg-primary" },
};

const priorityLabel: Record<string, TKey> = {
  high: "fees.queue.priority.high",
  medium: "fees.queue.priority.medium",
  low: "fees.queue.priority.low",
};

function QueueColumn({
  title,
  tone,
  count,
  rows,
  emptyLabel,
  priority,
  selected,
  onToggle,
  onRemind,
  remindingId,
  canRemind,
  onFilter,
}: {
  title: string;
  tone: "destructive" | "warning" | "primary";
  count: number;
  rows: FeeRecord[];
  emptyLabel: string;
  priority: "high" | "medium" | "low";
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRemind: (r: FeeRecord) => void;
  remindingId: string | null;
  canRemind: boolean;
  onFilter: () => void;
}) {
  const t = useT();
  const s = toneStyles[tone];
  const shown = rows.slice(0, 5);
  const rest = rows.length - shown.length;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
          <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</h4>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${s.chip}`}>
            {count}
          </span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.chip}`}>
          {t(priorityLabel[priority])}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-[12px] text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((r: any) => {
            const d = daysUntil(r.dueDate);
            const isSel = selected.has(r.id);
            return (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-card p-2.5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => onToggle(r.id)}
                    aria-pressed={isSel}
                    aria-label={t("fees.queue.select")}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {isSel ? (
                      <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Square className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/fees/$invoiceId"
                      params={{ invoiceId: r.id }}
                      className="block truncate text-xs font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {r.member.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{r.member.code}</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatVnd(r.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          d < 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/15 text-[oklch(0.45_0.16_65)]"
                        }`}
                      >
                        {d < 0
                          ? t("fees.queue.daysOverdue", { n: Math.abs(d) })
                          : t("fees.queue.daysLeft", { n: d })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {r.member.reminderCount
                          ? t("fees.queue.remindCount", { n: r.member.reminderCount })
                          : t("fees.queue.neverReminded")}
                      </span>
                    </div>
                    {r.member.lastReminder && (
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {t("fees.queue.lastReminder")}:{" "}
                        {new Date(r.member.lastReminder).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                  </div>
                  {canRemind && (
                    <button
                      onClick={() => onRemind(r)}
                      disabled={remindingId === r.id}
                      title={t("fees.queue.remind")}
                      aria-label={t("fees.queue.remind")}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">
                        {remindingId === r.id ? t("fees.queue.reminding") : t("fees.queue.remind")}
                      </span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {rest > 0 && (
            <li>
              <button
                onClick={onFilter}
                className="w-full rounded-lg py-2 text-center text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("fees.queue.moreItems", { n: rest })} · {t("fees.queue.viewAll")}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function OverdueOrDueSoonBadge({ r }: { r: FeeRecord }) {
  const t = useT();
  if (r.status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        {t("fees.badge.overdue")}
      </span>
    );
  }
  if (isDueSoon(r)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.45_0.16_65)]">
        <CalendarClock className="h-3 w-3" aria-hidden="true" />
        {t("fees.badge.dueSoon")}
      </span>
    );
  }
  return null;
}

function FeeCard({
  r,
  onDelete,
  onRemind,
  canManage,
}: {
  r: FeeRecord;
  onDelete: (r: FeeRecord) => void;
  onRemind?: (r: FeeRecord) => void;
  canManage: boolean;
}) {
  const t = useT();
  const memberName = r.member?.name || r.member?.contact || r.member?.email || `Hội viên #${(r.member?.code || r.memberId || "").slice(0, 6)}`;
  const memberCode = r.member?.code || r.memberId || "MB";

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/companies/$companyId"
          params={{ companyId: r.member?.id || r.memberId || "unknown" }}
          className="group flex min-w-0 items-center gap-2.5"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-[12px] font-bold text-primary">
            {memberCode.slice(-2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground group-hover:text-primary">
              {memberName}
            </div>
            <div className="text-[11px] text-muted-foreground">{memberCode}</div>
          </div>
        </Link>
        <StatusBadge s={r.status} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-foreground tabular-nums">
          {formatVnd(r.amount)}
        </span>
        <OverdueOrDueSoonBadge r={r} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-muted-foreground">{t("fees.card.period")}</dt>
          <dd className="font-semibold text-foreground">
            {t("fees.year")} {r.year}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fees.card.due")}</dt>
          <dd className="font-semibold text-foreground">
            {new Date(r.dueDate).toLocaleDateString("vi-VN")}
          </dd>
        </div>
        {r.paidAt && (
          <div>
            <dt className="text-muted-foreground">{t("fees.card.paid")}</dt>
            <dd className="font-semibold text-success">
              {new Date(r.paidAt).toLocaleDateString("vi-VN")}
            </dd>
          </div>
        )}
        <div className="min-w-0">
          <dt className="text-muted-foreground">{t("fees.col.invoice")}</dt>
          <dd className="truncate">
            <Link
              to="/fees/$invoiceId"
              params={{ invoiceId: r.id }}
              className="font-mono font-semibold text-foreground hover:text-primary hover:underline"
            >
              {r.invoiceNo}
            </Link>
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3">
        {r.status !== "paid" ? (
          <>
            <button
              onClick={() => onRemind?.(r)}
              title={t("fees.action.remind")}
              aria-label={t("fees.action.remind")}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <Link
              to="/fees/$invoiceId"
              params={{ invoiceId: r.id }}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("fees.action.markPaid")}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <span className="mr-auto text-[11px] text-muted-foreground">
            {r.method && t(`fees.method.${r.method}` as TKey)}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info(`Chỉnh sửa khoản thu ${r.invoiceNo}`)}
            title="Chỉnh sửa hóa đơn"
            aria-label="Chỉnh sửa hóa đơn"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(r)}
            title={t("fees.action.delete")}
            aria-label={t("fees.action.delete")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({
  members,
  defaultYear,
  onClose,
  onCreate,
}: {
  members: Member[];
  defaultYear: number;
  onClose: () => void;
  onCreate: (p: {
    memberId: string;
    year: number;
    amount: number;
    dueDate: string;
  }) => Promise<void>;
}) {
  const t = useT();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [year, setYear] = useState(defaultYear);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!memberId || !amount) return;
    setBusy(true);
    await onCreate({ memberId, year, amount: Math.round(Number(amount)), dueDate });
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{t("fees.form.title")}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("fees.form.member")}
            </span>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                {t("fees.year")}
              </span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                {t("fees.form.due")}
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("fees.form.amount")}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy || !memberId || !amount}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("fees.form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeRow({
  r,
  index,
  onDelete,
  onRemind,
  canManage,
}: {
  r: FeeRecord;
  index: number;
  onDelete: (r: FeeRecord) => void;
  onRemind?: (r: FeeRecord) => void;
  canManage: boolean;
}) {
  const t = useT();
  const memberName = r.member?.name || r.member?.contact || r.member?.email || `Hội viên #${(r.member?.code || r.memberId || "").slice(0, 6)}`;
  const memberCode = r.member?.code || r.memberId || "MB";

  return (
    <tr className="group transition-colors hover:bg-accent/40 border-b border-border/50">
      <td className="sticky left-0 z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted/70 border-b border-border/50">
        {index}
      </td>
      <td className="sticky left-[56px] z-10 bg-card px-4 py-3 font-mono text-[12px] font-semibold group-hover:bg-muted/70 border-b border-border/50">
        <Link
          to="/fees/$invoiceId"
          params={{ invoiceId: r.id }}
          className="text-foreground hover:text-primary hover:underline"
        >
          {r.invoiceNo}
        </Link>
      </td>
      <td className="px-4 py-3 border-b border-border/50">
        <Link
          to="/companies/$companyId"
          params={{ companyId: r.member?.id || r.memberId || "unknown" }}
          className="group flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
            {memberCode.slice(-2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <TruncatedText
              text={memberName}
              maxWidth="max-w-[300px]"
              className="font-semibold text-foreground group-hover:text-primary"
            />
            <div className="text-[11px] text-muted-foreground">
              {r.member?.level ? (t(r.member.level as TKey) || r.member.level) : memberCode}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums border-b border-border/50">
        {formatVnd(r.amount)}
      </td>
      <td className="px-4 py-3 text-muted-foreground border-b border-border/50">
        {new Date(r.dueDate).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-4 py-3 text-muted-foreground border-b border-border/50">
        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("vi-VN") : "—"}
      </td>
      <td className="px-4 py-3 border-b border-border/50">
        <StatusBadge s={r.status} />
      </td>
      <td className="sticky right-0 z-10 bg-card px-4 py-3 group-hover:bg-muted/70 border-b border-border/50">
        <div className="flex items-center justify-end gap-1">
          {r.status !== "paid" ? (
            <>
              <button
                onClick={() => onRemind?.(r)}
                title={t("fees.action.remind")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
                {t("fees.action.markPaid")}
                <ArrowRight className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {r.method && t(`fees.method.${r.method}` as TKey)}
            </span>
          )}
          <button
            onClick={() => toast.info(`Chỉnh sửa khoản thu ${r.invoiceNo}`)}
            title="Chỉnh sửa hóa đơn"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(r)}
            title={t("fees.action.delete")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
