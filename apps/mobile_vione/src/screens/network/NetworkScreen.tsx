import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Check,
  X,
  Phone,
  Mail,
  Sparkles,
  Building2,
  MessageSquare,
  Users,
  Plus,
  ArrowRight,
  Shield,
  Bell,
  UserPlus,
  Briefcase,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  Sun,
  Moon,
  Calendar,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../../components/common/Avatar";
import { ConnectionPerson, DmThreadSummary } from "../../types";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { StickyBrandHeader } from "../../components/common/StickyBrandHeader";
import { ChatThreadModal } from "./ChatThreadModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { StoryViewerModal, StoryItemData } from "../../components/StoryViewerModal";
import { CreateStoryModal } from "../../components/CreateStoryModal";
import { CustomerDetailModal } from "../../components/CustomerDetailModal";
import { CreateCustomerModal, NewCustomerData } from "../../components/CreateCustomerModal";
import { ScheduleMeetingModal } from "../../components/ScheduleMeetingModal";
import { PostMomentModal } from "../../components/PostMomentModal";
import { MomentCommentModal } from "../../components/MomentCommentModal";
import { BusinessNotificationsModal } from "../../components/BusinessNotificationsModal";
import { ViOneVoiceAssistantModal } from "../../components/ai/ViOneVoiceAssistantModal";

// Dữ liệu khoảnh khắc 24h doanh nhân
const INITIAL_STORIES: StoryItemData[] = [
  {
    id: "story-1",
    authorName: "Vũ Minh Tuấn",
    authorTitle: "Chủ tịch HĐQT",
    authorCompany: "VTech Group",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    storyImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600",
    storyCaption: "Ký kết thỏa thuận hợp tác chuyển đổi số & bảo mật thông tin 2026.",
    tag: "Ký kết đối tác",
    timeAgo: "2h trước",
    viewsCount: 24,
  },
  {
    id: "story-2",
    authorName: "Hoàng Mai Anh",
    authorTitle: "Giám đốc Tài chính",
    authorCompany: "VNPay FinTech",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    storyImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600",
    storyCaption: "Hội thảo chuyên đề giải pháp thanh toán số doanh nghiệp B2B.",
    tag: "FinTech B2B",
    timeAgo: "4h trước",
    viewsCount: 38,
  },
  {
    id: "story-3",
    authorName: "Trần Đức Nam",
    authorTitle: "Tổng Giám đốc",
    authorCompany: "Logistics Nam Phát",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    storyImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
    storyCaption: "Khánh thành trung tâm phân phối kho bãi thông minh tại Hải Phòng.",
    tag: "Mở rộng kho",
    timeAgo: "6h trước",
    viewsCount: 52,
  },
  {
    id: "story-4",
    authorName: "Lê Thu Hương",
    authorTitle: "Nhà sáng lập",
    authorCompany: "EcoWear Global",
    authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    storyImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
    storyCaption: "Bộ sưu tập trang phục doanh nhân cao cấp từ vật liệu tái chế.",
    tag: "Thời trang B2B",
    timeAgo: "8h trước",
    viewsCount: 19,
  },
];

// Danh sách đối tác cần giữ kết nối & chăm sóc
const NURTURE_PARTNERS = [
  {
    id: "nur-1",
    name: "Ông Trần Đức Nam",
    title: "Tổng Giám đốc",
    role: "CEO · Logistics Nam Phát",
    tag: "CẦN GẶP LẠI",
    reason: "Đã 30 ngày chưa gặp gỡ trực tiếp sau lễ ký biên bản ghi nhớ hợp tác.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    company: "Logistics Nam Phát",
    phone: "0903 888 999",
  },
  {
    id: "nur-2",
    name: "Bà Hoàng Mai Anh",
    title: "Giám đốc Tài chính",
    role: "CFO · VNPay FinTech",
    tag: "CƠ HỘI MỚI",
    reason: "Có dự án tích hợp cổng thanh toán trực tuyến cần kết nối thẩm định.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    company: "VNPay FinTech",
    phone: "0912 345 678",
  },
  {
    id: "nur-3",
    name: "Ông Đặng Quang Vinh",
    title: "Giám đốc Điều hành",
    role: "CEO · BĐS Vinh An",
    tag: "GIỮ KẾT NỐI",
    reason: "Quan tâm đến giải pháp thẻ NFC nhận diện hội viên và quản lý khách VIP.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    company: "Tập đoàn BĐS Vinh An",
    phone: "0988 123 456",
  },
];

// Danh bạ đối tác doanh nghiệp thực tế
const INITIAL_PARTNERS: ConnectionPerson[] = [
  {
    id: "p-1",
    name: "Vũ Minh Tuấn",
    title: "Chủ tịch HĐQT",
    company: "Tập đoàn Công nghệ VTech",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    phone: "0988 888 999",
    email: "tuan.vm@vtechgroup.vn",
    industry: "Công nghệ & Phần mềm",
    status: "connected",
    matchScore: 99,
  },
  {
    id: "p-2",
    name: "Hoàng Mai Anh",
    title: "Giám đốc Tài chính",
    company: "VNPay FinTech Solution",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    phone: "0912 345 678",
    email: "maianh.h@vnpay.vn",
    industry: "Tài chính & FinTech",
    status: "connected",
    matchScore: 96,
  },
  {
    id: "p-3",
    name: "Trần Đức Nam",
    title: "Tổng Giám đốc",
    company: "Logistics Nam Phát Toàn Cầu",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    phone: "0903 888 999",
    email: "nam.td@namphatlogistics.com",
    industry: "Vận tải & Logistics",
    status: "connected",
    matchScore: 94,
  },
  {
    id: "p-4",
    name: "Lê Thu Hương",
    title: "Nhà sáng lập & CEO",
    company: "EcoWear Global Fashion",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    phone: "0988 765 432",
    email: "huong.le@ecowear.vn",
    industry: "Bán lẻ & Thời trang",
    status: "pending",
    matchScore: 91,
  },
  {
    id: "p-5",
    name: "Phạm Quốc Huy",
    title: "Viện trưởng",
    company: "Viện Đổi mới Sáng tạo B2B",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    phone: "0934 567 890",
    email: "huy.pq@innovateb2b.edu.vn",
    industry: "Khoa học & Đào tạo",
    status: "suggested",
    matchScore: 98,
  },
  {
    id: "p-6",
    name: "Đặng Quang Vinh",
    title: "Giám đốc Điều hành",
    company: "Tập đoàn BĐS Vinh An",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    phone: "0912 345 678",
    email: "vinh.dq@vinhanland.vn",
    industry: "Bất động sản & Xây dựng",
    status: "suggested",
    matchScore: 95,
  },
];

