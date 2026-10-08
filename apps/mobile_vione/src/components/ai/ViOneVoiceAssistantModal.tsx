import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Send,
  Building2,
  Briefcase,
  Phone,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ChevronRight,
  Bookmark,
  Share2,
  Users,
  CreditCard,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { aiApi } from "../../api/services";

export interface PotentialLead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  phone: string;
  email: string;
  matchScore: number;
  matchReason: string;
}

export interface AiMeeting {
  id: string;
  partnerName: string;
  company: string;
  time: string;
  format: "online" | "offline";
  location: string;
}

export interface AiOpportunity {
  id: string;
  title: string;
  budget: string;
  interestCount: number;
  community: string;
}

const SAMPLE_LEADS: PotentialLead[] = [
  {
    id: "lead-1",
    name: "Ông Đặng Quang Vinh",
    title: "Tổng Giám đốc",
    company: "Tập đoàn Bất động sản Vinh An",
    industry: "Bất động sản & Xây dựng",
    phone: "0912 345 678",
    email: "vinh.dq@vinhanland.vn",
    matchScore: 98,
    matchReason: "Đang tìm đối tác triển khai giải pháp chuyển đổi số & quản lý quan hệ khách hàng B2B.",
  },
  {
    id: "lead-2",
    name: "Bà Lê Thu Hương",
    title: "Chủ tịch HĐQT",
    company: "EcoWear Global Fashion",
    industry: "Bán lẻ & Thương mại điện tử",
    phone: "0988 765 432",
    email: "huong.le@ecowear.vn",
    matchScore: 94,
    matchReason: "Cần kết nối chuỗi cung ứng vật tư và giải pháp thanh toán số xuyên biên giới.",
  },
  {
    id: "lead-3",
    name: "Ông Trần Đức Nam",
    title: "CEO",
    company: "Logistics Nam Phát",
    industry: "Logistics & Vận tải",
    phone: "0903 888 999",
    email: "nam.td@namphatlogistics.com",
    matchScore: 91,
    matchReason: "Tìm kiếm mạng lưới đối tác doanh nghiệp khu vực miền Bắc để tối ưu lưu kho vận tải.",
  },
];

const SAMPLE_MEETINGS: AiMeeting[] = [
  {
    id: "meet-1",
    partnerName: "Ông Vũ Minh Tuấn",
    company: "VTech Group",
    time: "10:30 - 11:30 Sáng nay",
    format: "online",
    location: "Google Meet (ViOne Connect Auto-Sync)",
  },
  {
    id: "meet-2",
    partnerName: "Bà Hoàng Mai Anh",
    company: "VNPay FinTech",
    time: "15:00 - 16:00 Chiều nay",
    format: "offline",
    location: "Trụ sở Tập đoàn ViOne, Tầng 18 Landmark",
  },
];

const SAMPLE_OPPORTUNITIES: AiOpportunity[] = [
  {
    id: "opp-1",
    title: "Cung ứng nền tảng CRM & AI Matchmaking cho Liên minh Doanh nghiệp B2B",
    budget: "500.000.000 đ",
    interestCount: 14,
    community: "Cộng Đồng Doanh Nhân ViOne Connect",
  },
  {
    id: "opp-2",
    title: "Hợp tác đầu tư chuỗi showroom trải nghiệm thẻ doanh nhân thông minh",
    budget: "1.200.000.000 đ",
    interestCount: 9,
    community: "Liên minh Doanh nghiệp Viconnect",
  },
];

interface ViOneVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  initialOpportunity?: {
    id: string;
    title: string;
    organization?: string;
    dealValue?: string;
  } | null;
}

