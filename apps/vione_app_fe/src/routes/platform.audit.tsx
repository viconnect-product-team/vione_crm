import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ScrollText, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { useLang, useT } from "@/lib/i18n";
import { listRoleAuditLogFn, type RoleAuditEntry } from "@/lib/platform.functions";

export const Route = createFileRoute("/platform/audit")({
  component: PlatformAuditPage,
});

const ACTION_COLOR: Record<string, "success" | "warning" | "danger" | "info"> = {
  grant_association_admin: "success",
  change_admin_association: "info",
  revoke_association_admin: "danger",
};

function PlatformAuditPage() {
  const t = useT();
  const { lang } = useLang();
  const { isPlatformAdmin, loading: roleLoading } = useRole();

  const fetchLog = useServerFn(listRoleAuditLogFn);
  const {
    data: rows,
    loading,
    reload,
  } = useServerData<RoleAuditEntry[]>(
    () => (isPlatformAdmin ? fetchLog() : Promise.resolve([])),
    [],
  );

  useEffect(() => {
    if (isPlatformAdmin) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin]);

  if (!roleLoading && !isPlatformAdmin) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const actionLabel = (a: string) => {
    const key = `audit.action.${a}`;
    const label = t(key as never);
    return label === key ? a : label;
  };

  const list = rows ?? [];
  const tc = useTableControls<RoleAuditEntry>(
    list,
    {
      time: (r) => r.createdAt,
      actor: (r) => r.actorEmail || "",
      target: (r) => r.targetEmail || "",
      action: (r) => r.action,
    },
    { initialSortKey: "time", initialSortDir: "desc", initialPageSize: 10 },
  );

  return (
    <PlatformShell>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{t("audit.col.time")}</th>
                <th className="px-4 py-3">{t("audit.col.actor")}</th>
                <th className="px-4 py-3">{t("audit.col.target")}</th>
                <th className="px-4 py-3">{t("audit.col.action")}</th>
                <th className="px-4 py-3">{t("audit.col.change")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    …
                  </td>
                </tr>
              )}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <ScrollText className="mx-auto mb-3 h-7 w-7 opacity-50" />
                    {t("audit.empty")}
                  </td>
                </tr>
              )}
              {tc.paged.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmtTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{r.actorEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{r.targetEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill color={ACTION_COLOR[r.action] ?? "neutral"}>{actionLabel(r.action)}</Pill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.oldRole ?? "∅"} → {r.newRole ?? "∅"}
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
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </Card>
    </PlatformShell>
  );
}
