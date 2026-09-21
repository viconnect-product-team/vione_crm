import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Download,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  CalendarDays,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import { useT, type TKey } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { downloadCsv } from "@/lib/csv";
import { useTableControls, type TableControls } from "@/hooks/use-table-controls";
import { useUrlState } from "@/hooks/use-url-state";
import { Pagination, SortHeader } from "@/components/dashboard/DataTablePagination";
import {
  type IndustryKey,
  type Member,
  type MemberLevelKey,
  type MemberStatus,
  type RegionKey,
} from "@/lib/members-data";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/companies/")({
  head: () => ({
    meta: [
      { title: "Doanh nghiệp — ViOne" },
      { name: "description", content: "Danh bạ doanh nghiệp hội viên và đối tác của hiệp hội." },
      { property: "og:title", content: "Doanh nghiệp — ViOne" },
      { property: "og:description", content: "Quản lý hồ sơ doanh nghiệp hội viên." },
    ],
  }),
  component: CompaniesPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const INDUSTRIES: IndustryKey[] = [
  "ind.trade",
  "ind.it",
  "ind.manufacturing",
  "ind.realestate",
  "ind.finance",
];
const REGIONS: RegionKey[] = ["region.north", "region.central", "region.south"];
const LEVELS: MemberLevelKey[] = ["memberLevel.large", "memberLevel.medium", "memberLevel.small"];

