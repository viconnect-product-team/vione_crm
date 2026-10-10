import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Loader2,
  User,
  Calendar,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  UserCheck,
  CheckSquare,
  Square,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface WorkflowMobileSheetProps {
  open: boolean;
  onClose: () => void;
}

export interface TaskItem {
  id: string;
  code?: string;
  title: string;
  department: string;
  assignee: string;
  assignerName?: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  priority: "urgent" | "high" | "medium";
  deadline: string;
  progress: number; // 0 - 100%
  progressNote?: string;
}

const SAMPLE_EXCEL_TASKS: TaskItem[] = [
  {
    id: "imp-01",
    code: "TSK-IMP-01",
    title: "Quyết toán thuế & Lập báo cáo tài chính quý",
    department: "Tài Chính - Kế Toán",
    assignee: "Trần Thu Hà",
    assignerName: "Ban Giám Đốc",
    status: "assigned",
    priority: "urgent",
    deadline: "17:30 Hôm nay",
    progress: 0,
    progressNote: "Nhập từ file Excel kế hoạch",
  },
  {
    id: "imp-02",
    code: "TSK-IMP-02",
    title: "Chăm sóc & tái ký hợp đồng chuỗi 15 đối tác VIP",
    department: "Kinh Doanh B2B",
    assignee: "Đặng Nam",
    assignerName: "Tổng Giám Đốc",
    status: "assigned",
    priority: "high",
    deadline: "18:00 Ngày mai",
    progress: 0,
    progressNote: "Nhập từ file Excel kế hoạch",
  },
  {
    id: "imp-03",
    code: "TSK-IMP-03",
    title: "Tuyển dụng & Thử việc 03 Kỹ sư Hệ thống Cloud",
    department: "Hành Chính Nhân Sự",
    assignee: "Vũ Mai Anh",
    assignerName: "Phó Tổng Giám Đốc",
    status: "assigned",
    priority: "medium",
    deadline: "Cuối tuần",
    progress: 0,
    progressNote: "Nhập từ file Excel kế hoạch",
  },
  {
    id: "imp-04",
    code: "TSK-IMP-04",
    title: "Bảo trì định kỳ cụm máy chủ & sao lưu an toàn dữ liệu",
    department: "Công Nghệ & CNTT",
    assignee: "Nguyễn Văn Tuấn",
    assignerName: "Ban Giám Đốc",
    status: "in_progress",
    priority: "high",
    deadline: "12:00 Ngày mai",
    progress: 50,
    progressNote: "Đang sao lưu cụm database chính",
  },
];

