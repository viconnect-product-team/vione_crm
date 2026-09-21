import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, ReceiptText, CreditCard } from "lucide-react";

import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getMyRenewalHistory, type RenewalHistoryEntry } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/renew/history")({
  component: RenewalHistoryScreen,
});

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
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const EMPTY: RenewalHistoryEntry[] = [];

function RenewalHistoryScreen() {
  const t = useT();
  const fetchHistory = useServerFn(getMyRenewalHistory);
  const { data, loading } = useServerData<RenewalHistoryEntry[]>(() => fetchHistory(), EMPTY);

  const methodLabel = (m: string | null) => {
    if (m === "bank") return t("m.rhist.methodBank");
    if (m === "card") return t("m.rhist.methodCard");
    if (m === "ewallet") return t("m.rhist.methodEwallet");
    return m ?? "—";
  };

  const statusLabel = (s: RenewalHistoryEntry["status"]) =>
    s === "paid"
      ? t("m.renew.statusPaid")
      : s === "overdue"
        ? t("m.renew.statusOverdue")
        : t("m.renew.statusPending");

  const statusColor = (s: RenewalHistoryEntry["status"]) =>
    s === "paid"
      ? "text-[var(--vba-success,#4ade80)]"
      : s === "overdue"
        ? "text-destructive"
        : "text-[var(--vba-gold)]";

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.rhist.title")} subtitle={t("m.rhist.subtitle")} back />

      <div className="space-y-3 px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-card/[0.04]" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="vba-card grid place-items-center gap-2 py-12 text-center text-[13px] text-[var(--vba-text-muted)]">
            <ReceiptText className="h-8 w-8 opacity-50" />
            {t("m.rhist.empty")}
          </div>
        ) : (
          data.map((e: any) => (
            <div key={e.id} className="vba-card overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--vba-border)] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                    <ReceiptText className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="text-[13px] font-bold text-[var(--vba-text)]">
                      {e.year ? t("m.renew.year", { n: e.year }) : e.invoice}
                    </div>
                    <div className="text-[11px] text-[var(--vba-text-muted)]">
                      {e.status === "paid"
                        ? t("m.rhist.paidOn", { d: fmtDate(e.paidAt) })
                        : t("m.rhist.due", { d: fmtDate(e.dueDate) })}
                    </div>
                  </div>
                </div>
                <span className={`text-[12px] font-bold ${statusColor(e.status)}`}>
                  {statusLabel(e.status)}
                </span>
              </div>

              <div className="grid gap-2 px-4 py-3">
                <Row
                  icon={CalendarClock}
                  label={t("m.rhist.term")}
                  value={t("m.rhist.termRange", {
                    a: fmtDate(e.termStart),
                    b: fmtDate(e.termEnd),
                  })}
                />
                <Row
                  icon={ReceiptText}
                  label={t("m.rhist.amount")}
                  value={fmtVND(e.amount)}
                  strong
                />
                <Row icon={CreditCard} label={t("m.rhist.method")} value={methodLabel(e.method)} />
                <Row icon={ReceiptText} label={t("m.rhist.invoice")} value={e.invoice} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--vba-text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={`text-right text-[13px] ${
          strong ? "font-bold text-[var(--vba-text)]" : "font-medium text-[var(--vba-text)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