// Khách hàng B2B pipeline
const B2B_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Tập đoàn Công nghệ VTech",
    contactPerson: "Ông Vũ Minh Tuấn",
    role: "Chủ tịch",
    stage: "Đang triển khai hợp đồng",
    dealValue: "1.200.000.000 đ",
    priority: "Ưu tiên cao",
    lastContact: "Hôm nay",
  },
  {
    id: "cust-2",
    name: "VNPay FinTech Solution",
    contactPerson: "Bà Hoàng Mai Anh",
    role: "CFO",
    stage: "Thương thảo điều khoản",
    dealValue: "650.000.000 đ",
    priority: "Chiến lược",
    lastContact: "Hôm qua",
  },
  {
    id: "cust-3",
    name: "Logistics Nam Phát Toàn Cầu",
    contactPerson: "Ông Trần Đức Nam",
    role: "CEO",
    stage: "Đề xuất giải pháp",
    dealValue: "450.000.000 đ",
    priority: "Tiềm năng",
    lastContact: "3 ngày trước",
  },
];

// Danh sách hội thoại tin nhắn
const INITIAL_THREADS: DmThreadSummary[] = [
  {
    threadId: "th-1",
    counterpartUserId: "p-1",
    displayName: "Vũ Minh Tuấn",
    companyName: "Tập đoàn Công nghệ VTech",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    lastMessagePreview: "Chào anh, thỏa thuận bảo mật WebRTC đã ký điện tử xong nhé.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    lastMessageFromMe: false,
    unreadCount: 1,
    isOnline: true,
  },
  {
    threadId: "th-2",
    counterpartUserId: "p-2",
    displayName: "Hoàng Mai Anh",
    companyName: "VNPay FinTech Solution",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    lastMessagePreview: "Chiều nay 15:00 gặp nhau tại phòng VIP 3 ViOne nhé anh.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    lastMessageFromMe: false,
    unreadCount: 0,
    isOnline: true,
  },
  {
    threadId: "th-3",
    counterpartUserId: "group-1",
    displayName: "Ban Điều Hành Hiệp Hội CEO",
    companyName: "Liên minh Doanh nghiệp Toàn cầu",
    avatarUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
    lastMessagePreview: "Đã cập nhật chương trình Hội nghị Xúc tiến Đầu tư Quý 4.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    lastMessageFromMe: true,
    unreadCount: 0,
    isGroup: true,
  },
];


type NetworkTab = "network" | "customers" | "suggestions" | "messages" | "requests";
type MessageCategory = "all" | "unread" | "groups" | "requests";

