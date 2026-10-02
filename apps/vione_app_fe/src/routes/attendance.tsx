import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  UserCheck,
  MapPin,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  UserX,
  Search,
  Filter,
  ShieldCheck,
  ArrowRightLeft,
  Lock,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  ssr: false,
  component: AttendancePage,
});

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  department: string;
  avatar: string;
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  gpsDistanceMeters: number; // Max 50m BR-HRM-01
  faceMatchScore: number; // >= 92% BR-HRM-02
  livenessVerified: boolean;
  status: "on_time" | "late" | "early_leave" | "approved_leave" | "absent";
  lateMinutes?: number;
  shift: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  department: string;
  type: "Nghỉ phép năm" | "Nghỉ ốm" | "Làm thêm giờ OT" | "Đổi ca trực";
  dates: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedBeforeHours: number; // BR-HRM-04
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-01",
    employeeName: "Nguyễn Minh Đăng",
    department: "Ban Giám Đốc",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    checkInTime: "08:12:45",
    gpsDistanceMeters: 14, // < 50m
    faceMatchScore: 98.4, // >= 92%
    livenessVerified: true,
    status: "on_time",
    shift: "Hành chính (08:30 - 17:30)",
  },
  {
    id: "att-02",
    employeeName: "Trần Thu Hà",
    department: "Tài Chính - Kế Toán",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    checkInTime: "08:24:10",
    gpsDistanceMeters: 28,
    faceMatchScore: 96.2,
    livenessVerified: true,
    status: "on_time",
    shift: "Hành chính (08:30 - 17:30)",
  },
  {
    id: "att-03",
    employeeName: "Vũ Mai Anh",
    department: "Hành Chính Nhân Sự",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    checkInTime: "08:15:02",
    gpsDistanceMeters: 8,
    faceMatchScore: 99.1,
    livenessVerified: true,
    status: "on_time",
    shift: "Hành chính (08:30 - 17:30)",
  },
  {
    id: "att-04",
    employeeName: "Đặng Nam",
    department: "Vận Hành Hệ Thống",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    checkInTime: "08:52:15",
    gpsDistanceMeters: 35,
    faceMatchScore: 94.0,
    livenessVerified: true,
    status: "late", // > 15p BR-HRM-03
    lateMinutes: 22,
    shift: "Hành chính (08:30 - 17:30)",
    notes: "Kẹt xe cầu vượt, đã thông báo quản lý",
  },
  {
    id: "att-05",
    employeeName: "Lê Quốc Dũng",
    department: "Phòng Kinh Doanh",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    checkInTime: "08:20:00",
    gpsDistanceMeters: 45,
    faceMatchScore: 95.5,
    livenessVerified: true,
    status: "on_time",
    shift: "Hành chính (08:30 - 17:30)",
  },
  {
    id: "att-06",
    employeeName: "Hoàng Gia Bảo",
    department: "Phòng Kinh Doanh",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop",
    checkInTime: "-",
    gpsDistanceMeters: 0,
    faceMatchScore: 0,
    livenessVerified: false,
    status: "approved_leave",
    shift: "Hành chính (08:30 - 17:30)",
    notes: "Nghỉ phép năm đã được HR phê duyệt",
  },
];

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: "req-01",
    employeeName: "Đặng Nam",
    department: "Vận Hành Hệ Thống",
    type: "Làm thêm giờ OT",
    dates: "02/10/2026 (18:00 - 21:00, 3 tiếng)",
    reason: "Triển khai nạp chip Thẻ Titanium NFC đợt 1 cho sự kiện C-Level",
    status: "pending",
    appliedBeforeHours: 12, // BR-HRM-06
  },
  {
    id: "req-02",
    employeeName: "Hoàng Gia Bảo",
    department: "Phòng Kinh Doanh",
    type: "Nghỉ phép năm",
    dates: "02/10/2026 - 03/10/2026 (2 ngày)",
    reason: "Việc gia đình, đã bàn giao phễu lead cho Sales Director",
    status: "approved",
    appliedBeforeHours: 72, // > 3 ngày BR-HRM-04
  },
  {
    id: "req-03",
    employeeName: "Nguyễn Văn Tuấn",
    department: "Kỹ Thuật",
    type: "Đổi ca trực",
    dates: "03/10/2026 (Đổi ca sáng sang ca chiều)",
    reason: "Hỗ trợ giám sát máy chủ ban đêm, hoàn tất đổi ca trước 6 tiếng (BR-HRM-15)",
    status: "pending",
    appliedBeforeHours: 24,
  },
];

