import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Building2,
  CreditCard,
  Loader2,
  Lock,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getRenewalQuote, payMyRenewal, type RenewalQuote } from "@/lib/member-app.functions";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/renew/pay")({
  component: PayScreen,
});

type Method = "bank" | "card" | "ewallet";

const EMPTY: RenewalQuote = {
  found: false,
  code: "",
  amount: 0,
  outstanding: 0,
  renewalFee: 0,
  currentTermEnd: null,
  nextTermEnd: null,
  pendingInvoices: [],
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

const METHODS: { id: Method; icon: typeof CreditCard; labelKey: string }[] = [
  { id: "bank", icon: Building2, labelKey: "m.pay.bank" },
  { id: "card", icon: CreditCard, labelKey: "m.pay.card" },
  { id: "ewallet", icon: Wallet, labelKey: "m.pay.ewallet" },
];

function PayScreen() {
  const t = useT();
  const navigate = useNavigate();
  const fetchQuote = useServerFn(getRenewalQuote);
  const pay = useServerFn(payMyRenewal);
  const { data, loading } = useServerData<RenewalQuote>(() => fetchQuote(), EMPTY);

  const [method, setMethod] = useState<Method>("bank");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function onPay() {
    setProcessing(true);
    // One correlation id per attempt — server reuses it as the audit reference.
    const correlationId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    try {
      const res = await pay({ data: { method, simulateFailure, correlationId } });
      const ref = res.reference || correlationId;
      if (!res.success) {
        toast.error("Thanh toán gia hạn thất bại", {
          description: `Ref ${ref} · đã ghi vào nhật ký gia hạn.`,
          duration: 10000,
          action: {
            label: t("m.pay.retryPayment"),
            onClick: () => {
              toast.loading(t("m.pay.retrying"), { id: "renew-retry", duration: 4000 });
              void onPay();
            },
          },
          cancel: {
            label: t("m.pay.viewAuditRecord"),
            onClick: () => navigate({ to: "/m/renew/audit", search: { ref } }),
          },
        });
      } else {
        toast.success("Thanh toán gia hạn thành công", {
          description: `Ref ${ref}`,
          action: {
            label: t("m.pay.viewAuditRecord"),
            onClick: () => navigate({ to: "/m/renew/audit", search: { ref } }),
          },
        });
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
      toast.error("Thanh toán gia hạn thất bại", {
        description: `Ref ${correlationId} · Không kết nối được máy chủ thanh toán.`,
        duration: 10000,
        action: {
          label: t("m.pay.retryPayment"),
          onClick: () => {
            toast.loading(t("m.pay.retrying"), { id: "renew-retry", duration: 4000 });
            void onPay();
          },
        },
        cancel: {
          label: t("m.pay.viewAuditRecord"),
          onClick: () => navigate({ to: "/m/renew/audit", search: { ref: correlationId } }),
        },
      });
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
      setProcessing(false);
    }
  }

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.pay.title")} subtitle={t("m.pay.subtitle")} back />

      <div className="space-y-4 px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-card/[0.04]" />
            ))}
          </div>
        ) : !data.found || data.amount <= 0 ? (
          <div className="vba-card grid place-items-center gap-2 py-12 text-center text-[13px] text-[var(--vba-text-muted)]">
            <ShieldCheck className="h-8 w-8 opacity-50" />
            {t("m.pay.noAmount")}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="vba-card overflow-hidden p-0">
              <div className="flex items-center gap-2.5 border-b border-[var(--vba-border)] px-4 py-3.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--vba-gold)]/10 text-[var(--vba-gold)]">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div className="text-[13px] font-bold text-[var(--vba-text)]">
                  {t("m.pay.summary")}
                </div>
              </div>
              <div className="space-y-2.5 px-4 py-3.5">
                {data.outstanding > 0 ? (
                  <Row label={t("m.pay.outstanding")} value={fmtVND(data.outstanding)} />
                ) : (
                  <Row label={t("m.pay.renewalFee")} value={fmtVND(data.renewalFee)} />
                )}
                <Row label={t("m.pay.newTerm")} value={fmtDate(data.nextTermEnd)} />
                <div className="mt-1 flex items-center justify-between border-t border-[var(--vba-border)] pt-2.5">
                  <span className="text-[13px] font-bold text-[var(--vba-text)]">
                    {t("m.pay.amount")}
                  </span>
                  <span className="text-[16px] font-extrabold text-[var(--vba-gold)]">
                    {fmtVND(data.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Methods */}
            <div>
              <h3 className="mb-2 px-1 text-[13px] font-bold text-[var(--vba-text)]">
                {t("m.pay.method")}
              </h3>
              <div className="space-y-2.5">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`vba-card flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                        active ? "ring-2 ring-[var(--vba-gold)]" : ""
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-lg ${
                          active
                            ? "bg-[var(--vba-gold)]/15 text-[var(--vba-gold)]"
                            : "bg-card/[0.05] text-[var(--vba-text-muted)]"
                        }`}
                      >
                        <m.icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="flex-1 text-[13px] font-semibold text-[var(--vba-text)]">
                        {t(m.labelKey as Parameters<typeof t>[0])}
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border-2 ${
                          active
                            ? "border-[var(--vba-gold)] bg-[var(--vba-gold)]"
                            : "border-[var(--vba-border)]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulate failure (test hook) */}
            <label className="flex items-center gap-2.5 px-1 text-[12px] text-[var(--vba-text-muted)]">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--vba-border)] accent-[var(--vba-gold)]"
              />
              {t("m.pay.simulateFail")}
            </label>

            {/* Pay button */}
            <button
              onClick={onPay}
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vba-gold)] py-3.5 text-[14px] font-bold text-[#1a1304] disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("m.pay.processing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t("m.pay.pay", { amount: fmtVND(data.amount) })}
                </>
              )}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--vba-text-muted)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("m.pay.secureHint")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--vba-text-muted)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--vba-text)]">{value}</span>
    </div>
  );
}
