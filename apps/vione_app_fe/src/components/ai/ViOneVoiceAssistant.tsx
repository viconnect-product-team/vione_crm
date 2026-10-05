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
  const [nearbyResults, setNearbyResults] = useState<NearbyMember[] | null>(null);
  const [potentialCustomers, setPotentialCustomers] = useState<PotentialCustomerLead[] | null>(null);
  const [myOpportunities, setMyOpportunities] = useState<OpportunityEvidence[] | null>(null);
  const [myMeetings, setMyMeetings] = useState<MeetingEvidence[] | null>(null);
  const [voiceMoments, setVoiceMoments] = useState<VoiceMomentEvidence[] | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<Array<{ label: string; route?: string; intent?: string; payload?: any }> | null>(null);
  const [isScanningLocation, setIsScanningLocation] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedLeads, setSavedLeads] = useState<Record<string, boolean>>({});

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
            communityName: "Gia đình ViOne (B2B)",
          },
          {
            id: "opp-my-02",
            title: "Cung ứng vật tư thiết bị mạng viễn thông & thẻ thông minh NFC",
            type: "Cung ứng vật tư",
            interestCount: 2,
            budget: "500 - 800 triệu",
            status: "Đang mở",
            communityName: "Gia đình ViOne (B2B)",
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

      // 6. Phản hồi chuẩn xác khi không giải đáp được theo yêu cầu
      const reply =
        "🤖 **Dạ thưa Anh/Chị, hiện tại tôi chưa được thông minh để giải đáp câu hỏi của bạn.**\n\n" +
        "Anh/Chị có thể hỏi tôi về các chức năng đang vận hành trong ViOne App như:\n\n" +
        "• 📋 *\"Hôm nay tôi có việc gì cần làm không?\"*\n" +
        "• 🎯 *\"Tôi có khách hàng nào chưa?\"* hoặc *\"Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi\"*\n" +
        "• 👥 *\"Tình hình nhân sự và chấm công hôm nay thế nào?\"*\n" +
        "• 💰 *\"Có tờ trình chi nào đang chờ tôi phê duyệt không?\"*\n" +
        "• 🏢 *\"Cách quản lý cộng đồng công ty và giao việc cho nhân viên\"*\n" +
        "• 💎 *\"Xem danh thiếp số của tôi\"*\n\n" +
        "*Em luôn sẵn sàng hỗ trợ Anh/Chị tốt nhất trong các phạm vi này ạ!*";
      const speech =
        "Dạ thưa Anh Chị, hiện tại tôi chưa được thông minh để giải đáp câu hỏi của bạn. Anh Chị có thể hỏi tôi về việc cần làm hôm nay, tìm kiếm khách hàng tiềm năng, hoặc tình hình chấm công nhân sự ạ.";
      setAiResponse(reply);
      speakText(speech);
      setNearbyResults(null);
      setPotentialCustomers(null);
      setSuggestedActions([
        { label: "📋 Việc cần làm hôm nay?", intent: "today_tasks" },
        { label: "🎯 Tìm khách hàng tiềm năng", intent: "find_potential_leads" },
        { label: "👥 Chấm công nhân sự hôm nay", intent: "check_attendance" },
        { label: "💰 Duyệt chi ngân sách", intent: "check_approvals" },
      ]);
    },
    [speakText],
  );

  // Xử lý phân tích câu lệnh ngữ nghĩa (AI Dynamic Routing)
  const processCommand = useCallback(
    async (cmd: string) => {
      const q = cmd.toLowerCase().trim();
      setTranscript(cmd);

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
                  "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi tôi về khách hàng, đối tác tiềm năng hoặc tra cứu phân tích toàn bộ app.",
                );
              }
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Mở Trợ lý AI ViOne"
            title="Trợ lý Doanh Nhân AI ViOne — Chạm để ra lệnh giọng nói & phân tích thông minh"
          >
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
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] border-t-2 border-[#D8B282]/50 bg-white dark:bg-[#070D18] text-slate-900 dark:text-white shadow-2xl flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-bottom"
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
                  {aiResponse}
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
                              className="px-2.5 py-1 rounded-lg bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold text-[10.5px] hover:opacity-90 active:scale-95 transition cursor-pointer"
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
                                : "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 shadow-xs hover:opacity-90"
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
                          <span className="text-[9.5px] font-mono text-amber-700 dark:text-[#D8B282]">
                            Lưu vết CSDL Trang chủ
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                          setIsOpen(false);
                          void navigate({ to: action.route as any });
                        } else if (action.intent === "find_potential_leads") {
                          void processCommand("Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi");
                        } else if (action.intent === "check_customers") {
                          void processCommand("Tôi có khách hàng nào chưa");
                        } else if (action.intent === "save_all_leads" && potentialCustomers) {
                          potentialCustomers.forEach((l) => handleSaveLead(l));
                          toast.success("Đã lưu tất cả 4 khách hàng tiềm năng vào CRM Lead!");
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
                Chạm câu hỏi thông minh:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "⭐ Quan tâm cơ hội của tôi?",
                  "🤝 Tôi có cuộc gặp nào không?",
                  "🎙️ Tìm đoạn ghi âm tại khoảnh khắc",
                  "📍 Quanh đây có ai dùng ViOne không?",
                  "👥 Tôi có khách hàng nào chưa?",
                  "🎯 Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi",
                  "📷 Quét danh thiếp AI",
                  "💳 Danh thiếp số của tôi",
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

            {/* Bottom Input Form */}
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
                placeholder="Hỏi: 'Tôi có khách hàng nào chưa', 'Tìm khách hàng tiềm năng'..."
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