export const NetworkScreen: React.FC = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NetworkTab>("network");

  // Partners state
  const [partners, setPartners] = useState<ConnectionPerson[]>(INITIAL_PARTNERS);
  const [filterPartnerKind, setFilterPartnerKind] = useState<"all" | "connected" | "pending" | "suggested">("all");
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");

  // Messaging state
  const [threads, setThreads] = useState<DmThreadSummary[]>(INITIAL_THREADS);
  const [activeMessageCategory, setActiveMessageCategory] = useState<MessageCategory>("all");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  // Modals
  const [selectedThread, setSelectedThread] = useState<DmThreadSummary | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);

  // Stories & Nurture state (Khớp 100% NetworkStoriesStrip & Nurture List)
  const [stories, setStories] = useState<StoryItemData[]>(INITIAL_STORIES);
  const [selectedStory, setSelectedStory] = useState<StoryItemData | null>(null);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [createStoryVisible, setCreateStoryVisible] = useState(false);
  const [nurtureList, setNurtureList] = useState(NURTURE_PARTNERS);

  // Parity Modals (Customer Detail, Meeting Scheduler, Moments & Comments)
  const [customersList, setCustomersList] = useState(B2B_CUSTOMERS);
  const [customerStageFilter, setCustomerStageFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [createCustomerVisible, setCreateCustomerVisible] = useState(false);
  const [selectedPartnerForMeeting, setSelectedPartnerForMeeting] = useState<{ name: string; company: string } | null>(null);
  const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
  const [postMomentVisible, setPostMomentVisible] = useState(false);
  const [selectedMomentForComment, setSelectedMomentForComment] = useState<any | null>(null);
  const [momentCommentVisible, setMomentCommentVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  // Tải danh sách cuộc trò chuyện từ API
  useEffect(() => {
    let isMounted = true;
    const fetchThreads = async () => {
      try {
        setIsLoadingThreads(true);
        const res = await apiRequest<{ ok?: boolean; threads?: DmThreadSummary[] }>("connect-app/dm/threads");
        if (!isMounted) return;

        if (res.data?.threads && Array.isArray(res.data.threads) && res.data.threads.length > 0) {
          setThreads(res.data.threads);
        }
      } catch (err) {
        console.warn("Lỗi tải threads từ API:", err);
      } finally {
        if (isMounted) setIsLoadingThreads(false);
      }
    };

    fetchThreads();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc đối tác
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (filterPartnerKind !== "all" && p.status !== filterPartnerKind) return false;

      const q = partnerSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.industry?.toLowerCase().includes(q)
      );
    });
  }, [partners, filterPartnerKind, partnerSearchQuery]);

  // Phân loại danh mục Hộp thư
  const allThreads = useMemo(() => {
    return threads.filter((t) => {
      if (t.isGroup) return true;
      if (t.lastMessageFromMe) return true;
      if (Boolean(t.lastMessagePreview)) return true;
      if (t.isConnected !== false) return true;
      return false;
    });
  }, [threads]);

  const unreadThreads = useMemo(() => {
    return allThreads.filter((t) => (t.unreadCount || 0) > 0);
  }, [allThreads]);

  const groupThreads = useMemo(() => {
    return threads.filter((t) => t.isGroup);
  }, [threads]);

  const pendingThreads = useMemo(() => {
    return threads.filter(
      (t) => t.isConnected === false && !t.lastMessageFromMe && Boolean(t.lastMessagePreview)
    );
  }, [threads]);

  const totalUnreadCount = useMemo(() => {
    return unreadThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  }, [unreadThreads]);

  // Lọc danh sách hội thoại theo category & search
  const filteredThreads = useMemo(() => {
    let baseList = allThreads;
    if (activeMessageCategory === "unread") baseList = unreadThreads;
    if (activeMessageCategory === "groups") baseList = groupThreads;
    if (activeMessageCategory === "requests") baseList = pendingThreads;

    const q = messageSearchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter((t) => {
      const name = (t.displayName || "").toLowerCase();
      const company = (t.companyName || "").toLowerCase();
      const msg = (t.lastMessagePreview || "").toLowerCase();
      return name.includes(q) || company.includes(q) || msg.includes(q);
    });
  }, [activeMessageCategory, allThreads, unreadThreads, groupThreads, pendingThreads, messageSearchQuery]);

  const handleOpenChatWithPartner = (partner: ConnectionPerson) => {
    const existing = threads.find((t) => t.counterpartUserId === partner.id);
    if (existing) {
      setSelectedThread(existing);
    } else {
      const newThread: DmThreadSummary = {
        threadId: "th-" + partner.id,
        counterpartUserId: partner.id,
        displayName: partner.name,
        companyName: partner.company,
        avatarUrl: partner.avatarUrl,
        lastMessagePreview: "Bắt đầu cuộc trò chuyện kinh doanh mới",
        lastMessageAt: new Date().toISOString(),
        lastMessageFromMe: true,
        unreadCount: 0,
        isConnected: partner.status === "connected",
        isOnline: true,
      };
      setThreads((prev) => [newThread, ...prev]);
      setSelectedThread(newThread);
    }
    setChatModalVisible(true);
  };

  const handleMessageSent = (threadId: string, lastMessage: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.threadId === threadId
          ? {
              ...t,
              lastMessagePreview: lastMessage,
              lastMessageAt: new Date().toISOString(),
              lastMessageFromMe: true,
              unreadCount: 0,
            }
          : t
      )
    );
  };

  const handleGroupCreated = (newGroup: DmThreadSummary) => {
    setThreads((prev) => [newGroup, ...prev]);
    setSelectedThread(newGroup);
    setChatModalVisible(true);
  };

  const formatThreadTime = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {/* 1. Sticky Header Thương Hiệu Khớp 100% PWA */}
      <StickyBrandHeader
        rightActions={
          <>
            <TouchableOpacity
              style={[
                styles.headerSquareBtn,
                {
                  backgroundColor: isDark ? "rgba(22, 32, 50, 0.65)" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => setActiveTab("messages")}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={isDark ? "#D8B282" : "#64748B"} strokeWidth={1.8} />
              {totalUnreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{totalUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

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
            </TouchableOpacity>
          </>
        }
      />

      <View
        style={[
          styles.headerDivider,
          { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#E2E8F0" },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 2. Page Title Header: Network + Add Person Button + Subtitle */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              Mạng lưới
            </Text>
            <TouchableOpacity
              style={styles.addPersonBtn}
              onPress={() => setActiveTab("requests")}
              activeOpacity={0.8}
            >
              <UserPlus size={18} color="#D8B282" />
            </TouchableOpacity>
          </View>
          <Text style={styles.pageSubtitle}>
            <Text style={styles.boldText}>{partners.length} kết nối</Text>
            <Text> • </Text>
            <Text style={styles.goldText}>3 cần chăm sóc</Text>
          </Text>
        </View>

        {/* 3. Horizontal Category Tabs (Khớp 100% web PWA) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryTabPill,
              {
                backgroundColor: activeTab === "network" ? "#D8B282" : isDark ? "#12151F" : "#F1F5F9",
                borderColor: activeTab === "network" ? "#D8B282" : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => setActiveTab("network")}
          >
            <Text
              style={[
                styles.categoryTabPillText,
                {
                  color: activeTab === "network" ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                  fontWeight: activeTab === "network" ? "800" : "600",
                },
              ]}
            >
              Mạng lưới
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTabPill,
              {
                backgroundColor: activeTab === "customers" ? "#D8B282" : isDark ? "#12151F" : "#F1F5F9",
                borderColor: activeTab === "customers" ? "#D8B282" : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => setActiveTab("customers")}
          >
            <Text
              style={[
                styles.categoryTabPillText,
                {
                  color: activeTab === "customers" ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                  fontWeight: activeTab === "customers" ? "800" : "600",
                },
              ]}
            >
              Khách hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTabPill,
              {
                backgroundColor: activeTab === "suggestions" ? "#D8B282" : isDark ? "#12151F" : "#F1F5F9",
                borderColor: activeTab === "suggestions" ? "#D8B282" : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => setActiveTab("suggestions")}
          >
            <Sparkles size={13} color={activeTab === "suggestions" ? "#050C15" : "#D8B282"} style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.categoryTabPillText,
                {
                  color: activeTab === "suggestions" ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                  fontWeight: activeTab === "suggestions" ? "800" : "600",
                },
              ]}
            >
              Gợi ý (AI)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTabPill,
              {
                backgroundColor: activeTab === "messages" ? "#D8B282" : isDark ? "#12151F" : "#F1F5F9",
                borderColor: activeTab === "messages" ? "#D8B282" : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => setActiveTab("messages")}
          >
            <Text
              style={[
                styles.categoryTabPillText,
                {
                  color: activeTab === "messages" ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                  fontWeight: activeTab === "messages" ? "800" : "600",
                },
              ]}
            >
              Tin nhắn {totalUnreadCount > 0 ? `(${totalUnreadCount})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTabPill,
              {
                backgroundColor: activeTab === "requests" ? "#D8B282" : isDark ? "#12151F" : "#F1F5F9",
                borderColor: activeTab === "requests" ? "#D8B282" : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.categoryTabPillText,
                {
                  color: activeTab === "requests" ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                  fontWeight: activeTab === "requests" ? "800" : "600",
                },
              ]}
            >
              Lời mời (1)
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ─── TAB 1: MẠNG LƯỚI (NETWORK) ─── */}
        {activeTab === "network" && (
          <View style={styles.tabContent}>
            {/* Search Bar with Filter */}
            <View
              style={[
                styles.searchWrapper,
                {
                  backgroundColor: isDark ? "#12151F" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
            >
              <Search size={18} color={isDark ? "#D8B282" : "#A3703C"} style={styles.searchIcon} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
                placeholder="Tìm kiếm đối tác, công ty, ngành nghề..."
                placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
                value={partnerSearchQuery}
                onChangeText={setPartnerSearchQuery}
              />
              {partnerSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setPartnerSearchQuery("")}>
                  <X size={16} color={isDark ? "#94A3B8" : "#64748B"} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Filter Pills */}
            <View style={styles.quickFilterRow}>
              {[
                { id: "all", label: "Tất cả" },
                { id: "connected", label: "Đã kết nối" },
                { id: "pending", label: "Đang chờ" },
                { id: "suggested", label: "Gợi ý" },
              ].map((f) => {
                const isActive = filterPartnerKind === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isActive
                          ? isDark ? "rgba(216, 178, 130, 0.18)" : "#F6E1C3"
                          : isDark ? "#181D2A" : "#F8FAFC",
                        borderColor: isActive
                          ? "#D8B282"
                          : isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => setFilterPartnerKind(f.id as any)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive
                            ? isDark ? "#D8B282" : "#8C653B"
                            : isDark ? "#94A3B8" : "#64748B",
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Khoảnh khắc 24h Doanh nhân (Facebook/Instagram-grade Stories Strip) */}
            <View style={styles.storiesSection}>
              <View style={styles.storiesHeaderRow}>
                <Text style={styles.sectionHeaderSmall}>KHOẢNH KHẮC DOANH NHÂN 24H</Text>
                <TouchableOpacity
                  onPress={() => setPostMomentVisible(true)}
                  style={styles.addMomentBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={13} color="#D8B282" style={{ marginRight: 3 }} />
                  <Text style={styles.addMomentText}>Đăng khoảnh khắc</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScroll}
              >
                {/* 1. Nút Thêm Khoảnh Khắc / Đăng Story */}
                <TouchableOpacity
                  style={styles.myStoryCard}
                  onPress={() => setCreateStoryVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.myStoryAvatarWrap}>
                    <Avatar url={user?.avatarUrl} name={user?.displayName || "Doanh nhân"} size={44} showGoldBorder />
                    <View style={styles.myStoryAddBadge}>
                      <Plus size={13} color="#050C15" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={styles.myStoryLabel}>Đăng story</Text>
                  <Text style={styles.myStorySub}>Khoảnh khắc 24h</Text>
                </TouchableOpacity>

                {/* 2. Danh sách Story các Doanh Nhân */}
                {stories.map((story) => (
                  <TouchableOpacity
                    key={story.id}
                    style={styles.storyCard}
                    onPress={() => {
                      setSelectedStory(story);
                      setStoryViewerVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: story.storyImage }} style={styles.storyCardBg} resizeMode="cover" />
                    <LinearGradient
                      colors={["rgba(10, 10, 11, 0.4)", "transparent", "rgba(10, 10, 11, 0.9)"]}
                      style={styles.storyCardGradient}
                    />

                    {/* Top Author Avatar & Tag */}
                    <View style={styles.storyCardTop}>
                      <Avatar url={story.authorAvatar} name={story.authorName} size={28} showGoldBorder />
                      {story.tag && (
                        <View style={styles.storyCardTag}>
                          <Text style={styles.storyCardTagText} numberOfLines={1}>{story.tag}</Text>
                        </View>
                      )}
                    </View>

                    {/* Bottom Author Name & Time */}
                    <View style={styles.storyCardBottom}>
                      <Text style={styles.storyAuthorName} numberOfLines={1}>
                        {story.authorName}
                      </Text>
                      <Text style={styles.storyTimeAgo}>{story.timeAgo}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Khối CẦN GIỮ KẾT NỐI & CHĂM SÓC (Khớp 100% Nurture List) */}
            <View
              style={[
                styles.nurtureSection,
                {
                  backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "rgba(216, 178, 130, 0.4)",
                  shadowColor: isDark ? "#000000" : "#64748B",
                  shadowOpacity: isDark ? 0.4 : 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 8,
                  elevation: 2,
                },
              ]}
            >
              <View style={styles.nurtureHeaderRow}>
                <View style={styles.nurtureHeaderLeft}>
                  <Sparkles size={15} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.nurtureTitle}>CẦN GIỮ KẾT NỐI & CHĂM SÓC</Text>
                </View>
                <View style={styles.nurtureCountBadge}>
                  <Text style={styles.nurtureCountText}>{nurtureList.length} CẦN CHĂM SÓC</Text>
                </View>
              </View>

              <View style={styles.nurtureListCol}>
                {nurtureList.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.nurtureCard,
                      {
                        backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.nurtureCardMain}>
                      <View style={styles.nurtureInfo}>
                        <View style={styles.nurtureNameRow}>
                          <Text
                            style={[
                              styles.nurtureName,
                              { color: isDark ? "#FFFFFF" : "#0F172A" },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.nurtureTagBadge}>
                            <Text style={styles.nurtureTagText}>{item.tag}</Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.nurtureRole,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          {item.role || `${item.title} · ${item.company}`}
                        </Text>
                        <Text
                          style={[
                            styles.nurtureReasonText,
                            { color: isDark ? "#F6E1C3" : "#8C653B" },
                          ]}
                        >
                          💡 {item.reason}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.nurtureActionRow}>
                      <TouchableOpacity
                        style={styles.nurtureMeetBtn}
                        onPress={() => {
                          setSelectedPartnerForMeeting({
                            name: item.name,
                            company: item.company,
                          });
                          setScheduleMeetingVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Users size={13} color="#050C15" style={{ marginRight: 4 }} />
                        <Text style={styles.nurtureMeetText}>Hẹn 1-1</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.nurtureChatBtn}
                        onPress={() => {
                          const partner = partners.find((p) => p.name === item.name) || {
                            id: item.id,
                            name: item.name,
                            title: item.title,
                            company: item.company,
                            status: "connected" as const,
                          };
                          handleOpenChatWithPartner(partner);
                        }}
                        activeOpacity={0.8}
                      >
                        <MessageSquare size={13} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.nurtureChatText}>Nhắn tin</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.nurtureCallBtn}
                        onPress={() => Alert.alert("Gọi điện", `Gọi tới số: ${item.phone}`)}
                        activeOpacity={0.8}
                      >
                        <Phone size={13} color="#D8B282" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ViOne AI Copilot Matcher Banner (Khớp 100% PWA) */}
            <View
              style={[
                styles.aiBanner,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.12)" : "#FFFDF8",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "rgba(216, 178, 130, 0.45)",
                },
              ]}
            >
              <View style={styles.aiBannerIconWrap}>
                <Sparkles size={20} color={isDark ? "#D8B282" : "#A3703C"} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.aiBannerTitle,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  ViOne AI Matchmaking 5.0
                </Text>
                <Text
                  style={[
                    styles.aiBannerSubtitle,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Trợ lý AI tự động phân tích ngành nghề & đề xuất đối tác B2B tương thích cao.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.aiExploreBtn,
                  { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3" },
                ]}
                onPress={() => setAiAssistantVisible(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.aiExploreText,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  Khám phá AI
                </Text>
                <ChevronRight size={13} color={isDark ? "#D8B282" : "#8C653B"} />
              </TouchableOpacity>
            </View>

            {/* Partners List */}
            <View style={styles.listSection}>
              <Text style={styles.sectionHeaderSmall}>DANH BẠ ĐỐI TÁC DOANH NGHIỆP</Text>
              {filteredPartners.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.partnerCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <View style={styles.cardMain}>
                    <Avatar url={item.avatarUrl} name={item.name} size={50} showGoldBorder />
                    <View style={styles.partnerInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.partnerName,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                          ]}
                        >
                          {item.name}
                        </Text>
                        {item.matchScore && (
                          <View style={styles.matchBadge}>
                            <Text style={styles.matchText}>{item.matchScore}% Phù hợp</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.partnerTitle}>{item.title}</Text>

                      <View style={styles.companyRow}>
                        <Building2 size={12} color={isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 4 }} />
                        <Text
                          style={[
                            styles.partnerCompany,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.company}
                        </Text>
                      </View>

                      {item.industry && (
                        <View
                          style={[
                            styles.industryTag,
                            { backgroundColor: isDark ? "#181D2A" : "#F1F5F9" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.industryText,
                              { color: isDark ? "rgba(255, 255, 255, 0.7)" : "#475569" },
                            ]}
                          >
                            {item.industry}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.chatActionBtn}
                      onPress={() => handleOpenChatWithPartner(item)}
                    >
                      <MessageSquare size={14} color="#050C15" style={{ marginRight: 5 }} />
                      <Text style={styles.chatActionText}>Nhắn tin</Text>
                    </TouchableOpacity>

                    {item.status === "connected" && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.iconActionBtn,
                            {
                              backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                            },
                          ]}
                          onPress={() => Alert.alert("Gọi điện", `Gọi tới số: ${item.phone}`)}
                        >
                          <Phone size={15} color={isDark ? "#D8B282" : "#A3703C"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.iconActionBtn,
                            {
                              backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                            },
                          ]}
                          onPress={() => Alert.alert("Gửi email", `Gửi tới: ${item.email}`)}
                        >
                          <Mail size={15} color={isDark ? "#D8B282" : "#A3703C"} />
                        </TouchableOpacity>
                      </>
                    )}

                    {item.status === "pending" && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Đang chờ duyệt</Text>
                      </View>
                    )}

                    {item.status === "suggested" && (
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => {
                          setPartners((prev) =>
                            prev.map((p) => (p.id === item.id ? { ...p, status: "pending" } : p))
                          );
                          Alert.alert("Thành công", `Đã gửi lời mời kết nối tới ${item.name}.`);
                        }}
                      >
                        <Text style={styles.connectBtnText}>Kết nối ngay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── TAB 2: KHÁCH HÀNG (CUSTOMERS PANEL) ─── */}
        {activeTab === "customers" && (
          <View style={styles.tabContent}>
            {/* Summary Pipeline Metric Grid (4 Executive Metrics) */}
            <View style={{ gap: 8, marginBottom: 12 }}>
              <View style={styles.pipelineSummaryRow}>
                <View
                  style={[
                    styles.pipelineCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <DollarSign size={18} color={isDark ? "#D8B282" : "#A3703C"} />
                  <Text style={[styles.pipelineNumber, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    4.55 Tỷ
                  </Text>
                  <Text style={[styles.pipelineLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Quy mô cơ hội
                  </Text>
                </View>

                <View
                  style={[
                    styles.pipelineCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <TrendingUp size={18} color="#38BDF8" />
                  <Text style={[styles.pipelineNumber, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    3 B2B
                  </Text>
                  <Text style={[styles.pipelineLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Đang đàm phán
                  </Text>
                </View>
              </View>

              <View style={styles.pipelineSummaryRow}>
                <View
                  style={[
                    styles.pipelineCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <Sparkles size={18} color="#10B981" />
                  <Text style={[styles.pipelineNumber, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    78% Won
                  </Text>
                  <Text style={[styles.pipelineLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Tỷ lệ chốt deal
                  </Text>
                </View>

                <View
                  style={[
                    styles.pipelineCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <Calendar size={18} color="#F59E0B" />
                  <Text style={[styles.pipelineNumber, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    2 Cuộc hẹn
                  </Text>
                  <Text style={[styles.pipelineLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Lịch chăm sóc tuần
                  </Text>
                </View>
              </View>
            </View>

            {/* Filter Stage Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {[
                { key: "all", label: `Tất cả (${customersList.length})` },
                { key: "Đàm phán", label: "Đàm phán (2)" },
                { key: "Đề xuất", label: "Đề xuất (1)" },
                { key: "Ký kết", label: "Ký kết (0)" },
              ].map((f) => {
                const isActive = customerStageFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setCustomerStageFilter(f.key)}
                    style={[
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginRight: 6,
                        borderWidth: 1,
                        backgroundColor: isActive
                          ? isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3"
                          : isDark ? "#12151F" : "#F1F5F9",
                        borderColor: isActive
                          ? "#D8B282"
                          : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive
                          ? isDark ? "#F6E1C3" : "#8C653B"
                          : isDark ? "#94A3B8" : "#64748B",
                      }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Customer List Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={[styles.sectionHeaderSmall, { marginTop: 0, marginBottom: 0 }]}>
                DANH SÁCH KHÁCH HÀNG ({customersList.length})
              </Text>
              <TouchableOpacity
                style={{ borderRadius: 12, overflow: "hidden" }}
                onPress={() => setCreateCustomerVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 5 }}
                >
                  <Plus size={13} color="#050C15" strokeWidth={2.5} />
                  <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#050C15" }}>Thêm khách hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {customersList
              .filter((cust) => {
                if (customerStageFilter === "all") return true;
                return cust.stage.toLowerCase().includes(customerStageFilter.toLowerCase());
              })
              .map((cust) => (
              <TouchableOpacity
                key={cust.id}
                style={[
                  styles.customerCard,
                  {
                    backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                    shadowColor: isDark ? "#000000" : "#64748B",
                    shadowOpacity: isDark ? 0.3 : 0.04,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    elevation: 2,
                  },
                ]}
                onPress={() => {
                  setSelectedCustomer({
                    id: cust.id,
                    name: cust.name,
                    contactPerson: cust.contactPerson,
                    dealValue: cust.dealValue,
                    stage: cust.stage,
                    priority: cust.priority,
                    phone: (cust as any).phone || "0912 345 678",
                    email: (cust as any).email || "b2b@v-pharma.vn",
                    tags: (cust as any).tags || ["VIP", "Doanh nghiệp lớn", "Hợp đồng Q4"],
                    lastInteraction: (cust as any).lastInteraction || "2 ngày trước",
                  });
                  setCustomerDetailVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.customerTop}>
                  <Text
                    style={[
                      styles.customerName,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    {cust.name}
                  </Text>
                  <View
                    style={[
                      styles.priorityPill,
                      { backgroundColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#F6E1C3" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: isDark ? "#D8B282" : "#8C653B" },
                      ]}
                    >
                      {cust.priority}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.customerContact,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Người liên hệ: {cust.contactPerson}
                </Text>

                <View
                  style={[
                    styles.customerFooter,
                    { borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0" },
                  ]}
                >
                  <View style={styles.dealPill}>
                    <Text style={styles.dealText}>{cust.dealValue}</Text>
                  </View>
                  <Text
                    style={[
                      styles.customerStage,
                      { color: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    {cust.stage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── TAB 3: GỢI Ý (AI SUGGESTIONS) ─── */}
        {activeTab === "suggestions" && (
          <View style={styles.tabContent}>
            <View
              style={[
                styles.aiBanner,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.12)" : "#FFFDF8",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "rgba(216, 178, 130, 0.45)",
                },
              ]}
            >
              <Sparkles size={20} color={isDark ? "#D8B282" : "#A3703C"} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.aiBannerTitle,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  AI Đề Xuất Đối Tác Phù Hợp
                </Text>
                <Text
                  style={[
                    styles.aiBannerSubtitle,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Dựa trên hồ sơ năng lực doanh nghiệp, ngành nghề và cơ hội cung ứng chéo.
                </Text>
              </View>
            </View>

            {partners
              .filter((p) => p.status === "suggested")
              .map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.partnerCard,
                    {
                      backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      shadowColor: isDark ? "#000000" : "#64748B",
                      shadowOpacity: isDark ? 0.3 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <View style={styles.cardMain}>
                    <Avatar url={item.avatarUrl} name={item.name} size={50} showGoldBorder />
                    <View style={styles.partnerInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.partnerName,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchText}>{item.matchScore}% Phù hợp</Text>
                        </View>
                      </View>
                      <Text style={styles.partnerTitle}>{item.title}</Text>
                      <Text
                        style={[
                          styles.partnerCompany,
                          { color: isDark ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        {item.company}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.cardActions,
                      { borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0" },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.connectBtnFull}
                      onPress={() => {
                        setPartners((prev) =>
                          prev.map((p) => (p.id === item.id ? { ...p, status: "pending" } : p))
                        );
                        Alert.alert("Thành công", `Đã gửi lời mời hợp tác tới ${item.name}.`);
                      }}
                    >
                      <Sparkles size={14} color="#050C15" style={{ marginRight: 6 }} />
                      <Text style={styles.connectBtnFullText}>Gửi lời mời kết nối B2B</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* ─── TAB 4: HỘP THƯ TIN NHẮN (MESSAGES) ─── */}
        {activeTab === "messages" && (
          <View style={styles.tabContent}>
            {/* Search & Create Group Header Row */}
            <View style={styles.inboxActionRow}>
              <View
                style={[
                  styles.inboxSearchWrap,
                  {
                    backgroundColor: isDark ? "#12151F" : "#F1F5F9",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <Search size={16} color={isDark ? "#D8B282" : "#A3703C"} style={{ marginRight: 8 }} />
                <TextInput
                  style={[
                    styles.inboxSearchInput,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                  placeholder="Tìm người liên hệ, nhóm phòng ban..."
                  placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
                  value={messageSearchQuery}
                  onChangeText={setMessageSearchQuery}
                />
                {messageSearchQuery !== "" && (
                  <TouchableOpacity onPress={() => setMessageSearchQuery("")}>
                    <X size={15} color={isDark ? "#94A3B8" : "#64748B"} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.createGroupBtn}
                onPress={() => setCreateGroupVisible(true)}
              >
                <Users size={15} color="#050C15" style={{ marginRight: 5 }} />
                <Text style={styles.createGroupText}>Tạo nhóm</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Messenger-Style Category Tabs */}
            <View style={styles.categoryTabsRow}>
              {[
                { id: "all", label: `Tất cả (${allThreads.length})` },
                { id: "unread", label: `Chưa đọc ${unreadThreads.length > 0 ? `(${unreadThreads.length})` : ""}` },
                { id: "groups", label: `Nhóm (${groupThreads.length})` },
                { id: "requests", label: `Tin nhắn chờ ${pendingThreads.length > 0 ? `(${pendingThreads.length})` : ""}` },
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.categoryTab,
                    {
                      backgroundColor: activeMessageCategory === c.id
                        ? isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3"
                        : isDark ? "#181D2A" : "#F1F5F9",
                      borderColor: activeMessageCategory === c.id
                        ? "#D8B282"
                        : isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setActiveMessageCategory(c.id as any)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      {
                        color: activeMessageCategory === c.id
                          ? isDark ? "#D8B282" : "#8C653B"
                          : isDark ? "#94A3B8" : "#64748B",
                        fontWeight: activeMessageCategory === c.id ? "700" : "500",
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Thread List */}
            {isLoadingThreads ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#D8B282" />
                <Text style={styles.loadingText}>Đang đồng bộ hộp thư ViOne...</Text>
              </View>
            ) : filteredThreads.length === 0 ? (
              <View style={styles.emptyInboxBox}>
                <MessageSquare size={36} color={isDark ? "#94A3B8" : "#CBD5E1"} style={{ marginBottom: 10 }} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Chưa có cuộc trò chuyện nào
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  {activeMessageCategory === "unread"
                    ? "Bạn đã đọc hết mọi tin nhắn."
                    : activeMessageCategory === "groups"
                    ? "Chưa tham gia nhóm nào. Bấm 'Tạo nhóm' để kết nối nhóm làm việc."
                    : "Chọn một đối tác trong danh bạ để bắt đầu nhắn tin."}
                </Text>
              </View>
            ) : (
              filteredThreads.map((item) => {
                const hasUnread = (item.unreadCount || 0) > 0;
                return (
                  <TouchableOpacity
                    key={item.threadId}
                    style={[
                      styles.threadItem,
                      {
                        backgroundColor: isDark
                          ? (hasUnread ? "#161B29" : "#12151F")
                          : (hasUnread ? "#FDF8F0" : "#FFFFFF"),
                        borderColor: hasUnread
                          ? "rgba(216, 178, 130, 0.45)"
                          : isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                        shadowColor: isDark ? "#000000" : "#64748B",
                        shadowOpacity: isDark ? 0.3 : 0.03,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 5,
                        elevation: 1,
                      },
                    ]}
                    onPress={() => {
                      setSelectedThread(item);
                      setChatModalVisible(true);
                    }}
                  >
                    <View style={styles.threadAvatarWrap}>
                      <Avatar
                        url={item.avatarUrl}
                        name={item.displayName}
                        size={48}
                        showGoldBorder={hasUnread}
                      />
                      {item.isOnline && <View style={styles.onlineDot} />}
                    </View>

                    <View style={styles.threadBody}>
                      <View style={styles.threadHeaderRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <Text
                            style={[
                              styles.threadName,
                              { color: isDark ? "#FFFFFF" : "#0F172A" },
                              hasUnread && styles.threadNameBold,
                            ]}
                            numberOfLines={1}
                          >
                            {item.displayName}
                          </Text>
                          {item.isGroup && (
                            <View style={styles.threadGroupTag}>
                              <Users size={10} color="#D8B282" />
                              <Text style={styles.threadGroupTagText}>Nhóm</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.threadTime,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          {formatThreadTime(item.lastMessageAt)}
                        </Text>
                      </View>

                      <View style={styles.threadPreviewRow}>
                        <Text
                          style={[
                            styles.threadPreviewText,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                            hasUnread && { color: isDark ? "#FFFFFF" : "#0F172A", fontWeight: "600" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.lastMessageFromMe && (
                            <Text style={{ fontWeight: "700", color: "#D8B282" }}>
                              Bạn:{" "}
                            </Text>
                          )}
                          {item.lastMessagePreview || "Chưa có tin nhắn"}
                        </Text>

                        {hasUnread && (
                          <View style={styles.unreadCounter}>
                            <Text style={styles.unreadCounterText}>{item.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ─── TAB 5: LỜI MỜI (REQUESTS) ─── */}
        {activeTab === "requests" && (
          <View style={styles.tabContent}>
            <View
              style={[
                styles.requestCard,
                {
                  backgroundColor: isDark ? "#12151F" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  shadowColor: isDark ? "#000000" : "#64748B",
                  shadowOpacity: isDark ? 0.3 : 0.04,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View style={styles.cardMain}>
                <Avatar name="Lê Thị Thu Hằng" size={50} showGoldBorder />
                <View style={styles.partnerInfo}>
                  <Text
                    style={[
                      styles.partnerName,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Lê Thị Thu Hằng
                  </Text>
                  <Text style={styles.partnerTitle}>Giám Đốc Tài Chính (CFO)</Text>
                  <Text
                    style={[
                      styles.partnerCompany,
                      { color: isDark ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Quỹ Đầu Tư Khởi Nghiệp V-Capital
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.requestActionRow,
                  { borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0" },
                ]}
              >
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => Alert.alert("Thành công", "Đã chấp nhận lời mời kết nối.")}
                >
                  <Check size={14} color="#050C15" style={{ marginRight: 4 }} />
                  <Text style={styles.acceptBtnText}>Chấp nhận</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.declineBtn,
                    {
                      backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => Alert.alert("Thông báo", "Đã từ chối lời mời.")}
                >
                  <X size={14} color={isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 4 }} />
                  <Text
                    style={[
                      styles.declineBtnText,
                      { color: isDark ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Bỏ qua
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating AI Copilot Assistant Button */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => setAiAssistantVisible(true)}
        activeOpacity={0.85}
      >
        <Sparkles size={18} color="#050C15" />
        <Text style={styles.floatingAiText}>ViOne AI</Text>
      </TouchableOpacity>

      {/* Realtime Business Notifications Modal */}
      <BusinessNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

      {/* ViOne AI Voice & Copilot Assistant Modal */}
      <ViOneVoiceAssistantModal
        visible={aiAssistantVisible}
        onClose={() => setAiAssistantVisible(false)}
      />

      {/* Global Modals */}
      <ChatThreadModal
        visible={chatModalVisible}
        thread={selectedThread}
        onClose={() => setChatModalVisible(false)}
        onMessageSent={handleMessageSent}
      />

      <CreateGroupModal
        visible={createGroupVisible}
        partners={partners}
        onClose={() => setCreateGroupVisible(false)}
        onGroupCreated={handleGroupCreated}
      />

      <StoryViewerModal
        visible={storyViewerVisible}
        story={selectedStory}
        onClose={() => setStoryViewerVisible(false)}
      />

      <CreateStoryModal
        visible={createStoryVisible}
        onClose={() => setCreateStoryVisible(false)}
        onStoryCreated={(newStory) => setStories((prev) => [newStory, ...prev])}
      />

      {/* Parity Modals: Chi Tiết Khách Hàng CRM */}
      <CustomerDetailModal
        visible={customerDetailVisible}
        customer={selectedCustomer}
        onClose={() => setCustomerDetailVisible(false)}
        onUpdateCustomer={(updated) => {
          setCustomersList((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          );
          setSelectedCustomer(updated);
        }}
        onOpenChat={(cust) => {
          setCustomerDetailVisible(false);
          const partnerName = cust.contactPerson || cust.name;
          const partner = partners.find((p) => p.name === partnerName) || {
            id: `p-${cust.id}`,
            name: partnerName,
            company: cust.name,
            status: "connected" as const,
          };
          handleOpenChatWithPartner(partner);
        }}
        onScheduleMeeting={(cust) => {
          setCustomerDetailVisible(false);
          setSelectedPartnerForMeeting({
            name: cust.contactPerson || cust.name,
            company: cust.name,
          });
          setScheduleMeetingVisible(true);
        }}
      />

      {/* Parity Modals: Thêm Khách Hàng Tiềm Năng B2B CRM */}
      <CreateCustomerModal
        visible={createCustomerVisible}
        onClose={() => setCreateCustomerVisible(false)}
        onCustomerCreated={(newCust: NewCustomerData) => {
          setCustomersList((prev) => [
            {
              id: newCust.id,
              name: newCust.name,
              contactPerson: newCust.contactPerson,
              role: newCust.role || "Đại diện kinh doanh",
              stage: newCust.stage,
              dealValue: newCust.dealValue,
              priority: newCust.priority,
              lastContact: "Vừa xong",
              phone: newCust.phone,
              email: newCust.email,
              tags: newCust.tags,
              lastInteraction: newCust.lastInteraction,
            } as any,
            ...prev,
          ]);
        }}
      />

      {/* Parity Modals: Lên Lịch Cuộc Hẹn 1-1 */}
      <ScheduleMeetingModal
        visible={scheduleMeetingVisible}
        partnerName={selectedPartnerForMeeting?.name}
        partnerCompany={selectedPartnerForMeeting?.company}
        onClose={() => setScheduleMeetingVisible(false)}
      />

      {/* Parity Modals: Đăng Khoảnh Khắc Doanh Nhân B2B */}
      <PostMomentModal
        visible={postMomentVisible}
        onClose={() => setPostMomentVisible(false)}
        onPostSuccess={(newMoment) => {
          const storyFromMoment: StoryItemData = {
            id: newMoment.id,
            authorName: newMoment.authorName,
            authorTitle: newMoment.authorTitle,
            authorCompany: newMoment.authorCompany,
            authorAvatar:
              newMoment.authorAvatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            storyImage:
              newMoment.imageUrl ||
              "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&auto=format&fit=crop&q=80",
            storyCaption: newMoment.content,
            tag: newMoment.tag,
            timeAgo: "Vừa xong",
            viewsCount: 1,
          };
          setStories((prev) => [storyFromMoment, ...prev]);
        }}
      />

      {/* Parity Modals: Thảo Luận & Bình Luận B2B */}
      <MomentCommentModal
        visible={momentCommentVisible}
        moment={selectedMomentForComment}
        onClose={() => setMomentCommentVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#0B0F17",
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
  headerSquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
    fontSize: 9,
    fontWeight: "800",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    marginBottom: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  addPersonBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  boldText: {
    fontWeight: "600",
    color: "#94A3B8",
  },
  goldText: {
    color: "#D8B282",
    fontWeight: "700",
  },
  categoryTabsScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  categoryTabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12151F",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  categoryTabPillActive: {
    backgroundColor: "#D8B282",
    borderColor: "#D8B282",
  },
  categoryTabPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  categoryTabPillTextActive: {
    color: "#050C15",
    fontWeight: "800",
  },
  tabContent: {
    marginTop: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12151F",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
    padding: 0,
  },
  quickFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  filterPillActive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderColor: "#D8B282",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  filterPillTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  storiesSection: {
    marginBottom: 20,
  },
  storiesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderSmall: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 1,
  },
  addMomentBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  addMomentText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "700",
  },
  storiesScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  myStoryCard: {
    width: 95,
    height: 145,
    borderRadius: 14,
    backgroundColor: "#181D2A",
    borderWidth: 1.5,
    borderColor: "rgba(216, 178, 130, 0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  myStoryAvatarWrap: {
    position: "relative",
    marginBottom: 8,
  },
  myStoryAddBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#D8B282",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0B0F17",
  },
  myStoryLabel: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },
  myStorySub: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "600",
    marginTop: 2,
  },
  storyCard: {
    width: 105,
    height: 145,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    justifyContent: "space-between",
    padding: 8,
  },
  storyCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  storyCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  storyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storyCardTag: {
    backgroundColor: "rgba(10, 10, 11, 0.75)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#D8B282",
    maxWidth: 62,
  },
  storyCardTagText: {
    color: "#D8B282",
    fontSize: 8.5,
    fontWeight: "700",
  },
  storyCardBottom: {
    gap: 2,
  },
  storyAuthorName: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyTimeAgo: {
    color: "#F6E1C3",
    fontSize: 9.5,
    fontWeight: "500",
  },
  nurtureSection: {
    marginBottom: 20,
    backgroundColor: "#12151F",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  nurtureHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  nurtureHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  nurtureTitle: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  nurtureCountBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  nurtureCountText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "800",
  },
  nurtureListCol: {
    gap: 10,
  },
  nurtureCard: {
    backgroundColor: "#181D2A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  nurtureCardMain: {
    marginBottom: 10,
  },
  nurtureInfo: {
    gap: 2,
  },
  nurtureNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nurtureName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  nurtureTagBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nurtureTagText: {
    color: "#D8B282",
    fontSize: 10,
    fontWeight: "600",
  },
  nurtureRole: {
    color: "#94A3B8",
    fontSize: 11.5,
  },
  nurtureReasonText: {
    color: "#F6E1C3",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    fontWeight: "500",
  },
  nurtureActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 8,
  },
  nurtureMeetBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    paddingVertical: 6,
    borderRadius: 8,
  },
  nurtureMeetText: {
    color: "#050C15",
    fontSize: 11.5,
    fontWeight: "700",
  },
  nurtureChatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingVertical: 6,
    borderRadius: 8,
  },
  nurtureChatText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "600",
  },
  nurtureCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  listSection: {
    gap: 10,
  },
  partnerCard: {
    backgroundColor: "#12151F",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardMain: {
    flexDirection: "row",
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  matchBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  partnerTitle: {
    fontSize: 12,
    color: "#D8B282",
    marginTop: 2,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  partnerCompany: {
    fontSize: 11.5,
    color: "#94A3B8",
    flex: 1,
  },
  industryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#181D2A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  industryText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  chatActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chatActionText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBadge: {
    backgroundColor: "#181D2A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  connectBtn: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderWidth: 1,
    borderColor: "#D8B282",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectBtnText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "700",
  },
  pipelineSummaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  pipelineCard: {
    flex: 1,
    backgroundColor: "#12151F",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
  },
  pipelineNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 6,
  },
  pipelineLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  customerCard: {
    backgroundColor: "#12151F",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    marginBottom: 10,
  },
  customerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  priorityPill: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  customerContact: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  customerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  dealPill: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#38BDF8",
  },
  customerStage: {
    fontSize: 11,
    color: "#D8B282",
    fontWeight: "600",
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    padding: 14,
    marginBottom: 14,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D8B282",
  },
  aiBannerSubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  aiBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiExploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  aiExploreText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  connectBtnFull: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    paddingVertical: 10,
    borderRadius: 10,
  },
  connectBtnFullText: {
    color: "#050C15",
    fontSize: 12.5,
    fontWeight: "700",
  },
  inboxActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  inboxSearchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12151F",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#FFFFFF",
    paddingVertical: 8,
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  createGroupText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#050C15",
  },
  categoryTabsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#181D2A",
  },
  categoryTabActive: {
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    borderWidth: 1,
    borderColor: "#D8B282",
  },
  categoryTabText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  centerLoading: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 8,
  },
  emptyInboxBox: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
  },
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12151F",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  threadItemUnread: {
    borderColor: "rgba(216, 178, 130, 0.35)",
    backgroundColor: "#161B29",
  },
  threadAvatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#0B0F17",
  },
  threadBody: {
    flex: 1,
  },
  threadHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    maxWidth: 180,
  },
  threadNameBold: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  threadGroupTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
    gap: 2,
  },
  threadGroupTagText: {
    fontSize: 9,
    color: "#D8B282",
    fontWeight: "700",
  },
  threadTime: {
    fontSize: 10.5,
    color: "#94A3B8",
  },
  threadPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  threadPreviewText: {
    fontSize: 12,
    color: "#94A3B8",
    flex: 1,
    marginRight: 8,
  },
  threadPreviewTextUnread: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  unreadCounter: {
    backgroundColor: "#D8B282",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadCounterText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#050C15",
  },
  requestCard: {
    backgroundColor: "#12151F",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  requestActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181D2A",
    paddingVertical: 8,
    borderRadius: 10,
  },
  declineBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  floatingAiBtn: {
    position: "absolute",
    bottom: 24,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  floatingAiText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#050C15",
  },
});