function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [tab, setTab] = useState<"attendance" | "requests">("attendance");
  const [search, setSearch] = useState("");

  const onTimeCount = attendance.filter((a) => a.status === "on_time").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const leaveCount = attendance.filter((a) => a.status === "approved_leave").length;
  const attendanceRate = Math.round(((onTimeCount + lateCount) / attendance.length) * 100);

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    toast.success("Đã phê duyệt đơn điện tử 1-chạm thành công.");
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    toast.error("Đã từ chối đơn đề xuất.");
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        a.department.toLowerCase().includes(search.toLowerCase())
    );
  }, [attendance, search]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Bảng Giám Sát Chấm Công & Ca Làm Việc Thời Gian Thực"
          subtitle="Hệ thống chấm công di động GPS bán kính 50m (BR-HRM-01), nhận diện khuôn mặt AI 92% (BR-HRM-02) và quản trị đơn từ trực tuyến."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success("Bảng chấm công toàn công ty sẽ tự động khóa lúc 23:59 ngày mùng 2 hàng tháng (BR-HRM-14).")}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                <Lock className="size-3.5" />
                Khóa Công Ngày 02 (BR-HRM-14)
              </button>
              <button
                onClick={() => toast.success("Đã kết xuất báo cáo E-Payslip bảo mật gửi tới email nhân viên.")}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#D8B282] to-[#A67A47] text-[#3C240E] rounded-xl text-xs font-black shadow-md hover:brightness-105"
              >
                <Download className="size-3.5" />
                Xuất Bảng Lương & E-Payslip
              </button>
            </div>
          }
        />

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tỷ lệ có mặt hôm nay"
            value={`${attendanceRate}%`}
            hint={`${onTimeCount + lateCount}/${attendance.length} Nhân sự có mặt`}
            tone="success"
            icon={<UserCheck className="size-5" />}
          />
          <StatCard
            label="Đi muộn (> 15 phút)"
            value={`${lateCount} Người`}
            hint="Quy tắc BR-HRM-03"
            tone="warning"
            icon={<Clock className="size-5" />}
          />
          <StatCard
            label="Nghỉ phép có duyệt"
            value={`${leaveCount} Người`}
            hint="Đơn nộp trước 24h/3 ngày"
            tone="info"
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            label="Xác thực FaceID & GPS"
            value="100%"
            hint="Độ khớp AI >= 92%, < 50m"
            tone="primary"
            icon={<ShieldCheck className="size-5" />}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setTab("attendance")}
            className={`pb-3 border-b-2 transition-all ${
              tab === "attendance"
                ? "border-[#D8B282] text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Chấm Công Hôm Nay ({attendance.length})
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
              {requests.filter((r) => r.status === "pending").length}
            </span>
          </button>
        </div>

        {/* TAB 1: ATTENDANCE REAL-TIME */}
        {tab === "attendance" && (
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
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Giờ Check-in</th>
                    <th className="py-3 px-4">Định vị GPS (BR-HRM-01)</th>
                    <th className="py-3 px-4">AI FaceID (BR-HRM-02)</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={row.avatar} alt="" className="size-8 rounded-full object-cover" />
                          <span className="font-bold text-slate-900 dark:text-white">{row.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.department}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {row.checkInTime}
                      </td>
                      <td className="py-3 px-4">
                        {row.gpsDistanceMeters > 0 ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            <MapPin className="size-3.5" />
                            <span>{row.gpsDistanceMeters}m (&lt;50m Hợp lệ)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.faceMatchScore > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {row.faceMatchScore}%
                            </span>
                            <span className="text-[10px] text-slate-400">(Liveness OK)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.status === "on_time" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                            Đúng giờ
                          </span>
                        )}
                        {row.status === "late" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                            Đi muộn ({row.lateMinutes}p)
                          </span>
                        )}
                        {row.status === "approved_leave" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                            Nghỉ phép duyệt
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{row.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVE & OT APPROVALS */}
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
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
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
                        Nộp trước: {req.appliedBeforeHours} giờ (Đạt chuẩn BR-HRM-04)
                      </div>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Duyệt Đơn 1-Chạm
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all"
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
