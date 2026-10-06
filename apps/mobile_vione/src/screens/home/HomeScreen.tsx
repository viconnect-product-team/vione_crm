import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Linking,
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
  Sun,
  Moon,
  Mic,
  Play,
  Pause,
  Plus,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { VIconMark } from "../../components/VIconMark";
import { StickyBrandHeader } from "../../components/common/StickyBrandHeader";
import { QuickMeetIcon, QuickScanIcon, QuickCardIcon } from "../../components/NavIcons";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { ScanQrModal } from "../quick-connect/ScanQrModal";
import { AttendanceModal } from "../../components/AttendanceModal";
import { WorkflowModal } from "../../components/WorkflowModal";
import { ApprovalsModal } from "../../components/ApprovalsModal";
import { ScheduleMeetingModal } from "../../components/ScheduleMeetingModal";
import { CardScanReviewModal } from "../../components/CardScanReviewModal";
import { EventDetailModal } from "../../components/EventDetailModal";
import { StaffDailyActivityModal } from "../../components/StaffDailyActivityModal";
import { MemberCardBottomSheet } from "../../components/MemberCardBottomSheet";
import { PostMomentModal } from "../../components/PostMomentModal";
import { meApi, eventsApi, meetingsApi, networkApi } from "../../api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AiPartnerItem {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  industryKey: string;
  location: string;
  distanceTier: "near" | "city" | "national";
  suggestion: string;
  matchScore: string;
  initial: string;
}

interface VoiceMomentItem {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  location: string;
  transcript: string;
  audioUrl?: string;
}

