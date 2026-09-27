import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  Paperclip,
  Smile,
  ShieldCheck,
  UserCheck,
  Bot,
  RefreshCw,
  Tag,
  ChevronRight,
  MoreVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Hộp thư đa kênh — ViOne CRM" },
      {
        name: "description",
        content: "Trung tâm tin nhắn đa kênh, trao đổi nội bộ phòng ban và theo dõi tiến độ công việc của công ty trên ViOne CRM.",
      },
    ],
  }),
  component: OmnichannelMessagesPage,
});

interface ChatThread {
  id: string;
  name: string;
  avatarUrl?: string | null;
  channel: "vione" | "group" | "zalo" | "web" | "email";
  department?: string;
  assignee?: string;
  status: "pending" | "in_progress" | "resolved";
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  membersCount?: number;
  isGroup?: boolean;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  isFromMe: boolean;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

const DEPARTMENT_PRESETS = [
  "Ban Giám Đốc & Điều Hành",
  "Phòng Kinh Doanh & Tiếp Thị",
  "Phòng Dự Án & Công Nghệ",
  "Khối Vận Hành & CSKH",
  "Ban Nhân Sự & Đào Tạo",
];

function OmnichannelMessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [workNotes, setWorkNotes] = useState<string>("");

  // Modal create group
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDept, setNewGroupDept] = useState(DEPARTMENT_PRESETS[0]);

  // Load threads from real backend API
  const loadThreads = async () => {
    try {
      setLoading(true);
      const res = await fetchNestApi<any>("/connect-app/dm/threads");
      const remoteThreads = Array.isArray(res) ? res : res?.threads || [];

      // Transform backend threads
      const formatted: ChatThread[] = remoteThreads.map((t: any) => ({
        id: t.threadId || t.id,
        name: t.displayName || "Khách hàng ViOne",
        avatarUrl: t.avatarUrl || null,
        channel: "vione",
        department: "Khối Kinh Doanh",
        assignee: "Chuyên viên phụ trách",
        status: t.unreadCount > 0 ? "pending" : "in_progress",
        unreadCount: t.unreadCount || 0,
        lastMessage: t.lastMessagePreview || "Chưa có tin nhắn",
        lastTime: t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong",
        phone: t.phone || undefined,
        email: t.email || undefined,
        company: t.companyName || undefined,
        title: t.headline || undefined,
        isGroup: false,
      }));

      // Load locally created department groups from localStorage if any
      const localGroupsRaw = localStorage.getItem("vione_crm_groups");
      let localGroups: ChatThread[] = [];
      if (localGroupsRaw) {
        try {
          localGroups = JSON.parse(localGroupsRaw);
        } catch {}
      }

      const defaultThreads: ChatThread[] = [
        {
          id: "dept-exec",
          name: "Ban Giám Đốc & Điều Hành ViOne",
          channel: "group",
          department: "Ban Giám Đốc & Điều Hành",
          assignee: "Phạm Văn Vũ (Admin)",
          status: "in_progress",
          unreadCount: 3,
          lastMessage: "Đã phê duyệt kế hoạch giao thương B2B quý 4/2026",
          lastTime: "10:15",
          membersCount: 8,
          isGroup: true,
        },
        {
          id: "dept-sales",
          name: "Khối Kinh Doanh & Tiếp Thị ViOne",
          channel: "group",
          department: "Phòng Kinh Doanh & Tiếp Thị",
          assignee: "Trưởng phòng Kinh Doanh",
          status: "in_progress",
          unreadCount: 1,
          lastMessage: "Báo cáo tiếp cận 33 hội viên doanh nghiệp tuần này",
          lastTime: "09:30",
          membersCount: 12,
          isGroup: true,
        },
        {
          id: "cust-1",
          name: "Hoàng Thanh Tuấn",
          company: "Công ty CP Đầu Tư & Xây Dựng Tuấn Hoàng",
          title: "Tổng Giám Đốc",
          channel: "vione",
          department: "Khối Kinh Doanh",
          assignee: "Phạm Văn Vũ",
          status: "pending",
          unreadCount: 2,
          lastMessage: "Xin chào ViOne, công ty tôi muốn đăng ký gian hàng B2B VIP",
          lastTime: "08:45",
          phone: "0912 345 678",
          email: "tuan.hoang@tuanhoang.vn",
          isGroup: false,
        },
        {
          id: "cust-2",
          name: "Hoàng Thị Ngọc Ánh",
          company: "Tập Đoàn Dược Phẩm Ánh Dương",
          title: "Chủ Tịch HĐQT",
          channel: "vione",
          department: "Khối Kinh Doanh",
          assignee: "Chuyên viên tư vấn",
          status: "resolved",
          unreadCount: 0,
          lastMessage: "Đã nhận được hóa đơn điện tử gia hạn thẻ Titanium",
          lastTime: "Hôm qua",
          phone: "0988 765 432",
          email: "anh.hoang@anhduongpharma.vn",
          isGroup: false,
        },
      ];

      const allThreads = (localGroups.length > 0 || formatted.length > 0) ? [...localGroups, ...formatted] : defaultThreads;
      setThreads(allThreads);
      if (allThreads.length > 0 && !selectedThreadId) {
        setSelectedThreadId(allThreads[0].id);
      }
    } catch {
      toast.error("Không thể tải danh sách hộp thư. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  // Load messages when selectedThread changes
  useEffect(() => {
    if (!activeThread) return;
    const fetchMessages = async () => {
      if (activeThread.isGroup) {
        // Group messages from memory / local
        const storedKey = `vione_msgs_${activeThread.id}`;
        const stored = localStorage.getItem(storedKey);
        if (stored) {
          try {
            setMessages(JSON.parse(stored));
            return;
          } catch {}
        }
        setMessages([
          {
            id: "sys-1",
            senderName: "Hệ thống ViOne",
            content: `Chào mừng thành viên gia nhập nhóm "${activeThread.name}". Nhóm nội bộ dùng để phân công công việc và theo dõi tiến độ hoàn thành mục tiêu.`,
            isFromMe: false,
            timestamp: "08:30",
            isSystem: true,
          },
          {
            id: "sys-2",
            senderName: activeThread.assignee || "Quản trị viên",
            content: activeThread.lastMessage || "Xin chào cả nhóm, chúng ta cùng đẩy mạnh tiến độ nhé!",
            isFromMe: false,
            timestamp: activeThread.lastTime || "09:00",
          },
        ]);
      } else {
        try {
          const res = await fetchNestApi<any>(`/connect-app/dm/threads/${activeThread.id}`);
          if (res?.messages && Array.isArray(res.messages) && res.messages.length > 0) {
            setMessages(
              res.messages.map((m: any) => ({
                id: m.id,
                senderName: m.senderUserId === user?.id ? "Tôi" : activeThread.name,
                isFromMe: m.senderUserId === user?.id,
                content: m.body || "",
                timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
              }))
            );
          } else {
            setMessages([
              {
                id: "msg-seed-1",
                senderName: activeThread.name,
                isFromMe: false,
                content: activeThread.lastMessage || "Xin chào ViOne CRM, tôi muốn đăng ký kết nối B2B và mở gian hàng trên sàn Marketplace.",
                timestamp: activeThread.lastTime || "08:45",
              },
            ]);
          }
        } catch {
          setMessages([
            {
              id: "msg-seed-1",
              senderName: activeThread.name,
              isFromMe: false,
              content: activeThread.lastMessage || "Xin chào ViOne CRM, tôi muốn đăng ký kết nối B2B.",
              timestamp: activeThread.lastTime || "08:45",
            },
          ]);
        }
      }
    };
    fetchMessages();
  }, [activeThread?.id, user?.id]);

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.company && t.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.lastMessage && t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchChannel =
        selectedChannel === "all" ||
        (selectedChannel === "group" && t.isGroup) ||
        (selectedChannel === "vione" && !t.isGroup);

      const matchStatus =
        statusFilter === "all" || t.status === statusFilter;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [threads, searchQuery, selectedChannel, statusFilter]);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeThread) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: "Tôi",
      isFromMe: true,
      content: replyText.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyText("");
    setAiSuggestion(null);

    // Save
    if (activeThread.isGroup) {
      const storedKey = `vione_msgs_${activeThread.id}`;
      const updated = [...messages, newMsg];
      localStorage.setItem(storedKey, JSON.stringify(updated));
    } else {
      try {
        await fetchNestApi(`/connect-app/dm/threads/${activeThread.id}/messages`, {
          method: "POST",
          body: JSON.stringify({
            body: newMsg.content,
            clientToken: `token-${Date.now()}`,
          }),
        });
      } catch {
        toast.error("Gửi tin nhắn thất bại");
      }
    }
  };

  const handleGenerateAiResponse = () => {
    setIsAiSuggesting(true);
    setTimeout(() => {
      const suggestions = [
        `Dạ chào Anh/Chị, em đã ghi nhận yêu cầu và sẽ phối hợp cùng phòng ban để gửi báo giá chi tiết trong vòng 30 phút tới ạ!`,
        `Kính gửi Quý đối tác, ViOne rất hân hạnh được hợp tác. Em đã phân công chuyên viên phụ trách liên hệ trực tiếp qua số ${activeThread?.phone || "điện thoại"} để trao đổi cụ thể.`,
        `Xin chào! Tiến độ công việc của dự án hiện đang đúng lộ trình đạt 85%. Em gửi báo cáo cập nhật đính kèm để Quý công ty theo dõi.`,
      ];
      const randomSugg = suggestions[Math.floor(Math.random() * suggestions.length)];
      setAiSuggestion(randomSugg);
      setIsAiSuggesting(false);
    }, 600);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm nội bộ");
      return;
    }
    const newGroup: ChatThread = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      channel: "group",
      department: newGroupDept,
      assignee: user?.email || "Ban Quản Trị",
      status: "in_progress",
      unreadCount: 0,
      lastMessage: "Đã tạo nhóm nội bộ thành công",
      lastTime: "Vừa xong",
      membersCount: 5,
      isGroup: true,
    };

    const updated = [newGroup, ...threads];
    setThreads(updated);
    setSelectedThreadId(newGroup.id);

    // Persist to local groups
    const localGroupsRaw = localStorage.getItem("vione_crm_groups");
    let currentLocal: ChatThread[] = [];
    if (localGroupsRaw) {
      try {
        currentLocal = JSON.parse(localGroupsRaw);
      } catch {}
    }
    localStorage.setItem("vione_crm_groups", JSON.stringify([newGroup, ...currentLocal]));

    toast.success(`Đã tạo nhóm "${newGroup.name}" thành công!`);
    setNewGroupName("");
    setIsCreateGroupOpen(false);
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-64px)] flex-col bg-slate-50 dark:bg-[#070b14] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F6E1C3] to-[#C29B69] text-black shadow-md shadow-amber-500/10">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Hộp Thư Đa Kênh & Theo Dõi Tiến Độ</span>
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">
                  ViOne CRM
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý giao tiếp khách hàng, hội thoại phòng ban và giám sát hoạt động làm việc của nhân viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-4 py-2 text-xs font-bold text-black shadow-md transition hover:opacity-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Nhóm Nội Bộ / Phòng Ban</span>
            </button>
            <button
              type="button"
              onClick={loadThreads}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131c31] p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Thread List */}
          <div className="flex w-80 md:w-96 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424]">
            {/* Search and Filters */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm khách hàng, phòng ban..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Channel filter tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedChannel("all")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                    selectedChannel === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Tất cả ({threads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel("group")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                    selectedChannel === "group"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  👥 Phòng ban
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel("vione")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                    selectedChannel === "vione"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ⚡ ViOne Connect
                </button>
              </div>
            </div>

            {/* Thread list scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Đang đồng bộ dữ liệu...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Không tìm thấy cuộc trò chuyện nào
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = thread.id === activeThread?.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`flex items-start gap-3 p-3.5 cursor-pointer transition select-none ${
                        isSelected
                          ? "bg-amber-500/10 border-l-4 border-amber-500 dark:bg-amber-500/5"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {thread.avatarUrl ? (
                          <img
                            src={thread.avatarUrl}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-700 ${
                            thread.isGroup
                              ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}>
                            {thread.isGroup ? <Users className="h-5 w-5" /> : thread.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {thread.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {thread.name}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {thread.lastTime}
                          </span>
                        </div>

                        {thread.title && (
                          <p className="truncate text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            {thread.title}
                          </p>
                        )}

                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {thread.lastMessage}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600 dark:text-slate-300">
                            {thread.isGroup ? "Nhóm nội bộ" : "Khách hàng"}
                          </span>
                          {thread.department && (
                            <span className="rounded-md bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-[9.5px] font-medium text-blue-600 dark:text-blue-400">
                              {thread.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Column: Chat Conversation Stream */}
          <div className="flex flex-1 flex-col bg-slate-100/50 dark:bg-[#070b14]">
            {activeThread ? (
              <>
                {/* Conversation Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {activeThread.avatarUrl ? (
                        <img
                          src={activeThread.avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold">
                          {activeThread.isGroup ? <Users className="h-4 w-4" /> : activeThread.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0d1424]" />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{activeThread.name}</span>
                        {activeThread.isGroup && (
                          <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.2 text-[10px] font-semibold">
                            {activeThread.membersCount || 5} thành viên
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {activeThread.company && <span>{activeThread.company}</span>}
                        {activeThread.title && <span>• {activeThread.title}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiResponse}
                      disabled={isAiSuggesting}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>{isAiSuggesting ? "AI đang soạn..." : "AI Gợi Ý Phản Hồi"}</span>
                    </button>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Bắt đầu cuộc trò chuyện với {activeThread.name}
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (msg.isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-400 text-center max-w-md">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.isFromMe ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-1 px-1">
                            {msg.senderName} • {msg.timestamp}
                          </span>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              msg.isFromMe
                                ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black font-medium shadow-xs"
                                : "bg-white dark:bg-[#131c31] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xs"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* AI Suggestion Bar if active */}
                {aiSuggestion && (
                  <div className="p-3 mx-4 mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 animate-in fade-in">
                    <div className="flex items-start gap-2 text-xs">
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-300">ViOne AI Gợi Ý: </span>
                        <span className="text-slate-700 dark:text-slate-300">{aiSuggestion}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyText(aiSuggestion);
                          setAiSuggestion(null);
                        }}
                        className="rounded-lg bg-amber-500 text-black px-2.5 py-1 text-xs font-bold hover:brightness-105"
                      >
                        Áp dụng
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSuggestion(null)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input Box */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424]">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] px-3 py-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Nhập tin nhắn phản hồi, trao đổi công việc..."
                      className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!replyText.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                Chọn một cuộc trò chuyện để bắt đầu
              </div>
            )}
          </div>

          {/* Right Column: Customer Info & Work Tracking */}
          {activeThread && (
            <div className="hidden xl:flex w-80 shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] p-4 overflow-y-auto space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeThread.isGroup ? "Thông Tin Nhóm Phòng Ban" : "Hồ Sơ & Theo Dõi Tiến Độ"}
              </h3>

              {/* Profile card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131c31] p-4 text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-lg font-bold">
                  {activeThread.avatarUrl ? (
                    <img src={activeThread.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    activeThread.name.charAt(0)
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeThread.name}</h4>
                {activeThread.title && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">{activeThread.title}</p>
                )}
                {activeThread.company && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeThread.company}</p>
                )}
              </div>

              {/* Contact details */}
              <div className="space-y-2 text-xs">
                {activeThread.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <span className="font-mono">{activeThread.phone}</span>
                  </div>
                )}
                {activeThread.email && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>{activeThread.email}</span>
                  </div>
                )}
              </div>

              {/* Work management panel */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                  <span>Quản Lý Công Việc & Tiến Độ</span>
                </h4>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nhân viên phụ trách:</label>
                  <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white">
                    <option>{user?.email || "Chuyên viên quản lý"}</option>
                    <option>Nguyễn Văn Quản Trị</option>
                    <option>Trần Thị Hỗ Trợ</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Trạng thái xử lý:</label>
                  <select
                    value={activeThread.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setThreads((prev) =>
                        prev.map((t) => (t.id === activeThread.id ? { ...t, status: newStatus } : t))
                      );
                      toast.success("Đã cập nhật trạng thái làm việc!");
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="pending">⏳ Chờ xử lý</option>
                    <option value="in_progress">⚡ Đang tương tác & làm việc</option>
                    <option value="resolved">✅ Đã hoàn thành / Chốt deal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ghi chú tiến độ:</label>
                  <textarea
                    rows={3}
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    placeholder="Ghi chú kết quả cuộc trao đổi, nhiệm vụ tiếp theo..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => toast.success("Đã lưu ghi chú công việc thành công!")}
                    className="mt-1 w-full rounded-lg bg-slate-200 dark:bg-slate-700 py-1 text-[11px] font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                  >
                    Lưu ghi chú
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo Nhóm Nội Bộ / Phòng Ban */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <span>Tạo Nhóm Nội Bộ / Phòng Ban</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên nhóm hoặc dự án:
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Đội Dự Án Chuyển Đổi Số ViOne"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Khối phòng ban phụ trách:
                </label>
                <select
                  value={newGroupDept}
                  onChange={(e) => setNewGroupDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131c31] px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {DEPARTMENT_PRESETS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                💡 Nhóm nội bộ cho phép toàn bộ nhân viên trong công ty trao đổi bảo mật, giao việc và theo dõi hiệu suất làm việc theo thời gian thực.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-5 py-2 text-xs font-bold text-black shadow-md hover:opacity-95 transition"
              >
                Tạo Nhóm Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
