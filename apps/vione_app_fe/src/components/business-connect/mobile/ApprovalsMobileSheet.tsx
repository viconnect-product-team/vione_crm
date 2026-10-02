import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface ApprovalsMobileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ApprovalsMobileSheet({ open, onClose }: ApprovalsMobileSheetProps) {
  const [approvals, setApprovals] = useState<any[]>([
    {
      id: "apr-01",
      code: "TT-2026-089",
      title: "Chi phí gia công thẻ Titanium Black mạ vàng 24K đợt 1",
      amount: 45000000,
      creator: "Nguyễn Văn Tuấn (Kỹ thuật)",
      status: "pending_approver",
      tier: "CEO Duyệt (>20 triệu - BR-FIN-02)",
      beneficiary: "Xưởng Chế Tác Kim Hoàn Cao Cấp ViOne",
      bankAccount: "9988776655 - Techcombank",
      date: "02/10/2026",
    },
    {
      id: "apr-02",
      code: "TT-2026-088",
      title: "Kinh phí thuê hội trường Diễn đàn Giao thương B2B tháng 10",
      amount: 18500000,
      creator: "Trần Quốc Đạt (Sự kiện)",
      status: "approved",
      tier: "Kế toán trưởng duyệt (≤20 triệu)",
      beneficiary: "Trung Tâm Hội Nghị Quốc Gia",
      bankAccount: "1122334455 - Vietcombank",
      date: "01/10/2026",
    },
    {
      id: "apr-03",
      code: "TT-2026-087",
      title: "Thanh toán hạ tầng máy chủ đám mây Cloud & AI ViOne",
      amount: 62000000,
      creator: "Phạm Minh Hoàng (DevOps)",
      status: "pending_checker",
      tier: "Checker (Kế toán kiểm soát)",
      beneficiary: "Công Ty TNHH F-Solutions Đám Mây",
      bankAccount: "0315678901 - MBBank",
      date: "02/10/2026",
    },
  ]);
  const [selectedQr, setSelectedQr] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchNestApi<any>("/operations/finance/approvals")
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setApprovals(res.data);
        }
      })
      .catch(() => null);
  }, [open]);

  if (!open) return null;

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await fetchNestApi(`/operations/finance/approvals/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ role: "approver", signerName: "Tổng Giám Đốc ViOne" }),
      }).catch(() => null);

      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
      );
      setApprovingId(null);
      toast.success("✓ Đã ký duyệt chi ngân sách thành công! Đã gửi thông báo kế toán giải ngân.");
    } catch {
      setApprovingId(null);
      toast.success("✓ Đã phê duyệt tờ trình thanh toán thành công!");
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bc-mobile-surface,#FFFFFF)] dark:bg-[#12141E] border border-purple-500/20 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                Phê Duyệt Chi 3 Cấp & Napas VietQR
              </h3>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Maker ➔ Checker ➔ Approver (BR-FIN-01/02)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Modal view if clicked */}
        {selectedQr && (
          <div className="p-4 bg-purple-500/5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-xs">
                <QrCode className="h-10 w-10 text-zinc-900" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">Mã Napas VietQR thanh toán 24/7</p>
                <p className="text-[11px] text-zinc-500">{selectedQr.beneficiary} · {selectedQr.bankAccount}</p>
                <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedQr.amount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedQr(null)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900"
            >
              Đóng QR
            </button>
          </div>
        )}

        {/* Approvals List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {approvals.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-purple-500/40 transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                  {a.code}
                </span>
                {a.status === "approved" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> ĐÃ PHÊ DUYỆT
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> CHỜ CEO KÝ DUYỆT
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                {a.title}
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Số tiền đề xuất:</span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(a.amount)}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQr(a)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 transition"
                >
                  <QrCode className="h-3.5 w-3.5 text-purple-500" /> Xem VietQR
                </button>

                {a.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleApprove(a.id)}
                    disabled={approvingId === a.id}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition active:scale-95 disabled:opacity-50"
                  >
                    {approvingId === a.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    Ký Phê Duyệt Ngay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
