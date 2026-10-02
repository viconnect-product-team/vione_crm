import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Building2,
  Briefcase,
  Flame,
  Calendar,
  Activity,
  UserCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { toast } from "sonner";

export const Route = createFileRoute("/workload")({
  ssr: false,
  component: WorkloadPage,
});

export interface EmployeeWorkload {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  email: string;
  hoursWorkedWeek: number; // Max 45h/tuần BR-WRK-14
  activeTasksCount: number; // WIP
  completedTasksCount: number;
  overdueTasksCount: number;
  kpiScore: number; // 0 - 100
  status: "active" | "overloaded" | "available" | "on_leave";
  currentTasks: { id: string; title: string; deadline: string; priority: string }[];
  weeklyHours: { day: string; hours: number }[];
}

const EMPLOYEES: EmployeeWorkload[] = [
  {
    id: "emp-01",
    name: "Nguyễn Minh Đăng",
    role: "CEO & Kiến Trúc Sư Giải Pháp",
    department: "Ban Giám Đốc",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
    email: "dang.nguyen@alphagroup.vn",
    hoursWorkedWeek: 48.5, // > 45h -> OVERLOADED BR-WRK-14
    activeTasksCount: 4,
    completedTasksCount: 16,
    overdueTasksCount: 0,
    kpiScore: 98,
    status: "overloaded",
    currentTasks: [
      { id: "t1", title: "Phê duyệt kiến trúc ViOne 5.0", deadline: "18:00 Hôm nay", priority: "Khẩn cấp" },
      { id: "t2", title: "Duyệt chi ngân sách công nghệ", deadline: "12:00 Ngày mai", priority: "Cao" },
    ],
    weeklyHours: [
      { day: "T2", hours: 9.5 },
      { day: "T3", hours: 10.0 },
      { day: "T4", hours: 10.5 },
      { day: "T5", hours: 10.0 },
      { day: "T6", hours: 8.5 },
    ],
  },
  {
    id: "emp-02",
    name: "Trần Thu Hà",
    role: "Giám Đốc Tài Chính (CFO)",
    department: "Tài Chính - Kế Toán",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop",
    email: "ha.tran@alphagroup.vn",
    hoursWorkedWeek: 42.0,
    activeTasksCount: 3,
    completedTasksCount: 14,
    overdueTasksCount: 1, // 1 overdue
    kpiScore: 94,
    status: "active",
    currentTasks: [
      { id: "t3", title: "Đối soát gạch nợ VietQR 24/7", deadline: "Quá hạn 1 ngày", priority: "Khẩn cấp" },
      { id: "t4", title: "Báo cáo dòng tiền 90 ngày tới", deadline: "17:00 T6", priority: "Bình thường" },
    ],
    weeklyHours: [
      { day: "T2", hours: 8.5 },
      { day: "T3", hours: 8.5 },
      { day: "T4", hours: 9.0 },
      { day: "T5", hours: 8.0 },
      { day: "T6", hours: 8.0 },
    ],
  },
  {
    id: "emp-03",
    name: "Vũ Mai Anh",
    role: "Trưởng Phòng Nhân Sự (HR Manager)",
    department: "Hành Chính Nhân Sự",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop",
    email: "maianh.vu@alphagroup.vn",
    hoursWorkedWeek: 38.0,
    activeTasksCount: 2,
    completedTasksCount: 18,
    overdueTasksCount: 0,
    kpiScore: 96,
    status: "active",
    currentTasks: [
      { id: "t5", title: "Thẩm định chấm công GPS 50m chi nhánh", deadline: "17:00 Ngày mai", priority: "Cao" },
      { id: "t6", title: "Phát hành phiếu lương E-Payslip", deadline: "Ngày 05/10", priority: "Cao" },
    ],
    weeklyHours: [
      { day: "T2", hours: 8.0 },
      { day: "T3", hours: 7.5 },
      { day: "T4", hours: 8.0 },
      { day: "T5", hours: 7.5 },
      { day: "T6", hours: 7.0 },
    ],
  },
  {
    id: "emp-04",
    name: "Đặng Nam",
    role: "Chuyên Viên Vận Hành Cấp Cao",
    department: "Vận Hành Hệ Thống",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    email: "nam.dang@alphagroup.vn",
    hoursWorkedWeek: 46.0, // Overloaded > 45h BR-WRK-14
    activeTasksCount: 5, // At WIP limit BR-WRK-04
    completedTasksCount: 12,
    overdueTasksCount: 0,
    kpiScore: 91,
    status: "overloaded",
    currentTasks: [
      { id: "t7", title: "Nạp token thẻ Titanium NFC mạ vàng", deadline: "15:00 Hôm nay", priority: "Cao" },
      { id: "t8", title: "Bảo trì máy chủ Cloud Multi-Tenancy", deadline: "23:00 Hôm nay", priority: "Bình thường" },
    ],
    weeklyHours: [
      { day: "T2", hours: 9.0 },
      { day: "T3", hours: 9.5 },
      { day: "T4", hours: 10.0 },
      { day: "T5", hours: 9.0 },
      { day: "T6", hours: 8.5 },
    ],
  },
  {
    id: "emp-05",
    name: "Lê Quốc Dũng",
    role: "Giám Đốc Kinh Doanh (Sales Director)",
    department: "Phòng Kinh Doanh",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
    email: "dung.le@alphagroup.vn",
    hoursWorkedWeek: 36.5,
    activeTasksCount: 3,
    completedTasksCount: 22,
    overdueTasksCount: 0,
    kpiScore: 99,
    status: "active",
    currentTasks: [
      { id: "t9", title: "Chốt hợp đồng B2B khách hàng Tập Đoàn Beta", deadline: "16:00 T6", priority: "Khẩn cấp" },
      { id: "t10", title: "Phân bổ phễu Round-Robin cho 4 sales", deadline: "10:00 Sáng mai", priority: "Cao" },
    ],
    weeklyHours: [
      { day: "T2", hours: 7.5 },
      { day: "T3", hours: 7.5 },
      { day: "T4", hours: 7.5 },
      { day: "T5", hours: 7.0 },
      { day: "T6", hours: 7.0 },
    ],
  },
];

