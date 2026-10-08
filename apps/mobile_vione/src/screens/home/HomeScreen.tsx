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
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Pencil,
  SlidersHorizontal,
  ChevronRight,
  X,
  Calendar,
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
import { AssignTaskModal } from "../../components/AssignTaskModal";
import { MemberCardBottomSheet } from "../../components/MemberCardBottomSheet";
import { PostMomentModal } from "../../components/PostMomentModal";
import { BusinessNotificationsModal } from "../../components/BusinessNotificationsModal";
import { ViOneVoiceAssistantModal } from "../../components/ai/ViOneVoiceAssistantModal";
import { OpportunityDetailModal, CommunityOpportunityItem } from "../../components/OpportunityDetailModal";
import { TodayCustomizeSheet, TodayPreferences, DEFAULT_TODAY_PREFERENCES } from "../../components/TodayCustomizeSheet";
import { ScheduleCalendarModal } from "../../components/ScheduleCalendarModal";
import { meApi, eventsApi, meetingsApi, networkApi, opportunityApi } from "../../api";

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

const INITIAL_TODAY_OPPORTUNITIES: CommunityOpportunityItem[] = [
  {
    id: "opp-today-1",
    title: "Gói thầu thiết kế thi công nội thất & cơ điện trụ sở tập đoàn",
    organization: "Tập đoàn Bất Động Sản Khang Điền",
    communityName: "Liên minh Doanh Nhân B2B",
    communityId: "c-b2b-leaders",
    publishedDate: "Hôm nay",
    dealValue: "5.2 Tỷ VNĐ",
    category: "Xây dựng & Kiến trúc",
    daysLeft: "Đăng hôm nay · Còn 7 ngày",
    interested: false,
  },
  {
    id: "opp-today-2",
    title: "Tìm đối tác chiến lược cung ứng giải pháp AI & Phần mềm CRM",
    organization: "Tập đoàn Công Nghệ TechVibe",
    communityName: "Gia Đình ViOne",
    communityId: "c-vione-internal",
    publishedDate: "Hôm nay",
    dealValue: "850 Triệu VNĐ",
    category: "Công nghệ & AI",
    daysLeft: "Đăng hôm nay · Còn 14 ngày",
    interested: true,
  },
];

const INITIAL_TODAY_MEETINGS = [
  {
    id: "meet-today-1",
    title: "Trao đổi hợp tác chuỗi giá trị và phân phối bán lẻ",
    counterpart: "Ông Trần Đình Long · Chủ tịch HĐQT",
    phone: "0988 888 888",
    time: "14:30 - 15:30",
    date: "Hôm nay",
    format: "online",
    location: "Google Meet Trực Tuyến",
    status: "confirmed",
  },
];

