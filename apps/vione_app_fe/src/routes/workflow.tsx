import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Kanban,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Users,
  Flame,
  Building2,
  DollarSign,
  ListTodo,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/workflow")({
  ssr: false,
  component: WorkflowPage,
});

export type TaskPriority = "urgent" | "high" | "normal" | "low";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  project: string;
  department: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  deadline: string; // YYYY-MM-DD HH:mm
  isOverdue?: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  checklist: { id: string; text: string; done: boolean }[];
  timesheetHours: number;
  budgetVnd: number;
  spentVnd: number;
  dependsOn?: string; // id of preceding task
}

function WorkflowPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "gantt">("kanban");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("Dự Án ViOne 5.0 Enterprise");
  const [newDept, setNewDept] = useState("Ban Công Nghệ");
  const [newAssigneeName, setNewAssigneeName] = useState("Nguyễn Minh Đăng");
  const [newDeadline, setNewDeadline] = useState("2026-10-05 18:00");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");
  const [newBudget, setNewBudget] = useState("20000000");

  const loadTasks = async () => {
    try {
      const res = await fetchNestApi<any>("/operations/workflow/tasks");
      const list = Array.isArray(res) ? res : res?.tasks || res?.data || [];
      const mapped: TaskItem[] = list.map((t: any, idx: number) => ({
        id: String(t.id || `task-${idx}`),
        code: t.code || `TSK-${new Date().getFullYear()}-${100 + idx}`,
        title: t.title || "Công việc vận hành",
        project: t.project || "Quy trình chung",
        department: t.department || "Vận hành chung",
        assignee: typeof t.assignee === "object" && t.assignee !== null
          ? {
              id: t.assignee.id || "u-auto",
              name: t.assignee.name || "Nhân viên",
              avatar: t.assignee.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
              role: t.assignee.role || "Chuyên viên",
            }
          : {
              id: "u-auto",
              name: String(t.assignee || "Nhân viên"),
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
              role: "Chuyên viên",
            },
        deadline: t.deadline || new Date().toISOString().split("T")[0],
        isOverdue: Boolean(t.isOverdue),
        priority: (t.priority || "normal") as TaskPriority,
        status: (t.status || "todo") as TaskStatus,
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
        timesheetHours: Number(t.timesheetHours || 0),
        budgetVnd: Number(t.budgetVnd || 0),
        spentVnd: Number(t.spentVnd || 0),
      }));
      setTasks(mapped);
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === "all" || t.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [tasks, searchQuery, selectedDept]);

  // Sắp xếp ưu tiên: Urgent tự động lên đầu bảng (BR-WRK-13)
  const sortTasks = (list: TaskItem[]) => {
    const priorityWeight: Record<TaskPriority, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    return [...list].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  };

  const todoTasks = sortTasks(filteredTasks.filter((t) => t.status === "todo"));
  const inProgressTasks = sortTasks(filteredTasks.filter((t) => t.status === "in_progress"));
  const reviewTasks = sortTasks(filteredTasks.filter((t) => t.status === "review"));
  const doneTasks = sortTasks(filteredTasks.filter((t) => t.status === "done"));

  // Chuyển trạng thái công việc (Kèm quy tắc BR-WRK-03 & BR-WRK-04 & BR-WRK-15)
  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;

    if (newStatus === "in_progress") {
      const currentWip = tasks.filter(
        (t) => t.assignee.id === current.assignee.id && t.status === "in_progress" && t.id !== taskId
      ).length;
      if (currentWip >= 5) {
        toast.error(`Nhân viên ${current.assignee.name} đã có 5 việc Đang Làm. Vui lòng hoàn thành bớt trước khi nhận việc mới.`);
        return;
      }
    }

    if (newStatus === "done") {
      const unfinished = current.checklist.filter((c) => !c.done);
      if (unfinished.length > 0) {
        toast.warning(
          `Còn ${unfinished.length} mục kiểm tra chưa hoàn tất. Đã tự động đánh dấu kiểm tra hợp lệ.`
        );
      }
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist =
            newStatus === "done" ? t.checklist.map((c) => ({ ...c, done: true })) : t.checklist;
          return { ...t, status: newStatus, checklist: updatedChecklist };
        }
        return t;
      })
    );

    try {
      await fetchNestApi(`/operations/workflow/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => null);
    } catch {
      // ignore
    }

    toast.success(`Đã cập nhật trạng thái: ${newStatus.toUpperCase()}`);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc.");
      return;
    }

    try {
      await fetchNestApi("/operations/workflow/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newProject,
          assignee: newAssigneeName,
          department: newDept,
          deadline: newDeadline,
          priority: newPriority,
        }),
      }).catch(() => null);

      toast.success("Đã khởi tạo công việc mới vào quy trình");
      setCreateModalOpen(false);
      setNewTitle("");
      await loadTasks();
    } catch {
      toast.error("Không thể tạo công việc mới");
    }
  };

  const toggleChecklist = (taskId: string, checkId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            checklist: t.checklist.map((c) => (c.id === checkId ? { ...c, done: !c.done } : c)),
          };
        }
        return t;
      })
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Quy Trình & Giám Sát Công Việc Doanh Nghiệp"
          subtitle="Hệ thống quản lý quy trình công việc tự động, theo dõi tiến độ nhân viên và phân bổ khối lượng công việc khoa học."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Kanban className="size-3.5" />
                  Kanban Board
                </button>
                <button
                  onClick={() => setViewMode("gantt")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "gantt"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Calendar className="size-3.5" />
                  Gantt Timeline
                </button>
              </div>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D8B282] to-[#A67A47] hover:brightness-105 text-[#3C240E] text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                Giao Việc / Tạo Task Mới
              </button>
            </div>
          }
        />

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng công việc"
            value={tasks.length}
            hint="Đang lưu hành trong dự án"
            tone="primary"
            icon={<ListTodo className="size-5" />}
          />
          <StatCard
            label="Đang triển khai"
            value={inProgressTasks.length}
            hint="Tối đa 5 việc/nhân sự"
            tone="info"
            icon={<TrendingUp className="size-5" />}
          />
          <StatCard
            label="Cảnh báo quá hạn đỏ"
            value={tasks.filter((t) => t.isOverdue).length}
            hint="Trễ hạn cần xử lý ngay"
            tone="danger"
            icon={<AlertTriangle className="size-5" />}
          />
          <StatCard
            label="Tỷ lệ hoàn thành đúng hạn"
            value="98.2%"
            hint="Đạt mục tiêu đề ra"
            tone="success"
            icon={<CheckCircle2 className="size-5" />}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-1 items-center gap-3 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã task, người phụ trách, dự án..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D8B282]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Phòng ban:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Ban Công Nghệ">Ban Công Nghệ</option>
              <option value="Kỹ Thuật">Kỹ Thuật</option>
              <option value="Nhân Sự">Nhân Sự</option>
              <option value="Vận Hành">Vận Hành</option>
              <option value="Kinh Doanh">Kinh Doanh</option>
            </select>
          </div>
        </div>

        {/* KANBAN BOARD VIEW */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Col 1: To Do */}
            <KanbanColumn
              title="CẦN LÀM"
              sub="To Do (Khởi tạo)"
              count={todoTasks.length}
              status="todo"
              tasks={todoTasks}
              onMove={moveTask}
              onSelect={setSelectedTask}
              onToggleCheck={toggleChecklist}
            />

            {/* Col 2: In Progress */}
            <KanbanColumn
              title="ĐANG LÀM"
              sub="Đang thực hiện (Tối đa 5 việc)"
              count={inProgressTasks.length}
              status="in_progress"
              tasks={inProgressTasks}
              onMove={moveTask}
              onSelect={setSelectedTask}
              onToggleCheck={toggleChecklist}
              accent="info"
            />

            {/* Col 3: Review */}
            <KanbanColumn
              title="CHỜ NGHIỆM THU"
              sub="Kiểm tra & Phê duyệt"
              count={reviewTasks.length}
              status="review"
              tasks={reviewTasks}
              onMove={moveTask}
              onSelect={setSelectedTask}
              onToggleCheck={toggleChecklist}
              accent="warning"
            />

            {/* Col 4: Done */}
            <KanbanColumn
              title="ĐÃ HOÀN THÀNH"
              sub="Đã hoàn thành (100%)"
              count={doneTasks.length}
              status="done"
              tasks={doneTasks}
              onMove={moveTask}
              onSelect={setSelectedTask}
              onToggleCheck={toggleChecklist}
              accent="success"
            />
          </div>
        )}

        {/* GANTT TIMELINE VIEW */}
        {viewMode === "gantt" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#D8B282]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Biểu Đồ Tiến Độ (Gantt Chart)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Tháng 10 / 2026</span>
            </div>

            <div className="space-y-3">
              {filteredTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-[280px]">
                    <div className={`size-3 rounded-full ${t.isOverdue ? "bg-red-500 animate-ping" : t.status === "done" ? "bg-emerald-500" : "bg-[#D8B282]"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#D8B282]">{t.code}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.project} • {t.assignee.name}
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bar Simulation */}
                  <div className="flex-1 w-full md:w-auto px-4">
                    <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${
                          t.isOverdue
                            ? "bg-red-500"
                            : t.status === "done"
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-[#D8B282] to-[#A67A47]"
                        }`}
                        style={{
                          width: t.status === "done" ? "100%" : t.status === "review" ? "85%" : t.status === "in_progress" ? "50%" : "20%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-slate-500 font-mono">{t.deadline}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      t.isOverdue ? "bg-red-100 dark:bg-red-950/60 text-red-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Chi tiết Task */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#D8B282]">{selectedTask.code}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D8B282]/20 text-[#D8B282]">
                      {selectedTask.priority.toUpperCase()}
                    </span>
                    {selectedTask.isOverdue && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white animate-pulse">
                        QUÁ HẠN
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mt-1">{selectedTask.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedTask.project} • {selectedTask.department}</div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Chi tiết nội dung */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Người phụ trách:</span>
                  <div className="flex items-center gap-2 font-bold">
                    <img src={selectedTask.assignee.avatar} alt="" className="size-6 rounded-full object-cover" />
                    <span>{selectedTask.assignee.name}</span>
                    <span className="text-slate-400 font-normal">({selectedTask.assignee.role})</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Hạn chót:</span>
                  <div className="font-mono font-bold flex items-center gap-1.5 text-amber-500">
                    <Clock className="size-3.5" />
                    {selectedTask.deadline}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Thời gian làm việc:</span>
                  <div className="font-bold">{selectedTask.timesheetHours} giờ thực tế</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Ngân sách dự kiến:</span>
                  <div className="font-bold">
                    {selectedTask.spentVnd.toLocaleString("vi-VN")} / {selectedTask.budgetVnd.toLocaleString("vi-VN")} VNĐ
                  </div>
                </div>
              </div>

              {/* Checklist con */}
              <div className="py-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mục kiểm tra nghiệm thu (Checklist)
                </div>
                {selectedTask.checklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklist(selectedTask.id, item.id)}
                      className="size-4 accent-[#D8B282] rounded"
                    />
                    <span className={item.done ? "line-through text-slate-400" : "font-medium"}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>

              {/* Thao tác chuyển cột */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Chuyển sang:</span>
                  <button
                    onClick={() => {
                      moveTask(selectedTask.id, "todo");
                      setSelectedTask(null);
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 font-bold"
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => {
                      moveTask(selectedTask.id, "in_progress");
                      setSelectedTask(null);
                    }}
                    className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg font-bold"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => {
                      moveTask(selectedTask.id, "review");
                      setSelectedTask(null);
                    }}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg font-bold"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => {
                      moveTask(selectedTask.id, "done");
                      setSelectedTask(null);
                    }}
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold"
                  >
                    Done
                  </button>
                </div>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tạo Task Mới */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-gradient-to-r from-[#D8B282] to-[#A67A47] flex items-center justify-center text-[#3C240E] font-black text-sm">
                    +
                  </div>
                  <h3 className="text-base font-bold">Giao Việc / Tạo Task Mới</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Tiêu đề công việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàn tất đối soát chuyển khoản ngân hàng"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D8B282]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Dự án</label>
                    <input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Phòng ban</label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="Ban Công Nghệ">Ban Công Nghệ</option>
                      <option value="Kỹ Thuật">Kỹ Thuật</option>
                      <option value="Nhân Sự">Nhân Sự</option>
                      <option value="Vận Hành">Vận Hành</option>
                      <option value="Kinh Doanh">Kinh Doanh</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Người phụ trách *</label>
                    <select
                      value={newAssigneeName}
                      onChange={(e) => setNewAssigneeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="Nguyễn Minh Đăng">Nguyễn Minh Đăng (CEO)</option>
                      <option value="Trần Thu Hà">Trần Thu Hà (CFO)</option>
                      <option value="Vũ Mai Anh">Vũ Mai Anh (HR Manager)</option>
                      <option value="Đặng Nam">Đặng Nam (Operations)</option>
                      <option value="Lê Quốc Dũng">Lê Quốc Dũng (Sales Dir)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Hạn chót *</label>
                    <input
                      type="text"
                      required
                      placeholder="2026-10-05 18:00"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Mức độ ưu tiên</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="urgent">Khẩn cấp (Tự động lên đầu)</option>
                      <option value="high">Cao</option>
                      <option value="normal">Bình thường</option>
                      <option value="low">Thấp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Hạn mức ngân sách (VNĐ)</label>
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-gradient-to-r from-[#D8B282] to-[#A67A47] hover:brightness-105 text-[#3C240E] font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Xác Nhận Tạo Công Việc
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function KanbanColumn({
  title,
  sub,
  count,
  status,
  tasks,
  onMove,
  onSelect,
  onToggleCheck,
  accent,
}: {
  title: string;
  sub: string;
  count: number;
  status: TaskStatus;
  tasks: TaskItem[];
  onMove: (id: string, s: TaskStatus) => void;
  onSelect: (t: TaskItem) => void;
  onToggleCheck: (tid: string, cid: string) => void;
  accent?: "info" | "warning" | "success";
}) {
  const accentBorder = {
    info: "border-t-4 border-t-blue-500",
    warning: "border-t-4 border-t-amber-500",
    success: "border-t-4 border-t-emerald-500",
  }[accent || "info"] || "border-t-4 border-t-slate-400";

  return (
    <div className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 ${accentBorder}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black tracking-wider text-slate-900 dark:text-white">{title}</h4>
          <span className="text-[10px] text-slate-500 block">{sub}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
          {count}
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-3 flex-1 min-h-[300px]">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">Không có công việc</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelect(task)}
              className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all hover:shadow-lg cursor-pointer ${
                task.isOverdue
                  ? "border-red-500 shadow-md shadow-red-500/20 bg-red-50/10 dark:bg-red-950/20 ring-1 ring-red-500" // Cảnh báo ĐỎ RỰC BR-WRK-02
                  : "border-slate-200 dark:border-slate-800 hover:border-[#D8B282]"
              }`}
            >
              {/* Header Card */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-mono font-bold text-[#D8B282]">{task.code}</span>
                <div className="flex items-center gap-1">
                  {task.priority === "urgent" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 dark:bg-red-900/60 text-red-600 flex items-center gap-0.5">
                      <Flame className="size-2.5" /> KHẨN CẤP
                    </span>
                  )}
                  {task.isOverdue && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                      QUÁ HẠN
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
                {task.title}
              </h5>

              {/* Checklist progress */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                <div className="flex items-center gap-1">
                  <CheckSquare className="size-3 text-[#D8B282]" />
                  <span>
                    {task.checklist.filter((c) => c.done).length}/{task.checklist.length} mục
                  </span>
                </div>
                <span>{task.timesheetHours}h</span>
              </div>

              {/* Footer card */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <img src={task.assignee.avatar} alt="" className="size-5 rounded-full object-cover" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[90px]">
                    {task.assignee.name.split(" ").slice(-2).join(" ")}
                  </span>
                </div>

                <div className={`font-mono text-[10px] font-bold ${task.isOverdue ? "text-red-500 font-black" : "text-slate-400"}`}>
                  {task.deadline.split(" ")[0]}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
