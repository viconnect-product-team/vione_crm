import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award,
  Download,
  Handshake,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill, StatCard, TableShell } from "@/components/dashboard/PageKit";
import { useTableControls } from "@/hooks/use-table-controls";
import { useUrlState } from "@/hooks/use-url-state";
import { useServerData } from "@/hooks/use-server-data";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import {
  createSponsorFn,
  deleteSponsorFn,
  listSponsorsFn,
  updateSponsorFn,
  type Sponsor,
} from "@/lib/sponsors.functions";
import { SponsorOnboardWizard } from "@/components/dashboard/SponsorOnboardWizard";
import { useFmt, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/sponsors")({
  component: SponsorsPage,
});

const TIER_KEY: Record<Sponsor["tier"], TKey> = {
  platinum: "sponsors.tier.platinum",
  gold: "sponsors.tier.gold",
  silver: "sponsors.tier.silver",
  bronze: "sponsors.tier.bronze",
};
const TIER_COLOR: Record<Sponsor["tier"], string> = {
  platinum: "oklch(0.55 0.05 280)",
  gold: "oklch(0.72 0.15 85)",
  silver: "oklch(0.75 0.02 250)",
  bronze: "oklch(0.60 0.12 50)",
};

function SponsorsPage() {
  const t = useT();
  const fmt = useFmt();
  const { data: SPONSORS, reload } = useServerData<Sponsor[]>(() => listSponsorsFn(), []);
  const [q, setQ] = useUrlState<string>("q", "");
  const [tier, setTier] = useState<Sponsor["tier"] | "all">("all");
  const [sponsorTypeFilter, setSponsorTypeFilter] = useState<"all" | "regular" | "new">("all");
  const [packageTypeFilter, setPackageTypeFilter] = useState<"all" | "cash" | "in_kind">("all");

  const createFn = useServerFn(createSponsorFn);
  const updateFn = useServerFn(updateSponsorFn);
  const deleteFn = useServerFn(deleteSponsorFn);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onboardOpen, setOnboardOpen] = useState(false);

  const fields: CrudField[] = [
    { name: "name", label: t("sponsors.col.name"), type: "text", required: true },
    {
      name: "sponsorType",
      label: "Phân loại đối tác",
      type: "select",
      options: [
        { value: "regular", label: "★ Thường xuyên ổn định" },
        { value: "new", label: "✦ Nhà tài trợ mới" },
      ],
    },
    {
      name: "packageType",
      label: "Hình thức tài trợ",
      type: "select",
      options: [
        { value: "cash", label: "💵 Bằng Tiền (Chuyển khoản / Tiền mặt)" },
        { value: "in_kind", label: "🎁 Bằng Hiện vật (Sản phẩm, quà tặng, dịch vụ)" },
      ],
    },
    {
      name: "inKindDescription",
      label: "Mô tả hiện vật tài trợ (nếu có)",
      type: "text",
      placeholder: "Ví dụ: 200 bộ quà tặng cao cấp, Teabreak tiệc trà...",
    },
    {
      name: "tier",
      label: t("sponsors.col.tier"),
      type: "select",
      options: [
        { value: "platinum", label: t("sponsors.tier.platinum") },
        { value: "gold", label: t("sponsors.tier.gold") },
        { value: "silver", label: t("sponsors.tier.silver") },
        { value: "bronze", label: t("sponsors.tier.bronze") },
      ],
    },
    { name: "contact", label: t("sponsors.col.contact"), type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "amount", label: "Giá trị / Định giá quy đổi (VNĐ)", type: "number" },
    { name: "events", label: t("sponsors.col.events"), type: "number" },
    {
      name: "since",
      label: t("sponsors.col.since"),
      type: "text",
      required: false,
      placeholder: "YYYY-MM-DD (mặc định hôm nay)",
    },
    {
      name: "status",
      label: t("sponsors.col.status"),
      type: "select",
      options: [
        { value: "active", label: t("sponsors.status.active") },
        { value: "expired", label: t("sponsors.status.expired") },
      ],
    },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    const payload = {
      ...v,
      since: v.since && String(v.since).trim() ? String(v.since).trim() : new Date().toISOString().slice(0, 10),
    };
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...(payload as object) } as never });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: payload as never });
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

  const onDelete = async (s: Sponsor) => {
    if (!window.confirm(t("common.confirmDelete", { name: s.name }))) return;
    setDeletingId(s.id);
    try {
      await deleteFn({ data: { id: s.id } });
      toast.success(t("common.deletedToast"));
      reload();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return SPONSORS
      .filter((s) => (tier === "all" ? true : s.tier === tier))
      .filter((s) => (sponsorTypeFilter === "all" ? true : s.sponsorType === sponsorTypeFilter))
      .filter((s) => (packageTypeFilter === "all" ? true : s.packageType === packageTypeFilter))
      .filter(
        (s) =>
          !ql ||
          s.name.toLowerCase().includes(ql) ||
          s.contact.toLowerCase().includes(ql) ||
          (s.inKindDescription && s.inKindDescription.toLowerCase().includes(ql)),
      );
  }, [q, tier, sponsorTypeFilter, packageTypeFilter, SPONSORS]);

  const tc = useTableControls<Sponsor>(
    filtered,
    {
      code: (s) => s.id,
      name: (s) => s.name,
      sponsorType: (s) => s.sponsorType,
      packageType: (s) => s.packageType,
      tier: (s) => s.tier,
      contact: (s) => s.contact,
      value: (s) => s.amount,
      events: (s) => s.events,
      since: (s) => s.since,
      status: (s) => s.status,
    },
    { initialSortKey: "value", initialSortDir: "desc", initialPageSize: 20 },
  );

  const totalAmount = SPONSORS.reduce((s, x) => s + x.amount, 0);

  return (
    <AppShell>
      <PageHeader
        title={t("sponsors.title")}
        subtitle={t("sponsors.subtitle")}
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted">
              <Download className="h-4 w-4 text-muted-foreground" />
              {t("common.export")}
            </button>
            <button
              onClick={() => setOnboardOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
            >
              <UserPlus className="h-4 w-4 text-primary" />
              {t("onb.open")}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("sponsors.add")}
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng NTT & Giá Trị"
          value={`${SPONSORS.length} NTT · ${fmt.money(totalAmount)}`}
          icon={<Handshake className="h-4 w-4" />}
        />
        <StatCard
          label="★ Thường Xuyên Ổn Định"
          value={`${SPONSORS.filter((s) => s.sponsorType === "regular").length} Đối tác`}
          tone="success"
          hint={`${Math.round((SPONSORS.filter((s) => s.sponsorType === "regular").length / (SPONSORS.length || 1)) * 100)}% tổng số đối tác`}
          icon={<Award className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="✦ Nhà Tài Trợ Mới"
          value={`${SPONSORS.filter((s) => s.sponsorType === "new").length} Đơn vị`}
          tone="info"
          hint="Mới đồng hành các kỳ gần nhất"
          icon={<UserPlus className="h-4 w-4 text-sky-500" />}
        />
        <StatCard
          label="🎁 Tài Trợ Hiện Vật"
          value={`${SPONSORS.filter((s) => s.packageType === "in_kind").length} Gói hiện vật`}
          tone="warning"
          hint={`Quy đổi ~${fmt.money(SPONSORS.filter((s) => s.packageType === "in_kind").reduce((acc, s) => acc + s.amount, 0))}`}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, liên hệ, quà tặng hiện vật..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={sponsorTypeFilter}
          onChange={(e) => setSponsorTypeFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">Tất cả đối tác</option>
          <option value="regular">★ Thường xuyên ổn định</option>
          <option value="new">✦ Nhà tài trợ mới</option>
        </select>
        <select
          value={packageTypeFilter}
          onChange={(e) => setPackageTypeFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">Tất cả hình thức</option>
          <option value="cash">💵 Bằng Tiền mặt/CK</option>
          <option value="in_kind">🎁 Bằng Hiện vật</option>
        </select>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as Sponsor["tier"] | "all")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("sponsors.allTiers")}</option>
          <option value="platinum">{t("sponsors.tier.platinum")}</option>
          <option value="gold">{t("sponsors.tier.gold")}</option>
          <option value="silver">{t("sponsors.tier.silver")}</option>
          <option value="bronze">{t("sponsors.tier.bronze")}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="relative overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-20 w-14 bg-secondary/90 px-3 py-3 text-center text-xs font-bold border-b border-border">STT</th>
                <th className="sticky left-[56px] z-20 bg-secondary/90 px-4 py-3 text-xs font-bold border-b border-border">{t("sponsors.col.code")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.name")}</th>
                <th className="px-4 py-3 border-b border-border">Phân loại đối tác</th>
                <th className="px-4 py-3 border-b border-border">Hình thức gói</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.tier")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.contact")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.value")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.events")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.since")}</th>
                <th className="px-4 py-3 border-b border-border">{t("sponsors.col.status")}</th>
                <th className="sticky right-0 z-20 bg-secondary/90 px-4 py-3 text-right text-xs font-bold border-b border-border">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.pageRows.map((s, idx) => (
                <tr key={s.id} className="group border-b border-border/50 transition hover:bg-secondary/40">
                  <td className="sticky left-0 z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted/70 border-b border-border/50">
                    {(tc.page - 1) * tc.pageSize + idx + 1}
                  </td>
                  <td className="sticky left-[56px] z-10 bg-card px-4 py-3 font-mono text-[12px] font-semibold text-primary group-hover:bg-muted/70 border-b border-border/50">{s.id}</td>
                  <td className="px-4 py-3 font-semibold text-foreground border-b border-border/50">{s.name}</td>
                  <td className="px-4 py-3 border-b border-border/50">
                    {s.sponsorType === "regular" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-sm whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ★ Thường xuyên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-sm whitespace-nowrap">
                        ✦ NTT mới
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    {s.packageType === "in_kind" ? (
                      <div className="flex flex-col gap-0.5 max-w-[220px]">
                        <span className="inline-flex items-center gap-1 w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                          🎁 Hiện vật
                        </span>
                        {s.inKindDescription && (
                          <span className="text-[11px] text-muted-foreground truncate" title={s.inKindDescription}>
                            {s.inKindDescription}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                        💵 Bằng Tiền
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold text-primary-foreground"
                      style={{ background: TIER_COLOR[s.tier] }}
                    >
                      {t(TIER_KEY[s.tier])}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="text-foreground">{s.contact}</div>
                    <div className="text-[11px] text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground border-b border-border/50">{fmt.money(s.amount)}</td>
                  <td className="px-4 py-3 text-foreground border-b border-border/50">{s.events}</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border/50">{fmt.date(s.since)}</td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <Pill color={s.status === "active" ? "success" : "neutral"}>
                      {s.status === "active" ? t("sponsors.status.active") : t("sponsors.status.expired")}
                    </Pill>
                  </td>
                  <td className="sticky right-0 z-10 bg-card px-4 py-3 group-hover:bg-muted/70 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(s);
                          setOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(s)}
                        disabled={deletingId === s.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

      <CrudModal
        open={open}
        title={editing ? t("common.editTitle") : t("sponsors.add")}
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

      <SponsorOnboardWizard
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        onCreated={() => {
          setOnboardOpen(false);
          reload();
        }}
      />
    </AppShell>
  );
}
