import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Ban,
  ArrowLeft,
  Download,
  ExternalLink,
  History,
  Search,
  Eye,
  FileText,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, TableShell, fmtDate } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { baseLang, useT, useLang, type TKey } from "@/lib/i18n";

// Human-readable labels for card fields shown in the audit before/after diff.
const FIELD_LABELS: Record<string, { vi: string; en: string }> = {
  slug: { vi: "Đường dẫn", en: "Slug" },
  card_kind: { vi: "Loại thẻ", en: "Card type" },
  public_mode: { vi: "Chế độ công khai", en: "Public mode" },
  display_name: { vi: "Tên hiển thị", en: "Display name" },
  professional_title: { vi: "Chức danh", en: "Title" },
  company_name: { vi: "Công ty", en: "Company" },
  company_logo_url: { vi: "Logo công ty", en: "Company logo" },
  avatar_url: { vi: "Ảnh đại diện", en: "Avatar" },
  cover_url: { vi: "Ảnh bìa", en: "Cover" },
  headline: { vi: "Tiêu đề", en: "Headline" },
  bio: { vi: "Giới thiệu", en: "Bio" },
  website: { vi: "Website", en: "Website" },
  work_email: { vi: "Email công việc", en: "Work email" },
  work_phone: { vi: "Điện thoại", en: "Work phone" },
  zalo_url: { vi: "Zalo", en: "Zalo" },
  linkedin_url: { vi: "LinkedIn", en: "LinkedIn" },
  facebook_url: { vi: "Facebook", en: "Facebook" },
  youtube_url: { vi: "YouTube", en: "YouTube" },
  tiktok_url: { vi: "TikTok", en: "TikTok" },
  address: { vi: "Địa chỉ", en: "Address" },
  map_url: { vi: "Bản đồ", en: "Map" },
  theme_id: { vi: "Giao diện", en: "Theme" },
  custom_brand_color: { vi: "Màu thương hiệu", en: "Brand color" },
  visibility_settings: { vi: "Hiển thị", en: "Visibility" },
};
import {
  listBusinessCardAuditLogFn,
  type AuditLogEntry,
} from "@/lib/business-card-admin.functions";

export const Route = createFileRoute("/admin/business-cards/audit")({
  component: AuditLogPage,
});

const EVENT_TYPES = ["create", "update", "set_primary", "delete", "status_change"] as const;

function eventKey(e: string): TKey {
  if ((EVENT_TYPES as readonly string[]).includes(e)) {
    return `bcaudit.event.${e}` as TKey;
  }
  return "bcaudit.col.event";
}

function eventColor(e: string): "success" | "info" | "warning" | "danger" | "neutral" {
  switch (e) {
    case "create":
      return "success";
    case "update":
      return "info";
    case "set_primary":
      return "warning";
    case "delete":
      return "danger";
    default:
      return "neutral";
  }
}

// Action filter options (publish/unpublish derived from status_change)
const ACTION_TYPES = ["create", "update", "publish", "unpublish", "set_primary", "delete"] as const;
type ActionType = (typeof ACTION_TYPES)[number];

function actionLabelKey(a: ActionType): TKey {
  if (a === "publish") return "bcaudit.action.publish";
  if (a === "unpublish") return "bcaudit.action.unpublish";
  return `bcaudit.event.${a}` as TKey;
}

// Match an audit row against an action filter value
function matchesAction(r: AuditLogEntry, action: string): boolean {
  if (action === "all") return true;
  if (action === "publish") {
    return r.eventType === "status_change" && r.to === "published";
  }
  if (action === "unpublish") {
    return r.eventType === "status_change" && r.from === "published" && r.to !== "published";
  }
  return r.eventType === action;
}

