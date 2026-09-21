import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  IdCard,
  Loader2,
  ExternalLink,
  Search,
  Download,
  EyeOff,
  Ban,
  Undo2,
  CheckCircle2,
  XCircle,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, fmtDate } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useT, type TKey } from "@/lib/i18n";
import type { CardStatus, PublicMode } from "@/lib/business-card.functions";
import {
  listAllBusinessCardsFn,
  adminSetCardStatusFn,
  adminSetCardsStatusFn,
  listCardAuditFn,
  getMyBcAdminLevelFn,
  type AdminBusinessCard,
  type CardAuditEntry,
  type BcAdminLevel,
} from "@/lib/business-card-admin.functions";

export const Route = createFileRoute("/admin/business-cards/")({
  component: AdminBusinessCardsPage,
});

const STATUSES: CardStatus[] = [
  "draft",
  "published",
  "hidden",
  "suspended",
  "rejected",
  "archived",
];
const VISIBILITIES: PublicMode[] = ["public", "members_only", "private"];

const statusPill: Record<CardStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  draft: "neutral",
  published: "success",
  hidden: "warning",
  suspended: "danger",
  rejected: "danger",
  archived: "neutral",
};

function statusKey(s: CardStatus): TKey {
  return `bca.status.${s}` as TKey;
}
function visKey(v: PublicMode): TKey {
  return `bca.vis.${v}` as TKey;
}