interface HomeScreenProps {
  navigation?: any;
  onOpenV?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onOpenV }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "reminders" | "voice_moments">("today");

  // Location permission state
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(true);
  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);

  // Modals state
  const [myQrVisible, setMyQrVisible] = useState(false);
  const [scanQrVisible, setScanQrVisible] = useState(false);
  const [attendanceVisible, setAttendanceVisible] = useState(false);
  const [workflowVisible, setWorkflowVisible] = useState(false);
  const [approvalsVisible, setApprovalsVisible] = useState(false);
  const [staffDailyModalVisible, setStaffDailyModalVisible] = useState(false);
  const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
  const [selectedPartnerForMeeting, setSelectedPartnerForMeeting] = useState<{ name: string; company: string } | null>(null);
  const [cardScanReviewVisible, setCardScanReviewVisible] = useState(false);
  const [eventDetailModalVisible, setEventDetailModalVisible] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [memberCardModalVisible, setMemberCardModalVisible] = useState(false);
  const [postMomentVisible, setPostMomentVisible] = useState(false);

  // Filters for AI suggestions
  const [distanceFilter, setDistanceFilter] = useState<"all" | "near" | "city" | "national">("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // Dynamic data lists
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [aiSuggestedPartners, setAiSuggestedPartners] = useState<AiPartnerItem[]>([]);
  const [todayPool, setTodayPool] = useState<any[]>([]);

  // Voice moments audio player simulation
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceMomentsList, setVoiceMomentsList] = useState<VoiceMomentItem[]>([]);

  const togglePlayVoice = (id: string) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
      setTimeout(() => {
        setPlayingVoiceId((prev) => (prev === id ? null : prev));
      }, 5000);
    }
  };

  const handleRequestLocation = () => {
    setRequestingLocation(true);
    setTimeout(() => {
      setRequestingLocation(false);
      setHasLocationPermission(true);
      Alert.alert(
        "Định vị AI",
        "Đã bật chia sẻ vị trí thành công! Trợ lý AI ViOne đã sẵn sàng tìm kiếm đối tác quanh bạn."
      );
    }, 600);
  };

  // Load live data from API
  const loadData = async () => {
    try {
      // 1. Unread notifications
      const notifRes = await meApi.getUnreadNotificationCount();
      if (notifRes?.data?.count !== undefined) {
        setUnreadNotificationsCount(notifRes.data.count);
      }
    } catch {}

    try {
      // 2. Events from NestJS API
      const eventsRes = await eventsApi.getEvents();
      const eventsList = Array.isArray(eventsRes?.data)
        ? eventsRes.data
        : (eventsRes?.data as any)?.items || [];

      if (eventsList.length > 0) {
        const now = new Date();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const mapped = eventsList.map((ev: any) => {
          const rawDate = ev.date || ev.startDate || ev.startsAt || ev.start_date;
          const dt = rawDate ? new Date(rawDate) : null;
          return {
            id: String(ev.id),
            title: ev.title || ev.name || "Sự kiện kết nối Doanh nghiệp",
            date: dt ? dt.toLocaleDateString("vi-VN") : "Hôm nay",
            time: dt ? dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "09:30",
            location: ev.location || ev.venue || "Hội trường ViOne Connect",
            community: ev.associationName || ev.communityName || "CLB Doanh Nhân ViOne",
            dt,
          };
        });

        // Filter upcoming events (future dates)
        const upcoming = mapped.filter((ev: any) => ev.dt && ev.dt > todayEnd);
        setUpcomingEvents(upcoming.length > 0 ? upcoming : mapped.slice(0, 5));

        // Filter today events
        const todayEvents = mapped.filter((ev: any) => {
          if (!ev.dt) return false;
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return ev.dt >= start && ev.dt <= todayEnd;
        });
        setTodayPool(todayEvents);
      }
    } catch {}

    try {
      // 3. Meetings from NestJS API
      const meetingsRes = await meetingsApi.getMeetings();
      const meetingsList = Array.isArray(meetingsRes?.data)
        ? meetingsRes.data
        : (meetingsRes?.data as any)?.items || [];

      if (meetingsList.length > 0) {
        setRemindersList(
          meetingsList.map((m: any) => {
            const rawDate = m.meetingDate || m.scheduled_start_at || m.date || m.time;
            const dt = rawDate ? new Date(rawDate) : null;
            const isOnline =
              m.locationType === "online" ||
              m.format === "online" ||
              (m.locationName && m.locationName.toLowerCase().includes("meet"));

            return {
              id: String(m.id),
              title: m.title || `Cuộc gặp 1-1: ${m.partnerName || m.counterpart || "Doanh nhân Đối tác"}`,
              date: dt ? dt.toLocaleDateString("vi-VN") : "Hôm nay",
              time: dt ? dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : (m.time || "14:30"),
              location: isOnline
                ? "Google Meet Trực Tuyến"
                : m.locationName || m.location || "Trụ sở ViOne Connect",
              format: isOnline ? "online" : "offline",
              type: "meeting",
            };
          })
        );
      } else {
        setRemindersList([]);
      }
    } catch {}

    try {
      // 4. AI Recommendations from NestJS API
      const recoRes = await networkApi.getTodayRecommendations();
      const recoList = Array.isArray(recoRes?.data) ? recoRes.data : [];
      if (recoList.length > 0) {
        setAiSuggestedPartners(
          recoList.map((r: any, idx: number): AiPartnerItem => ({
            id: r.id || `reco-${idx}`,
            name: r.name || r.displayName || "Doanh nhân đối tác",
            title: r.title || r.headline || "Lãnh đạo Doanh nghiệp",
            company: r.company || r.companyName || "Tập đoàn Đối tác",
            industry: r.industry || "Kinh doanh & Đầu tư",
            industryKey: r.industryKey || "tech",
            location: r.location || "Hà Nội",
            distanceTier: r.distanceTier || "near",
            suggestion: r.suggestion || r.reason || "Tìm thấy tiềm năng hợp tác chiến lược giữa hai doanh nghiệp",
            matchScore: r.matchScore || "92% phù hợp B2B",
            initial: (r.name || r.displayName || "V").trim().slice(-1).toUpperCase(),
          }))
        );
      } else {
        setAiSuggestedPartners([]);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Formatted date in Vietnamese
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
  const userPhone = user?.phone || "";
  const avatarInitial = getInitial(displayName);

  // Filter AI partners by distance and industry
  const filteredAiPartners = useMemo(() => {
    return aiSuggestedPartners.filter((p) => {
      if (distanceFilter !== "all") {
        if (distanceFilter === "near" && p.distanceTier !== "near") return false;
        if (distanceFilter === "city" && p.distanceTier !== "near" && p.distanceTier !== "city") return false;
        if (distanceFilter === "national" && p.distanceTier !== "national") return false;
      }
      if (industryFilter !== "all") {
        if (p.industryKey !== industryFilter) return false;
      }
      return true;
    });
  }, [aiSuggestedPartners, distanceFilter, industryFilter]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {/* Top Sticky Header — Khớp 100% PWA ExecutiveHome */}
      <StickyBrandHeader
        rightActions={
          <TouchableOpacity
            style={[
              styles.headerSquareBtn,
              {
                backgroundColor: isDark ? "rgba(22, 32, 50, 0.65)" : "#F1F5F9",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() =>
              Alert.alert(
                "Thông báo",
                unreadNotificationsCount > 0
                  ? `Bạn có ${unreadNotificationsCount} thông báo kết nối mới.`
                  : "Không có thông báo mới.",
              )
            }
            activeOpacity={0.7}
          >
            <Bell size={16} color={isDark ? "#D8B282" : "#64748B"} strokeWidth={1.8} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
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
        {/* 1. Thẻ Doanh Nhân ViOne (Identity Card with Cover Banner & Avatar) */}
        <TouchableOpacity
          style={[
            styles.identityCard,
            {
              backgroundColor: isDark ? "rgba(14, 21, 34, 0.85)" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
            },
          ]}
          onPress={() => setMemberCardModalVisible(true)}
          activeOpacity={0.92}
        >
          {/* Ảnh bìa doanh nhân */}
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
              onPress={() => setMemberCardModalVisible(true)}
              activeOpacity={0.8}
            >
              <Pencil size={14} color="#D8B282" />
            </TouchableOpacity>
          </View>

          {/* Thông tin doanh nhân: Left Info & Right Avatar */}
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
                <LinearGradient colors={["#2A2016", "#14110E"]} style={styles.avatarCircle}>
                  <Text style={styles.avatarInitialText}>{avatarInitial}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Trạng thái chia sẻ vị trí AI & Định vị xung quanh (Matching 100% PWA) */}
        <View style={styles.locationBanner}>
          <View style={styles.locationLeft}>
            <View style={styles.locationDotWrap}>
              <View
                style={[
                  styles.locationDot,
                  { backgroundColor: hasLocationPermission ? "#10B981" : "#F59E0B" },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.locationTitleRow}>
                <MapPin size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.locationTitle}>
                  {hasLocationPermission ? "Định vị AI: Đang chia sẻ vị trí" : "Định vị AI: Chưa bật vị trí"}
                </Text>
              </View>
              <Text style={styles.locationDesc} numberOfLines={1}>
                {hasLocationPermission
                  ? "Bán kính định vị AI sẵn sàng tìm kiếm đối tác & người dùng ViOne quanh bạn"
                  : "Bật quyền vị trí để AI quét và kết nối doanh nhân ở gần bạn nhất"}
              </Text>
            </View>
          </View>
          {!hasLocationPermission && (
            <TouchableOpacity
              style={styles.enableLocationBtn}
              onPress={handleRequestLocation}
              disabled={requestingLocation}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enableLocationBtnGrad}
              >
                <Text style={styles.enableLocationBtnText}>
                  {requestingLocation ? "Đang bật..." : "Bật vị trí"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Phân Hệ HÔM NAY (Editorial schedule: 4 TABS Khớp 100% PWA) */}
        <View style={styles.sectionToday}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.todaySectionTitle}>
              {activeTab === "today"
                ? "HÔM NAY"
                : activeTab === "upcoming"
                ? "LỊCH TRÌNH SẮP TỚI"
                : activeTab === "reminders"
                ? "NHẮC LỊCH CUỘC GẶP & SỰ KIỆN"
                : "LỊCH SỬ KHOẢNG KHẮC GHI ÂM"}
            </Text>
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

          {/* Ngày tiếng Việt động hoặc Tiêu đề Tab */}
          <Text style={styles.todayDateTitle}>
            {activeTab === "today"
              ? getFormattedDate()
              : activeTab === "upcoming"
              ? "Sự kiện sắp diễn ra"
              : activeTab === "reminders"
              ? "Cuộc gặp & Nhắc hẹn"
              : "🎙️ Ghi âm khoảnh khắc"}
          </Text>

          {/* Bộ 4 Segmented Tabs: [Hôm nay] [Sắp tới (N)] [Nhắc lịch (N)] [🎙️ Ghi âm (N)] */}
          <View style={styles.tabsRow}>
            {/* Tab 1: Hôm nay */}
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
                  <Text style={styles.tabPillTextActive}>
                    Hôm nay {todayPool.length > 0 ? `(${todayPool.length})` : ""}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabPillTextInactive}>Hôm nay</Text>
              )}
            </TouchableOpacity>

            {/* Tab 2: Sắp tới */}
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
                  {upcomingEvents.length > 0 && (
                    <View style={styles.tabBadgeActive}>
                      <Text style={styles.tabBadgeTextActive}>{upcomingEvents.length}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabInactiveInner}>
                  <Text style={styles.tabPillTextInactive}>Sắp tới</Text>
                  {upcomingEvents.length > 0 && (
                    <View style={styles.tabBadgeInactive}>
                      <Text style={styles.tabBadgeTextInactive}>{upcomingEvents.length}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Tab 3: Nhắc lịch */}
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
                  {remindersList.length > 0 && (
                    <View style={styles.tabBadgeActive}>
                      <Text style={styles.tabBadgeTextActive}>{remindersList.length}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabInactiveInner}>
                  <Text style={styles.tabPillTextInactive}>Nhắc lịch</Text>
                  {remindersList.length > 0 && (
                    <View style={styles.tabBadgeInactive}>
                      <Text style={styles.tabBadgeTextInactive}>{remindersList.length}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Tab 4: Ghi âm khoảnh khắc (🎙️ Ghi âm) */}
            <TouchableOpacity
              style={styles.tabPill}
              onPress={() => setActiveTab("voice_moments")}
              activeOpacity={0.8}
            >
              {activeTab === "voice_moments" ? (
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabGradientActive}
                >
                  <Mic size={11} color="#050C15" style={{ marginRight: 2 }} />
                  <Text style={styles.tabPillTextActive}>Ghi âm</Text>
                  {voiceMomentsList.length > 0 && (
                    <View style={styles.tabBadgeActive}>
                      <Text style={styles.tabBadgeTextActive}>{voiceMomentsList.length}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabInactiveInner}>
                  <Mic size={11} color="#EF4444" style={{ marginRight: 2 }} />
                  <Text style={styles.tabPillTextInactive}>Ghi âm</Text>
                  {voiceMomentsList.length > 0 && (
                    <View style={[styles.tabBadgeInactive, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                      <Text style={[styles.tabBadgeTextInactive, { color: "#EF4444" }]}>
                        {voiceMomentsList.length}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nội dung Tab HÔM NAY */}
          {activeTab === "today" && (
            todayPool.length === 0 ? (
              <View style={styles.quietBox}>
                <View style={styles.quietIconWrap}>
                  <CheckCircle2 size={26} color="#D8B282" strokeWidth={1.8} />
                </View>
                <Text style={styles.quietTitle}>Hôm nay thật yên tĩnh</Text>
                <Text style={styles.quietSubtitle}>
                  Không có việc khẩn cần xử lý ngay. Có thể đây là lúc tốt để mở rộng kết nối mới.
                </Text>
                <TouchableOpacity
                  style={styles.openVBtn}
                  onPress={() => {
                    if (onOpenV) onOpenV();
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.vMiniEmblem}>
                    <VIconMark size={14} />
                  </View>
                  <Text style={styles.openVBtnText}>Mở V để kết nối</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {todayPool.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    style={styles.eventCard}
                    onPress={() => {
                      setSelectedEventForDetail(ev);
                      setEventDetailModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTag}>
                        <CalendarDays size={12} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.cardTagText}>{ev.community}</Text>
                      </View>
                      <Text style={styles.cardDate}>{ev.time} · Hôm nay</Text>
                    </View>
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    <View style={styles.cardLocationRow}>
                      <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                      <Text style={styles.cardLocationText}>{ev.location}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {/* Nội dung Tab SẮP TỚI (Timeline & List sự kiện sắp tới) */}
          {activeTab === "upcoming" && (
            <View style={styles.listContainer}>
              {upcomingEvents.length === 0 ? (
                <View style={styles.quietBox}>
                  <CalendarDays size={28} color="#94A3B8" />
                  <Text style={styles.quietTitle}>Chưa có sự kiện sắp diễn ra</Text>
                </View>
              ) : (
                upcomingEvents.map((ev) => (
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
                ))
              )}

              {upcomingEvents.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllEventsRow}
                  onPress={() => Alert.alert("Lịch sự kiện", "Đang mở toàn bộ lịch hoạt động.")}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <CalendarDays size={15} color="#D8B282" />
                    <Text style={styles.viewAllEventsText}>
                      Xem tất cả ({upcomingEvents.length}) sự kiện trong lịch
                    </Text>
                  </View>
                  <ChevronRight size={15} color="#D8B282" />
                </TouchableOpacity>
              )}
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
                      {rem.format === "online" ? (
                        <Video size={13} color="#D8B282" style={{ marginRight: 4 }} />
                      ) : (
                        <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                      )}
                      <Text style={styles.cardLocationText} numberOfLines={1}>
                        {rem.location}
                      </Text>
                    </View>

                    {rem.format === "online" ? (
                      <TouchableOpacity
                        style={styles.joinMeetingBtn}
                        onPress={() => Linking.openURL("https://meet.google.com/new")}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.joinMeetingBtnText}>Vào họp</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.confirmedPill}>
                        <Text style={styles.confirmedPillText}>Đã xác nhận</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Nội dung Tab GHI ÂM KHOẢNH KHẮC (Khớp 100% PWA) */}
          {activeTab === "voice_moments" && (
            <View style={styles.listContainer}>
              <View style={styles.voiceSectionHeader}>
                <Text style={styles.voiceSectionHeaderSub}>
                  Lưu vết khoảnh khắc giọng nói đã đồng bộ AI:
                </Text>
                <TouchableOpacity
                  style={styles.newVoiceBtn}
                  onPress={() => setPostMomentVisible(true)}
                  activeOpacity={0.7}
                >
                  <Mic size={12} color="#D8B282" style={{ marginRight: 4 }} />
                  <Text style={styles.newVoiceBtnText}>Ghi âm mới</Text>
                </TouchableOpacity>
              </View>

              {voiceMomentsList.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Mic size={24} color={isDark ? "rgba(255, 255, 255, 0.25)" : "#94A3B8"} />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12.5,
                      color: isDark ? "rgba(255, 255, 255, 0.45)" : "#64748B",
                    }}
                  >
                    Chưa có khoảnh khắc ghi âm nào
                  </Text>
                </View>
              ) : (
                voiceMomentsList.map((vm) => {
                  const isPlaying = playingVoiceId === vm.id;
                  return (
                    <View key={vm.id} style={styles.voiceCard}>
                      <View style={styles.voiceCardTop}>
                        <View style={styles.voiceMetaLeft}>
                          <View style={styles.voiceMicIcon}>
                            <Mic size={16} color="#EF4444" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.voiceCardTitle}>{vm.title}</Text>
                            <Text style={styles.voiceCardAuthor}>
                              {vm.author} · {vm.date} · {vm.duration}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.playVoiceBtn,
                            isPlaying ? styles.playVoiceBtnActive : styles.playVoiceBtnNormal,
                          ]}
                          onPress={() => togglePlayVoice(vm.id)}
                          activeOpacity={0.85}
                        >
                          {isPlaying ? (
                            <>
                              <Pause size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.playVoiceBtnActiveText}>Tạm dừng</Text>
                            </>
                          ) : (
                            <>
                              <Play size={12} color="#050C15" style={{ marginRight: 4 }} />
                              <Text style={styles.playVoiceBtnText}>Phát lại</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* AI Transcript */}
                      {vm.transcript ? (
                        <View style={styles.voiceTranscriptBox}>
                          <Text style={styles.voiceTranscriptLabel}>Nội dung ghi âm AI: </Text>
                          <Text style={styles.voiceTranscriptText}>"{vm.transcript}"</Text>
                        </View>
                      ) : null}

                      {/* Waveform indicator when playing */}
                      {isPlaying && (
                        <View style={styles.waveformWrap}>
                          {[10, 16, 8, 20, 12, 18, 14, 8, 22, 10, 15, 6].map((h, i) => (
                            <View
                              key={i}
                              style={[styles.waveformBar, { height: h, backgroundColor: "#EF4444" }]}
                            />
                          ))}
                          <Text style={styles.waveformText}>Đang phát âm thanh gốc...</Text>
                        </View>
                      )}

                      {/* Footer */}
                      <View style={styles.voiceCardFooter}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <MapPin size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                          <Text style={styles.voiceLocationText}>{vm.location}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* 3. Khối INSIGHT DÀNH CHO BẠN (Matching 100% PWA) */}
        <View
          style={[
            styles.insightCard,
            {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "rgba(216, 178, 130, 0.35)",
            },
          ]}
        >
          <View style={styles.insightHeaderRow}>
            <Sparkles size={16} color="#D8B282" style={{ marginRight: 6 }} />
            <Text style={styles.insightSmallLabel}>SỐ CƠ HỘI KẾT NỐI TIỀM NĂNG</Text>
          </View>

          <Text style={[styles.insightHeadline, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
            BẠN CÓ <Text style={styles.insightGoldNumber}>15</Text> CƠ HỘI KẾT NỐI TIỀM NĂNG CAO
          </Text>

          <Text style={[styles.insightSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
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

        {/* 4. Bộ 3 Phím Tắt Nhanh (QUICK ACTIONS - Matching 100% PWA) */}
        <View style={styles.quickActionsGrid}>
          {/* Quick Action 1: Gặp gỡ */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={() => setPostMomentVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <QuickMeetIcon size={16} color="#D8B282" />
            </View>
            <Text style={[styles.quickActionLabel, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              Gặp gỡ
            </Text>
          </TouchableOpacity>

          {/* Quick Action 2: Quét & Kết nối */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={() => setCardScanReviewVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <QuickScanIcon size={18} color="#D8B282" />
            </View>
            <Text style={[styles.quickActionLabel, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              Quét & Kết nối
            </Text>
          </TouchableOpacity>

          {/* Quick Action 3: Danh thiếp của tôi */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={() => setMemberCardModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <QuickCardIcon size={17} color="#D8B282" />
            </View>
            <Text style={[styles.quickActionLabel, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              Danh thiếp của tôi
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Khối ĐIỀU HÀNH & GIÁM SÁT DOANH NGHIỆP (Trung Tâm Điều Hành C-Level) */}
        <View
          style={[
            styles.opsSection,
            {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "rgba(216, 178, 130, 0.35)",
            },
          ]}
        >
          <View style={styles.opsHeaderRow}>
            <View style={styles.opsHeaderLeft}>
              <Activity size={16} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.opsSectionLabel}>GIÁM SÁT VẬN HÀNH & NHÂN SỰ</Text>
            </View>
            <View style={styles.opsLiveBadge}>
              <View style={styles.opsLiveDot} />
              <Text style={styles.opsLiveText}>TRỰC TUYẾN</Text>
            </View>
          </View>

          <Text style={[styles.opsHeadline, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
            Trung Tâm Điều Hành C-Level
          </Text>
          <Text style={[styles.opsSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
            Tổng quan điều hành, chấm công GPS và phê duyệt ngân sách 3 cấp.
          </Text>

          {/* 3 Metric Tiles (Interactive Executive Metrics) */}
          <View style={styles.opsMetricsGrid}>
            {/* KPI 1: Chấm công */}
            <TouchableOpacity
              style={[
                styles.opsMetricTile,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => setAttendanceVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.metricTileHeader}>
                <View style={styles.metricIconWrap}>
                  <MapPin size={14} color="#D8B282" />
                </View>
                <ChevronRight size={13} color="#94A3B8" />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                42<Text style={styles.metricSub}>/45</Text>
              </Text>
              <Text style={styles.metricBadgeGreen}>93.3% có mặt</Text>
              <Text style={[styles.metricLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Chấm công GPS
              </Text>
            </TouchableOpacity>

            {/* KPI 2: Quy trình */}
            <TouchableOpacity
              style={[
                styles.opsMetricTile,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => setWorkflowVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.metricTileHeader}>
                <View style={styles.metricIconWrap}>
                  <Layers size={14} color="#D8B282" />
                </View>
                <ChevronRight size={13} color="#94A3B8" />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>12</Text>
              <Text style={styles.metricBadgeRed}>2 việc trễ</Text>
              <Text style={[styles.metricLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Tiến độ nhân sự
              </Text>
            </TouchableOpacity>

            {/* KPI 3: Duyệt chi */}
            <TouchableOpacity
              style={[
                styles.opsMetricTile,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => setApprovalsVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.metricTileHeader}>
                <View style={styles.metricIconWrap}>
                  <ShieldCheck size={14} color="#D8B282" />
                </View>
                <ChevronRight size={13} color="#94A3B8" />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>3</Text>
              <Text style={styles.metricBadgeGold}>41.5 Tr chờ</Text>
              <Text style={[styles.metricLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Ký duyệt chi
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Banner mạ vàng sang trọng — 1 chạm điểm danh */}
          <View style={styles.opsActionBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <Sparkles size={14} color="#D8B282" />
              <Text
                style={[styles.opsBannerText, { color: isDark ? "#F8FAFC" : "#0F172A" }]}
                numberOfLines={1}
              >
                Hôm nay: 3 việc ưu tiên & 1 tờ trình cần ký
              </Text>
            </View>
            <TouchableOpacity
              style={styles.opsBannerBtn}
              onPress={() => setAttendanceVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.opsBannerBtnGrad}
              >
                <Text style={styles.opsBannerBtnText}>Chấm công ngay</Text>
              </LinearGradient>
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

          {/* Lọc theo phạm vi */}
          <View style={{ marginTop: 12, marginBottom: 6 }}>
            <Text style={styles.filterGroupTitle}>LỌC THEO PHẠM VI KHÔNG GIAN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { id: "all", label: "Tất cả phạm vi" },
                { id: "near", label: "📍 Gần tôi (10km)" },
                { id: "city", label: "🏢 Cùng thành phố" },
                { id: "national", label: "🌐 Toàn quốc" },
              ].map((df) => {
                const active = distanceFilter === df.id;
                return (
                  <TouchableOpacity
                    key={df.id}
                    style={[styles.aiFilterChip, active && styles.aiFilterChipActive]}
                    onPress={() => setDistanceFilter(df.id as any)}
                  >
                    <Text style={[styles.aiFilterChipText, active && styles.aiFilterChipTextActive]}>
                      {df.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Lọc theo ngành nghề */}
          <View style={{ marginTop: 6, marginBottom: 12 }}>
            <Text style={styles.filterGroupTitle}>LỌC THEO LĨNH VỰC & CHUỖI GIÁ TRỊ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { id: "all", label: "Tất cả ngành nghề" },
                { id: "logistics", label: "📦 Chuỗi cung ứng & Bán lẻ" },
                { id: "tech", label: "💻 Công nghệ & AI" },
                { id: "investment", label: "💎 Quỹ đầu tư & Vốn" },
                { id: "construction", label: "🏗️ Xây dựng & Bất động sản" },
                { id: "media", label: "📢 Truyền thông B2B" },
              ].map((ind) => {
                const active = industryFilter === ind.id;
                return (
                  <TouchableOpacity
                    key={ind.id}
                    style={[styles.aiFilterChip, active && styles.aiFilterChipActive]}
                    onPress={() => setIndustryFilter(ind.id)}
                  >
                    <Text style={[styles.aiFilterChipText, active && styles.aiFilterChipTextActive]}>
                      {ind.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Danh sách đối tác gợi ý */}
          <View style={styles.aiListCol}>
            {filteredAiPartners.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Không có gợi ý trong phạm vi này. Vui lòng mở rộng bộ lọc.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setDistanceFilter("all");
                    setIndustryFilter("all");
                  }}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: "#D8B282", fontSize: 12, fontWeight: "700" }}>
                    Đặt lại bộ lọc
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredAiPartners.map((item: AiPartnerItem) => (
                <View key={item.id} style={styles.aiPartnerCard}>
                  <View style={styles.aiPartnerTop}>
                    <LinearGradient colors={["#2A2016", "#14110E"]} style={styles.aiAvatarCircle}>
                      <Text style={styles.aiAvatarInitial}>{item.initial}</Text>
                    </LinearGradient>

                    <View style={styles.aiPartnerInfo}>
                      <View style={styles.aiNameRow}>
                        <Text style={styles.aiPartnerName} numberOfLines={1}>
                          {item.name}
                        </Text>
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
                      onPress={() => {
                        setSelectedPartnerForMeeting({
                          name: item.name,
                          company: item.company,
                        });
                        setScheduleMeetingVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Handshake size={13} color="#050C15" style={{ marginRight: 4 }} />
                      <Text style={styles.aiConnectBtnText}>Lên lịch 1-1</Text>
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
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals hỗ trợ kết nối & nghiệp vụ */}
      <MyQrModal visible={myQrVisible} onClose={() => setMyQrVisible(false)} />
      <ScanQrModal visible={scanQrVisible} onClose={() => setScanQrVisible(false)} />
      <AttendanceModal visible={attendanceVisible} onClose={() => setAttendanceVisible(false)} />
      <WorkflowModal visible={workflowVisible} onClose={() => setWorkflowVisible(false)} />
      <ApprovalsModal visible={approvalsVisible} onClose={() => setApprovalsVisible(false)} />
      <StaffDailyActivityModal visible={staffDailyModalVisible} onClose={() => setStaffDailyModalVisible(false)} />
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
      <MemberCardBottomSheet
        visible={memberCardModalVisible}
        onClose={() => setMemberCardModalVisible(false)}
        onOpenMyQr={() => setMyQrVisible(true)}
        onOpenNfc={() => Alert.alert("Chạm thẻ NFC", "Đưa điện thoại lại gần thẻ doanh nhân thông minh ViOne để kết nối.")}
        onOpenProfile={() => navigation?.navigate("Me")}
      />
      <PostMomentModal
        visible={postMomentVisible}
        onClose={() => setPostMomentVisible(false)}
        onPostSuccess={() => {
          setPostMomentVisible(false);
          loadData();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },
  headerSquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  identityCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    backgroundColor: "#0E1522",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  coverBannerWrap: {
    height: 110,
    width: "100%",
    position: "relative",
  },
  coverBannerImg: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    position: "absolute",
    inset: 0,
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  identityBody: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identityLeft: {
    flex: 1,
    paddingRight: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    marginBottom: 4,
  },
  roleBadgeText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 23,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#D8B282",
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#D8B282",
    padding: 2,
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
    color: "#D8B282",
    fontSize: 22,
    fontWeight: "800",
  },
  locationBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  locationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  locationDotWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  locationDesc: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 1,
  },
  enableLocationBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  enableLocationBtnGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  enableLocationBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050811",
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
    fontSize: 10.5,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  viewCalendarBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewCalendarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8B282",
    marginRight: 2,
  },
  todayDateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
    textTransform: "capitalize",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.15)",
  },
  tabPill: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  tabGradientActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  tabPillTextActive: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050811",
  },
  tabPillTextInactive: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 7,
  },
  tabInactiveInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    gap: 3,
  },
  tabBadgeActive: {
    marginLeft: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  tabBadgeTextActive: {
    fontSize: 9,
    fontWeight: "800",
    color: "#050811",
  },
  tabBadgeInactive: {
    marginLeft: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
  },
  tabBadgeTextInactive: {
    fontSize: 9,
    fontWeight: "700",
    color: "#D8B282",
  },
  quietBox: {
    marginTop: 14,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
  },
  quietIconWrap: {
    marginBottom: 10,
  },
  quietTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  quietSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 260,
    marginBottom: 16,
  },
  openVBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  vMiniEmblem: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  openVBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#D8B282",
  },
  listContainer: {
    marginTop: 14,
    gap: 10,
  },
  eventCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  cardDate: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 19,
    marginBottom: 6,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardLocationText: {
    fontSize: 12,
    color: "#94A3B8",
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    gap: 8,
  },
  confirmedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  confirmedPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#10B981",
  },
  joinMeetingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.25)",
    borderWidth: 1,
    borderColor: "#D8B282",
  },
  joinMeetingBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D8B282",
  },
  viewAllEventsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.18)",
    marginTop: 4,
  },
  viewAllEventsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8B282",
  },
  voiceSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  voiceSectionHeaderSub: {
    fontSize: 11.5,
    color: "#94A3B8",
    flex: 1,
  },
  newVoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  newVoiceBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#D8B282",
  },
  voiceCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  voiceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  voiceMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  voiceMicIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  voiceCardAuthor: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  playVoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playVoiceBtnNormal: {
    backgroundColor: "#D8B282",
  },
  playVoiceBtnActive: {
    backgroundColor: "#EF4444",
  },
  playVoiceBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
  playVoiceBtnActiveText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  voiceTranscriptBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderLeftWidth: 2,
    borderLeftColor: "#D8B282",
  },
  voiceTranscriptLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  voiceTranscriptText: {
    fontSize: 11.5,
    color: "#E2E8F0",
    fontStyle: "italic",
    lineHeight: 16,
    marginTop: 2,
  },
  waveformWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  waveformText: {
    fontSize: 10.5,
    color: "#EF4444",
    fontWeight: "600",
    marginLeft: 6,
  },
  voiceCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  voiceLocationText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  voiceCrmBadge: {
    fontSize: 9.5,
    color: "#D8B282",
    fontWeight: "600",
  },
  insightCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  insightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  insightSmallLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  insightHeadline: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 6,
  },
  insightGoldNumber: {
    color: "#D8B282",
  },
  insightSubtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 12,
  },
  insightCta: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightCtaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D8B282",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  quickActionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  opsSection: {
    marginTop: 22,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  opsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  opsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  opsSectionLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.8,
  },
  opsLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
  },
  opsLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  opsLiveText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#D8B282",
  },
  opsHeadline: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  opsSubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 14,
  },
  opsMetricsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  opsMetricTile: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  metricTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  metricSub: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
  metricBadgeGreen: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 2,
  },
  metricBadgeRed: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EF4444",
    marginTop: 2,
  },
  metricBadgeGold: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9.5,
    color: "#94A3B8",
    marginTop: 4,
  },
  opsActionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
  },
  opsBannerText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#E2E8F0",
  },
  opsBannerBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  opsBannerBtnGrad: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  opsBannerBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050811",
  },
  aiSection: {
    marginTop: 22,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  aiHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiSectionLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.8,
  },
  aiViewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiViewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8B282",
    marginRight: 2,
  },
  aiHeadline: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  aiSubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  filterGroupTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  aiFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  aiFilterChipActive: {
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    borderColor: "#D8B282",
  },
  aiFilterChipText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  aiFilterChipTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  aiListCol: {
    marginTop: 8,
    gap: 10,
  },
  aiPartnerCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.025)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.18)",
  },
  aiPartnerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D8B282",
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
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  aiLocationTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiLocationText: {
    fontSize: 10.5,
    color: "#D8B282",
  },
  aiMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  aiMetaText: {
    fontSize: 11.5,
    color: "#CBD5E1",
    flex: 1,
  },
  aiIndustryText: {
    fontSize: 11,
    color: "#94A3B8",
    flex: 1,
  },
  aiReasonBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(216, 178, 130, 0.08)",
    borderLeftWidth: 2,
    borderLeftColor: "#D8B282",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  aiSuggestionText: {
    fontSize: 11,
    color: "#F6E1C3",
    flex: 1,
  },
  aiMatchScoreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  aiActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  aiConnectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#D8B282",
  },
  aiConnectBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
  aiMessageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  aiMessageBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#D8B282",
  },
});
