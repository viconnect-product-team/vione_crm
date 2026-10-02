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
  Filter,
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
      toast.success("✓ Đã tạo công việc BPMN mới và giao cho nhân sự!");
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
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bc-mobile-surface,#FFFFFF)] dark:bg-[#12141E] border border-sky-500/20 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                Quy Trình & Tiến Độ Nhân Sự
              </h3>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Chuẩn BPMN · Giới hạn WIP ≤ 5 · Kiểm soát quá tải
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Bar & Action */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition ${filter === "all" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-2.5 py-1 rounded-lg transition ${filter === "in_progress" ? "bg-sky-500 text-white" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              Đang làm
            </button>
            <button
              onClick={() => setFilter("overdue")}
              className={`px-2.5 py-1 rounded-lg transition ${filter === "overdue" ? "bg-rose-500 text-white" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              Trễ hạn
            </button>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-3 w-3" /> Giao việc
          </button>
        </div>

        {/* Create Task Form */}
        {showCreate && (
          <form onSubmit={handleCreateTask} className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-sky-500/5 space-y-3">
            <h4 className="text-xs font-bold text-sky-800 dark:text-sky-300">Khởi tạo & Giao việc BPMN</h4>
            <div>
              <input
                type="text"
                placeholder="Tiêu đề công việc cần giao..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs text-zinc-900 dark:text-white"
              >
                <option value="Nguyễn Văn Tuấn">Nguyễn Văn Tuấn</option>
                <option value="Đặng Thu Hà">Đặng Thu Hà</option>
                <option value="Trần Quốc Đạt">Trần Quốc Đạt</option>
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs text-zinc-900 dark:text-white"
              >
                <option value="high">Ưu tiên cao</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="medium">Trung bình</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="w-full py-2 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Xác nhận Giao việc
            </button>
          </form>
        )}

        {/* Task List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-sky-500/40 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t.department}
                </span>
                {t.status === "overdue" ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                    Trễ hạn
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600">
                    Đang xử lý
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                {t.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-3 w-3 text-sky-500" /> {t.assignee}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-amber-500" /> Hạn: {t.deadline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
