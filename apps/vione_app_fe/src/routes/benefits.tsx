import { createFileRoute } from "@tanstack/react-router";
import { Award, Pencil, Plus, Trash2, Search, LayoutGrid, List } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, StatCard } from "@/components/dashboard/PageKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useRole } from "@/hooks/use-role";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { fetchNestApi } from "@/lib/api-client";
import { type AdminBenefit } from "@/lib/benefits.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/benefits")({
  component: BenefitsAdminPage,
});

function BenefitsAdminPage() {
  const t = useT();
  const { isAdmin, loading: roleLoading } = useRole();
  const [benefits, setBenefits] = useState<AdminBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBenefits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNestApi<AdminBenefit[]>("/members/benefits/admin");
      if (Array.isArray(res)) {
        setBenefits(res);
      }
    } catch (err) {
      console.error("[Benefits] Failed to load benefits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyBenefitsUpdated = () =>
    window.dispatchEvent(new CustomEvent("benefits-updated"));

  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  const reload = () => loadBenefits();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBenefit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");

  const filteredBenefits = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return benefits;
    return benefits.filter(
      (b) =>
        b.titleVi.toLowerCase().includes(ql) ||
        b.titleEn.toLowerCase().includes(ql) ||
        b.descVi.toLowerCase().includes(ql) ||
        b.descEn.toLowerCase().includes(ql),
    );
  }, [benefits, q]);

  const accessors = useMemo(
    () => ({
      titleVi: (b: AdminBenefit) => b.titleVi,
      titleEn: (b: AdminBenefit) => b.titleEn,
      sortOrder: (b: AdminBenefit) => b.sortOrder,
    }),
    [],
  );

  const tc = useTableControls(filteredBenefits, accessors, {
    initialPageSize: 10,
    initialSortKey: "sortOrder",
    initialSortDir: "asc",
  });

  const fields: CrudField[] = [
    { name: "titleVi", label: t("benefits.col.titleVi"), type: "text", required: true },
    { name: "titleEn", label: t("benefits.col.titleEn"), type: "text" },
    { name: "descVi", label: t("benefits.col.descVi"), type: "text" },
    { name: "descEn", label: t("benefits.col.descEn"), type: "text" },
    { name: "sortOrder", label: t("benefits.col.sortOrder"), type: "number" },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await fetchNestApi(`/members/benefits/admin/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(v),
        });
        toast.success(t("common.updated"));
      } else {
        await fetchNestApi("/members/benefits/admin", {
          method: "POST",
          body: JSON.stringify(v),
        });
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      reload();
      notifyBenefitsUpdated();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (b: AdminBenefit) => {
    if (!window.confirm(t("common.confirmDelete", { name: b.titleVi }))) return;
    setDeletingId(b.id);
    try {
      await fetchNestApi(`/members/benefits/admin/${b.id}`, {
        method: "DELETE",
      });
      toast.success(t("common.deletedToast"));
      reload();
      notifyBenefitsUpdated();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!roleLoading && !isAdmin) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Award className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t("benefits.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("common.forbidden")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={t("benefits.title")}
        subtitle={t("benefits.subtitle")}
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
              {t("benefits.create")}
            </button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={t("benefits.kpi.total")}
          value={benefits.length}
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm quyền lợi theo tên, mô tả..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.empty")}</p>
      ) : tc.pageRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("benefits.empty")}</p>
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
                  <th className="px-4 py-3 border-b border-border">Tiêu đề (Tiếng Việt)</th>
                  <th className="px-4 py-3 border-b border-border">Tiêu đề (Tiếng Anh)</th>
                  <th className="px-4 py-3 border-b border-border">Mô tả</th>
                  <th className="px-4 py-3 border-b border-border text-center">Thứ tự</th>
                  <th className="sticky right-0 z-20 min-w-[120px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {tc.pageRows.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="group border-b border-border transition-all duration-150 hover:bg-secondary/60"
                  >
                    <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                      {(tc.page - 1) * tc.pageSize + idx + 1}
                    </td>
                    <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      QL-{String(b.sortOrder).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground border-b border-border">
                      {b.titleVi}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
                      {b.titleEn || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground border-b border-border max-w-[300px] truncate">
                      {b.descVi || b.descEn || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-foreground border-b border-border">
                      #{b.sortOrder}
                    </td>
                    <td className="sticky right-0 z-10 min-w-[120px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(b);
                            setOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => onDelete(b)}
                          disabled={deletingId === b.id}
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
          {tc.pageRows.map((b) => (
            <Card key={b.id} className="p-5 transition hover:shadow-[var(--shadow-glow)]">
              <div className="mb-2 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  #{b.sortOrder}
                </span>
              </div>
              <h3 className="mb-0.5 text-base font-semibold text-foreground">{b.titleVi}</h3>
              <p className="text-xs text-muted-foreground">{b.descVi}</p>
              {(b.titleEn || b.descEn) && (
                <p className="mt-2 text-xs text-muted-foreground/80">
                  {b.titleEn}
                  {b.descEn ? ` — ${b.descEn}` : ""}
                </p>
              )}
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  onClick={() => {
                    setEditing(b);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => onDelete(b)}
                  disabled={deletingId === b.id}
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
        title={editing ? t("benefits.edit") : t("benefits.create")}
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