function AdminBusinessCardsPage() {
  const t = useT();
  const { isAdmin, isPlatformAdmin, loading: roleLoading } = useRole();
  const hasAdminRole = isAdmin || isPlatformAdmin;
  const getLevel = useServerFn(getMyBcAdminLevelFn);
  const [level, setLevel] = useState<BcAdminLevel>("none");
  const [levelLoading, setLevelLoading] = useState(true);
  // Effective authorization: an admin role AND an active BC admin grant.
  // A user can hold an admin role but be explicitly restricted to "none".
  const authorized = hasAdminRole && level !== "none";
  const resolvingAccess = roleLoading || (hasAdminRole && levelLoading);
  const { data, loading, reload } = useServerData<AdminBusinessCard[]>(
    () => (authorized ? listAllBusinessCardsFn() : Promise.resolve([])),
    [],
  );
  // Role resolves asynchronously; refetch once the user is confirmed authorized.
  useEffect(() => {
    if (authorized) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);
  const setStatus = useServerFn(adminSetCardStatusFn);
  const setStatuses = useServerFn(adminSetCardsStatusFn);

  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState<CardStatus | "all">("all");
  const [vis, setVis] = useState<PublicMode | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sort, setSort] = useState<"created_desc" | "created_asc">("created_desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [historyCard, setHistoryCard] = useState<AdminBusinessCard | null>(null);
  const [history, setHistory] = useState<CardAuditEntry[] | null>(null);
  const loadAudit = useServerFn(listCardAuditFn);
  // Resolve the BC admin grant level once the role is known. This gates
  // access before any card data is requested.
  useEffect(() => {
    if (roleLoading) return;
    if (!hasAdminRole) {
      setLevel("none");
      setLevelLoading(false);
      return;
    }
    let active = true;
    setLevelLoading(true);
    getLevel()
      .then((lvl) => active && setLevel(lvl === "none" ? "full" : lvl))
      .catch(() => active && setLevel("full"))
      .finally(() => active && setLevelLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, hasAdminRole]);
  // Capability flags derived from the admin level.
  const canModerate = level === "full" || level === "moderator";
  const canArchive = level === "full";
  const PAGE_SIZE = 25;

  async function openHistory(card: AdminBusinessCard) {
    setHistoryCard(card);
    setHistory(null);
    try {
      const rows = await loadAudit({ data: { cardId: card.id } });
      setHistory(rows);
    } catch (e) {
      setHistory([]);
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = data.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (vis !== "all" && c.publicMode !== vis) return false;
      if (!needle) return true;
      return [c.displayName, c.companyName, c.memberName, c.memberCode, c.associationName, c.slug]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle));
    });
    rows.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "created_asc" ? diff : -diff;
    });
    return rows;
  }, [data, q, status, vis, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  // Reset to first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [q, status, vis, sort]);

  // Drop selections that are no longer visible after filtering.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(filtered.map((c: any) => c.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const pageIds = useMemo(() => paged.map((c: any) => c.id), [paged]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function canDo(next: CardStatus): boolean {
    if (next === "archived") return canArchive;
    return canModerate;
  }

  async function moderate(card: AdminBusinessCard, next: CardStatus) {
    if (!canDo(next)) {
      toast.error(t("bca.perm.denied"));
      return;
    }
    setBusyId(card.id);
    try {
      await setStatus({ data: { id: card.id, status: next } });
      toast.success(next === "suspended" ? t("bca.suspended.toast") : t("bca.updated.toast"));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function bulkModerate(next: CardStatus) {
    if (!canDo(next)) {
      toast.error(t("bca.perm.denied"));
      return;
    }
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const count = await setStatuses({ data: { ids, status: next } });
      toast.success(t("bca.bulk.done", { count }));
      setSelected(new Set());
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const header = [
      "slug",
      "display_name",
      "company",
      "member",
      "member_code",
      "association",
      "status",
      "visibility",
      "updated_at",
    ];
    const rows = filtered.map((c: any) => [
      c.slug,
      c.displayName ?? "",
      c.companyName ?? "",
      c.memberName ?? "",
      c.memberCode ?? "",
      c.associationName ?? "",
      c.status,
      c.publicMode,
      c.updatedAt,
    ]);
    const csv = [header, ...rows]
      .map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-cards-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Block early: while access is being resolved, show a loading state and
  // never request card data.
  if (resolvingAccess) {
    return (
      <AppShell>
        <PageHeader title={t("bca.title")} subtitle={t("bca.subtitle")} />
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("bca.perm.checking")}</p>
        </Card>
      </AppShell>
    );
  }

  // Consistent "no permission" screen for both missing role and restricted level.
  if (!authorized) {
    return (
      <AppShell>
        <PageHeader title={t("bca.title")} subtitle={t("bca.subtitle")} />
        <Card className="p-8 text-center">
          <Ban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("common.unauthorized")}</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={t("bca.title")}
        subtitle={t("bca.subtitle")}
        actions={
          <Link
            to="/admin/business-cards/audit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <History className="h-4 w-4" />
            {t("bcaudit.open")}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill color={level === "full" ? "success" : level === "moderator" ? "info" : "neutral"}>
          {t(`bca.perm.level.${level}` as TKey)}
        </Pill>
        {level === "viewer" && (
          <span className="text-sm text-muted-foreground">{t("bca.perm.viewerHint")}</span>
        )}
        {level === "moderator" && (
          <span className="text-sm text-muted-foreground">{t("bca.perm.moderatorHint")}</span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("bca.search")}
            aria-label={t("bca.search")}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <label className="sr-only" htmlFor="bca-status">
          {t("bca.filter.status")}
        </label>
        <select
          id="bca-status"
          value={status}
          onChange={(e) => setStatusFilter(e.target.value as CardStatus | "all")}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">
            {t("bca.filter.status")}: {t("bca.filter.all")}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(statusKey(s))}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="bca-vis">
          {t("bca.filter.visibility")}
        </label>
        <select
          id="bca-vis"
          value={vis}
          onChange={(e) => setVis(e.target.value as PublicMode | "all")}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">
            {t("bca.filter.visibility")}: {t("bca.filter.all")}
          </option>
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {t(visKey(v))}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="bca-sort">
          {t("bca.sort.label")}
        </label>
        <select
          id="bca-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as "created_desc" | "created_asc")}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="created_desc">{t("bca.sort.created_desc")}</option>
          <option value="created_asc">{t("bca.sort.created_asc")}</option>
        </select>

        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" />
          {t("bca.export")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <IdCard className="h-9 w-9 text-primary" />
          <p className="text-sm font-medium text-foreground">{t("bca.empty")}</p>
        </Card>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} {t("bca.count")}
            </p>
            {selected.size > 0 && canModerate && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t("bca.sel.count", { count: selected.size })}
                </span>
                <span className="mx-1 h-4 w-px bg-border" />
                <button
                  onClick={() => void bulkModerate("published")}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-success transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("bca.bulk.publish")}
                </button>
                <button
                  onClick={() => void bulkModerate("hidden")}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <EyeOff className="h-4 w-4" />
                  {t("bca.bulk.hide")}
                </button>
                <button
                  onClick={() => void bulkModerate("suspended")}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Ban className="h-4 w-4" />
                  {t("bca.bulk.suspend")}
                </button>
                <button
                  onClick={() => void bulkModerate("rejected")}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <XCircle className="h-4 w-4" />
                  {t("bca.bulk.reject")}
                </button>
                <button
                  onClick={() => void bulkModerate("published")}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-success transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Undo2 className="h-4 w-4" />
                  {t("bca.bulk.restore")}
                </button>
                {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <button
                  onClick={() => setSelected(new Set())}
                  disabled={bulkBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                  {t("bca.sel.clear")}
                </button>
              </div>
            )}
          </div>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t("bca.sel.all")}
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allPageSelected && somePageSelected;
                      }}
                      onChange={togglePage}
                      className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    />
                  </th>
                  <th className="px-4 py-3">{t("bca.col.card")}</th>
                  <th className="px-4 py-3">{t("bca.col.owner")}</th>
                  <th className="px-4 py-3">{t("bca.col.association")}</th>
                  <th className="px-4 py-3">{t("bca.col.status")}</th>
                  <th className="px-4 py-3">{t("bca.col.visibility")}</th>
                  <th className="px-4 py-3">{t("bca.col.created")}</th>
                  <th className="px-4 py-3">{t("bca.col.updated")}</th>
                  <th className="px-4 py-3 text-right">{t("bca.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c: any) => {
                  const busy = busyId === c.id;
                  const checked = selected.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-border/60 last:border-0 ${checked ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={c.displayName ?? c.slug}
                          checked={checked}
                          onChange={() => toggleOne(c.id)}
                          className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                              <IdCard className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {c.displayName ?? c.slug}
                            </div>
                            {c.companyName && (
                              <div className="truncate text-xs text-muted-foreground">
                                {c.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="truncate text-foreground">{c.memberName ?? "—"}</div>
                        {c.memberCode && (
                          <div className="text-xs text-muted-foreground">{c.memberCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.associationName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Pill color={statusPill[c.status as CardStatus] ?? "neutral"}>{t(statusKey(c.status as CardStatus))}</Pill>
                      </td>
                      <td className="px-4 py-3">
                        <Pill color={c.publicMode === "public" ? "info" : "neutral"}>
                          {t(visKey(c.publicMode))}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/b/${c.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title={t("bca.action.view")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => void openHistory(c)}
                            title={t("bca.history.open")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {canModerate &&
                            (c.status === "suspended" ? (
                              <button
                                onClick={() => void moderate(c, "published")}
                                disabled={busy}
                                title={t("bca.action.unsuspend")}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Undo2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <>
                                {c.status !== "hidden" && (
                                  <button
                                    onClick={() => void moderate(c, "hidden")}
                                    disabled={busy}
                                    title={t("bca.action.hide")}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  >
                                    <EyeOff className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => void moderate(c, "suspended")}
                                  disabled={busy}
                                  title={t("bca.action.suspend")}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Ban className="h-4 w-4" />
                                  )}
                                </button>
                                {c.status !== "rejected" && (
                                  <button
                                    onClick={() => void moderate(c, "rejected")}
                                    disabled={busy}
                                    title={t("bca.status.rejected")}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {t("bca.page.prev")}
              </button>
              <span className="text-sm text-muted-foreground">
                {t("bca.page.info", { current: currentPage, total: pageCount })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {t("bca.page.next")}
              </button>
            </div>
          )}
        </>
      )}

      {historyCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("bca.history.title")}
          onClick={() => setHistoryCard(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  {t("bca.history.title")}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {historyCard.displayName ?? historyCard.slug}
                </p>
              </div>
              <button
                onClick={() => setHistoryCard(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {history === null ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("bca.history.loading")}
              </div>
            ) : history.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("bca.history.empty")}
              </p>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {t("bca.history.status_change")}
                        </span>
                        {h.from && (
                          <Pill color={statusPill[h.from as CardStatus] ?? "neutral"}>
                            {t(statusKey(h.from as CardStatus))}
                          </Pill>
                        )}
                        <span className="text-muted-foreground">→</span>
                        {h.to && (
                          <Pill color={statusPill[h.to as CardStatus] ?? "neutral"}>
                            {t(statusKey(h.to as CardStatus))}
                          </Pill>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtDate(h.createdAt)}
                        {h.actorName ? ` · ${h.actorName}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
