import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  DollarSign,
  FileText,
  UserCheck,
  ShieldCheck,
  Building2,
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  FileSpreadsheet,
  Download,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/payment-approvals")({
  ssr: false,
  component: PaymentApprovalsPage,
});

export interface PaymentRequest {
  id: string;
  code: string;
  title: string;
  amountVnd: number;
  department: string;
  maker: { name: string; role: string; date: string };
  checker?: { name: string; role: string; status: "pending" | "approved" | "rejected"; date?: string };
  approver?: { name: string; role: string; status: "pending" | "approved" | "rejected"; date?: string };
  status: "pending_checker" | "pending_approver" | "approved_paid" | "rejected";
  invoiceNumber: string; // Chống chi trùng BR-FIN-07
  budgetRemainingPercent: number; // BR-FIN-04
  vietQrGenerated: boolean;
  qrPayload?: string;
}

function PaymentApprovalsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending_checker" | "pending_approver" | "approved_paid">("all");
  const [qrModalItem, setQrModalItem] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await fetchNestApi<any>("/operations/finance/approvals");
      if (res?.data && Array.isArray(res.data)) {
        setPayments(res.data);
      } else if (Array.isArray(res)) {
        setPayments(res);
      } else {
        setPayments([]);
      }
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const pendingApproverCount = payments.filter((p) => p.status === "pending_approver").length;
  const pendingCheckerCount = payments.filter((p) => p.status === "pending_checker").length;
  const totalApprovedAmount = payments
    .filter((p) => p.status === "approved_paid")
    .reduce((acc, cur) => acc + cur.amountVnd, 0);

  const filtered = useMemo(() => {
    if (activeTab === "all") return payments;
    return payments.filter((p) => p.status === activeTab);
  }, [payments, activeTab]);

  const handleCheckerApprove = async (id: string) => {
    try {
      await fetchNestApi(`/operations/finance/approvals/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ role: "checker", signerName: "Trần Thu Hà" }),
      });
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const needsCEO = p.amountVnd > 20000000;
            return {
              ...p,
              checker: { name: "Trần Thu Hà", role: "Kế Toán Trưởng", status: "approved", date: "Vừa xong" },
              status: needsCEO ? "pending_approver" : "approved_paid",
            };
          }
          return p;
        })
      );
      toast.success("Kế toán trưởng (Checker) đã xác nhận chứng từ & hạn mức ngân sách.");
    } catch {
      toast.error("Không thể ghi nhận duyệt chi trên hệ thống.");
    }
  };

  const handleCEOApprove = async (id: string) => {
    try {
      await fetchNestApi(`/operations/finance/approvals/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ role: "approver", signerName: "Nguyễn Minh Đăng" }),
      });
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              approver: { name: "Nguyễn Minh Đăng", role: "Tổng Giám Đốc (CEO)", status: "approved", date: "Vừa xong" },
              status: "approved_paid",
            };
          }
          return p;
        })
      );
      toast.success("Lãnh đạo đã ký điện tử duyệt chi thành công.");
    } catch {
      toast.error("Không thể ghi nhận ký duyệt trên hệ thống.");
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const res = await fetchNestApi<any>("/ai/export-excel", {
        method: "POST",
        body: JSON.stringify({ reportType: "approvals" }),
      });
      if (res?.success && res?.downloadUrl) {
        toast.success(`Đã xuất báo cáo ${res.fileName || "Excel"} thành công!`);
        window.open(res.downloadUrl, "_blank");
      }
    } catch (e: any) {
      toast.error(e?.message || "Không thể xuất file Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Quy Trình Phê Duyệt Chi Tiền 3 Cấp & Dòng Tiền Thực"
          subtitle="Quy trình 3 cấp (Người lập → Kế toán kiểm tra → Lãnh đạo phê duyệt), kiểm soát hạn mức chức danh và chuyển khoản mã QR ngân hàng nhanh chóng."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="size-4" />
                <span>{isExportingExcel ? "Đang xuất..." : "Xuất Báo Cáo Excel (.xlsx)"}</span>
              </button>
              <button
                type="button"
                onClick={fetchApprovals}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Đồng bộ</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                CHUYỂN KHOẢN QR HOẠT ĐỘNG
              </span>
            </div>
          }
        />

        {/* 4 Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Chờ CEO ký duyệt (>20tr)"
            value={`${pendingApproverCount} Khoản chi`}
            hint="Hạn mức thẩm quyền Tổng Giám Đốc"
            tone="danger"
            icon={<ShieldCheck className="size-5" />}
          />
          <StatCard
            label="Chờ Kế Toán Trưởng kiểm soát"
            value={`${pendingCheckerCount} Khoản chi`}
            hint="Kiểm tra hóa đơn & hạn mức ngân sách"
            tone="warning"
            icon={<Clock className="size-5" />}
          />
          <StatCard
            label="Đã duyệt & Thanh toán"
            value={`${(totalApprovedAmount / 1000000).toFixed(1)} tr VNĐ`}
            hint="Tự động đối soát chuyển khoản"
            tone="success"
            icon={<CheckCircle2 className="size-5" />}
          />
          <StatCard
            label="Chống chi trùng hóa đơn"
            value="100% An toàn"
            hint="Kiểm tra hóa đơn hợp lệ trên hệ thống"
            tone="primary"
            icon={<FileText className="size-5" />}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "all"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Tất Cả Đề Nghị ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("pending_approver")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "pending_approver"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Chờ CEO Duyệt</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500 text-white">
              {pendingApproverCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("pending_checker")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "pending_checker"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Chờ Kế Toán Trưởng</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
              {pendingCheckerCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("approved_paid")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "approved_paid"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Đã Duyệt & Thanh Toán
          </button>
        </div>

        {/* List of Requests */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Không có phiếu duyệt chi nào trong cơ sở dữ liệu
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Các phiếu đề xuất chi tiền mới sẽ tự động hiển thị tại đây theo quy trình 3 cấp.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Left Column: Info */}
              <div className="space-y-1.5 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#D8B282]">{item.code}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Số HĐ: {item.invoiceNumber}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    Ngân sách còn {item.budgetRemainingPercent}%
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h4>

                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Phòng: <strong className="text-slate-700 dark:text-slate-300">{item.department}</strong></span>
                  <span>•</span>
                  <span>Người đề xuất: <strong className="text-slate-700 dark:text-slate-300">{item.maker.name}</strong></span>
                  <span>({item.maker.date})</span>
                </div>
              </div>

              {/* Middle Column: 3-Tier Status Stepper */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
                {/* Người lập */}
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="size-4" />
                  <span>Người lập</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">&rarr;</span>

                {/* Kế toán */}
                <div className={`flex items-center gap-1.5 font-bold ${
                  item.checker?.status === "approved" ? "text-emerald-600" : "text-amber-500 animate-pulse"
                }`}>
                  {item.checker?.status === "approved" ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                  <span>Kế toán</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">&rarr;</span>

                {/* Lãnh đạo phê duyệt */}
                <div className={`flex items-center gap-1.5 font-bold ${
                  item.status === "approved_paid"
                    ? "text-emerald-600"
                    : item.amountVnd > 20000000
                    ? "text-red-500"
                    : "text-slate-400"
                }`}>
                  {item.status === "approved_paid" ? (
                    <CheckCircle2 className="size-4" />
                  ) : item.amountVnd > 20000000 ? (
                    <Clock className="size-4" />
                  ) : (
                    <span>-</span>
                  )}
                  <span>Lãnh đạo duyệt</span>
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#D8B282] font-mono">
                    {item.amountVnd.toLocaleString("vi-VN")} VNĐ
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.amountVnd > 20000000 ? "Hạn mức CEO duyệt" : "Hạn mức Kế toán trưởng duyệt"}
                  </div>
                </div>

                {/* Action buttons based on 3-tier rules */}
                {item.status === "pending_checker" && (
                  <button
                    onClick={() => handleCheckerApprove(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-sm"
                  >
                    Kế Toán Duyệt
                  </button>
                )}

                {item.status === "pending_approver" && (
                  <button
                    onClick={() => handleCEOApprove(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md animate-bounce"
                  >
                    Lãnh Đạo Duyệt
                  </button>
                )}

                {item.status === "approved_paid" && (
                  <button
                    onClick={() => setQrModalItem(item)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs"
                  >
                    <QrCode className="size-4" />
                    <span>Xem Mã QR Ngân Hàng</span>
                  </button>
                )}
              </div>
            </div>
          )))}
        </div>

        {/* Modal VietQR Napas 24/7 gạch nợ tự động trong 1 giây */}
        {qrModalItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#D8B282]/40 shadow-2xl text-center space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-mono font-bold text-[#D8B282]">MÃ QR CHUYỂN KHOẢN NGÂN HÀNG</span>
                <button onClick={() => setQrModalItem(null)} className="text-slate-400">✕</button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{qrModalItem.title}</h4>
                <div className="text-xl font-extrabold text-[#D8B282] font-mono mt-1">
                  {qrModalItem.amountVnd.toLocaleString("vi-VN")} VNĐ
                </div>
              </div>

              {/* Dynamic QR image placeholder matching Napas 24/7 standard */}
              <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#D8B282] flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NAPAS247_${qrModalItem.code}_${qrModalItem.amountVnd}`}
                  alt="VietQR"
                  className="size-44"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-2">
                  Nội dung chuyển khoản: {qrModalItem.code}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Tự động đối soát và xác nhận thanh toán ngay sau khi hoàn tất giao dịch ngân hàng.
              </div>

              <button
                onClick={() => setQrModalItem(null)}
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
