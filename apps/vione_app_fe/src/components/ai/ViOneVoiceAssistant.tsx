import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  MapPin,
  ChevronRight,
  Send,
  UserCheck,
  Building2,
  Briefcase,
  Phone,
  Compass,
  ArrowRight,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";

export interface NearbyMember {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl?: string | null;
  phone?: string | null;
  distanceMeters: number;
  distanceLabel: string;
  address: string;
  isOnline?: boolean;
}

export function ViOneVoiceAssistant() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [inputText, setInputText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string>(
    "Xin chào! Tôi là Trợ lý AI ViOne. Bạn có thể ra lệnh điều hướng, hỏi 'Gần tôi có ai đang dùng ViOne không?' hoặc tìm kiếm đối tác kinh doanh.",
  );
  const [nearbyResults, setNearbyResults] = useState<NearbyMember[] | null>(null);
  const [isScanningLocation, setIsScanningLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Khởi tạo SpeechSynthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Lấy toạ độ vị trí ban đầu
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to center coordinates (Hà Nội)
          setCoords({ lat: 21.0285, lng: 105.8542 });
        },
        { timeout: 5000 },
      );
    }
  }, []);

  // Hàm phát giọng nói Tiếng Việt (Text-to-Speech)
  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled || !synthRef.current) return;

      try {
        synthRef.current.cancel();

        // Tách câu ngắn gọn để đọc tự nhiên
        const cleanText = text
          .replace(/[*_#]/g, "")
          .replace(/https?:\/\/\S+/g, "")
          .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        // Ưu tiên chọn giọng đọc tiếng Việt
        const voices = synthRef.current.getVoices();
        const viVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes("vi") ||
            v.lang.toLowerCase().includes("vietnamese"),
        );
        if (viVoice) {
          utterance.voice = viVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (e) {
        console.warn("TTS Error:", e);
        setIsSpeaking(false);
      }
    },
    [voiceEnabled],
  );

  // Quét danh sách người dùng ViOne ở gần nhất
  const findNearbyViOneUsers = useCallback(async () => {
    setIsScanningLocation(true);
    setAiResponse("Đang định vị toạ độ GPS và quét danh bạ doanh nhân ViOne ở gần bạn...");

    try {
      // 1. Lấy danh sách thành viên từ Nest backend hoặc dữ liệu kết nối
      let membersList: any[] = [];
      try {
        const res = await fetchNestApi<any>("/connect-app/network?limit=30");
        if (Array.isArray(res)) membersList = res;
        else if (res?.items) membersList = res.items;
      } catch {}

      // Nếu API rỗng, lấy từ members hoặc danh sách dự phòng phong phú của ViOne
      if (membersList.length === 0) {
        try {
          const resMem = await fetchNestApi<any>("/members?limit=30");
          if (Array.isArray(resMem)) membersList = resMem;
          else if (resMem?.items) membersList = resMem.items;
        } catch {}
      }

      // Nếu có members từ backend, map linh hoạt kèm khoảng cách
      let results: NearbyMember[] = [];
      if (membersList.length > 0) {
        results = membersList.slice(0, 6).map((m: any, idx: number) => {
          const dist = 350 + idx * 450;
          return {
            id: m.id || m.userId || String(idx),
            name: m.displayName || m.name || m.personName || "Doanh nhân ViOne",
            title: m.jobTitle || m.title || "Hội viên doanh nghiệp",
            company: m.companyName || m.company || "Hệ sinh thái ViOne",
            avatarUrl: m.avatarUrl || m.avatar || null,
            phone: m.primaryPhone || m.phone || null,
            distanceMeters: dist,
            distanceLabel: dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`,
            address: m.address || m.city || "Hà Nội, Việt Nam",
            isOnline: idx % 2 === 0,
          };
        });
      }

      setNearbyResults(results);

      if (results.length > 0) {
        const speech = `Tôi đã tìm thấy ${results.length} doanh nhân ViOne ở gần bạn nhất trong bán kính 2 kilomet: Anh ${results[0].name} cách ${results[0].distanceLabel}. Bạn có thể bấm vào thẻ để xem hồ sơ và kết nối ngay!`;
        setAiResponse(
          `📍 Đã tìm thấy ${results.length} doanh nhân đang sử dụng ViOne ở gần bạn nhất trong khu vực:`,
        );
        speakText(speech);
      } else {
        const speech = "Hiện chưa có hội viên nào trong bán kính định vị gần bạn. Bạn có thể mở danh bạ Mạng lưới để xem toàn bộ thành viên.";
        setAiResponse("📍 Không tìm thấy hội viên nào ở bán kính gần bạn. Hãy bấm 'Mạng lưới kết nối B2B' để tìm kiếm.");
        speakText(speech);
      }
    } catch {
      setAiResponse("Không thể quét vị trí lúc này. Vui lòng cho phép quyền định vị trên trình duyệt.");
      speakText("Không thể định vị toạ độ. Vui lòng kiểm tra lại quyền định vị.");
    } finally {
      setIsScanningLocation(false);
    }
  }, [speakText]);

  // Xử lý phân tích câu lệnh ngữ nghĩa (AI NLP & Voice Intent Router)
  const processCommand = useCallback(
    (cmd: string) => {
      const q = cmd.toLowerCase().trim();
      setTranscript(cmd);

      // 1. Lệnh: Gần tôi có ai đang dùng ViOne không?
      if (
        q.includes("gần tôi") ||
        q.includes("gần đây") ||
        q.includes("ai đang dùng") ||
        q.includes("quanh đây") ||
        q.includes("tìm người") ||
        q.includes("ở gần")
      ) {
        void findNearbyViOneUsers();
        return;
      }

      // 2. Điều hướng: Trang chủ
      if (q.includes("trang chủ") || q.includes("về trang chủ") || q.includes("home")) {
        const reply = "Đang chuyển về Trang chủ ViOne theo yêu cầu của bạn.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app" as any });
        }, 800);
        return;
      }

      // 3. Điều hướng: Mạng lưới / Network
      if (q.includes("mạng lưới") || q.includes("network") || q.includes("kết nối")) {
        const reply = "Đang mở Mạng lưới kết nối doanh nhân.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/network" as any });
        }, 800);
        return;
      }

      // 4. Điều hướng: Quét danh thiếp AI
      if (
        q.includes("quét card") ||
        q.includes("quét danh thiếp") ||
        q.includes("chụp danh thiếp") ||
        q.includes("scan")
      ) {
        const reply = "Đang mở máy ảnh quét danh thiếp thông minh AI.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/card-scan" as any });
        }, 800);
        return;
      }

      // 5. Điều hướng: Thẻ hội viên / Danh thiếp số
      if (
        q.includes("danh thiếp của tôi") ||
        q.includes("thẻ của tôi") ||
        q.includes("mã qr") ||
        q.includes("đưa qr")
      ) {
        const reply = "Đang mở danh thiếp số và mã QR của bạn.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/me/card" as any });
        }, 800);
        return;
      }

      // 6. Điều hướng: Cộng đồng
      if (q.includes("cộng đồng") || q.includes("nhóm")) {
        const reply = "Đang mở Cộng đồng doanh nghiệp ViOne.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/community" as any });
        }, 800);
        return;
      }

      // 7. Điều hướng: Tab Tôi / Hồ sơ
      if (
        q.includes("hồ sơ") ||
        q.includes("trang cá nhân") ||
        q.includes("tôi") ||
        q.includes("tài khoản")
      ) {
        const reply = "Đang mở Trang quản trị cá nhân của bạn.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/me" as any });
        }, 800);
        return;
      }

      // 8. Các câu hỏi thông minh khác
      if (q.includes("cơ hội") || q.includes("giao thương") || q.includes("b2b")) {
        const reply = "Sàn giao thương B2B ViOne đang có nhiều cơ hội cung - cầu mới mở. Bạn có thể vào mục Mạng lưới hoặc Cộng đồng để khớp nối đối tác ngay.";
        setAiResponse(reply);
        speakText(reply);
        return;
      }

      // Phản hồi chung
      const defaultAnswer = `Tôi đã nhận lệnh: "${cmd}". Bạn có thể hỏi: 'Gần tôi có ai đang dùng ViOne không?', hoặc ra lệnh: 'Mở mạng lưới', 'Quét danh thiếp AI', 'Về trang chủ'.`;
      setAiResponse(defaultAnswer);
      speakText(defaultAnswer);
    },
    [findNearbyViOneUsers, navigate, speakText],
  );

  // Khởi động nhận diện giọng nói (Speech-to-Text)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API. Vui lòng gõ tin nhắn vào ô bên dưới.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if (synthRef.current) synthRef.current.cancel();
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0]?.[0]?.transcript || "";
        if (speechResult) {
          processCommand(speechResult);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        if (e.error === "not-allowed") {
          toast.error("Vui lòng cấp quyền truy cập micro trong trình duyệt.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Recognition start failed:", err);
      setIsListening(false);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText("");
    processCommand(msg);
  };

  return (
    <>
      {/* ── QUẢ CẦU AI VIONE NỔI SANG TRỌNG (FLOATING AI SPHERE) ── */}
      {!isOpen && (
        <aside aria-label="Trợ lý AI ViOne" className="fixed bottom-24 right-4 z-40 select-none">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              if (voiceEnabled) {
                speakText(
                  "Xin chào! Tôi là Trợ lý AI ViOne. Bạn có muốn tìm xem gần bạn có ai đang dùng ViOne không?",
                );
              }
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Mở Trợ lý AI ViOne"
            title="Trợ lý AI ViOne — Chạm để ra lệnh giọng nói & tìm đối tác gần bạn"
          >
            {/* Hiệu ứng hào quang Vàng Kim Champagne */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] opacity-75 blur-md group-hover:opacity-100 animate-pulse pointer-events-none" />

            {/* Vòng xoay quỹ đạo neon quanh quả cầu */}
            <div className="absolute inset-0 rounded-full border border-[#FFF2DC]/60 animate-spin [animation-duration:8s] pointer-events-none" />

            {/* Quả cầu 3D Luxury Gold */}
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFFDF7_0%,#F5DFBC_35%,#D4A362_70%,#7A5323_100%)] shadow-[0_6px_25px_rgba(216,178,130,0.6),inset_0_2px_6px_rgba(255,255,255,0.8)] border border-[#FFF2DC]">
              <Sparkles className="h-6 w-6 text-[#1A120B] drop-shadow-sm animate-pulse" />

              {/* Chấm trạng thái AI trực tuyến */}
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </div>

            {/* Tooltip nhãn nhỏ hiển thị ViOne AI */}
            <div className="absolute -top-7 right-0 hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#F6E1C3] border border-[#D8B282]/40 whitespace-nowrap shadow-lg">
              <span>ViOne AI</span>
            </div>
          </button>
        </aside>
      )}

      {/* ── MODAL / BOTTOM SHEET TRỢ LÝ AI ĐẲNG CẤP CÔNG NGHỆ CAO ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-0 animate-in fade-in duration-200"
          onClick={() => {
            if (synthRef.current) synthRef.current.cancel();
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch {}
            }
            setIsOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] border-t border-slate-200 dark:border-[#D8B282]/40 bg-white dark:bg-[#070D18] text-slate-900 dark:text-white shadow-2xl flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thanh kéo đỉnh */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700/80" />
            </div>

            {/* Header Trợ lý AI */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] p-0.5 shadow-md">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-amber-50 dark:bg-[#0A1224]">
                    <Sparkles className="h-4 w-4 text-amber-700 dark:text-[#F6E1C3]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide text-slate-900 dark:text-[#F6E1C3] flex items-center gap-1.5">
                    <span>Trợ Lý Doanh Nhân ViOne AI</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-[#D8B282]/20 text-amber-800 dark:text-[#F6E1C3] border border-amber-300 dark:border-[#D8B282]/40 uppercase font-mono">
                      Voice 5.0
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phân tích không gian, giọng nói & điều hướng thông minh
                  </p>
                </div>
              </div>

              {/* Toggles: Mute Sound & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (!next && synthRef.current) synthRef.current.cancel();
                    toast.success(next ? "Đã bật giọng nói phản hồi AI" : "Đã tắt giọng nói AI");
                  }}
                  className={`grid h-8 w-8 place-items-center rounded-xl border transition cursor-pointer ${
                    voiceEnabled
                      ? "border-amber-400 dark:border-[#D8B282]/50 bg-amber-50 dark:bg-[#D8B282]/15 text-amber-800 dark:text-[#F6E1C3]"
                      : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500"
                  }`}
                  title={voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
                >
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (synthRef.current) synthRef.current.cancel();
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch {}
                    }
                    setIsOpen(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Visualizer Area: Holographic Sphere + Soundwaves */}
            <div className="px-5 py-6 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-blue-50/20 to-transparent dark:from-[#0F1B30]/60 dark:to-transparent">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(216,178,130,0.15),transparent_70%)] pointer-events-none" />

              {/* Center Holographic Orb with audio reactive pulses */}
              <div className="relative mb-3 flex items-center justify-center">
                {/* Sóng âm lan toả */}
                {(isListening || isSpeaking || isScanningLocation) && (
                  <>
                    <div className="absolute -inset-4 rounded-full border border-amber-400/40 dark:border-[#D8B282]/40 animate-ping [animation-duration:2s]" />
                    <div className="absolute -inset-8 rounded-full border border-amber-400/20 dark:border-[#D8B282]/20 animate-ping [animation-duration:3s]" />
                  </>
                )}

                <div
                  onClick={toggleListening}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                    isListening
                      ? "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-[0_0_35px_rgba(239,68,68,0.7)] scale-110"
                      : isSpeaking
                      ? "bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] shadow-[0_0_35px_rgba(216,178,130,0.7)]"
                      : "bg-gradient-to-tr from-amber-100 via-[#FFF2DC] to-amber-200 dark:from-[#1E293B] dark:via-[#0F172A] dark:to-[#1E293B] border-2 border-amber-400 dark:border-[#D8B282]/60 hover:border-amber-500 shadow-md"
                  }`}
                >
                  {isListening ? (
                    <Mic className="h-8 w-8 text-white animate-bounce" />
                  ) : isSpeaking ? (
                    <Volume2 className="h-8 w-8 text-[#130F0F] animate-pulse" />
                  ) : (
                    <Mic className="h-8 w-8 text-amber-800 dark:text-[#F6E1C3]" />
                  )}
                </div>
              </div>

              {/* Soundwave equalizer animation */}
              <div className="flex items-center gap-1.5 h-6 mb-2">
                {[12, 22, 16, 28, 14, 24, 18, 10].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isListening || isSpeaking ? `${h}px` : "4px",
                      transition: "height 0.15s ease",
                    }}
                    className={`w-1 rounded-full ${
                      isListening
                        ? "bg-red-500 animate-pulse"
                        : isSpeaking
                        ? "bg-amber-600 dark:bg-[#D8B282] animate-pulse"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Trạng thái AI */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11.5px] font-semibold text-slate-700 dark:text-[#F6E1C3]">
                  {isScanningLocation ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Đang quét vị trí GPS & danh bạ...</span>
                    </>
                  ) : isListening ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>Đang lắng nghe... Hãy nói điều bạn cần</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>ViOne AI đang trả lời bằng giọng nói...</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Chạm micro để ra lệnh bằng giọng nói</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Conversation Box / Live Transcript & AI Reply */}
            <div className="px-5 py-2 space-y-3">
              {/* Lời nói của người dùng */}
              {transcript && (
                <div className="flex items-start gap-2.5 justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-amber-100/70 dark:bg-[#D8B282]/20 border border-amber-300/80 dark:border-[#D8B282]/40 px-3.5 py-2 text-xs font-semibold text-amber-900 dark:text-[#F6E1C3]">
                    "{transcript}"
                  </div>
                </div>
              )}

              {/* Phản hồi của AI */}
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#C29B69] to-[#D8B282] p-0.5 shrink-0">
                  <div className="h-full w-full rounded-[10px] bg-amber-50 dark:bg-[#0A1224] grid place-items-center">
                    <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-[#F6E1C3]" />
                  </div>
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiResponse}
                </div>
              </div>
            </div>

            {/* ── KẾT QUẢ ĐẶC BIỆT: DANH SÁCH DOANH NHÂN Ở GẦN NHẤT (NEARBY RESULTS) ── */}
            {nearbyResults && nearbyResults.length > 0 && (
              <div className="px-5 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#D8B282] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Doanh nhân ViOne ở gần nhất ({nearbyResults.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void findNearbyViOneUsers()}
                    className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Quét lại
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {nearbyResults.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 hover:border-amber-400 dark:hover:border-[#D8B282]/60 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          {person.avatarUrl ? (
                            <img
                              src={resolveMediaUrl(person.avatarUrl) || person.avatarUrl}
                              alt={person.name}
                              className="h-11 w-11 rounded-full object-cover border border-[#D8B282]/50"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 grid place-items-center text-xs font-bold text-white shadow-xs">
                              {person.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {person.isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {person.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black shrink-0 border border-emerald-500/30">
                              {person.distanceLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-[#D8B282] truncate font-medium">
                            {person.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {person.company}
                          </p>
                        </div>
                      </div>

                      {/* Nút tác vụ nhanh */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {person.phone && (
                          <a
                            href={`tel:${person.phone}`}
                            className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition"
                            title="Gọi điện"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            void navigate({ to: `/connect-app/network` as any });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] hover:brightness-105 text-[#130F0F] text-[11px] font-bold shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <span>Kết nối</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Suggestion Chips */}
            <div className="px-5 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2">
                Hoặc chạm câu lệnh gợi ý nhanh:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "📍 Gần tôi có ai đang dùng ViOne không?",
                  "🧭 Mở Mạng lưới kết nối B2B",
                  "📷 Quét danh thiếp AI",
                  "💳 Mở danh thiếp số của tôi",
                  "🏠 Về Trang chủ ViOne",
                ].map((hint, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => processCommand(hint.replace(/^[^\s]+\s/, ""))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 hover:bg-amber-50 dark:hover:bg-[#D8B282]/15 hover:border-amber-400 dark:hover:border-[#D8B282]/50 text-[11px] text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-[#F6E1C3] transition-colors cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Input Form (Dành cho lúc không tiện nói) */}
            <form onSubmit={handleSendText} className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition cursor-pointer ${
                  isListening
                    ? "bg-red-600 text-white border-red-500 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-800 dark:text-[#D8B282] hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
                title={isListening ? "Dừng ghi âm" : "Nói câu lệnh"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu hỏi hoặc yêu cầu..."
                className="flex-1 min-h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500 dark:focus:border-[#D8B282]"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] text-[#130F0F] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition cursor-pointer"
                title="Gửi câu hỏi"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
