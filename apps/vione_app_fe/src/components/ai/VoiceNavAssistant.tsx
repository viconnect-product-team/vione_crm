import { useState, useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Mic,
  MicOff,
  X,
  Sparkles,
  Calendar,
  ShoppingBag,
  Handshake,
  Users,
  Newspaper,
  CreditCard,
  QrCode,
  User,
  MessageSquare,
  Home,
  CheckCircle2,
  Volume2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export const VOICE_AI_STORAGE_KEY = "vione_voice_ai_enabled";
export const VOICE_AI_EVENT_NAME = "vione-voice-ai-toggle";

export function isVoiceAiEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(VOICE_AI_STORAGE_KEY);
  return val !== "false";
}

export function setVoiceAiEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_AI_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(VOICE_AI_EVENT_NAME));
}

interface NavCategory {
  id: string;
  name: string;
  route: string;
  icon: typeof Calendar;
  keywords: string[];
  reply: string;
}

const CATEGORIES: NavCategory[] = [
  {
    id: "events",
    name: "Sự kiện",
    route: "/association/events",
    icon: Calendar,
    keywords: [
      "sự kiện",
      "su kien",
      "lịch sự kiện",
      "lich su kien",
      "event",
      "events",
      "đăng ký sự kiện",
      "hội nghị",
      "gala",
      "workshop",
      "tọa đàm",
      "đại hội",
    ],
    reply: "Đang mở danh sách Sự kiện hiệp hội...",
  },
  {
    id: "products",
    name: "Sản phẩm & Marketplace",
    route: "/association/products",
    icon: ShoppingBag,
    keywords: [
      "sản phẩm",
      "san pham",
      "chợ",
      "gian hàng",
      "marketplace",
      "mua sắm",
      "bán hàng",
      "dịch vụ",
      "hàng hóa",
      "b2b",
    ],
    reply: "Đang chuyển đến Gian hàng & Sản phẩm Marketplace...",
  },
  {
    id: "trade",
    name: "Cơ hội giao thương",
    route: "/connect-app",
    icon: Handshake,
    keywords: [
      "giao thương",
      "giao thuong",
      "cơ hội",
      "co hoi",
      "kết nối",
      "ket noi",
      "cộng đồng",
      "cong dong",
      "business connect",
      "b2b match",
      "hợp tác",
    ],
    reply: "Đang mở Cơ hội giao thương và Kết nối kinh doanh...",
  },
  {
    id: "members",
    name: "Hội viên & Danh bạ",
    route: "/association/members",
    icon: Users,
    keywords: [
      "hội viên",
      "hoi vien",
      "thành viên",
      "thanh vien",
      "danh bạ",
      "danh ba",
      "doanh nhân",
      "doanh nghiep",
      "tìm đối tác",
    ],
    reply: "Đang mở Danh bạ Hội viên Doanh nhân...",
  },
  {
    id: "news",
    name: "Tin tức & Thông báo",
    route: "/association/news",
    icon: Newspaper,
    keywords: [
      "tin tức",
      "tin tuc",
      "bản tin",
      "thông báo",
      "thong bao",
      "bài viết",
      "tin mới",
      "news",
    ],
    reply: "Đang mở Tin tức & Bản tin hoạt động...",
  },
  {
    id: "fees",
    name: "Hội phí & Tài chính",
    route: "/association/fees",
    icon: CreditCard,
    keywords: [
      "hội phí",
      "hoi phi",
      "đóng phí",
      "dong phi",
      "thanh toán",
      "thanh toan",
      "hóa đơn",
      "hoa don",
      "tài chính",
      "tai chinh",
      "phí thường niên",
    ],
    reply: "Đang chuyển đến Tra cứu & Đóng Hội phí...",
  },
  {
    id: "checkin",
    name: "Quét QR / Check-in",
    route: "/association/checkin",
    icon: QrCode,
    keywords: [
      "quét qr",
      "quet qr",
      "checkin",
      "check in",
      "điểm danh",
      "diem danh",
      "mã qr",
      "qr code",
      "vé sự kiện",
    ],
    reply: "Đang mở tính năng Quét mã QR Check-in...",
  },
  {
    id: "messages",
    name: "Tin nhắn & Chat",
    route: "/association/messages",
    icon: MessageSquare,
    keywords: [
      "tin nhắn",
      "tin nhan",
      "chat",
      "trò chuyện",
      "tro chuyen",
      "nhắn tin",
      "nhan tin",
      "inbox",
      "hộp thư",
    ],
    reply: "Đang mở Hộp thư trò chuyện...",
  },
  {
    id: "profile",
    name: "Cá nhân & Cài đặt",
    route: "/association/profile",
    icon: User,
    keywords: [
      "cá nhân",
      "ca nhan",
      "hồ sơ",
      "ho so",
      "tài khoản",
      "tai khoan",
      "cài đặt",
      "cai dat",
      "profile",
      "thông tin của tôi",
    ],
    reply: "Đang chuyển về Trang Cá nhân & Cài đặt...",
  },
  {
    id: "home",
    name: "Trang chủ",
    route: "/association",
    icon: Home,
    keywords: [
      "trang chủ",
      "trang chu",
      "về trang chủ",
      "ve trang chu",
      "màn hình chính",
      "home",
      "hiệp hội",
    ],
    reply: "Đang quay trở về Trang chủ...",
  },
];

