import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ReceiptText, CalendarDays, Activity, CheckCircle2, Clock } from "lucide-react";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getMyHistory, type MyHistory } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/history")({
  component: HistoryScreen,
});

const EMPTY: MyHistory = { activities: [], payments: [], events: [] };

function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type Tab = "payments" | "events" | "activity";

function HistoryScreen() {
  const t = useT();
  const fetchHistory = useServerFn(getMyHistory);
  const { data, loading } = useServerData<MyHistory>(() => fetchHistory(), EMPTY);
  const [tab, setTab] = useState<Tab>("payments");

  const tabs: { key: Tab; label: string; icon: typeof ReceiptText; count: number }[] = [
    {
      key: "payments",
      label: t("m.history.tabPayments"),
      icon: ReceiptText,
      count: data.payments.length,
    },
    {
      key: "events",
      label: t("m.history.tabEvents"),
      icon: CalendarDays,
      count: data.events.length,
    },
    {
      key: "activity",
      label: t("m.history.tabActivity"),
      icon: Activity,
      count: data.activities.length,
    },
  ];

  const payStatusLabel = (s: string) =>
    s === "paid"
      ? t("m.history.payPaid")
      : s === "refunded"
        ? t("m.history.payRefunded")
        : t("m.history.payPending");

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.history.title")} subtitle={t("m.history.subtitle")} back />

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-semibold transition ${
                active
                  ? "border-[var(--vba-gold)] bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]"
                  : "border-[var(--vba-border)] text-[var(--vba-text-muted)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{tb.label}</span>
              <span className="text-[10px] opacity-70">({tb.count})</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2.5 px-4">
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-card/[0.04]" />
            ))}
          </div>
        ) : tab === "payments" ? (
          data.payments.length === 0 ? (
            <Empty label={t("m.history.empty")} />
          ) : (
            data.payments.map((p) => (
              <div key={p.id} className="vba-card flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                    {p.description || p.invoice}
                  </div>
                  <div className="text-[11px] text-[var(--vba-text-muted)]">
                    {p.invoice} · {fmtDate(p.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-[var(--vba-text)]">
                    {fmtVND(p.amount)}
                  </div>
                  <div
                    className={`text-[10px] font-medium ${
                      p.status === "paid"
                        ? "text-[var(--vba-success,#4ade80)]"
                        : p.status === "refunded"
                          ? "text-[var(--vba-text-muted)]"
                          : "text-[var(--vba-gold)]"
                    }`}
                  >
                    {payStatusLabel(p.status)}
                  </div>
                </div>
              </div>
            ))
          )
        ) : tab === "events" ? (
          data.events.length === 0 ? (
            <Empty label={t("m.history.empty")} />
          ) : (
            data.events.map((e: any) => (
              <div key={e.id} className="vba-card flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                    {e.name}
                  </div>
                  <div className="text-[11px] text-[var(--vba-text-muted)]">{fmtDate(e.date)}</div>
                </div>
                <span
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    e.checkedIn
                      ? "text-[var(--vba-success,#4ade80)]"
                      : "text-[var(--vba-text-muted)]"
                  }`}
                >
                  {e.checkedIn ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {e.checkedIn ? t("m.history.checkedIn") : t("m.history.registered")}
                </span>
              </div>
            ))
          )
        ) : data.activities.length === 0 ? (
          <Empty label={t("m.history.empty")} />
        ) : (
          data.activities.map((a: any) => (
            <div key={a.id} className="vba-card flex items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                <Activity className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                  {a.title}
                </div>
                <div className="text-[11px] text-[var(--vba-text-muted)]">{fmtDate(a.date)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="vba-card grid place-items-center py-12 text-[13px] text-[var(--vba-text-muted)]">
      {label}
    </div>
  );
}
