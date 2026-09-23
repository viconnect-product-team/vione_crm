import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
  UserCog,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { MemberAccountModal } from "@/components/dashboard/MemberAccountModal";
import { EmptyState, NoSearchResult, ListSkeleton } from "@/components/dashboard/StateKit";
import { useT, type TKey } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { downloadCsv } from "@/lib/csv";
import { useUrlState } from "@/hooks/use-url-state";
import { Pagination, SortHeader } from "@/components/dashboard/DataTablePagination";
import { useTableControls } from "@/hooks/use-table-controls";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import {
  type IndustryKey,
  type Member,
  type MemberStatus,
  type MemberType,
  type RegionKey,
} from "@/lib/members-data";
import { fetchNestApi } from "@/lib/api-client";
import {
  type MemberAccountStatus,
} from "@/lib/member-account.functions";
import {
  getFavorites,
  getPinned,
  getRecent,
  getSavedFilters,
  toggleFavorite,
  togglePinned,
  pushRecent,
  saveFilter,
  deleteSavedFilter,
  type SavedFilter,
} from "@/lib/member-prefs";

export const Route = createFileRoute("/members/")({
  component: MembersPage,
});

const INDUSTRIES: IndustryKey[] = [
  "ind.trade",
  "ind.it",
  "ind.manufacturing",
  "ind.realestate",
  "ind.finance",
];
const REGIONS: RegionKey[] = ["region.north", "region.central", "region.south"];
const TYPES: MemberType[] = ["company", "individual"];
const STATUSES: MemberStatus[] = ["active", "pending", "expired"];

/* ----------------------------- badges ----------------------------- */

