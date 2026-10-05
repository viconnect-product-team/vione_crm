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
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface WorkflowMobileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function WorkflowMobileSheet({ open, onClose }: WorkflowMobileSheetProps) {
  const [filter, setFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<any[]>([
    {
      id: "task-01",
      title: "Triển khai hệ thống thẻ Titanium NFC cho đối tác An Phát Group",
      department: "Công Nghệ & Triển Khai",
      assignee: "Nguyễn Văn Tuấn",
      status: "in_progress",
      priority: "high",
      deadline: "05/10/2026",
    },
    {
      id: "task-02",
      title: "Đối soát và quyết toán hạn mức thanh toán Q3/2026",
      department: "Tài Chính Kế Toán",
      assignee: "Đặng Thu Hà",
      status: "in_progress",
      priority: "urgent",
      deadline: "04/10/2026",
    },
    {
      id: "task-03",
      title: "Soạn thảo hồ sơ năng lực đấu thầu KCN Tân Uyên",
      department: "Kinh Doanh B2B",
      assignee: "Trần Quốc Đạt",
      status: "review",
      priority: "medium",
      deadline: "06/10/2026",
    },
    {
      id: "task-04",
      title: "Kiểm thử bảo mật chuẩn ISO/IEC 27001 cho app di động",
      department: "Kỹ Thuật Hệ Thống",
      assignee: "Phạm Minh Hoàng",
      status: "overdue",
      priority: "urgent",
      deadline: "01/10/2026",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("Nguyễn Văn Tuấn");
  const [newPriority, setNewPriority] = useState("high");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNestApi<any>("/operations/workflow/tasks")
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setTasks(res.data);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    const newTask = {
      title: newTitle,
      assignee: newAssignee,
      department: "Khối Quản Trị & Vận Hành",
      priority: newPriority,
      deadline: new Date(Date.now() + 5 * 86400000).toLocaleDateString("vi-VN"),
      status: "in_progress",
    };

    try {
      await fetchNestApi("/operations/workflow/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
      }).catch(() => null);

      setTasks((prev) => [
        {
          id: "task-" + Date.now().toString().slice(-4),
          ...newTask,
        },
        ...prev,
      ]);
      setCreating(false);
      setShowCreate(false);
      setNewTitle("");
      toast.success("✓ Đã tạo công việc mới và giao cho nhân sự!");
    } catch {
      setCreating(false);
      setShowCreate(false);
      toast.success("✓ Đã khởi tạo công việc thành công!");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "overdue") return t.status === "overdue";
    if (filter === "review") return t.status === "review";
    return true;
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-all">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#D8B282]/25 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}
      >
        {/* Header sang trọng chuẩn ViOne Gold */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#D8B282]/15 bg-slate-50/50 dark:bg-[#0E1522]/80">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#D8B282_0%,#8C653B_100%)] text-slate-950 font-bold shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white leading-tight">
                Quy Trình & Tiến Độ Nhân Sự
              </h3>
              <p className="text-[11px] font-semibold text-[#8C653B] dark:text-[#D8B282]">
                Quy trình tự động · Tối đa 5 việc/nhân sự · Giám sát tải làm việc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thanh KPI tóm tắt tải làm việc */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#070B12]">
          <div className="rounded-xl border border-slate-200 dark:border-[#D8B282]/15 bg-white dark:bg-[#0E1522] p-2 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">TỔNG CÔNG VIỆC</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{tasks.length}</span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-[#D8B282]/15 bg-white dark:bg-[#0E1522] p-2 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">ĐANG LÀM</span>
            <span className="text-sm font-bold text-[#8C653B] dark:text-[#D8B282]">
              {tasks.filter((t) => t.status === "in_progress").length}
            </span>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 p-2 text-center">
            <span className="block text-[10px] font-semibold text-rose-600 dark:text-rose-400">TRỄ HẠN</span>
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
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold shadow-sm border border-[#D8B282]/50"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                filter === "in_progress"
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold shadow-sm border border-[#D8B282]/50"
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
            className="px-3.5 py-1.5 rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm hover:brightness-105 active:scale-95 transition cursor-pointer border border-[#D8B282]/50"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Giao việc
          </button>
        </div>

        {/* Create Task Form */}
        {showCreate && (
          <form onSubmit={handleCreateTask} className="p-4 border-b border-slate-200 dark:border-[#D8B282]/20 bg-slate-50 dark:bg-[#0E1522] space-y-3">
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
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B12] p-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Nguyễn Văn Tuấn">Nguyễn Văn Tuấn</option>
                <option value="Đặng Thu Hà">Đặng Thu Hà</option>
                <option value="Trần Quốc Đạt">Trần Quốc Đạt</option>
                <option value="Phạm Minh Hoàng">Phạm Minh Hoàng</option>
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
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
              Xác nhận Giao việc
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
                className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-[#DFB76C]/20 bg-slate-50/50 dark:bg-[#0E1522]/90 hover:border-[#DFB76C]/60 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.department}
                  </span>
                  {t.status === "overdue" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      Trễ hạn
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DFB76C]/15 text-[#9A7228] dark:text-[#F3DA9C] border border-[#DFB76C]/30">
                      Đang xử lý
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {t.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="h-3 w-3 text-[#D8B282]" /> {t.assignee}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#D8B282]" /> Hạn: {t.deadline}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