function speakFeedback(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures
  }
}

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function VoiceNavAssistant() {
  const [enabled, setEnabled] = useState(() => isVoiceAiEnabled());
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [matchedCat, setMatchedCat] = useState<NavCategory | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Lắng nghe sự kiện bật/tắt từ Tab Cá nhân
  useEffect(() => {
    const handleToggle = () => {
      setEnabled(isVoiceAiEnabled());
    };
    window.addEventListener(VOICE_AI_EVENT_NAME, handleToggle);
    return () => window.removeEventListener(VOICE_AI_EVENT_NAME, handleToggle);
  }, []);

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "vi-VN";

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage("Đang lắng nghe giọng nói của bạn...");
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let currentText = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);

      // Thử nhận diện danh mục ngay khi có văn bản
      handleMatchCommand(currentText, false);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setStatusMessage("Vui lòng cấp quyền Microphone để ra lệnh bằng giọng nói.");
        toast.error("Trình duyệt chưa được cấp quyền micro.");
      } else if (event.error === "no-speech") {
        setStatusMessage("Chưa nghe rõ khẩu lệnh. Vui lòng bấm micro và nói lại nhé!");
      } else {
        setStatusMessage("Không nhận diện được giọng nói. Thử lại nhé!");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  const handleMatchCommand = (rawSpeech: string, executeImmediately = true) => {
    if (!rawSpeech.trim()) return;

    const normalizedSpeech = normalizeVietnamese(rawSpeech);

    let found: NavCategory | null = null;
    for (const cat of CATEGORIES) {
      for (const kw of cat.keywords) {
        const normKw = normalizeVietnamese(kw);
        if (normalizedSpeech.includes(normKw)) {
          found = cat;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      setMatchedCat(found);
      setStatusMessage(`✨ ${found.reply}`);

      if (executeImmediately) {
        speakFeedback(found.reply);
        setTimeout(() => {
          setIsOpen(false);
          setMatchedCat(null);
          setTranscript("");
          setStatusMessage(null);
          void navigate({ to: found.route as any });
        }, 1100);
      }
    } else if (executeImmediately) {
      setStatusMessage(`Không tìm thấy danh mục phù hợp với "${rawSpeech}". Bạn hãy thử nói "Mở sự kiện" hoặc "Xem sản phẩm" nhé!`);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.info("Trình duyệt này không hỗ trợ Speech Recognition. Bạn có thể chọn nhanh bên dưới.");
      return;
    }
    try {
      recognitionRef.current.abort();
    } catch {}
    try {
      recognitionRef.current.start();
    } catch (e) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
    setStatusMessage("Bấm vào Micro hoặc nói: \"Mở sự kiện\", \"Xem sản phẩm\", \"Hội phí\"...");
    setTimeout(() => {
      startListening();
    }, 250);
  };

  const handleDirectNavigate = (cat: NavCategory) => {
    speakFeedback(cat.reply);
    setMatchedCat(cat);
    setStatusMessage(`✨ ${cat.reply}`);
    setTimeout(() => {
      setIsOpen(false);
      setMatchedCat(null);
      setTranscript("");
      setStatusMessage(null);
      void navigate({ to: cat.route as any });
    }, 600);
  };

  const handleDismissRobot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnabled(false);
    setVoiceAiEnabled(false);
    toast.info("Đã ẩn Trợ lý AI. Bạn có thể bật lại bất kỳ lúc nào tại Tab Cá nhân.", {
      action: {
        label: "Bật lại",
        onClick: () => {
          setEnabled(true);
          setVoiceAiEnabled(true);
        },
      },
    });
  };

  if (!enabled) return null;

  return (
    <>
      {/* ── ROBOT RUNG RẮC NỔI Ở TẤT CẢ MÀN HÌNH ── */}
      <div
        className="fixed bottom-24 right-3 sm:bottom-28 sm:right-5 z-50 flex flex-col items-end pointer-events-auto select-none"
        style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))" }}
      >
        <div className="relative group">
          {/* Nút X nhỏ để đóng / tắt linh hoạt */}
          <button
            type="button"
            onClick={handleDismissRobot}
            title="Đóng trợ lý AI (Có thể bật lại ở Tab Cá nhân)"
            aria-label="Đóng trợ lý AI"
            className="absolute -top-1.5 -left-1.5 z-20 grid h-5 w-5 place-items-center rounded-full bg-slate-900/90 text-slate-300 border border-amber-400/60 shadow-md hover:text-white hover:bg-rose-600 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Cụm Robot Icon Rung Rinh (Wobble Animation) */}
          <button
            type="button"
            onClick={handleOpenAssistant}
            title="Chạm để ra lệnh giọng nói điều hướng AI"
            aria-label="Mở Trợ lý giọng nói AI"
            className="animate-robot-wobble relative flex items-center justify-center h-14 w-14 sm:h-15 sm:w-15 rounded-2xl bg-gradient-to-br from-[#0B2F64] via-[#003B95] to-[#040C20] border-2 border-amber-400 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {/* Robot Face SVG Graphic */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Antenna */}
              <div className="flex flex-col items-center -mt-1 mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="h-1 w-0.5 bg-amber-400" />
              </div>
              {/* Face Box */}
              <div className="relative flex flex-col items-center justify-center w-8 h-6 rounded-md bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-400/80 p-0.5 shadow-inner">
                {/* Glowing Eyes */}
                <div className="flex items-center justify-between w-full px-1 pt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                </div>
                {/* Smile / Voice Wave */}
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <span className="h-0.5 w-1 rounded-full bg-amber-400" />
                  <span className="h-1 w-1.5 rounded-full bg-amber-300" />
                  <span className="h-0.5 w-1 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            {/* Mic Badge ở góc */}
            <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md border border-white/40">
              <Mic className="h-3 w-3 fill-current" />
            </div>

            {/* Glow Aura */}
            <span className="absolute -inset-1 rounded-2xl bg-amber-400/20 blur-sm pointer-events-none -z-10" />
          </button>
        </div>
      </div>

      {/* ── MODAL / POPOVER ĐIỀU KHIỂN GIỌNG NÓI AI ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0c121e] border border-amber-400/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-white animate-in slide-in-from-bottom-6 duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-[#003B95]/10 via-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#003B95] to-[#0B2F64] text-amber-300 border border-amber-400/50 shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Trợ lý AI Giọng Nói ViOne</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ra lệnh rảnh tay để điều hướng nhanh các danh mục
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Voice Visualizer / Big Mic Action Area */}
            <div className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-transparent via-amber-500/5 to-transparent">
              {/* Glowing Pulse Mic Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative grid h-20 w-20 place-items-center rounded-full transition-all cursor-pointer ${
                  isListening
                    ? "animate-robot-listening bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                    : "bg-gradient-to-tr from-[#003B95] via-[#0B2F64] to-[#040C20] text-amber-300 border-2 border-amber-400 shadow-xl hover:scale-105"
                }`}
                aria-label={isListening ? "Dừng ghi âm" : "Bắt đầu nói"}
              >
                {isListening ? (
                  <Mic className="h-9 w-9 animate-bounce" />
                ) : (
                  <MicOff className="h-9 w-9" />
                )}
              </button>

              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {isListening ? "🔴 Đang nghe bạn nói..." : "Bấm Micro để bắt đầu ra lệnh"}
              </p>

              {/* Real-time transcript bubble */}
              <div className="mt-3 min-h-12 w-full rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3 flex items-center justify-center">
                {transcript ? (
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Ví dụ: "Mở sự kiện", "Vào xem sản phẩm", "Kiểm tra hội phí"...
                  </p>
                )}
              </div>

              {/* Status or Success Notification */}
              {statusMessage && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            {/* Quick-tap Navigation Pill Suggestions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Hoặc bấm nhanh danh mục:
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Hỗ trợ tiếng Việt 100%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-48 pr-1">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = currentPath === cat.route;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleDirectNavigate(cat)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