function StatusBadge({ status }: { status: MemberStatus }) {
  const t = useT();
  const map: Record<MemberStatus, { label: TKey; bg: string; fg: string }> = {
    active: { label: "status.active", bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
    pending: { label: "status.pending", bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
    expired: { label: "status.expired", bg: "oklch(0.93 0.06 25)", fg: "oklch(0.50 0.20 25)" },
  };
  const s = map[status];
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

export function AccountStatusBadge({ status }: { status: MemberAccountStatus }) {
  const t = useT();
  const map: Record<MemberAccountStatus, { label: TKey; bg: string; fg: string }> = {
    active: { label: "acctStatus.active", bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
    invited: { label: "acctStatus.invited", bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
    none: { label: "acctStatus.none", bg: "oklch(0.95 0 0)", fg: "oklch(0.50 0 0)" },
  };
  const s = map[status];
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

function TypeChip({ type }: { type: MemberType }) {
  const t = useT();
  const Icon = type === "company" ? Building2 : User;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
      <Icon className="h-3 w-3 text-muted-foreground" />
      {t(type === "company" ? "type.company" : "type.individual")}
    </span>
  );
}

type RenewalState = { kind: "ok" | "soon" | "overdue" | "none"; days: number | null };

function renewalOf(m: Member): RenewalState {
  if (!m.termEnd) return { kind: "none", days: null };
  const days = Math.ceil((new Date(m.termEnd).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return { kind: "none", days: null };
  if (days < 0) return { kind: "overdue", days };
  if (days <= 30) return { kind: "soon", days };
  return { kind: "ok", days };
}

function RenewalBadge({ m }: { m: Member }) {
  const t = useT();
  const r = renewalOf(m);
  const map = {
    ok: { label: "mlist.renewal.ok", bg: "oklch(0.94 0.05 155)", fg: "oklch(0.44 0.14 155)" },
    soon: { label: "mlist.renewal.soon", bg: "oklch(0.95 0.08 75)", fg: "oklch(0.48 0.14 65)" },
    overdue: {
      label: "mlist.renewal.overdue",
      bg: "oklch(0.94 0.06 25)",
      fg: "oklch(0.52 0.20 25)",
    },
    none: { label: "mlist.renewal.none", bg: "oklch(0.96 0 0)", fg: "oklch(0.52 0 0)" },
  } as const;
  const s = map[r.kind];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
      title={r.days != null ? `${r.days}d` : undefined}
    >
      {t(s.label as TKey)}
    </span>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ----------------------------- filter select ----------------------------- */

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  value: T | "all";
  onChange: (v: T | "all") => void;
  options: T[];
  renderOption: (v: T) => string;
}) {
  const t = useT();
  return (
    <label className="relative inline-flex min-w-[150px] flex-1 items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "all")}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        aria-label={label}
      >
        <option value="all">
          {label}: {t("members.filter.all")}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption(o)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

/* ----------------------------- prefs hook ----------------------------- */

function useMemberPrefs() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedFilter[]>([]);

  useEffect(() => {
    const sync = () => {
      setFavorites(getFavorites());
      setPinned(getPinned());
      setRecent(getRecent());
      setSaved(getSavedFilters());
    };
    sync();
    window.addEventListener("member-prefs-changed", sync);
    return () => window.removeEventListener("member-prefs-changed", sync);
  }, []);

  return { favorites, pinned, recent, saved };
}

/* ============================== page ============================== */

function MembersPage() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    data: members = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetchNestApi<Member[]>("/members");
      return Array.isArray(res) ? res : [];
    },
  });
  const { isAdmin, loading: roleLoading } = useRole();
  const { data: acctStatuses = {} } = useQuery({
    queryKey: ["member-account-statuses"],
    queryFn: async () => {
      const res = await fetchNestApi<Record<string, string>>("/members/account-statuses");
      return res || {};
    },
    enabled: isAdmin,
  });
  const denyPermission = () =>
    toast.error(t("perm.denied.title"), { description: t("perm.denied.adminOnly") });

  const { favorites, pinned, recent, saved } = useMemberPrefs();

  const [view, setView] = useUrlState<"cards" | "table">("view", "cards");
  const [q, setQ] = useUrlState<string>("q", "");
  const [industry, setIndustry] = useUrlState<IndustryKey | "all">("industry", "all");
  const [region, setRegion] = useUrlState<RegionKey | "all">("region", "all");
  const [type, setType] = useUrlState<MemberType | "all">("type", "all");
  const [status, setStatus] = useUrlState<MemberStatus | "all">("status", "all");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<"name" | "newest" | "code" | "renewal">("newest");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountFor, setAccountFor] = useState<Member | null>(null);

  const fields: CrudField[] = [
    { name: "name", label: t("members.f.name"), type: "text", required: true },
    { name: "contact", label: t("members.f.contact"), type: "text" },
    { name: "email", label: t("members.f.email"), type: "text" },
    { name: "phone", label: t("members.f.phone"), type: "text" },
    {
      name: "type",
      label: t("members.f.type"),
      type: "select",
      options: [
        { value: "company", label: t("type.company") },
        { value: "individual", label: t("type.individual") },
      ],
    },
    {
      name: "level",
      label: t("members.f.level"),
      type: "select",
      options: [
        { value: "memberLevel.large", label: t("memberLevel.large") },
        { value: "memberLevel.medium", label: t("memberLevel.medium") },
        { value: "memberLevel.small", label: t("memberLevel.small") },
        { value: "memberLevel.individual", label: t("memberLevel.individual") },
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
    { name: "address", label: t("members.f.address"), type: "text" },
    { name: "website", label: t("members.f.website"), type: "text" },
    { name: "taxCode", label: t("members.f.taxCode"), type: "text" },
    { name: "employees", label: t("members.f.employees"), type: "number" },
    { name: "about", label: t("members.f.about"), type: "textarea" },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: String(v.name || "").trim(),
        contact: v.contact ? String(v.contact).trim() : undefined,
        email: v.email ? String(v.email).trim() : undefined,
        phone: v.phone ? String(v.phone).trim() : undefined,
        type: (v.type as any) || "individual",
        level: (v.level as any) || "memberLevel.medium",
        industry: (v.industry as any) || "ind.trade",
        region: (v.region as any) || "region.north",
        status: (v.status as any) || "pending",
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
        toast.success(t("members.updated"));
        setEditing(null);
      } else {
        await fetchNestApi("/members", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(t("members.created"));
        setOpen(false);
      }
      await refetch();
    } catch (err: any) {
      console.error("[Members] Submit error:", err);
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
      toast.success(t("members.deleted"));
      setDeleting(null);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || t("common.deleteError"));
    } finally {
      setSubmitting(false);
    }
  };

  const editInitial = (m: Member): CrudValues => ({
    name: m.name,
    contact: m.contact,
    email: m.email,
    phone: m.phone,
    type: m.type,
    level: m.level,
    industry: m.industry,
    region: m.region,
    status: m.status,
    address: m.address,
    website: m.website ?? "",
    taxCode: m.taxCode ?? "",
    employees: m.employees ?? 0,
    about: m.about,
  });

  const anyFilterActive =
    !!q || industry !== "all" || region !== "all" || type !== "all" || status !== "all" || favOnly;

  const filtered = useMemo<Member[]>(() => {
    const ql = q.trim().toLowerCase();
    const favSet = new Set(favorites);
    return members.filter((m: Member) => {
      if (industry !== "all" && m.industry !== industry) return false;
      if (region !== "all" && m.region !== region) return false;
      if (type !== "all" && m.type !== type) return false;
      if (status !== "all" && m.status !== status) return false;
      if (favOnly && !favSet.has(m.id)) return false;
      if (
        ql &&
        !m.name.toLowerCase().includes(ql) &&
        !m.code.toLowerCase().includes(ql) &&
        !m.email.toLowerCase().includes(ql) &&
        !m.contact.toLowerCase().includes(ql)
      )
        return false;
      return true;
    });
  }, [members, q, industry, region, type, status, favOnly, favorites]);

  const ordered = useMemo<Member[]>(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      switch (sort) {
        case "newest": {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.joinedAt ? new Date(a.joinedAt).getTime() : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.joinedAt ? new Date(b.joinedAt).getTime() : 0);
          if (timeB !== timeA) return timeB - timeA;
          return (b.joinedAt || "").localeCompare(a.joinedAt || "");
        }
        case "code":
          return a.code.localeCompare(b.code, undefined, { numeric: true });
        case "renewal": {
          const da = renewalOf(a).days ?? Infinity;
          const db = renewalOf(b).days ?? Infinity;
          return da - db;
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return copy;
  }, [filtered, sort]);

  // In cards view we control ordering ourselves (sort dropdown), so we hand the
  // pre-ordered list to the table-controls with no active sort key. In table
  // view the sortable column headers drive the sort.
  const tc = useTableControls<Member>(
    ordered,
    {
      code: (m) => m.code,
      name: (m) => m.name,
      industry: (m) => t(m.industry),
      region: (m) => t(m.region),
      type: (m) => m.type,
      status: (m) => m.status,
      joined: (m) => m.createdAt || m.joinedAt,
    },
    { initialPageSize: 24, initialSortKey: "joined", initialSortDir: "desc" },
  );

  const reset = () => {
    setQ("");
    setIndustry("all");
    setRegion("all");
    setType("all");
    setStatus("all");
    setFavOnly(false);
  };

  const csvCols = [
    { header: "Code", value: (m: Member) => m.code },
    { header: "Name", value: (m: Member) => m.name },
    { header: "Contact", value: (m: Member) => m.contact },
    { header: "Email", value: (m: Member) => m.email },
    { header: "Phone", value: (m: Member) => m.phone },
    { header: "Type", value: (m: Member) => m.type },
    { header: "Level", value: (m: Member) => m.level },
    { header: "Industry", value: (m: Member) => m.industry },
    { header: "Region", value: (m: Member) => m.region },
    { header: "Status", value: (m: Member) => m.status },
    { header: "JoinedAt", value: (m: Member) => m.joinedAt },
    { header: "FeeYear", value: (m: Member) => String(m.feeYear) },
    { header: "FeePaid", value: (m: Member) => (m.feePaid ? "yes" : "no") },
  ];

  const handleExport = () => downloadCsv("members", tc.sorted, csvCols);
  const handleExportSelected = () => {
    const rows = members.filter((m) => sel.has(m.id));
    downloadCsv("members-selected", rows, csvCols);
  };

  const toggleSel = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAllPage = () =>
    setSel((prev) => {
      const next = new Set(prev);
      const allSelected = tc.pageRows.every((m) => next.has(m.id));
      tc.pageRows.forEach((m) => (allSelected ? next.delete(m.id) : next.add(m.id)));
      return next;
    });

  const openMember = (m: Member) => {
    pushRecent(m.id);
    navigate({ to: "/members/$memberId", params: { memberId: m.id }, search: REVIEW_SEARCH_RESET });
  };

  const doSaveFilter = () => {
    const name = window.prompt(t("mlist.saveFilterName"));
    if (!name) return;
    saveFilter({
      id: `sf-${Date.now()}`,
      name,
      q,
      industry,
      region,
      type,
      status,
    });
    toast.success(t("mlist.saveFilter"));
  };

  const applySaved = (f: SavedFilter) => {
    setQ(f.q);
    setIndustry(f.industry as IndustryKey | "all");
    setRegion(f.region as RegionKey | "all");
    setType(f.type as MemberType | "all");
    setStatus(f.status as MemberStatus | "all");
  };

  const pinnedMembers = pinned
    .map((id: any) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);
  const recentMembers = recent
    .map((id: any) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m)
    .slice(0, 8);

  return (
    <AppShell>
      {/* Hero */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-foreground">
            {t("members.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("members.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-card p-0.5 shadow-[var(--shadow-card)]">
            <button
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "cards"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> {t("mlist.viewCards")}
            </button>
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "table"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" /> {t("mlist.viewTable")}
            </button>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("members.export")}
          </button>
          <button
            onClick={() => (isAdmin ? setOpen(true) : denyPermission())}
            aria-disabled={!isAdmin}
            title={!isAdmin && !roleLoading ? t("perm.denied.title") : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] ${
              !isAdmin ? "opacity-60" : ""
            }`}
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("members.add")}
          </button>
        </div>
      </div>

      {/* Pinned + recently viewed rails */}
      {(pinnedMembers.length > 0 || recentMembers.length > 0) && (
        <div className="mb-4 grid gap-3 lg:grid-cols-2">
          {pinnedMembers.length > 0 && (
            <QuickRail title={t("mlist.pinned")} icon={<Pin className="h-3.5 w-3.5" />}>
              {pinnedMembers.map((m) => (
                <MemberChip key={m.id} m={m} onClick={() => openMember(m)} />
              ))}
            </QuickRail>
          )}
          {recentMembers.length > 0 && (
            <QuickRail title={t("mlist.recent")} icon={<Eye className="h-3.5 w-3.5" />}>
              {recentMembers.map((m) => (
                <MemberChip key={m.id} m={m} onClick={() => openMember(m)} />
              ))}
            </QuickRail>
          )}
        </div>
      )}

      {/* Sticky search + filters */}
      <div className="sm:sticky sm:top-18 z-20 mb-5 rounded-2xl border border-border bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("members.search")}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <FilterSelect
            label={t("members.filter.industry")}
            value={industry}
            onChange={setIndustry}
            options={INDUSTRIES}
            renderOption={(v) => t(v)}
          />
          <FilterSelect
            label={t("members.filter.region")}
            value={region}
            onChange={setRegion}
            options={REGIONS}
            renderOption={(v) => t(v)}
          />
          <FilterSelect
            label={t("members.filter.type")}
            value={type}
            onChange={setType}
            options={TYPES}
            renderOption={(v) => t(v === "company" ? "type.company" : "type.individual")}
          />
          <FilterSelect
            label={t("mlist.filter.status")}
            value={status}
            onChange={setStatus}
            options={STATUSES}
            renderOption={(v) => t(`status.${v}` as TKey)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
              favOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Star className={`h-4 w-4 ${favOnly ? "fill-current" : ""}`} />{" "}
            {t("mlist.onlyFavorites")}
          </button>

          {view === "cards" && (
            <label className="relative inline-flex items-center">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-9 appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-sm font-medium text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                aria-label={t("mlist.sortBy")}
              >
                <option value="name">{t("mlist.sort.name")}</option>
                <option value="newest">{t("mlist.sort.newest")}</option>
                <option value="code">{t("mlist.sort.code")}</option>
                <option value="renewal">{t("mlist.sort.renewal")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground" />
            </label>
          )}

          <button
            onClick={doSaveFilter}
            disabled={!anyFilterActive}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Star className="h-4 w-4 text-muted-foreground" /> {t("mlist.saveFilter")}
          </button>

          {anyFilterActive && (
            <button
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Filter className="h-4 w-4 text-muted-foreground" /> {t("members.filter.reset")}
            </button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{tc.total}</span> {t("members.count")}
          </span>
        </div>

        {/* Saved filters */}
        {saved.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("mlist.savedFilters")}
            </span>
            {saved.map((f) => (
              <span
                key={f.id}
                className="group inline-flex items-center gap-1 rounded-full border border-border bg-background py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
              >
                <button onClick={() => applySaved(f)} className="hover:text-primary">
                  {f.name}
                </button>
                <button
                  onClick={() => deleteSavedFilter(f.id)}
                  aria-label={t("common.delete")}
                  className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div className="vba-pop-in mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">
            {sel.size} {t("mlist.selected")}
          </span>
          <button
            onClick={handleExportSelected}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> {t("mlist.exportSelected")}
          </button>
          <button
            onClick={() => setSel(new Set())}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> {t("mlist.clearSelection")}
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <ListSkeleton rows={6} />
        </div>
      ) : tc.total === 0 ? (
        anyFilterActive ? (
          <NoSearchResult />
        ) : (
          <EmptyState />
        )
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tc.pageRows.map((m) => (
            <MemberCard
              key={m.id}
              m={m}
              t={t}
              isAdmin={isAdmin}
              roleLoading={roleLoading}
              selected={sel.has(m.id)}
              favorite={favorites.includes(m.id)}
              pinned={pinned.includes(m.id)}
              accountStatus={isAdmin ? ((acctStatuses[m.id] as MemberAccountStatus) ?? "none") : undefined}
              onOpen={() => openMember(m)}
              onToggleSel={() => toggleSel(m.id)}
              onToggleFav={() => setFavoriteAndSync(m.id)}
              onTogglePin={() => setPinnedAndSync(m.id)}
              onEdit={() => (isAdmin ? setEditing(m) : denyPermission())}
              onAccount={() => (isAdmin ? setAccountFor(m) : denyPermission())}
              onDelete={() => (isAdmin ? setDeleting(m) : denyPermission())}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[72px] min-w-[72px] max-w-[72px] bg-secondary px-2 py-3 text-center border-r border-b border-border">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <input
                        type="checkbox"
                        aria-label={t("mlist.selectAll")}
                        checked={tc.pageRows.length > 0 && tc.pageRows.every((m) => sel.has(m.id))}
                        onChange={selectAllPage}
                        className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                      />
                      <span>STT</span>
                    </div>
                  </th>
                  <th className="sticky left-[72px] z-20 min-w-[110px] bg-secondary px-4 py-3 border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      onClick={() => tc.toggleSort("code")}
                      className="inline-flex items-center gap-1 font-bold uppercase tracking-wider transition-colors hover:text-foreground text-left"
                      aria-label={t("tbl.code")}
                    >
                      {t("tbl.code")}
                    </button>
                  </th>
                  <SortHeader
                    label={t("tbl.name")}
                    columnKey="name"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label={t("tbl.industry")}
                    columnKey="industry"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label={t("tbl.region")}
                    columnKey="region"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label={t("tbl.type")}
                    columnKey="type"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label={t("tbl.status")}
                    columnKey="status"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label={t("tbl.joined")}
                    columnKey="joined"
                    sortKey={tc.sortKey}
                    sortDir={tc.sortDir}
                    onSort={tc.toggleSort}
                  />
                  {isAdmin && <th className="px-4 py-3 text-left border-b border-border">{t("acctStatus.label")}</th>}
                  <th className="sticky right-0 z-20 min-w-[140px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">{t("tbl.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {tc.pageRows.map((m, idx) => (
                  <tr
                    key={m.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,button,input")) return;
                      openMember(m);
                    }}
                    className="group cursor-pointer border-b border-border transition-all duration-150 hover:bg-secondary/60 hover:shadow-[inset_3px_0_0_0_var(--primary)]"
                  >
                    <td className="sticky left-0 z-10 w-[72px] min-w-[72px] max-w-[72px] bg-card group-hover:bg-muted/70 px-2 py-3 text-center border-r border-b border-border transition-colors">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <input
                          type="checkbox"
                          checked={sel.has(m.id)}
                          onChange={() => toggleSel(m.id)}
                          aria-label={m.name}
                          className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                        />
                        <span className="font-medium text-muted-foreground text-xs">{(tc.page - 1) * tc.pageSize + idx + 1}</span>
                      </div>
                    </td>
                    <td className="sticky left-[72px] z-10 min-w-[110px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      {m.code}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <Avatar m={m} className="h-9 w-9 text-[11px]" />
                        <div className="min-w-0">
                          <TruncatedText text={m.name} maxWidth="max-w-[300px]" className="font-semibold text-foreground" />
                          <TruncatedText text={m.email || m.contact || ""} maxWidth="max-w-[300px]" className="text-[11px] text-muted-foreground" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground border-b border-border">{t(m.industry)}</td>
                    <td className="px-4 py-3 text-foreground border-b border-border">{t(m.region)}</td>
                    <td className="px-4 py-3 border-b border-border">
                      <TypeChip type={m.type} />
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground border-b border-border">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 border-b border-border">
                        <AccountStatusBadge status={(acctStatuses[m.id] as MemberAccountStatus) ?? "none"} />
                      </td>
                    )}
                    <td className="sticky right-0 z-10 min-w-[140px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to="/members/$memberId"
                          params={{ memberId: m.id }}
                          search={REVIEW_SEARCH_RESET}
                          onClick={() => pushRecent(m.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("tbl.view")}
                        </Link>
                        <button
                          onClick={() => (isAdmin ? setEditing(m) : setEditing(m))}
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-1.5 text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => (isAdmin ? setAccountFor(m) : setAccountFor(m))}
                          aria-label={t("macct.manage")}
                          title={t("macct.manage")}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-1.5 text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => (isAdmin ? setDeleting(m) : setDeleting(m))}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
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
      )}

      {/* Card view pagination */}
      {view === "cards" && tc.total > 0 && (
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
      )}

      <CrudModal
        open={open}
        title={t("members.add")}
        fields={fields}
        submitting={submitting}
        submitLabel={t("common.create")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => setOpen(false)}
      />

      <CrudModal
        open={!!editing}
        title={t("members.edit")}
        fields={fields}
        initial={editing ? editInitial(editing) : undefined}
        submitting={submitting}
        submitLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => setEditing(null)}
      />

      {accountFor && (
        <MemberAccountModal
          memberId={accountFor.id}
          memberName={accountFor.name}
          memberEmail={accountFor.email}
          onClose={() => {
            setAccountFor(null);
            qc.invalidateQueries({ queryKey: ["member-account-statuses"] });
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDeleting(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]">
            <h3 className="text-base font-semibold text-foreground">{t("common.delete")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("common.confirmDelete").replace("{name}", deleting.name)}
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

  function setFavoriteAndSync(id: string) {
    toggleFavorite(id);
  }
  function setPinnedAndSync(id: string) {
    togglePinned(id);
  }
}

/* ----------------------------- sub components ----------------------------- */

function Avatar({ m, className = "" }: { m: Member; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground ${className}`}
      style={{ background: "var(--gradient-primary)" }}
    >
      {m.type === "company" ? <Building2 className="h-1/2 w-1/2" /> : initials(m.name)}
    </div>
  );
}

function QuickRail({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function MemberChip({ m, onClick }: { m: Member; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
    >
      <Avatar m={m} className="h-6 w-6 text-[9px]" />
      <span className="truncate">{m.name}</span>
    </button>
  );
}

function MemberCard({
  m,
  t,
  isAdmin,
  roleLoading,
  selected,
  favorite,
  pinned,
  accountStatus,
  onOpen,
  onToggleSel,
  onToggleFav,
  onTogglePin,
  onEdit,
  onAccount,
  onDelete,
}: {
  m: Member;
  t: ReturnType<typeof useT>;
  isAdmin: boolean;
  roleLoading: boolean;
  selected: boolean;
  favorite: boolean;
  pinned: boolean;
  accountStatus?: MemberAccountStatus;
  onOpen: () => void;
  onToggleSel: () => void;
  onToggleFav: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onAccount: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`vba-pop-in group relative flex flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-[var(--motion-base)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] ${
        selected ? "border-primary ring-1 ring-primary/30" : "border-border"
      }`}
    >
      {/* top row: checkbox + fav/pin */}
      <div className="mb-3 flex items-start justify-between">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSel}
          aria-label={m.name}
          className="mt-1 h-4 w-4 rounded border-border accent-[var(--primary)]"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFav}
            aria-label={t("mlist.addToFavorites")}
            aria-pressed={favorite}
            className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
              favorite ? "text-warning" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={onTogglePin}
            aria-label={pinned ? t("mlist.unpin") : t("mlist.pin")}
            aria-pressed={pinned}
            className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
              pinned ? "text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* identity */}
      <button onClick={onOpen} className="flex items-center gap-3 text-left">
        <Avatar m={m} className="h-14 w-14 text-[16px]" />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-foreground group-hover:text-primary">
            {m.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-mono font-semibold text-primary">{m.code}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{t(m.level)}</span>
          </div>
        </div>
      </button>

      {/* meta */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
        <MetaRow
          icon={<Building2 className="h-3.5 w-3.5" />}
          value={m.type === "company" ? m.name : m.contact || "—"}
        />
        <MetaRow icon={<MapPin className="h-3.5 w-3.5" />} value={t(m.region)} />
        <MetaRow icon={<Filter className="h-3.5 w-3.5" />} value={t(m.industry)} />
        <MetaRow
          value={m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("vi-VN") : "—"}
          icon={<Eye className="h-3.5 w-3.5" />}
        />
      </div>

      {/* badges */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={m.status} />
        <RenewalBadge m={m} />
        <TypeChip type={m.type} />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
            m.feePaid ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {m.feePaid ? t("mlist.feePaid") : t("mlist.feeDue")}
        </span>
        {isAdmin && accountStatus && <AccountStatusBadge status={accountStatus} />}
      </div>

      {/* actions */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3">
        <Link
          to="/members/$memberId"
          params={{ memberId: m.id }}
          search={REVIEW_SEARCH_RESET}
          onClick={onOpen}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Eye className="h-3.5 w-3.5" /> {t("tbl.view")}
        </Link>
        <button
          onClick={onEdit}
          aria-label={t("common.edit")}
          title={!isAdmin && !roleLoading ? t("perm.denied.title") : undefined}
          className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-muted ${!isAdmin ? "opacity-60" : ""}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onAccount}
          aria-label={t("macct.manage")}
          className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-muted ${!isAdmin ? "opacity-60" : ""}`}
        >
          <UserCog className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          aria-label={t("common.delete")}
          className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-destructive hover:bg-destructive/10 ${!isAdmin ? "opacity-60" : ""}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MetaRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/70">{icon}</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
}