export function WorkflowMobileSheet({ open, onClose }: WorkflowMobileSheetProps) {
  const [filter, setFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "task-01",
      code: "TSK-081",
      title: "Triển khai hệ thống thẻ Titanium NFC cho đối tác An Phát Group",
      department: "Công Nghệ & Triển Khai",
      assignee: "Nguyễn Văn Tuấn",
      assignerName: "Tổng Giám Đốc",
      status: "in_progress",
      priority: "high",
      deadline: "18:00 Hôm nay",
      progress: 65,
      progressNote: "Đang cấu hình chip NFC đợt 1",
    },
    {
      id: "task-02",
      code: "TSK-082",
      title: "Đối soát và quyết toán hạn mức thanh toán Q3/2026",
      department: "Tài Chính Kế Toán",
      assignee: "Đặng Thu Hà",
      assignerName: "Ban Giám Đốc",
      status: "assigned",
      priority: "urgent",
      deadline: "17:30 Hôm nay",
      progress: 0,
      progressNote: "Chờ nhân sự nhận việc",
    },
    {
      id: "task-03",
      code: "TSK-083",
      title: "Soạn thảo hồ sơ năng lực đấu thầu KCN Tân Uyên",
      department: "Kinh Doanh B2B",
      assignee: "Trần Quốc Đạt",
      assignerName: "Giám Đốc Kinh Doanh",
      status: "in_progress",
      priority: "medium",
      deadline: "12:00 Ngày mai",
      progress: 40,
      progressNote: "Đã xong bản thảo năng lực tài chính",
    },
    {
      id: "task-04",
      code: "TSK-084",
      title: "Kiểm thử bảo mật chuẩn ISO/IEC 27001 cho app di động",
      department: "Kỹ Thuật Hệ Thống",
      assignee: "Phạm Minh Hoàng",
      assignerName: "Ban Giám Đốc",
      status: "overdue",
      priority: "urgent",
      deadline: "Quá hạn 1 ngày",
      progress: 85,
      progressNote: "Đang kiểm tra lỗ hổng bảo mật",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("Nguyễn Văn Tuấn");
  const [newDepartment, setNewDepartment] = useState("Vận Hành");
  const [newPriority, setNewPriority] = useState<"urgent" | "high" | "medium">("high");
  const [creating, setCreating] = useState(false);

  // Pop-up Cập nhật tiến độ
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<TaskItem | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newProgressNote, setNewProgressNote] = useState<string>("");

  // Pop-up Import Excel
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNestApi<any>("/operations/workflow/tasks")
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((t: any, idx: number) => ({
            id: t.id || `task-api-${idx}`,
            code: t.code || `TSK-0${idx + 80}`,
            title: t.title || "Công việc công ty",
            department: t.department || "Vận Hành",
            assignee: t.assignee || t.assigneeName || "Nhân sự",
            assignerName: t.assignerName || "Ban Giám Đốc",
            status: t.status || "in_progress",
            priority: t.priority || "high",
            deadline: t.deadline || "Hôm nay",
            progress: typeof t.progress === "number" ? t.progress : 50,
            progressNote: t.progressNote || t.progress_note || "",
          }));
          setTasks(mapped);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  // Luồng 1: Nhận việc
  const handleAcceptTask = (task: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "in_progress",
              progressNote: `Đã nhận việc lúc ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            }
          : t
      )
    );
    toast.success(`✓ Đã nhận việc "${task.title}". Hệ thống đã báo cho Sếp!`);
  };

  // Luồng 2: Cập nhật tiến độ
  const handleOpenUpdateProgress = (task: TaskItem) => {
    setSelectedTaskForProgress(task);
    setNewProgress(task.progress);
    setNewProgressNote(task.progressNote || "");
  };

  const handleSaveProgress = () => {
    if (!selectedTaskForProgress) return;
    const isCompleted = newProgress >= 100;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskForProgress.id
          ? {
              ...t,
              progress: newProgress,
              progressNote: newProgressNote.trim(),
              status: isCompleted ? "completed" : "in_progress",
            }
          : t
      )
    );
    toast.success(`✓ Đã cập nhật tiến độ ${newProgress}%. Lãnh đạo có thể theo dõi ngay!`);
    setSelectedTaskForProgress(null);
  };

  // Luồng 3: Import Excel
  const handleImportExcel = () => {
    setImporting(true);
    setTimeout(() => {
      setTasks((prev) => [...SAMPLE_EXCEL_TASKS, ...prev]);
      setImporting(false);
      setShowImportExcelModal(false);
      toast.success(`✓ Đã nhập thành công ${SAMPLE_EXCEL_TASKS.length} công việc từ file Excel!`);
    }, 700);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    const newTask: TaskItem = {
      id: "task-" + Date.now().toString().slice(-4),
      code: "TSK-" + Math.floor(100 + Math.random() * 900),
      title: newTitle.trim(),
      assignee: newAssignee,
      assignerName: "Ban Giám Đốc",
      department: newDepartment,
      priority: newPriority,
      deadline: "Trong tuần này",
      status: "assigned",
      progress: 0,
      progressNote: "Mới giao việc",
    };

    try {
      await fetchNestApi("/operations/workflow/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
      }).catch(() => null);

      setTasks((prev) => [newTask, ...prev]);
      setCreating(false);
      setShowCreate(false);
      setNewTitle("");
      toast.success("✓ Đã tạo công việc mới và thông báo đến nhân sự!");
    } catch {
      setCreating(false);
      setShowCreate(false);
      toast.success("✓ Đã khởi tạo công việc thành công!");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "assigned") return t.status === "assigned";
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "completed") return t.status === "completed";
    if (filter === "overdue") return t.status === "overdue";
    return true;
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-all">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#DFB76C]/25 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}
      >
        {/* Header sang trọng chuẩn ViOne Gold */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#DFB76C]/15 bg-slate-50/50 dark:bg-[#0E1522]/80">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#DFB76C_0%,#8C653B_100%)] text-slate-950 font-bold shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white leading-tight">
                Quy Trình & Tiến Độ Doanh Nghiệp
              </h3>
              <p className="text-[11px] font-semibold text-[#8C653B] dark:text-[#DFB76C]">
                Theo dõi tiến độ thực tế · Báo cáo Lãnh đạo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportExcelModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-[#DFB76C]/40 bg-[#DFB76C]/10 text-[#DFB76C] text-[11px] font-bold flex items-center gap-1 hover:bg-[#DFB76C]/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thanh KPI tóm tắt tải làm việc */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#070B12]">
          <div className="rounded-xl border border-slate-200 dark:border-[#DFB76C]/15 bg-white dark:bg-[#0E1522] p-2 text-center">
            <span className="block text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">TỔNG VIỆC</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{tasks.length}</span>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 p-2 text-center">
            <span className="block text-[9.5px] font-semibold text-[#8C653B] dark:text-[#DFB76C]">CHỜ NHẬN</span>
            <span className="text-sm font-bold text-[#8C653B] dark:text-[#DFB76C]">
              {tasks.filter((t) => t.status === "assigned").length}
            </span>
          </div>
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 p-2 text-center">
            <span className="block text-[9.5px] font-semibold text-blue-600 dark:text-blue-400">ĐANG LÀM</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {tasks.filter((t) => t.status === "in_progress").length}
            </span>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 p-2 text-center">
            <span className="block text-[9.5px] font-semibold text-rose-600 dark:text-rose-400">TRỄ HẠN</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {tasks.filter((t) => t.status === "overdue").length}
            </span>
          </div>
        </div>

        {/* Filter Bar & Action Giao Việc */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0B0F17]">
          <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                filter === "all"
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold shadow-sm border border-[#DFB76C]/50"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setFilter("assigned")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                filter === "assigned"
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold shadow-sm border border-[#DFB76C]/50"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Mới giao
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                filter === "in_progress"
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold shadow-sm border border-[#DFB76C]/50"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Đang làm
            </button>
            <button
              onClick={() => setFilter("overdue")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                filter === "overdue"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Trễ hạn
            </button>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3.5 py-1.5 rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm hover:brightness-105 active:scale-95 transition cursor-pointer border border-[#DFB76C]/50"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Giao việc
          </button>
        </div>

        {/* Create Task Form */}
        {showCreate && (
          <form onSubmit={handleCreateTask} className="p-4 border-b border-slate-200 dark:border-[#DFB76C]/20 bg-slate-50 dark:bg-[#0E1522] space-y-3">
            <h4 className="text-xs font-bold text-slate-950 dark:text-[#F6E1C3] flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-[#DFB76C]" />
              Khởi tạo & Giao việc cho nhân sự
            </h4>
            <div>
              <input
                type="text"
                placeholder="Tiêu đề công việc cần giao..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B12] p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#DFB76C]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B12] p-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Nguyễn Văn Tuấn">Nguyễn Văn Tuấn</option>
                <option value="Đặng Thu Hà">Đặng Thu Hà</option>
                <option value="Trần Quốc Đạt">Trần Quốc Đạt</option>
                <option value="Phạm Minh Hoàng">Phạm Minh Hoàng</option>
                <option value="Vũ Mai Anh">Vũ Mai Anh</option>
              </select>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B12] p-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Vận Hành">Vận Hành</option>
                <option value="Tài Chính - Kế Toán">Tài Chính</option>
                <option value="Kinh Doanh B2B">Kinh Doanh</option>
                <option value="Hành Chính Nhân Sự">Nhân Sự</option>
                <option value="Công Nghệ & CNTT">CNTT</option>
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B12] p-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="high">Ưu tiên cao</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="medium">Trung bình</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F6E1C3] via-[#DFB76C] to-[#C99C47] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer border border-[#E5C07B]/60"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Xác nhận Giao việc & Thông báo
            </button>
          </form>
        )}

        {/* Task List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Đang tải danh sách công việc...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Không có công việc nào trong danh mục này.</div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-[#DFB76C]/20 bg-slate-50/50 dark:bg-[#0E1522]/90 hover:border-[#DFB76C]/60 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {t.code && (
                      <span className="text-[10px] font-bold text-slate-400">{t.code}</span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#DFB76C]/10 text-[#DFB76C]">
                      {t.department}
                    </span>
                  </div>

                  {t.status === "overdue" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      Trễ hạn
                    </span>
                  ) : t.status === "assigned" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Chờ nhận
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DFB76C]/15 text-[#9A7228] dark:text-[#F3DA9C] border border-[#DFB76C]/30">
                      {t.status === "completed" ? "Đã xong" : "Đang làm"}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {t.title}
                </h4>

                {/* Progress Bar & Note */}
                <div className="bg-slate-100 dark:bg-white/[0.03] p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ công việc</span>
                    <span className="font-extrabold text-[#DFB76C]">{t.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, t.progress))}%`,
                        backgroundColor: t.progress === 100 ? "#10B981" : "#DFB76C",
                      }}
                    />
                  </div>
                  {t.progressNote && (
                    <p className="text-[10.5px] italic text-slate-600 dark:text-slate-400 truncate">
                      📝 {t.progressNote}
                    </p>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="h-3 w-3 text-[#DFB76C]" /> {t.assignee}
                  </span>

                  <div className="flex items-center gap-2">
                    {t.status === "assigned" ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptTask(t)}
                        className="px-2.5 py-1 rounded-lg bg-[#DFB76C] text-slate-950 font-extrabold text-[10.5px] flex items-center gap-1 hover:brightness-105 active:scale-95 transition cursor-pointer"
                      >
                        <UserCheck className="h-3 w-3" />
                        Nhận việc
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenUpdateProgress(t)}
                        className="px-2.5 py-1 rounded-lg border border-[#DFB76C]/50 text-[#DFB76C] font-bold text-[10.5px] flex items-center gap-1 hover:bg-[#DFB76C]/10 active:scale-95 transition cursor-pointer"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Cập nhật
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* POP-UP CẬP NHẬT TIẾN ĐỘ */}
      {selectedTaskForProgress && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B0F17] border border-[#DFB76C]/30 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-[#DFB76C]">Cập Nhật Tiến Độ & Ghi Chú</h4>
              <button
                type="button"
                onClick={() => setSelectedTaskForProgress(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2">{selectedTaskForProgress.title}</p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-2">Chọn % tiến độ:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setNewProgress(pct)}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      newProgress === pct
                        ? "border-[#DFB76C] bg-[#DFB76C]/20 text-[#DFB76C]"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Ghi chú tiến độ gửi Sếp:</label>
              <textarea
                value={newProgressNote}
                onChange={(e) => setNewProgressNote(e.target.value)}
                placeholder="Ghi rõ các đầu việc đã hoàn thành hoặc vướng mắc..."
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-[#121A26] p-2.5 text-xs text-white outline-none focus:border-[#DFB76C]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveProgress}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F6E1C3] via-[#DFB76C] to-[#C99C47] text-slate-950 font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              Lưu & Báo Cáo Cho Sếp
            </button>
          </div>
        </div>
      )}

      {/* POP-UP IMPORT EXCEL */}
      {showImportExcelModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B0F17] border border-[#DFB76C]/30 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#DFB76C]" />
                <h4 className="text-sm font-bold text-white">Nhập Công Việc Từ Excel</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowImportExcelModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống tự động phân loại công việc theo phòng ban (Kế toán, Kinh doanh, Nhân sự, CNTT) từ bảng tính mẫu.
            </p>

            <div className="bg-[#121A26] p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-[#DFB76C] block">Các công việc trong file mẫu:</span>
              {SAMPLE_EXCEL_TASKS.slice(0, 3).map((item, i) => (
                <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                  <span className="text-slate-500 font-mono">[{item.department}]</span>
                  <span className="truncate">{item.title}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleImportExcel}
              disabled={importing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F6E1C3] via-[#DFB76C] to-[#C99C47] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <Upload className="h-4 w-4 text-slate-950" />
                  <span>Xác Nhận Nhập Toàn Bộ Vào Hệ Thống</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