const statusStyle: Record<MemberStatus, { dot: string; text: string; bg: string }> = {
  active: { dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  pending: {
    dot: "bg-warning",
    text: "text-[oklch(0.45_0.16_65)]",
    bg: "bg-warning/15",
  },
  expired: { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" },
};

const levelBadge: Record<MemberLevelKey, string> = {
  "memberLevel.large": "bg-primary/10 text-primary border-primary/30",
  "memberLevel.medium": "bg-info/10 text-info border-info/30",
  "memberLevel.small": "bg-muted text-muted-foreground border-border",
  "memberLevel.individual": "bg-secondary text-secondary-foreground border-border",
};

function initials(name: string) {
  const words = name
    .replace(/Công ty|TNHH|CP|TMCP|Cửa hàng|Tập đoàn|Ngân hàng/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] ?? "") + (words[words.length - 1]?.[0] ?? "");
}

function CompaniesPage() {
  const t = useT();
  const [MEMBERS, setMembers] = useState<Member[]>([]);

  const loadMembers = async () => {
    try {
      const res = await fetchNestApi<Member[]>("/members?type=company");
      if (Array.isArray(res)) {
        setMembers(res);
      }
    } catch (err) {
      console.error("[Companies] Failed to load companies:", err);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const { isAdmin, loading: roleLoading } = useRole();
  const router = useRouter();
  const [q, setQ] = useUrlState<string>("q", "");
  const [industry, setIndustry] = useState<"" | IndustryKey>("");
  const [region, setRegion] = useState<"" | RegionKey>("");
  const [level, setLevel] = useState<"" | MemberLevelKey>("");
  const [feeFilter, setFeeFilter] = useState<"" | "paid" | "unpaid">("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fields: CrudField[] = [
    { name: "name", label: t("members.f.name"), type: "text", required: true },
    { name: "contact", label: t("members.f.contact"), type: "text" },
    { name: "email", label: t("members.f.email"), type: "text" },
    { name: "phone", label: t("members.f.phone"), type: "text" },
    {
      name: "level",
      label: t("members.f.level"),
      type: "select",
      options: [
        { value: "memberLevel.large", label: t("memberLevel.large") },
        { value: "memberLevel.medium", label: t("memberLevel.medium") },
        { value: "memberLevel.small", label: t("memberLevel.small") },
      ],
    },
    {
      name: "industry",
      label: t("members.f.industry"),
      type: "select",
      options: [
        { value: "ind.trade", label: t("ind.trade") },
        { value: "ind.it", label: t("ind.it") },
        { value: "ind.manufacturing", label: t("ind.manufacturing") },
        { value: "ind.realestate", label: t("ind.realestate") },
        { value: "ind.finance", label: t("ind.finance") },
      ],
    },
    {
      name: "region",
      label: t("members.f.region"),
      type: "select",
      options: [
        { value: "region.north", label: t("region.north") },
        { value: "region.central", label: t("region.central") },
        { value: "region.south", label: t("region.south") },
      ],
    },
    {
      name: "status",
      label: t("members.f.status"),
      type: "select",
      options: [
        { value: "pending", label: t("status.pending") },
        { value: "active", label: t("status.active") },
        { value: "expired", label: t("status.expired") },
      ],
    },
    {
      name: "feePaid",
      label: "Trạng thái hội phí",
      type: "select",
      options: [
        { value: "unpaid", label: "Chưa thanh toán" },
        { value: "paid", label: "Đã thanh toán" },
      ],
    },
    { name: "feeYear", label: "Năm hội phí", type: "number" },
    { name: "address", label: t("members.f.address"), type: "text" },
    { name: "website", label: t("members.f.website"), type: "text" },
    { name: "taxCode", label: t("members.f.taxCode"), type: "text" },
    { name: "employees", label: t("members.f.employees"), type: "number" },
    { name: "about", label: t("members.f.about"), type: "textarea" },
  ];

  const editInitial = (m: Member): CrudValues => ({
    name: m.name,
    contact: m.contact,
    email: m.email,
    phone: m.phone,
    level: m.level,
    industry: m.industry,
    region: m.region,
    status: m.status,
    feePaid: m.feePaid ? "paid" : "unpaid",
    feeYear: m.feeYear ?? new Date().getFullYear(),
    address: m.address,
    website: m.website ?? "",
    taxCode: m.taxCode ?? "",
    employees: m.employees ?? 0,
    about: m.about,
  });

  const handleToggleFeePaid = async (m: Member) => {
    const nextStatus = !m.feePaid;
    try {
      toast.info(`Đang cập nhật trạng thái hội phí của ${m.name}...`);
      await fetchNestApi(`/members/${m.id}`, {
        method: "PUT",
        body: JSON.stringify({
          feePaid: nextStatus,
          feeYear: m.feeYear || new Date().getFullYear(),
        }),
      });
      setMembers((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, feePaid: nextStatus, feeYear: m.feeYear || new Date().getFullYear() } : item
        )
      );
      toast.success(
        nextStatus
          ? `Đã đánh dấu "${m.name}" ĐÃ THANH TOÁN hội phí!`
          : `Đã chuyển "${m.name}" sang CHƯA THANH TOÁN!`
      );
      await router.invalidate({ sync: true });
    } catch (err: any) {
      toast.error("Không thể cập nhật trạng thái: " + (err?.message || "Lỗi mạng"));
    }
  };

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: String(v.name || "").trim(),
        contact: v.contact ? String(v.contact).trim() : undefined,
        email: v.email ? String(v.email).trim() : undefined,
        phone: v.phone ? String(v.phone).trim() : undefined,
        type: "company" as const,
        level: (v.level as any) || "memberLevel.medium",
        industry: (v.industry as any) || "ind.trade",
        region: (v.region as any) || "region.north",
        status: (v.status as any) || "pending",
        feePaid: (v as any).feePaid === "paid" || (v as any).feePaid === true,
        feeYear: v.feeYear ? Number(v.feeYear) : new Date().getFullYear(),
        address: v.address ? String(v.address).trim() : undefined,
        website: v.website ? String(v.website).trim() : undefined,
        taxCode: v.taxCode ? String(v.taxCode).trim() : undefined,
        employees: v.employees ? Number(v.employees) || 0 : undefined,
        about: v.about ? String(v.about).trim() : undefined,
      };

      if (editing) {
        await fetchNestApi(`/members/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success(t("members.updated") || "Cập nhật doanh nghiệp thành công");
        setEditing(null);
      } else {
        await fetchNestApi("/members", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(t("companies.created"));
        setOpen(false);
      }

      await loadMembers();
      await router.invalidate({ sync: true });
    } catch (err: any) {
      console.error("[Companies] Submit error:", err);
      toast.error(err?.message || t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await fetchNestApi(`/members/${deleting.id}`, { method: "DELETE" });
      toast.success(t("members.deleted") || "Đã xóa doanh nghiệp");
      setDeleting(null);
      setMembers((prev) => prev.filter((m) => m.id !== deleting.id));
      await router.invalidate({ sync: true });
    } catch (err: any) {
      toast.error(err?.message || t("common.deleteError"));
    } finally {
      setSubmitting(false);
    }
  };

  const base = useMemo(
    () =>
      MEMBERS.filter(
        (m) =>
          !m.type ||
          m.type === "company" ||
          (m.type as string) === "enterprise" ||
          (m.type as string) === "corporate",
      ),
    [MEMBERS],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return base.filter((m) => {
      if (industry && m.industry !== industry) return false;
      if (region && m.region !== region) return false;
      if (level && m.level !== level) return false;
      if (feeFilter === "paid" && !m.feePaid) return false;
      if (feeFilter === "unpaid" && m.feePaid) return false;
      if (
        ql &&
        ![m.name, m.code, m.email, m.taxCode ?? "", m.website ?? ""].some((f) =>
          f.toLowerCase().includes(ql),
        )
      )
        return false;
      return true;
    });
  }, [base, q, industry, region, level, feeFilter]);

  const tc = useTableControls<Member>(
    filtered,
    {
      name: (m) => m.name,
      industry: (m) => t(m.industry),
      region: (m) => t(m.region),
      employees: (m) => m.employees ?? 0,
      feePaid: (m) => (m.feePaid ? 1 : 0),
      status: (m) => m.status,
    },
    { initialSortKey: "name", initialPageSize: 12 },
  );

  const totalEmployees = base.reduce((sum, m) => sum + (m.employees ?? 0), 0);
  const activeCount = base.filter((m) => m.status === "active").length;
  const pendingCount = base.filter((m) => m.status === "pending").length;

  const handleExport = () => {
    downloadCsv("companies", filtered, [
      { header: "Code", value: (m) => m.code },
      { header: "Name", value: (m) => m.name },
      { header: "Email", value: (m) => m.email },
      { header: "Phone", value: (m) => m.phone },
      { header: "TaxCode", value: (m) => m.taxCode ?? "" },
      { header: "Website", value: (m) => m.website ?? "" },
      { header: "Industry", value: (m) => m.industry },
      { header: "Region", value: (m) => m.region },
      { header: "Level", value: (m) => m.level },
      { header: "FeePaid", value: (m) => (m.feePaid ? "Đã thanh toán" : "Chưa thanh toán") },
      { header: "FeeYear", value: (m) => m.feeYear ?? "" },
      { header: "Employees", value: (m) => m.employees ?? "" },
      { header: "Status", value: (m) => m.status },
    ]);
  };

  function reset() {
    setQ("");
    setIndustry("");
    setRegion("");
    setLevel("");
    setFeeFilter("");
  }

  const kpis: Array<{
    label: TKey;
    value: string;
    Icon: typeof Building2;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      label: "companies.kpi.total",
      value: base.length.toString(),
      Icon: Building2,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "companies.kpi.active",
      value: activeCount.toString(),
      Icon: CheckCircle2,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "companies.kpi.pending",
      value: pendingCount.toString(),
      Icon: Clock,
      iconBg: "bg-warning/15",
      iconColor: "text-[oklch(0.55_0.16_65)]",
    },
    {
      label: "companies.kpi.employees",
      value: totalEmployees.toLocaleString("vi-VN"),
      Icon: Users,
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <div
          className="overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-card)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                <Briefcase className="h-3.5 w-3.5" />
                {t("nav.companies")}
              </div>
              <h1 className="mt-1 text-2xl font-bold lg:text-3xl">{t("companies.title")}</h1>
              <p className="mt-1 text-sm text-primary-foreground/85">{t("companies.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex h-10 items-center gap-2 rounded-xl border border-border/20 bg-card/10 px-4 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-card/20"
              >
                <Download className="h-4 w-4" /> {t("members.export")}
              </button>
              <button
                onClick={() =>
                  isAdmin
                    ? setOpen(true)
                    : toast.error(t("perm.denied.title"), {
                        description: t("perm.denied.adminOnly"),
                      })
                }
                aria-disabled={!isAdmin}
                title={!isAdmin && !roleLoading ? t("perm.denied.title") : undefined}
                className={`flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold text-primary shadow transition hover:bg-card/90 ${
                  !isAdmin ? "opacity-60" : ""
                }`}
              >
                <Plus className="h-4 w-4" /> {t("companies.add")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${k.iconBg}`}
                >
                  <k.Icon className={`h-5 w-5 ${k.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-muted-foreground">{t(k.label)}</div>
                  <div className="text-xl font-bold text-foreground">{k.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 lg:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("companies.search")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <FilterSelect
                value={industry}
                onChange={(v) => setIndustry(v as IndustryKey)}
                placeholder={t("members.filter.industry")}
                options={INDUSTRIES.map((k) => ({ value: k, label: t(k) }))}
              />
              <FilterSelect
                value={region}
                onChange={(v) => setRegion(v as RegionKey)}
                placeholder={t("members.filter.region")}
                options={REGIONS.map((k) => ({ value: k, label: t(k) }))}
              />
              <FilterSelect
                value={level}
                onChange={(v) => setLevel(v as MemberLevelKey)}
                placeholder={t("members.f.level")}
                options={LEVELS.map((k) => ({ value: k, label: t(k) }))}
              />
              <FilterSelect
                value={feeFilter}
                onChange={(v) => setFeeFilter(v as any)}
                placeholder="Trạng thái hội phí"
                options={[
                  { value: "paid", label: "Đã thanh toán hội phí" },
                  { value: "unpaid", label: "Chưa thanh toán hội phí" },
                ]}
              />
              {(q || industry || region || level || feeFilter) && (
                <button
                  onClick={reset}
                  className="h-10 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  {t("fees.clearFilters")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-3 lg:border-t-0 lg:pt-0">
              <div className="flex rounded-xl border border-border bg-background p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    view === "grid"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t("companies.view.grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    view === "list"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t("companies.view.list")}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-base font-bold text-foreground">{t("companies.empty")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("state.empty.desc")}</p>
          </div>
        ) : view === "grid" ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tc.pageRows.map((m) => (
                <CompanyCard
                  key={m.id}
                  m={m}
                  isAdmin={isAdmin}
                  onEdit={(target) => setEditing(target)}
                  onDelete={(target) => setDeleting(target)}
                  onToggleFee={handleToggleFeePaid}
                />
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
              <Pagination
                page={tc.page}
                pageCount={tc.pageCount}
                pageSize={tc.pageSize}
                total={tc.total}
                from={tc.from}
                to={tc.to}
                onPage={tc.setPage}
                onPageSize={tc.setPageSize}
                pageSizeOptions={[12, 24, 48, 96]}
              />
            </div>
          </div>
        ) : (
          <CompanyTable
            rows={tc.pageRows}
            tc={tc}
            isAdmin={isAdmin}
            onEdit={(target) => setEditing(target)}
            onDelete={(target) => setDeleting(target)}
            onToggleFee={handleToggleFeePaid}
          />
        )}
      </div>

      <CrudModal
        open={open && !editing}
        title={t("companies.add")}
        fields={fields}
        submitting={submitting}
        submitLabel={t("common.create")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => setOpen(false)}
      />

      <CrudModal
        open={!!editing}
        title="Chỉnh sửa doanh nghiệp"
        fields={fields}
        initial={editing ? editInitial(editing) : undefined}
        submitting={submitting}
        submitLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => setEditing(null)}
      />

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDeleting(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]">
            <h3 className="text-base font-semibold text-foreground">{t("common.delete")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa doanh nghiệp{" "}
              <strong className="text-foreground">{deleting.name}</strong> không?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={submitting}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={submitting}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 min-w-[150px] rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CompanyCard({
  m,
  isAdmin,
  onEdit,
  onDelete,
  onToggleFee,
}: {
  m: Member;
  isAdmin?: boolean;
  onEdit?: (m: Member) => void;
  onDelete?: (m: Member) => void;
  onToggleFee?: (m: Member) => void;
}) {
  const t = useT();
  const s = statusStyle[m.status];
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      {/* Header band */}
      <div className="h-16" style={{ background: "var(--gradient-card)" }} />
      <div className="-mt-8 px-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card text-base font-bold text-primary-foreground shadow"
          style={{ background: "var(--gradient-primary)" }}
        >
          {initials(m.name).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-bold text-foreground">{m.name}</h3>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {t(`status.${m.status}` as TKey)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelBadge[m.level]}`}
          >
            {t(m.level)}
          </span>
          <span className="text-[11px] text-muted-foreground">{m.code}</span>
        </div>

        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{m.about}</p>

        <div className="mt-4 space-y-1.5 rounded-xl bg-muted/40 p-3 text-xs">
          <Row Icon={Briefcase} text={t(m.industry)} />
          <Row Icon={MapPin} text={`${m.address} · ${t(m.region)}`} />
          {m.website && <Row Icon={Globe} text={m.website.replace(/^https?:\/\//, "")} />}
          <Row Icon={Mail} text={m.email} />
        </div>

        {/* Fee status indicator */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs">
          <span className="text-[11px] font-medium text-muted-foreground">
            Hội phí {m.feeYear || new Date().getFullYear()}:
          </span>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onToggleFee?.(m)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition cursor-pointer shadow-sm ${
                m.feePaid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
              title="Nhấn để đổi trạng thái đóng hội phí"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${m.feePaid ? "bg-emerald-500" : "bg-amber-500"}`} />
              {m.feePaid ? "Đã thanh toán" : "Chưa thanh toán"}
            </button>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                m.feePaid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${m.feePaid ? "bg-emerald-500" : "bg-amber-500"}`} />
              {m.feePaid ? "Đã thanh toán" : "Chưa thanh toán"}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {(m.employees ?? 0).toLocaleString("vi-VN")} {t("companies.employees")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("companies.joined")}: {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            to="/companies/$companyId"
            params={{ companyId: m.id }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            {t("companies.viewProfile")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit?.(m)}
                title={t("common.edit")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete?.(m)}
                title={t("common.delete")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ Icon, text }: { Icon: typeof Briefcase; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{text}</span>
    </div>
  );
}

function CompanyTable({
  rows,
  tc,
  isAdmin,
  onEdit,
  onDelete,
  onToggleFee,
}: {
  rows: Member[];
  tc: TableControls<Member>;
  isAdmin?: boolean;
  onEdit?: (m: Member) => void;
  onDelete?: (m: Member) => void;
  onToggleFee?: (m: Member) => void;
}) {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[1050px] whitespace-nowrap border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <th className="sticky left-0 z-20 w-14 bg-secondary/90 px-3 py-3 text-center text-xs font-bold border-b border-border">STT</th>
              <th className="sticky left-[56px] z-20 bg-secondary/90 px-4 py-3 text-xs font-bold border-b border-border">Mã DN</th>
              <SortHeader
                label={t("tbl.name")}
                columnKey="name"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <SortHeader
                label={t("tbl.industry")}
                columnKey="industry"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <SortHeader
                label={t("tbl.region")}
                columnKey="region"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <SortHeader
                label={t("companies.kpi.employees")}
                columnKey="employees"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <SortHeader
                label="Hội phí"
                columnKey="feePaid"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <SortHeader
                label={t("tbl.status")}
                columnKey="status"
                sortKey={tc.sortKey}
                sortDir={tc.sortDir}
                onSort={tc.toggleSort}
                className="border-b border-border"
              />
              <th className="sticky right-0 z-20 bg-secondary/90 px-4 py-3 text-right font-bold border-b border-border">{t("tbl.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, idx) => {
              const s = statusStyle[m.status];
              return (
                <tr key={m.id} className="group border-b border-border/50 transition hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted/70 border-b border-border/50">
                    {(tc.page - 1) * tc.pageSize + idx + 1}
                  </td>
                  <td className="sticky left-[56px] z-10 bg-card px-4 py-3 font-mono text-xs font-bold text-foreground group-hover:bg-muted/70 border-b border-border/50">
                    {m.code}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold text-primary-foreground shrink-0"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {initials(m.name).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <TruncatedText
                          text={m.name}
                          maxWidth="max-w-[220px]"
                          className="font-semibold text-foreground"
                        />
                        <div className="truncate text-[11px] text-muted-foreground">
                          {m.taxCode ? `MST: ${m.taxCode}` : "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground border-b border-border/50">{t(m.industry)}</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border/50">{t(m.region)}</td>
                  <td className="px-4 py-3 font-medium text-foreground border-b border-border/50">
                    {(m.employees ?? 0).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => onToggleFee?.(m)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer shadow-sm ${
                          m.feePaid
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                        }`}
                        title="Nhấp để chuyển trạng thái hội phí"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.feePaid ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {m.feePaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          m.feePaid
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.feePaid ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {m.feePaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {t(`status.${m.status}` as TKey)}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-card px-4 py-3 text-right group-hover:bg-muted/70 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/companies/$companyId"
                        params={{ companyId: m.id }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        {t("tbl.view")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => onEdit?.(m)}
                        title={t("common.edit")}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete?.(m)}
                        title={t("common.delete")}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
        pageSizeOptions={[12, 24, 48, 96]}
      />
    </div>
  );
}
