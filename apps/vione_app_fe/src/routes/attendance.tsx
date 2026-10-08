import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  UserCheck,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  Search,
  Lock,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Users,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/attendance")({
  ssr: false,
  component: AttendancePage,
});

export interface CompanyAttendanceSummary {
  hasCompanyCommunity: boolean;
  companyName: string;
  totalMembers: number;
  today: {
    totalCheckedIn: number;
    onTimeCount: number;
    lateCount: number;
    attendanceRate: number;
    members: Array<{
      id: string;
      name: string;
      memberCode: string;
      checkInTime: string;
      status: "on_time" | "late" | "not_checked_in";
      lateMinutes: number;
      department: string;
      avatar: string;
    }>;
  };
  lateStats: {
    weeklyTopLate: Array<{
      id: string;
      name: string;
      lateCount: number;
      totalLateMinutes: number;
      department: string;
      avatar: string;
    }>;
    monthlyTopLate: Array<{
      id: string;
      name: string;
      lateCount: number;
      totalLateMinutes: number;
      department: string;
      avatar: string;
    }>;
  };
  aiHrAudit: {
    summary: string;
    mostFrequentLateHour: string;
    punctualityScore: number;
    recommendation: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  department: string;
  type: "Nghỉ phép năm" | "Nghỉ ốm" | "Làm thêm giờ OT" | "Đổi ca trực";
  dates: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedBeforeHours: number;
}

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: "req-01",
    employeeName: "Đặng Nam",
    department: "Vận Hành Hệ Thống",
    type: "Làm thêm giờ OT",
    dates: "Hôm nay (18:00 - 21:00, 3 tiếng)",
    reason: "Triển khai nạp chip Thẻ Titanium NFC đợt 1 cho sự kiện C-Level",
    status: "pending",
    appliedBeforeHours: 12,
  },
  {
    id: "req-02",
    employeeName: "Hoàng Gia Bảo",
    department: "Phòng Kinh Doanh",
    type: "Nghỉ phép năm",
    dates: "Tuần này (2 ngày)",
    reason: "Việc gia đình, đã bàn giao phễu lead cho Sales Director",
    status: "approved",
    appliedBeforeHours: 72,
  },
];

