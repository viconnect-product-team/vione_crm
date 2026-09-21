import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ReceiptText,
  CalendarClock,
  RefreshCw,
  AlertTriangle,
  ScrollText,
  Loader2,
} from "lucide-react";
import { MemberHeader } from "@/components/member/MemberShell";
import { payMyRenewal } from "@/lib/member-app/renewal.functions";
import { useT } from "@/lib/i18n";

type ResultSearch = {
  status: "success" | "failed";
  reference: string;
  amount: number;
  method: string;
  newTermEnd: string;
  error: string;
};

export const Route = createFileRoute("/m/renew/result")({
  validateSearch: (search: Record<string, unknown>): ResultSearch => ({
    status: search.status === "success" ? "success" : "failed",
    reference: typeof search.reference === "string" ? search.reference : "",
    amount: Number(search.amount ?? 0) || 0,
    method: typeof search.method === "string" ? search.method : "",
    newTermEnd: typeof search.newTermEnd === "string" ? search.newTermEnd : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  component: ResultScreen,
});

const ERROR_MESSAGES: Record<string, string> = {
  "gateway-declined": "Cổng thanh toán từ chối giao dịch. Chưa có khoản tiền nào bị trừ.",
  "no-member": "Không tìm thấy hồ sơ hội viên tương ứng với tài khoản của bạn.",
  timeout: "Giao dịch quá thời gian chờ. Hạn hội viên chưa được gia hạn.",
  network: "Không kết nối được máy chủ thanh toán. Vui lòng thử lại.",
};

function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ResultScreen() {
  const t = useT();
  const navigate = useNavigate();
  const pay = useServerFn(payMyRenewal);
  const { status, reference, amount, method, newTermEnd, error } = Route.useSearch();
  const ok = status === "success";
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    setRetrying(true);
    const correlationId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    try {
      const res = await pay({
        data: {
          method: (method || "bank") as "bank" | "card" | "ewallet",
          simulateFailure: false,
          correlationId,
        },
      });
      const ref = res.reference || correlationId;
      if (!res.success) {
        toast.error(t("m.pay.resultFailTitle"), {
          description: `Ref ${ref}`,
          action: {
            label: t("m.pay.viewAuditRecord"),
            onClick: () => navigate({ to: "/m/renew/audit", search: { ref } }),
          },
        });
      } else {
        toast.success(t("m.pay.resultSuccessTitle"), { description: `Ref ${ref}` });
      }
      navigate({
        to: "/m/renew/result",
        search: {
          status: res.success ? "success" : "failed",
          reference: ref,
          amount: res.amountPaid,
          method: res.method,
          newTermEnd: res.newTermEnd ?? "",
          error: res.error ?? "",
        },
      });
    } catch {
      toast.error(t("m.pay.resultFailTitle"), { description: `Ref ${correlationId}` });
      navigate({
        to: "/m/renew/result",
        search: {
          status: "failed",
          reference: correlationId,
          amount: 0,
          method,
          newTermEnd: "",
          error: "network",
        },
      });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.renew.title")} back />

      <div className="flex flex-col items-center px-4 pt-10 text-center">
        <span
          className={`grid h-20 w-20 place-items-center rounded-full ${
            ok
              ? "bg-[var(--vba-success,#4ade80)]/15 text-[var(--vba-success,#4ade80)]"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {ok ? <CheckCircle2 className="h-11 w-11" /> : <XCircle className="h-11 w-11" />}
        </span>

        <h2 className="mt-5 text-[18px] font-extrabold text-[var(--vba-text)]">
          {ok ? t("m.pay.resultSuccessTitle") : t("m.pay.resultFailTitle")}
        </h2>
        <p className="mt-1.5 max-w-[280px] text-[13px] text-[var(--vba-text-muted)]">
          {ok ? t("m.pay.resultSuccessBody") : t("m.pay.resultFailBody")}
        </p>

        {!ok && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 w-full space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-left"
          >
            <div className="flex items-center gap-2 text-[13px] font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {t("m.pay.failAlertTitle")}
            </div>
            <p className="text-[12px] text-primary-foreground/70">
              {ERROR_MESSAGES[error] ?? t("m.pay.failReasonUnknown")}
            </p>
            <div className="text-[11px] text-primary-foreground/50">
              Ref <span className="font-mono">{reference || "—"}</span>
            </div>
            <Link
              to="/m/renew/audit"
              search={{ ref: reference }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-gold)]/40 bg-[var(--vba-gold)]/10 px-3 py-2 text-[12px] font-semibold text-[var(--vba-gold)]"
            >
              <ScrollText className="h-3.5 w-3.5" aria-hidden />
              {t("m.pay.viewAuditRecord")}
            </Link>
          </div>
        )}

        {ok && (
          <div className="mt-6 w-full space-y-2.5">
            <DetailRow icon={ReceiptText} label={t("m.pay.reference")} value={reference || "—"} />
            <DetailRow icon={ReceiptText} label={t("m.pay.paidAmount")} value={fmtVND(amount)} />
            <DetailRow
              icon={CalendarClock}
              label={t("m.pay.validUntil")}
              value={fmtDate(newTermEnd)}
            />
            {reference && (
              <Link
                to="/m/renew/audit"
                search={{ ref: reference }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-gold)]/40 bg-[var(--vba-gold)]/10 px-3 py-2 text-[12px] font-semibold text-[var(--vba-gold)]"
              >
                <ScrollText className="h-3.5 w-3.5" aria-hidden />
                {t("m.pay.viewAuditRecord")}
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 w-full space-y-2.5">
          {ok ? (
            <>
              <button
                onClick={() => navigate({ to: "/m/renew" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vba-gold)] py-3.5 text-[14px] font-bold text-[#1a1304]"
              >
                {t("m.pay.viewRenewal")}
              </button>
              <button
                onClick={() => navigate({ to: "/m/card" })}
                className="w-full rounded-xl border border-[var(--vba-border)] py-3.5 text-[14px] font-semibold text-[var(--vba-text)]"
              >
                {t("m.pay.backToCard")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retryPayment}
                disabled={retrying}
                aria-busy={retrying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vba-gold)] py-3.5 text-[14px] font-bold text-[#1a1304] disabled:opacity-60"
              >
                {retrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {retrying ? t("m.pay.retrying") : t("m.pay.retryPayment")}
              </button>
              <p aria-live="polite" className="text-[11px] text-[var(--vba-text-muted)]">
                {retrying ? t("m.pay.retryStatus") : ""}
              </p>
              <button
                onClick={() => navigate({ to: "/m/renew/pay" })}
                className="w-full rounded-xl border border-[var(--vba-border)] py-3.5 text-[14px] font-semibold text-[var(--vba-text)]"
              >
                {t("m.pay.tryAgain")}
              </button>

              <button
                onClick={() => navigate({ to: "/m/renew" })}
                className="w-full rounded-xl border border-[var(--vba-border)] py-3.5 text-[14px] font-semibold text-[var(--vba-text)]"
              >
                {t("m.pay.backToCard")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="vba-card flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-2 text-[12px] text-[var(--vba-text-muted)]">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-[13px] font-semibold text-[var(--vba-text)]">{value}</span>
    </div>
  );
}
