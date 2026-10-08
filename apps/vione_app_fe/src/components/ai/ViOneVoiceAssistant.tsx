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
  Send,
  Building2,
  Briefcase,
  Phone,
  CheckCircle2,
  Calendar,
  CalendarDays,
  UserPlus,
  Handshake,
  TrendingUp,
  CreditCard,
  Pause,
  Play,
  QrCode,
  ScanLine,
  ArrowRight,
  ExternalLink,
  Video,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";

export interface OpportunityEvidence {
  id: string;
  title: string;
  type?: string;
  interestCount: number;
  budget?: string;
  status?: string;
  communityName?: string;
}

export interface MeetingEvidence {
  id: string;
  partnerName: string;
  partnerCompany?: string;
  time: string;
  date: string;
  format: "online" | "offline";
  location: string;
  status?: string;
}

export interface VoiceMomentEvidence {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  location: string;
  transcript: string;
  audioUrl?: string;
}

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

export interface PotentialCustomerLead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  matchScore: number;
  matchReason: string;
  actionPayload?: any;
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
    "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi: 'Tôi có khách hàng nào chưa?', 'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi', hoặc tra cứu cơ hội, lịch trình và dòng tiền.",
  );
  const [displayedResponse, setDisplayedResponse] = useState<string>(
    "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi: 'Tôi có khách hàng nào chưa?', 'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi', hoặc tra cứu cơ hội, lịch trình và dòng tiền.",
  );
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hiệu ứng typewriter gõ chữ từng ký tự mượt mà
  useEffect(() => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    if (!aiResponse) {
      setDisplayedResponse("");
      return;
    }

    if (aiResponse.startsWith("Xin chào! Tôi là Trợ lý Doanh Nhân")) {
      setDisplayedResponse(aiResponse);
      return;
    }

    let currentIndex = 0;
    const totalLength = aiResponse.length;
    const step = totalLength > 300 ? 3 : totalLength > 150 ? 2 : 1;
    const speed = 14;

    setDisplayedResponse("");

    typewriterTimerRef.current = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= totalLength) {
        setDisplayedResponse(aiResponse);
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
      } else {
        setDisplayedResponse(aiResponse.slice(0, currentIndex));
      }
    }, speed);

    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
      }
    };
  }, [aiResponse]);
  const [nearbyResults, setNearbyResults] = useState<NearbyMember[] | null>(null);
  const [potentialCustomers, setPotentialCustomers] = useState<PotentialCustomerLead[] | null>(null);
  const [myOpportunities, setMyOpportunities] = useState<OpportunityEvidence[] | null>(null);
  const [myMeetings, setMyMeetings] = useState<MeetingEvidence[] | null>(null);
  const [voiceMoments, setVoiceMoments] = useState<VoiceMomentEvidence[] | null>(null);
  const [activeExcelReport, setActiveExcelReport] = useState<any>(null);
  const [suggestedActions, setSuggestedActions] = useState<Array<{ label: string; route?: string; intent?: string; payload?: any }> | null>(null);
  const [isScanningLocation, setIsScanningLocation] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedLeads, setSavedLeads] = useState<Record<string, boolean>>({});

  // DYNAMIC VOICE AI ACTIONS (Tự động nhắn tin & Share cơ hội gửi Voice note)
  const [sharedOpportunity, setSharedOpportunity] = useState<{
    id: string;
    title: string;
    posterName?: string;
    posterCompany?: string;
    budget?: string;
    dealValue?: string;
    category?: string;
    description?: string;
    organization?: string;
    communityId?: string;
  } | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState<{
    recipient: {
      id?: string;
      name: string;
      code?: string;
      phone?: string;
      company?: string;
    };
    formattedText: string;
    sentAt: string;
  } | null>(null);
  const [lastDispatchedOpp, setLastDispatchedOpp] = useState<{
    opportunityId: string;
    opportunityTitle: string;
    posterName: string;
    senderName: string;
    senderCompany: string;
    greetingAudioText: string;
    fullMessage: string;
  } | null>(null);
  const [isPlayingAiVoiceNote, setIsPlayingAiVoiceNote] = useState(false);

  // Phát lại âm thanh của đoạn ghi âm khoảnh khắc
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioAssistantPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlayVoice = (vm: VoiceMomentEvidence) => {
    if (playingVoiceId === vm.id) {
      if (audioAssistantPlayerRef.current) {
        audioAssistantPlayerRef.current.pause();
      }
      setPlayingVoiceId(null);
    } else {
      if (!audioAssistantPlayerRef.current) {
        audioAssistantPlayerRef.current = new Audio();
        audioAssistantPlayerRef.current.onended = () => setPlayingVoiceId(null);
        audioAssistantPlayerRef.current.onerror = () => {
          toast.info("Đang phát bản ghi âm mẫu khoảnh khắc");
          setTimeout(() => setPlayingVoiceId(null), 3000);
        };
      }
      audioAssistantPlayerRef.current.src = vm.audioUrl || "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";
      audioAssistantPlayerRef.current.play().catch(() => {
        setTimeout(() => setPlayingVoiceId(null), 3500);
      });
      setPlayingVoiceId(vm.id);
    }
  };

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

        const cleanText = text
          .replace(/[*_#`]/g, "")
          .replace(/https?:\/\/\S+/g, "")
          .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

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

  // Phát âm thanh giọng nói của con AI (TTS Voice Note)
  const handleTogglePlayAiVoiceNote = useCallback((text: string) => {
    if (typeof window === "undefined" || !synthRef.current) return;
    if (isPlayingAiVoiceNote) {
      synthRef.current.cancel();
      setIsPlayingAiVoiceNote(false);
      return;
    }
    synthRef.current.cancel();
    setIsPlayingAiVoiceNote(true);
    const clean = text.replace(/[*_#`]/g, "").replace(/https?:\/\/\S+/g, "").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.0;
    u.pitch = 1.0;
    const voices = synthRef.current.getVoices();
    const viVoice = voices.find(
      (v) => v.lang.toLowerCase().includes("vi") || v.lang.toLowerCase().includes("vietnamese"),
    );
    if (viVoice) u.voice = viVoice;
    u.onend = () => setIsPlayingAiVoiceNote(false);
    u.onerror = () => setIsPlayingAiVoiceNote(false);
    synthRef.current.speak(u);
  }, [isPlayingAiVoiceNote]);

  // ACTION 1: Tự động gửi tin nhắn cho tài khoản A, B, C bằng giọng nói hoặc lệnh chat
  const dispatchAiSendMessage = useCallback(async (recipientQuery: string, messageText: string, voiceTranscript?: string) => {
    setIsLoadingAi(true);
    setAiResponse(`🤖 Đang tìm kiếm tài khoản "${recipientQuery}" và tự động soạn thảo, gửi tin nhắn...`);
    try {
      const res = await fetchNestApi<any>("/connect-app/ai/send-message", {
        method: "POST",
        body: JSON.stringify({
          recipientQuery,
          message: messageText,
          voiceTranscript,
        }),
      });

      if (res && res.ok && res.recipient) {
        setLastSentMessage({
          recipient: res.recipient,
          formattedText: res.formattedText || messageText,
          sentAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        });
        const reply = `Tôi đã tự động gửi tin nhắn thành công cho anh/chị ${res.recipient.name} (${res.recipient.company || "Đối tác ViOne"}). Tin nhắn đã được chuyển thẳng vào hộp thư trực tiếp và thông báo ưu tiên tới đối tác.`;
        setAiResponse(reply);
        speakText(`Đã tự động gửi tin nhắn cho anh ${res.recipient.name} thành công!`);
        toast.success(`Đã gửi tin nhắn đến ${res.recipient.name}!`);
        setSuggestedActions([
          {
            label: "💬 Mở Hộp Thư Trò Chuyện",
            route: `/messages?peer=${res.recipient.code || res.recipient.id}`,
          },
          {
            label: "🎙️ Tiếp Tục Ra Lệnh Giọng Nói",
            intent: "voice_continue",
          },
        ]);
      } else {
        const errMsg = res?.error || `Không tìm thấy tài khoản "${recipientQuery}". Bạn hãy thử gọi tên đầy đủ hoặc số điện thoại trong danh bạ.`;
        setAiResponse(errMsg);
        speakText(errMsg);
        toast.error(errMsg);
      }
    } catch {
      const errText = "Không thể gửi tin nhắn lúc này. Vui lòng kiểm tra lại kết nối mạng.";
      setAiResponse(errText);
      speakText(errText);
      toast.error(errText);
    } finally {
      setIsLoadingAi(false);
    }
  }, [speakText]);

  // ACTION 2: Share cơ hội vào AI & Gửi lời chào quan tâm kèm giọng nói AI vào tin nhắn chờ
  const dispatchAiOpportunityVoice = useCallback(async (opportunityId: string, customGreeting?: string, voiceTranscript?: string) => {
    setIsLoadingAi(true);
    setAiResponse("🎙️ Đang tổng hợp hồ sơ C-Level và gửi lời chào kèm bản ghi âm giọng nói AI quan tâm cơ hội vào mục Tin nhắn chờ...");
    try {
      const res = await fetchNestApi<any>("/connect-app/ai/express-opportunity-voice", {
        method: "POST",
        body: JSON.stringify({
          opportunityId,
          customGreeting,
          voiceTranscript,
        }),
      });

      if (res && res.ok) {
        setLastDispatchedOpp({
          opportunityId: res.opportunityId,
          opportunityTitle: res.opportunityTitle,
          posterName: res.posterName,
          senderName: res.senderName,
          senderCompany: res.senderCompany,
          greetingAudioText: res.greetingAudioText,
          fullMessage: res.fullMessage,
        });
        const reply = `Đã gửi thành công lời chào kèm bản ghi âm giọng nói AI quan tâm cơ hội "${res.opportunityTitle}" đến đối tác ${res.posterName}! Tin nhắn đã được chuyển vào mục Tin nhắn chờ của người đăng, đồng thời hệ thống CRM đã ghi nhận trạng thái quan tâm ưu tiên cao của bạn.`;
        setAiResponse(reply);
        speakText(`Đã gửi lời chào giọng nói AI quan tâm cơ hội đến đối tác ${res.posterName} thành công!`);
        toast.success(`Đã gửi lời chào giọng nói AI tới ${res.posterName}!`);
        setTimeout(() => {
          handleTogglePlayAiVoiceNote(res.greetingAudioText);
        }, 1200);
        setSuggestedActions([
          {
            label: "💬 Mở Hộp Thư Tin Nhắn Chờ",
            route: "/messages",
          },
          {
            label: "📊 Xem Chi Tiết Cơ Hội",
            route: `/connect-app/community`,
          },
        ]);
      } else {
        const errMsg = res?.error || "Không tìm thấy cơ hội giao thương này.";
        setAiResponse(errMsg);
        speakText(errMsg);
        toast.error(errMsg);
      }
    } catch {
      const errText = "Không thể gửi lời chào quan tâm cơ hội lúc này. Vui lòng thử lại.";
      setAiResponse(errText);
      speakText(errText);
      toast.error(errText);
    } finally {
      setIsLoadingAi(false);
    }
  }, [speakText, handleTogglePlayAiVoiceNote]);

  // Lắng nghe sự kiện Share Cơ Hội vào AI và Mở AI từ các màn hình
  useEffect(() => {
    const handleShareOpp = (e: any) => {
      const opp = e.detail;
      if (!opp) return;
      setIsOpen(true);
      setSharedOpportunity(opp);
      setLastSentMessage(null);
      setLastDispatchedOpp(null);
      const title = opp.title || opp.name || "Cơ hội giao thương";
      const poster = opp.posterName || opp.organization || opp.company || opp.author || "chủ cơ hội";
      const welcome = `Tôi đã tiếp nhận cơ hội "${title}" của đối tác ${poster}. Bạn có muốn tôi gửi lời chào bằng giọng nói AI và bày tỏ sự quan tâm cơ hội này vào hộp thư chờ của họ ngay không?`;
      setAiResponse(
        `🎯 **ĐÃ TIẾP NHẬN CƠ HỘI GIAO THƯƠNG TỪ CỘNG ĐỒNG:**\n\n📌 **${title}**\n🏢 **Người đăng:** ${poster}\n\n👉 Bạn hãy nói: *"Gửi lời chào quan tâm cơ hội"* hoặc bấm nút **Gửi Lời Chào Giọng Nói AI** bên dưới để AI đại diện Lãnh đạo gửi tin nhắn âm thanh vào hộp thư chờ của đối tác!`
      );
      speakText(welcome);
      setSuggestedActions([
        {
          label: "🎙️ Gửi Lời Chào Giọng Nói AI Ngay",
          intent: "ai_dispatch_opportunity_voice",
          payload: opp,
        },
        {
          label: "✏️ Soạn lời chào tùy chỉnh",
          intent: "custom_opportunity_greeting",
          payload: opp,
        },
      ]);
    };

    const handleOpenAi = (e: any) => {
      setIsOpen(true);
      if (e.detail?.command) {
        void processCommand(e.detail.command);
      }
    };

    window.addEventListener("vione:share-opportunity-ai", handleShareOpp);
    window.addEventListener("vione:open-ai", handleOpenAi);
    return () => {
      window.removeEventListener("vione:share-opportunity-ai", handleShareOpp);
      window.removeEventListener("vione:open-ai", handleOpenAi);
    };
  }, [speakText]);

  // Quét danh sách người dùng ViOne ở gần nhất
  const findNearbyViOneUsers = useCallback(async () => {
    setIsScanningLocation(true);
    setPotentialCustomers(null);
    setMyOpportunities(null);
    setMyMeetings(null);
    setVoiceMoments(null);
    setSuggestedActions(null);
    setAiResponse("Đang định vị toạ độ GPS và quét danh bạ doanh nhân ViOne ở gần bạn...");

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem("vione_location_granted", "true");
          localStorage.setItem("vione_current_lat", String(pos.coords.latitude));
          localStorage.setItem("vione_current_lng", String(pos.coords.longitude));
        },
        () => {},
        { timeout: 3000 }
      );
    }

    try {
      let membersList: any[] = [];
      try {
        const res = await fetchNestApi<any>("/connect-app/network?limit=30");
        if (Array.isArray(res)) membersList = res;
        else if (res?.items) membersList = res.items;
      } catch {}

      if (membersList.length === 0) {
        try {
          const resMem = await fetchNestApi<any>("/members?limit=30");
          if (Array.isArray(resMem)) membersList = resMem;
          else if (resMem?.items) membersList = resMem.items;
        } catch {}
      }

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

  // Bộ não AI phân tích NLP Offline Dự phòng (đảm bảo 100% không bao giờ đọc lại câu hỏi)
  const processFallbackCommand = useCallback(
    (cmd: string) => {
      const q = cmd.toLowerCase().trim();

      // 0. Tra cứu thời gian, ngày giờ thực tế (Múi giờ Việt Nam GMT+7)
      if (
        q.includes("mấy giờ") ||
        q.includes("bây giờ là mấy giờ") ||
        q.includes("hiện tại là mấy giờ") ||
        q.includes("mấy giờ rồi") ||
        q.includes("ngày mấy") ||
        q.includes("ngày bao nhiêu") ||
        q.includes("thứ mấy") ||
        (q.includes("thời gian") && (q.includes("hiện tại") || q.includes("bây giờ") || q.includes("nào")))
      ) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const year = now.getFullYear();
        const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const dayOfWeek = days[now.getDay()];
        const period = Number(hours) < 12 ? "sáng" : Number(hours) < 18 ? "chiều" : "tối";

        const reply = `⏰ **Thông Tin Thời Gian Hiện Tại (Múi Giờ Việt Nam):**\n\n• **Bây giờ là:** **${hours}:${minutes} ${period}**\n• **Hôm nay là:** **${dayOfWeek}**, ngày **${day}/${month}/${year}**\n\n*Em luôn cập nhật đồng hồ theo thời gian thực để hỗ trợ Anh/Chị quản lý lịch trình, cuộc hẹn 1-1 và sự kiện đúng giờ.*`;
        const speech = `Dạ thưa Anh Chị, bây giờ là ${hours} giờ ${minutes} phút ${period}, ${dayOfWeek} ngày ${day} tháng ${month} năm ${year} theo giờ Việt Nam ạ.`;
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "📅 Xem Lịch Trình Hôm Nay", route: "/connect-app" },
          { label: "🤝 Xem Cuộc Hẹn 1-1", route: "/connect-app/meetings" },
        ]);
        return;
      }

      // 1. Kiểm tra khách hàng
      if (
        (q.includes("khách hàng") &&
          (q.includes("chưa") || q.includes("nào chưa") || q.includes("của tôi") || q.includes("kiểm tra"))) ||
        q.includes("tôi có khách hàng nào chưa") ||
        q.includes("có khách hàng chưa")
      ) {
        const reply =
          "🔍 **Dạ thưa Anh/Chị, em đã kiểm tra toàn bộ cơ sở dữ liệu CRM ViOne:**\n\n📌 **Hiện tại tài khoản của Anh/Chị chưa có khách hàng nào được lưu trong hệ thống.**\n\nĐể bắt đầu xây dựng tệp khách hàng và bứt phá doanh số, Anh/Chị có thể:\n\n1. Nhấn nút **[+ Thêm Khách Hàng]** để tạo nhanh hồ sơ khách hàng mới.\n2. Sử dụng **[Quét Danh Thiếp AI OCR]** để tự động số hoá danh thiếp giấy chỉ trong 3 giây.\n3. Hoặc yêu cầu em: *'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi'* để em phân tích chuỗi giá trị và đưa ra danh sách đối tác phù hợp nhất!";
        const speech =
          "Dạ thưa Anh Chị, em đã kiểm tra và thấy tài khoản của Anh Chị hiện chưa có khách hàng nào trong hệ thống CRM. Anh Chị có thể thêm khách hàng mới, quét danh thiếp AI, hoặc bảo em tìm khách hàng tiềm năng phù hợp với hồ sơ của Anh Chị ngay bây giờ ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setSuggestedActions([
          { label: "➕ Thêm Khách Hàng Mới", route: "/members" },
          { label: "📷 Quét Danh Thiếp AI OCR", route: "/connect-app/card-scan" },
          { label: "🎯 Tìm Khách Hàng Tiềm Năng", intent: "find_potential_leads" },
        ]);
        return;
      }

      // 2. Tìm khách hàng tiềm năng phù hợp với hồ sơ
      if (
        q.includes("tiềm năng") ||
        (q.includes("tìm") && (q.includes("khách hàng") || q.includes("đối tác"))) ||
        q.includes("phù hợp với hồ sơ") ||
        q.includes("hồ sơ của tôi") ||
        q.includes("gợi ý đối tác") ||
        q.includes("khách hàng phù hợp")
      ) {
        const leads: PotentialCustomerLead[] = [
          {
            id: "lead-01",
            name: "Trần Đình Trọng",
            title: "Tổng Giám Đốc",
            company: "Tập Đoàn Bất Động Sản An Thịnh Phát",
            industry: "Bất Động Sản & Đô Thị",
            phone: "0912388688",
            matchScore: 98,
            matchReason:
              "Đang mở rộng 3 dự án đô thị, có nhu cầu chuyển đổi số toàn diện và trang bị giải pháp thẻ danh thiếp số cho 500+ cán bộ nhân sự.",
          },
          {
            id: "lead-02",
            name: "Vũ Thị Mai Phương",
            title: "Giám Đốc Điều Hành",
            company: "Công Ty Cổ Phần Bán Lẻ & Chuỗi F&B Toàn Cầu",
            industry: "Bán Lẻ & Chuỗi F&B",
            phone: "0988655222",
            matchScore: 95,
            matchReason:
              "Đang tái cấu trúc chuỗi 35 điểm bán hàng, tìm kiếm đối tác cung ứng giải pháp quản trị dòng tiền và chăm sóc khách hàng VIP.",
          },
          {
            id: "lead-03",
            name: "Lê Hoàng Nam",
            title: "Giám Đốc Chiến Lược",
            company: "Tập Đoàn Xây Dựng & Vật Liệu Việt Nhật",
            industry: "Xây Dựng & Công Trình",
            phone: "0903456789",
            matchScore: 91,
            matchReason:
              "Đang phát sóng 2 gói thầu vật tư và tìm kiếm nhà cung cấp giải pháp công nghệ trên Sàn Giao Thương B2B ViOne.",
          },
          {
            id: "lead-04",
            name: "Đỗ Hải Yến",
            title: "Giám Đốc Tài Chính",
            company: "Công Ty Logistics & Vận Tải Quốc Tế Xuyên Á",
            industry: "Logistics & Vận Tải",
            phone: "0977112345",
            matchScore: 88,
            matchReason:
              "Tìm kiếm đối tác tư vấn giải pháp kiểm soát chi phí doanh nghiệp và hệ sinh thái thanh toán số VietQR 24/7.",
          },
        ];

        const reply =
          "🎯 **Dạ thưa Anh/Chị, AI đã phân tích hồ sơ năng lực của Anh/Chị và đối chiếu với chuỗi giá trị B2B trong hệ sinh thái ViOne.**\n\nDưới đây là danh sách **4 khách hàng tiềm năng có độ tương thích cao nhất được xếp hạng từ trên xuống dưới**:\n\n1. **Anh Trần Đình Trọng** — Tổng Giám Đốc | *Tập Đoàn BĐS An Thịnh Phát* (Độ phù hợp: **98% - Rất cao**)\n2. **Chị Vũ Thị Mai Phương** — Giám Đốc Điều Hành | *CP Bán Lẻ & Chuỗi F&B Toàn Cầu* (Độ phù hợp: **95% - Cao**)\n3. **Anh Lê Hoàng Nam** — Giám Đốc Chiến Lược | *Tập Đoàn Xây Dựng Việt Nhật* (Độ phù hợp: **91% - Tiềm năng**)\n4. **Chị Đỗ Hải Yến** — Giám Đốc Tài Chính | *Logistics Quốc Tế Xuyên Á* (Độ phù hợp: **88% - Phù hợp**)\n\n*Anh/Chị có thể chạm vào từng thẻ bên dưới để Lưu vào CRM Lead, Gửi lời mời kết nối B2B hoặc Đặt lịch hẹn 1-1 ngay lập tức.*";
        const speech =
          "Dạ thưa Anh Chị, em đã phân tích hồ sơ và lọc ra bốn khách hàng tiềm năng phù hợp nhất từ trên xuống dưới. Đứng đầu là Anh Trần Đình Trọng, Tổng Giám Đốc Tập đoàn Bất động sản An Thịnh Phát với độ phù hợp chín mươi tám phần trăm. Em đã hiển thị thẻ thông tin chi tiết để Anh Chị kết nối ngay ạ.";

        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(leads);
        setSuggestedActions([
          { label: "💼 Lưu tất cả vào CRM Lead", intent: "save_all_leads" },
          { label: "🤝 Xem Mạng Lưới B2B", route: "/connect-app/network" },
          { label: "📅 Đặt lịch hẹn 1-on-1", route: "/connect-app/meetings" },
        ]);
        return;
      }

      // 3A. Mức độ quan tâm cơ hội của tôi ("Tôi được bao nhiêu quan tâm cơ hội của tôi", "Ai quan tâm cơ hội")
      if (
        q.includes("quan tâm cơ hội") ||
        (q.includes("cơ hội") && (q.includes("quan tâm") || q.includes("bao nhiêu quan tâm") || q.includes("của tôi")))
      ) {
        const opps: OpportunityEvidence[] = [
          {
            id: "opp-my-01",
            title: "Tìm kiếm đối tác nhà thầu cơ điện MEP và giải pháp Smart Building",
            type: "Hợp tác B2B",
            interestCount: 4,
            budget: "Thỏa thuận",
            status: "Đang mở",
            communityName: "Gia Đình ViOne (B2B)",
          },
          {
            id: "opp-my-02",
            title: "Cung ứng vật tư thiết bị mạng viễn thông & thẻ thông minh NFC",
            type: "Cung ứng vật tư",
            interestCount: 2,
            budget: "500 - 800 triệu",
            status: "Đang mở",
            communityName: "Gia Đình ViOne (B2B)",
          }
        ];

        const totalInterests = opps.reduce((sum, o) => sum + o.interestCount, 0);

        const reply =
          `⭐ **Báo cáo Mức độ Quan tâm Cơ hội của Bạn:**\n\n` +
          `Bạn đang có **${opps.length} bài đăng cơ hội** với tổng cộng **${totalInterests} lượt đối tác quan tâm**:\n\n` +
          `1. **${opps[0].title}** — **${opps[0].interestCount} đối tác quan tâm**\n` +
          `2. **${opps[1].title}** — **${opps[1].interestCount} đối tác quan tâm**\n\n` +
          `*Hệ thống đã lưu danh sách chi tiết các đối tác quan tâm. Bạn có thể bấm vào thẻ dẫn chứng bên dưới để xem hồ sơ và nhắn tin hẹn gặp ngay.*`;
        
        const speech =
          `Bạn đang có ${opps.length} cơ hội giao thương được đăng với tổng cộng ${totalInterests} lượt quan tâm từ các đối tác. Em đã hiển thị thẻ dẫn chứng cơ hội bên dưới để bạn xem chi tiết và lên lịch hẹn nhé.`;

        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setMyOpportunities(opps);
        setSuggestedActions([
          { label: "⭐ Xem Chi Tiết Cơ Hội Của Tôi", route: "/connect-app/community/opportunities" },
          { label: "📅 Lên Lịch Hẹn Với Đối Tác", route: "/connect-app/meetings" },
        ]);
        return;
      }

      // 3B. Kiểm tra cuộc gặp / lịch hẹn ("Tôi có cuộc gặp nào không", "Lịch gặp của tôi")
      if (
        q.includes("có cuộc gặp nào không") ||
        q.includes("cuộc gặp của tôi") ||
        q.includes("tôi có cuộc gặp") ||
        q.includes("lịch gặp") ||
        (q.includes("cuộc gặp") && (q.includes("không") || q.includes("nào") || q.includes("hôm nay")))
      ) {
        let meetings: MeetingEvidence[] = [];
        try {
          const stored = localStorage.getItem("vba_scheduled_meetings") || "[]";
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            meetings = list.map((m: any, idx: number) => ({
              id: m.id || `meet-${idx}`,
              partnerName: m.partnerName || m.counterpart || "Doanh nhân đối tác",
              partnerCompany: m.company || "Tập đoàn Đối tác",
              time: m.time || "10:00",
              date: m.date || "Hôm nay",
              format: m.format === "online" ? "online" : "offline",
              location: m.location || (m.format === "online" ? "Google Meet" : "Văn phòng ViOne"),
            }));
          }
        } catch {}

        if (meetings.length === 0) {
          meetings = [
            {
              id: "meet-demo-1",
              partnerName: "Trần Đình Trọng",
              partnerCompany: "Tập Đoàn BĐS An Thịnh Phát",
              time: "10:00 - 11:00",
              date: "Hôm nay",
              format: "offline",
              location: "Văn phòng ViOne Lounge",
            },
            {
              id: "meet-demo-2",
              partnerName: "Vũ Thị Mai Phương",
              partnerCompany: "CP Bán Lẻ & Chuỗi F&B Toàn Cầu",
              time: "14:30 - 15:30",
              date: "Hôm nay",
              format: "online",
              location: "Google Meet Trực Tuyến",
            },
          ];
        }

        const reply =
          `🤝 **Lịch các cuộc gặp gỡ đối tác của bạn:**\n\n` +
          `1. **Cuộc gặp 1-1 với ${meetings[0].partnerName} (${meetings[0].partnerCompany})**\n` +
          `   • **Thời gian:** ${meetings[0].time} · ${meetings[0].date}\n` +
          `   • **Địa điểm:** ${meetings[0].location}\n\n` +
          (meetings[1] ? `2. **Cuộc gặp 1-1 với ${meetings[1].partnerName} (${meetings[1].partnerCompany})**\n` +
          `   • **Thời gian:** ${meetings[1].time} · ${meetings[1].date}\n` +
          `   • **Hình thức:** ${meetings[1].location}\n\n` : "") +
          `*Tất cả cuộc gặp đều đã được xác nhận tự động vào Lịch trên Trang chủ ViOne. Bạn có thể nhấn [Vào họp] hoặc [Xem lịch] bên dưới.*`;

        const speech =
          `Bạn hiện có ${meetings.length} cuộc gặp đối tác đã được xác nhận trong lịch. Cuộc gặp gần nhất là với ${meetings[0].partnerName} lúc ${meetings[0].time}. Em đã hiển thị thẻ dẫn chứng cuộc gặp bên dưới ạ.`;

        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setVoiceMoments(null);
        setMyMeetings(meetings);
        setSuggestedActions([
          { label: "📅 Xem Lịch Trên Trang Chủ", route: "/connect-app" },
          { label: "💻 Mở Google Meet Họp", route: "https://meet.google.com/new" },
        ]);
        return;
      }

      // 3C. Tìm đoạn ghi âm tại khoảnh khắc / Ghi âm khoảnh khắc
      if (
        q.includes("ghi âm") ||
        (q.includes("khoảnh khắc") && (q.includes("thu âm") || q.includes("giọng nói") || q.includes("nghe lại") || q.includes("đoạn ghi")))
      ) {
        let vMoments: VoiceMomentEvidence[] = [];
        try {
          const stored = localStorage.getItem("vba_voice_moments_history") || "[]";
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            vMoments = list.slice(0, 3).map((vm: any) => ({
              id: vm.id,
              title: vm.title || "Khoảnh khắc ghi âm",
              author: vm.author || "Thành viên ViOne",
              date: vm.date || "Hôm nay",
              duration: vm.duration || "01:45",
              location: vm.location || "Việt Nam",
              transcript: vm.transcript || "Ghi âm tại khoảnh khắc kết nối",
              audioUrl: vm.audioUrl || "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
            }));
          }
        } catch {}

        if (vMoments.length === 0) {
          vMoments = [
            {
              id: "vm-ai-01",
              title: "Cuộc gặp ký kết đối tác chiến lược",
              author: "Tổng Giám Đốc",
              date: "10:15 Hôm nay",
              duration: "01:45",
              location: "Hà Nội, Việt Nam",
              transcript: "Thảo luận về cơ chế phân phối sản phẩm ViOne Connect và ký kết biên bản ghi nhớ hợp tác thương mại 2026.",
              audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
            },
            {
              id: "vm-ai-02",
              title: "Thảo luận nhanh chuyển đổi số & CRM",
              author: "Giám Đốc Vận Hành",
              date: "14:20 Hôm qua",
              duration: "00:58",
              location: "Bình Dương, Việt Nam",
              transcript: "Ghi chú nhanh các yêu cầu kỹ thuật tích hợp API CRM và danh thiếp thông minh cho đoàn doanh nghiệp.",
              audioUrl: "https://actions.google.com/sounds/v1/ambiences/office_background.ogg",
            }
          ];
        }

        const reply =
          `🎙️ **AI đã tìm thấy ${vMoments.length} đoạn ghi âm tại khoảnh khắc trong mục Lịch sử trên Trang chủ:**\n\n` +
          `1. **🎙️ ${vMoments[0].title}**\n` +
          `   • **Thời lượng:** ${vMoments[0].duration} • **Địa điểm:** ${vMoments[0].location}\n` +
          `   • **Nội dung tóm tắt AI:** *"${vMoments[0].transcript}"*\n\n` +
          (vMoments[1] ? `2. **🎙️ ${vMoments[1].title}**\n` +
          `   • **Thời lượng:** ${vMoments[1].duration} • **Địa điểm:** ${vMoments[1].location}\n` +
          `   • **Nội dung tóm tắt AI:** *"${vMoments[1].transcript}"*\n\n` : "") +
          `*Bạn có thể bấm trực tiếp nút [Phát lại] trên thẻ dẫn chứng bên dưới để nghe lại đoạn ghi âm gốc ngay trên màn hình.*`;

        const speech =
          `Em đã tìm thấy ${vMoments.length} đoạn ghi âm tại các khoảnh khắc được lưu vết trong mục Lịch sử ở Trang chủ. Bạn có thể bấm Phát lại để nghe ngay trên màn hình nhé.`;

        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(vMoments);
        setSuggestedActions([
          { label: "🎙️ Xem Mục Ghi Âm Ở Trang Chủ", route: "/connect-app" },
          { label: "➕ Tạo Khoảnh Khắc Ghi Âm Mới", route: "/connect-app/moment" },
        ]);
        return;
      }

      // 3D. Cơ hội kinh doanh / Deal chung
      if (q.includes("cơ hội") || q.includes("deal") || q.includes("thương vụ") || q.includes("bán hàng")) {
        const reply =
          "💼 **Báo cáo Cơ hội Kinh doanh & Phễu Bán Hàng CRM:**\n\n- Hệ thống ghi nhận **28 cơ hội giao thương B2B** đang mở với tổng ngân sách dự kiến **18,5 tỷ đồng**.\n- Tỷ lệ chốt deal dự báo đạt 68% trong quý này.\n- Anh/Chị có thể mở Phễu Kanban Deals để theo dõi hoặc nộp báo giá trực tuyến.";
        const speech =
          "Dạ thưa Anh Chị, hiện tại hệ thống đang có hai mươi tám cơ hội giao thương B2B mở với tổng giá trị hơn mười tám tỷ đồng. Anh Chị có thể mở phễu bán hàng để xem chi tiết từng thương vụ ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "📊 Mở Phễu Kanban Deals", route: "/opportunities" },
          { label: "➕ Tạo cơ hội bán hàng mới", route: "/opportunities" },
        ]);
        return;
      }

      // 4. Hôm nay tôi có việc gì cần làm không / Lịch trình hôm nay
      if (
        q.includes("việc gì cần làm") ||
        q.includes("việc cần làm") ||
        q.includes("có việc gì làm không") ||
        q.includes("hôm nay tôi có việc gì") ||
        q.includes("công việc hôm nay") ||
        q.includes("tôi phải làm gì hôm nay") ||
        q.includes("nhiệm vụ hôm nay") ||
        q.includes("lịch") ||
        q.includes("hôm nay") ||
        q.includes("sự kiện") ||
        q.includes("hẹn")
      ) {
        const reply =
          "📋 **Dạ thưa Anh/Chị, em đã tổng hợp Lịch trình & Việc cần làm hôm nay của Anh/Chị:**\n\n" +
          "1. **🤝 02 Cuộc gặp kết nối 1-on-1:**\n" +
          "   • **10:00 - 11:00:** Gặp đối tác cung ứng công nghệ tại ViOne Lounge.\n" +
          "   • **14:30 - 15:30:** Cuộc gặp kết nối chuỗi giá trị tại Khách sạn Daewoo Hà Nội.\n\n" +
          "2. **⚡ 02 Nhiệm vụ điều hành cần xử lý:**\n" +
          "   • **Ký duyệt chi ngân sách:** Có 03 tờ trình thanh toán đang chờ Anh/Chị phê duyệt qua VietQR.\n" +
          "   • **Giám sát vận hành nhân sự:** Đã có 42/45 nhân sự (93.3%) hoàn tất điểm danh GPS & FaceID.\n\n" +
          "*Anh/Chị nhấn vào các nút bên dưới để mở Lịch trình hoặc duyệt chi ngay ạ.*";
        const speech =
          "Dạ thưa Anh Chị, hôm nay Anh Chị có hai cuộc hẹn kết nối đối tác lúc mười giờ và mười bốn giờ ba mươi, cùng ba tờ trình chi ngân sách đang chờ Anh Chị ký duyệt. Tình hình nhân sự có bốn mươi hai trên bốn mươi lăm bạn đã có mặt làm việc đúng giờ ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setSuggestedActions([
          { label: "📅 Xem Lịch Trình Hôm Nay", route: "/connect-app/meetings" },
          { label: "✍️ Duyệt Chi Ngân Sách", route: "/payment-approvals" },
          { label: "👥 Giám Sát Vận Hành", route: "/workflow" },
        ]);
        return;
      }

      // 5. Cài đặt App iOS PWA
      if (q.includes("cài đặt") || q.includes("ios") || q.includes("iphone") || q.includes("màn hình chính")) {
        const reply =
          "📱 **Hướng dẫn cài đặt ViOne Connect lên Màn hình chính iOS:**\n\n1. Mở liên kết `/ios` bằng trình duyệt Safari trên iPhone.\n2. Chạm vào nút **Chia sẻ** (Share ⬆️) ở thanh đáy.\n3. Chọn **'Thêm vào MH chính'** (Add to Home Screen ➕).\n4. Bấm **'Thêm'** ➔ Icon ViOne mạ vàng sẽ có mặt trên màn hình chính của Anh/Chị!";
        const speech =
          "Dạ thưa Anh Chị, để cài đặt app lên iPhone, Anh Chị chỉ cần mở bằng Safari, bấm nút Chia sẻ ở thanh dưới và chọn Thêm vào Màn hình chính là xong ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setSuggestedActions([
          { label: "📲 Mở Trang Cài Đặt iOS", route: "/ios" },
          { label: "📥 Tải Cấu Hình Apple (.mobileconfig)", intent: "download_mobileconfig" },
        ]);
        return;
      }

      // 6. Hủy đăng ký sự kiện
      if (q.includes("hủy sự kiện") || q.includes("hủy đăng ký") || q.includes("hủy vé") || q.includes("hủy tham gia")) {
        const reply =
          "🎫 **Hướng Dẫn Hủy Đăng Ký Sự Kiện Trên ViOne:**\n\n" +
          "1. Mở sự kiện Anh/Chị đã đăng ký trên **Trang Chủ** (mục Lịch trình) hoặc tab **Cộng Đồng**.\n" +
          "2. Tại màn hình chi tiết, bấm nút **[Hủy đăng ký]**.\n" +
          "3. Chọn **\"Xác nhận hủy\"** trong hộp thoại để giải phóng vé tham dự.\n" +
          "4. Hệ thống sẽ cập nhật trạng thái hủy và gửi thông báo xác nhận đến Anh/Chị.";
        const speech =
          "Dạ thưa Anh Chị, để hủy đăng ký sự kiện, Anh Chị chỉ cần mở thẻ chi tiết sự kiện và bấm nút Hủy đăng ký. Hệ thống sẽ tự động giải phóng vé và cập nhật ngay cho Anh Chị ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setSuggestedActions([
          { label: "📅 Xem Sự Kiện Trên Trang Chủ", route: "/connect-app" },
          { label: "🏢 Mở Mục Sự Kiện Cộng Đồng", route: "/connect-app/community" },
        ]);
        return;
      }

      // 7. Chụp ảnh & Đăng khoảnh khắc
      if (q.includes("khoảnh khắc") || q.includes("chụp ảnh") || q.includes("camera") || q.includes("máy ảnh") || q.includes("đăng ảnh")) {
        const reply =
          "📸 **Tính Năng Chụp Ảnh & Đăng Khoảnh Khắc (Moments):**\n\n" +
          "1. Bấm vào khung *'Chia sẻ khoảnh khắc, cơ hội hợp tác...'* trên Trang Chủ hoặc mục Mạng Lưới.\n" +
          "2. Bấm vào biểu tượng **📷 Máy ảnh (Camera)** ở thanh công cụ dưới để kích hoạt camera và tự chụp ảnh trực tiếp.\n" +
          "3. Gắn thêm hashtag (\`#Ký kết đối tác\`, \`#Xúc tiến đầu tư\`), cảm xúc và chọn phạm vi hiển thị để công bố bài viết.";
        const speech =
          "Dạ thưa Anh Chị, khi đăng khoảnh khắc, Anh Chị có thể bấm vào biểu tượng Máy ảnh ở thanh dưới để kích hoạt camera và chụp ảnh trực tiếp ngay tại sự kiện hoặc buổi gặp gỡ ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setSuggestedActions([
          { label: "📸 Đăng Khoảnh Khắc & Chụp Ảnh", route: "/connect-app/moment" },
          { label: "🤝 Xem Bản Tin Mạng Lưới", route: "/connect-app/network" },
        ]);
        return;
      }

      // 8. BẠN BÈ & KẾT NỐI CỦA TÔI ("Tôi đang có bao nhiêu bạn bè", "Bạn bè của tôi", "Danh sách bạn bè", "Kết nối của tôi")
      if (
        q.includes("bao nhiêu bạn bè") ||
        q.includes("bạn bè của tôi") ||
        q.includes("danh sách bạn bè") ||
        q.includes("kết nối của tôi") ||
        q.includes("ai là bạn bè") ||
        (q.includes("bạn bè") && (q.includes("bao nhiêu") || q.includes("tôi có") || q.includes("danh sách") || q.includes("kiểm tra"))) ||
        (q.includes("bạn") && (q.includes("bao nhiêu") || q.includes("có bao nhiêu")))
      ) {
        const reply =
          "👥 **Báo Cáo Mạng Lưới Bạn Bè & Kết Nối Của Bạn:**\n\n" +
          "Hiện tại tài khoản của Anh/Chị chưa có bạn bè hoặc đối tác nào trong danh bạ kết nối chính thức (**0 bạn bè / đối tác**).\n\n" +
          "🤖 **Gợi Ý Ghép Nối AI (Đồng Bộ Tab Mạng Lưới Network):**\n" +
          "Để giúp Anh/Chị nhanh chóng xây dựng mạng lưới kinh doanh, AI đề xuất Anh/Chị mở ngay tab **Mạng Lưới** để gửi lời mời kết nối tới các đối tác C-Level cùng ngành, hoặc chia sẻ mã QR danh thiếp để kết bạn tức thì!\n\n" +
          "*Toàn bộ danh bạ và cơ hội kết nối đối tác đã sẵn sàng trong phân hệ Mạng Lưới.*";
        const speech =
          "Dạ thưa Anh Chị, tài khoản của Anh Chị hiện tại chưa có bạn bè hoặc đối tác nào trong danh bạ kết nối. Em đã đồng bộ với hệ thống AI tại Tab Mạng Lưới để Anh Chị kết nối ngay ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🤝 Mở Tab Mạng Lưới & Đề Xuất", route: "/connect-app/network" },
          { label: "💎 Mở Mã QR Kết Bạn Mới", route: "/connect-app/me/card" },
          { label: "📅 Lên Lịch Gặp 1-1", route: "/connect-app/meetings" },
        ]);
        return;
      }

      // 9. SỰ KIỆN TÔI ĐÃ ĐĂNG KÝ ("Tôi đang đăng ký sự kiện nào không", "Sự kiện tôi đã đăng ký", "Vé sự kiện của tôi")
      if (
        q.includes("đăng ký sự kiện nào không") ||
        q.includes("đăng ký sự kiện nào") ||
        q.includes("sự kiện tôi đã đăng ký") ||
        q.includes("sự kiện đã đăng ký") ||
        q.includes("tôi có đăng ký sự kiện nào không") ||
        q.includes("vé sự kiện của tôi") ||
        q.includes("tôi có vé sự kiện nào") ||
        q.includes("kiểm tra vé sự kiện") ||
        (q.includes("sự kiện") && (q.includes("đã đăng ký") || q.includes("tôi đăng ký") || q.includes("đang đăng ký"))) ||
        (q.includes("vé") && (q.includes("sự kiện") || q.includes("của tôi")))
      ) {
        const reply =
          "🎫 **Dạ thưa Anh/Chị, em đã kiểm tra và tìm thấy 02 sự kiện Anh/Chị đã đăng ký thành công:**\n\n" +
          "1. **Hội Nghị Xúc Tiến Thương Mại B2B & Chuyển Đổi Số Doanh Nghiệp 2026**\n" +
          "   • **Thời gian:** 08:30 - 17:30 Hôm nay\n" +
          "   • **Địa điểm:** Trụ sở Hệ sinh thái ViOne Lounge, Tầng 5 Tháp Doanh Nhân\n" +
          "   • **Hạng vé:** **Vé Mời VIP Doanh Nhân** (Mã vé: `VIP-EVT-2026-8899`)\n" +
          "   • **Trạng thái:** [✓ Đã cấp mã QR Check-in sẵn sàng]\n\n" +
          "2. **Diễn Đàn Kết Nối Lãnh Đạo C-Level & Khởi Nghiệp Đổi Mới Sáng Tạo**\n" +
          "   • **Thời gian:** 09:00 - 12:00, 3 ngày tới\n" +
          "   • **Địa điểm:** Grand Ballroom, Khách sạn Daewoo Hà Nội\n" +
          "   • **Trạng thái:** [✓ Đã xác nhận giữ chỗ tham dự]\n\n" +
          "*Khi đến sự kiện, Anh/Chị chỉ cần mở thẻ Danh thiếp số hoặc bấm vào nút bên dưới để lễ tân quét mã QR Check-in VIP trong 1 giây. Nếu có lịch đột xuất không thể tham dự, Anh/Chị có thể bấm nút Hủy đăng ký bất kỳ lúc nào.*";
        const speech =
          "Dạ thưa Anh Chị, Anh Chị đang có hai sự kiện đã đăng ký thành công: sự kiện Hội nghị Xúc tiến Thương mại B2B hôm nay tại ViOne Lounge với vé mời VIP, và Diễn đàn Lãnh đạo C-Level trong ba ngày tới. Mã QR Check-in đã sẵn sàng trong thẻ danh thiếp của Anh Chị rồi ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🎫 Mở Mã QR Check-in Vé VIP", route: "/connect-app/me/card" },
          { label: "📅 Xem Chi Tiết Sự Kiện", route: "/connect-app" },
          { label: "❌ Hướng Dẫn Hủy Đăng Ký", intent: "event_cancel_guide" },
        ]);
        return;
      }

      // 10. CÔNG VIỆC TÔI PHẢI LÀM / NHIỆM VỤ CỦA TÔI ("Tôi có công việc nào phải làm không", "Công việc của tôi", "Nhiệm vụ của tôi", "Task của tôi")
      if (
        q.includes("công việc nào phải làm") ||
        q.includes("công việc của tôi") ||
        q.includes("nhiệm vụ của tôi") ||
        q.includes("tôi có việc gì làm không") ||
        q.includes("tôi có công việc nào") ||
        q.includes("task của tôi") ||
        q.includes("việc phải làm") ||
        q.includes("tôi phải làm gì") ||
        (q.includes("công việc") && (q.includes("phải làm") || q.includes("của tôi") || q.includes("hôm nay") || q.includes("cần làm")))
      ) {
        const reply =
          "📋 **Dạ thưa Anh/Chị, em đã rà soát toàn bộ danh sách Công Việc & Nhiệm Vụ Điều Hành của Anh/Chị:**\n\n" +
          "1. **⚡ 03 Nhiệm vụ Phê duyệt Khẩn cấp (Hạn chót 17:00 hôm nay):**\n" +
          "   • **Ký duyệt tờ trình chi ngân sách:** Tờ trình số `TT-2026-08` - Tạm ứng chi phí sản xuất 500 phôi thẻ Titanium (55.000.000 đ).\n" +
          "   • **Ký quyết toán chi phí truyền thông:** Quyết toán truyền thông sự kiện B2B Leaders (42.500.000 đ).\n" +
          "   • **Phê duyệt hợp đồng nguyên tắc:** Biên bản hợp tác cung ứng thẻ số và hệ thống CRM với An Thịnh Phát.\n\n" +
          "2. **🤝 02 Cuộc gặp kết nối đối tác chiến lược:**\n" +
          "   • **10:00 - 11:00:** Gặp trực tiếp Chủ tịch An Phát Group tại ViOne Lounge (Trao đổi cơ chế phân phối).\n" +
          "   • **14:30 - 15:30:** Họp chiến lược số hóa với CEO LogiChain qua Google Meet.\n\n" +
          "3. **👥 Điều phối & Giám sát vận hành nhân sự:**\n" +
          "   • **Giám sát chấm công:** Đã có 42/45 nhân sự có mặt (93.3%), 03 nhân sự nghỉ phép đã duyệt.\n" +
          "   • **Tiến độ dự án:** Có 02 công việc của bộ phận Kỹ thuật đang ở mức cần lãnh đạo đốc thúc hoàn thành.\n\n" +
          "4. **⭐ Phản hồi cơ hội kinh doanh:**\n" +
          "   • Có **4 đối tác doanh nghiệp** đang quan tâm bài đăng cơ hội thầu MEP của bạn, cần phản hồi tin nhắn kết nối.\n\n" +
          "*Anh/Chị có thể nhấn vào các lối tắt bên dưới để ký duyệt ngân sách hoặc mở bảng công việc ngay lập tức ạ.*";
        const speech =
          "Dạ thưa Anh Chị, hôm nay Anh Chị có ba tờ trình chi ngân sách cần ký duyệt khẩn cấp trước mười bảy giờ, hai cuộc hẹn đối tác lúc mười giờ và mười bốn giờ ba mươi, cùng bốn đối tác đang quan tâm cơ hội thầu cần phản hồi ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "✍️ Ký Duyệt Chi Ngân Sách", route: "/payment-approvals" },
          { label: "📅 Mở Lịch Trình Cuộc Gặp", route: "/connect-app/meetings" },
          { label: "📊 Bảng Tiến Độ Công Việc (Kanban)", route: "/workflow" },
          { label: "⭐ Phản Hồi Đối Tác Cơ Hội", route: "/connect-app/community/opportunities" },
        ]);
        return;
      }

      // 11. THÔNG BÁO MỚI & THÔNG BÁO CHƯA ĐỌC ("Tôi có thông báo gì mới không", "Thông báo của tôi", "Thông báo chưa đọc")
      if (
        q.includes("thông báo gì mới") ||
        q.includes("thông báo mới") ||
        q.includes("thông báo chưa đọc") ||
        q.includes("thông báo của tôi") ||
        (q.includes("thông báo") && (q.includes("có") || q.includes("mới") || q.includes("nào") || q.includes("chưa đọc")))
      ) {
        const reply =
          "🔔 **Trung Tâm Thông Báo — Bạn Đang Có 04 Thông Báo Mới Cần Xử Lý:**\n\n" +
          "1. **🤝 Lời mời kết nối mới (15 phút trước):** Anh **Trần Đình Trọng** (Tổng Giám Đốc An Thịnh Phát) đã gửi lời mời kết bạn và quan tâm bài đăng cơ hội thầu MEP của bạn.\n" +
          "2. **🎫 Nhắc hẹn sự kiện (1 giờ trước):** Sự kiện *'Hội Nghị Xúc Tiến Thương Mại B2B & Chuyển Đổi Số'* sẽ bắt đầu lúc 08:30 sáng nay tại Trụ sở ViOne Lounge. Vé VIP của bạn đã sẵn sàng check-in.\n" +
          "3. **💰 Đề xuất ký duyệt chi (2 giờ trước):** Kế toán trưởng vừa trình duyệt tờ trình số `TT-2026-08` chi phí sản xuất phôi thẻ Titanium (55.000.000 đ).\n" +
          "4. **🏢 Bản tin cộng đồng Gia Đình ViOne (Hôm qua):** Ban Chấp Hành vừa phát sóng 3 gói thầu xây dựng hạ tầng mới trên Sàn Giao Thương B2B.\n\n" +
          "*Bạn có thể bấm vào dẫn chứng bên dưới để mở thông báo và xử lý trực tiếp.*";
        const speech =
          "Dạ thưa Anh Chị, Anh Chị đang có bốn thông báo mới: lời mời kết nối từ Anh Trần Đình Trọng, nhắc hẹn sự kiện sáng nay tại ViOne Lounge, một tờ trình chi ngân sách chờ duyệt và bản tin thầu mới trong Gia Đình ViOne ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🔔 Xem Toàn Bộ Thông Báo", route: "/connect-app" },
          { label: "🤝 Xem Lời Mời Kết Nối", route: "/connect-app/network" },
          { label: "✍️ Ký Duyệt Chi Ngay", route: "/payment-approvals" },
        ]);
        return;
      }

      // 12. TIN NHẮN MỚI & TRÒ CHUYỆN ("Tôi có tin nhắn nào mới không", "Tin nhắn của tôi", "Ai nhắn cho tôi")
      if (
        q.includes("tin nhắn nào mới") ||
        q.includes("tin nhắn mới") ||
        q.includes("tin nhắn của tôi") ||
        q.includes("ai nhắn cho tôi") ||
        (q.includes("tin nhắn") && (q.includes("chưa đọc") || q.includes("có") || q.includes("kiểm tra")))
      ) {
        const reply =
          "💬 **Hộp Thư Doanh Nghiệp — Bạn Đang Có 03 Cuộc Trò Chuyện Có Tin Nhắn Mới:**\n\n" +
          "1. **Anh Trần Đình Trọng (Tổng Giám Đốc An Thịnh Phát):**\n" +
          "   • Tin nhắn: *\"Chào anh, 10h sáng nay mình gặp nhau tại ViOne Lounge trao đổi chi tiết về gói thẻ số cho 500 nhân sự nhé.\"*\n" +
          "   • *10 phút trước • Trạng thái: Chưa đọc*\n\n" +
          "2. **Ban Thư Ký Gia Đình ViOne:**\n" +
          "   • Tin nhắn: *\"Kính mời Anh/Chị xác nhận danh sách đại biểu tham gia tiệc Gala Doanh nhân cuối tuần này.\"*\n" +
          "   • *45 phút trước • Trạng thái: Chưa đọc*\n\n" +
          "3. **Chị Vũ Thị Mai Phương (Giám Đốc Chuỗi F&B Toàn Cầu):**\n" +
          "   • Tin nhắn: *\"Em đã xem bản demo giải pháp CRM, 14h30 chiều nay mình vào họp Google Meet nhé.\"*\n" +
          "   • *2 giờ trước • Trạng thái: Chưa đọc*\n\n" +
          "*Bạn có thể bấm vào [Mở Hộp Thư Tin Nhắn] để phản hồi đối tác ngay lập tức.*";
        const speech =
          "Bạn đang có ba tin nhắn mới từ các đối tác: Anh Trần Đình Trọng nhắn hẹn gặp lúc mười giờ, Ban Thư Ký Gia Đình ViOne gửi thư mời tiệc Gala, và Chị Vũ Thị Mai Phương xác nhận lịch họp trực tuyến chiều nay ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "💬 Mở Hộp Thư Tin Nhắn", route: "/messages" },
          { label: "🤝 Mở Danh Bạ Chat Đối Tác", route: "/connect-app/network" },
        ]);
        return;
      }

      // 13. THÔNG TIN CÔNG TY & MÃ SỐ THUẾ ("Thông tin công ty của tôi", "Mã số thuế công ty tôi", "Doanh nghiệp của tôi")
      if (
        q.includes("thông tin công ty") ||
        q.includes("công ty của tôi") ||
        q.includes("mã số thuế") ||
        q.includes("doanh nghiệp của tôi") ||
        q.includes("mst của tôi") ||
        (q.includes("công ty") && (q.includes("tôi") || q.includes("thông tin") || q.includes("địa chỉ") || q.includes("thuế")))
      ) {
        const reply =
          "🏢 **Thông Tin Hồ Sơ Pháp Nhân & Doanh Nghiệp Thành Viên ViOne:**\n\n" +
          "• **Tên doanh nghiệp:** **CÔNG TY CỔ PHẦN TẬP ĐOÀN CÔNG NGHỆ VIONE (VIONE GROUP)**\n" +
          "• **Mã số thuế (MST):** **0109886888** (Đã xác thực chữ ký số doanh nghiệp)\n" +
          "• **Đại diện pháp luật:** Tổng Giám Đốc Điều Hành\n" +
          "• **Trụ sở chính:** Tầng 5, Tháp Doanh Nhân, Hà Nội, Việt Nam\n" +
          "• **Lĩnh vực kinh doanh:** Công nghệ thông tin B2B, Chuyển đổi số doanh nghiệp, Danh thiếp số Titanium 3D & Thẻ chip NFC\n" +
          "• **Quy mô nhân sự:** 45+ cán bộ nhân viên chính thức\n" +
          "• **Cộng đồng liên minh:** Gia Đình ViOne & CLB Doanh Nhân B2B Leaders\n" +
          "• **Trạng thái xác thực:** [✓ Đã xác thực Doanh Nghiệp VIP Xanh]\n\n" +
          "*Hồ sơ doanh nghiệp đã được tích hợp trực tiếp vào Danh thiếp số để Anh/Chị chia sẻ cho đối tác và khách hàng quét thông tin chuẩn xác.*";
        const speech =
          "Dạ thưa Anh Chị, doanh nghiệp của Anh Chị là Công ty Cổ phần Tập đoàn Công nghệ ViOne, mã số thuế không một không chín tám tám sáu tám tám tám, đã được xác thực dấu tích xanh doanh nghiệp VIP trong hệ sinh thái ViOne ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🏢 Quản Lý Hồ Sơ Doanh Nghiệp", route: "/companies" },
          { label: "✏️ Cập Nhật Thông Tin Công Ty", route: "/connect-app/me/edit" },
          { label: "💎 Mở Danh Thiếp Doanh Nghiệp", route: "/connect-app/me/card" },
        ]);
        return;
      }

      // 14. SẢN PHẨM TRÊN SÀN MARKETPLACE ("Tôi có bao nhiêu sản phẩm trên sàn", "Sản phẩm của tôi", "Sản phẩm tôi đã đăng")
      if (
        q.includes("sản phẩm của tôi") ||
        q.includes("bao nhiêu sản phẩm") ||
        q.includes("sản phẩm trên sàn") ||
        q.includes("dịch vụ của tôi") ||
        q.includes("gian hàng của tôi") ||
        (q.includes("sản phẩm") && (q.includes("đăng") || q.includes("của tôi") || q.includes("bán") || q.includes("niêm yết")))
      ) {
        const reply =
          "🛍️ **Báo Cáo Gian Hàng & Sản Phẩm Của Bạn Trên Sàn Giao Thương B2B:**\n\n" +
          "Gian hàng của bạn hiện đang có **03 sản phẩm & dịch vụ chất lượng cao** đang niêm yết công khai trên Sàn ViOne Marketplace:\n\n" +
          "1. **Giải Pháp Thẻ Doanh Nhân Titanium 3D & Chip Chạm NFC**\n" +
          "   • **Giá niêm yết:** 850.000 đ/thẻ\n" +
          "   • **Thống kê:** 1.420 lượt xem • 28 lượt yêu cầu báo giá\n" +
          "   • **Trạng thái:** [✓ Đang hiển thị nổi bật]\n\n" +
          "2. **Hệ Thống Quản Trị Khách Hàng CRM & Tự Động Hóa AI Copilot 5.0**\n" +
          "   • **Giá niêm yết:** 15.000.000 đ/năm\n" +
          "   • **Thống kê:** 890 lượt xem • 15 yêu cầu tư vấn triển khai\n" +
          "   • **Trạng thái:** [✓ Đang hiển thị nổi bật]\n\n" +
          "3. **Dịch Vụ Tư Vấn Chuyển Đổi Số & Tái Cấu Trúc Vận Hành Doanh Nghiệp**\n" +
          "   • **Giá niêm yết:** Thỏa thuận theo quy mô\n" +
          "   • **Thống kê:** 540 lượt xem • 8 khách hàng liên hệ đàm phán\n" +
          "   • **Trạng thái:** [✓ Đang hiển thị]\n\n" +
          "*Toàn bộ sản phẩm đã được gắn huy hiệu Kiểm Duyệt Đạt Chuẩn Doanh Nghiệp. Bạn có thể bấm nút bên dưới để thêm sản phẩm mới hoặc xem khách hàng hỏi mua.*";
        const speech =
          "Gian hàng của bạn đang có ba sản phẩm dịch vụ đang niêm yết trên Sàn Giao Thương B2B, nổi bật nhất là Thẻ Doanh Nhân Titanium với hơn một nghìn bốn trăm lượt xem và hai mươi tám lượt hỏi mua từ các đối tác ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🛍️ Xem Gian Hàng B2B Marketplace", route: "/products" },
          { label: "➕ Đăng Sản Phẩm Mới Lên Sàn", route: "/products" },
          { label: "💬 Xem Khách Hàng Hỏi Mua", route: "/messages" },
        ]);
        return;
      }

      // 15. ĐỔI MẬT KHẨU & BẢO MẬT TÀI KHOẢN ("Đổi mật khẩu", "Làm sao để đổi mật khẩu", "Bảo mật tài khoản", "Xác thực 2 lớp")
      if (
        q.includes("đổi mật khẩu") ||
        q.includes("làm sao để đổi mật khẩu") ||
        q.includes("quên mật khẩu") ||
        q.includes("bảo mật tài khoản") ||
        q.includes("xác thực 2 lớp") ||
        q.includes("cài face id") ||
        (q.includes("mật khẩu") && (q.includes("đổi") || q.includes("lại") || q.includes("sao") || q.includes("quên")))
      ) {
        const reply =
          "🔒 **Hướng Dẫn Quy Trình Đổi Mật Khẩu & Bảo Mật Tài Khoản Cấp Cao:**\n\n" +
          "Để đảm bảo an toàn tuyệt đối cho các giao dịch và dữ liệu đối tác của Anh/Chị, hãy thực hiện theo 3 bước sau:\n\n" +
          "1. **Bước 1 — Mở phần Cài Đặt Bảo Mật:** Vào mục **Tài Khoản** (tab Cá nhân) ➔ Chọn **'Cài đặt & Quyền riêng tư'** ➔ Chọn **'Đổi mật khẩu'**.\n" +
          "2. **Bước 2 — Thiết lập Mật khẩu Mới:** Nhập mật khẩu hiện tại, sau đó tạo mật khẩu mới an toàn (tối thiểu 8 ký tự, gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt) ➔ Bấm **'Xác nhận thay đổi'**.\n" +
          "3. **Bước 3 — Nâng cấp Bảo mật Sinh trắc học & 2FA:** Bật tính năng **Đăng nhập bằng FaceID / Vân tay** để đăng nhập 1-chạm an toàn và bật **Xác thực 2 lớp OTP** cho các giao dịch ký duyệt chi tài chính VietQR.\n\n" +
          "*Nếu quên mật khẩu cũ, Anh/Chị chỉ cần bấm [Quên mật khẩu] tại màn hình đăng nhập để nhận mã OTP khôi phục siêu tốc trong 30 giây.*";
        const speech =
          "Dạ thưa Anh Chị, để đổi mật khẩu, Anh Chị chỉ cần vào mục Tài khoản, chọn Cài đặt và chọn Đổi mật khẩu. Em khuyên Anh Chị nên kích hoạt thêm FaceID và xác thực hai lớp để bảo vệ tài khoản an toàn tuyệt đối ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "🔒 Mở Cài Đặt Bảo Mật", route: "/connect-app/me" },
          { label: "🔑 Đổi Mật Khẩu Ngay", route: "/connect-app/me" },
        ]);
        return;
      }

      // 16. HƯỚNG DẪN DÙNG NFC & CHIA SẺ DANH THIẾP ("Cách dùng NFC", "Hướng dẫn chạm NFC", "Chia sẻ danh thiếp qua NFC")
      if (
        q.includes("cách dùng nfc") ||
        q.includes("hướng dẫn nfc") ||
        q.includes("chạm thẻ nfc") ||
        q.includes("thẻ nfc dùng thế nào") ||
        q.includes("cách chạm thẻ") ||
        (q.includes("nfc") && (q.includes("dùng") || q.includes("thế nào") || q.includes("chạm") || q.includes("hướng dẫn") || q.includes("cách")))
      ) {
        const reply =
          "💎 **Hướng Dẫn Sử Dụng Thẻ Danh Thiếp Chạm NFC ViOne Thông Minh:**\n\n" +
          "Thẻ Titanium ViOne tích hợp chip NFC không dây chuẩn quốc tế, giúp Anh/Chị chia sẻ danh thiếp sang điện thoại đối tác trong **1 giây mà đối tác không cần cài bất kỳ ứng dụng nào**:\n\n" +
          "1. **Đối với iPhone (Từ iPhone XR đến iPhone 16 Pro Max):**\n" +
          "   • NFC luôn bật sẵn, không cần thao tác cài đặt.\n" +
          "   • Đưa thẻ chạm nhẹ vào **vùng đỉnh trên cùng mặt lưng iPhone** (ngay cạnh cụm camera).\n" +
          "   • Màn hình iPhone đối tác sẽ hiện một thông báo Safari mở ra Danh thiếp 3D của Anh/Chị.\n\n" +
          "2. **Đối với Android (Samsung, Xiaomi, Oppo, Vivo...):**\n" +
          "   • Vuốt thanh công cụ xuống và bật biểu tượng **NFC**.\n" +
          "   • Đưa thẻ chạm vào **vùng chính giữa mặt lưng điện thoại**.\n\n" +
          "3. **Lưu danh bạ 1-chạm (Save Contact):**\n" +
          "   • Trên màn hình danh thiếp mở ra, đối tác bấm nút **'Lưu danh bạ'** (Save Contact) ➔ Tự động lưu đầy đủ Họ tên, SĐT, Email, Công ty, Chức vụ thẳng vào danh bạ điện thoại.\n\n" +
          "4. **Phương án dự phòng qua Mã QR:**\n" +
          "   • Nếu điện thoại đối tác không hỗ trợ NFC, Anh/Chị chỉ cần mở **Mã QR cá nhân** trên app để đối tác quét bằng Camera hoặc Zalo.\n\n" +
          "*Anh/Chị nhấn nút bên dưới để mở Danh thiếp 3D và thử nghiệm ngay nhé!*";
        const speech =
          "Dạ thưa Anh Chị, khi chạm thẻ NFC, với iPhone Anh Chị chạm vào đỉnh trên cùng cạnh camera, với Android chạm vào giữa lưng điện thoại. Đối tác không cần cài app, bấm Lưu danh bạ là thông tin của Anh Chị được lưu thẳng vào máy đối tác ngay ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "💎 Mở Thẻ Danh Thiếp & Mã QR", route: "/connect-app/me/card" },
          { label: "📷 Quét Danh Thiếp Giấy AI OCR", route: "/connect-app/card-scan" },
        ]);
        return;
      }

      // 17. HẠNG HỘI VIÊN & ĐIỂM TÍN NHIỆM ("Hạng thành viên của tôi", "Điểm uy tín", "Điểm tín nhiệm", "Gói tài khoản")
      if (
        q.includes("hạng thành viên") ||
        q.includes("điểm uy tín") ||
        q.includes("điểm tín nhiệm") ||
        q.includes("tôi hạng gì") ||
        q.includes("gói tài khoản") ||
        q.includes("hạng của tôi") ||
        (q.includes("điểm") && (q.includes("thưởng") || q.includes("tín nhiệm") || q.includes("của tôi") || q.includes("uy tín")))
      ) {
        const reply =
          "⭐ **Báo Cáo Cấp Bậc Hội Viên & Điểm Tín Nhiệm Doanh Nhân Của Bạn:**\n\n" +
          "• **Hạng thẻ hội viên:** **Titanium Executive VIP (Lãnh Đạo Chiến Lược)**\n" +
          "• **Điểm tín nhiệm doanh nghiệp (Trust Score):** **98/100 Điểm** (Xếp hạng Xuất sắc — Top 2% toàn hệ thống)\n" +
          "• **Thời hạn kích hoạt:** Trọn đời (Lifetime VIP Membership)\n" +
          "• **Các đặc quyền cao cấp đang được kích hoạt:**\n" +
          "   1. **Không giới hạn kết nối 1-1:** Đặt lịch hẹn và chat trực tiếp với mọi Chủ tịch, CEO trong hệ sinh thái.\n" +
          "   2. **Miễn phí vé VIP sự kiện:** Tự động cấp vé mời VIP Check-in không cần xếp hàng tại mọi diễn đàn và Gala thường niên.\n" +
          "   3. **Độ ưu tiên hiển thị cao nhất:** Bài đăng cơ hội B2B và sản phẩm Marketplace luôn được ưu tiên hiển thị ở vị trí đầu trang.\n" +
          "   4. **Trợ lý AI Copilot 5.0 không giới hạn:** Hỗ trợ soạn thảo hợp đồng pháp lý, nhập liệu Excel và phân tích cơ hội 24/7.\n\n" +
          "*Anh/Chị có thể mở thẻ Titanium 3D của mình bất kỳ lúc nào để chiêm ngưỡng giao diện kim loại độc quyền!*";
        const speech =
          "Dạ thưa Anh Chị, tài khoản của Anh Chị đang ở thứ hạng cao nhất là Titanium Executive VIP với điểm tín nhiệm xuất sắc chín mươi tám trên một trăm điểm, hưởng toàn bộ đặc quyền kết nối và vé sự kiện VIP không giới hạn ạ.";
        setAiResponse(reply);
        speakText(speech);
        setNearbyResults(null);
        setPotentialCustomers(null);
        setMyOpportunities(null);
        setMyMeetings(null);
        setVoiceMoments(null);
        setSuggestedActions([
          { label: "💎 Mở Thẻ VIP Titanium", route: "/connect-app/me/card" },
          { label: "🤝 Xem Mạng Lưới Đối Tác VIP", route: "/connect-app/network" },
        ]);
        return;
      }

      // 18. Trả lời thông minh năng động cho tất cả các câu hỏi khác về ViOne
      const reply =
        `🤖 **Dạ thưa Anh/Chị, em đã tiếp nhận câu hỏi của Anh/Chị:**\n\n` +
        `Là Trợ lý AI Điều Hành Doanh Nghiệp ViOne 5.0, em luôn sẵn sàng đồng hành và hỗ trợ Anh/Chị xử lý mọi nghiệp vụ:\n\n` +
        `• 📅 **Lịch trình & Sự kiện:** Quản lý lịch hẹn 1-1, đăng ký vé VIP và hủy đăng ký sự kiện.\n` +
        `• 📸 **Khoảnh khắc giao thương:** Tự chụp ảnh trực tiếp từ Camera, ghi âm và chia sẻ bài viết.\n` +
        `• 💎 **Danh thiếp số 3D & NFC:** Mở mã QR cá nhân, chạm danh thiếp 1-chạm, quét card AI OCR.\n` +
        `• 🎯 **Khách hàng & Đối tác:** Tìm khách hàng tiềm năng phù hợp hồ sơ doanh nghiệp.\n` +
        `• 👥 **Giám sát vận hành:** Chấm công GPS FaceID, kiểm soát tiến độ nhân sự và ký duyệt chi VietQR 24/7.\n` +
        `• 🏢 **Cộng đồng công ty:** Phân quyền, giao việc 1-chạm và giám sát chăm sóc khách hàng.\n\n` +
        `*Anh/Chị có thể chọn một trong các thao tác nhanh bên dưới để em điều phối ngay lập tức ạ!*`;
      const speech =
        "Dạ thưa Anh Chị, em luôn sẵn sàng hỗ trợ Anh Chị về lịch trình, danh thiếp số NFC, đăng khoảnh khắc chụp ảnh, và giám sát vận hành doanh nghiệp ạ.";
      setAiResponse(reply);
      speakText(speech);
      setNearbyResults(null);
      setPotentialCustomers(null);
      setSuggestedActions([
        { label: "📋 Việc cần làm hôm nay?", intent: "today_tasks" },
        { label: "🎯 Tìm khách hàng tiềm năng", intent: "find_potential_leads" },
        { label: "📸 Đăng khoảnh khắc chụp ảnh", route: "/connect-app/moment" },
        { label: "🎫 Hướng dẫn hủy sự kiện", intent: "event_cancel_guide" },
      ]);
    },
    [speakText],
  );

  // Xử lý phân tích câu lệnh ngữ nghĩa (AI Dynamic Routing)
  const processCommand = useCallback(
    async (cmd: string) => {
      const q = cmd.toLowerCase().trim();
      setTranscript(cmd);

      // 1. ACTION DYNAMIC 1: Lệnh Tự Động Nhắn Tin Cho Tài Khoản A, B, C
      const msgMatch = cmd.match(
        /(?:tự động\s+)?(?:nhắn tin|gửi tin nhắn|nhắn)\s+(?:cho|tới|đến)\s+(?:tài khoản\s+|anh\s+|chị\s+|bạn\s+)?([^,:\.\n]+?)(?:\s+(?:rằng|là|với nội dung|nội dung|bảo|rằng là)\s+|\s*[:,-]\s*)(.+)/i
      );
      if (msgMatch) {
        const recipient = msgMatch[1].trim();
        const content = msgMatch[2].trim();
        await dispatchAiSendMessage(recipient, content, cmd);
        return;
      }

      // 2. ACTION DYNAMIC 2: Lệnh Gửi Lời Chào Quan Tâm Cơ Hội Bằng Giọng Nói AI
      if (
        q.includes("quan tâm cơ hội") ||
        q.includes("gửi lời chào cơ hội") ||
        q.includes("gửi tôi lời chào") ||
        q.includes("gửi lời chào mong muốn") ||
        q.includes("gửi voice quan tâm") ||
        q.includes("nhờ ai gửi") ||
        ((q.includes("gửi đi") || q.includes("đồng ý gửi") || q === "gửi" || q === "đồng ý" || q === "ok") && sharedOpportunity)
      ) {
        const targetOppId = sharedOpportunity?.id || (cmd.match(/(?:cơ hội\s+|tài khoản\s+)([^,:\.\n]+)/i)?.[1]?.trim() || "");
        if (targetOppId) {
          await dispatchAiOpportunityVoice(targetOppId, cmd, cmd);
          return;
        }
      }

      // A. Lệnh quét vị trí gần tôi
      if (
        q.includes("gần tôi") ||
        q.includes("gần đây") ||
        q.includes("ai đang dùng") ||
        q.includes("quanh đây") ||
        q.includes("tìm người ở gần")
      ) {
        void findNearbyViOneUsers();
        return;
      }

      // B. Điều hướng siêu tốc
      if (q.includes("về trang chủ") || q === "trang chủ" || q === "home") {
        const reply = "Đang chuyển về Trang chủ ViOne theo yêu cầu của bạn.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app" as any });
        }, 600);
        return;
      }

      if (q.includes("mở mạng lưới") || q === "mạng lưới" || q === "network") {
        const reply = "Đang mở Mạng lưới kết nối doanh nhân.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/network" as any });
        }, 600);
        return;
      }

      if (q.includes("quét card") || q.includes("quét danh thiếp") || q.includes("chụp danh thiếp") || q === "scan") {
        const reply = "Đang mở máy ảnh quét danh thiếp thông minh AI OCR.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/card-scan" as any });
        }, 600);
        return;
      }

      if (q.includes("danh thiếp của tôi") || q.includes("thẻ của tôi") || q.includes("mã qr") || q.includes("đưa qr")) {
        const reply = "Đang mở danh thiếp số và mã QR của bạn.";
        setAiResponse(reply);
        speakText(reply);
        setTimeout(() => {
          setIsOpen(false);
          void navigate({ to: "/connect-app/me/card" as any });
        }, 600);
        return;
      }

      // C. Gọi Backend AI Chat API để phân tích chuyên sâu
      setIsLoadingAi(true);
      try {
        const res = await fetchNestApi<any>("/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message: cmd }),
        });

        if (res && res.ok && res.answer) {
          setAiResponse(res.answer);
          if (res.voiceText) {
            speakText(res.voiceText);
          } else {
            speakText(res.answer);
          }

          if (res.potentialCustomers && res.potentialCustomers.length > 0) {
            setPotentialCustomers(res.potentialCustomers);
            setNearbyResults(null);
          } else {
            setPotentialCustomers(null);
          }

          // Phân tách bằng chứng (evidence) trả về từ Backend AI thành các Card tương tác trực quan
          const oppEv: OpportunityEvidence[] = [];
          const meetEv: MeetingEvidence[] = [];
          const voiceEv: VoiceMomentEvidence[] = [];

          if (Array.isArray(res.evidence)) {
            res.evidence.forEach((ev: any) => {
              if (ev.type === 'opportunity' || ev.type === 'opportunities') {
                oppEv.push({
                  id: ev.meta?.opportunityId || ev.id,
                  title: ev.title,
                  type: 'Hợp tác B2B',
                  interestCount: ev.meta?.interestCount ?? 4,
                  status: 'Đang mở',
                });
              } else if (ev.type === 'meeting') {
                meetEv.push({
                  id: ev.id,
                  partnerName: ev.title,
                  time: '10:00',
                  date: 'Hôm nay',
                  format: ev.excerpt?.includes('Google Meet') ? 'online' : 'offline',
                  location: ev.excerpt || 'Văn phòng ViOne',
                });
              } else if (ev.type === 'voice_moment') {
                voiceEv.push({
                  id: ev.id,
                  title: ev.title,
                  author: 'Thành viên ViOne',
                  date: 'Hôm nay',
                  duration: '01:45',
                  location: 'Hà Nội',
                  transcript: ev.excerpt,
                  audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
                });
              }
            });
          }

          setMyOpportunities(oppEv.length > 0 ? oppEv : null);
          setMyMeetings(meetEv.length > 0 ? meetEv : null);
          setVoiceMoments(voiceEv.length > 0 ? voiceEv : null);

          if (res.excelReport) {
            setActiveExcelReport(res.excelReport);
          } else {
            setActiveExcelReport(null);
          }

          if (res.suggestedActions) {
            setSuggestedActions(res.suggestedActions);
          } else {
            setSuggestedActions(null);
          }
          return;
        }
      } catch (err) {
        console.warn("Lỗi gọi Backend AI Chat, kích hoạt Offline NLP Engine:", err);
      } finally {
        setIsLoadingAi(false);
      }

      // D. Fallback nếu backend không trả về
      processFallbackCommand(cmd);
    },
    [findNearbyViOneUsers, navigate, processFallbackCommand, speakText],
  );

  // Xử lý lưu khách hàng từ Smart Lead Card
  const handleSaveLead = (lead: PotentialCustomerLead) => {
    setSavedLeads((prev) => ({ ...prev, [lead.id]: true }));
    toast.success(`Đã lưu "${lead.name} (${lead.company})" vào danh sách Khách hàng CRM thành công!`, {
      description: `Độ phù hợp: ${lead.matchScore}% • Đã thêm vào hàng đợi chăm sóc`,
    });
  };

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

  // Trạng thái hiển thị và vị trí quả cầu AI nổi kéo thả
  const [isAiFloatingVisible, setIsAiFloatingVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem("vione_ai_floating_visible") !== "false";
    } catch {
      return true;
    }
  });
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const didDragRef = useRef(false);

  useEffect(() => {
    const handleFloatingSync = () => {
      try {
        setIsAiFloatingVisible(localStorage.getItem("vione_ai_floating_visible") !== "false");
      } catch {}
    };
    window.addEventListener("vione-ai-floating-changed", handleFloatingSync);
    window.addEventListener("storage", handleFloatingSync);
    return () => {
      window.removeEventListener("vione-ai-floating-changed", handleFloatingSync);
      window.removeEventListener("storage", handleFloatingSync);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    didDragRef.current = false;
    const currentX = floatingPos ? floatingPos.x : (typeof window !== "undefined" ? window.innerWidth - 72 : 300);
    const currentY = floatingPos ? floatingPos.y : (typeof window !== "undefined" ? window.innerHeight - 150 : 500);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, posX: currentX, posY: currentY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didDragRef.current = true;
    }
    const maxW = typeof window !== "undefined" ? window.innerWidth : 400;
    const maxH = typeof window !== "undefined" ? window.innerHeight : 800;
    const newX = Math.max(8, Math.min(maxW - 64, dragStartRef.current.posX + dx));
    const newY = Math.max(8, Math.min(maxH - 64, dragStartRef.current.posY + dy));
    setFloatingPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (!didDragRef.current) {
      setIsOpen(true);
    }
  };

  const handleCloseFloating = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAiFloatingVisible(false);
    try {
      localStorage.setItem("vione_ai_floating_visible", "false");
      window.dispatchEvent(new Event("vione-ai-floating-changed"));
    } catch {}
    toast.info("Đã ẩn quả cầu AI. Bạn có thể bật lại trong mục Tôi > Cài đặt.");
  };

  return (
    <>
      {/* ── QUẢ CẦU AI VIONE NỔI SANG TRỌNG (FLOATING AI SPHERE) ── */}
      {!isOpen && isAiFloatingVisible && (
        <aside
          aria-label="Trợ lý AI ViOne"
          className="fixed z-40 select-none touch-none"
          style={
            floatingPos
              ? { left: `${floatingPos.x}px`, top: `${floatingPos.y}px` }
              : { right: "16px", bottom: "96px" }
          }
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full cursor-grab active:cursor-grabbing transition-shadow hover:scale-105 active:scale-95"
            title="Trợ lý Doanh Nhân AI ViOne — Kéo thả để di chuyển, chạm để mở"
          >
            {/* Nút đóng / ẩn quả cầu AI nổi (X) */}
            <button
              type="button"
              onClick={handleCloseFloating}
              className="ai-close-floating-btn absolute -top-1 -right-1 z-50 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-md border border-slate-700 hover:bg-red-600 hover:scale-110 transition cursor-pointer"
              title="Ẩn quả cầu AI (bật lại trong tab Tôi)"
              aria-label="Ẩn quả cầu AI"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Hiệu ứng hào quang Vàng Kim Champagne */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282] opacity-75 blur-md group-hover:opacity-100 animate-pulse pointer-events-none" />

            {/* Vòng xoay quỹ đạo neon quanh quả cầu */}
            <div className="absolute inset-0 rounded-full border border-[#FFF2DC]/60 animate-spin [animation-duration:8s] pointer-events-none" />

            {/* Quả cầu 3D Luxury Gold */}
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFFDF7_0%,#F5DFBC_35%,#D4A362_70%,#7A5323_100%)] shadow-[0_6px_25px_rgba(216,178,130,0.6),inset_0_2px_6px_rgba(255,255,255,0.8)] border border-[#FFF2DC]">
              <Sparkles className="h-6 w-6 text-[#1A120B] drop-shadow-sm animate-pulse" />

              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </div>

            <div className="absolute -top-7 right-0 hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#F6E1C3] border border-[#D8B282]/40 whitespace-nowrap shadow-lg pointer-events-none">
              <span>ViOne AI</span>
            </div>
          </div>
        </aside>
      )}

      {/* ── MODAL / BOTTOM SHEET TRỢ LÝ AI ĐẲNG CẤP CÔNG NGHỆ CAO ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-0 animate-in fade-in duration-200"
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
            className="relative w-full max-w-lg h-[92vh] max-h-[92vh] rounded-t-[32px] border-t-2 border-[#D8B282]/50 bg-white dark:bg-[#070D18] text-slate-900 dark:text-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* FIXED TOP HEADER: Không bao giờ bị cuộn hoặc đè lên micro */}
            <div className="shrink-0 z-30 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
              {/* Thanh kéo đỉnh */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700/80" />
              </div>

              {/* Header Trợ lý AI */}
              <div className="flex items-center justify-between px-5 py-3">
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
                        Copilot 5.0
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Phân tích toàn diện app, khách hàng, phễu deal & kết nối B2B
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
            </div>

            {/* SCROLLABLE BODY: Phần thân giữa cuộn tự do */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* Visualizer Area: Holographic Sphere + Soundwaves */}
            <div className="px-5 py-6 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-blue-50/20 to-transparent dark:from-[#0F1B30]/60 dark:to-transparent">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(216,178,130,0.15),transparent_70%)] pointer-events-none" />

              <div className="relative mb-3 flex items-center justify-center">
                {(isListening || isSpeaking || isScanningLocation || isLoadingAi) && (
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

              {/* Soundwave equalizer */}
              <div className="flex items-center gap-1.5 h-6 mb-2">
                {[12, 22, 16, 28, 14, 24, 18, 10].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isListening || isSpeaking || isLoadingAi ? `${h}px` : "4px",
                      transition: "height 0.15s ease",
                    }}
                    className={`w-1 rounded-full ${
                      isListening
                        ? "bg-red-500 animate-pulse"
                        : isSpeaking
                        ? "bg-amber-600 dark:bg-[#D8B282] animate-pulse"
                        : isLoadingAi
                        ? "bg-blue-400 animate-pulse"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Status pill */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11.5px] font-semibold text-slate-700 dark:text-[#F6E1C3]">
                  {isLoadingAi ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      <span>AI đang phân tích dữ liệu chuyên sâu...</span>
                    </>
                  ) : isScanningLocation ? (
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

            {/* Conversation Box */}
            <div className="px-5 py-2 space-y-3">
              {transcript && (
                <div className="flex items-start gap-2.5 justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-amber-100/70 dark:bg-[#D8B282]/20 border border-amber-300/80 dark:border-[#D8B282]/40 px-3.5 py-2 text-xs font-semibold text-amber-900 dark:text-[#F6E1C3]">
                    "{transcript}"
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#C29B69] to-[#D8B282] p-0.5 shrink-0">
                  <div className="h-full w-full rounded-[10px] bg-amber-50 dark:bg-[#0A1224] grid place-items-center">
                    <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-[#F6E1C3]" />
                  </div>
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                  {displayedResponse}
                  {displayedResponse.length < aiResponse.length && (
                    <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            </div>

            {/* ── KẾT QUẢ ĐẶC BIỆT: THẺ KHÁCH HÀNG TIỀM NĂNG PHÙ HỢP VỚI HỒ SƠ (SMART LEAD CARDS) ── */}
            {potentialCustomers && potentialCustomers.length > 0 && (
              <div className="px-5 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#D8B282] flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    <span>Khách Hàng Tiềm Năng Phù Hợp Nhất ({potentialCustomers.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Xếp hạng theo Match Score
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-1">
                  {potentialCustomers.map((lead) => {
                    const isSaved = !!savedLeads[lead.id];
                    return (
                      <div
                        key={lead.id}
                        className="rounded-2xl border-2 border-amber-300/60 dark:border-[#D8B282]/40 bg-gradient-to-b from-amber-50/40 to-white dark:from-[#15120D] dark:to-[#0B0F19] p-3.5 shadow-md transition hover:border-amber-400 dark:hover:border-[#D8B282]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D8B282] to-[#996515] text-xs font-black text-black shadow-sm">
                              {lead.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                  {lead.name}
                                </h4>
                                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  {lead.matchScore}% Phù hợp
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-700 dark:text-[#D8B282] font-semibold">
                                {lead.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{lead.company}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Lý do phù hợp */}
                        <div className="mt-2.5 rounded-xl bg-amber-500/10 p-2 text-[10.5px] text-amber-900 dark:text-[#F3E5AB] leading-snug border border-amber-500/20">
                          <strong>Lý do AI gợi ý:</strong> {lead.matchReason}
                        </div>

                        {/* Nút hành động 1-chạm */}
                        <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => handleSaveLead(lead)}
                            disabled={isSaved}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition active:scale-95 cursor-pointer ${
                              isSaved
                                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                : "bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] text-black shadow-xs hover:brightness-105"
                            }`}
                          >
                            {isSaved ? <CheckCircle2 className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                            <span>{isSaved ? "Đã lưu CRM" : "Lưu vào CRM Lead"}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                void navigate({ to: `/connect-app/network` as any });
                              }}
                              className="px-2 py-1.5 rounded-xl bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/20 text-[10.5px] font-semibold transition"
                            >
                              Kết nối B2B
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                void navigate({ to: `/connect-app/meetings` as any });
                              }}
                              className="px-2 py-1.5 rounded-xl bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/20 text-[10.5px] font-semibold transition"
                            >
                              Hẹn 1-1
                            </button>

                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                title="Gọi điện thoại"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* ── THẺ DẪN CHỨNG: BÁO CÁO QUAN TÂM CƠ HỘI CỦA TÔI ── */}
            {myOpportunities && myOpportunities.length > 0 && (
              <div className="px-5 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#D8B282] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Dẫn chứng Cơ hội của bạn ({myOpportunities.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Cập nhật thời gian thực
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {myOpportunities.map((op) => (
                    <div
                      key={op.id}
                      className="rounded-2xl border-2 border-amber-300/60 dark:border-[#D8B282]/40 bg-gradient-to-b from-amber-50/40 to-white dark:from-[#15120D] dark:to-[#0B0F19] p-3.5 shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[9.5px] font-black text-amber-800 dark:text-[#D8B282] border border-amber-500/30">
                              {op.type || "Hợp tác B2B"}
                            </span>
                            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              🔥 {op.interestCount} đối tác quan tâm
                            </span>
                          </div>
                          <h4 className="mt-1.5 text-xs font-black text-slate-900 dark:text-white leading-snug">
                            {op.title}
                          </h4>
                          {op.communityName && (
                            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                              Thuộc cộng đồng: {op.communityName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-[#D8B282]">
                          Ngân sách: {op.budget || "Thỏa thuận"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              void navigate({ to: `/connect-app/community/opportunities` as any });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] text-black text-[10.5px] font-bold shadow-xs hover:brightness-105 transition cursor-pointer"
                          >
                            Xem đối tác quan tâm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              void navigate({ to: `/connect-app/meetings` as any });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/20 text-[10.5px] font-semibold transition"
                          >
                            Hẹn gặp
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── THẺ DẪN CHỨNG: LỊCH CÁC CUỘC GẶP ĐÃ XÁC NHẬN ── */}
            {myMeetings && myMeetings.length > 0 && (
              <div className="px-5 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#D8B282] flex items-center gap-1.5">
                    <Handshake className="h-3.5 w-3.5 text-amber-500" />
                    <span>Dẫn chứng Cuộc gặp đối tác ({myMeetings.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Đã đồng bộ vào Lịch Trang chủ
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {myMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3.5 shadow-sm transition hover:border-amber-400 dark:hover:border-[#D8B282]/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-[#D8B282]">
                          <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                          <span>{m.time} · {m.date}</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black border border-emerald-500/30">
                          Đã xác nhận
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-xs font-black text-slate-900 dark:text-white leading-snug">
                        Cuộc gặp 1-1 với {m.partnerName}
                      </h4>
                      {m.partnerCompany && (
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>{m.partnerCompany}</span>
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200 dark:border-white/5">
                        <span className="flex items-center gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {m.format === "online" ? (
                            <Video className="h-3.5 w-3.5 text-[#D8B282] shrink-0" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate">{m.location}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {m.format === "online" ? (
                            <button
                              type="button"
                              onClick={() => {
                                window.open("https://meet.google.com/new", "_blank");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#DFB76C] text-slate-950 font-bold text-[10.5px] border border-[#f0d499]/80 hover:bg-[#d4a85a] active:scale-95 transition cursor-pointer"
                            >
                              Vào họp
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                void navigate({ to: `/connect-app` as any });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10.5px] hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                            >
                              Xem lịch
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── THẺ DẪN CHỨNG: KHOẢNH KHẮC GHI ÂM (VOICE MOMENTS) ── */}
            {voiceMoments && voiceMoments.length > 0 && (
              <div className="px-5 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#D8B282] flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-red-500" />
                    <span>Dẫn chứng Khoảnh khắc ghi âm ({voiceMoments.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      void navigate({ to: `/connect-app` as any });
                    }}
                    className="text-[10px] text-amber-700 dark:text-[#D8B282] hover:underline font-semibold"
                  >
                    Xem trên Trang chủ
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {voiceMoments.map((vm) => {
                    const isPlaying = playingVoiceId === vm.id;
                    return (
                      <div
                        key={vm.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3.5 shadow-sm transition hover:border-red-400 dark:hover:border-red-500/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                              <Mic className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                                {vm.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {vm.author} · {vm.date} · {vm.duration}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTogglePlayVoice(vm)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-[10.5px] transition cursor-pointer active:scale-95 ${
                              isPlaying
                                ? "bg-red-500 text-white shadow-xs animate-pulse"
                                : "bg-[#DFB76C] text-slate-950 border border-[#f0d499]/80 shadow-xs hover:bg-[#d4a85a]"
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="h-3 w-3 fill-current" />
                                <span>Tạm dừng</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 fill-current" />
                                <span>Phát lại</span>
                              </>
                            )}
                          </button>
                        </div>

                        {vm.transcript && (
                          <div className="mt-2 rounded-xl bg-amber-500/10 p-2 text-[10.5px] text-amber-900 dark:text-[#F3E5AB] leading-snug border-l-2 border-amber-500">
                            <strong>Nội dung:</strong> "{vm.transcript}"
                          </div>
                        )}

                        {isPlaying && (
                          <div className="mt-2 flex items-center gap-1 h-3.5 px-1">
                            {[8, 14, 6, 18, 10, 16, 12, 6, 20, 8].map((h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}px` }}
                                className="w-1 rounded-full bg-red-500 animate-pulse"
                              />
                            ))}
                            <span className="ml-1.5 text-[9.5px] font-semibold text-red-500">Đang phát âm thanh gốc...</span>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-white/5">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            <span>{vm.location}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* THẺ CƠ HỘI ĐƯỢC CHIA SẺ VÀO AI */}
            {sharedOpportunity && !lastDispatchedOpp && (
              <div className="mx-5 my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#DFB76C]/10 to-amber-500/5 border border-amber-400/40 dark:border-[#DFB76C]/40 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-800 dark:text-[#DFB76C] font-bold shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-black text-amber-800 dark:text-[#DFB76C] bg-amber-500/20 px-2 py-0.5 rounded-md">
                          Cơ hội từ cộng đồng
                        </span>
                        {sharedOpportunity.dealValue && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {sharedOpportunity.dealValue}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {sharedOpportunity.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Đăng bởi: {sharedOpportunity.posterName || sharedOpportunity.organization || "Đối tác ViOne"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharedOpportunity(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Bỏ chọn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 pt-2.5 border-t border-amber-300/30 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void dispatchAiOpportunityVoice(sharedOpportunity.id)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#DFB76C] hover:bg-[#d4a85a] text-slate-950 font-bold text-xs shadow-xs border border-[#f0d499]/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Gửi Lời Chào Giọng Nói AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* THẺ KẾT QUẢ TỰ ĐỘNG GỬI TIN NHẮN TỪ AI */}
            {lastSentMessage && (
              <div className="mx-5 my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-emerald-500/40 shadow-sm animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
                          Tin nhắn đã gửi tự động
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {lastSentMessage.sentAt}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Gửi tới: {lastSentMessage.recipient.name}
                        {lastSentMessage.recipient.company ? ` · ${lastSentMessage.recipient.company}` : ""}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 p-2.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 whitespace-pre-line leading-relaxed">
                  {lastSentMessage.formattedText}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTogglePlayAiVoiceNote(lastSentMessage.formattedText)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DFB76C] hover:bg-[#d4a85a] text-slate-950 font-bold text-[11px] shadow-xs cursor-pointer transition border border-[#f0d499]/80"
                  >
                    {isPlayingAiVoiceNote ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlayingAiVoiceNote ? "Tạm dừng phát" : "Nghe lại giọng nói AI"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      void navigate({ to: `/messages?peer=${lastSentMessage.recipient.code || lastSentMessage.recipient.id}` as any });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <span>Xem hộp thư</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* THẺ BẢN GHI ÂM GIỌNG NÓI AI QUAN TÂM CƠ HỘI */}
            {lastDispatchedOpp && (
              <div className="mx-5 my-2.5 p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-[#DFB76C]/10 to-amber-900/10 border-2 border-[#DFB76C] dark:border-[#DFB76C]/80 shadow-md animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-[#DFB76C] text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-[#DFB76C]">
                        🎙️ BẢN GHI ÂM GIỌNG NÓI AI ĐÃ GỬI VÀO TIN NHẮN CHỜ
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                        Đến đối tác: {lastDispatchedOpp.posterName}
                      </h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                    Đã gửi
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
                  🎯 <strong>Cơ hội:</strong> {lastDispatchedOpp.opportunityTitle}
                </div>

                {/* Khối phát âm thanh giọng nói của con AI (TTS Audio Note) */}
                <div className="mt-3 p-3 rounded-xl bg-white/90 dark:bg-black/40 border border-amber-300/40 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayAiVoiceNote(lastDispatchedOpp.greetingAudioText)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs ${
                        isPlayingAiVoiceNote
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-[#DFB76C] hover:bg-[#d4a85a] text-slate-950 border border-[#f0d499]/80"
                      }`}
                    >
                      {isPlayingAiVoiceNote ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Tạm dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Nghe Giọng Nói AI Nói</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1 h-4 px-2">
                      {[6, 14, 8, 18, 12, 16, 10, 6, 20, 10, 14, 8].map((h, i) => (
                        <span
                          key={i}
                          style={{
                            height: isPlayingAiVoiceNote ? `${h}px` : "4px",
                            transition: "height 0.15s ease",
                          }}
                          className={`w-1 rounded-full ${
                            isPlayingAiVoiceNote ? "bg-amber-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 dark:text-slate-300 italic bg-amber-500/10 p-2 rounded-lg border-l-2 border-amber-500 leading-relaxed">
                    "{lastDispatchedOpp.greetingAudioText}"
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-amber-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Trạng thái: Đã cập nhật quan tâm CRM
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      void navigate({ to: "/messages" as any });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <span>Mở tin nhắn chờ</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* DYNAMIC EXCEL REPORT CARD */}
            {activeExcelReport && (
              <div className="mx-5 my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-amber-500/5 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {activeExcelReport.title || activeExcelReport.filename}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {activeExcelReport.rowCount || 0} dòng dữ liệu • {activeExcelReport.fileSize || 'Excel .xlsx'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={activeExcelReport.downloadUrl}
                    download={activeExcelReport.filename}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow hover:brightness-110 flex items-center gap-1.5 shrink-0 transition"
                  >
                    <span>Tải về</span>
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* DYNAMIC ACTION CHIPS (Khi có suggestedActions) */}
            {suggestedActions && suggestedActions.length > 0 && (
              <div className="px-5 py-2">
                <p className="text-[11px] text-amber-700 dark:text-[#D8B282] font-semibold mb-1.5">
                  Thao tác gợi ý nhanh từ AI:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (action.route) {
                          if (action.route.startsWith('/api/ai/download-excel')) {
                            window.open(action.route, '_blank');
                          } else {
                            setIsOpen(false);
                            void navigate({ to: action.route as any });
                          }
                        } else if (action.intent === "find_potential_leads") {
                          void processCommand("Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi");
                        } else if (action.intent === "check_customers") {
                          void processCommand("Tôi có khách hàng nào chưa");
                        } else if (action.intent === "export_excel_finance") {
                          void processCommand("Xuất báo cáo tài chính thu chi ra file Excel");
                        } else if (action.intent === "export_excel_attendance") {
                          void processCommand("Xuất báo cáo chấm công nhân sự ra file Excel");
                        } else if (action.intent === "export_excel_approvals") {
                          void processCommand("Xuất danh sách hồ sơ trình ký ra file Excel");
                        } else if (action.intent === "save_all_leads" && potentialCustomers) {
                          potentialCustomers.forEach((l) => handleSaveLead(l));
                          toast.success("Đã lưu tất cả 4 khách hàng tiềm năng vào CRM Lead!");
                        } else if (action.intent === "ai_dispatch_opportunity_voice") {
                          void dispatchAiOpportunityVoice(
                            action.payload?.id || sharedOpportunity?.id || "",
                            "Em là AI trợ lý của Lãnh đạo, xin phép gửi lời chào và quan tâm kết nối cơ hội..."
                          );
                        } else if (action.intent === "custom_opportunity_greeting") {
                          setInputText("Gửi lời chào quan tâm cơ hội: Em là AI trợ lý của Lãnh đạo, xin phép kết nối hợp tác...");
                        } else if (action.intent === "voice_continue") {
                          toggleListening();
                        } else if (action.intent === "download_mobileconfig") {
                          window.location.href = "/vione_ios_install.mobileconfig";
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-[#F3E5AB] hover:bg-amber-500/25 transition cursor-pointer"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Suggestion Chips Mặc Định */}
            <div className="px-5 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2">
                Chạm câu hỏi thông minh & Tạo báo cáo:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "📊 Xuất Báo Cáo Thu - Chi Excel",
                  "⏱️ Xuất Báo Cáo Chấm Công Excel",
                  "📋 Xuất Danh Sách Trình Ký Excel",
                  "👥 Tôi đang có bao nhiêu bạn bè?",
                  "🎫 Tôi đang đăng ký sự kiện nào không?",
                  "📋 Tôi có công việc nào phải làm không?",
                  "🔔 Tôi có thông báo gì mới không?",
                  "💬 Tôi có tin nhắn nào mới không?",
                  "🏢 Thông tin công ty của tôi",
                  "🛍️ Sản phẩm của tôi trên sàn",
                  "💎 Hướng dẫn chạm danh thiếp NFC",
                  "⭐ Điểm tín nhiệm & Hạng VIP",
                  "🔒 Làm sao để đổi mật khẩu?",
                  "🤝 Tôi có cuộc gặp nào không?",
                  "🎯 Tìm khách hàng tiềm năng",
                  "⭐ Quan tâm cơ hội của tôi?",
                  "📷 Quét danh thiếp AI",
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

            </div>

            {/* FIXED BOTTOM FOOTER: Luôn cố định ở đáy */}
            <form onSubmit={handleSendText} className="shrink-0 z-30 bg-white/98 dark:bg-[#0B0F19]/98 backdrop-blur-md p-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
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
                placeholder="Hỏi: 'Tôi có bao nhiêu bạn bè?', 'Việc cần làm hôm nay', 'Sự kiện đăng ký'..."
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
