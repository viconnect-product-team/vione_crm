// BC-Mobile — Phân hệ Giao Việc & Nhận Việc Trong Cộng Đồng Doanh Nghiệp (ViOne Executive Style)

import React, { useState, useEffect, useMemo } from "react";
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
  Pencil,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/use-role";
import { DashboardCellTooltip } from "@/components/dashboard/DashboardCellTooltip";

export interface TaskItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerName?: string;
  createdById?: string;
  creatorId?: string;
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
  communityCreatorId?: string;
}

export function CompanyTaskManagement({ communityId, isDirector = false, communityCreatorId }: Props) {
  const { user } = useAuth();
  const { isQuanTri, isAdmin, canAssignTask, canEditRecord, currentUser } = useRole();

  // Xác định quyền hạn: Role Quản trị (cao nhất), role Admin (cao nhì) hoặc người thiết lập công ty
  const userCanAssign = canAssignTask(communityCreatorId, isDirector);

  // Tab cấp cao: Giao việc & Điều hành vs Nhận việc (Việc của tôi)
  const [activeMode, setActiveMode] = useState<"assign" | "receive">(userCanAssign ? "assign" : "receive");

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "assigned" | "in_progress" | "completed">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Danh sách nhân sự cộng đồng
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  // Form giao việc mới
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeName, setAssigneeName] = useState("Thành viên");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium">("high");
  const [deadline, setDeadline] = useState("Trong hôm nay");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerRequirements, setCustomerRequirements] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Form chỉnh sửa việc
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"urgent" | "high" | "medium">("high");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerRequirements, setEditCustomerRequirements] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);

  // Đồng bộ activeMode nếu quyền tài khoản thay đổi realtime
  useEffect(() => {
    if (!userCanAssign && activeMode === "assign") {
      setActiveMode("receive");
    }
  }, [userCanAssign, activeMode]);

  // Load danh sách nhân sự thực tế từ cộng đồng
  const loadEmployees = async () => {
    try {
      const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/employees`);
      if (res?.employees && res.employees.length > 0) {
        setEmployees(res.employees);
        const first = res.employees[0];
        setSelectedAssigneeId(first.id || first.userId);
        setAssigneeName(first.fullName);
      }
    } catch (e) {
      console.warn("Failed to load community employees:", e);
    }
  };

  // Load danh sách tasks - LUÔN SORT MỚI NHẤT LÊN ĐẦU
  const loadTasks = async () => {
    try {
      const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/tasks`);
      if (res?.tasks && Array.isArray(res.tasks)) {
        const sorted = [...res.tasks].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTasks(sorted);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, [communityId]);

  // Hành động Nhân viên Bấm: [⚡ TIẾN HÀNH NHẬN VIỆC]
  const handleAcceptTask = async (taskId: string, taskTitle: string) => {
    setAcceptingId(taskId);
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/tasks/${taskId}/accept`, {
        method: "POST",
      }).catch(() => null);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "in_progress", acceptedAt: new Date().toISOString() }
            : t
        )
      );

      toast.success(`✓ Đã tiến hành nhận việc thành công! Hệ thống đã ghi nhận thời gian bắt đầu.`);
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

  // Hành động Giao Việc Mới (Chỉ Quản trị, Admin hoặc Người thiết lập công ty)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanAssign) {
      toast.error("Bạn không có quyền giao việc trong cộng đồng này");
      return;
    }
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
          assigneeId: selectedAssigneeId || "emp-vione",
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

      const newTaskItem: TaskItem = res?.task || {
        id: `task-${Date.now()}`,
        communityId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: selectedAssigneeId || "emp-new",
        assigneeName,
        assignerName: currentUser?.name || "Ban Quản Trị",
        createdById: currentUser?.id,
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

      // Đưa bản ghi mới nhất lên đầu danh sách
      setTasks((prev) => [newTaskItem, ...prev]);

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

  // Mở modal sửa task có kiểm tra phân quyền dữ liệu
  const openEditModal = (task: TaskItem) => {
    const creatorId = task.createdById || task.creatorId;
    if (!canEditRecord(creatorId)) {
      toast.error("Bạn không có quyền chỉnh sửa bản ghi này do tài khoản khác tạo ra!");
      return;
    }
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority === "urgent" ? "urgent" : task.priority === "high" ? "high" : "medium");
    setEditDeadline(task.deadline);
    setEditCustomerName(task.customerName || "");
    setEditCustomerPhone(task.customerPhone || "");
    setEditCustomerRequirements(task.customerRequirements || "");
  };

  // Cập nhật task (RESTful PATCH)
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setUpdatingTask(true);
    try {
      await fetchNestApi(`/connect-app/community/${communityId}/tasks/${editingTask.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          deadline: editDeadline.trim(),
          customerName: editCustomerName.trim(),
          customerPhone: editCustomerPhone.trim(),
          customerRequirements: editCustomerRequirements.trim(),
        }),
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: editTitle.trim(),
                description: editDescription.trim(),
                priority: editPriority,
                deadline: editDeadline.trim(),
                customerName: editCustomerName.trim(),
                customerPhone: editCustomerPhone.trim(),
                customerRequirements: editCustomerRequirements.trim(),
              }
            : t
        )
      );

      toast.success("✓ Đã cập nhật thông tin công việc!");
      setEditingTask(null);
    } catch {
      toast.error("Không thể cập nhật công việc. Vui lòng kiểm tra quyền hạn!");
    } finally {
      setUpdatingTask(false);
    }
  };

  // Lọc task của user
  const isUserTask = (t: TaskItem) => {
    const userId = currentUser?.id || user?.id;
    if (userId && t.assigneeId === userId) return true;
    const userName = currentUser?.name || user?.name;
    if (userName && t.assigneeName?.toLowerCase().includes(userName.toLowerCase())) return true;
    const userEmail = currentUser?.email || user?.email;
    if (userEmail && t.assigneeName?.toLowerCase().includes(userEmail.split("@")[0].toLowerCase())) return true;
    return false;
  };

  // Danh sách task hiển thị dựa vào mode & filter
  const displayedTasks = useMemo(() => {
    let list = [...tasks];
    // Chế độ nhận việc: CHỈ hiển thị việc được phân công cho user
    if (activeMode === "receive") {
      list = list.filter(isUserTask);
    }
    // Lọc theo trạng thái
    if (filter !== "all") {
      list = list.filter((t) => t.status === filter);
    }
    // Đảm bảo luôn sort mới nhất lên đầu
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, activeMode, filter, currentUser, user]);

  const totalAssignedCount = tasks.filter((t) => t.status === "assigned").length;
  const totalInProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const totalCompletedCount = tasks.filter((t) => t.status === "completed").length;

  const myTasksCount = tasks.filter(isUserTask).length;
  const myAssignedCount = tasks.filter((t) => isUserTask(t) && t.status === "assigned").length;

  return (
    <div className="space-y-4">
      {/* ── BỘ CHỌN CHỨC NĂNG CẤP CAO: GIAO VIỆC & ĐIỀU HÀNH vs NHẬN VIỆC ─────── */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 flex-1">
          {/* NÚT GIAO VIỆC: CHỈ HIỂN THỊ KHI CÓ QUYỀN (QUẢN TRỊ, ADMIN HOẶC NGƯỜI THIẾT LẬP CÔNG TY) */}
          {userCanAssign ? (
            <button
              type="button"
              onClick={() => {
                setActiveMode("assign");
                setFilter("all");
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "assign"
                  ? "bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 shadow-md font-black"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              <span>📋 Giao Việc & Điều Hành</span>
            </button>
          ) : null}

          {/* NÚT NHẬN VIỆC: MỌI NHÂN SỰ ĐỀU NHÌN THẤY */}
          <button
            type="button"
            onClick={() => {
              setActiveMode("receive");
              setFilter("all");
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "receive"
                ? "bg-zinc-950 dark:bg-[#DFB76C] text-white dark:text-zinc-950 shadow-md font-black"
                : "text-zinc-600 dark:text-zinc-400 hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>⚡ Nhận Việc ({myTasksCount})</span>
            {myAssignedCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {myAssignedCount} mới
              </span>
            ) : null}
          </button>
        </div>

        {/* NÚT GIAO VIỆC MỚI: CHỈ HIỂN THỊ Ở MODE GIAO VIỆC & CÓ QUYỀN */}
        {userCanAssign && activeMode === "assign" ? (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-md active:scale-95 cursor-pointer hover:opacity-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo việc mới</span>
          </button>
        ) : null}
      </div>

      {/* ── THỐNG KÊ NHANH THEO CHẾ ĐỘ HIỆN TẠI ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
          <p className="text-base font-black text-zinc-950 dark:text-white leading-tight">
            {activeMode === "assign" ? tasks.length : myTasksCount}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {activeMode === "assign" ? "Tổng đã giao" : "Việc của tôi"}
          </p>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#DFB76C]/10 border border-[#DFB76C]/20">
          <p className="text-base font-black text-[#D4AF37] leading-tight">
            {activeMode === "assign" ? totalAssignedCount : myAssignedCount}
          </p>
          <p className="text-[10px] text-[#8C653B] dark:text-[#DFB76C] font-semibold">Chờ nhận</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-blue-500/10 dark:bg-[#1B2232] border border-blue-500/20">
          <p className="text-base font-black text-blue-600 dark:text-blue-400 leading-tight">
            {activeMode === "assign"
              ? totalInProgressCount
              : tasks.filter((t) => isUserTask(t) && t.status === "in_progress").length}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400">Đang làm</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-tight">
            {activeMode === "assign"
              ? totalCompletedCount
              : tasks.filter((t) => isUserTask(t) && t.status === "completed").length}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Đã xong</p>
        </div>
      </div>

      {/* ── BỘ LỌC TRẠNG THÁI ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { id: "all", label: "Tất cả trạng thái" },
          { id: "assigned", label: "⚡ Chờ nhận việc" },
          { id: "in_progress", label: "Đang tiến hành" },
          { id: "completed", label: "Đã hoàn thành" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? "bg-zinc-950 dark:bg-[#DFB76C] text-white dark:text-zinc-950 shadow-xs"
                : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DANH SÁCH CÔNG VIỆC (MỚI NHẤT LÊN ĐẦU + TOOLTIP ELLIPSIS) ────────── */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#DFB76C]" />
          <p className="mt-2 text-xs">Đang tải danh sách công việc...</p>
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 p-6">
          <Briefcase className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 opacity-60" />
          <p className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {activeMode === "assign"
              ? "Chưa có công việc nào được giao trong mục này"
              : "Bạn chưa có công việc nào cần xử lý"}
          </p>
          {userCanAssign && activeMode === "assign" ? (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Giao việc mới ngay
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTasks.map((task) => {
            const isCreator = canEditRecord(task.createdById || task.creatorId);

            return (
              <div
                key={task.id}
                className={`rounded-3xl border p-4.5 transition-all shadow-md ${
                  task.status === "assigned"
                    ? "border-[#DFB76C] bg-gradient-to-br from-amber-500/10 via-zinc-50 to-white dark:from-[#1D170D] dark:via-[#121824] dark:to-[#0B0F17] ring-1 ring-[#DFB76C]/40"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121824]"
                }`}
              >
                {/* Header item: Priority, deadline, and edit button */}
                <div className="flex items-center justify-between gap-2 mb-2">
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

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
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

                    {/* NÚT CHỈNH SỬA: CHỈ HIỂN THỊ KHI LÀ QUẢN TRỊ, ADMIN HOẶC CHÍNH CHỦ TẠO VIỆC */}
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
                        title="Chỉnh sửa công việc"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tiêu đề & Mô tả có Tooltip Ellipsis */}
                <h4 className="text-[15px] font-bold text-zinc-950 dark:text-white leading-snug">
                  <DashboardCellTooltip text={task.title} maxWidth="max-w-full" className="font-bold text-[15px]" />
                </h4>
                {task.description && (
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <DashboardCellTooltip text={task.description} maxWidth="max-w-full" />
                  </div>
                )}

                {/* Phụ trách & Khách hàng */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1 min-w-0">
                        Khách hàng:{" "}
                        <DashboardCellTooltip
                          text={task.customerName}
                          maxWidth="max-w-[180px]"
                          className="font-bold text-zinc-950 dark:text-white"
                        />
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Thao tác nhận việc & hoàn thành */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
                  {task.status === "assigned" ? (
                    <>
                      <span className="text-[11.5px] font-semibold text-[#8C653B] dark:text-[#DFB76C]">
                        Tài khoản nhân sự hãy xác nhận:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAcceptTask(task.id, task.title)}
                        disabled={acceptingId === task.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-md active:scale-95 cursor-pointer hover:opacity-95 flex items-center gap-1.5"
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
            );
          })}
        </div>
      )}

      {/* ── MODAL: GIAO VIỆC MỚI (CHỈ QUẢN TRỊ, ADMIN & NGƯỜI THIẾT LẬP CÔNG TY) */}
      {createModalOpen && userCanAssign && (
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
                    Phân công tác vụ và theo dõi tiến độ thời gian thực
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
                  value={selectedAssigneeId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setSelectedAssigneeId(chosenId);
                    const found = employees.find((emp) => (emp.id || emp.userId) === chosenId);
                    if (found) setAssigneeName(found.fullName);
                  }}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                >
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => (
                      <option key={emp.id || emp.userId} value={emp.id || emp.userId}>
                        {emp.fullName} ({emp.roleTitle || emp.role || "Thành viên"})
                      </option>
                    ))
                  ) : (
                    <option value="">Đang tải danh sách thành viên cộng đồng...</option>
                  )}
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
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151C2A] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C653B] dark:text-[#DFB76C] flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Liên kết khách hàng chăm sóc (CRM)
                </span>
                <input
                  type="text"
                  placeholder="Tên khách hàng / doanh nghiệp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#121824] p-2 text-xs text-zinc-950 dark:text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại liên hệ"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#121824] p-2 text-xs text-zinc-950 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mô tả chi tiết yêu cầu
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ nội dung giao việc, tài liệu bàn giao..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#121824] p-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-[#DFB76C]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTask || !title.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#D4AF37] to-[#8C653B] text-slate-950 font-black text-xs shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingTask ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Send className="h-4 w-4 text-slate-950" />}
                XÁC NHẬN GIAO VIỆC & PHÁT THÔNG BÁO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHỈNH SỬA CÔNG VIỆC (PHÂN QUYỀN DỮ LIỆU) ────────────────── */}
      {editingTask && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 text-foreground max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Chỉnh Sửa Công Việc
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cập nhật thông tin phân công và tiến độ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="overflow-y-auto flex-1 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Tiêu đề công việc *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none focus:border-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-ring"
                  >
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Bình thường</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Thời hạn hoàn thành
                  </label>
                  <input
                    type="text"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Khách hàng / Doanh nghiệp
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingTask || !editTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition cursor-pointer flex items-center gap-1.5"
                >
                  {updatingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
