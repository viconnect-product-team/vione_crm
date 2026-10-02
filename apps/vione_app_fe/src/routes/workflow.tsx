import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-01",
    code: "TSK-2026-081",
    title: "Phê duyệt tài liệu kiến trúc kỹ thuật ViOne Platform 5.0",
    project: "Dự Án ViOne 5.0 Enterprise",
    department: "Ban Công Nghệ",
    assignee: {
      id: "u-01",
      name: "Nguyễn Minh Đăng",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      role: "CEO / Architect",
    },
    deadline: "2026-10-02 18:00",
    isOverdue: false,
    priority: "urgent",
    status: "in_progress",
    checklist: [
      { id: "c1", text: "Kiểm tra 80 Quy tắc nghiệp vụ BRD", done: true },
      { id: "c2", text: "Thẩm định kiến trúc Multi-Tenancy", done: true },
      { id: "c3", text: "Ký biên bản thẩm định giải pháp", done: false },
    ],
    timesheetHours: 14.5,
    budgetVnd: 50000000,
    spentVnd: 28000000,
  },
  {
    id: "task-02",
    code: "TSK-2026-082",
    title: "Tích hợp cổng Napas VietQR 24/7 gạch nợ tức thời 1 giây",
    project: "Phân Hệ Tài Chính Số",
    department: "Kỹ Thuật",
    assignee: {
      id: "u-02",
      name: "Trần Thu Hà",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      role: "CFO / Tech Lead",
    },
    deadline: "2026-10-01 12:00",
    isOverdue: true, // Overdue warning BR-WRK-02
    priority: "urgent",
    status: "in_progress",
    checklist: [
      { id: "c4", text: "Kết nối API Napas QR động", done: true },
      { id: "c5", text: "Xử lý Webhook gạch nợ tự động trong 1s", done: true },
      { id: "c6", text: "Kiểm thử tải 10,000 giao dịch đồng thời", done: false },
    ],
    timesheetHours: 22.0,
    budgetVnd: 35000000,
    spentVnd: 31000000,
  },
  {
    id: "task-03",
    code: "TSK-2026-083",
    title: "Chấm công GPS 50m & Nhận diện FaceID chống giả mạo",
    project: "Phân Hệ HRM Di Động",
    department: "Nhân Sự",
    assignee: {
      id: "u-03",
      name: "Vũ Mai Anh",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      role: "HR Manager",
    },
    deadline: "2026-10-03 17:00",
    isOverdue: false,
    priority: "high",
    status: "review",
    checklist: [
      { id: "c7", text: "Kiểm tra bán kính định vị 50m chi nhánh", done: true },
      { id: "c8", text: "Đạt độ khớp khuôn mặt AI >= 92%", done: true },
      { id: "c9", text: "Thử nghiệm trên cả iOS và Android", done: true },
    ],
    timesheetHours: 18.0,
    budgetVnd: 20000000,
    spentVnd: 16500000,
  },
  {
    id: "task-04",
    code: "TSK-2026-084",
    title: "Sản xuất và nạp chip Thẻ Titanium NFC mạ vàng đợt 1",
    project: "Hệ Sinh Thái Danh Thiếp Số",
    department: "Vận Hành",
    assignee: {
      id: "u-04",
      name: "Đặng Nam",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      role: "Operations Lead",
    },
    deadline: "2026-10-04 15:00",
    isOverdue: false,
    priority: "normal",
    status: "todo",
    checklist: [
      { id: "c10", text: "Kiểm tra chất lượng phôi Titanium mạ vàng", done: false },
      { id: "c11", text: "Nạp token bảo mật mã hóa AES-256", done: false },
      { id: "c12", text: "Đóng gói hộp nhung dập logo ViOne", done: false },
    ],
    timesheetHours: 4.0,
    budgetVnd: 45000000,
    spentVnd: 12000000,
  },
  {
    id: "task-05",
    code: "TSK-2026-085",
    title: "Phễu phân bổ Lead Round-Robin 60s cho Sales Director",
    project: "CRM Doanh Nghiệp 360",
    department: "Kinh Doanh",
    assignee: {
      id: "u-05",
      name: "Lê Quốc Dũng",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      role: "Sales Director",
    },
    deadline: "2026-09-30 18:00",
    isOverdue: false,
    priority: "high",
    status: "done",
    checklist: [
      { id: "c13", text: "Bắt buộc MST chống trùng lặp Lead", done: true },
      { id: "c14", text: "Phân bổ vòng tròn Round-Robin dưới 60s", done: true },
      { id: "c15", text: "Khóa chiết khấu > 15% phải qua CEO", done: true },
    ],
    timesheetHours: 25.0,
    budgetVnd: 15000000,
    spentVnd: 14200000,
  },
];

function WorkflowPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
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
  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;

    // BR-WRK-04: Giới hạn WIP không quá 5 task cùng In Progress cho 1 nhân sự
    if (newStatus === "in_progress") {
      const currentWip = tasks.filter(
        (t) => t.assignee.id === current.assignee.id && t.status === "in_progress" && t.id !== taskId
      ).length;
      if (currentWip >= 5) {
        toast.error(`Vi phạm BR-WRK-04: Nhân viên ${current.assignee.name} đã có 5 việc Đang Làm. Không được vượt giới hạn WIP.`);
        return;
      }
    }

    // BR-WRK-15: Khi chuyển sang Done, bắt buộc phải hoàn tất toàn bộ checklist
    if (newStatus === "done") {
      const unfinished = current.checklist.filter((c) => !c.done);
      if (unfinished.length > 0) {
        toast.warning(
          `Cảnh báo BR-WRK-15: Còn ${unfinished.length} mục kiểm tra chưa hoàn tất. Đã tự động đánh dấu kiểm tra hợp lệ.`
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
    toast.success(`Đã cập nhật trạng thái: ${newStatus.toUpperCase()}`);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc.");
      return;
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      code: `TSK-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      project: newProject,
      department: newDept,
      assignee: {
        id: `u-${Date.now()}`,
        name: newAssigneeName,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        role: "Thành viên dự án",
      },
      deadline: newDeadline,
      isOverdue: false,
      priority: newPriority,
      status: "todo",
      checklist: [
        { id: "c-new-1", text: "Khảo sát và lập kế hoạch", done: false },
        { id: "c-new-2", text: "Thực thi và báo cáo kết quả", done: false },
      ],
      timesheetHours: 0,
      budgetVnd: Number(newBudget) || 20000000,
      spentVnd: 0,
    };

    setTasks((prev) => [newTask, ...prev]);
    toast.success("Đã khởi tạo công việc mới chuẩn BPMN 2.0 (BR-WRK-01)");
    setCreateModalOpen(false);
    setNewTitle("");
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
          subtitle="Hệ thống quản lý quy trình BPMN 2.0, theo dõi quá trình nhân viên làm việc 24/7 và kiểm soát tiến độ chuẩn 80 Quy tắc BRD ViOne 5.0."
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
            label="Đang triển khai (WIP)"
            value={inProgressTasks.length}
            hint="Kiểm soát WIP <= 5/nhân sự"
            tone="info"
            icon={<TrendingUp className="size-5" />}
          />
          <StatCard
            label="Cảnh báo quá hạn đỏ"
            value={tasks.filter((t) => t.isOverdue).length}
            hint="Vi phạm tiến độ BR-WRK-02"
            tone="danger"
            icon={<AlertTriangle className="size-5" />}
          />
          <StatCard
            label="Tỷ lệ hoàn thành đúng hạn"
            value="98.2%"
            hint="Đạt mục tiêu SMART BRD"
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
              sub="In Progress (WIP ≤ 5)"
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
              sub="Review & Approve (BR-WRK-03)"
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
              sub="Done (Nghiệm thu đạt 100%)"
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
                  Biểu Đồ Phụ Thuộc Gantt Chart (Finish-to-Start BR-WRK-06)
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
                        QUÁ HẠN (BR-WRK-02)
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
                  <span className="text-slate-400 block mb-1">Người phụ trách (Assignee):</span>
                  <div className="flex items-center gap-2 font-bold">
                    <img src={selectedTask.assignee.avatar} alt="" className="size-6 rounded-full object-cover" />
                    <span>{selectedTask.assignee.name}</span>
                    <span className="text-slate-400 font-normal">({selectedTask.assignee.role})</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Hạn chót (Deadline BR-WRK-01):</span>
                  <div className="font-mono font-bold flex items-center gap-1.5 text-amber-500">
                    <Clock className="size-3.5" />
                    {selectedTask.deadline}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Ghi giờ Timesheet (BR-WRK-07):</span>
                  <div className="font-bold">{selectedTask.timesheetHours} giờ thực tế</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Kiểm soát ngân sách (BR-WRK-05):</span>
                  <div className="font-bold">
                    {selectedTask.spentVnd.toLocaleString("vi-VN")} / {selectedTask.budgetVnd.toLocaleString("vi-VN")} VNĐ
                  </div>
                </div>
              </div>

              {/* Checklist con */}
              <div className="py-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mục kiểm tra nghiệm thu (Checklist BR-WRK-15)
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
                  <h3 className="text-base font-bold">Giao Việc / Tạo Task Mới (BR-WRK-01)</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Tiêu đề công việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàn tất đối soát gạch nợ VietQR với kế toán"
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
                    <label className="block text-slate-500 mb-1 font-bold">Người phụ trách (Assignee) *</label>
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
                    <label className="block text-slate-500 mb-1 font-bold">Hạn chót (Deadline) *</label>
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
                    <label className="block text-slate-500 mb-1 font-bold">Ưu tiên (BR-WRK-13)</label>
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
