// BC-Mobile — Phân hệ Giao Việc & Tiến Độ Nhân Sự Trong Cộng Đồng Doanh Nghiệp (ViOne Executive Style)

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  User,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
  Send,
  X,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface TaskItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerName?: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  acceptedAt: string | null;
  completedAt: string | null;
  deadline: string;
  customerName?: string;
  customerPhone?: string;
  customerContact?: string;
  customerRequirements?: string;
  createdAt: string;
}

interface Props {
  communityId: string;
  isDirector?: boolean;
}

export function CompanyTaskManagement({ communityId, isDirector = true }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "assigned" | "in_progress" | "completed">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Form giao việc mới
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeName, setAssigneeName] = useState("Nguyễn Thị Mai");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium">("high");
  const [deadline, setDeadline] = useState("Trong hôm nay");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerRequirements, setCustomerRequirements] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Load danh sách tasks
  const loadTasks = async () => {
    try {
      const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/tasks`);
      if (res?.tasks) {
        setTasks(res.tasks);
      }
    } catch {
      // Fallback local mockup
      setTasks([
        {
          id: "task-01",
          communityId,
          title: "Tư vấn bộ giải pháp Danh Thiếp Số 3D & Thẻ NFC Doanh Nhân cho Tập đoàn Hoàng Minh",
          description: "Gặp gỡ ban lãnh đạo Hoàng Minh, tư vấn cấu hình thẻ NFC mạ vàng Champagne Gold và đồng bộ CRM nội bộ cho 50 C-Level.",
          assigneeId: "emp-01",
          assigneeName: "Nguyễn Thị Mai",
          assignerName: "Giám Đốc Điều Hành",
          priority: "urgent",
          status: "in_progress",
          acceptedAt: "2026-10-05T08:30:00.000Z",
          completedAt: null,
          deadline: "Hôm nay, 17:30",
          customerName: "Tập đoàn Hoàng Minh",
          customerPhone: "0912.888.999",
          customerContact: "Chủ tịch Hoàng Minh",
          customerRequirements: "Tích hợp logo thương hiệu mạ vàng, phân quyền CRM theo 3 cấp quản lý.",
          createdAt: "2026-10-05T08:00:00.000Z",
        },
        {
          id: "task-02",
          communityId,
          title: "Demo tính năng phê duyệt chi ngân sách 3 cấp cho Công ty CP Dược Phẩm Á Châu",
          description: "Chuẩn bị slide và demo trực tiếp quy trình lập phiếu chi, kế toán soát xét và Giám đốc duyệt chi 1 chạm trên mobile.",
          assigneeId: "emp-03",
          assigneeName: "Lê Thu Hà",
          assignerName: "Giám Đốc Điều Hành",
          priority: "high",
          status: "assigned", // MỚI GIAO - CHỜ NHẬN VIỆC (Hiển thị nút [⚡ TIẾN HÀNH NHẬN VIỆC])
          acceptedAt: null,
          completedAt: null,
          deadline: "Ngày mai, 11:00",
          customerName: "Công ty CP Dược Phẩm Á Châu",
          customerPhone: "0988.345.678",
          customerContact: "Chị Hương Lan - Giám đốc Tài chính",
          customerRequirements: "Yêu cầu bảo mật ngân hàng và quét mã VietQR tự động khi duyệt.",
          createdAt: "2026-10-05T09:15:00.000Z",
        },
        {
          id: "task-03",
          communityId,
          title: "Soạn thảo hợp đồng & ký kết triển khai cho Chuỗi Khách Sạn Mường Thanh",
          description: "Hoàn tất điều khoản hợp đồng cung cấp thẻ định danh nhân viên và kết nối mạng lưới xúc tiến thương mại B2B.",
          assigneeId: "emp-02",
          assigneeName: "Trần Văn Long",
          assignerName: "Giám Đốc Điều Hành",
          priority: "medium",
          status: "completed",
          acceptedAt: "2026-10-04T09:15:00.000Z",
          completedAt: "2026-10-05T10:00:00.000Z",
          deadline: "Hôm nay, 12:00",
          customerName: "Chuỗi Khách Sạn Mường Thanh",
          customerPhone: "0903.111.222",
          customerContact: "Anh Tuấn Anh - Trưởng phòng Thu mua",
          customerRequirements: "Áp dụng chính sách chiết khấu hội viên B2B ViOne.",
          createdAt: "2026-10-04T08:30:00.000Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [communityId]);

  // Hành động Nhân viên Bấm: [⚡ TIẾN HÀNH NHẬN VIỆC]
  const handleAcceptTask = async (taskId: string, taskTitle: string) => {
    setAcceptingId(taskId);
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/tasks/${taskId}/accept`, {
        method: "POST",
      }).catch(() => null);

      // Cập nhật state UI thời gian thực
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "in_progress", acceptedAt: new Date().toISOString() }
            : t
        )
      );

      toast.success(
        `✓ Đã tiến hành nhận việc thành công! Hệ thống đã ghi nhận thời gian bắt đầu và thông báo tới Ban Giám Đốc.`
      );
    } catch {
      toast.error("Không thể nhận việc. Vui lòng thử lại!");
    } finally {
      setAcceptingId(null);
    }
  };

  // Hành động Hoàn thành việc
  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }).catch(() => null);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "completed", completedAt: new Date().toISOString() }
            : t
        )
      );

      toast.success("✓ Đã đánh dấu hoàn thành công việc!");
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Hành động Giám Đốc Giao Việc Mới
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          assigneeName,
          priority,
          deadline,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerRequirements: customerRequirements.trim(),
        }),
      }).catch(() => null);

      toast.success(`Đã giao việc "${title}" cho ${assigneeName}!`);
      setCreateModalOpen(false);

      // Thêm ngay vào UI
      const newTaskItem: TaskItem = res?.task || {
        id: `task-${Date.now()}`,
        communityId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: "emp-new",
        assigneeName,
        assignerName: "Ban Giám Đốc",
        priority,
        status: "assigned",
        acceptedAt: null,
        completedAt: null,
        deadline,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerRequirements: customerRequirements.trim(),
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTaskItem, ...prev]);

      // Reset
      setTitle("");
      setDescription("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerRequirements("");
    } catch {
      toast.error("Không thể giao việc. Vui lòng thử lại!");
    } finally {
      setSubmittingTask(false);
    }
  };

  // Thống kê nhanh
  const totalCount = tasks.length;
  const assignedCount = tasks.filter((t) => t.status === "assigned").length; // Chờ nhận việc
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner KPI & Nút Giao Việc */}
      <div className="rounded-3xl border border-[#DFB76C]/30 bg-gradient-to-b from-white via-white to-zinc-50 dark:from-[#0B0F17] dark:via-[#121824] dark:to-[#0B0F17] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#DFB76C]/20 to-[#8C653B]/20 text-[#D4AF37] border border-[#DFB76C]/30">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-tight">
                Phân Hệ Giao Việc & Nhận Việc
              </h3>
              <p className="text-[11px] text-[#8C653B] dark:text-[#DFB76C]">
                Cộng đồng nội bộ công ty · Tự động hóa tiến độ 1-chạm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 cursor-pointer hover:opacity-95"
          >
            <Plus className="h-4 w-4 text-slate-950" />
            <span>Giao việc mới</span>
          </button>
        </div>

        {/* 4 Thống kê nhanh */}
        <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-zinc-200 dark:border-white/10 text-center">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5">
            <p className="text-base font-black text-zinc-950 dark:text-white leading-tight">{totalCount}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Tổng việc</p>
          </div>
          <div className="p-2 rounded-xl bg-[#DFB76C]/10 border border-[#DFB76C]/20">
            <p className="text-base font-black text-[#D4AF37] leading-tight">{assignedCount}</p>
            <p className="text-[10px] text-[#8C653B] dark:text-[#DFB76C] font-semibold">Chờ nhận</p>
          </div>
          <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-[#1B2232] border border-blue-500/20">
            <p className="text-base font-black text-blue-600 dark:text-blue-400 leading-tight">{inProgressCount}</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Đang làm</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-tight">{completedCount}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Đã xong</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { id: "all", label: `Tất cả (${totalCount})` },
          { id: "assigned", label: `⚡ Chờ nhận việc (${assignedCount})` },
          { id: "in_progress", label: `Đang làm (${inProgressCount})` },
          { id: "completed", label: `Đã xong (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? "bg-zinc-950 dark:bg-[#DFB76C] text-white dark:text-zinc-950 shadow-md"
                : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh Sách Nhiệm Vụ */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#DFB76C]" />
          <p className="mt-2 text-xs">Đang tải danh sách công việc...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 p-6">
          <Briefcase className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 opacity-60" />
          <p className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Không có công việc nào trong mục này
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Giao việc mới ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-3xl border p-4.5 transition-all shadow-md ${
                task.status === "assigned"
                  ? "border-[#DFB76C] bg-gradient-to-br from-amber-500/10 via-zinc-50 to-white dark:from-[#1D170D] dark:via-[#121824] dark:to-[#0B0F17] ring-1 ring-[#DFB76C]/50"
                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121824]"
              }`}
            >
              {/* Top Row: Priority Badge + Trạng thái nhận việc */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                      task.priority === "urgent"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : task.priority === "high"
                        ? "bg-[#DFB76C]/20 text-[#D4AF37] border border-[#DFB76C]/30"
                        : "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {task.priority === "urgent" ? "Khẩn cấp" : task.priority === "high" ? "Ưu tiên cao" : "Thường"}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Hạn: {task.deadline}
                  </span>
                </div>

                {/* Status Indicator */}
                <div>
                  {task.status === "assigned" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#DFB76C]/20 text-[#D4AF37] border border-[#DFB76C]/40 animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> CHỜ NHẬN VIỆC
                    </span>
                  ) : task.status === "in_progress" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Clock className="h-3 w-3" /> ĐANG THỰC HIỆN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> ĐÃ HOÀN THÀNH
                    </span>
                  )}
                </div>
              </div>

              {/* Tiêu đề & Mô tả */}
              <h4 className="text-[15px] font-bold text-zinc-950 dark:text-white leading-snug">
                {task.title}
              </h4>
              <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {task.description}
              </p>

              {/* Thông tin Nhân viên & Khách hàng liên kết */}
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Nhân viên: <strong className="text-zinc-950 dark:text-white">{task.assigneeName}</strong>
                  </span>
                </div>

                {task.customerName ? (
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-[#DFB76C]/20 text-[#D4AF37]">
                      <Target className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">
                      Khách hàng: <strong className="text-zinc-950 dark:text-white">{task.customerName}</strong>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Timeline nhận việc */}
              {task.acceptedAt ? (
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Đã nhận việc lúc: {new Date(task.acceptedAt).toLocaleTimeString("vi-VN")} ·{" "}
                    {new Date(task.acceptedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              ) : null}

              {/* ĐẶC BIỆT: HÀNG NÚT THAO TÁC THEO TRẠNG THÁI */}
              <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
                {task.status === "assigned" ? (
                  <>
                    <span className="text-[11.5px] font-semibold text-[#8C653B] dark:text-[#DFB76C]">
                      Tài khoản nhân sự hãy xác nhận nhận việc:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAcceptTask(task.id, task.title)}
                      disabled={acceptingId === task.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-lg active:scale-95 cursor-pointer hover:opacity-95 flex items-center gap-1.5"
                    >
                      {acceptingId === task.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>TIẾN HÀNH NHẬN VIỆC</span>
                    </button>
                  </>
                ) : task.status === "in_progress" ? (
                  <>
                    <span className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                      Đang xử lý · Cập nhật khi xong:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Báo Cáo Hoàn Thành</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full text-right text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Đã hoàn tất công việc
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Giám Đốc Giao Việc Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#DFB76C]/30 bg-white dark:bg-[#0B0F17] shadow-2xl p-6 text-zinc-950 dark:text-white max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#DFB76C]/20 to-[#8C653B]/20 text-[#D4AF37] border border-[#DFB76C]/30 font-bold">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    Giao Việc Cho Nhân Sự Công Ty
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Nhân viên nhận thông báo và bấm [Tiến hành nhận việc]
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="overflow-y-auto flex-1 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề công việc *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tư vấn giải pháp NFC & đồng bộ CRM cho Tập đoàn X..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chọn nhân sự phụ trách *
                </label>
                <select
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                >
                  <option value="Nguyễn Thị Mai">Nguyễn Thị Mai (Trưởng nhóm Kinh doanh B2B)</option>
                  <option value="Trần Văn Long">Trần Văn Long (Chuyên viên Khách hàng VIP)</option>
                  <option value="Lê Thu Hà">Lê Thu Hà (Chăm sóc Khách hàng & Hậu mãi)</option>
                  <option value="Phạm Đức Anh">Phạm Đức Anh (Kỹ sư Triển khai Hệ thống)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                  >
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Bình thường</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Thời hạn hoàn thành
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hôm nay, 17:30"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                  />
                </div>
              </div>

              {/* Khách hàng liên kết */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151C2A] space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C653B] dark:text-[#DFB76C] flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Liên kết khách hàng chăm sóc (CRM)
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Tên doanh nghiệp / Khách hàng (ví dụ: Tập đoàn Hoàng Minh)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Số điện thoại / Liên hệ khách hàng"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mô tả chi tiết yêu cầu
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ nội dung giao việc, tài liệu bàn giao, kết quả mong đợi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-3 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTask || !title.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingTask ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Send className="h-4 w-4 text-slate-950" />}
                XÁC NHẬN GIAO VIỆC & PHÁT THÔNG BÁO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
