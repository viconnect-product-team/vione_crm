import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, ShieldCheck, Search, X, RotateCcw, Eye } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useLang, useT } from "@/lib/i18n";
import {
  listAiRequestAuditFn,
  listAiAuditAssociationsFn,
  type AiAuditEntry,
  type AiAuditAssocOption,
  type AiAuditFilter,
} from "@/lib/ai-audit.functions";

export const Route = createFileRoute("/platform/ai-audit")({
  component: AiAuditPage,
});

type StatusFilter = "all" | "fallback" | "real";

function AiAuditPage() {
  const t = useT();
  const { lang } = useLang();
  const { isPlatformAdmin, loading: roleLoading } = useRole();

  const fetchLog = useServerFn(listAiRequestAuditFn);
  const fetchAssocs = useServerFn(listAiAuditAssociationsFn);

  // Draft filter inputs (applied on submit).
  const [assocId, setAssocId] = useState("");
  const [user, setUser] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [applied, setApplied] = useState<AiAuditFilter>({});
  const [detail, setDetail] = useState<AiAuditEntry | null>(null);

  const { data: assocs } = useServerData<AiAuditAssocOption[]>(
    () => (isPlatformAdmin ? fetchAssocs() : Promise.resolve([])),
    [],
  );

  const {
    data: rows,
    loading,
    reload,
  } = useServerData<AiAuditEntry[]>(
    () => (isPlatformAdmin ? fetchLog({ data: applied }) : Promise.resolve([])),
    [],
  );

  useEffect(() => {
    if (isPlatformAdmin) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin, applied]);

  const apply = () => {
    const f: AiAuditFilter = {};
    if (assocId) f.associationId = assocId;
    if (user.trim()) f.userId = user.trim();
    if (from) f.from = new Date(from).toISOString();
    if (to) {
      // include the whole "to" day
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      f.to = d.toISOString();
    }
    if (provider) f.provider = provider;
    if (status === "fallback") f.usedFallback = true;
    if (status === "real") f.usedFallback = false;
    setApplied(f);
  };

  const reset = () => {
    setAssocId("");
    setUser("");
    setFrom("");
    setTo("");
    setProvider("");
    setStatus("all");
    setApplied({});
  };

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

  const list = rows ?? [];
  const providers = [...new Set(list.map((r: any) => r.provider).filter(Boolean))] as string[];

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlatformShell>
      <PageHeader title={t("aiaudit.title")} subtitle={t("aiaudit.subtitle")} />

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.assoc")}
            <select
              className={inputCls}
              value={assocId}
              onChange={(e) => setAssocId(e.target.value)}
            >
              <option value="">{t("aiaudit.filter.allAssoc")}</option>
              {(assocs ?? []).map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.user")}
            <input
              className={inputCls}
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="email / ID"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.provider")}
            <select
              className={inputCls}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">{t("aiaudit.filter.allProviders")}</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.from")}
            <input
              type="date"
              className={inputCls}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.to")}
            <input
              type="date"
              className={inputCls}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t("aiaudit.filter.fallback")}
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">{t("aiaudit.filter.allStatus")}</option>
              <option value="real">{t("aiaudit.filter.realOnly")}</option>
              <option value="fallback">{t("aiaudit.filter.fallbackOnly")}</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={apply}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            {t("aiaudit.filter.apply")}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            {t("aiaudit.filter.reset")}
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {list.length} {t("aiaudit.count")}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{t("aiaudit.col.time")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.user")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.assoc")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.capability")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.provider")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.status")}</th>
                <th className="px-4 py-3">{t("aiaudit.col.latency")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    …
                  </td>
                </tr>
              )}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Bot className="mx-auto mb-3 h-7 w-7 opacity-50" />
                    {t("aiaudit.empty")}
                  </td>
                </tr>
              )}
              {list.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmtTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.userEmail ?? r.userName ?? r.userId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.associationName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.capability ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{r.provider ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill color={r.usedFallback ? "warning" : "success"}>
                      {r.usedFallback ? t("aiaudit.status.fallback") : t("aiaudit.status.ok")}
                    </Pill>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {r.totalLatencyMs != null ? `${r.totalLatencyMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetail(r)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{t("aiaudit.detail.title")}</h3>
              <button
                onClick={() => setDetail(null)}
                className="rounded-md p-1 hover:bg-secondary"
                aria-label={t("aiaudit.detail.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label={t("aiaudit.detail.requestId")} value={detail.requestId} />
              <Row label={t("aiaudit.col.time")} value={fmtTime(detail.createdAt)} />
              <Row
                label={t("aiaudit.col.user")}
                value={detail.userEmail ?? detail.userName ?? detail.userId ?? "—"}
              />
              <Row label={t("aiaudit.col.assoc")} value={detail.associationName ?? "—"} />
              <Row label={t("aiaudit.col.capability")} value={detail.capability ?? "—"} />
              <Row label={t("aiaudit.detail.permission")} value={detail.permissionLevel ?? "—"} />
              <Row label={t("aiaudit.col.provider")} value={detail.provider ?? "—"} />
              <Row label={t("aiaudit.detail.model")} value={detail.model ?? "—"} />
              <Row
                label={t("aiaudit.col.status")}
                value={detail.usedFallback ? t("aiaudit.status.fallback") : t("aiaudit.status.ok")}
              />
              {detail.usedFallback && (
                <Row
                  label={t("aiaudit.detail.fallbackReason")}
                  value={detail.fallbackReason ?? "—"}
                />
              )}
              <Row
                label={t("aiaudit.detail.providerLatency")}
                value={detail.providerLatencyMs != null ? `${detail.providerLatencyMs}ms` : "—"}
              />
              <Row
                label={t("aiaudit.detail.totalLatency")}
                value={detail.totalLatencyMs != null ? `${detail.totalLatencyMs}ms` : "—"}
              />
              <Row
                label={t("aiaudit.detail.sources")}
                value={`${detail.sourceCount} · ${detail.sourceTypes.join(", ") || "—"}`}
              />
            </dl>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-all font-medium text-foreground">{value}</dd>
    </div>
  );
}