interface HomeScreenProps {
  navigation?: any;
  onOpenV?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onOpenV }) => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "all" | "upcoming" | "reminders" | "voice_moments">("today");

  // Location permission state
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(true);
  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);

  // Today Briefing Preferences (Matching 100% PWA TodayCustomizeSheet)
  const [todayPrefs, setTodayPrefs] = useState<TodayPreferences>(DEFAULT_TODAY_PREFERENCES);
  const [todayCustomizeVisible, setTodayCustomizeVisible] = useState(false);

  // Modals state
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [myQrVisible, setMyQrVisible] = useState(false);
  const [scanQrVisible, setScanQrVisible] = useState(false);
  const [attendanceVisible, setAttendanceVisible] = useState(false);
  const [workflowVisible, setWorkflowVisible] = useState(false);
  const [approvalsVisible, setApprovalsVisible] = useState(false);
  const [staffDailyModalVisible, setStaffDailyModalVisible] = useState(false);
  const [assignTaskModalVisible, setAssignTaskModalVisible] = useState(false);
  const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
  const [selectedPartnerForMeeting, setSelectedPartnerForMeeting] = useState<{ name: string; company: string } | null>(null);
  const [cardScanReviewVisible, setCardScanReviewVisible] = useState(false);
  const [eventDetailModalVisible, setEventDetailModalVisible] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [memberCardModalVisible, setMemberCardModalVisible] = useState(false);
  const [postMomentVisible, setPostMomentVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [showFloatingAi, setShowFloatingAi] = useState(true);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;
  const [opportunityDetailModalVisible, setOpportunityDetailModalVisible] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<CommunityOpportunityItem | null>(null);

  // Filters for AI suggestions
  const [distanceFilter, setDistanceFilter] = useState<"all" | "near" | "city" | "national">("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // Dynamic data lists
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [aiSuggestedPartners, setAiSuggestedPartners] = useState<AiPartnerItem[]>([]);
  const [todayPool, setTodayPool] = useState<any[]>([]);
  const [todayOpportunities, setTodayOpportunities] = useState<CommunityOpportunityItem[]>(INITIAL_TODAY_OPPORTUNITIES);
  const [todayMeetings, setTodayMeetings] = useState<any[]>(INITIAL_TODAY_MEETINGS);

  // Voice moments audio player simulation
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceMomentsList, setVoiceMomentsList] = useState<VoiceMomentItem[]>([]);
  const [selectedOpportunityForAi, setSelectedOpportunityForAi] = useState<any | null>(null);

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
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    try {
      // 1. Identity & profile cover/avatar from NestJS API
      const identRes = await meApi.getIdentity();
      if (identRes?.data?.identity) {
        const iden = identRes.data.identity;
        updateUser({
          displayName: iden.displayName || user?.displayName,
          name: iden.displayName || user?.name,
          title: iden.jobTitle || iden.headline || user?.title,
          company: iden.companyName || user?.company,
          avatarUrl: iden.avatarUrl || user?.avatarUrl,
          coverUrl: iden.coverUrl || user?.coverUrl,
          phone: iden.primaryPhone || user?.phone,
        });
      }
    } catch {}

    try {
      // 2. Unread notifications
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

        const mapped = eventsList.map((ev: any) => {
          const rawDate = ev.date || ev.startDate || ev.startsAt || ev.start_date;
          const dt = rawDate ? new Date(rawDate) : null;
          return {
            id: String(ev.id),
            title: ev.title || ev.name || "Sự kiện kết nối Doanh nghiệp",
            imageUrl: ev.imageUrl || ev.coverUrl || ev.bannerUrl || ev.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
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
        const mappedMeets = meetingsList.map((m: any) => {
          const rawDate = m.meetingDate || m.scheduled_start_at || m.date || m.time;
          const dt = rawDate ? new Date(rawDate) : null;
          const isOnline =
            m.locationType === "online" ||
            m.format === "online" ||
            (m.locationName && m.locationName.toLowerCase().includes("meet"));

          return {
            id: String(m.id),
            title: m.title || `Cuộc gặp 1-1: ${m.partnerName || m.counterpart || "Doanh nhân Đối tác"}`,
            counterpart: m.partnerName || m.counterpart || "Doanh nhân Đối tác",
            phone: m.phone || m.partnerPhone || "0988 888 888",
            date: dt ? dt.toLocaleDateString("vi-VN") : "Hôm nay",
            time: dt ? dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : (m.time || "14:30"),
            location: isOnline
              ? "Google Meet Trực Tuyến"
              : m.locationName || m.location || "Trụ sở ViOne Connect",
            format: isOnline ? "online" : "offline",
            type: "meeting",
            status: m.status || "confirmed",
            dt,
          };
        });

        setRemindersList(mappedMeets);

        // Filter today meetings
        const todayMeets = mappedMeets.filter((m: any) => {
          if (!m.dt) return true;
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return m.dt >= start && m.dt <= todayEnd;
        });
        setTodayMeetings(todayMeets.length > 0 ? todayMeets : INITIAL_TODAY_MEETINGS);
      } else {
        setRemindersList([]);
        setTodayMeetings(INITIAL_TODAY_MEETINGS);
      }
    } catch {
      setTodayMeetings(INITIAL_TODAY_MEETINGS);
    }

    try {
      // 4. Opportunities from Community API
      const oppRes = await opportunityApi.getOpportunities();
      const oppList = Array.isArray(oppRes?.data)
        ? oppRes.data
        : (oppRes?.data as any)?.items || (Array.isArray(oppRes) ? oppRes : []);
      if (oppList.length > 0) {
        setTodayOpportunities(
          oppList.map((op: any, idx: number): CommunityOpportunityItem => ({
            id: String(op.id || `opp-${idx}`),
            title: op.title || "Cơ hội hợp tác chiến lược & giao thương",
            organization: op.organization || op.companyName || op.creatorName || "Tập đoàn Đối tác ViOne",
            communityName: op.communityName || op.groupName || "Liên minh Doanh Nhân B2B",
            dealValue: op.dealValue || (op.budget ? `${op.budget.toLocaleString("vi-VN")} VNĐ` : "Thỏa thuận"),
            category: op.category || op.field || "Hợp tác & Đầu tư",
            daysLeft: op.daysLeft || op.duration || "Còn 14 ngày",
            interested: !!op.interested,
          }))
        );
      } else {
        setTodayOpportunities(INITIAL_TODAY_OPPORTUNITIES);
      }
    } catch {
      setTodayOpportunities(INITIAL_TODAY_OPPORTUNITIES);
    }

    try {
      // 5. AI Recommendations from NestJS API
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

  const todayTotalCount = todayPool.length + todayMeetings.length + todayOpportunities.length;
  const allTotalCount = todayMeetings.length + todayOpportunities.length + upcomingEvents.length;

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
            onPress={() => setNotificationsVisible(true)}
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
              source={user?.coverUrl ? { uri: user.coverUrl } : require("../../../assets/vba-hero.jpg")}
              style={styles.coverBannerImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(10, 10, 11, 0.2)", "rgba(10, 10, 11, 0.75)"]}
              style={styles.coverGradient}
            />
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
              style={[
                styles.enableLocationBtn,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.6)",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                },
              ]}
              onPress={handleRequestLocation}
              disabled={requestingLocation}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: isDark ? "#D8B282" : "#B8860B",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {requestingLocation ? "Đang bật..." : "Bật vị trí"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Phân Hệ HÔM NAY (Editorial schedule: 4 TABS Khớp 100% PWA) */}
        <View style={styles.sectionToday}>
          <View style={styles.todayHeaderRow}>
            <Text
              style={[
                styles.todaySectionTitle,
                { color: isDark ? "#D8B282" : "#B8860B" },
              ]}
            >
              {activeTab === "today"
                ? "HÔM NAY"
                : activeTab === "upcoming"
                ? "LỊCH TRÌNH SẮP TỚI"
                : activeTab === "reminders"
                ? "NHẮC LỊCH CUỘC GẶP & SỰ KIỆN"
                : "LỊCH SỬ KHOẢNG KHẮC GHI ÂM"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {activeTab === "today" && (
                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                  }}
                  onPress={() => setTodayCustomizeVisible(true)}
                  activeOpacity={0.7}
                >
                  <SlidersHorizontal size={14} color={isDark ? "#D8B282" : "#8C653B"} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.viewCalendarBtn}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.viewCalendarText,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  Xem lịch
                </Text>
                <ChevronRight size={13} color={isDark ? "#D8B282" : "#8C653B"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ngày tiếng Việt động hoặc Tiêu đề Tab */}
          <Text
            style={[
              styles.todayDateTitle,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
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
              style={[
                styles.tabPill,
                activeTab === "today" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("today")}
              activeOpacity={0.8}
            >
              <Text
                style={
                  activeTab === "today"
                    ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                    : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                }
              >
                Hôm nay {todayTotalCount > 0 ? `(${todayTotalCount})` : ""}
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Tất cả */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "all" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("all")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "all"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Tất cả
                </Text>
                {allTotalCount > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {allTotalCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 2: Sắp tới */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "upcoming" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "upcoming"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Sắp tới
                </Text>
                {upcomingEvents.length > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {upcomingEvents.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 3: Nhắc lịch */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "reminders" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("reminders")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "reminders"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Nhắc lịch
                </Text>
                {remindersList.length > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {remindersList.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 4: Ghi âm khoảnh khắc (🎙️ Ghi âm) */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "voice_moments" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("voice_moments")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Mic size={11} color="#EF4444" style={{ marginRight: 2 }} />
                <Text
                  style={
                    activeTab === "voice_moments"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Ghi âm
                </Text>
                {voiceMomentsList.length > 0 && (
                  <View style={[styles.tabBadgeInactive, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                    <Text style={[styles.tabBadgeTextInactive, { color: "#EF4444" }]}>
                      {voiceMomentsList.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Nội dung Tab HÔM NAY (Đầy đủ: Lịch gặp hôm nay + Cơ hội mới cộng đồng + Sự kiện hôm nay) */}
          {activeTab === "today" && (
            todayTotalCount === 0 ? (
              <View style={styles.quietBox}>
                <View style={styles.quietIconWrap}>
                  <CheckCircle2 size={26} color="#D8B282" strokeWidth={1.8} />
                </View>
                <Text style={styles.quietTitle}>Hôm nay thật yên tĩnh</Text>
                <Text style={styles.quietSubtitle}>
                  Không có lịch hẹn, cơ hội mới hay sự kiện cần xử lý ngay. Hãy kết nối thêm doanh nhân mới!
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
                {/* 1. LỊCH GẶP HÔM NAY */}
                {todayMeetings.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <Handshake size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          LỊCH GẶP HÔM NAY
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayMeetings.length} cuộc hẹn
                        </Text>
                      </View>
                    </View>

                    {todayMeetings.map((meet) => (
                      <View key={meet.id} style={styles.eventCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.cardTag}>
                            <Handshake size={12} color="#D8B282" style={{ marginRight: 4 }} />
                            <Text style={styles.cardTagText}>Cuộc gặp 1-1 hôm nay</Text>
                          </View>
                          <Text style={styles.cardDate}>{meet.time} · Hôm nay</Text>
                        </View>
                        <Text style={styles.cardTitle}>{meet.title}</Text>

                        <View style={styles.partnerInfoRow}>
                          <Users size={13} color={isDark ? "#D4C3A3" : "#64748B"} style={{ marginRight: 5 }} />
                          <Text style={[styles.partnerInfoText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                            {meet.counterpart}
                          </Text>
                        </View>

                        <View style={styles.cardLocationRow}>
                          {meet.format === "online" ? (
                            <Video size={13} color="#10B981" style={{ marginRight: 4 }} />
                          ) : (
                            <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                          )}
                          <Text style={styles.cardLocationText}>{meet.location}</Text>
                        </View>

                        <View style={styles.todayMeetActionRow}>
                          {meet.format === "online" ? (
                            <TouchableOpacity
                              style={styles.meetPrimaryActionBtn}
                              onPress={() => Linking.openURL("https://meet.google.com/new")}
                              activeOpacity={0.8}
                            >
                              <Video size={13} color="#050C15" style={{ marginRight: 5 }} />
                              <Text style={styles.meetPrimaryActionText}>Vào phòng họp Meet</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.meetPrimaryActionBtn}
                              onPress={() => Linking.openURL("tel:0901234567")}
                              activeOpacity={0.8}
                            >
                              <Phone size={13} color="#050C15" style={{ marginRight: 5 }} />
                              <Text style={styles.meetPrimaryActionText}>Gọi đối tác</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.meetSecondaryActionBtn}
                            onPress={() => {
                              setSelectedPartnerForMeeting({
                                name: meet.counterpart,
                                company: "Doanh nghiệp Đối tác",
                              });
                              setScheduleMeetingVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <CalendarDays size={13} color="#DFB76C" style={{ marginRight: 4 }} />
                            <Text style={styles.meetSecondaryActionText}>Đổi lịch</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. CƠ HỘI MỚI TỪ CỘNG ĐỒNG */}
                {todayOpportunities.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <Briefcase size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#B8860B" }]}>
                          CƠ HỘI MỚI TỪ CỘNG ĐỒNG
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayOpportunities.length} cơ hội mới
                        </Text>
                      </View>
                    </View>

                    {todayOpportunities.map((opp) => (
                      <View key={opp.id} style={styles.opportunityCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.oppCommunityTag}>
                            <Users size={12} color="#DFB76C" style={{ marginRight: 4 }} />
                            <Text style={styles.oppCommunityTagText}>{opp.communityName}</Text>
                          </View>
                          <View style={styles.oppNewBadge}>
                            <Sparkles size={10} color="#050C15" style={{ marginRight: 3 }} />
                            <Text style={styles.oppNewBadgeText}>CƠ HỘI MỚI</Text>
                          </View>
                        </View>

                        <Text style={styles.cardTitle}>{opp.title}</Text>

                        <View style={styles.oppOrgRow}>
                          <Building2 size={13} color={isDark ? "#D4C3A3" : "#64748B"} style={{ marginRight: 5 }} />
                          <Text style={[styles.oppOrgText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                            {opp.organization}
                          </Text>
                        </View>

                        <View style={styles.oppMetaRow}>
                          <View style={styles.oppDealBadge}>
                            <Text style={styles.oppDealBadgeText}>{opp.dealValue}</Text>
                          </View>
                          <Text style={[styles.oppCategoryText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                            {opp.category} · {opp.daysLeft}
                          </Text>
                        </View>

                        <View style={[styles.oppActionRow, { flexDirection: "row", gap: 8 }]}>
                          <TouchableOpacity
                            style={[styles.oppDetailBtn, { flex: 1, backgroundColor: "#DFB76C" }]}
                            onPress={() => {
                              setSelectedOpportunityForAi({
                                id: opp.id,
                                title: opp.title,
                                organization: opp.organization,
                                dealValue: opp.dealValue,
                              });
                              setAiAssistantVisible(true);
                            }}
                            activeOpacity={0.85}
                          >
                            <Mic size={13} color="#050C15" style={{ marginRight: 4 }} />
                            <Text style={styles.oppDetailBtnText}>Nhờ AI Gửi Voice</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.oppDetailBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", paddingHorizontal: 12 }]}
                            onPress={() => {
                              navigation?.navigate("Community", {
                                communityId: opp.communityId || "c-b2b-leaders",
                                tab: "opportunities",
                                opportunityId: opp.id,
                              });
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.oppDetailBtnText, { color: isDark ? "#E2E8F0" : "#1E293B" }]}>Chi tiết</Text>
                            <ArrowRight size={13} color={isDark ? "#E2E8F0" : "#1E293B"} style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. SỰ KIỆN HÔM NAY */}
                {todayPool.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <CalendarDays size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          SỰ KIỆN HÔM NAY
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayPool.length} sự kiện
                        </Text>
                      </View>
                    </View>

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
                        {ev.imageUrl ? (
                          <Image
                            source={{ uri: ev.imageUrl }}
                            style={styles.eventCardImage}
                            resizeMode="cover"
                          />
                        ) : null}
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
                )}
              </View>
            )
          )}

          {/* Nội dung Tab TẤT CẢ (Cuộc gặp của tài khoản nếu có + Cơ hội tại cộng đồng tham gia + Sự kiện sắp tới) */}
          {activeTab === "all" && (
            <View style={styles.listContainer}>
              {/* 1. CUỘC GẶP CỦA TÀI KHOẢN */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      CUỘC GẶP CỦA TÀI KHOẢN
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {todayMeetings.length} cuộc hẹn
                    </Text>
                  </View>
                </View>

                {todayMeetings.length > 0 ? (
                  todayMeetings.map((meet) => (
                    <View
                      key={meet.id}
                      style={[
                        styles.eventCard,
                        { borderColor: "#8C653B", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                          <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                            [Cuộc gặp 1-1]
                          </Text>
                        </View>
                        <Text style={[styles.cardDate, { color: "#050C15", fontWeight: "600" }]}>
                          {meet.time} · {meet.date || "Hôm nay"}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: "#050C15" }]}>{meet.title}</Text>
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: "#050C15" }}>
                          Đối tác: <Text style={{ fontWeight: "700" }}>{meet.counterpart}</Text>
                        </Text>
                        <Text style={{ fontSize: 12, color: "#050C15", marginTop: 2 }}>
                          Địa điểm: <Text style={{ fontWeight: "700" }}>{meet.location}</Text>
                        </Text>
                      </View>
                      <View style={styles.todayMeetActionRow}>
                        {meet.format === "online" ? (
                          <TouchableOpacity
                            style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
                            onPress={() => Linking.openURL("https://meet.google.com/new")}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                              Vào phòng họp Meet
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
                            onPress={() => Linking.openURL("tel:0901234567")}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                              Gọi đối tác
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={[styles.quietBox, { borderColor: "#8C653B", borderWidth: 1, backgroundColor: "#FAF6F0" }]}>
                    <Text style={[styles.quietTitle, { color: "#050C15" }]}>
                      Tài khoản hiện chưa có cuộc gặp nào
                    </Text>
                  </View>
                )}
              </View>

              {/* 2. CƠ HỘI ĐANG CÓ TẠI CỘNG ĐỒNG THAM GIA */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      CƠ HỘI ĐANG CÓ TẠI CỘNG ĐỒNG THAM GIA
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {todayOpportunities.length} cơ hội
                    </Text>
                  </View>
                </View>

                {todayOpportunities.map((opp) => (
                  <View
                    key={opp.id}
                    style={[
                      styles.eventCard,
                      { borderColor: "#DFB76C", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                        <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                          {opp.communityName || "Cộng đồng ViOne"}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: "#8C653B", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>CƠ HỘI ĐANG CÓ</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, { color: "#050C15" }]}>{opp.title}</Text>
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: "#050C15" }}>
                        Đơn vị: <Text style={{ fontWeight: "700" }}>{opp.organization || "Doanh nghiệp thành viên"}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: "#050C15", marginTop: 2 }}>
                        Giá trị: <Text style={{ fontWeight: "800" }}>{opp.dealValue}</Text> · {opp.daysLeft}
                      </Text>
                    </View>
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: isDark ? "rgba(223, 183, 108, 0.2)" : "rgba(223, 183, 108, 0.4)", paddingTop: 8, flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { flex: 1, backgroundColor: "#DFB76C" }]}
                        onPress={() => {
                          setSelectedOpportunityForAi({
                            id: opp.id,
                            title: opp.title,
                            organization: opp.organization,
                            dealValue: opp.dealValue,
                          });
                          setAiAssistantVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Mic size={13} color="#050C15" style={{ marginRight: 4 }} />
                        <Text style={[styles.meetPrimaryActionText, { color: "#050C15", fontWeight: "700" }]}>
                          Nhờ AI Gửi Voice
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", paddingHorizontal: 14 }]}
                        onPress={() => {
                          navigation.navigate("Community" as any, {
                            communityId: "c-b2b-leaders",
                            tab: "opportunities",
                            opportunityId: opp.id,
                          });
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.meetPrimaryActionText, { color: isDark ? "#E2E8F0" : "#1E293B", fontWeight: "700" }]}>
                          Chi tiết
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* 3. SỰ KIỆN SẮP TỚI */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      SỰ KIỆN SẮP TỚI
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {upcomingEvents.length} sự kiện
                    </Text>
                  </View>
                </View>

                {upcomingEvents.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.eventCard,
                      { borderColor: "#8C653B", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                        <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                          {ev.community}
                        </Text>
                      </View>
                      <Text style={[styles.cardDate, { color: "#050C15", fontWeight: "600" }]}>
                        {ev.time} · {ev.date}
                      </Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: "#050C15" }]}>{ev.title}</Text>
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: "#050C15" }}>
                        Địa điểm: <Text style={{ fontWeight: "700" }}>{ev.location}</Text>
                      </Text>
                    </View>
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(140, 101, 59, 0.2)", paddingTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
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
                        <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                          Xem chi tiết sự kiện
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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
                    {ev.imageUrl ? (
                      <Image
                        source={{ uri: ev.imageUrl }}
                        style={styles.eventCardImage}
                        resizeMode="cover"
                      />
                    ) : null}
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
          {/* Quick Action 1: Lên lịch */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={() => {
              setSelectedPartnerForMeeting(null);
              setScheduleMeetingVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconWrap}>
              <CalendarDays size={16} color="#D8B282" />
            </View>
            <Text style={[styles.quickActionLabel, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              Lên lịch
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
                Giờ giấc nhân sự
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
              onPress={() => setAiAssistantVisible(true)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.opsBannerBtnGrad,
                  {
                    backgroundColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(216, 178, 130, 0.35)" : "rgba(216, 178, 130, 0.5)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.opsBannerBtnText,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  Thư ký AI xếp lịch
                </Text>
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
      <StaffDailyActivityModal visible={staffDailyModalVisible} onClose={() => setStaffDailyModalVisible(false)} />
      <AssignTaskModal
        visible={assignTaskModalVisible}
        onClose={() => setAssignTaskModalVisible(false)}
        communityId="c-vione-internal"
      />
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
      <BusinessNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
      <ViOneVoiceAssistantModal
        visible={aiAssistantVisible}
        initialOpportunity={selectedOpportunityForAi}
        onClose={() => {
          setAiAssistantVisible(false);
          setSelectedOpportunityForAi(null);
        }}
      />
      <OpportunityDetailModal
        visible={opportunityDetailModalVisible}
        opportunity={selectedOpportunity}
        onClose={() => setOpportunityDetailModalVisible(false)}
        onGoToCommunity={() => {
          setOpportunityDetailModalVisible(false);
          navigation?.navigate("Community");
        }}
      />

      {/* Floating AI Assistant Copilot Button (Draggable & Closable) */}
      {showFloatingAi && (
        <Animated.View
          style={[
            styles.floatingAiBtn,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "rgba(216, 178, 130, 0.6)",
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAiAssistantVisible(true)}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={20} color={isDark ? "#D8B282" : "#A3703C"} />
              <View style={styles.floatingAiPing} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingAiCloseBadge}
            onPress={() => setShowFloatingAi(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <X size={9} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modal Tuỳ chỉnh hiển thị thẻ Hôm Nay (Matching 100% PWA) */}
      <TodayCustomizeSheet
        visible={todayCustomizeVisible}
        onClose={() => setTodayCustomizeVisible(false)}
        prefs={todayPrefs}
        onChange={setTodayPrefs}
        onReset={() => setTodayPrefs(DEFAULT_TODAY_PREFERENCES)}
      />

      {/* Modal Lịch Hoạt Động & Cuộc Gặp (Matching 100% PWA /connect-app/calendar) */}
      <ScheduleCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onOpenScheduleMeeting={() => {
          setSelectedPartnerForMeeting(null);
          setScheduleMeetingVisible(true);
        }}
        onSelectEvent={(evt) => {
          setSelectedEventForDetail({
            id: evt.id,
            title: evt.title,
            name: evt.title,
            time: evt.time,
            date: evt.date,
            location: evt.location,
            venue: evt.location,
            description: evt.notes,
            status: evt.status,
            type: evt.kind,
            communityName: evt.company || "Cộng đồng Doanh nhân ViOne",
          });
          setEventDetailModalVisible(true);
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
  floatingAiBtn: {
    position: "absolute",
    bottom: 24,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  floatingAiPing: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  floatingAiCloseBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 9,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  eventCardImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  todaySubSection: {
    gap: 10,
    marginBottom: 10,
  },
  todaySubSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  todaySubSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  todaySubSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  todayCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayCountBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  partnerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  partnerInfoText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  todayMeetActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  meetPrimaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFB76C",
    paddingVertical: 8,
    borderRadius: 10,
  },
  meetPrimaryActionText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
  meetSecondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(223, 183, 108, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.35)",
  },
  meetSecondaryActionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DFB76C",
  },
  opportunityCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.25)",
  },
  oppCommunityTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: "rgba(223, 183, 108, 0.12)",
  },
  oppCommunityTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DFB76C",
  },
  oppNewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DFB76C",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oppNewBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#050C15",
    letterSpacing: 0.4,
  },
  oppOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  oppOrgText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  oppMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  oppDealBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  oppDealBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
  },
  oppCategoryText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  oppActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  oppDetailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFB76C",
    paddingVertical: 8,
    borderRadius: 10,
  },
  oppDetailBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
  oppCommunityLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(223, 183, 108, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.35)",
  },
  oppCommunityLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DFB76C",
  },
  ceoSuiteCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  ceoSuiteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ceoSuiteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ceoSuiteTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  ceoAiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  ceoAiBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#050C15",
  },
  ceoSuiteDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  ceoSuiteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ceoSuiteBtn: {
    width: "48.5%",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  ceoSuiteIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  ceoSuiteBtnTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  ceoSuiteBtnSub: {
    fontSize: 10.5,
    lineHeight: 13,
  },
});
