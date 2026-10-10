import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Send,
  Plus,
  History,
  Trash2,
  Bot,
  User,
  ArrowRight,
  Layers,
  ShieldCheck,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  ScanLine,
  Users,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface AiChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    command?: string;
    route?: string;
  };
}

export interface AiSession {
  id: string;
  title: string;
  createdAt: string;
  messages: AiChatMessage[];
}

const STORAGE_KEY = "vione_ai_web_sessions_v2";
const DEFAULT_WELCOME = "Xin chào Lãnh đạo! Tôi là Trợ lý Doanh Nhân ViOne AI. Tôi sẵn sàng hỗ trợ điều hành công ty, giao việc, chấm công, ký duyệt hoặc điều khiển toàn bộ ứng dụng bằng giọng nói.";

const QUICK_COMMANDS = [
  { label: "🕒 Chấm công", cmd: "Chấm công vào ca" },
  { label: "✍️ Ký duyệt chi", cmd: "Mở danh sách ký duyệt" },
  { label: "📋 Giao việc mới", cmd: "Giao việc cho nhân viên" },
  { label: "📊 Xem tiến độ", cmd: "Xem tiến độ công việc" },
  { label: "📅 Lịch làm việc", cmd: "Xem lịch làm việc hôm nay" },
  { label: "📷 Quét mã QR", cmd: "Quét mã QR kết nối" },
];