function WorkloadPage() {
  const [employees, setEmployees] = useState<EmployeeWorkload[]>(EMPLOYEES);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeWorkload | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = selectedDept === "all" || e.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, search, selectedDept]);

  const overloadedCount = employees.filter((e) => e.hoursWorkedWeek > 45).length;
  const totalHours = employees.reduce((acc, cur) => acc + cur.hoursWorkedWeek, 0);
  const avgKpi = Math.round(employees.reduce((acc, cur) => acc + cur.kpiScore, 0) / employees.length);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Theo Dõi Quá Trình Nhân Viên Làm Việc & Workload"
          subtitle="Giám sát tải làm việc (Workload Heatmap), nhật ký Timesheet và cảnh báo quá tải > 45h/tuần theo quy tắc nghiệp vụ BR-WRK-14."
          actions={
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
                TUẦN 40 / 2026
              </span>
            </div>
          }
        />

        {/* 4 Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng nhân sự theo dõi"
            value={`${employees.length} Thành viên`}
            hint="100% trong doanh nghiệp"
            tone="primary"
            icon={<Users className="size-5" />}
          />
          <StatCard
            label="Tổng giờ làm tuần này"
            value={`${totalHours} Giờ`}
            hint="Ghi nhận từ Timesheet"
            tone="info"
            icon={<Clock className="size-5" />}
          />
          <StatCard
            label="Cảnh báo quá tải (>45h)"
            value={`${overloadedCount} Nhân sự`}
            hint="Quy tắc BR-WRK-14 gắn cờ đỏ"
            tone="danger"
            icon={<AlertTriangle className="size-5" />}
          />
          <StatCard
            label="Điểm hiệu suất KPI trung bình"
            value={`${avgKpi}/100`}
            hint="Năng suất tổ chức xuất sắc"
            tone="success"
            icon={<TrendingUp className="size-5" />}
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân sự, chức danh, phòng ban..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Lọc phòng ban:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Ban Giám Đốc">Ban Giám Đốc</option>
              <option value="Tài Chính - Kế Toán">Tài Chính - Kế Toán</option>
              <option value="Hành Chính Nhân Sự">Hành Chính Nhân Sự</option>
              <option value="Vận Hành Hệ Thống">Vận Hành Hệ Thống</option>
              <option value="Phòng Kinh Doanh">Phòng Kinh Doanh</option>
            </select>
          </div>
        </div>

        {/* Employee Cards List with Workload Heatmap */}
        <div className="space-y-4">
          {filtered.map((emp) => {
            const isOverloaded = emp.hoursWorkedWeek > 45;
            return (
              <div
                key={emp.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all hover:shadow-lg ${
                  isOverloaded
                    ? "border-red-500/80 bg-red-50/5 dark:bg-red-950/10 shadow-sm shadow-red-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-[#D8B282]"
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="flex items-center gap-4 min-w-[280px]">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt=""
                        className="size-14 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                      {isOverloaded && (
                        <div className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md animate-pulse">
                          <Flame className="size-3" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{emp.name}</h4>
                        {isOverloaded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-600 border border-red-200 dark:border-red-800">
                            QUÁ TẢI (&gt;45H/TUẦN)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                            TIÊU CHUẨN
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        {emp.role} • <strong className="text-slate-700 dark:text-slate-300 font-semibold">{emp.department}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.email}</div>
                    </div>
                  </div>

                  {/* Middle: Workload Heatmap Bars */}
                  <div className="flex-1 w-full lg:max-w-md">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Tải công việc tuần này:</span>
                      <span className={`font-mono font-bold ${isOverloaded ? "text-red-500" : "text-[#D8B282]"}`}>
                        {emp.hoursWorkedWeek}h / 40h định mức
                      </span>
                    </div>

                    {/* Week day heatmap pills */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {emp.weeklyHours.map((wh) => (
                        <div key={wh.day} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                              wh.hours >= 10
                                ? "bg-red-500 text-white"
                                : wh.hours >= 8
                                ? "bg-[#D8B282] text-[#3C240E]"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {wh.hours}h
                          </div>
                          <span className="text-[10px] text-slate-400">{wh.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                      <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {emp.activeTasksCount}
                      </div>
                      <div className="text-[10px] text-slate-400">Đang Làm (WIP)</div>
                    </div>

                    <div className="text-center">
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {emp.completedTasksCount}
                      </div>
                      <div className="text-[10px] text-slate-400">Đã Xong</div>
                    </div>

                    <div className="text-center">
                      <div className="text-base font-extrabold text-[#D8B282] font-mono">
                        {emp.kpiScore}%
                      </div>
                      <div className="text-[10px] text-slate-400">KPI Tháng</div>
                    </div>

                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all text-slate-900 dark:text-white"
                    >
                      Chi Tiết
                    </button>
                  </div>
                </div>

                {/* Sub-bar: Tasks preview */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">Việc trọng tâm đang làm:</span>
                  {emp.currentTasks.map((ct) => (
                    <div
                      key={ct.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60"
                    >
                      <span className="size-1.5 rounded-full bg-[#D8B282]" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{ct.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">({ct.deadline})</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal chi tiết nhân viên */}
        {selectedEmp && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={selectedEmp.avatar} alt="" className="size-12 rounded-2xl object-cover" />
                  <div>
                    <h3 className="text-base font-bold">{selectedEmp.name}</h3>
                    <div className="text-xs text-slate-400">{selectedEmp.role} • {selectedEmp.department}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="text-slate-400">✕</button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Giờ làm việc tuần:</span>
                    <strong className="text-sm font-mono text-[#D8B282]">{selectedEmp.hoursWorkedWeek} giờ</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Đánh giá quá tải (BR-WRK-14):</span>
                    <strong className={selectedEmp.hoursWorkedWeek > 45 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                      {selectedEmp.hoursWorkedWeek > 45 ? "BỊ GẮN CỜ QUÁ TẢI" : "TẢI CÔNG VIỆC TỐI ƯU"}
                    </strong>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Các công việc đang gánh vác ({selectedEmp.currentTasks.length}):
                  </h4>
                  <div className="space-y-2">
                    {selectedEmp.currentTasks.map((t) => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="font-medium">{t.title}</span>
                        <span className="font-mono text-amber-500">{t.deadline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
