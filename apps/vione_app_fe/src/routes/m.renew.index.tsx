import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import {
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getMyMembership, type MyMembership } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/renew/")({
  component: RenewScreen,
});

const EMPTY: MyMembership = {
  found: false,
  code: "",
  name: "",
  level: null,
  status: null,
  joinedAt: null,
  termEnd: null,
  newTermEnd: null,
  renewedAt: null,
  feeYear: null,
  feePaid: false,
  daysToExpiry: null,
  outstandingAmount: 0,
  invoices: [],
};

function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function RenewScreen() {
  const t = useT();
  const navigate = useNavigate();
  const fetchMembership = useServerFn(getMyMembership);
  const {
    data: live,
    loading,
    reload,
  } = useServerData<MyMembership>(() => fetchMembership(), EMPTY);

  // Offline support: cache the latest membership status + renewal schedule and
  // re-sync automatically once the network returns.
  const CACHE_KEY = "member-renewal-status";
  const [cached, setCached] = useState<MyMembership | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) setCached(JSON.parse(raw) as MyMembership);
    } catch {
      /* ignore corrupt cache */
    }
  }, []);

  useEffect(() => {
    if (!loading && live.found) {
      setCached(live);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(live));
      } catch {
        /* ignore quota errors */
      }
    }
  }, [live, loading]);

  useEffect(() => {
    const onOnline = () => reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reload]);

  // Prefer live data; fall back to the cached copy while offline / loading.
  const data: MyMembership = live.found ? live : (cached ?? live);
  const usingCache = !live.found && !!cached?.found;
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  const effectiveEnd = data.newTermEnd ?? data.termEnd;
  const days = data.daysToExpiry;
  const isExpired = days !== null && days < 0;
  const isExpiring = days !== null && days >= 0 && days <= 30;

  const statusLabel = isExpired
    ? t("m.renew.statusExpired")
    : isExpiring
      ? t("m.renew.statusExpiring")
      : t("m.renew.statusActive");
  const statusColor = isExpired
    ? "text-destructive"
    : isExpiring
      ? "text-[var(--vba-gold)]"
      : "text-[var(--vba-success,#4ade80)]";

  const invStatusLabel = (s: string) =>
    s === "paid"
      ? t("m.renew.statusPaid")
      : s === "overdue"
        ? t("m.renew.statusOverdue")
        : t("m.renew.statusPending");

  const onRenew = () => {
    navigate({ to: "/m/renew/pay" });
  };

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.renew.title")} subtitle={t("m.renew.subtitle")} back />

      <div className="space-y-4 px-4 pt-4">
        {(usingCache || isOffline) && data.found && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-gold)]/5 px-3 py-2 text-[11px] text-[var(--vba-text-muted)]">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--vba-gold)]" />
            {t("m.renew.offlineCache")}
          </div>
        )}
        {loading && !data.found ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-card/[0.04]" />
            ))}
          </div>
        ) : !data.found ? (
          <div className="vba-card grid place-items-center gap-2 py-12 text-center text-[13px] text-[var(--vba-text-muted)]">
            <ShieldCheck className="h-8 w-8 opacity-50" />
            {t("m.renew.noMember")}
          </div>
        ) : (
          <>
            {/* Plan status card */}
            <div className="vba-card overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--vba-border)] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[13px] font-bold text-[var(--vba-text)]">
                      {t("m.renew.planTitle")}
                    </div>
                    <div className="text-[11px] text-[var(--vba-text-muted)]">
                      {data.level ? `${t("m.renew.level")}: ${data.level}` : data.code}
                    </div>
                  </div>
                </div>
                <span className={`text-[12px] font-bold ${statusColor}`}>{statusLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-[var(--vba-border)]">
                <InfoCell
                  icon={CalendarDays}
                  label={t("m.renew.joinedAt")}
                  value={fmtDate(data.joinedAt)}
                />
                <InfoCell
                  icon={CalendarClock}
                  label={t("m.renew.termEnd")}
                  value={fmtDate(effectiveEnd)}
                  hint={
                    days === null
                      ? undefined
                      : isExpired
                        ? t("m.renew.expiredAgo", { n: Math.abs(days) })
                        : t("m.renew.daysLeft", { n: days })
                  }
                  hintColor={statusColor}
                />
                <InfoCell
                  icon={RefreshCw}
                  label={t("m.renew.renewedAt")}
                  value={fmtDate(data.renewedAt)}
                />
                <InfoCell
                  icon={ReceiptText}
                  label={t("m.renew.outstanding")}
                  value={fmtVND(data.outstandingAmount)}
                  hintColor={data.outstandingAmount > 0 ? "text-[var(--vba-gold)]" : undefined}
                />
              </div>
            </div>

            {/* Renew button */}
            <button
              onClick={onRenew}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vba-gold)] py-3.5 text-[14px] font-bold text-[#1a1304]"
            >
              <RefreshCw className="h-4 w-4" />
              {t("m.renew.renewNow")}
            </button>
            {data.outstandingAmount === 0 && (
              <p className="text-center text-[12px] text-[var(--vba-success,#4ade80)]">
                {t("m.renew.allPaid")}
              </p>
            )}

            <button
              onClick={() => navigate({ to: "/m/renew/history" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--vba-border)] py-3 text-[13px] font-semibold text-[var(--vba-text)]"
            >
              <ReceiptText className="h-4 w-4" />
              {t("m.renew.viewHistory")}
            </button>

            <div>
              <h3 className="mb-2 px-1 text-[13px] font-bold text-[var(--vba-text)]">
                {t("m.renew.scheduleTitle")}
              </h3>
              {data.invoices.length === 0 ? (
                <div className="vba-card grid place-items-center py-8 text-[13px] text-[var(--vba-text-muted)]">
                  {t("m.renew.scheduleEmpty")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.invoices.map((inv) => (
                    <div key={inv.id} className="vba-card flex items-center gap-3 px-4 py-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                        <ReceiptText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                          {inv.year ? t("m.renew.year", { n: inv.year }) : inv.invoice}
                        </div>
                        <div className="text-[11px] text-[var(--vba-text-muted)]">
                          {inv.status === "paid"
                            ? t("m.renew.paidOn", { d: fmtDate(inv.paidAt) })
                            : t("m.renew.due", { d: fmtDate(inv.dueDate) })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold text-[var(--vba-text)]">
                          {fmtVND(inv.amount)}
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            inv.status === "paid"
                              ? "text-[var(--vba-success,#4ade80)]"
                              : inv.status === "overdue"
                                ? "text-destructive"
                                : "text-[var(--vba-gold)]"
                          }`}
                        >
                          {invStatusLabel(inv.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
  hint,
  hintColor,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint?: string;
  hintColor?: string;
}) {
  return (
    <div className="bg-[var(--vba-surface,transparent)] px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--vba-text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-[var(--vba-text)]">{value}</div>
      {hint && <div className={`text-[11px] font-medium ${hintColor ?? ""}`}>{hint}</div>}
    </div>
  );
}
