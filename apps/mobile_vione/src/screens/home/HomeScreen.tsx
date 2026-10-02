import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Pencil,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MapPin,
  CalendarDays,
  Handshake,
  Video,
  Activity,
  Users,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Layers,
  Phone,
  QrCode,
  CreditCard,
  MessageSquare,
  Briefcase,
  Building2,
  UserPlus,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { ScanQrModal } from "../quick-connect/ScanQrModal";
import { AttendanceModal } from "../../components/AttendanceModal";
import { WorkflowModal } from "../../components/WorkflowModal";
import { ApprovalsModal } from "../../components/ApprovalsModal";
import { ScheduleMeetingModal } from "../../components/ScheduleMeetingModal";
import { CardScanReviewModal } from "../../components/CardScanReviewModal";
import { EventDetailModal } from "../../components/EventDetailModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HomeScreenProps {
  navigation?: any;
  onOpenV?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onOpenV }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "reminders">("today");
  const [myQrVisible, setMyQrVisible] = useState(false);
  const [scanQrVisible, setScanQrVisible] = useState(false);
  const [attendanceVisible, setAttendanceVisible] = useState(false);
  const [workflowVisible, setWorkflowVisible] = useState(false);
  const [approvalsVisible, setApprovalsVisible] = useState(false);
  const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
  const [selectedPartnerForMeeting, setSelectedPartnerForMeeting] = useState<{ name: string; company: string } | null>(null);
  const [cardScanReviewVisible, setCardScanReviewVisible] = useState(false);
  const [eventDetailModalVisible, setEventDetailModalVisible] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Lời chào theo thời gian thực (Chào buổi sáng / chiều / tối)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  // Định dạng ngày tiếng Việt: "Thứ Sáu, 02 Tháng 10"
  const getFormattedDate = () => {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${dayName}, ${dd} Tháng ${mm}`;
  };

  const getInitial = (name?: string | null) => {
    if (!name) return "A";
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return "A";
    return words[words.length - 1][0].toUpperCase();
  };

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const userPhone = user?.phone || "0912 345 678";
  const avatarInitial = getInitial(displayName);

  // Danh sách sự kiện sắp tới
  const upcomingEvents = [
    {
      id: "ev-1",
      title: "Giao lưu Kết nối C-Level & Khởi nghiệp 2026",
      date: "05/10/2026",
      time: "09:30",
      location: "Khách sạn Daewoo Hà Nội",
      community: "CLB Doanh Nhân ViOne",
    },
  ];

  // Danh sách nhắc lịch
  const remindersList = [
    {
      id: "rem-1",
      title: "Cuộc gặp 1-1: Đối tác Đầu tư Công nghệ",
      date: "02/10/2026",
      time: "14:30",
      location: "Trụ sở ViOne Connect",
      type: "meeting",
    },
  ];

  // Danh sách đối tác gợi ý bởi AI (Tương đương RelationshipSuggestions trên web)
  const aiSuggestedPartners = [
    {
      id: "ai-1",
      name: "Hoàng Gia Bảo",
      title: "Phó Tổng Giám Đốc",
      company: "Chuỗi Bán Lẻ & Logistics Toàn Quốc",
      industry: "Bán Lẻ & Chuỗi Cung Ứng",
      location: "Hà Nội",
      suggestion: "Tìm thấy cơ hội liên kết chuỗi logistics và hệ sinh thái phân phối bán lẻ",
      matchScore: "94% tương đồng chuỗi cung ứng",
      initial: "B",
    },
    {
      id: "ai-2",
      name: "Đặng Quang Huy",
      title: "Nhà Sáng Lập & CEO",
      company: "Huy Đặng Media & Digital Marketing",
      industry: "Truyền Thông Doanh Nghiệp",
      location: "TP. Hồ Chí Minh",
      suggestion: "Đối tác tiềm năng hỗ trợ mở rộng nhận diện thương hiệu doanh nghiệp đa kênh",
      matchScore: "88% khớp hồ sơ hợp tác B2B",
      initial: "H",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D8B282"
            colors={["#D8B282"]}
          />
        }
      >
        {/* Top Header: Logo ViOne + Greeting + Bell Notification */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Image
              source={require("../../../assets/vione-wordmark.png")}
              style={styles.logoWordmark}
              resizeMode="contain"
            />
            <Text style={styles.headerGreeting}>{getGreeting()}</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation?.navigate("Network")}
              activeOpacity={0.7}
            >
              <MessageSquare size={20} color="#D8B282" strokeWidth={1.8} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => Alert.alert("Thông báo", "Bạn có 2 thông báo kết nối doanh nghiệp mới.")}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#D8B282" strokeWidth={1.8} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerDivider} />

        {/* 1. Thẻ Doanh Nhân ViOne (Identity Card with Cover Banner & Avatar) */}
        <View style={styles.identityCard}>
          {/* Ảnh bìa doanh nhân thực tế */}
          <View style={styles.coverBannerWrap}>
            <Image
              source={require("../../../assets/vba-hero.jpg")}
              style={styles.coverBannerImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(10, 10, 11, 0.2)", "rgba(10, 10, 11, 0.75)"]}
              style={styles.coverGradient}
            />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => Alert.alert("Hồ sơ", "Chỉnh sửa thông tin doanh nhân ViOne.")}
              activeOpacity={0.8}
            >
              <Pencil size={14} color="#D8B282" />
            </TouchableOpacity>
          </View>

          {/* Thông tin doanh nhân bên dưới ảnh bìa: Left Info & Right Avatar */}
          <View style={styles.identityBody}>
            <View style={styles.identityLeft}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>DOANH NHÂN VIONE</Text>
              </View>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.phoneRow}>
                <Phone size={13} color="#D8B282" style={{ marginRight: 5 }} />
                <Text style={styles.phoneText}>{userPhone}</Text>
              </View>
            </View>

            {/* Avatar tròn viền vàng sang trọng */}
            <View style={styles.avatarWrap}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <LinearGradient
                  colors={["#2A2016", "#14110E"]}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarInitialText}>{avatarInitial}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        </View>

        {/* 2. Phân Hệ HÔM NAY (Editorial schedule) */}
        <View style={styles.sectionToday}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.todaySectionTitle}>HÔM NAY</Text>
            <TouchableOpacity
              style={styles.viewCalendarBtn}
              onPress={() => Alert.alert("Lịch", "Xem toàn bộ lịch hoạt động & sự kiện.")}
              activeOpacity={0.7}
            >
              <SlidersHorizontal size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
              <Text style={styles.viewCalendarText}>Xem lịch</Text>
              <ChevronRight size={13} color="#D8B282" />
            </TouchableOpacity>
          </View>

          {/* Ngày tiếng Việt động */}
          <Text style={styles.todayDateTitle}>{getFormattedDate()}</Text>

          {/* Bộ 3 Tabs: [Hôm nay] [Sắp tới (1)] [Nhắc lịch (1)] */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={styles.tabPill}
              onPress={() => setActiveTab("today")}
              activeOpacity={0.8}
            >
              {activeTab === "today" ? (
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabGradientActive}
                >
                  <Text style={styles.tabPillTextActive}>Hôm nay</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabPillTextInactive}>Hôm nay</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabPill}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              {activeTab === "upcoming" ? (
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabGradientActive}
                >
                  <Text style={styles.tabPillTextActive}>Sắp tới</Text>
                  <View style={styles.tabBadgeActive}>
                    <Text style={styles.tabBadgeTextActive}>{upcomingEvents.length}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactiveInner}>
                  <Text style={styles.tabPillTextInactive}>Sắp tới</Text>
                  <View style={styles.tabBadgeInactive}>
                    <Text style={styles.tabBadgeTextInactive}>{upcomingEvents.length}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabPill}
              onPress={() => setActiveTab("reminders")}
              activeOpacity={0.8}
            >
              {activeTab === "reminders" ? (
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabGradientActive}
                >
                  <Text style={styles.tabPillTextActive}>Nhắc lịch</Text>
                  <View style={styles.tabBadgeActive}>
                    <Text style={styles.tabBadgeTextActive}>{remindersList.length}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactiveInner}>
                  <Text style={styles.tabPillTextInactive}>Nhắc lịch</Text>
                  <View style={styles.tabBadgeInactive}>
                    <Text style={styles.tabBadgeTextInactive}>{remindersList.length}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nội dung Tab HÔM NAY: Trạng thái yên tĩnh */}
          {activeTab === "today" && (
            <View style={styles.quietBox}>
              <View style={styles.quietIconWrap}>
                <CheckCircle2 size={26} color="#D8B282" strokeWidth={1.8} />
              </View>
              <Text style={styles.quietTitle}>Hôm nay thật yên tĩnh</Text>
              <Text style={styles.quietSubtitle}>
                Không có gì cần xử lý ngay. Có thể đây là lúc tốt để mở rộng kết nối mới.
              </Text>

              {/* Nút Mở V để kết nối */}
              <TouchableOpacity
                style={styles.openVBtn}
                onPress={() => {
                  if (onOpenV) {
                    onOpenV();
                  } else {
                    Alert.alert("ViOne Connect", "Mở menu kết nối nhanh 1-chạm.");
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.vMiniEmblem}>
                  <Text style={styles.vMiniText}>V</Text>
                </View>
                <Text style={styles.openVBtnText}>Mở V để kết nối</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Nội dung Tab SẮP TỚI */}
          {activeTab === "upcoming" && (
            <View style={styles.listContainer}>
              {upcomingEvents.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() => {
                    setSelectedEventForDetail({
                      id: ev.id,
                      title: ev.title,
                      startsAt: `${ev.time} · ${ev.date}`,
                      location: ev.location,
                      category: ev.community,
                      isRegistered: true,
                      registeredCount: 88,
                    });
                    setEventDetailModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTag}>
                      <CalendarDays size={12} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.cardTagText}>{ev.community}</Text>
                    </View>
                    <Text style={styles.cardDate}>{ev.time} · {ev.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  <View style={styles.cardLocationRow}>
                    <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                    <Text style={styles.cardLocationText}>{ev.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Nội dung Tab NHẮC LỊCH */}
          {activeTab === "reminders" && (
            <View style={styles.listContainer}>
              {remindersList.map((rem) => (
                <View key={rem.id} style={styles.eventCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTag}>
                      <Handshake size={12} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.cardTagText}>Cuộc gặp 1-1 đã hẹn</Text>
                    </View>
                    <Text style={styles.cardDate}>{rem.time} · {rem.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{rem.title}</Text>
                  <View style={styles.cardFooterRow}>
                    <View style={styles.cardLocationRow}>
                      <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                      <Text style={styles.cardLocationText}>{rem.location}</Text>
                    </View>
                    <View style={styles.confirmedPill}>
                      <Text style={styles.confirmedPillText}>Đã xác nhận</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. Khối INSIGHT DÀNH CHO BẠN (Matching responsive PWA) */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeaderRow}>
            <Sparkles size={16} color="#D8B282" style={{ marginRight: 6 }} />
            <Text style={styles.insightSmallLabel}>SỐ CƠ HỘI KẾT NỐI TIỀM NĂNG</Text>
          </View>

          <Text style={styles.insightHeadline}>
            BẠN CÓ <Text style={styles.insightGoldNumber}>15</Text> CƠ HỘI KẾT NỐI TIỀM NĂNG CAO
          </Text>

          <Text style={styles.insightSubtitle}>
            Hệ thống trí tuệ nhân tạo đã phân tích hồ sơ và tìm thấy 15 doanh nhân C-Level cùng hệ sinh thái sẵn sàng giao thương.
          </Text>

          <TouchableOpacity
            style={styles.insightCta}
            onPress={() => navigation?.navigate("Network")}
            activeOpacity={0.7}
          >
            <Text style={styles.insightCtaText}>Khám phá ngay</Text>
            <ArrowRight size={15} color="#D8B282" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* 4. Bộ 3 Phím Tắt Nhanh (QUICK ACTIONS - Matching responsive PWA) */}
        <View style={styles.quickActionsGrid}>
          {/* Quick Action 1: Cuộc gặp 1-1 */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              setSelectedPartnerForMeeting({
                name: "Trần Anh Tuấn",
                company: "Tập Đoàn Bất Động Sản An Phát",
              });
              setScheduleMeetingVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <Users size={19} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Cuộc gặp 1-1</Text>
          </TouchableOpacity>

          {/* Quick Action 2: Quét danh thiếp */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setCardScanReviewVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <QrCode size={19} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Quét thẻ</Text>
          </TouchableOpacity>

          {/* Quick Action 3: Thẻ của tôi */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setMyQrVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <CreditCard size={19} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Thẻ của tôi</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Khối ĐIỀU HÀNH & GIÁM SÁT DOANH NGHIỆP (Theo mô tả BRD Master 5.0) */}
        <View style={styles.opsSection}>
          <View style={styles.opsHeaderRow}>
            <View style={styles.opsHeaderLeft}>
              <Activity size={16} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.opsSectionLabel}>GIÁM SÁT VẬN HÀNH & NHÂN SỰ</Text>
            </View>
            <View style={styles.opsLiveBadge}>
              <View style={styles.opsLiveDot} />
              <Text style={styles.opsLiveText}>THỜI GIAN THỰC</Text>
            </View>
          </View>

          <Text style={styles.opsHeadline}>
            TỔNG THỂ QUY TRÌNH & TIẾN ĐỘ NHÂN VIÊN
          </Text>
          <Text style={styles.opsSubtitle}>
            Kiểm soát luồng công việc BPMN, khối lượng tải làm việc của từng nhân sự, chấm công GPS và phê duyệt chi 3 cấp theo chuẩn BRD.
          </Text>

          {/* Grid 3 Thẻ Nghiệp Vụ */}
          <View style={styles.opsCardsCol}>
            {/* Thẻ 1: Chấm công GPS & AI FaceID */}
            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => setAttendanceVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.opsCardTop}>
                <View style={[styles.opsIconWrap, { backgroundColor: "rgba(216, 178, 130, 0.18)" }]}>
                  <MapPin size={18} color="#D8B282" />
                </View>
                <View style={styles.opsCardBadgeGreen}>
                  <Text style={styles.opsCardBadgeGreenText}>42/45 CÓ MẶT (93.3%)</Text>
                </View>
              </View>
              <Text style={styles.opsCardTitle}>Chấm công GPS & AI FaceID</Text>
              <Text style={styles.opsCardDesc}>
                Bán kính ≤ 50m (BR-HRM-01) · Độ khớp khuôn mặt ≥ 92% (BR-HRM-02) · 1-chạm điểm danh
              </Text>
              <View style={styles.opsCardFooter}>
                <Text style={styles.opsCardActionText}>Mở bảng điểm danh & xin nghỉ</Text>
                <ChevronRight size={14} color="#D8B282" />
              </View>
            </TouchableOpacity>

            {/* Thẻ 2: Quy trình & Tiến độ nhân sự */}
            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => setWorkflowVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.opsCardTop}>
                <View style={[styles.opsIconWrap, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                  <Layers size={18} color="#38BDF8" />
                </View>
                <View style={styles.opsCardBadgeRed}>
                  <AlertCircle size={11} color="#F43F5E" style={{ marginRight: 3 }} />
                  <Text style={styles.opsCardBadgeRedText}>2 VIỆC TRỄ HẠN</Text>
                </View>
              </View>
              <Text style={styles.opsCardTitle}>Quy trình & Tiến độ nhân sự</Text>
              <Text style={styles.opsCardDesc}>
                12 việc đang xử lý · WIP ≤ 5 (BR-WRK-06) · 1 nhân sự quá tải &gt; 45h/tuần (BR-WRK-14)
              </Text>
              <View style={styles.opsCardFooter}>
                <Text style={styles.opsCardActionText}>Theo dõi tiến độ đội ngũ & Kanban</Text>
                <ChevronRight size={14} color="#D8B282" />
              </View>
            </TouchableOpacity>

            {/* Thẻ 3: Phê duyệt chi 3 cấp */}
            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => setApprovalsVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.opsCardTop}>
                <View style={[styles.opsIconWrap, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                  <FileCheck size={18} color="#C084FC" />
                </View>
                <View style={styles.opsCardBadgeAmber}>
                  <Text style={styles.opsCardBadgeAmberText}>3 TỜ TRÌNH CHỜ DUYỆT</Text>
                </View>
              </View>
              <Text style={styles.opsCardTitle}>Phê duyệt chi 3 cấp</Text>
              <Text style={styles.opsCardDesc}>
                Maker → Checker → Approver · Hạn mức &gt; 20 triệu thẩm quyền CEO duyệt (BR-FIN-02)
              </Text>
              <View style={styles.opsCardFooter}>
                <Text style={styles.opsCardActionText}>Ký duyệt chi & Napas VietQR</Text>
                <ChevronRight size={14} color="#D8B282" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Khối V · GỢI Ý HÔM NAY (Khớp 100% RelationshipSuggestions PWA) */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiHeaderLeft}>
              <Sparkles size={16} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.aiSectionLabel}>V · GỢI Ý HÔM NAY (AI)</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation?.navigate("Network")}
              activeOpacity={0.7}
              style={styles.aiViewAllBtn}
            >
              <Text style={styles.aiViewAllText}>Xem tất cả</Text>
              <ChevronRight size={13} color="#D8B282" />
            </TouchableOpacity>
          </View>

          <Text style={styles.aiHeadline}>GỢI Ý KẾT NỐI TỪ TRÍ TUỆ NHÂN TẠO</Text>
          <Text style={styles.aiSubtitle}>
            Hệ sinh thái AI tự động tính toán dữ liệu năng lực, chuỗi giá trị và đề xuất đối tác C-Level tương thích cao nhất.
          </Text>

          <View style={styles.aiListCol}>
            {aiSuggestedPartners.map((item) => (
              <View key={item.id} style={styles.aiPartnerCard}>
                <View style={styles.aiPartnerTop}>
                  <LinearGradient
                    colors={["#2A2016", "#14110E"]}
                    style={styles.aiAvatarCircle}
                  >
                    <Text style={styles.aiAvatarInitial}>{item.initial}</Text>
                  </LinearGradient>

                  <View style={styles.aiPartnerInfo}>
                    <View style={styles.aiNameRow}>
                      <Text style={styles.aiPartnerName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.aiLocationTag}>
                        <MapPin size={10} color="#D8B282" style={{ marginRight: 2 }} />
                        <Text style={styles.aiLocationText}>{item.location}</Text>
                      </View>
                    </View>
                    <View style={styles.aiMetaRow}>
                      <Briefcase size={11} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.aiMetaText} numberOfLines={1}>
                        {item.title} · {item.company}
                      </Text>
                    </View>
                    <View style={styles.aiMetaRow}>
                      <Building2 size={11} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.aiIndustryText} numberOfLines={1}>
                        {item.industry}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.aiReasonBox}>
                  <Text style={styles.aiSuggestionText}>{item.suggestion}</Text>
                  <Text style={styles.aiMatchScoreText}>★ {item.matchScore}</Text>
                </View>

                <View style={styles.aiActionRow}>
                  <TouchableOpacity
                    style={styles.aiConnectBtn}
                    onPress={() => Alert.alert("Kết nối", `Đã gửi lời mời kết nối doanh nghiệp tới ${item.name}.`)}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={13} color="#050C15" style={{ marginRight: 4 }} />
                    <Text style={styles.aiConnectBtnText}>Kết nối ngay</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.aiMessageBtn}
                    onPress={() => navigation?.navigate("Network")}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={13} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.aiMessageBtnText}>Nhắn tin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals hỗ trợ kết nối nhanh & nghiệp vụ BRD */}
      <MyQrModal visible={myQrVisible} onClose={() => setMyQrVisible(false)} />
      <ScanQrModal visible={scanQrVisible} onClose={() => setScanQrVisible(false)} />
      <AttendanceModal visible={attendanceVisible} onClose={() => setAttendanceVisible(false)} />
      <WorkflowModal visible={workflowVisible} onClose={() => setWorkflowVisible(false)} />
      <ApprovalsModal visible={approvalsVisible} onClose={() => setApprovalsVisible(false)} />
      <ScheduleMeetingModal
        visible={scheduleMeetingVisible}
        partnerName={selectedPartnerForMeeting?.name}
        partnerCompany={selectedPartnerForMeeting?.company}
        onClose={() => setScheduleMeetingVisible(false)}
      />
      <CardScanReviewModal
        visible={cardScanReviewVisible}
        onClose={() => setCardScanReviewVisible(false)}
        onSaveContact={() => setCardScanReviewVisible(false)}
      />
      <EventDetailModal
        visible={eventDetailModalVisible}
        event={selectedEventForDetail}
        onClose={() => setEventDetailModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0B",
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerBrand: {
    justifyContent: "center",
  },
  logoWordmark: {
    width: 140,
    height: 48,
  },
  headerGreeting: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: -2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#D8B282",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: "#050C15",
    fontSize: 9.5,
    fontWeight: "900",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 12,
  },
  identityCard: {
    backgroundColor: "#12151F",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  coverBannerWrap: {
    height: 110,
    position: "relative",
    backgroundColor: "#181D2A",
  },
  coverBannerImg: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(10, 10, 11, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  identityBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  identityLeft: {
    flex: 1,
    marginRight: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 5,
  },
  roleBadgeText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  displayName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  phoneText: {
    color: "#D8B282",
    fontSize: 13,
    fontWeight: "600",
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#D8B282",
    padding: 2,
    backgroundColor: "#12151F",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  avatarCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    color: "#F6E1C3",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionToday: {
    marginTop: 20,
  },
  todayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todaySectionTitle: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  viewCalendarBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewCalendarText: {
    color: "#D4C3A3",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 2,
  },
  todayDateTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#181D2A",
    borderRadius: 14,
    padding: 3,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabPill: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabGradientActive: {
    flex: 1,
    width: "100%",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabPillTextActive: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  tabInactiveInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabPillTextInactive: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  tabBadgeActive: {
    backgroundColor: "rgba(5, 12, 21, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeTextActive: {
    color: "#050C15",
    fontSize: 9.5,
    fontWeight: "800",
  },
  tabBadgeInactive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeTextInactive: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "700",
  },
  quietBox: {
    backgroundColor: "#12151F",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  quietIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quietTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  quietSubtitle: {
    color: "#94A3B8",
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  openVBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    marginTop: 14,
    gap: 8,
  },
  vMiniEmblem: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  vMiniText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "900",
  },
  openVBtnText: {
    color: "#F6E1C3",
    fontSize: 13,
    fontWeight: "700",
  },
  listContainer: {
    marginTop: 12,
    gap: 10,
  },
  eventCard: {
    backgroundColor: "#12151F",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardTagText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
  },
  cardDate: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardLocationText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  confirmedPill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confirmedPillText: {
    color: "#10B981",
    fontSize: 10.5,
    fontWeight: "700",
  },
  insightCard: {
    backgroundColor: "#12151F",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    padding: 18,
    marginTop: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  insightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightSmallLabel: {
    color: "#D4C3A3",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  insightHeadline: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    lineHeight: 22,
  },
  insightGoldNumber: {
    color: "#D8B282",
    fontSize: 18,
    fontWeight: "900",
  },
  insightSubtitle: {
    color: "#94A3B8",
    fontSize: 12.5,
    marginTop: 6,
    lineHeight: 18,
  },
  insightCta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  insightCtaText: {
    color: "#D8B282",
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#12151F",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  opsSection: {
    marginTop: 22,
    backgroundColor: "#12151F",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    padding: 18,
  },
  opsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  opsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  opsSectionLabel: {
    color: "#D4C3A3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  opsLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  opsLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
  },
  opsLiveText: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "800",
  },
  opsHeadline: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
    textTransform: "uppercase",
  },
  opsSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  opsCardsCol: {
    marginTop: 14,
    gap: 10,
  },
  opsCard: {
    backgroundColor: "#181D2A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 13,
  },
  opsCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  opsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opsCardBadgeGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opsCardBadgeGreenText: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "700",
  },
  opsCardBadgeRed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opsCardBadgeRedText: {
    color: "#F43F5E",
    fontSize: 9.5,
    fontWeight: "700",
  },
  opsCardBadgeAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opsCardBadgeAmberText: {
    color: "#F59E0B",
    fontSize: 9.5,
    fontWeight: "700",
  },
  opsCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  opsCardDesc: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  opsCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  opsCardActionText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "600",
  },
  aiSection: {
    marginTop: 22,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#12151F",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiSectionLabel: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  aiViewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiViewAllText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "600",
    marginRight: 2,
  },
  aiHeadline: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: -0.3,
  },
  aiSubtitle: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },
  aiListCol: {
    marginTop: 12,
    gap: 10,
  },
  aiPartnerCard: {
    backgroundColor: "#181D2A",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  aiPartnerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  aiAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  aiAvatarInitial: {
    color: "#D8B282",
    fontSize: 17,
    fontWeight: "700",
  },
  aiPartnerInfo: {
    flex: 1,
  },
  aiNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiPartnerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  aiLocationTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiLocationText: {
    color: "#D8B282",
    fontSize: 10,
    fontWeight: "600",
  },
  aiMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  aiMetaText: {
    color: "#94A3B8",
    fontSize: 11.5,
    flex: 1,
  },
  aiIndustryText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  aiReasonBox: {
    backgroundColor: "rgba(10, 10, 11, 0.6)",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#D8B282",
  },
  aiSuggestionText: {
    color: "#E2E8F0",
    fontSize: 11.5,
    lineHeight: 16,
  },
  aiMatchScoreText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 4,
  },
  aiActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  aiConnectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    paddingVertical: 7,
    borderRadius: 8,
  },
  aiConnectBtnText: {
    color: "#050C15",
    fontSize: 11.5,
    fontWeight: "700",
  },
  aiMessageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingVertical: 7,
    borderRadius: 8,
  },
  aiMessageBtnText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "600",
  },
});
