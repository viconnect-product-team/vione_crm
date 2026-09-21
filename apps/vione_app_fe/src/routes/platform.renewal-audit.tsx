import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Search, RefreshCcw, ScrollText } from "lucide-react";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { useLang, useT } from "@/lib/i18n";
import {
  getRenewalAuditScopeFn,
  searchRenewalAuditLogFn,
  type AdminRenewalAuditRow,
  type AdminRenewalAuditScope,
} from "@/lib/renewal-audit-admin.functions";

export const Route = createFileRoute("/platform/renewal-audit")({
  component: RenewalAuditAdminPage,
  head: () => ({
    meta: [
      { title: "Tra cứu nhật ký gia hạn — Business Connect" },
      {
        name: "description",
        content:
          "Tra cứu toàn bộ lần thanh toán gia hạn hội viên theo hội viên hoặc hiệp hội, kèm trạng thái thanh toán, bấm lặp và thất bại.",
      },
      { property: "og:title", content: "Tra cứu nhật ký gia hạn" },
      {
        property: "og:description",
        content: "Lịch sử tất cả lần thanh toán gia hạn theo hội viên và hiệp hội.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const EMPTY_SCOPE: AdminRenewalAuditScope = { isPlatformAdmin: false, associations: [] };
const EMPTY_ROWS: AdminRenewalAuditRow[] = [];

type EventFilter = "" | "payment" | "idempotent_noop" | "failure";

function RenewalAuditAdminPage() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "vi" ? "vi-VN" : "en-US";

  const fetchScope = useServerFn(getRenewalAuditScopeFn);
  const search = useServerFn(searchRenewalAuditLogFn);

  const { data: scope, loading: scopeLoading } = useServerData<AdminRenewalAuditScope>(
    () => fetchScope(),
    EMPTY_SCOPE,
  );

  const [associationId, setAssociationId] = useState("");
  const [needle, setNeedle] = useState("");
  const [eventType, setEventType] = useState<EventFilter>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const allowed = scope.isPlatformAdmin || scope.associations.length > 0;

  const {
    data: rows,
    loading,
    reload,
  } = useServerData<AdminRenewalAuditRow[]>(
    () =>
      allowed
        ? (search({
            data: {
              associationId: associationId || null,
              search: needle || null,
              eventType: eventType || null,
              from: from || null,
              to: to || null,
            },
          }) as Promise<AdminRenewalAuditRow[]>)
        : Promise.resolve(EMPTY_ROWS),
    EMPTY_ROWS,
  );

  useEffect(() => {
    if (allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, associationId, eventType, from, to]);

  const stats = useMemo(() => {
    const payments = rows.filter((r) => r.eventType === "payment");
    return {
      payments: payments.length,
      amount: payments.reduce((s, r) => s + r.amountPaid, 0),
      noops: rows.filter((r) => r.eventType === "idempotent_noop").length,
      failures: rows.filter((r) => r.eventType === "failure").length,
    };
  }, [rows]);

  const tc = useTableControls<AdminRenewalAuditRow>(
    rows,
    {
      time: (r) => r.createdAt,
      member: (r) => r.memberName || "",
      association: (r) => r.associationName || "",
      amount: (r) => r.amountPaid,
    },
    { initialSortKey: "time", initialSortDir: "desc", initialPageSize: 10 },
  );

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const eventTone = (e: AdminRenewalAuditRow["eventType"]): "success" | "info" | "danger" =>
    e === "payment" ? "success" : e === "idempotent_noop" ? "info" : "danger";

  const eventLabel = (e: AdminRenewalAuditRow["eventType"]) =>
    e === "payment"
      ? t("renewalAudit.event.payment")
      : e === "idempotent_noop"
        ? t("renewalAudit.event.noop")
        : t("renewalAudit.event.failure");

  if (!scopeLoading && !allowed) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <PageHeader title={t("renewalAudit.title")} subtitle={t("renewalAudit.subtitle")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("renewalAudit.stat.payments")}
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.payments}</div>
          <div className="text-xs text-muted-foreground">{fmtMoney(stats.amount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("renewalAudit.stat.noops")}
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.noops}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("renewalAudit.stat.failures")}
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.failures}</div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            reload();
          }}
        >
          <label className="text-xs font-medium text-muted-foreground">
            {t("renewalAudit.filter.association")}
            <select
              value={associationId}
              onChange={(e) => setAssociationId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">{t("renewalAudit.filter.allAssociations")}</option>
              {scope.associations.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-muted-foreground">
            {t("renewalAudit.filter.event")}
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventFilter)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">{t("renewalAudit.filter.allEvents")}</option>
              <option value="payment">{t("renewalAudit.event.payment")}</option>
              <option value="idempotent_noop">{t("renewalAudit.event.noop")}</option>
              <option value="failure">{t("renewalAudit.event.failure")}</option>
            </select>
          </label>

          <label className="text-xs font-medium text-muted-foreground">
            {t("renewalAudit.filter.from")}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <label className="text-xs font-medium text-muted-foreground">
            {t("renewalAudit.filter.to")}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <label className="text-xs font-medium text-muted-foreground">
            {t("renewalAudit.filter.member")}
            <div className="mt-1 flex gap-2">
              <input
                value={needle}
                onChange={(e) => setNeedle(e.target.value)}
                placeholder={t("renewalAudit.filter.memberPlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                aria-label={t("renewalAudit.action.search")}
              >
                <Search className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </label>
        </form>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            {t("renewalAudit.action.refresh")}
          </button>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden" aria-busy={loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{t("renewalAudit.col.time")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.member")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.association")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.event")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.amount")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.invoice")}</th>
                <th className="px-4 py-3">{t("renewalAudit.col.term")}</th>
              </tr>
            </thead>
            <tbody>
              {tc.paged.map((r: any) => (
                <tr key={r.id} className="border-b border-border/60 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmtTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.memberName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.memberCode ?? r.memberId?.slice(0, 8) ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.associationName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill color={eventTone(r.eventType)}>{eventLabel(r.eventType)}</Pill>
                    {r.eventType === "failure" && r.errorCode && (
                      <div className="mt-1 text-xs text-destructive">{r.errorCode}</div>
                    )}
                    {r.eventType === "idempotent_noop" &&
                      typeof r.metadata?.reason === "string" && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.metadata.reason}
                        </div>
                      )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.amountPaid > 0 ? fmtMoney(r.amountPaid) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {r.invoiceNo ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {r.previousTermEnd ?? "—"} → {r.newTermEnd ?? "—"}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <ScrollText className="mx-auto mb-2 h-6 w-6" aria-hidden />
                    {t("renewalAudit.empty")}
                  </td>
                </tr>
              )}
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
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </Card>
    </PlatformShell>
  );
}
