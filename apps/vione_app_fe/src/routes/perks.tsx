import { createFileRoute } from "@tanstack/react-router";
import { Gift, Pencil, Plus, Trash2, ExternalLink, Search, LayoutGrid, List } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  createPerkFn,
  deletePerkFn,
  listPerksAdminFn,
  updatePerkFn,
  type AdminPerk,
} from "@/lib/perks.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/perks")({
  component: PerksAdminPage,
});

const ICON_OPTIONS = ["Gift", "Briefcase", "Scale", "Calculator", "Hotel"];

function PerksAdminPage() {
  const t = useT();
  const { isAdmin, loading: roleLoading } = useRole();
  const fetchPerks = useServerFn(listPerksAdminFn);
  const {
    data: perks,
    loading,
    reload,
  } = useServerData<AdminPerk[]>(
    () => fetchPerks(),
    [],
  );

  const createFn = useServerFn(createPerkFn);
  const updateFn = useServerFn(updatePerkFn);
  const deleteFn = useServerFn(deletePerkFn);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPerk | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");

  const filteredPerks = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return perks;
    return perks.filter(
      (p) =>
        p.title.toLowerCase().includes(ql) ||
        (p.partner || "").toLowerCase().includes(ql) ||
        (p.category || "").toLowerCase().includes(ql) ||
        (p.summary || "").toLowerCase().includes(ql),
    );
  }, [perks, q]);

  const accessors = useMemo(
    () => ({
      title: (p: AdminPerk) => p.title,
      category: (p: AdminPerk) => p.category,
      partner: (p: AdminPerk) => p.partner,
      status: (p: AdminPerk) => p.status,
      sortOrder: (p: AdminPerk) => p.sortOrder,
    }),
    [],
  );

  const tc = useTableControls(filteredPerks, accessors, {
    initialPageSize: 10,
    initialSortKey: "sortOrder",
    initialSortDir: "asc",
  });

  const active = perks.filter((p) => p.status === "active");

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields: CrudField[] = [
    { name: "title", label: t("perks.col.title"), type: "text", required: true },
    { name: "category", label: t("perks.col.category"), type: "text" },
    { name: "partner", label: t("perks.col.partner"), type: "text" },
    { name: "discount", label: t("perks.col.discount"), type: "text", placeholder: "-20%" },
    { name: "summary", label: t("perks.col.summary"), type: "textarea" },
    { name: "description", label: t("perks.col.description"), type: "textarea" },
    { name: "link", label: t("perks.col.link"), type: "text", placeholder: "https://" },
    {
      name: "validUntil",
      label: t("perks.col.validUntil"),
      type: "text",
      placeholder: "2026-12-31",
    },
    {
      name: "icon",
      label: t("perks.col.icon"),
      type: "select",
      options: ICON_OPTIONS.map((i) => ({ value: i, label: i })),
    },
    { name: "sortOrder", label: t("perks.col.sortOrder"), type: "number" },
    {
      name: "status",
      label: t("perks.col.status"),
      type: "select",
      options: [
        { value: "active", label: t("perks.status.active") },
        { value: "inactive", label: t("perks.status.inactive") },
      ],
    },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...(v as object) } as never });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: v as never });
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      reload();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (p: AdminPerk) => {
    if (!window.confirm(t("common.confirmDelete", { name: p.title }))) return;
    setDeletingId(p.id);
    try {
      await deleteFn({ data: { id: p.id } });
      toast.success(t("common.deletedToast"));
      reload();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("perks.title")}
        subtitle={t("perks.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-card p-0.5 shadow-[var(--shadow-card)]">
              <button
                onClick={() => setView("table")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "table"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" /> Bảng
              </button>
              <button
                onClick={() => setView("cards")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "cards"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Thẻ
              </button>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("perks.create")}
            </button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={t("perks.kpi.total")}
          value={perks.length}
          icon={<Gift className="h-4 w-4" />}
        />
        <StatCard
          label={t("perks.kpi.active")}
          value={active.length}
          tone="success"
          icon={<Gift className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm ưu đãi theo tiêu đề, đối tác, danh mục..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.empty")}</p>
      ) : tc.pageRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("perks.empty")}</p>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-secondary px-3 py-3 text-center border-r border-b border-border">
                    STT
                  </th>
                  <th className="sticky left-[56px] z-20 min-w-[100px] bg-secondary px-4 py-3 border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    Mã
                  </th>
                  <th className="px-4 py-3 border-b border-border">Ưu đãi & Đối tác</th>
                  <th className="px-4 py-3 border-b border-border">Danh mục</th>
                  <th className="px-4 py-3 border-b border-border">Mức giảm</th>
                  <th className="px-4 py-3 border-b border-border">Trạng thái</th>
                  <th className="px-4 py-3 border-b border-border text-center">Thứ tự</th>
                  <th className="sticky right-0 z-20 min-w-[120px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {tc.pageRows.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="group border-b border-border transition-all duration-150 hover:bg-secondary/60"
                  >
                    <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                      {(tc.page - 1) * tc.pageSize + idx + 1}
                    </td>
                    <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      UD-{String(p.sortOrder).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <div className="font-semibold text-foreground text-xs">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground">{p.partner || p.summary}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-primary font-medium border-b border-border">
                      {p.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-primary border-b border-border">
                      {p.discount || "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <Pill color={p.status === "active" ? "success" : "neutral"}>
                        {p.status === "active" ? t("perks.status.active") : t("perks.status.inactive")}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-foreground border-b border-border">
                      #{p.sortOrder}
                    </td>
                    <td className="sticky right-0 z-10 min-w-[120px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          disabled={deletingId === p.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("common.delete")}
                        </button>
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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tc.pageRows.map((p) => (
            <Card key={p.id} className="p-5 transition hover:shadow-[var(--shadow-glow)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {p.category || "—"}
                </span>
                <Pill color={p.status === "active" ? "success" : "neutral"}>
                  {p.status === "active" ? t("perks.status.active") : t("perks.status.inactive")}
                </Pill>
              </div>
              <h3 className="mb-1 line-clamp-2 text-base font-semibold text-foreground">
                {p.title}
              </h3>
              {p.discount && (
                <span className="text-xs font-semibold text-primary">{p.discount}</span>
              )}
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.summary}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{p.partner || "—"}</span>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> Link
                  </a>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => onDelete(p)}
                  disabled={deletingId === p.id}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("common.delete")}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CrudModal
        open={open}
        title={editing ? t("perks.edit") : t("perks.create")}
        fields={fields}
        initial={editing ? (editing as unknown as CrudValues) : undefined}
        submitting={submitting}
        submitLabel={editing ? t("common.save") : t("common.create")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}
