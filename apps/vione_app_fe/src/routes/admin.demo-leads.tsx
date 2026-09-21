import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { CalendarClock, Download, Loader2, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { useServerData } from "@/hooks/use-server-data";
import { useT, type TKey } from "@/lib/i18n";
import {
  DEMO_LEAD_STATUSES,
  listDemoLeads,
  updateDemoLead,
  type DemoLead,
  type DemoLeadStatus,
} from "@/lib/demo-admin.functions";

export const Route = createFileRoute("/admin/demo-leads")({
  component: AdminDemoLeadsPage,
  head: () => ({
    meta: [
      { title: "Quản lý lead đặt lịch demo | Business Connect" },
      {
        name: "description",
        content:
          "Trang quản trị để xem, lọc và cập nhật trạng thái các yêu cầu đặt lịch demo của khách hàng.",
      },
      { property: "og:title", content: "Quản lý lead đặt lịch demo" },
      {
        property: "og:description",
        content: "Theo dõi và xử lý lead đặt lịch demo theo trạng thái.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const STATUS_TONE: Record<
  DemoLeadStatus,
  "neutral" | "info" | "primary" | "success" | "danger" | "warning"
> = {
  new: "info",
  contacted: "primary",
  scheduled: "warning",
  completed: "success",
  cancelled: "danger",
};

function statusKey(s: DemoLeadStatus | "all"): TKey {
  return `demoAdmin.status.${s}` as TKey;
}

function AdminDemoLeadsPage() {
  const t = useT();
  const { isAdmin, isPlatformAdmin, loading: roleLoading } = useRole();
  const allowed = isAdmin || isPlatformAdmin;

  const [status, setStatus] = useState<DemoLeadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ status: "all", search: "", from: "", to: "" });
  const [selected, setSelected] = useState<DemoLead | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(
    () =>
      allowed
        ? listDemoLeads({ data: applied })
        : Promise.resolve({ leads: [] as DemoLead[], counts: {} as Record<string, number> }),
    [allowed, applied],
  );

  const { data, loading, error, reload } = useServerData(fetcher, {
    leads: [] as DemoLead[],
    counts: {} as Record<string, number>,
  });

  const leads = data.leads;
  const counts = data.counts;

  const applyFilters = () => setApplied({ status, search, from, to });

  const exportCsv = () => {
    const head = [
      "name",
      "email",
      "organization",
      "phone",
      "date",
      "slot",
      "timezone",
      "status",
      "created_at",
    ];
    const rows = leads.map((l: any) =>
      [
        l.name,
        l.email,
        l.organization,
        l.phone ?? "",
        l.preferredDate ?? "",
        l.preferredSlot ?? "",
        l.timezone ?? "",
        l.status,
        l.createdAt,
      ]
        .map((v: any) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mutate = async (id: string, patch: { status?: DemoLeadStatus; adminNotes?: string }) => {
    setSaving(true);
    try {
      const updated = await updateDemoLead({ data: { id, ...patch } });
      setSelected((prev) => (prev && prev.id === id ? updated : prev));
      toast.success(patch.status ? t("demoAdmin.updated") : t("demoAdmin.saved"));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("demoAdmin.error"));
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(() => ["all", ...DEMO_LEAD_STATUSES] as const, []);

  return (
    <AppShell>
      <PageHeader
        title={t("demoAdmin.title")}
        subtitle={t("demoAdmin.subtitle")}
        actions={
          <>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" /> {t("demoAdmin.refresh")}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!leads.length}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {t("demoAdmin.export")}
            </button>
          </>
        }
      />

      {!roleLoading && !allowed ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t("demoAdmin.denied")}
        </Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label
                  className="mb-1 block text-xs font-semibold text-muted-foreground"
                  htmlFor="lead-search"
                >
                  {t("demoAdmin.search")}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="lead-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    placeholder={t("demoAdmin.search")}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-muted-foreground"
                  htmlFor="lead-from"
                >
                  {t("demoAdmin.from")}
                </label>
                <input
                  id="lead-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-muted-foreground"
                  htmlFor="lead-to"
                >
                  {t("demoAdmin.to")}
                </label>
                <input
                  id="lead-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t("demoAdmin.refresh")}
              </button>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={t("demoAdmin.col.status")}
            >
              {tabs.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => {
                    setStatus(s);
                    setApplied({ status: s, search, from, to });
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t(statusKey(s))}
                  {counts[s] !== undefined ? ` (${counts[s]})` : ""}
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("demoAdmin.loading")}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-destructive">{error}</div>
            ) : leads.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {t("demoAdmin.empty")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">{t("demoAdmin.col.contact")}</th>
                      <th className="px-4 py-3 font-semibold">{t("demoAdmin.col.org")}</th>
                      <th className="px-4 py-3 font-semibold">{t("demoAdmin.col.slot")}</th>
                      <th className="px-4 py-3 font-semibold">{t("demoAdmin.col.status")}</th>
                      <th className="px-4 py-3 font-semibold">{t("demoAdmin.col.created")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l: any) => (
                      <tr
                        key={l.id}
                        tabIndex={0}
                        onClick={() => {
                          setSelected(l);
                          setNoteDraft(l.adminNotes ?? "");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelected(l);
                            setNoteDraft(l.adminNotes ?? "");
                          }
                        }}
                        className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{l.organization}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {l.preferredDate ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {l.preferredDate} · {l.preferredSlot}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Pill color={STATUS_TONE[l.status as keyof typeof STATUS_TONE]}>{t(statusKey(l.status as any))}</Pill>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t("demoAdmin.detail")}
          onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selected.organization}
                  {selected.jobTitle ? ` · ${selected.jobTitle}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={t("demoAdmin.close")}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-muted/40 p-3 text-sm text-foreground">
              <CalendarClock className="mr-1.5 inline h-4 w-4" />
              {selected.preferredDate
                ? `${selected.preferredDate} · ${selected.preferredSlot} (${selected.timezone ?? "Asia/Ho_Chi_Minh"})`
                : "—"}
            </div>

            {selected.notes && (
              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  {t("demoAdmin.notes")}
                </div>
                <p className="whitespace-pre-wrap rounded-xl border border-border p-3 text-sm">
                  {selected.notes}
                </p>
              </div>
            )}

            <div
              className="mb-4 flex flex-wrap gap-2"
              role="group"
              aria-label={t("demoAdmin.col.status")}
            >
              {DEMO_LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving}
                  aria-pressed={selected.status === s}
                  onClick={() => mutate(selected.id, { status: s })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    selected.status === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t(statusKey(s))}
                </button>
              ))}
            </div>

            <label
              className="mb-1 block text-xs font-semibold text-muted-foreground"
              htmlFor="admin-notes"
            >
              {t("demoAdmin.adminNotes")}
            </label>
            <textarea
              id="admin-notes"
              rows={4}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                {t("demoAdmin.close")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => mutate(selected.id, { adminNotes: noteDraft })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("demoAdmin.saveNotes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
