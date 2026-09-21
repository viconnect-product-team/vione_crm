import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Filter,
  History,
  Search,
  Shield,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { type ActivityLog } from "@/lib/extra-data";
import { clearActivityFn, deleteActivityFn, listActivityLogFn } from "@/lib/activity.functions";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/activity")({
  ssr: false,
  loader: () => listActivityLogFn(),
  component: ActivityPage,
});

const CAT_KEY: Record<ActivityLog["category"], TKey> = {
  auth: "act.cat.auth",
  member: "act.cat.member",
  fee: "act.cat.fee",
  event: "act.cat.event",
  system: "act.cat.system",
};
const CAT_COLOR: Record<
  ActivityLog["category"],
  "info" | "primary" | "warning" | "success" | "neutral"
> = {
  auth: "info",
  member: "primary",
  fee: "warning",
  event: "success",
  system: "neutral",
};
const CAT_ICON: Record<ActivityLog["category"], typeof Shield> = {
  auth: Shield,
  member: User,
  fee: Wallet,
  event: Calendar,
  system: History,
};

function ActivityPage() {
  const t = useT();
  const router = useRouter();
  const ACTIVITY_LOG = Route.useLoaderData() as ActivityLog[];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ActivityLog["category"] | "all">("all");

  const deleteFn = useServerFn(deleteActivityFn);
  const clearFn = useServerFn(clearActivityFn);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const onDelete = async (l: ActivityLog) => {
    if (!window.confirm(t("common.confirmDelete", { name: l.action }))) return;
    setBusyId(l.id);
    try {
      await deleteFn({ data: { id: l.id } });
      toast.success(t("common.deletedToast"));
      await router.invalidate();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setBusyId(null);
    }
  };

  const onClear = async () => {
    if (!window.confirm(t("act.confirmClear"))) return;
    setClearing(true);
    try {
      await clearFn({});
      toast.success(t("act.clearedToast"));
      await router.invalidate();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setClearing(false);
    }
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ACTIVITY_LOG.filter((l) => (cat === "all" ? true : l.category === cat)).filter(
      (l) =>
        !ql ||
        l.user.toLowerCase().includes(ql) ||
        l.action.toLowerCase().includes(ql) ||
        l.target.toLowerCase().includes(ql),
    );
  }, [q, cat, ACTIVITY_LOG]);

  const onExport = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ["user", "action", "target", "category", "at", "ip"];
    const rows = filtered.map((l) =>
      [l.user, l.action, l.target, l.category, l.at, l.ip].map(esc).join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title={t("act.pageTitle")}
        subtitle={t("act.subtitle")}
        actions={
          <>
            <button
              onClick={onExport}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {t("act.export")}
            </button>
            <button
              onClick={onClear}
              disabled={clearing || ACTIVITY_LOG.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {t("act.clear")}
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("act.kpi.today")}
          value={ACTIVITY_LOG.length}
          icon={<History className="h-4 w-4" />}
        />
        <StatCard
          label={t("act.kpi.auth")}
          value={ACTIVITY_LOG.filter((l) => l.category === "auth").length}
          tone="info"
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          label={t("act.kpi.member")}
          value={ACTIVITY_LOG.filter((l) => l.category === "member").length}
          tone="primary"
          icon={<User className="h-4 w-4" />}
        />
        <StatCard
          label={t("act.kpi.fee")}
          value={ACTIVITY_LOG.filter((l) => l.category === "fee").length}
          tone="warning"
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("act.searchPh")}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as ActivityLog["category"] | "all")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("common.allCategories")}</option>
          <option value="auth">{t("act.cat.auth")}</option>
          <option value="member">{t("act.cat.member")}</option>
          <option value="fee">{t("act.cat.fee")}</option>
          <option value="event">{t("act.cat.event")}</option>
          <option value="system">{t("act.cat.system")}</option>
        </select>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)] hover:bg-muted">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {t("common.advancedFilter")}
        </button>
      </div>

      <Card className="p-2">
        <ol className="relative ml-4 border-l border-border">
          {filtered.map((l) => {
            const Icon = CAT_ICON[l.category];
            return (
              <li key={l.id} className="relative py-3 pl-6">
                <span className="absolute -left-[10px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-border">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm text-foreground">
                      <span className="font-semibold">{l.user}</span>
                      <span className="text-muted-foreground"> · {l.action} · </span>
                      <span className="font-mono text-[12px] text-primary">{l.target}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.at} · IP: {l.ip}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill color={CAT_COLOR[l.category]}>{t(CAT_KEY[l.category])}</Pill>
                    <button
                      onClick={() => onDelete(l)}
                      disabled={busyId === l.id}
                      title={t("act.delete")}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-6 pl-6 text-center text-sm text-muted-foreground">
              {t("common.empty")}
            </li>
          )}
        </ol>
      </Card>
    </AppShell>
  );
}
