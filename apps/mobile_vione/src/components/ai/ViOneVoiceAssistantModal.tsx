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
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

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
    title: "Cung ứng nền tảng CRM & AI Matchmaking cho Hiệp hội CEO 1983",
    budget: "500.000.000 đ",
    interestCount: 14,
    community: "CLB Doanh Nhân 1983 Toàn Quốc",
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
}

export const ViOneVoiceAssistantModal: React.FC<ViOneVoiceAssistantModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>(
    "Xin chào! Tôi là Trợ lý Doanh Nhân ViOne AI 5.0. Bạn có thể hỏi: 'Tôi có khách hàng nào chưa?', 'Tìm tôi khách hàng tiềm năng phù hợp với hồ sơ của tôi', hoặc tra cứu cơ hội, lịch trình và kết nối gần đây."
  );
  const [leads, setLeads] = useState<PotentialLead[] | null>(null);
  const [meetings, setMeetings] = useState<AiMeeting[] | null>(null);
  const [opportunities, setOpportunities] = useState<AiOpportunity[] | null>(null);
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

  const handleQuery = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return;

    setInputText("");
    setLeads(null);
    setMeetings(null);
    setOpportunities(null);

    if (
      q.includes("khách hàng") ||
      q.includes("lead") ||
      q.includes("đối tác tiềm năng") ||
      q.includes("tìm khách")
    ) {
      setAiResponse(
        "Dựa trên hồ sơ doanh nghiệp và ngành nghề của bạn, ViOne AI đã phân tích mạng lưới và tìm thấy 3 đối tác có điểm phù hợp cao nhất (trên 90% Match):"
      );
      setLeads(SAMPLE_LEADS);
    } else if (
      q.includes("lịch") ||
      q.includes("hẹn") ||
      q.includes("meeting") ||
      q.includes("cuộc gặp")
    ) {
      setAiResponse(
        "Hôm nay bạn có 2 cuộc gặp kinh doanh đã được xác nhận tự động vào Lịch trên Trang chủ ViOne:"
      );
      setMeetings(SAMPLE_MEETINGS);
    } else if (
      q.includes("cơ hội") ||
      q.includes("hợp tác") ||
      q.includes("dự án") ||
      q.includes("deal")
    ) {
      setAiResponse(
        "Có 2 cơ hội kinh doanh chiến lược đang mở có ngân sách trên 500 triệu phù hợp với năng lực cung ứng của bạn:"
      );
      setOpportunities(SAMPLE_OPPORTUNITIES);
    } else {
      setAiResponse(
        `ViOne AI đã ghi nhận yêu cầu: "${query}". Tôi đang đồng bộ dữ liệu mạng lưới doanh nhân và hỗ trợ kết nối trực tiếp tới đối tác phù hợp cho bạn.`
      );
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
              <Text
                style={[
                  styles.aiResponseText,
                  { color: isDark ? "#E2E8F0" : "#1E293B" },
                ]}
              >
                {aiResponse}
              </Text>
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
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: "88%",
    minHeight: 520,
    display: "flex",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
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