function AuditLogPage() {
  const t = useT();
  const { isAdmin, isPlatformAdmin, loading: roleLoading } = useRole();
  const authorized = isAdmin || isPlatformAdmin;
  const { data, loading, reload } = useServerData<AuditLogEntry[]>(
    () => (authorized ? listBusinessCardAuditLogFn({ data: {} }) : Promise.resolve([])),
    [],
  );
  useEffect(() => {
    if (authorized) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const members = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data ?? []) {
      const id = (r.memberCode ?? r.memberName ?? "") as string;
      if (!id) continue;
      if (!map.has(id)) {
        map.set(id, `${r.memberName ?? "—"}${r.memberCode ? ` (${r.memberCode})` : ""}`);
      }
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;
    return (data ?? []).filter((r) => {
      if (!matchesAction(r, actionFilter)) return false;
      if (memberFilter !== "all") {
        const id = (r.memberCode ?? r.memberName ?? "") as string;
        if (id !== memberFilter) return false;
      }
      if (fromTs !== null || toTs !== null) {
        const ts = new Date(r.createdAt).getTime();
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
      }
      if (!term) return true;
      return [r.cardName, r.memberName, r.memberCode, r.actorName, r.associationName]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [data, q, actionFilter, memberFilter, dateFrom, dateTo]);

  const [sortKey, setSortKey] = useState<"timeDesc" | "timeAsc" | "actionAsc" | "actionDesc">(
    "timeDesc",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === "timeAsc" || sortKey === "timeDesc") {
        const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortKey === "timeAsc" ? d : -d;
      }
      const c = a.eventType.localeCompare(b.eventType);
      return sortKey === "actionAsc" ? c : -c;
    });
    return arr;
  }, [rows, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => sortedRows.slice((pageSafe - 1) * pageSize, pageSafe * pageSize),
    [sortedRows, pageSafe, pageSize],
  );

  // Reset to first page whenever filters/sort/size change.
  useEffect(() => {
    setPage(1);
  }, [q, actionFilter, memberFilter, dateFrom, dateTo, sortKey, pageSize]);

  const filtersActive =
    q !== "" ||
    actionFilter !== "all" ||
    memberFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  function resetFilters() {
    setQ("");
    setActionFilter("all");
    setMemberFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function exportCsv() {
    const header = [
      t("bcaudit.col.time"),
      t("bcaudit.col.event"),
      t("bcaudit.col.card"),
      t("bcaudit.col.member"),
      t("bcaudit.col.association"),
      t("bcaudit.col.actor"),
      t("bcaudit.col.detail"),
    ];
    const lines = sortedRows.map((r: any) => {
      const detail = r.from || r.to ? `${r.from ?? ""} -> ${r.to ?? ""}` : (r.reason ?? "");
      return [
        fmtDate(r.createdAt),
        t(eventKey(r.eventType)),
        r.cardName ?? "",
        `${r.memberName ?? ""} ${r.memberCode ?? ""}`.trim(),
        r.associationName ?? "",
        r.actorName ?? t("bcaudit.actor.system"),
        detail,
      ]
        .map((c: any) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-card-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const marginX = 10;
    let y = 16;
    doc.setFontSize(14);
    doc.text(t("bcaudit.pdfTitle"), marginX, y);
    doc.setFontSize(8);
    y += 6;
    doc.text(new Date().toLocaleString(), marginX, y);
    y += 6;

    const cols = [
      { key: "time", w: 34 },
      { key: "event", w: 24 },
      { key: "card", w: 45 },
      { key: "member", w: 45 },
      { key: "association", w: 45 },
      { key: "actor", w: 35 },
      { key: "detail", w: 45 },
    ];
    const headers = [
      t("bcaudit.col.time"),
      t("bcaudit.col.event"),
      t("bcaudit.col.card"),
      t("bcaudit.col.member"),
      t("bcaudit.col.association"),
      t("bcaudit.col.actor"),
      t("bcaudit.col.detail"),
    ];

    function drawHeader() {
      doc.setFont("helvetica", "bold");
      let x = marginX;
      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += cols[i].w;
      });
      doc.setFont("helvetica", "normal");
      y += 2;
      doc.line(marginX, y, marginX + cols.reduce((s, c) => s + c.w, 0), y);
      y += 4;
    }
    drawHeader();

    sortedRows.forEach((r: any) => {
      if (y > 195) {
        doc.addPage();
        y = 16;
        drawHeader();
      }
      const detail = r.from || r.to ? `${r.from ?? ""} -> ${r.to ?? ""}` : (r.reason ?? "");
      const cells = [
        fmtDate(r.createdAt),
        t(eventKey(r.eventType)),
        r.cardName ?? "",
        `${r.memberName ?? ""} ${r.memberCode ?? ""}`.trim(),
        r.associationName ?? "",
        r.actorName ?? t("bcaudit.actor.system"),
        detail,
      ];
      let x = marginX;
      cells.forEach((c, i) => {
        const lines = doc.splitTextToSize(String(c), cols[i].w - 2);
        doc.text(lines.slice(0, 2), x, y);
        x += cols[i].w;
      });
      y += 7;
    });

    doc.save(`business-card-audit-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (roleLoading) {
    return (
      <AppShell>
        <PageHeader title={t("bcaudit.title")} subtitle={t("bcaudit.subtitle")} />
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("bca.perm.checking")}</p>
        </Card>
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <PageHeader title={t("bcaudit.title")} subtitle={t("bcaudit.subtitle")} />
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
        title={t("bcaudit.title")}
        subtitle={t("bcaudit.subtitle")}
        actions={
          <>
            <Link
              to="/admin/business-cards"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("bcaudit.back")}
            </Link>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {t("bcaudit.export")}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {t("bcaudit.exportPdf")}
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("bcaudit.search")}
            aria-label={t("bcaudit.search")}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label={t("bcaudit.filter.action")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">{t("bcaudit.filter.all")}</option>
          {ACTION_TYPES.map((a: any) => (
            <option key={a} value={a}>
              {t(actionLabelKey(a))}
            </option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          aria-label={t("bcaudit.filter.member")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">{t("bcaudit.filter.allMembers")}</option>
          {members.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label={t("bcaudit.filter.from")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label={t("bcaudit.filter.to")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("bcaudit.filter.reset")}
          </button>
        )}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          aria-label={t("bcaudit.sort.label")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="timeDesc">{t("bcaudit.sort.timeDesc")}</option>
          <option value="timeAsc">{t("bcaudit.sort.timeAsc")}</option>
          <option value="actionAsc">{t("bcaudit.sort.actionAsc")}</option>
          <option value="actionDesc">{t("bcaudit.sort.actionDesc")}</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label={t("bcaudit.page.size")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {[10, 25, 50, 100].map((n: any) => (
            <option key={n} value={n}>
              {n} / {t("bcaudit.page.size")}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {rows.length} {t("bcaudit.count")}
        </span>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("bcaudit.loading")}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("bcaudit.empty")}</p>
        </Card>
      ) : (
        <TableShell
          columns={[
            t("bcaudit.col.time"),
            t("bcaudit.col.event"),
            t("bcaudit.col.card"),
            t("bcaudit.col.member"),
            t("bcaudit.col.association"),
            t("bcaudit.col.actor"),
            t("bcaudit.col.detail"),
            "",
          ]}
        >
          {pagedRows.map((r: any) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {fmtDate(r.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Pill color={eventColor(r.eventType)}>{t(eventKey(r.eventType))}</Pill>
              </td>
              <td className="px-4 py-3">
                {r.cardSlug ? (
                  <a
                    href={`/c/${r.cardSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    {r.cardName ?? r.cardSlug}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{r.cardName ?? "—"}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{r.memberName ?? "—"}</div>
                {r.memberCode && (
                  <div className="text-[11px] text-muted-foreground">{r.memberCode}</div>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.associationName ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.actorName ?? t("bcaudit.actor.system")}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.from || r.to ? (
                  <span>
                    {r.from ?? "—"} <span className="mx-1">→</span> {r.to ?? "—"}
                  </span>
                ) : (
                  (r.reason ?? "—")
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  aria-label={t("bcaudit.detail.view")}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("bcaudit.detail.view")}
                </button>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {!loading && sortedRows.length > 0 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">
            {t("bcaudit.page.info")
              .replace("{0}", String(pageSafe))
              .replace("{1}", String(totalPages))}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {t("bcaudit.page.prev")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {t("bcaudit.page.next")}
          </button>
        </div>
      )}

      {selected && <AuditDetailModal entry={selected} onClose={() => setSelected(null)} t={t} />}
    </AppShell>
  );
}

function AuditDetailModal({
  entry,
  onClose,
  t,
}: {
  entry: AuditLogEntry;
  onClose: () => void;
  t: ReturnType<typeof useT>;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { lang } = useLang();
  const fieldLabel = (f: string) => FIELD_LABELS[f]?.[baseLang(lang)] ?? f;
  const hasFieldChanges = entry.changes.length > 0;
  const hasChange = Boolean(entry.from || entry.to);
  const dash = t("bcaudit.detail.empty");

  const rowsInfo: Array<[string, string]> = [
    [t("bcaudit.col.time"), fmtDate(entry.createdAt)],
    [t("bcaudit.col.card"), entry.cardName ?? dash],
    [
      t("bcaudit.col.member"),
      `${entry.memberName ?? dash}${entry.memberCode ? ` (${entry.memberCode})` : ""}`,
    ],
    [t("bcaudit.col.association"), entry.associationName ?? dash],
    [t("bcaudit.col.actor"), entry.actorName ?? t("bcaudit.actor.system")],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bcaudit.detail.title")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Card className="w-full p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Pill color={eventColor(entry.eventType)}>{t(eventKey(entry.eventType))}</Pill>
              <h2 className="text-sm font-semibold text-foreground">{t("bcaudit.detail.title")}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("bcaudit.detail.close")}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              {rowsInfo.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-lg border border-border p-3">
              {hasFieldChanges ? (
                <div className="space-y-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("bcaudit.detail.fieldChanges")}
                  </div>
                  <div className="space-y-2">
                    {entry.changes.map((c: any) => (
                      <div key={c.field} className="rounded-md border border-border p-2.5">
                        <div className="mb-1.5 text-xs font-semibold text-foreground">
                          {fieldLabel(c.field)}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {t("bcaudit.detail.before")}
                            </div>
                            <div className="break-words rounded bg-secondary px-2 py-1 text-xs text-foreground line-through decoration-muted-foreground/50">
                              {c.from ?? dash}
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {t("bcaudit.detail.after")}
                            </div>
                            <div className="break-words rounded bg-secondary px-2 py-1 text-xs font-medium text-foreground">
                              {c.to ?? dash}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : hasChange ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("bcaudit.detail.before")}
                    </div>
                    <div className="rounded-md bg-secondary px-2.5 py-1.5 text-sm text-foreground">
                      {entry.from ?? dash}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("bcaudit.detail.after")}
                    </div>
                    <div className="rounded-md bg-secondary px-2.5 py-1.5 text-sm text-foreground">
                      {entry.to ?? dash}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("bcaudit.detail.noChange")}</p>
              )}
              {entry.reason && (
                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("bcaudit.detail.reason")}
                  </div>
                  <p className="text-sm text-foreground">{entry.reason}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
