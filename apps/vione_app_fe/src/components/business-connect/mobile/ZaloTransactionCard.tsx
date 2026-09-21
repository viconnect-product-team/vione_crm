import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface ZaloTransactionData {
  amount: number;
  invoiceNo: string;
  qrUrl?: string;
  dueDate?: string;
  desc?: string;
  status?: "pending" | "paid" | "unpaid";
  bankName?: string;
  accountNo?: string;
  accountName?: string;
}

export function ZaloTransactionCard({
  data,
  isFromMe = false,
}: {
  data: ZaloTransactionData;
  isFromMe?: boolean;
}) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const amount = Number(data.amount || 0);
  const invoiceNo = data.invoiceNo || "INV-2026";
  const bankName = data.bankName || "MB Bank (Ngân hàng Quân Đội)";
  const accountNo = data.accountNo || "1983000000";
  const accountName = data.accountName || "CLB DOANH NHAN CEO 1983";
  const dueDate = data.dueDate || "31/03/2026";
  const desc = data.desc || "Hội phí thường niên 2026 — CLB Doanh Nhân CEO 1983";
  const isPaid = data.status === "paid";

  const qrUrl =
    data.qrUrl ||
    `https://img.vietqr.io/image/MB-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      invoiceNo,
    )}&accountName=${encodeURIComponent(accountName)}`;

  const fmtVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  const handleCopyStk = () => {
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    toast.success(`Đã sao chép số tài khoản: ${accountNo}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VietQR_${invoiceNo}_${amount}VND.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Đã tải mã VietQR về máy!");
    } catch {
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <>
      <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-amber-400/25 bg-white dark:bg-[#121824] shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] text-slate-900 dark:text-white transition-all">
        {/* Zalo OA Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 dark:bg-amber-400/15 text-blue-600 dark:text-amber-400 border border-blue-500/20 dark:border-amber-400/30">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-amber-400 block leading-tight">
                THÔNG BÁO GIAO DỊCH
              </span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400">
                Hệ thống kế toán tự động
              </span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPaid
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Đã thu
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" /> Chờ nộp
              </>
            )}
          </span>
        </div>

        {/* Big Highlight Amount (Zalo Pay Style) */}
        <div className="px-4 pt-3.5 pb-2.5 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-white/[0.02]">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Số tiền cần thanh toán
          </div>
          <div className="text-[24px] font-black tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">
            {fmtVND(amount)}
          </div>
        </div>

        {/* Key-Value Details */}
        <div className="px-4 py-2 text-[12px] space-y-2 border-t border-dashed border-slate-200 dark:border-white/10">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Mã hóa đơn:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-right">
              {invoiceNo}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Nội dung:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 text-right leading-snug line-clamp-2">
              {desc}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Thụ hưởng:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {accountName}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Hạn nộp:</span>
            <span className="font-semibold text-red-500 dark:text-red-400 text-right">
              {dueDate}
            </span>
          </div>
        </div>

        {/* Action Button: Styled strictly with blue, white, black and status green/red */}
        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/10 space-y-1.5">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-md active:scale-[0.98] transition-all cursor-pointer"
            style={{ color: "#ffffff" }}
          >
            <QrCode className="h-4 w-4 text-white" style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff" }}>Thanh toán ngay bằng VietQR</span>
          </button>

          <button
            type="button"
            onClick={handleCopyStk}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 py-2 text-[11px] font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{copied ? "Đã sao chép STK" : `Sao chép STK: ${accountNo}`}</span>
          </button>
        </div>
      </div>

      {/* VietQR Modal Popup */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-amber-400/30 p-5 shadow-2xl text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight">
                    Mã Thanh Toán VietQR
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Napas247 Liên Ngân Hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-white p-4 border border-slate-200 shadow-inner">
              <img
                src={qrUrl}
                alt="VietQR"
                className="h-56 w-56 object-contain rounded-lg"
                loading="eager"
              />
              <p className="mt-2 text-[11px] font-bold text-slate-600">
                Quét bằng ứng dụng của bất kỳ ngân hàng nào
              </p>
            </div>

            {/* Invoice Info Summary */}
            <div className="mt-3.5 space-y-1.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] p-3 text-[11.5px] border border-slate-100 dark:border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {accountNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {fmtVND(amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Nội dung CK:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {invoiceNo}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 py-2.5 text-[12px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                style={{ color: "#ffffff" }}
              >
                <Download className="h-4 w-4 text-white" style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Tải ảnh QR</span>
              </button>
              <button
                type="button"
                onClick={handleCopyStk}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Đã chép" : "Chép STK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