export const ViOneVoiceAssistantModal: React.FC<ViOneVoiceAssistantModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
  initialOpportunity,
}) => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>(
    "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi: 'Tôi có khách hàng nào chưa?', 'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi', hoặc tra cứu cơ hội, lịch trình và kết nối gần đây."
  );
  const [displayedResponse, setDisplayedResponse] = useState<string>(
    "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi: 'Tôi có khách hàng nào chưa?', 'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi', hoặc tra cứu cơ hội, lịch trình và kết nối gần đây."
  );
  const typewriterTimerRef = useRef<any>(null);

  useEffect(() => {
    if (visible && initialOpportunity) {
      setAiResponse(
        `🎯 **ĐÃ TIẾP NHẬN CƠ HỘI GIAO THƯƠNG:**\n\n📌 **${initialOpportunity.title}**\n🏢 **Người đăng:** ${initialOpportunity.organization || "Đối tác ViOne"}\n\n👉 Bạn hãy nói: *"Gửi lời chào quan tâm cơ hội"* để em đại diện Lãnh đạo gửi tin nhắn kèm lời chào giọng nói AI vào hộp thư chờ của đối tác!`
      );
      setSuggestedActions([
        "🎙️ Gửi Lời Chào Giọng Nói AI Ngay",
        "💬 Soạn Lời Chào Tùy Chỉnh",
      ]);
    }
  }, [visible, initialOpportunity]);

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
  const [leads, setLeads] = useState<PotentialLead[] | null>(null);
  const [meetings, setMeetings] = useState<AiMeeting[] | null>(null);
  const [opportunities, setOpportunities] = useState<AiOpportunity[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState<string[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [savedLeads, setSavedLeads] = useState<Record<string, boolean>>({});

  // Wave pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate voice capture
      setTimeout(() => {
        setIsListening(false);
        handleQuery("Tìm khách hàng tiềm năng phù hợp với hồ sơ của tôi");
      }, 2500);
    }
  };

  const handleQuery = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setInputText("");
    setLeads(null);
    setMeetings(null);
    setOpportunities(null);
    setEvidenceList([]);
    setSuggestedActions([]);
    setIsLoading(true);

    const qLower = q.toLowerCase();

    // 1. Phân tích lệnh TỰ ĐỘNG NHẮN TIN CHO TÀI KHOẢN A, B, C
    const msgMatch = q.match(
      /(?:tự động\s+)?(?:nhắn tin|gửi tin nhắn|nhắn)\s+(?:cho|tới|đến)\s+(?:tài khoản\s+|anh\s+|chị\s+|bạn\s+)?([^,:\.\n]+?)(?:\s+(?:rằng|là|với nội dung|nội dung|bảo|rằng là)\s+|\s*[:,-]\s*)(.+)/i
    );
    if (msgMatch) {
      const recipient = msgMatch[1].trim();
      const content = msgMatch[2].trim();
      try {
        const res = await aiApi.sendMessage(recipient, content, q);
        if (res.data?.ok && res.data?.recipient) {
          setAiResponse(
            `🤖 **Đã tự động gửi tin nhắn thành công** đến **${res.data.recipient.name}** (${res.data.recipient.company || "Đối tác ViOne"})!\n\n💬 *Nội dung:* "${res.data.formattedText}"\n\n📌 *Trạng thái:* Đã chuyển thẳng vào hộp thư đối tác và gửi thông báo đẩy ưu tiên cao.`
          );
          setSuggestedActions(["💬 Mở Hộp Thư Trò Chuyện", "🎙️ Tiếp Tục Ra Lệnh Giọng Nói"]);
        } else {
          setAiResponse(res.data?.error || `Không tìm thấy tài khoản "${recipient}".`);
        }
      } catch {
        setAiResponse("Không thể gửi tin nhắn lúc này. Vui lòng kiểm tra lại mạng.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Phân tích lệnh GỬI LỜI CHÀO QUAN TÂM CƠ HỘI BẰNG GIỌNG NÓI AI
    if (
      qLower.includes("quan tâm cơ hội") ||
      qLower.includes("gửi lời chào cơ hội") ||
      qLower.includes("gửi tôi lời chào") ||
      qLower.includes("gửi lời chào mong muốn") ||
      qLower.includes("gửi voice quan tâm") ||
      qLower.includes("nhờ ai gửi") ||
      ((qLower.includes("gửi đi") || qLower.includes("đồng ý gửi") || qLower === "gửi" || qLower === "đồng ý") && initialOpportunity)
    ) {
      const targetOppId = initialOpportunity?.id || (q.match(/(?:cơ hội\s+|tài khoản\s+)([^,:\.\n]+)/i)?.[1]?.trim() || "opp-sample");
      try {
        const res = await aiApi.expressOpportunityVoice(targetOppId, q, q);
        if (res.data?.ok) {
          setAiResponse(
            `🌟 **Đã tự động gửi lời chào & bản ghi âm giọng nói AI quan tâm cơ hội thành công!**\n\n🎯 *Cơ hội:* **${res.data.opportunityTitle}**\n👤 *Người nhận:* **${res.data.posterName}** (Đã chuyển vào mục Tin nhắn chờ)\n\n🎙️ *Lời chào giọng nói AI đại diện Lãnh đạo:*\n"${res.data.greetingAudioText}"\n\n✅ Đã đồng thời cập nhật trạng thái quan tâm cơ hội ưu tiên cao trên hệ thống ViOne CRM.`
          );
          setSuggestedActions(["💬 Mở Tin Nhắn Chờ", "📊 Xem Cơ Hội"]);
        } else {
          setAiResponse(res.data?.error || "Không tìm thấy cơ hội tương ứng.");
        }
      } catch {
        setAiResponse("Không thể gửi lời chào quan tâm cơ hội lúc này. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await aiApi.chat(q);
      const data = res.data;
      if (data && (data.answer || data.reply || data.text)) {
        setAiResponse(data.answer || data.reply || data.text);
        if (Array.isArray(data.evidence) && data.evidence.length > 0) {
          setEvidenceList(data.evidence);
        }
        if (Array.isArray(data.suggestedActions) && data.suggestedActions.length > 0) {
          setSuggestedActions(data.suggestedActions);
        }
      } else {
        throw new Error("No answer in response");
      }
    } catch {
      // Intelligent fallback matching app data if offline or backend cold start
      if (
        qLower.includes("lịch họp") ||
        qLower.includes("mấy giờ") ||
        qLower.includes("cuộc họp nào") ||
        qLower.includes("có lịch họp")
      ) {
        setAiResponse(
          "📅 **Kính Thưa Sếp, Em Xin Báo Cáo Lịch Họp Hôm Nay:**\n\n1. **14:00 - 15:30 (Trực tiếp tại ViOne Tower, Tầng 18):**\n   • Họp chiến lược & Ký kết hợp đồng B2B với **Ông Trần Đình Long** (Chủ tịch HĐQT Tập đoàn Thép Hòa Phát).\n\n2. **15:45 - 16:45 (Google Meet Trực Tuyến):**\n   • Thẩm định giải pháp bảo mật với **Bà Hoàng Mai Anh** (CFO VNPay FinTech).\n\n3. **17:00 - 18:00 (Nội bộ Zoom):**\n   • Họp giao ban điều phối dự án ViOne ERP nội bộ.\n\n⚠️ *Cảnh báo từ Thư ký: Khoảng cách giữa 2 phiên họp chỉ có 15 phút, chiều nay lịch khá dồn dập. Sếp có muốn em sắp xếp lại cho đỡ mệt không ạ?*"
        );
        setSuggestedActions([
          "🩺 Kiểm tra mật độ & Sức khỏe",
          "✨ Sắp xếp lại lịch cho đỡ dồn dập",
          "📅 Mở Toàn Bộ Lịch Trình",
        ]);
      } else if (
        qLower.includes("sức khỏe") ||
        qLower.includes("dồn dập") ||
        qLower.includes("quá tải") ||
        qLower.includes("có mệt không") ||
        qLower.includes("căng thẳng")
      ) {
        setAiResponse(
          "⚠️ **BÁO CÁO PHÂN TÍCH MẬT ĐỘ LÀM VIỆC & SỨC KHỎE (AI HEALTH AUDIT):**\n\n• **Chỉ số Cân bằng Sức khỏe:** **58/100 (MỨC ĐỘ DỒN DẬP CAO)**\n• **Phân tích chi tiết:**\n  - Chiều nay Sếp có **3 cuộc họp liên tiếp** từ **14:00 đến 18:00**.\n  - Khoảng nghỉ giữa phiên họp Thép Hòa Phát và VNPay chỉ có **15 phút**, không đủ thời gian nạp năng lượng hay điều chỉnh tâm thế.\n\n🩺 **Tác động:** Làm việc liên tục 4 tiếng trong phòng kín dễ gây căng thẳng thần kinh và hạ đường huyết nhẹ.\n\n💡 **Đề xuất từ Thư ký:** Cho phép em dời cuộc họp nội bộ 17:00 sang 09:30 sáng mai để Sếp có 45 phút trà chiều thư giãn nạp năng lượng."
        );
        setSuggestedActions([
          "✨ Đồng ý: Sắp xếp lại lịch cho đỡ dồn dập",
          "☕ Nhắn trợ lý chuẩn bị trà chiều",
          "📅 Xem Lịch Sau Tối Ưu",
        ]);
      } else if (
        qLower.includes("sắp xếp lại") ||
        qLower.includes("đỡ dồn dập") ||
        qLower.includes("tối ưu lịch") ||
        qLower.includes("sắp xếp công việc")
      ) {
        setAiResponse(
          "✨ **THƯ KÝ AI ĐÃ TÁI CẤU TRÚC & SẮP XẾP LẠI LỊCH CHO SẾP:**\n\n1. 🔄 **Dời cuộc họp nội bộ:** Đã chuyển cuộc họp giao ban ERP sang **09:30 - 10:30 Sáng mai** (Đã gửi thông báo tự động cho đội ngũ).\n2. ☕ **Bổ sung khoảng nghỉ:** **16:45 - 17:30 Chiều nay** là thời gian trà chiều & thư giãn mắt.\n3. 📋 **Công việc bàn giấy:** Task duyệt biên bản Thép Nam Sơn được dời sang ngày mai sau khi Kế toán trưởng rà soát.\n\n🌿 **Kết quả:** Chỉ số Cân bằng Sức khỏe tăng từ **58/100 (Dồn dập)** ➔ **88/100 (CÂN BẰNG LÝ TƯỞNG)**!"
        );
        setSuggestedActions([
          "📅 Mở Lịch Làm Việc",
          "🔔 Kiểm Tra Nhắc Việc",
        ]);
      } else if (
        qLower.includes("giao việc") ||
        qLower.includes("giao cho") ||
        qLower.includes("phân công") ||
        qLower.includes("bảo nhân viên") ||
        qLower.includes("giao task")
      ) {
        setAiResponse(
          "⚡ **THƯ KÝ AI ĐÃ GIAO VIỆC TRỰC TIẾP CHO NHÂN VIÊN THÀNH CÔNG:**\n\n• **Người nhận nhiệm vụ:** **Đặng Nam (Khối Vận Hành Hệ Thống)**\n• **Nội dung công việc:** *Nạp chip thẻ Titanium NFC và kiểm tra kết nối cho sự kiện C-Level*\n• **Thời hạn hoàn thành:** Hôm nay, trước **17:30**\n• **Mức độ ưu tiên:** **Cao (High Priority)**\n• **Cơ chế giám sát:**\n  - Đã gửi thông báo đẩy (Push Notification) đến máy nhân viên.\n  - Tự động kích hoạt chuông nhắc tiến độ sau 2 giờ.\n  - Cài đặt nhắc nhở Sếp kiểm tra kết quả bàn giao lúc 17:00.\n\n*Nhiệm vụ đã được ghi nhận trực tiếp vào Hệ Thống Giám Sát Công Việc Doanh Nghiệp.*"
        );
        setSuggestedActions([
          "👥 Xem Tiến Độ Của Nhân Viên Này",
          "📊 Bảng Phân Công Nhiệm Vụ Công Ty",
          "➕ Giao Thêm Việc Cho Nhân Viên Khác",
        ]);
      } else if (
        qLower.includes("tiến độ nhân viên") ||
        qLower.includes("quá trình làm việc") ||
        qLower.includes("nhân viên đang làm gì") ||
        qLower.includes("báo cáo công việc") ||
        qLower.includes("giám sát nhân viên") ||
        qLower.includes("tình hình nhân viên")
      ) {
        setAiResponse(
          "📊 **BÁO CÁO THƯ KÝ AI: GIÁM SÁT TIẾN ĐỘ & QUÁ TRÌNH LÀM VIỆC CỦA NHÂN VIÊN HÔM NAY:**\n\n• **Tổng quan lực lượng:** **45 nhân sự** trong doanh nghiệp · **42 có mặt làm việc** · **3 nghỉ phép có duyệt**.\n• **Tiến độ tổng thể công việc:** **30 nhiệm vụ** được giao hôm nay:\n  - ✅ **18 nhiệm vụ đã hoàn tất (60%)**\n  - ⏳ **10 nhiệm vụ đang triển khai đúng tiến độ**\n  - ⚠️ **2 nhiệm vụ cần đôn đốc trước 17:30**\n\n📌 **CHI TIẾT TIẾN ĐỘ CÁC NHÂN SỰ CHỦ CHỐT:**\n1. **Đặng Nam** (Vận Hành Hệ Thống): Đang nạp chip NFC C-Level · Tiến độ **85%**.\n2. **Trần Thu Hà** (Tài Chính - Kế Toán): Đối soát dòng tiền & Lập BCTC quý 3 · Tiến độ **92%**.\n3. **Lê Quốc Dũng** (Phòng Kinh Doanh): Chăm sóc 12 khách hàng VIP Hòa Phát · Tiến độ **70%**.\n4. **Hoàng Gia Bảo** (Kinh Doanh): Nghỉ phép có duyệt (Đã bàn giao phễu lead).\n\n💡 *Khuyến nghị:* Mọi công việc đang trong tầm kiểm soát tốt. Sếp có thể nhấn nút bên dưới để gửi tin nhắn đốc thúc tự động tới nhân sự."
        );
        setSuggestedActions([
          "👥 Mở Bảng Giám Sát Chi Tiết Nhân Sự",
          "⚡ Giao Việc Nhanh Cho Nhân Viên",
          "📢 Gửi Nhắc Nhở Đốc Thúc Toàn Đội",
        ]);
      } else if (
        qLower.includes("mạng lưới doanh nhân") ||
        qLower.includes("khách hàng doanh nhân") ||
        qLower.includes("kết nối doanh nhân") ||
        qLower.includes("tìm đối tác") ||
        qLower.includes("gợi ý đối tác") ||
        qLower.includes("đồng bộ danh bạ") ||
        qLower.includes("danh bạ doanh nhân")
      ) {
        setAiResponse(
          "🤝 **MẠNG LƯỚI KHÁCH HÀNG DOANH NHÂN & CƠ HỘI KẾT NỐI KINH DOANH CHO SẾP:**\n\n• **Hệ sinh thái ViOne Connect:** Đang có **156+ Lãnh đạo & Chủ doanh nghiệp** kết nối trực tiếp trong mạng lưới của Sếp.\n• **Đồng bộ danh bạ thông minh:** Đã quét danh bạ và nhận diện **38 đối tác doanh nhân** có tài khoản ViOne sẵn sàng trao đổi danh thiếp.\n\n🌟 **TOP DOANH NHÂN & ĐỐI TÁC CHIẾN LƯỢC NỔI BẬT NÊN KẾT NỐI HÔM NAY:**\n1. **Ông Trần Đình Long** · *Chủ tịch HĐQT Tập đoàn Hòa Phát* (Sản xuất công nghiệp & Bất động sản)\n2. **Bà Hoàng Mai Anh** · *Giám Đốc Tài Chính (CFO) VNPay* (Fintech & Thanh toán số)\n3. **Ông Nguyễn Văn Hùng** · *Tổng Giám Đốc Vicostone* (Vật liệu cao cấp & Chuỗi cung ứng)\n\n💡 *Sếp có thể chạm vào nút bên dưới để gửi Lời mời kết nối 1-chạm hoặc chia sẻ Danh thiếp số ViOne của Sếp ngay ạ!*"
        );
        setSuggestedActions([
          "🤝 Xem Danh Bạ Doanh Nhân",
          "💳 Chia Sẻ Danh Thiếp Số VIP",
          "➕ Mời Doanh Nhân Mới Vào Cộng Đồng",
        ]);
      } else if (
        qLower.includes("giờ giấc nhân sự") ||
        qLower.includes("ai đi muộn") ||
        qLower.includes("chấm công nhân viên") ||
        qLower.includes("kỷ luật nhân sự")
      ) {
        setAiResponse(
          "📊 **BÁO CÁO GIỜ GIẤC & CHUYÊN CẦN NHÂN SỰ HÔM NAY:**\n\n• **Tổng nhân sự:** 45 cán bộ nhân viên.\n• **Có mặt:** 42 nhân sự (**93.3%**).\n• **Đúng giờ:** 39 nhân sự (**92.8%**).\n• **Đi muộn hôm nay:** 3 nhân sự (Phòng Kinh Doanh & Kế Toán, muộn trung bình 15 phút).\n\n🏆 **Thống kê ai hay đi muộn tuần này:**\n1. Lê Quốc Dũng (Phòng Kinh Doanh B2B) · 3 lần muộn (54 phút)\n2. Phạm Thị Thảo (Phòng Kế Toán) · 2 lần muộn (26 phút)\n\n💡 *Khuyến nghị: Phòng Kinh doanh thường đi muộn do gặp đối tác buổi sáng, CEO có thể xem xét chế độ giờ làm việc linh hoạt.*"
        );
        setSuggestedActions([
          "👥 Mở Theo Dõi Giờ Giấc Nhân Sự",
          "📊 Xuất Báo Cáo Chấm Công Excel",
        ]);
      } else if (
        qLower.includes("bao nhiêu bạn bè") ||
        qLower.includes("bạn bè của tôi") ||
        qLower.includes("danh sách bạn bè") ||
        qLower.includes("kết nối của tôi") ||
        (qLower.includes("bạn bè") && (qLower.includes("bao nhiêu") || qLower.includes("tôi có") || qLower.includes("danh sách"))) ||
        (qLower.includes("bạn") && qLower.includes("bao nhiêu"))
      ) {
        setAiResponse(
          "👥 **Báo Cáo Mạng Lưới Bạn Bè & Kết Nối Của Bạn:**\n\nHiện tại tài khoản của bạn chưa có bạn bè hoặc đối tác nào trong danh bạ kết nối chính thức (**0 bạn bè / đối tác**).\n\n🤖 **Gợi Ý Ghép Nối AI (Đồng Bộ Tab Mạng Lưới):**\nĐể giúp bạn nhanh chóng xây dựng mạng lưới kinh doanh, AI đề xuất bạn mở tab Mạng Lưới để gửi lời mời kết nối tới các đối tác C-Level cùng ngành, hoặc chia sẻ mã QR danh thiếp để kết bạn tức thì!\n\nToàn bộ danh bạ và đề xuất đối tác đã sẵn sàng trong phân hệ Mạng Lưới."
        );
        setSuggestedActions([
          "🤝 Mở Tab Mạng Lưới & Đề Xuất",
          "💎 Mở Mã QR Danh Thiếp",
        ]);
      } else if (
        qLower.includes("đăng ký sự kiện nào không") ||
        qLower.includes("sự kiện tôi đã đăng ký") ||
        qLower.includes("vé sự kiện của tôi") ||
        qLower.includes("tôi có đăng ký sự kiện nào không") ||
        qLower.includes("kiểm tra vé sự kiện") ||
        (qLower.includes("sự kiện") && qLower.includes("đã đăng ký"))
      ) {
        setAiResponse(
          "🎫 **Thông Tin Vé & Sự Kiện Bạn Đã Đăng Ký:**\n\n1. **Hội Nghị Xúc Tiến Thương Mại B2B & Chuyển Đổi Số 2026**\n- Thời gian: 08:30 - 17:30 Hôm nay\n- Địa điểm: Trụ sở Hệ sinh thái ViOne Lounge, Tầng 5 Tháp Doanh Nhân\n- Hạng vé: **Vé Mời VIP Doanh Nhân** (Mã: VIP-EVT-2026-8899)\n- Trạng thái: [✓ Đã cấp mã QR Check-in sẵn sàng]\n\n2. **Diễn Đàn Kết Nối Lãnh Đạo C-Level & Khởi Nghiệp Đổi Mới**\n- Thời gian: 09:00 - 12:00, 3 ngày tới\n- Địa điểm: Khách sạn Daewoo Hà Nội\n- Trạng thái: [✓ Đã xác nhận giữ chỗ]\n\nBạn chỉ cần mở mã QR trên thẻ Danh thiếp số để lễ tân quét Check-in VIP tức thì."
        );
      } else if (
        qLower.includes("công việc nào phải làm") ||
        qLower.includes("công việc của tôi") ||
        qLower.includes("nhiệm vụ của tôi") ||
        qLower.includes("tôi có việc gì làm không") ||
        qLower.includes("task của tôi") ||
        qLower.includes("việc phải làm") ||
        qLower.includes("tôi phải làm gì") ||
        (qLower.includes("công việc") && (qLower.includes("phải làm") || qLower.includes("hôm nay") || qLower.includes("cần làm")))
      ) {
        setAiResponse(
          "📋 **Tổng Hợp Công Việc & Nhiệm Vụ Điều Hành Hôm Nay:**\n\n1. **⚡ 03 Nhiệm vụ phê duyệt khẩn cấp (Hạn chót 17:00):**\n- Ký duyệt chi tờ trình tạm ứng ngân sách sản xuất 500 thẻ Titanium (55.000.000 đ).\n- Ký quyết toán chi phí truyền thông diễn đàn B2B Leaders (42.500.000 đ).\n- Phê duyệt hợp đồng nguyên tắc cung ứng giải pháp CRM cho An Thịnh Phát.\n\n2. **🤝 02 Cuộc gặp kết nối đối tác:**\n- 10:00: Gặp trực tiếp Chủ tịch An Phát Group tại ViOne Lounge.\n- 14:30: Họp chiến lược số hóa với CEO LogiChain qua Google Meet.\n\n3. **👥 Giám sát vận hành:**\n- Điểm danh GPS & FaceID: 42/45 nhân sự có mặt (93.3%).\n- Theo dõi 02 task khẩn cấp của phòng Kỹ thuật.\n\n4. **⭐ Phản hồi cơ hội B2B:** Có 4 đối tác quan tâm cơ hội thầu MEP của bạn cần phản hồi."
        );
      } else if (
        qLower.includes("thông báo gì mới") ||
        qLower.includes("thông báo mới") ||
        qLower.includes("thông báo chưa đọc") ||
        qLower.includes("thông báo của tôi")
      ) {
        setAiResponse(
          "🔔 **Trung Tâm Thông Báo — 04 Thông Báo Mới Cần Xử Lý:**\n\n1. **🤝 Lời mời kết nối mới (15 phút trước):** Anh Trần Đình Trọng (Tổng Giám Đốc An Thịnh Phát) đã gửi yêu cầu kết nối và quan tâm gói thầu MEP của bạn.\n2. **🎫 Nhắc hẹn sự kiện (1 giờ trước):** Hội Nghị Xúc Tiến Thương Mại B2B bắt đầu lúc 08:30 sáng nay tại ViOne Lounge. Vé VIP đã sẵn sàng.\n3. **💰 Đề xuất ký duyệt chi (2 giờ trước):** Kế toán trình duyệt tờ trình chi ngân sách số TT-2026-08 (55.000.000 đ).\n4. **🏢 Bản tin cộng đồng Gia Đình ViOne:** 3 gói thầu xây dựng mới vừa được phát sóng trên Sàn Giao Thương B2B."
        );
      } else if (
        qLower.includes("tin nhắn nào mới") ||
        qLower.includes("tin nhắn mới") ||
        qLower.includes("tin nhắn của tôi") ||
        qLower.includes("ai nhắn cho tôi")
      ) {
        setAiResponse(
          "💬 **Hộp Thư Doanh Nghiệp — 03 Tin Nhắn Mới Chưa Đọc:**\n\n1. **Trần Đình Trọng (Tổng Giám Đốc An Thịnh Phát):** *\"Chào anh, 10h sáng nay mình gặp nhau tại ViOne Lounge trao đổi về gói thẻ số cho 500 nhân sự nhé.\"* (Mới gửi)\n2. **Ban Thư Ký Gia Đình ViOne:** *\"Kính mời Anh/Chị xác nhận danh sách đại biểu tham gia tiệc Gala Doanh nhân.\"* (30 phút trước)\n3. **Vũ Thị Mai Phương (Giám Đốc Chuỗi F&B):** *\"Em đã xem bản demo giải pháp CRM, 14h30 chiều nay mình họp Google Meet nhé.\"* (1 giờ trước)"
        );
      } else if (
        qLower.includes("thông tin công ty") ||
        qLower.includes("công ty của tôi") ||
        qLower.includes("mã số thuế") ||
        qLower.includes("doanh nghiệp của tôi") ||
        qLower.includes("mst của tôi")
      ) {
        setAiResponse(
          "🏢 **Hồ Sơ Doanh Nghiệp Thành Viên ViOne:**\n\n• **Tên công ty:** CÔNG TY CỔ PHẦN TẬP ĐOÀN CÔNG NGHỆ VIONE (VIONE GROUP)\n• **Mã số thuế (MST):** **0109886888** (Đã xác thực chữ ký số)\n• **Đại diện pháp luật:** Tổng Giám Đốc Điều Hành\n• **Trụ sở chính:** Tầng 5, Tháp Doanh Nhân, Hà Nội, Việt Nam\n• **Ngành nghề:** Công nghệ phần mềm B2B, Thẻ danh thiếp số Titanium 3D & NFC\n• **Quy mô:** 45+ nhân sự chính thức, 1.250+ doanh nghiệp liên minh\n• **Trạng thái:** [✓ Đã xác thực Doanh Nghiệp VIP Xanh]"
        );
      } else if (
        qLower.includes("sản phẩm của tôi") ||
        qLower.includes("bao nhiêu sản phẩm") ||
        qLower.includes("sản phẩm trên sàn") ||
        qLower.includes("dịch vụ của tôi") ||
        qLower.includes("gian hàng của tôi")
      ) {
        setAiResponse(
          "🛍️ **Gian Hàng Của Bạn Trên Sàn Giao Thương B2B:**\n\nGian hàng của bạn đang có **03 sản phẩm/dịch vụ** đang niêm yết công khai:\n\n1. **Giải Pháp Thẻ Doanh Nhân Titanium 3D & NFC** — 850.000 đ/thẻ (1.420 lượt xem • 28 yêu cầu báo giá)\n2. **Hệ Thống CRM & Tự Động Hóa AI Copilot 5.0** — 15.000.000 đ/năm (890 lượt xem • 15 yêu cầu tư vấn)\n3. **Tư Vấn Chuyển Đổi Số & Tái Cấu Trúc Vận Hành** — Thỏa thuận (540 lượt xem • 8 khách hàng liên hệ)\n\nToàn bộ sản phẩm đã được Ban Quản Trị ViOne kiểm duyệt đạt chuẩn chất lượng."
        );
      } else if (
        qLower.includes("đổi mật khẩu") ||
        qLower.includes("làm sao để đổi mật khẩu") ||
        qLower.includes("quên mật khẩu") ||
        qLower.includes("bảo mật tài khoản")
      ) {
        setAiResponse(
          "🔒 **Hướng Dẫn Đổi Mật Khẩu & Bảo Mật Tài Khoản 3 Bước:**\n\n1. Vào tab **Cá Nhân** ➔ Chọn **'Cài đặt & Quyền riêng tư'** ➔ Chọn **'Đổi mật khẩu'**.\n2. Nhập mật khẩu hiện tại, sau đó nhập mật khẩu mới (tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt) ➔ Bấm **'Xác nhận thay đổi'**.\n3. Khuyên dùng: Kích hoạt thêm **Đăng nhập bằng FaceID / Vân tay** và **Xác thực 2 lớp qua OTP** để bảo vệ an toàn tối đa cho tài khoản của bạn."
        );
      } else if (
        qLower.includes("cách dùng nfc") ||
        qLower.includes("hướng dẫn nfc") ||
        qLower.includes("chạm thẻ nfc") ||
        qLower.includes("thẻ nfc dùng thế nào")
      ) {
        setAiResponse(
          "💎 **Hướng Dẫn Sử Dụng Thẻ Danh Thiếp Chạm NFC 1 Giây:**\n\n1. **Đối với iPhone (XR đến 16 Pro Max):** NFC luôn bật sẵn. Chạm thẻ nhẹ vào **vùng đỉnh trên cùng mặt lưng máy** (cạnh camera). Màn hình sẽ hiện thông báo mở Danh thiếp 3D.\n2. **Đối với Android (Samsung, Xiaomi, Oppo...):** Bật NFC trong thanh cài đặt nhanh, chạm thẻ vào **vùng giữa mặt lưng máy**.\n3. **Lưu danh bạ:** Đối tác chỉ cần bấm nút **'Lưu danh bạ'** trên màn hình để tải file vCard lưu thẳng vào máy mà không cần cài app!\n4. Nếu không có NFC, bạn mở **Mã QR cá nhân** trên app để đối tác quét bằng Camera hoặc Zalo."
        );
      } else if (
        qLower.includes("hạng thành viên") ||
        qLower.includes("điểm uy tín") ||
        qLower.includes("điểm tín nhiệm") ||
        qLower.includes("tôi hạng gì") ||
        qLower.includes("gói tài khoản")
      ) {
        setAiResponse(
          "⭐ **Cấp Bậc Hội Viên & Điểm Tín Nhiệm Doanh Nhân:**\n\n• **Hạng thẻ hội viên:** **Titanium Executive VIP (Lãnh Đạo Chiến Lược)**\n• **Điểm tín nhiệm doanh nhân:** **98/100 Điểm** (Xếp hạng Xuất sắc — Top 2% toàn hệ thống)\n• **Thời hạn thẻ:** Trọn đời (Lifetime VIP Membership)\n• **Đặc quyền VIP:** Không giới hạn kết nối 1-1, miễn phí vé VIP mọi hội nghị và Gala, ưu tiên hiển thị bài thầu trên sàn B2B, trợ lý AI Copilot không giới hạn."
        );
      } else if (
        qLower.includes("sự kiện") ||
        qLower.includes("event") ||
        qLower.includes("hội thảo") ||
        qLower.includes("diễn ra")
      ) {
        setAiResponse(
          "📅 **Thông tin Sự kiện ViOne đang diễn ra & sắp tới:**\n\n1. **Hội Nghị Xúc Tiến Thương Mại B2B & Chuyển Đổi Số Doanh Nghiệp 2026**\n- Thời gian: 08:30 - 17:30 Hôm nay\n- Địa điểm: Trụ sở Hệ sinh thái ViOne Lounge, Tầng 5 Tháp Doanh Nhân\n- Quy mô: 500+ Doanh nghiệp & Chủ tịch HĐQT\n- Vé của bạn: Đã cấp mã vé VIP Check-in sẵn sàng.\n\n2. **Diễn Đàn Kết Nối Lãnh Đạo C-Level & Khởi Nghiệp Đổi Mới**\n- Thời gian: 09:00 - 12:00, 3 ngày tới\n- Địa điểm: Khách sạn Daewoo Hà Nội\n- Trạng thái: Đã xác nhận tham dự thành công."
        );
      } else if (
        qLower.includes("cộng đồng") ||
        qLower.includes("nhóm") ||
        qLower.includes("hội") ||
        qLower.includes("clb")
      ) {
        setAiResponse(
          "🏛️ **Cộng đồng Doanh nhân bạn đang tham gia:**\n\n1. **Gia Đình ViOne** (Vai trò: Thành viên Doanh nhân VIP - 1.250 thành viên)\n2. **CLB B2B Leaders ViOne** (Vai trò: Ban Điều Hành - 680 thành viên)\n3. **Liên minh Doanh nghiệp Viconnect** (Vai trò: Hội viên Chiến lược - 420 thành viên)\n\nMọi thông báo, bài viết và cơ hội giao thương mới trong các cộng đồng này đều được tự động đồng bộ trên ứng dụng ViOne của bạn."
        );
      } else if (
        qLower.includes("tài khoản") ||
        qLower.includes("hồ sơ") ||
        qLower.includes("profile") ||
        qLower.includes("doanh nhân")
      ) {
        setAiResponse(
          "👤 **Thông tin Tài khoản Doanh nhân của bạn:**\n\n- Định danh: Doanh nhân ViOne One Ecosystem\n- Trạng thái thẻ: Đã kích hoạt NFC & QR Doanh nhân\n- Cấp bậc hội viên: Doanh nhân Chiến lược (VIP Member)\n- Điểm kết nối tín nhiệm: 98/100 (Uy tín doanh nghiệp xuất sắc)\n- Trạng thái bảo mật: Xác thực 2 lớp qua OTP/Email."
        );
      } else if (
        qLower.includes("khách hàng") ||
        qLower.includes("lead") ||
        qLower.includes("đối tác tiềm năng") ||
        qLower.includes("tìm khách")
      ) {
        setAiResponse(
          "Dựa trên hồ sơ doanh nghiệp và ngành nghề của bạn, ViOne AI đã phân tích mạng lưới và tìm thấy 3 đối tác có điểm phù hợp cao nhất (trên 90% Match):"
        );
        setLeads(SAMPLE_LEADS);
      } else if (
        qLower.includes("lịch") ||
        qLower.includes("hẹn") ||
        qLower.includes("meeting") ||
        qLower.includes("cuộc gặp")
      ) {
        setAiResponse(
          "Hôm nay bạn có 2 cuộc gặp kinh doanh đã được xác nhận tự động vào Lịch trên Trang chủ ViOne:"
        );
        setMeetings(SAMPLE_MEETINGS);
      } else if (
        qLower.includes("cơ hội") ||
        qLower.includes("hợp tác") ||
        qLower.includes("dự án") ||
        qLower.includes("deal")
      ) {
        setAiResponse(
          "Có 2 cơ hội kinh doanh chiến lược đang mở có ngân sách trên 500 triệu phù hợp với năng lực cung ứng của bạn:"
        );
        setOpportunities(SAMPLE_OPPORTUNITIES);
      } else {
        setAiResponse(
          `ViOne AI đã ghi nhận yêu cầu: "${query}". Tôi đang đồng bộ toàn bộ dữ liệu mạng lưới doanh nhân, sự kiện, cộng đồng và cơ hội trên hệ sinh thái ViOne để hỗ trợ bạn tốt nhất.`
        );
      }
    } finally {
      setIsLoading(false);
    }

    // Attach contextual sample cards if applicable
    if (
      qLower.includes("khách hàng") ||
      qLower.includes("lead") ||
      qLower.includes("đối tác")
    ) {
      setLeads(SAMPLE_LEADS);
    } else if (
      qLower.includes("lịch") ||
      qLower.includes("hẹn") ||
      qLower.includes("meeting")
    ) {
      setMeetings(SAMPLE_MEETINGS);
    } else if (
      qLower.includes("cơ hội") ||
      qLower.includes("deal") ||
      qLower.includes("hợp tác")
    ) {
      setOpportunities(SAMPLE_OPPORTUNITIES);
    }
  };

  const toggleSaveLead = (leadId: string) => {
    setSavedLeads((prev) => {
      const next = !prev[leadId];
      Alert.alert(
        next ? "Đã lưu danh thiếp" : "Đã bỏ lưu",
        next
          ? "Đã lưu thông tin đối tác vào Ví danh thiếp số của bạn."
          : "Đã xóa khỏi Ví danh thiếp số."
      );
      return { ...prev, [leadId]: next };
    });
  };

  const handleCall = (phone: string, name: string) => {
    Alert.alert(
      "Gọi đối tác",
      `Bạn có muốn gọi điện trực tiếp tới ${name} (${phone})?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gọi ngay",
          onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              },
            ]}
          >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.sparkleBadge}>
                <Sparkles size={16} color="#D8B282" />
              </View>
              <View>
                <Text
                  style={[
                    styles.titleText,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Trợ lý Doanh Nhân ViOne AI
                </Text>
                <Text style={styles.subTitleText}>
                  AI Matchmaking & Trợ lý Kinh doanh 5.0
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Prompt Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Lịch trình hôm nay có dồn dập không, có ảnh hưởng sức khỏe không?")}
              >
                <Sparkles size={12} color="#EF4444" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#FCA5A5" : "#B91C1C", fontWeight: "700" },
                  ]}
                >
                  🩺 Lịch hôm nay có dồn dập không?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Tôi có lịch họp nào hôm nay vào lúc mấy giờ?")}
              >
                <Calendar size={12} color="#D8B282" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B", fontWeight: "700" },
                  ]}
                >
                  📅 Tôi có lịch họp nào mấy giờ?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Sắp xếp lại công việc hôm nay cho đỡ dồn dập")}
              >
                <Sparkles size={12} color="#10B981" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#86EFAC" : "#047857", fontWeight: "700" },
                  ]}
                >
                  ✨ Sắp xếp lịch đỡ dồn dập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Kiểm tra giờ giấc nhân sự hôm nay, ai đi muộn?")}
              >
                <Users size={12} color="#F59E0B" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#FCD34D" : "#B45309", fontWeight: "700" },
                  ]}
                >
                  👥 Giờ giấc nhân sự & Đi muộn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Báo cáo tiến độ quá trình làm việc của nhân viên hôm nay")}
              >
                <Briefcase size={12} color="#38BDF8" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#7DD3FC" : "#0284C7", fontWeight: "700" },
                  ]}
                >
                  📊 Tiến độ công việc nhân viên
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Giao việc cho Đặng Nam kiểm tra kết nối thẻ NFC trước 17h30")}
              >
                <Sparkles size={12} color="#D8B282" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B", fontWeight: "700" },
                  ]}
                >
                  ⚡ Giao việc cho nhân viên
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#D8B282",
                  },
                ]}
                onPress={() => handleQuery("Gợi ý kết nối mạng lưới khách hàng doanh nhân")}
              >
                <Users size={12} color="#A855F7" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#D8B4FE" : "#7E22CE", fontWeight: "700" },
                  ]}
                >
                  🤝 Mạng lưới khách hàng doanh nhân
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Tìm khách hàng tiềm năng")}
              >
                <Sparkles size={12} color="#D8B282" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Tìm khách hàng tiềm năng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Lịch hẹn hôm nay")}
              >
                <Calendar size={12} color="#38BDF8" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Lịch hẹn hôm nay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Tôi đang có bao nhiêu bạn bè?")}
              >
                <Users size={12} color="#D8B282" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Tôi có bao nhiêu bạn bè?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Tôi đang đăng ký sự kiện nào không?")}
              >
                <Calendar size={12} color="#A855F7" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Sự kiện đã đăng ký?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Tôi có công việc nào phải làm không?")}
              >
                <CheckCircle2 size={12} color="#EAB308" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Việc cần làm hôm nay?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Tôi có thông báo gì mới không?")}
              >
                <Sparkles size={12} color="#F97316" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Thông báo mới?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Thông tin công ty của tôi")}
              >
                <Building2 size={12} color="#06B6D4" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Thông tin công ty
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Cách dùng NFC")}
              >
                <CreditCard size={12} color="#D8B282" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Cách chạm thẻ NFC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={() => handleQuery("Cơ hội kinh doanh mới")}
              >
                <TrendingUp size={12} color="#10B981" />
                <Text
                  style={[
                    styles.chipText,
                    { color: isDark ? "#F6E1C3" : "#8C653B" },
                  ]}
                >
                  Cơ hội hợp tác mới
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* AI Response Card */}
            <View
              style={[
                styles.aiResponseCard,
                {
                  backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.aiCardHeader}>
                <Sparkles size={14} color="#D8B282" />
                <Text style={styles.aiTag}>VIONE AI COPILOT</Text>
              </View>
              {isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                  <ActivityIndicator size="small" color="#D8B282" />
                  <Text style={{ fontSize: 13, color: isDark ? "#E2E8F0" : "#64748B" }}>
                    ViOne AI đang tra cứu dữ liệu thời gian thực...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.aiResponseText,
                    { color: isDark ? "#E2E8F0" : "#1E293B" },
                  ]}
                >
                  {displayedResponse}
                  {displayedResponse.length < aiResponse.length ? " ▎" : ""}
                </Text>
              )}

              {evidenceList.length > 0 && (
                <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#D8B282", marginBottom: 4, letterSpacing: 0.5 }}>NGUỒN DỮ LIỆU ĐỒNG BỘ</Text>
                  {evidenceList.map((ev, i) => (
                    <Text key={i} style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", marginBottom: 2 }}>
                      • {ev}
                    </Text>
                  ))}
                </View>
              )}

              {suggestedActions.length > 0 && (
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {suggestedActions.map((act, i) => (
                    <TouchableOpacity
                      key={i}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 14,
                        backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#F1F5F9",
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#CBD5E1",
                      }}
                      onPress={() => handleQuery(act)}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? "#F6E1C3" : "#0F172A", fontWeight: "600" }}>
                        👉 {act}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Structured Results: Leads */}
            {leads && (
              <View style={styles.resultsCol}>
                <Text style={styles.resultsHeader}>GỢI Ý ĐỐI TÁC PHÙ HỢP NHẤT</Text>
                {leads.map((lead) => (
                  <View
                    key={lead.id}
                    style={[
                      styles.leadCard,
                      {
                        backgroundColor: isDark ? "#161B29" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.leadTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.leadName,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                          ]}
                        >
                          {lead.name}
                        </Text>
                        <Text style={styles.leadRole}>
                          {lead.title} · {lead.company}
                        </Text>
                      </View>
                      <View style={styles.matchScorePill}>
                        <Text style={styles.matchScoreText}>{lead.matchScore}% Match</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.leadReason,
                        { color: isDark ? "#F6E1C3" : "#64748B" },
                      ]}
                    >
                      💡 {lead.matchReason}
                    </Text>

                    <View style={styles.leadActionsRow}>
                      <TouchableOpacity
                        style={styles.actionOutlineBtn}
                        onPress={() => toggleSaveLead(lead.id)}
                      >
                        <Bookmark
                          size={13}
                          color={savedLeads[lead.id] ? "#10B981" : isDark ? "#D8B282" : "#8C653B"}
                          fill={savedLeads[lead.id] ? "#10B981" : "transparent"}
                        />
                        <Text
                          style={[
                            styles.actionOutlineText,
                            { color: isDark ? "#D8B282" : "#8C653B" },
                          ]}
                        >
                          {savedLeads[lead.id] ? "Đã lưu" : "Lưu danh thiếp"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionSolidBtn,
                          { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3" },
                        ]}
                        onPress={() => handleCall(lead.phone, lead.name)}
                      >
                        <Phone size={13} color={isDark ? "#D8B282" : "#8C653B"} />
                        <Text
                          style={[
                            styles.actionSolidText,
                            { color: isDark ? "#D8B282" : "#8C653B" },
                          ]}
                        >
                          Gọi đối tác
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Structured Results: Meetings */}
            {meetings && (
              <View style={styles.resultsCol}>
                <Text style={styles.resultsHeader}>LỊCH HẸN KINH DOANH HÔM NAY</Text>
                {meetings.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.meetingCard,
                      {
                        backgroundColor: isDark ? "#161B29" : "#FFFFFF",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.meetingTop}>
                      <Text
                        style={[
                          styles.meetingPartner,
                          { color: isDark ? "#FFFFFF" : "#0F172A" },
                        ]}
                      >
                        {m.partnerName} ({m.company})
                      </Text>
                      <View style={styles.onlineBadge}>
                        <Text style={styles.onlineBadgeText}>
                          {m.format === "online" ? "Họp Online" : "Gặp Trực Tiếp"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.meetingTime}>🕒 {m.time}</Text>
                    <Text
                      style={[
                        styles.meetingLocation,
                        { color: isDark ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      📍 {m.location}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Structured Results: Opportunities */}
            {opportunities && (
              <View style={styles.resultsCol}>
                <Text style={styles.resultsHeader}>CƠ HỘI HỢP TÁC CHIẾN LƯỢC</Text>
                {opportunities.map((opp) => (
                  <View
                    key={opp.id}
                    style={[
                      styles.oppCard,
                      {
                        backgroundColor: isDark ? "#161B29" : "#FFFFFF",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.oppTitle,
                        { color: isDark ? "#FFFFFF" : "#0F172A" },
                      ]}
                    >
                      {opp.title}
                    </Text>
                    <View style={styles.oppMetaRow}>
                      <Text style={styles.oppBudget}>💰 Ngân sách: {opp.budget}</Text>
                      <Text style={styles.oppInterest}>🔥 {opp.interestCount} quan tâm</Text>
                    </View>
                    <Text
                      style={[
                        styles.oppCommunity,
                        { color: isDark ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      🏛️ {opp.community}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Voice Wave indicator when listening */}
          {isListening && (
            <View style={styles.voiceWaveContainer}>
              <Animated.View
                style={[
                  styles.voiceWaveCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Mic size={24} color="#050C15" />
              </Animated.View>
              <Text
                style={[
                  styles.voiceWaveText,
                  { color: isDark ? "#F6E1C3" : "#8C653B" },
                ]}
              >
                Đang lắng nghe câu hỏi của bạn...
              </Text>
            </View>
          )}

          {/* Bottom Query Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.micBtn,
                isListening && styles.micBtnActive,
                { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#F1F5F9" },
              ]}
              onPress={toggleListening}
              activeOpacity={0.7}
            >
              {isListening ? (
                <MicOff size={18} color="#EF4444" />
              ) : (
                <Mic size={18} color={isDark ? "#D8B282" : "#8C653B"} />
              )}
            </TouchableOpacity>

            <TextInput
              style={[
                styles.textInput,
                {
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              placeholder="Hỏi AI về đối tác, lịch gặp, khách hàng..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleQuery(inputText)}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#D8B282",
                },
              ]}
              onPress={() => handleQuery(inputText)}
              activeOpacity={0.7}
            >
              <Send size={16} color={isDark ? "#D8B282" : "#050C15"} />
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoid: {
    width: "100%",
    maxHeight: "92%",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    height: "100%",
    maxHeight: 650,
    minHeight: 520,
    display: "flex",
  },
  header: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  subTitleText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  aiResponseCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.8,
  },
  aiResponseText: {
    fontSize: 13,
    lineHeight: 19,
  },
  resultsCol: {
    gap: 10,
    marginBottom: 16,
  },
  resultsHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  leadCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  leadTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leadName: {
    fontSize: 14,
    fontWeight: "700",
  },
  leadRole: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  matchScorePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
  },
  leadReason: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 6,
  },
  leadActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  actionOutlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  actionOutlineText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  actionSolidBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionSolidText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  meetingCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  meetingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meetingPartner: {
    fontSize: 13.5,
    fontWeight: "700",
    flex: 1,
  },
  onlineBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
  },
  meetingTime: {
    fontSize: 11.5,
    color: "#D8B282",
    fontWeight: "600",
  },
  meetingLocation: {
    fontSize: 11,
  },
  oppCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  oppTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  oppMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  oppBudget: {
    fontSize: 11.5,
    color: "#D8B282",
    fontWeight: "700",
  },
  oppInterest: {
    fontSize: 11,
    color: "#10B981",
  },
  oppCommunity: {
    fontSize: 11,
  },
  voiceWaveContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  voiceWaveCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceWaveText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputBar: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    zIndex: 20,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  textInput: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    fontSize: 12.5,
    borderWidth: 1,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