export function ViOneVoiceAssistant() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load sessions from localStorage
  useEffect(() => {
    loadSessions();
  }, []);

  // Listen to open event from other components
  useEffect(() => {
    const handleOpenAi = () => setIsOpen(true);
    window.addEventListener("vione-open-ai-assistant", handleOpenAi);
    return () => window.removeEventListener("vione-open-ai-assistant", handleOpenAi);
  }, []);

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AiSession[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
      createNewSession();
    } catch {
      createNewSession();
    }
  };

  const saveSessions = (newSessions: AiSession[]) => {
    try {
      setSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.warn("Failed to save AI sessions:", e);
    }
  };

  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const initialMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "assistant",
      text: DEFAULT_WELCOME,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const newSession: AiSession = {
      id: newId,
      title: "Cuộc trò chuyện mới",
      createdAt: new Date().toISOString(),
      messages: [initialMsg],
    };
    const updated = [newSession, ...sessions.filter((s) => s.id !== newId)];
    saveSessions(updated);
    setCurrentSessionId(newId);
    setShowHistoryDrawer(false);
  };

  const clearAllHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử các cuộc trò chuyện AI?")) {
      localStorage.removeItem(STORAGE_KEY);
      setSessions([]);
      createNewSession();
      toast.success("✓ Đã xóa sạch lịch sử trò chuyện AI!");
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  // Web Speech API Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const r = new SpeechRecognition();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "vi-VN";

        r.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          setIsListening(false);
          if (text) {
            handleSend(text);
          }
        };

        r.onerror = () => {
          setIsListening(false);
        };

        r.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = r;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
        }
      } else {
        toast.info("Trình duyệt không hỗ trợ nhận diện giọng nói trực tiếp, đang mô phỏng...");
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          handleSend("Xem tiến độ công việc");
        }, 2800);
      }
    }
  };

  const executeVoiceAppCommand = (text: string): boolean => {
    const q = text.toLowerCase().trim();

    // 1. Chấm công
    if (
      q.includes("chấm công") ||
      q.includes("vào ca") ||
      q.includes("tan ca") ||
      q.includes("điểm danh")
    ) {
      triggerAppAction("🕒 Đang mở giao diện Chấm công nhân sự...", () => {
        window.dispatchEvent(new Event("vione-open-attendance"));
        navigate({ to: "/connect-app" });
      });
      return true;
    }

    // 2. Ký duyệt chi & tờ trình
    if (
      q.includes("ký duyệt") ||
      q.includes("duyệt chi") ||
      q.includes("phê duyệt") ||
      q.includes("trình ký") ||
      q.includes("duyệt đơn")
    ) {
      triggerAppAction("✍️ Đang mở danh sách Ký duyệt chi & Tờ trình...", () => {
        window.dispatchEvent(new Event("vione-open-approvals"));
        navigate({ to: "/connect-app" });
      });
      return true;
    }

    // 3. Giao việc cho nhân viên
    if (
      q.includes("giao việc") ||
      q.includes("tạo việc") ||
      q.includes("thêm việc") ||
      q.includes("phân công")
    ) {
      triggerAppAction("📋 Đang mở giao diện Giao việc & Điều hành...", () => {
        window.dispatchEvent(new Event("vione-open-workflow"));
        navigate({ to: "/connect-app" });
      });
      return true;
    }

    // 4. Tiến độ công việc / Workflow
    if (
      q.includes("tiến độ") ||
      q.includes("công việc") ||
      q.includes("quy trình") ||
      q.includes("workflow")
    ) {
      triggerAppAction("📊 Đang mở Bảng điều hành tiến độ công việc...", () => {
        window.dispatchEvent(new Event("vione-open-workflow"));
        navigate({ to: "/connect-app" });
      });
      return true;
    }

    // 5. Lịch làm việc & Hội họp
    if (
      q.includes("lịch") ||
      q.includes("họp") ||
      q.includes("thời gian biểu") ||
      q.includes("calendar")
    ) {
      triggerAppAction("📅 Đang mở Lịch làm việc & Hội họp...", () => {
        navigate({ to: "/connect-app/calendar" });
      });
      return true;
    }

    // 6. Mã QR của tôi
    if (
      q.includes("mã qr của tôi") ||
      q.includes("danh thiếp qr") ||
      q.includes("qr cá nhân") ||
      q.includes("danh thiếp số")
    ) {
      triggerAppAction("💳 Đang hiển thị Mã QR Danh thiếp số...", () => {
        navigate({ to: "/connect-app/me/card" });
      });
      return true;
    }

    // 7. Quét QR
    if (
      q.includes("quét qr") ||
      q.includes("quét mã") ||
      q.includes("scan qr")
    ) {
      triggerAppAction("📷 Đang mở chức năng quét mã QR kết nối...", () => {
        navigate({ to: "/connect-app/card-scan" });
      });
      return true;
    }

    // 8. Tin nhắn / Hộp thư
    if (q.includes("tin nhắn") || q.includes("hộp thư") || q.includes("chat")) {
      triggerAppAction("💬 Đang mở Hộp thư trò chuyện đối tác...", () => {
        navigate({ to: "/connect-app/inbox" });
      });
      return true;
    }

    // 9. Điều hướng Tab: Mạng lưới
    if (
      q.includes("mạng lưới") ||
      q.includes("kết nối") ||
      q.includes("tìm đối tác")
    ) {
      triggerAppAction("🌐 Đang chuyển sang Tab Mạng lưới đối tác...", () => {
        navigate({ to: "/connect-app/network" });
      });
      return true;
    }

    // 10. Điều hướng Tab: Cộng đồng
    if (q.includes("cộng đồng") || q.includes("liên minh")) {
      triggerAppAction("🏛️ Đang chuyển sang Tab Cộng đồng doanh nghiệp...", () => {
        navigate({ to: "/connect-app/community" });
      });
      return true;
    }

    // 11. Điều hướng Tab: Trang chủ
    if (q.includes("trang chủ") || q.includes("về trang chủ")) {
      triggerAppAction("🏠 Đang quay về Bảng điều khiển Trang chủ...", () => {
        navigate({ to: "/connect-app" });
      });
      return true;
    }

    return false;
  };

  const triggerAppAction = (msg: string, actionFn?: () => void) => {
    addMessageToCurrentSession("assistant", msg);
    setIsLoading(false);
    setTimeout(() => {
      setIsOpen(false);
      if (actionFn) actionFn();
    }, 850);
  };

  const addMessageToCurrentSession = (
    sender: "user" | "assistant",
    text: string,
    suggestedAction?: { label: string; command?: string; route?: string }
  ) => {
    if (!currentSession) return;
    const newMsg: AiChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedAction,
    };
    const updatedMessages = [...currentSession.messages, newMsg];
    const updatedSession: AiSession = {
      ...currentSession,
      title:
        currentSession.messages.length <= 1 && sender === "user"
          ? text.slice(0, 32)
          : currentSession.title,
      messages: updatedMessages,
    };
    const newSessions = sessions.map((s) => (s.id === currentSession.id ? updatedSession : s));
    saveSessions(newSessions);

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 150);
  };

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputText;
    const text = raw.trim();
    if (!text || isLoading) return;

    setInputText("");
    addMessageToCurrentSession("user", text);
    setIsLoading(true);

    // Kiểm tra điều khiển giọng nói tự thao tác chuẩn 100%
    const isHandled = executeVoiceAppCommand(text);
    if (isHandled) return;

    try {
      const res: any = await fetchNestApi("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          context: {
            platform: "vione_pwa_web",
            role: "CEO_Executive",
          },
        }),
      });

      const reply =
        res?.reply ||
        res?.data?.reply ||
        "Tôi đã ghi nhận yêu cầu của Lãnh đạo. Tôi có thể hỗ trợ điều hướng ứng dụng hoặc phân tích dữ liệu ngay.";

      addMessageToCurrentSession("assistant", reply);
    } catch {
      const fallbackReply = `Dạ thưa Lãnh đạo, em đã tiếp nhận: "${text}". Em có thể giúp Sếp thực hiện ngay các tác vụ: Giao việc nhân sự, Kiểm tra chấm công hoặc Mở bảng điều hành công việc.`;
      addMessageToCurrentSession("assistant", fallbackReply, {
        label: "Mở bảng công việc",
        command: "Mở bảng điều hành công việc",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FAB Trigger Button (Khi modal đóng)
  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-[9999]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[#F6E1C3]/80"
          title="Trợ lý Doanh Nhân ViOne AI"
          aria-label="Mở Trợ lý AI ViOne"
        >
          <Sparkles className="h-6 w-6 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white items-center justify-center">
              AI
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-all">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0B0F17] border border-[#DFB76C]/30 shadow-2xl overflow-hidden h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}
      >
        {/* Minimalist Executive Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0E1522]">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#DFB76C]/15 border border-[#DFB76C]/30 text-[#DFB76C]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Trợ Lý Doanh Nhân ViOne
              </h3>
              <p className="text-[11px] font-semibold text-[#DFB76C]">
                {isListening ? "🎙️ Đang lắng nghe giọng nói..." : "● Giọng nói sẵn sàng"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* New Chat Button */}
            <button
              type="button"
              onClick={createNewSession}
              title="Cuộc trò chuyện mới"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DFB76C]/30 bg-[#DFB76C]/10 text-[#DFB76C] hover:bg-[#DFB76C]/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* History Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              title="Lịch sử trò chuyện"
              className={`grid h-8 w-8 place-items-center rounded-lg border transition cursor-pointer ${
                showHistoryDrawer
                  ? "border-[#DFB76C] bg-[#DFB76C]/20 text-[#DFB76C]"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <History className="h-4 w-4" />
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={clearAllHistory}
              title="Xóa lịch sử"
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* History Drawer */}
        {showHistoryDrawer && (
          <div className="p-3 bg-[#121A26] border-b border-[#DFB76C]/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Lịch sử cuộc trò chuyện ({sessions.length})</span>
              <button
                type="button"
                onClick={clearAllHistory}
                className="text-rose-400 hover:underline text-[11px]"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sessions.map((s) => {
                const isSelected = s.id === currentSessionId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setCurrentSessionId(s.id);
                      setShowHistoryDrawer(false);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs text-left max-w-[140px] truncate transition cursor-pointer ${
                      isSelected
                        ? "border-[#DFB76C] bg-[#DFB76C]/15 text-[#DFB76C] font-bold"
                        : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <p className="truncate">{s.title || "Cuộc trò chuyện"}</p>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {new Date(s.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Message Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {currentSession?.messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#DFB76C]/15 border border-[#DFB76C]/30 text-[#DFB76C]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-medium rounded-br-xs shadow-md"
                      : "bg-[#121A26] border border-[#DFB76C]/20 text-slate-200 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Action Button inside AI Bubble */}
                  {msg.suggestedAction && (
                    <button
                      type="button"
                      onClick={() => {
                        if (msg.suggestedAction?.route) {
                          setIsOpen(false);
                          navigate({ to: msg.suggestedAction.route as any });
                        } else if (msg.suggestedAction?.command) {
                          handleSend(msg.suggestedAction.command);
                        }
                      }}
                      className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg border border-[#DFB76C]/50 bg-black/40 text-[#DFB76C] font-bold text-[11px] flex items-center justify-between hover:bg-black/60 active:scale-98 transition cursor-pointer"
                    >
                      <span>⚡ {msg.suggestedAction.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <span
                    className={`block text-[9.5px] mt-1 text-right ${
                      isUser ? "text-slate-900/60" : "text-slate-500"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#DFB76C]/15 border border-[#DFB76C]/30 text-[#DFB76C]">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl bg-[#121A26] border border-[#DFB76C]/20 p-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#DFB76C] animate-ping" />
                <span>Trợ lý AI đang tư duy và xử lý dữ liệu...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Command Chips */}
        <div className="px-4 py-2 bg-[#0E1522]/60 border-t border-slate-800/60">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {QUICK_COMMANDS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.cmd)}
                className="shrink-0 px-2.5 py-1 rounded-full border border-slate-800 bg-[#121A26] text-slate-300 text-[11px] font-medium hover:border-[#DFB76C]/50 hover:text-white transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Listening Active Banner */}
        {isListening && (
          <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between text-xs text-[#DFB76C]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Đang nghe giọng nói... Hãy nói: "Giao việc", "Chấm công", "Tiến độ"</span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
            >
              Dừng
            </button>
          </div>
        )}

        {/* Bottom Input Field */}
        <div className="p-3 border-t border-slate-800 bg-[#0B0F17] flex items-center gap-2">
          {/* Voice Microphone */}
          <button
            type="button"
            onClick={toggleListening}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition cursor-pointer ${
              isListening
                ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                : "border-[#DFB76C]/40 bg-[#DFB76C]/10 text-[#DFB76C] hover:bg-[#DFB76C]/20"
            }`}
            title="Nói để điều khiển ứng dụng"
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nói hoặc nhập lệnh điều hành..."
            className="flex-1 h-10 rounded-full border border-slate-800 bg-[#121A26] px-4 text-xs text-white placeholder-slate-500 outline-none focus:border-[#DFB76C]"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#DFB76C_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold transition disabled:opacity-40 cursor-pointer shadow-md"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