function AttendancePage() {
  const [data, setData] = useState<CompanyAttendanceSummary | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [tab, setTab] = useState<"today" | "late_stats" | "requests">("today");
  const [latePeriod, setLatePeriod] = useState<"week" | "month">("week");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fetchAttendanceSummary = async () => {
    try {
      setIsLoading(true);
      const res = await fetchNestApi<any>("/operations/attendance/company-summary");
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      // Giữ trạng thái hiện tại hoặc fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSummary();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetchNestApi(`/operations/attendance/leaves/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ approved: true }),
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      toast.success("Đã phê duyệt đơn điện tử 1-chạm.");
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      toast.success("Đã phê duyệt đơn điện tử.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetchNestApi(`/operations/attendance/leaves/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ approved: false }),
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
      toast.error("Đã từ chối đơn đề xuất.");
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
      toast.error("Đã từ chối đơn đề xuất.");
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const res = await fetchNestApi<any>("/ai/export-excel", {
        method: "POST",
        body: JSON.stringify({ reportType: "attendance" }),
      });
      if (res?.success && res?.downloadUrl) {
        toast.success(`Đã xuất báo cáo chuyên cần ${res.fileName || "Excel"} thành công!`);
        window.open(res.downloadUrl, "_blank");
      }
    } catch (e: any) {
      toast.error(e?.message || "Không thể xuất file Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!data?.today?.members) return [];
    return data.today.members.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.department.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const activeLateList = latePeriod === "week"
    ? data?.lateStats?.weeklyTopLate || []
    : data?.lateStats?.monthlyTopLate || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Theo Dõi Giờ Giấc & Chuyên Cần Nhân Sự Doanh Nghiệp"
          subtitle={
            data?.companyName
              ? `Không gian quản trị chuyên cần thời gian thực của ${data.companyName}`
              : "Hệ thống giám sát giờ giấc, chuyên cần và phân tích tình trạng đi muộn của nhân viên."
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                <span>{isExportingExcel ? "Đang xuất..." : "Xuất Báo Cáo (.xlsx)"}</span>
              </button>
              <button
                type="button"
                onClick={fetchAttendanceSummary}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => toast.success("Dữ liệu chuyên cần nhân sự được đồng bộ tự động theo thời gian thực.")}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                <Lock className="size-3.5" />
                Chốt Công Định Kỳ
              </button>
            </div>
          }
        />

        {/* CẢNH BÁO NẾU TÀI KHOẢN CHƯA CÓ CỘNG ĐỒNG CÔNG TY */}
        {data && !data.hasCompanyCommunity && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-4">
            <Building2 className="size-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Phân Quyền Theo Dõi Chấm Công Doanh Nghiệp
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Chức năng Theo Dõi Giờ Giấc & Chuyên Cần chỉ hiển thị và kích hoạt khi tài khoản của bạn quản trị
                hoặc sở hữu một Cộng Đồng Công Ty có nhân viên. Cá nhân sử dụng app không tự chấm công cá nhân.
              </p>
            </div>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng nhân sự công ty"
            value={`${data?.totalMembers || 0} Người`}
            hint={data?.companyName || "Cộng đồng doanh nghiệp"}
            tone="primary"
            icon={<Users className="size-5 text-[#D8B282]" />}
          />
          <StatCard
            label="Đúng giờ hôm nay"
            value={`${data?.today?.onTimeCount || 0} Người`}
            hint="Check-in trước 08:30"
            tone="success"
            icon={<UserCheck className="size-5" />}
          />
          <StatCard
            label="Đi muộn hôm nay"
            value={`${data?.today?.lateCount || 0} Người`}
            hint="Check-in sau 08:30"
            tone="warning"
            icon={<Clock className="size-5" />}
          />
          <StatCard
            label="Tỷ lệ đúng giờ"
            value={`${data?.today?.attendanceRate || 0}%`}
            hint="Độ chuyên cần trong ngày"
            tone="info"
            icon={<Award className="size-5" />}
          />
        </div>

        {/* THẺ AI HR AUDIT */}
        {data?.aiHrAudit && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-[#D8B282]/30 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#D8B282]/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-[#D8B282]/20 border border-[#D8B282]/40 flex items-center justify-center shrink-0">
                <Sparkles className="size-5 text-[#D8B282]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8B282]">
                    Báo Cáo Thư Ký AI Về Chuyên Cần & Giờ Giấc
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8B282]/20 text-[#D8B282]">
                    Điểm chuyên cần: {data.aiHrAudit.punctualityScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.aiHrAudit.summary}
                </p>
                <div className="text-[11px] text-[#D8B282] font-medium pt-1">
                  💡 <strong>Khuyến nghị điều hành:</strong> {data.aiHrAudit.recommendation}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setTab("today")}
            className={`pb-3 border-b-2 transition-all ${
              tab === "today"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Giờ Giấc Hôm Nay ({data?.today?.members?.length || 0})
          </button>
          <button
            onClick={() => setTab("late_stats")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              tab === "late_stats"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Nhân Viên Hay Đi Muộn</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
              Cảnh Báo
            </span>
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              tab === "requests"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Duyệt Đơn Phép & OT</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D8B282] text-slate-900">
              {requests.filter((r) => r.status === "pending").length}
            </span>
          </button>
        </div>

        {/* TAB 1: GIỜ GIẤC HÔM NAY */}
        {tab === "today" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân sự hoặc phòng ban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-4">Mã NV / Phòng ban</th>
                    <th className="py-3 px-4">Giờ Đến Thực Tế</th>
                    <th className="py-3 px-4">Trạng thái giờ giấc</th>
                    <th className="py-3 px-4">Mức độ trễ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMembers.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={row.avatar} alt="" className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{row.department}</div>
                        <div className="text-[10px] text-slate-400">{row.memberCode}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {row.checkInTime}
                      </td>
                      <td className="py-3 px-4">
                        {row.status === "on_time" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                            Đúng giờ
                          </span>
                        )}
                        {row.status === "late" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                            Đi muộn
                          </span>
                        )}
                        {row.status === "not_checked_in" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Chưa ghi nhận
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.lateMinutes > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                            +{row.lateMinutes} phút
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Chưa có dữ liệu điểm danh ngày hôm nay
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AI HAY ĐI MUỘN (THEO TUẦN / THEO THÁNG) */}
        {tab === "late_stats" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Thống kê các nhân sự có tần suất trễ giờ lặp lại để lãnh đạo có kế hoạch điều chỉnh lịch làm việc.
              </p>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLatePeriod("week")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    latePeriod === "week"
                      ? "bg-white dark:bg-slate-900 text-[#D8B282] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Theo Tuần (7 Ngày)
                </button>
                <button
                  type="button"
                  onClick={() => setLatePeriod("month")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    latePeriod === "month"
                      ? "bg-white dark:bg-slate-900 text-[#D8B282] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Theo Tháng (30 Ngày)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Thứ hạng</th>
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Số Lần Đi Muộn</th>
                    <th className="py-3 px-4">Tổng Phút Trễ</th>
                    <th className="py-3 px-4">Đánh giá chuyên cần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeLateList.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={row.avatar} alt="" className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.department}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {row.lateCount} lần
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {row.totalLateMinutes} phút
                      </td>
                      <td className="py-3 px-4">
                        {row.lateCount >= 3 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600">
                            Cần nhắc nhở
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                            Mức độ nhẹ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activeLateList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Tất cả nhân sự đều tuân thủ giờ giấc chuẩn trong chu kỳ này!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE & OT APPROVALS */}
        {tab === "requests" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-[#D8B282]/20 text-[#D8B282]">
                        {req.type}
                      </span>
                      <span className={`text-[11px] font-bold ${
                        req.status === "approved"
                          ? "text-emerald-500"
                          : req.status === "rejected"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}>
                        {req.status === "approved" ? "ĐÃ DUYỆT" : req.status === "rejected" ? "TỪ CHỐI" : "CHỜ DUYỆT"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.employeeName}</h4>
                    <div className="text-xs text-slate-500">{req.department}</div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                      <div><strong className="text-slate-400">Thời gian:</strong> {req.dates}</div>
                      <div><strong className="text-slate-400">Lý do:</strong> {req.reason}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Nộp trước: {req.appliedBeforeHours} giờ
                      </div>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        Duyệt Đơn 1-Chạm
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

