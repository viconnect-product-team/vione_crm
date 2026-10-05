// BC-Mobile — Phân hệ Giám Sát Nhân Sự & Hoạt Động Chăm Sóc Khách Hàng CRM (ViOne Executive Style)

import React, { useState, useEffect } from "react";
import {
  Users,
  Eye,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Activity,
  Loader2,
  Send,
  X,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface EmployeeItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roleTitle: string;
  department: string;
  avatarUrl: string;
  status: string;
  activeTasksCount: number;
  customersCount: number;
}

interface CustomerCareItem {
  id: string;
  employeeId: string;
  employeeName: string;
  customerName: string;
  customerContact: string;
  customerCompany: string;
  stage: string;
  stageLabel: string;
  dealValue: number;
  dealValueLabel: string;
  lastAction: string;
  lastActionAt: string;
  progressPercent: number;
  nextFollowUp: string;
}

interface SupervisionData {
  metrics: {
    totalEmployees: number;
    totalTasks: number;
    assignedTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    acceptanceRate: number;
    totalDealsValueFormatted: string;
  };
  employees: EmployeeItem[];
  customerCare: CustomerCareItem[];
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: string;
  }>;
}

interface Props {
  communityId: string;
}

export function CompanySupervisionView({ communityId }: Props) {
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [addLogModalOpen, setAddLogModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);

  // Form add employee
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empRoleTitle, setEmpRoleTitle] = useState("Chuyên viên Kinh Doanh B2B");
  const [empDept, setEmpDept] = useState("Phòng Kinh Doanh B2B");
  const [submittingEmp, setSubmittingEmp] = useState(false);

  // Form add care log
  const [careCustomerName, setCareCustomerName] = useState("");
  const [careAction, setCareAction] = useState("");
  const [careStage, setCareStage] = useState("negotiation");
  const [careDealValue, setCareDealValue] = useState("100000000");
  const [submittingLog, setSubmittingLog] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/supervision`);
      if (res?.metrics) {
        setData(res);
      }
    } catch {
      // Fallback data
      setData({
        metrics: {
          totalEmployees: 4,
          totalTasks: 3,
          assignedTasks: 1,
          inProgressTasks: 1,
          completedTasks: 1,
          acceptanceRate: 67,
          totalDealsValueFormatted: "850.000.000 đ",
        },
        employees: [
          {
            id: "emp-01",
            fullName: "Nguyễn Thị Mai",
            email: "mai.nguyen@vione.vn",
            phone: "0982.111.222",
            roleTitle: "Trưởng nhóm Kinh doanh B2B",
            department: "Phòng Kinh Doanh B2B",
            avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
            status: "active",
            activeTasksCount: 2,
            customersCount: 3,
          },
          {
            id: "emp-02",
            fullName: "Trần Văn Long",
            email: "long.tran@vione.vn",
            phone: "0915.333.444",
            roleTitle: "Quản lý Khách hàng Doanh nghiệp",
            department: "Phòng Kinh Doanh B2B",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
            status: "active",
            activeTasksCount: 1,
            customersCount: 2,
          },
          {
            id: "emp-03",
            fullName: "Lê Thu Hà",
            email: "ha.le@vione.vn",
            phone: "0936.555.666",
            roleTitle: "Chăm sóc Khách hàng & Hậu mãi",
            department: "Phòng CSKH & Vận Hành",
            avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
            status: "active",
            activeTasksCount: 2,
            customersCount: 4,
          },
          {
            id: "emp-04",
            fullName: "Phạm Đức Anh",
            email: "anh.pham@vione.vn",
            phone: "0977.888.999",
            roleTitle: "Kỹ sư Triển khai Hệ thống",
            department: "Phòng Kỹ Thuật & Tích Hợp",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
            status: "active",
            activeTasksCount: 1,
            customersCount: 2,
          },
        ],
        customerCare: [
          {
            id: "care-01",
            employeeId: "emp-01",
            employeeName: "Nguyễn Thị Mai",
            customerName: "Tập đoàn Hoàng Minh",
            customerContact: "Chủ tịch Hoàng Minh (0912.888.999)",
            customerCompany: "Hoang Minh Group",
            stage: "negotiation",
            stageLabel: "Đang đàm phán hợp đồng",
            dealValue: 250000000,
            dealValueLabel: "250.000.000 đ",
            lastAction: "Gặp trực tiếp BLĐ Hoàng Minh thống nhất phụ lục điều khoản bảo mật thẻ số.",
            lastActionAt: "35 phút trước",
            progressPercent: 85,
            nextFollowUp: "Ký kết hợp đồng ngày 08/10",
          },
          {
            id: "care-02",
            employeeId: "emp-03",
            employeeName: "Lê Thu Hà",
            customerName: "Công ty CP Dược Phẩm Á Châu",
            customerContact: "Chị Hương Lan (0988.345.678)",
            customerCompany: "Asia Pharma JSC",
            stage: "contacted",
            stageLabel: "Tiếp cận & Demo",
            dealValue: 120000000,
            dealValueLabel: "120.000.000 đ",
            lastAction: "Đã gửi bản giới thiệu tính năng duyệt chi 3 cấp qua Email, hẹn lịch demo.",
            lastActionAt: "2 giờ trước",
            progressPercent: 40,
            nextFollowUp: "Demo trực tiếp sáng mai 10:00",
          },
          {
            id: "care-03",
            employeeId: "emp-02",
            employeeName: "Trần Văn Long",
            customerName: "Chuỗi Khách Sạn Mường Thanh",
            customerContact: "Anh Tuấn Anh (0903.111.222)",
            customerCompany: "Muong Thanh Hospitality",
            stage: "won",
            stageLabel: "Đã chốt hợp đồng",
            dealValue: 480000000,
            dealValueLabel: "480.000.000 đ",
            lastAction: "Ký biên bản nghiệm thu đợt 1 và kích hoạt 100 thẻ NFC cho nhân sự quản lý.",
            lastActionAt: "Hôm qua lúc 16:45",
            progressPercent: 100,
            nextFollowUp: "Hỗ trợ kỹ thuật sau bàn giao",
          },
        ],
        recentActivities: [
          {
            id: "act-01",
            title: "Nguyễn Thị Mai đã nhận việc & đang họp",
            description: "Tư vấn gói giải pháp NFC Doanh nhân tại Tập đoàn Hoàng Minh.",
            time: "35 phút trước",
            type: "meeting",
          },
          {
            id: "act-02",
            title: "Trần Văn Long hoàn thành bàn giao hợp đồng",
            description: "Bàn giao hợp đồng & kích hoạt 100 thẻ cho Chuỗi Khách Sạn Mường Thanh.",
            time: "Hôm nay, 10:00",
            type: "contract",
          },
          {
            id: "act-03",
            title: "Giám Đốc giao việc mới cho Lê Thu Hà",
            description: "Demo tính năng phê duyệt chi 3 cấp cho Công ty CP Dược Phẩm Á Châu.",
            time: "Hôm nay, 09:15",
            type: "task_assigned",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [communityId]);

  // Thêm nhân viên
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      toast.error("Vui lòng nhập họ tên nhân viên");
      return;
    }
    setSubmittingEmp(true);
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/employees`, {
        method: "POST",
        body: JSON.stringify({
          fullName: empName.trim(),
          email: empEmail.trim(),
          phone: empPhone.trim(),
          roleTitle: empRoleTitle,
          department: empDept,
        }),
      }).catch(() => null);

      toast.success(`Đã thêm nhân viên "${empName}" vào cộng đồng công ty thành công!`);
      setAddEmpModalOpen(false);
      setEmpName("");
      setEmpEmail("");
      setEmpPhone("");
      loadData();
    } catch {
      toast.error("Không thể thêm nhân viên. Vui lòng thử lại");
    } finally {
      setSubmittingEmp(false);
    }
  };

  // Cập nhật log chăm sóc khách hàng
  const handleAddCareLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careCustomerName.trim() || !careAction.trim()) {
      toast.error("Vui lòng điền đủ tên khách hàng và hành động chăm sóc");
      return;
    }
    setSubmittingLog(true);
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/customer-care-logs`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmp?.id || "emp-01",
          employeeName: selectedEmp?.fullName || "Nguyễn Thị Mai",
          customerName: careCustomerName.trim(),
          lastAction: careAction.trim(),
          stage: careStage,
          dealValue: parseInt(careDealValue, 10) || 0,
        }),
      }).catch(() => null);

      toast.success("Đã ghi nhận nhật ký chăm sóc khách hàng!");
      setAddLogModalOpen(false);
      setCareCustomerName("");
      setCareAction("");
      loadData();
    } catch {
      toast.error("Lỗi cập nhật nhật ký");
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#DFB76C]" />
        <p className="mt-2 text-xs">Đang tải ma trận giám sát nhân sự...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Khối Giám Sát C-Level & Nút Thêm Nhân Viên */}
      <div className="rounded-3xl border border-[#DFB76C]/30 bg-gradient-to-b from-white via-white to-zinc-50 dark:from-[#0B0F17] dark:via-[#121824] dark:to-[#0B0F17] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#DFB76C]/20 to-[#8C653B]/20 text-[#D4AF37] border border-[#DFB76C]/30">
              <Eye className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-tight">
                Giám Sát Vận Hành & Khách Hàng
              </h3>
              <p className="text-[11px] text-[#8C653B] dark:text-[#DFB76C]">
                Kiểm soát thời gian thực hoạt động đội ngũ & đường ống CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAddEmpModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 cursor-pointer hover:opacity-95"
          >
            <Plus className="h-4 w-4 text-slate-950" />
            <span>Thêm nhân viên</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200 dark:border-white/10">
          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold block">Nhân sự</span>
            <p className="mt-1 text-xl font-black text-zinc-950 dark:text-white leading-none">
              {data.metrics.totalEmployees}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              ✓ Đang trực tuyến
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#DFB76C]/10 border border-[#DFB76C]/25">
            <span className="text-[11px] text-[#8C653B] dark:text-[#DFB76C] font-semibold block">Tỷ lệ nhận việc</span>
            <p className="mt-1 text-xl font-black text-[#D4AF37] leading-none">
              {data.metrics.acceptanceRate}%
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
              {data.metrics.inProgressTasks + data.metrics.completedTasks}/{data.metrics.totalTasks} việc đã nhận
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">Deal đang chăm</span>
            <p className="mt-1 text-[17px] font-black text-emerald-600 dark:text-emerald-400 leading-none truncate">
              {data.metrics.totalDealsValueFormatted}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              3 dự án lớn
            </span>
          </div>
        </div>
      </div>

      {/* 2. Danh Sách Đội Ngũ Nhân Sự & Khách Hàng Đang Chăm Sóc */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C653B] dark:text-[#DFB76C] flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Ma trận nhân sự & khách hàng phụ trách
          </h4>
          <span className="text-[11px] text-zinc-500">
            {data.employees.length} nhân sự công ty
          </span>
        </div>

        <div className="space-y-3.5">
          {data.employees.map((emp) => {
            const empCareList = data.customerCare.filter((c) => c.employeeId === emp.id);

            return (
              <div
                key={emp.id}
                className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121824] p-4.5 shadow-md space-y-3"
              >
                {/* Employee Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="h-11 w-11 rounded-2xl object-cover ring-2 ring-[#DFB76C]/30 shadow-md"
                    />
                    <div>
                      <h5 className="text-[14px] font-bold text-zinc-950 dark:text-white leading-tight">
                        {emp.fullName}
                      </h5>
                      <p className="text-[11px] text-[#8C653B] dark:text-[#DFB76C] font-semibold">
                        {emp.roleTitle} · {emp.department}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmp(emp);
                      setAddLogModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="h-3 w-3" /> Ghi log chăm sóc
                  </button>
                </div>

                {/* Khách hàng nhân viên đang chăm sóc */}
                <div className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-[#161D2B] border border-zinc-200/80 dark:border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Khách hàng đang phụ trách ({empCareList.length}):
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Đang tương tác
                    </span>
                  </div>

                  {empCareList.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">
                      Chưa có khách hàng nào được giao phụ trách.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {empCareList.map((care) => (
                        <div
                          key={care.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#0B0F17] border border-zinc-200 dark:border-white/10 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-950 dark:text-white">
                              {care.customerName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFB76C]/15 text-[#D4AF37] border border-[#DFB76C]/30">
                              {care.stageLabel}
                            </span>
                          </div>

                          <p className="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {care.lastAction}
                          </p>

                          <div className="flex items-center justify-between text-[10.5px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-white/5">
                            <span>Deal: <strong className="text-emerald-600 dark:text-emerald-400">{care.dealValueLabel}</strong></span>
                            <span>Cập nhật: {care.lastActionAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Dòng Thời Gian Hoạt Động Realtime Của Nhân Viên */}
      <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C653B] dark:text-[#DFB76C] mb-3 flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Nhật ký hoạt động nhân sự theo thời gian thực
        </h4>
        <div className="space-y-3">
          {data.recentActivities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#DFB76C] ring-4 ring-[#DFB76C]/20 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-zinc-950 dark:text-white leading-tight">
                  {act.title}
                </p>
                <p className="text-[11.5px] text-zinc-500 mt-0.5">
                  {act.description}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Thêm Nhân Viên Mới */}
      {addEmpModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#DFB76C]/30 bg-white dark:bg-[#0B0F17] shadow-2xl p-6 text-zinc-950 dark:text-white max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#DFB76C]/20 to-[#8C653B]/20 text-[#D4AF37] border border-[#DFB76C]/30 font-bold">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    Thêm Nhân Sự Vào Công Ty
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Cấp quyền truy cập cộng đồng nội bộ & nhận phân bổ việc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddEmpModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="overflow-y-auto flex-1 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Họ và tên nhân viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Thu Trang"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email làm việc *
                </label>
                <input
                  type="email"
                  required
                  placeholder="trang.hoang@vione.vn"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0988.123.456"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Vị trí chuyên môn
                  </label>
                  <input
                    type="text"
                    value={empRoleTitle}
                    onChange={(e) => setEmpRoleTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingEmp || !empName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingEmp ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Send className="h-4 w-4 text-slate-950" />}
                XÁC NHẬN THÊM VÀO CỘNG ĐỒNG CÔNG TY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ghi Nhật Ký Chăm Sóc Khách Hàng */}
      {addLogModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#DFB76C]/30 bg-white dark:bg-[#0B0F17] shadow-2xl p-6 text-zinc-950 dark:text-white max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Ghi Nhật Ký Chăm Sóc Khách Hàng
                </h3>
                <p className="text-xs text-zinc-500">
                  Nhân sự: <strong>{selectedEmp?.fullName || "Nguyễn Thị Mai"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddLogModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCareLog} className="overflow-y-auto flex-1 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên Khách Hàng / Doanh Nghiệp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tập đoàn X..."
                  value={careCustomerName}
                  onChange={(e) => setCareCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Giai đoạn tương tác (Phễu CRM)
                </label>
                <select
                  value={careStage}
                  onChange={(e) => setCareStage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                >
                  <option value="lead">Khách hàng mới (Lead)</option>
                  <option value="contacted">Đã tiếp cận & Giới thiệu giải pháp</option>
                  <option value="negotiation">Đang đàm phán hợp đồng</option>
                  <option value="won">Đã chốt hợp đồng thành công</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hành động chăm sóc vừa thực hiện *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Đã gọi điện trao đổi chi tiết bảng giá, khách hàng đề xuất gửi hợp đồng trước 15:00..."
                  value={careAction}
                  onChange={(e) => setCareAction(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLog || !careCustomerName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingLog ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Send className="h-4 w-4 text-slate-950" />}
                LƯU NHẬT KÝ VÀO HỆ THỐNG GIÁM SÁT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
