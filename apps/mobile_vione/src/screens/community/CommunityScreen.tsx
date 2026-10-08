import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Bell,
  Search,
  X,
  Plus,
  Sparkles,
  Briefcase,
  Clock,
  ShieldCheck,
  Check,
  Phone,
  Mail,
  MessageSquare,
  Handshake,
  Star,
  Settings,
  ArrowLeft,
  UserPlus,
  AlertTriangle,
  Building2,
  Newspaper,
  Target,
  Share2,
  Eye,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { StickyBrandHeader } from "../../components/common/StickyBrandHeader";
import { B2BEvent } from "../../types";
import { CreateCommunityGroupModal } from "../../components/CreateCommunityGroupModal";
import { EventDetailModal } from "../../components/EventDetailModal";
import {
  OpportunityDetailModal,
  CommunityOpportunityItem,
} from "../../components/OpportunityDetailModal";
import { CreateOpportunityModal } from "../../components/CreateOpportunityModal";
import { ProposeOpportunityMeetingModal } from "../../components/ProposeOpportunityMeetingModal";
import { EditCommunityModal } from "../../components/EditCommunityModal";
import { ShareEventModal } from "../../components/ShareEventModal";
import { AssignTaskModal } from "../../components/AssignTaskModal";
import { CreateNewsModal } from "../../components/CreateNewsModal";
import { CommunityNewsDetailModal } from "../../components/CommunityNewsDetailModal";
import { CommunityInviteModal } from "../../components/CommunityInviteModal";
import { MemberCardBottomSheet, MemberCardData } from "../../components/MemberCardBottomSheet";
import { communityApi, eventsApi, opportunityApi, meApi } from "../../api";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { BusinessNotificationsModal } from "../../components/BusinessNotificationsModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ==========================================
// Types
// ==========================================
export type CommunityType = "company_internal" | "b2b_networking";
export type CommunityTab = "all" | "company" | "networking" | "admin" | "joined" | "history";
export type DetailTab = "tasks" | "supervision" | "opportunities" | "news" | "events" | "members";

export interface CommunityDetailModel {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  communityType: CommunityType;
  memberCount: number;
  viewerRole: "admin" | "member" | "none";
  isMember: boolean;
  upcomingEventsCount: number;
  openOpportunityCount: number;
  canEdit?: boolean;
}

export interface TaskItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerName?: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  acceptedAt: string | null;
  completedAt: string | null;
  deadline: string;
  customerName?: string;
  customerPhone?: string;
  customerRequirements?: string;
  createdAt: string;
}

export interface NewsPostItem {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  timeAgo: string;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

export interface MemberItem {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl?: string;
  role: "admin" | "member";
  phone: string;
  email: string;
}

// ==========================================
// Helper functions (Matching PWA 100%)
// ==========================================
export function getVNTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
  if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
  return "Chào buổi tối,";
}

export function getCommunityVisuals(name: string, logoUrl?: string | null, bannerUrl?: string | null) {
  const lower = (name || "").toLowerCase();

  let defaultBanner = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80";
  let defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80";
  let category = "Hiệp Hội Doanh Nghiệp B2B";
  let attendees = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  ];
  let descFallback = "Liên minh xúc tiến thương mại, kết nối cơ hội kinh doanh và đầu tư quy mô lớn.";

  if (lower.includes("vione") || lower.includes("gia đình") || lower.includes("ceo") || lower.includes("lãnh đạo")) {
    defaultBanner = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
    category = "Gia Đình ViOne • C-Level";
    attendees = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Mạng lưới kết nối Chủ tịch, CEO & Lãnh đạo doanh nghiệp thuộc Gia Đình ViOne.";
  } else if (lower.includes("ai") || lower.includes("vietnam") || lower.includes("tech")) {
    defaultBanner = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80";
    category = "AI & Chuyển Đổi Số";
    attendees = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Cộng đồng chuyên gia, Founder & Kỹ sư AI tiên phong ứng dụng công nghệ thực chiến.";
  }

  return {
    bannerUrl: bannerUrl || defaultBanner,
    avatarUrl: defaultAvatar,
    category,
    attendees,
    descFallback,
  };
}

// Initial canonical communities list matching PWA
const INITIAL_COMMUNITIES: CommunityDetailModel[] = [
  {
    id: "c-vione-internal",
    name: "Tập Đoàn Đầu Tư & Công Nghệ ViOne",
    shortDescription: "Không gian làm việc & giao việc nội bộ Ban Điều Hành và toàn thể cán bộ nhân viên ViOne.",
    description: "Cộng đồng nội bộ chính thức của Tập đoàn ViOne. Phân hệ điều hành công việc, báo cáo CRM, giao nhiệm vụ và kiểm soát mục tiêu chiến lược thời gian thực.",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    communityType: "company_internal",
    memberCount: 48,
    viewerRole: "admin",
    isMember: true,
    upcomingEventsCount: 2,
    openOpportunityCount: 3,
    canEdit: true,
  },
  {
    id: "c-b2b-leaders",
    name: "CLB Doanh Nhân ViOne Global Leaders",
    shortDescription: "Liên minh xúc tiến thương mại, kết nối cơ hội kinh doanh và đầu tư quy mô lớn.",
    description: "Cộng đồng quy tụ các Chủ tịch, CEO & Nhà sáng lập doanh nghiệp tiên phong kết nối & phát triển bền vững đa ngành.",
    logoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 320,
    viewerRole: "member",
    isMember: true,
    upcomingEventsCount: 3,
    openOpportunityCount: 5,
    canEdit: false,
  },
  {
    id: "c-b2b-tech",
    name: "Liên Minh Doanh Nghiệp Công Nghệ & AI Việt Nam",
    shortDescription: "Cộng đồng chuyên gia, Founder & Kỹ sư AI tiên phong ứng dụng công nghệ thực chiến.",
    description: "Tổ chức xúc tiến ứng dụng Trí tuệ nhân tạo và Tự động hóa quy trình cho doanh nghiệp quy mô lớn tại Việt Nam.",
    logoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 280,
    viewerRole: "admin",
    isMember: true,
    upcomingEventsCount: 1,
    openOpportunityCount: 4,
    canEdit: true,
  },
  {
    id: "c-b2b-forum",
    name: "Diễn Đàn Đầu Tư B2B Việt Nam",
    shortDescription: "Mạng lưới kết nối các Quỹ đầu tư, Vốn tư nhân và Doanh nghiệp vừa & lớn mở rộng quy mô.",
    description: "Diễn đàn kết nối tài chính, gọi vốn và hợp tác liên doanh giữa các chủ doanh nghiệp hàng đầu.",
    logoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 310,
    viewerRole: "none",
    isMember: false,
    upcomingEventsCount: 2,
    openOpportunityCount: 2,
    canEdit: false,
  },
];

const INITIAL_TASKS: TaskItem[] = [];
const INITIAL_OPPORTUNITIES: CommunityOpportunityItem[] = [];
const INITIAL_EVENTS: B2BEvent[] = [];
const INITIAL_NEWS: NewsPostItem[] = [];
const INITIAL_MEMBERS: MemberItem[] = [];

export type TaskFilterType = "all" | "my_tasks" | "assigned" | "in_progress" | "completed";

interface CommunityScreenProps {
  route?: {
    params?: {
      communityId?: string;
      tab?: DetailTab;
      filter?: TaskFilterType;
      opportunityId?: string;
    };
  };
  navigation?: any;
}

// ==========================================
// Main Component
// ==========================================
export const CommunityScreen: React.FC<CommunityScreenProps> = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Navigation State: null = CommunityHome (Level 1); string = CommunityDetail (Level 2)
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    route?.params?.communityId || null
  );

  // Home Level 1 States
  const [activeTab, setActiveTab] = useState<CommunityTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<CommunityDetailModel[]>(INITIAL_COMMUNITIES);
  const [events, setEvents] = useState<B2BEvent[]>(INITIAL_EVENTS);
  const [opportunities, setOpportunities] = useState<CommunityOpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Detail Level 2 States
  const [detailTab, setDetailTab] = useState<DetailTab>(route?.params?.tab || "tasks");
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>(route?.params?.filter || "all");
  const [acceptingTaskId, setAcceptingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (route?.params?.communityId) {
      setSelectedCommunityId(route.params.communityId);
      if (route.params.tab) {
        setDetailTab(route.params.tab);
      }
      if (route.params.filter) {
        setTaskFilter(route.params.filter);
      }
      if (route.params.opportunityId) {
        const found = opportunities.find((o) => o.id === route.params?.opportunityId);
        if (found) {
          setSelectedOpp(found);
          setOppModalVisible(true);
        }
      }
    }
  }, [route?.params, opportunities]);

  // Modals
  const [createCommunityVisible, setCreateCommunityVisible] = useState(false);
  const [editCommunityVisible, setEditCommunityVisible] = useState(false);
  const [shareEventVisible, setShareEventVisible] = useState(false);
  const [assignTaskVisible, setAssignTaskVisible] = useState(false);
  const [createOppVisible, setCreateOppVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<B2BEvent | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<CommunityOpportunityItem | null>(null);
  const [oppModalVisible, setOppModalVisible] = useState(false);
  const [proposeMeetingVisible, setProposeMeetingVisible] = useState(false);
  const [selectedOppForMeeting, setSelectedOppForMeeting] = useState<CommunityOpportunityItem | null>(null);

  // Community News & Announcement states
  const [newsList, setNewsList] = useState<NewsPostItem[]>(INITIAL_NEWS);
  const [createNewsVisible, setCreateNewsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsPostItem | null>(null);
  const [newsDetailVisible, setNewsDetailVisible] = useState(false);

  // Invite & Member Card Bottom Sheet states
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberCardData | null>(null);
  const [memberSheetVisible, setMemberSheetVisible] = useState(false);

  // Active community in Detail view
  const currentCommunity = useMemo(() => {
    if (!selectedCommunityId) return null;
    return communities.find((c) => c.id === selectedCommunityId) || communities[0];
  }, [selectedCommunityId, communities]);

  // Load backend data
  const loadData = async () => {
    try {
      const commRes = await communityApi.getMyCommunities();
      const commList = Array.isArray(commRes) ? commRes : (commRes as any)?.data || [];
      if (commList.length > 0) {
        setCommunities((prev) => {
          // Merge api items
          const mapped = commList.map((c: any) => {
            const isCompany =
              c.communityType === "company_internal" ||
              c.name?.toLowerCase().includes("công ty") ||
              c.name?.toLowerCase().includes("tập đoàn");
            return {
              id: c.id || c.communityId,
              name: c.name,
              shortDescription: c.shortDescription || c.description,
              description: c.description,
              logoUrl: c.logoUrl,
              bannerUrl: c.bannerUrl,
              communityType: (isCompany ? "company_internal" : "b2b_networking") as CommunityType,
              memberCount: c.memberCount || 24,
              viewerRole: (c.viewerRole || (c.role === "Ban Điều Hành" ? "admin" : "member")) as any,
              isMember: c.isMember ?? true,
              upcomingEventsCount: 2,
              openOpportunityCount: 3,
              canEdit: c.viewerRole === "admin",
            };
          });
          return mapped;
        });
      }
    } catch {
      // Keep initial
    }

    try {
      const eventsRes = await eventsApi.getEvents();
      const eventsList = Array.isArray(eventsRes) ? eventsRes : (eventsRes as any)?.data || [];
      if (eventsList.length > 0) {
        setEvents(eventsList);
      }
    } catch {
      // Keep initial
    }

    try {
      const oppRes = await opportunityApi.getOpportunities();
      const oppList = Array.isArray(oppRes) ? oppRes : (oppRes as any)?.data || [];
      if (oppList.length > 0) {
        setOpportunities(
          oppList.map((op: any, idx: number) => ({
            id: op.id || `opp-${idx}`,
            title: op.title || "Cơ hội kinh doanh B2B",
            organization: op.organization || op.companyName || "Doanh nghiệp ViOne",
            communityName: op.communityName || "Cộng đồng ViOne",
            dealValue: op.budget ? `${op.budget.toLocaleString("vi-VN")} đ` : op.dealValue || "Thỏa thuận",
            category: op.category || "Hợp tác kinh doanh",
            daysLeft: op.duration || "Còn 7 ngày",
            interested: !!op.interested,
          }))
        );
      }
    } catch {
      // Keep initial
    }

    try {
      const notifRes = await meApi.getUnreadNotificationCount();
      if (notifRes?.data?.count !== undefined) {
        setUnreadNotifCount(notifRes.data.count);
      }
    } catch {
      // ignore
    }
  };

  const loadTasks = async (commId: string) => {
    try {
      const res = await communityApi.getCommunityTasks(commId);
      const list = res?.data?.tasks || [];
      if (Array.isArray(list) && list.length > 0) {
        setTasks(
          list.map((t: any) => ({
            id: t.id,
            communityId: t.communityId || commId,
            title: t.title,
            description: t.description || "",
            assigneeId: t.assigneeId || "",
            assigneeName: t.assigneeName || "Nhân sự",
            assignerName: t.assignerName,
            priority: t.priority || "medium",
            status: t.status || "assigned",
            acceptedAt: t.acceptedAt || null,
            completedAt: t.completedAt || null,
            deadline: t.deadline || "Hôm nay",
            customerName: t.customerName,
            customerPhone: t.customerPhone,
            customerRequirements: t.customerRequirements,
            createdAt: t.createdAt || new Date().toISOString(),
          }))
        );
      }
    } catch (e) {
      console.warn("Failed to load community tasks:", e);
    }
  };

  useEffect(() => {
    if (selectedCommunityId) {
      loadTasks(selectedCommunityId);
    }
  }, [selectedCommunityId]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedCommunityId) {
      await loadTasks(selectedCommunityId);
    }
    setRefreshing(false);
  };

  // Event handlers
  const handleRegisterEvent = async (event: B2BEvent) => {
    try {
      await eventsApi.registerEvent(event.id);
    } catch {
      // fallback
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, isRegistered: true } : e))
    );
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký tham gia: ${event.title}. Thẻ vé điện tử QR đã được cấp.`);
  };

  const handleInterestOpp = async (opp: CommunityOpportunityItem) => {
    try {
      await opportunityApi.expressInterest(opp.id, "high");
    } catch {
      // fallback
    }
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, interested: true } : o))
    );
    Alert.alert("Quan tâm cơ hội", `Đã gửi hồ sơ năng lực và thông tin kết nối tới ban quản trị dự án: ${opp.title}`);
  };

  // ==========================================
  // [⚡ TIẾN HÀNH NHẬN VIỆC] Action (PWA Synchronized)
  // ==========================================
  const handleAcceptTask = async (task: TaskItem) => {
    setAcceptingTaskId(task.id);
    try {
      if (selectedCommunityId) {
        await communityApi.acceptCommunityTask(selectedCommunityId, task.id);
      }

      const nowStr = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "in_progress", acceptedAt: nowStr }
            : t
        )
      );

      Alert.alert(
        "✓ Nhận Việc Thành Công",
        `Bạn đã tiến hành nhận việc "${task.title}".\n\nHệ thống đã ghi nhận thời gian bắt đầu và thông báo tới Ban Giám Đốc.`,
        [{ text: "Đóng", style: "default" }]
      );
    } catch {
      Alert.alert("Lỗi", "Không thể nhận việc lúc này. Vui lòng thử lại!");
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const handleCompleteTask = async (task: TaskItem) => {
    try {
      if (selectedCommunityId) {
        await communityApi.updateCommunityTaskStatus(selectedCommunityId, task.id, "completed");
      }
      const nowStr = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", completedAt: nowStr }
            : t
        )
      );
      Alert.alert("Hoàn thành việc", `Đã hoàn tất nhiệm vụ: ${task.title}`);
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái nhiệm vụ. Vui lòng thử lại!");
    }
  };

  // Join community
  const handleJoinCommunity = (commId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === commId
          ? { ...c, isMember: true, viewerRole: "member", memberCount: c.memberCount + 1 }
          : c
      )
    );
    Alert.alert("Thành công", "Bạn đã gia nhập cộng đồng thành công!");
  };

  // Filtered communities for Level 1 Home
  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const isCompany = c.communityType === "company_internal";
      if (activeTab === "company" && !isCompany) return false;
      if (activeTab === "networking" && isCompany) return false;
      if (activeTab === "admin" && c.viewerRole !== "admin") return false;
      if (activeTab === "joined" && !c.isMember) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.shortDescription && c.shortDescription.toLowerCase().includes(q))
      );
    });
  }, [communities, activeTab, searchQuery]);

  const hasAdmin = communities.some((c) => c.viewerRole === "admin");

  // Đếm số lượng việc được giao cho chính tài khoản đang đăng nhập
  const myTasksCount = useMemo(() => {
    if (!user) return 0;
    const userName = (user.name || user.displayName || "").toLowerCase();
    const userEmail = (user.email || "").split("@")[0].toLowerCase();
    return tasks.filter((t) => {
      const taskAssignee = (t.assigneeName || "").toLowerCase();
      return (
        t.assigneeId === user.id ||
        (userName && taskAssignee.includes(userName)) ||
        (userEmail && taskAssignee.includes(userEmail))
      );
    }).length;
  }, [tasks, user]);

  // Filtered tasks in Level 2 Detail (Tất cả, ⭐ Việc của tôi, Chờ nhận việc, Đang làm, Đã xong)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "my_tasks") {
        if (!user) return false;
        const userName = (user.name || user.displayName || "").toLowerCase();
        const userEmail = (user.email || "").split("@")[0].toLowerCase();
        const taskAssignee = (t.assigneeName || "").toLowerCase();
        return (
          t.assigneeId === user.id ||
          (userName && taskAssignee.includes(userName)) ||
          (userEmail && taskAssignee.includes(userEmail))
        );
      }
      return t.status === taskFilter;
    });
  }, [tasks, taskFilter, user]);

  const totalTasks = tasks.length;
  const assignedTasksCount = tasks.filter((t) => t.status === "assigned").length;
  const inProgressTasksCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {/* ========================================================================= */}
      {/* LEVEL 1: COMMUNITY HOME (When selectedCommunityId is null)                */}
      {/* ========================================================================= */}
      {!selectedCommunityId && (
        <>
          {/* Sticky Header thương hiệu chung matching PWA 1:1 */}
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
                {unreadNotifCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            }
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#DFB76C"
                colors={["#DFB76C"]}
              />
            }
          >
            {/* Title & Button Tạo cộng đồng */}
            <View style={styles.titleSection}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pageTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Cộng đồng
                </Text>
                <Text style={[styles.pageSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  Thành viên · Sự kiện · Cơ hội
                </Text>
              </View>

              <TouchableOpacity
                style={styles.createCommunityBtn}
                onPress={() => setCreateCommunityVisible(true)}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createCommunityGrad}
                >
                  <Plus size={16} color="#050C15" strokeWidth={2.5} />
                  <Text style={styles.createCommunityText}>Tạo cộng đồng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs matching PWA: Tất cả, Doanh nghiệp của tôi, Mạng lưới B2B, Đang quản trị, Đã tham gia, Lịch sử yêu cầu */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
              style={styles.tabsWrapper}
            >
              {[
                { id: "all", label: "Tất cả" },
                { id: "company", label: "🏢 Doanh nghiệp của tôi" },
                { id: "networking", label: "🤝 Mạng lưới B2B" },
                ...(hasAdmin ? [{ id: "admin", label: "Đang quản trị" }] : []),
                { id: "joined", label: "Đã tham gia" },
                { id: "history", label: "Lịch sử yêu cầu" },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setActiveTab(item.id as any)}
                    style={[
                      styles.tabItem,
                      isActive && styles.tabItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive
                            ? "#D8B282"
                            : isDark
                            ? "#94A3B8"
                            : "#64748B",
                          fontWeight: isActive ? "800" : "500",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Ô tìm kiếm 100% chiều rộng nằm dưới Tabs */}
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: isDark ? "#121824" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <Search size={18} color="#D8B282" />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
                placeholder="Tìm cộng đồng, liên minh, sự kiện..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Nếu đang ở tab Lịch sử yêu cầu */}
            {activeTab === "history" ? (
              <View style={styles.historyPanel}>
                <View
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: isDark ? "#121824" : "#F8FAFC",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.historyRow}>
                    <Building2 size={20} color="#D8B282" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.historyName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Diễn Đàn Đầu Tư B2B Việt Nam
                      </Text>
                      <Text style={styles.historyTime}>Yêu cầu gửi lúc 09:30 · Hôm qua</Text>
                    </View>
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingPillText}>Đang chờ duyệt</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Search result count */}
                {searchQuery.trim().length > 0 && (
                  <Text style={[styles.searchResultCount, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Kết quả tìm kiếm ({filteredCommunities.length})
                  </Text>
                )}

                {/* Danh Sách Thẻ Cộng Đồng */}
                {filteredCommunities.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Users size={36} color="#94A3B8" />
                    <Text style={[styles.emptyTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      Không tìm thấy cộng đồng phù hợp
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                      Thử tìm kiếm với từ khóa khác hoặc tạo cộng đồng mới của riêng bạn.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.communitiesList}>
                    {filteredCommunities.map((community) => {
                      const visuals = getCommunityVisuals(
                        community.name,
                        community.logoUrl,
                        community.bannerUrl
                      );
                      const isCompany = community.communityType === "company_internal";

                      return (
                        <View
                          key={community.id}
                          style={[
                            styles.communityCard,
                            {
                              backgroundColor: isDark ? "#121824" : "#FFFFFF",
                              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                            },
                          ]}
                        >
                          {/* Top Cover Banner */}
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                              setSelectedCommunityId(community.id);
                              setDetailTab(isCompany ? "tasks" : "opportunities");
                            }}
                            style={styles.cardBannerWrap}
                          >
                            <Image
                              source={{ uri: visuals.bannerUrl }}
                              style={styles.cardBannerImg}
                            />
                            <LinearGradient
                              colors={["transparent", "rgba(18, 24, 36, 0.85)"]}
                              style={styles.cardBannerGrad}
                            />

                            {/* Category Pill Tag */}
                            <View style={styles.cardCategoryBadge}>
                              {isCompany ? (
                                <View style={styles.companyPill}>
                                  <Text style={styles.companyPillText}>🏢 CÔNG TY NỘI BỘ</Text>
                                </View>
                              ) : (
                                <View style={styles.b2bPill}>
                                  <Text style={styles.b2bPillText}>🤝 MẠNG LƯỚI B2B</Text>
                                </View>
                              )}
                            </View>

                            {/* Member Status Badge */}
                            <View style={styles.cardRoleBadge}>
                              <Text style={styles.cardRoleText}>
                                {community.viewerRole === "admin" ? "Quản trị viên" : "Đã tham gia"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Main Content Body */}
                          <View style={styles.cardBody}>
                            {/* Floating Avatar + Community Name */}
                            <View style={styles.cardAvatarRow}>
                              <Image
                                source={{ uri: visuals.avatarUrl }}
                                style={styles.cardAvatarImg}
                              />
                              <TouchableOpacity
                                style={styles.cardNameCol}
                                onPress={() => {
                                  setSelectedCommunityId(community.id);
                                  setDetailTab(isCompany ? "tasks" : "opportunities");
                                }}
                              >
                                <View style={styles.nameChevronRow}>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.cardTitle,
                                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                                    ]}
                                  >
                                    {community.name}
                                  </Text>
                                  <ChevronRight size={18} color="#D8B282" />
                                </View>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.cardDesc,
                                    { color: isDark ? "#94A3B8" : "#64748B" },
                                  ]}
                                >
                                  {community.shortDescription || visuals.descFallback}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* Overlapping Members Row & Quick Badges */}
                            <View
                              style={[
                                styles.cardMetaRow,
                                { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                              ]}
                            >
                              <View style={styles.attendeesGroup}>
                                <View style={styles.avatarStack}>
                                  {visuals.attendees.map((att, idx) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: att }}
                                      style={[
                                        styles.stackAvatar,
                                        { marginLeft: idx === 0 ? 0 : -8 },
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text style={styles.membersCountText}>
                                  {community.memberCount} thành viên
                                </Text>
                              </View>

                              <View style={styles.metricBadgesGroup}>
                                {community.upcomingEventsCount > 0 && (
                                  <View style={styles.metricBadgeGold}>
                                    <Text style={styles.metricBadgeGoldText}>
                                      {community.upcomingEventsCount} sự kiện
                                    </Text>
                                  </View>
                                )}
                                {community.openOpportunityCount > 0 && (
                                  <View style={styles.metricBadgeSlate}>
                                    <Text style={styles.metricBadgeSlateText}>
                                      {community.openOpportunityCount} cơ hội
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* 3 Quick Action Buttons */}
                            <View
                              style={[
                                styles.cardActionsGrid,
                                {
                                  backgroundColor: isDark ? "#0B0F17" : "#F8FAFC",
                                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                                },
                              ]}
                            >
                              <TouchableOpacity
                                style={styles.actionCol}
                                onPress={() => {
                                  setSelectedCommunityId(community.id);
                                  setDetailTab("members");
                                }}
                              >
                                <Users size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  Thành viên
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.actionCol,
                                  {
                                    borderLeftWidth: 1,
                                    borderRightWidth: 1,
                                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                                  },
                                ]}
                                onPress={() => {
                                  setSelectedCommunityId(community.id);
                                  setDetailTab("events");
                                }}
                              >
                                <Calendar size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  Sự kiện
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionCol}
                                onPress={() => {
                                  setSelectedCommunityId(community.id);
                                  setDetailTab(isCompany ? "tasks" : "opportunities");
                                }}
                              >
                                <Briefcase size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  {isCompany ? "Giao việc" : "Cơ hội"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Sắp diễn ra trong cộng đồng (CommunityUpcomingEvents) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Sắp diễn ra trong cộng đồng
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert("Sự kiện", "Đang mở toàn bộ sự kiện.")}>
                    <Text style={styles.sectionMoreText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.upcomingEventsList}>
                  {events.map((ev) => (
                    <TouchableOpacity
                      key={ev.id}
                      style={[
                        styles.upcomingEventCard,
                        {
                          backgroundColor: isDark ? "#121824" : "#FFFFFF",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        setSelectedEvent(ev);
                        setEventModalVisible(true);
                      }}
                    >
                      <View style={styles.eventDateBox}>
                        <Text style={styles.eventMonthText}>THÁNG 10</Text>
                        <Text style={styles.eventDayText}>
                          {ev.startsAt.split(" ")[0].split("-")[2] || "15"}
                        </Text>
                      </View>

                      <View style={styles.eventInfoCol}>
                        <Text
                          numberOfLines={1}
                          style={[styles.eventTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                        >
                          {ev.title}
                        </Text>
                        <View style={styles.eventMetaRow}>
                          <Clock size={12} color="#D8B282" />
                          <Text style={styles.eventMetaText}>{ev.startsAt}</Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <MapPin size={12} color="#94A3B8" />
                          <Text numberOfLines={1} style={styles.eventMetaText}>
                            {ev.location}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.eventRegisterBtn,
                          ev.isRegistered && styles.eventRegisteredBtn,
                        ]}
                        onPress={() => handleRegisterEvent(ev)}
                      >
                        <Text
                          style={[
                            styles.eventRegisterBtnText,
                            ev.isRegistered && styles.eventRegisteredBtnText,
                          ]}
                        >
                          {ev.isRegistered ? "Đã đ.ký" : "Đăng ký"}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Cơ hội kinh doanh trong cộng đồng (CommunityOpportunitiesSection) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Cơ hội kinh doanh trong cộng đồng
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert("Cơ hội", "Xem tất cả cơ hội B2B.")}>
                    <Text style={styles.sectionMoreText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.opportunitiesList}>
                  {opportunities.map((opp) => (
                    <TouchableOpacity
                      key={opp.id}
                      style={[
                        styles.opportunityCard,
                        {
                          backgroundColor: isDark ? "#121824" : "#FFFFFF",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        setSelectedOpp(opp);
                        setOppModalVisible(true);
                      }}
                    >
                      <View style={styles.oppTopRow}>
                        <View style={styles.oppBadge}>
                          <Text style={styles.oppBadgeText}>{opp.category}</Text>
                        </View>
                        <Text style={styles.oppDaysLeft}>{opp.daysLeft}</Text>
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[styles.oppTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                      >
                        {opp.title}
                      </Text>

                      <View style={styles.oppOrgRow}>
                        <Building2 size={13} color="#94A3B8" />
                        <Text numberOfLines={1} style={styles.oppOrgText}>
                          {opp.organization}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.oppFooterRow,
                          { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                        ]}
                      >
                        <View>
                          <Text style={styles.oppValueLabel}>Giá trị dự kiến</Text>
                          <Text style={styles.oppValueText}>{opp.dealValue}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.oppConnectBtn}
                          onPress={() => {
                            setSelectedOppForMeeting(opp);
                            setProposeMeetingVisible(true);
                          }}
                        >
                          <LinearGradient
                            colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                            style={styles.oppConnectGrad}
                          >
                            <Handshake size={13} color="#050C15" />
                            <Text style={styles.oppConnectText}>Đề xuất gặp mặt</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Quản trị yêu cầu tham gia (CommunityJoinAdminEntry) */}
                {hasAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.adminEntryCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => Alert.alert("Yêu cầu tham gia", "Hiện có 2 hồ sơ doanh nghiệp đang chờ bạn xét duyệt.")}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.adminEntryTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Quản trị yêu cầu tham gia
                      </Text>
                      <Text style={styles.adminEntrySubtitle}>
                        2 thành viên mới đang chờ phê duyệt
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#D8B282" />
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: COMMUNITY DETAIL (When selectedCommunityId is NOT null)          */}
      {/* ========================================================================= */}
      {selectedCommunityId && currentCommunity && (
        <>
          {/* Top Bar with Back Button */}
          <View
            style={[
              styles.detailTopBar,
              {
                backgroundColor: isDark ? "rgba(11, 15, 23, 0.95)" : "rgba(255, 255, 255, 0.95)",
                borderBottomColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedCommunityId(null)}
            >
              <ArrowLeft size={20} color="#D8B282" />
              <Text style={styles.backButtonText}>Cộng đồng</Text>
            </TouchableOpacity>

            <Text
              numberOfLines={1}
              style={[styles.detailTopTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
            >
              {currentCommunity.name}
            </Text>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => Alert.alert("Chia sẻ", `Liên kết cộng đồng: ${currentCommunity.name}`)}
            >
              <Share2 size={18} color="#D8B282" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#DFB76C"
                colors={["#DFB76C"]}
              />
            }
          >
            {/* Top Cover Banner */}
            <View style={styles.detailBannerWrap}>
              <Image
                source={{
                  uri:
                    currentCommunity.bannerUrl ||
                    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
                }}
                style={styles.detailBannerImg}
              />
              <LinearGradient
                colors={["transparent", "rgba(11, 15, 23, 0.85)"]}
                style={styles.detailBannerGrad}
              />

              {/* Category Pill Tag on Banner */}
              <View style={styles.detailCategoryPill}>
                {currentCommunity.communityType === "company_internal" ? (
                  <View style={styles.companyPill}>
                    <Text style={styles.companyPillText}>🏢 DOANH NGHIỆP NỘI BỘ</Text>
                  </View>
                ) : (
                  <View style={styles.b2bPill}>
                    <Text style={styles.b2bPillText}>🤝 MẠNG LƯỚI DOANH NHÂN B2B</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Overlapping Floating Avatar & Header Info */}
            <View style={styles.detailHeaderSection}>
              <Image
                source={{
                  uri:
                    currentCommunity.logoUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                }}
                style={styles.detailAvatarImg}
              />

              <View style={styles.detailInfoCol}>
                <Text style={[styles.detailNameText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  {currentCommunity.name}
                </Text>
                {currentCommunity.shortDescription && (
                  <Text style={[styles.detailShortDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    {currentCommunity.shortDescription}
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Badges & Admin Actions */}
            <View style={styles.badgesActionRow}>
              <View style={styles.badgesGroup}>
                <View
                  style={[
                    styles.roleBadgePill,
                    {
                      backgroundColor: isDark ? "#151D2C" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Vai trò:{" "}
                    {currentCommunity.viewerRole === "admin"
                      ? "Quản trị viên"
                      : currentCommunity.isMember
                      ? "Thành viên chính thức"
                      : "Chưa tham gia"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.roleBadgePill,
                    {
                      backgroundColor: isDark ? "#151D2C" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    {currentCommunity.memberCount} thành viên
                  </Text>
                </View>
              </View>

              {/* Nút Mời Thành Viên */}
              <TouchableOpacity
                style={[
                  styles.editCommunityBtn,
                  { borderColor: "rgba(216, 178, 130, 0.4)" },
                ]}
                onPress={() => setInviteModalVisible(true)}
              >
                <Share2 size={13} color="#DFB76C" />
                <Text style={styles.editCommunityText}>Mời thành viên</Text>
              </TouchableOpacity>

              {/* Nút Quản Trị Viên: Chỉnh sửa cộng đồng */}
              {(currentCommunity.viewerRole === "admin" || currentCommunity.canEdit) && (
                <TouchableOpacity
                  style={styles.editCommunityBtn}
                  onPress={() => setEditCommunityVisible(true)}
                >
                  <Settings size={14} color="#DFB76C" />
                  <Text style={styles.editCommunityText}>⚙️ Chỉnh sửa cộng đồng</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3 Nút Hành Động Theo Chuẩn 2 Kiểu Cộng Đồng (PWA 100%) */}
            {currentCommunity.communityType === "company_internal" ? (
              <View style={styles.actionButtons3Col}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    setDetailTab("tasks");
                    setAssignTaskVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Briefcase size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Giao việc</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    setDetailTab("news");
                    setCreateNewsVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Newspaper size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng bài</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => setShareEventVisible(true)}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Calendar size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Chia sẻ SK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionButtons3Col}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => setCreateOppVisible(true)}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Target size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng cơ hội</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    setDetailTab("news");
                    setCreateNewsVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Newspaper size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng bài</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => setShareEventVisible(true)}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Calendar size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Chia sẻ SK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Gia nhập cộng đồng banner nếu chưa là thành viên */}
            {!currentCommunity.isMember && (
              <View style={styles.joinBannerCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.joinBannerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Gia nhập cộng đồng
                  </Text>
                  <Text style={[styles.joinBannerSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Tham gia để kết nối hội viên và cập nhật tin tức, sự kiện mới nhất.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.joinNowBtn}
                  onPress={() => handleJoinCommunity(currentCommunity.id)}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.joinNowGrad}
                  >
                    <UserPlus size={14} color="#050C15" />
                    <Text style={styles.joinNowText}>Tham gia ngay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* 3 Quick Stat Tiles */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>{currentCommunity.memberCount}</Text>
                <Text style={styles.statLabel}>Thành viên</Text>
              </View>

              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>{currentCommunity.upcomingEventsCount}</Text>
                <Text style={styles.statLabel}>Sự kiện</Text>
              </View>

              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>
                  {currentCommunity.communityType === "company_internal"
                    ? tasks.length
                    : currentCommunity.openOpportunityCount}
                </Text>
                <Text style={styles.statLabel}>
                  {currentCommunity.communityType === "company_internal" ? "Việc nội bộ" : "Cơ hội B2B"}
                </Text>
              </View>
            </View>

            {/* Streamlined Navigation Tabs: Phân định rạch ròi 2 kiểu cộng đồng */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.detailTabsScroll}
              style={styles.detailTabsWrapper}
            >
              {(currentCommunity.communityType === "company_internal"
                ? [
                    { id: "tasks", label: "⚡ Giao việc & Nhận việc" },
                    { id: "supervision", label: "👁️ Giám sát CRM & Nhân sự" },
                    { id: "news", label: "Bài viết nội bộ" },
                    { id: "events", label: `Lịch họp & Sự kiện (${events.length})` },
                    { id: "members", label: "Hội viên" },
                  ]
                : [
                    { id: "opportunities", label: `⭐ Cơ hội B2B (${opportunities.length})` },
                    { id: "news", label: "Bài viết & Tin tức" },
                    { id: "events", label: `Sự kiện B2B (${events.length})` },
                    { id: "members", label: "Danh bạ đối tác" },
                  ]
              ).map((tab) => {
                const isSelected = detailTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setDetailTab(tab.id as any)}
                    style={[
                      styles.detailTabItem,
                      isSelected && styles.detailTabItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailTabLabel,
                        {
                          color: isSelected
                            ? "#DFB76C"
                            : isDark
                            ? "#94A3B8"
                            : "#64748B",
                          fontWeight: isSelected ? "800" : "500",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isSelected && <View style={styles.detailActiveIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ================================================================= */}
            {/* TAB: TASKS (CompanyTaskManagement with [⚡ TIẾN HÀNH NHẬN VIỆC]) */}
            {/* ================================================================= */}
            {detailTab === "tasks" && (
              <View style={styles.tasksSection}>
                {/* Top Banner KPI & Nút Giao Việc */}
                <View
                  style={[
                    styles.tasksKpiBanner,
                    {
                      backgroundColor: isDark ? "#121824" : "#FFFFFF",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.tasksKpiHeaderRow}>
                    <View style={styles.tasksIconWrap}>
                      <Briefcase size={20} color="#D8B282" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.tasksBannerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Phân Hệ Giao Việc & Nhận Việc
                      </Text>
                      <Text style={styles.tasksBannerSubtitle}>
                        Cộng đồng nội bộ công ty · Tự động hóa tiến độ 1-chạm
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.tasksNewBtn}
                      onPress={() => setAssignTaskVisible(true)}
                    >
                      <LinearGradient
                        colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                        style={styles.tasksNewGrad}
                      >
                        <Plus size={14} color="#050C15" strokeWidth={2.5} />
                        <Text style={styles.tasksNewBtnText}>Giao việc</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* 4 Thống kê nhanh */}
                  <View
                    style={[
                      styles.tasks4KpiGrid,
                      { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                    ]}
                  >
                    <View style={[styles.kpiTileBox, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F1F5F9" }]}>
                      <Text style={[styles.kpiTileValue, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        {totalTasks}
                      </Text>
                      <Text style={styles.kpiTileLabel}>Tổng việc</Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiGoldBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#DFB76C" }]}>
                        {assignedTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#DFB76C", fontWeight: "700" }]}>
                        Chờ nhận
                      </Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiBlueBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#38BDF8" }]}>
                        {inProgressTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#38BDF8" }]}>Đang làm</Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiGreenBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#10B981" }]}>
                        {completedTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#10B981" }]}>Đã xong</Text>
                    </View>
                  </View>
                </View>

                {/* Filter Tabs Nhiệm Vụ */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.taskFilterScroll}
                >
                  {[
                    { id: "all", label: `Tất cả (${totalTasks})` },
                    { id: "my_tasks", label: `⭐ Việc của tôi (${myTasksCount})` },
                    { id: "assigned", label: `⚡ Chờ nhận việc (${assignedTasksCount})` },
                    { id: "in_progress", label: `Đang làm (${inProgressTasksCount})` },
                    { id: "completed", label: `Đã xong (${completedTasksCount})` },
                  ].map((filterTab) => {
                    const isSelected = taskFilter === filterTab.id;
                    return (
                      <TouchableOpacity
                        key={filterTab.id}
                        onPress={() => setTaskFilter(filterTab.id as any)}
                        style={[
                          styles.taskFilterPill,
                          {
                            backgroundColor: isSelected
                              ? "#DFB76C"
                              : isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "#F1F5F9",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskFilterPillText,
                            {
                              color: isSelected
                                ? "#050C15"
                                : isDark
                                ? "#94A3B8"
                                : "#64748B",
                              fontWeight: isSelected ? "800" : "500",
                            },
                          ]}
                        >
                          {filterTab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Danh Sách Task Cards */}
                {filteredTasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Briefcase size={32} color="#94A3B8" />
                    <Text style={[styles.emptyTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      Không có công việc nào trong mục này
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tasksListContainer}>
                    {filteredTasks.map((task) => {
                      const isAssigned = task.status === "assigned";
                      const isInProgress = task.status === "in_progress";
                      const isCompleted = task.status === "completed";

                      return (
                        <View
                          key={task.id}
                          style={[
                            styles.taskCard,
                            {
                              backgroundColor: isDark ? "#121824" : "#FFFFFF",
                              borderColor: isAssigned
                                ? "#DFB76C"
                                : isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "#E2E8F0",
                            },
                            isAssigned && styles.taskCardAssignedGlow,
                          ]}
                        >
                          {/* Top Row: Priority Badge + Status Badge */}
                          <View style={styles.taskCardTopRow}>
                            <View style={styles.taskPriorityGroup}>
                              <View
                                style={[
                                  styles.priorityBadge,
                                  task.priority === "urgent"
                                    ? styles.priorityUrgent
                                    : task.priority === "high"
                                    ? styles.priorityHigh
                                    : styles.priorityMedium,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.priorityText,
                                    task.priority === "urgent"
                                      ? styles.priorityUrgentText
                                      : task.priority === "high"
                                      ? styles.priorityHighText
                                      : styles.priorityMediumText,
                                  ]}
                                >
                                  {task.priority === "urgent"
                                    ? "Khẩn cấp"
                                    : task.priority === "high"
                                    ? "Ưu tiên cao"
                                    : "Thường"}
                                </Text>
                              </View>

                              <View style={styles.taskDeadlineRow}>
                                <Clock size={11} color="#94A3B8" />
                                <Text style={styles.taskDeadlineText}>Hạn: {task.deadline}</Text>
                              </View>
                            </View>

                            {/* Status Indicator */}
                            <View>
                              {isAssigned && (
                                <View style={styles.statusAssignedPill}>
                                  <AlertTriangle size={11} color="#DFB76C" />
                                  <Text style={styles.statusAssignedText}>CHỜ NHẬN VIỆC</Text>
                                </View>
                              )}
                              {isInProgress && (
                                <View style={styles.statusProgressPill}>
                                  <Clock size={11} color="#38BDF8" />
                                  <Text style={styles.statusProgressText}>ĐANG THỰC HIỆN</Text>
                                </View>
                              )}
                              {isCompleted && (
                                <View style={styles.statusCompletedPill}>
                                  <CheckCircle2 size={11} color="#10B981" />
                                  <Text style={styles.statusCompletedText}>ĐÃ HOÀN THÀNH</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Tiêu đề & Mô tả */}
                          <Text style={[styles.taskTitleText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                            {task.title}
                          </Text>
                          <Text style={[styles.taskDescText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                            {task.description}
                          </Text>

                          {/* Thông tin Nhân viên & Khách hàng */}
                          <View
                            style={[
                              styles.taskMetaRow,
                              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                            ]}
                          >
                            <View style={styles.taskAssigneeRow}>
                              <Text style={styles.taskMetaMuted}>Nhân sự:</Text>
                              <Text style={[styles.taskMetaBold, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                {task.assigneeName}
                              </Text>
                            </View>

                            {task.customerName && (
                              <View style={styles.taskCustomerRow}>
                                <Target size={12} color="#DFB76C" />
                                <Text
                                  numberOfLines={1}
                                  style={[styles.taskMetaBold, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                                >
                                  {task.customerName}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Timeline nhận việc nếu có */}
                          {task.acceptedAt && (
                            <View style={styles.acceptedAtRow}>
                              <View style={styles.acceptedDot} />
                              <Text style={styles.acceptedAtText}>
                                Đã nhận việc lúc:{" "}
                                {new Date(task.acceptedAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" · "}
                                {new Date(task.acceptedAt).toLocaleDateString("vi-VN")}
                              </Text>
                            </View>
                          )}

                          {/* HÀNG NÚT THAO TÁC THEO TRẠNG THÁI: [⚡ TIẾN HÀNH NHẬN VIỆC] */}
                          <View
                            style={[
                              styles.taskActionBottomRow,
                              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                            ]}
                          >
                            {isAssigned ? (
                              <>
                                <Text style={styles.acceptPromptText}>
                                  Tài khoản nhân sự hãy xác nhận:
                                </Text>
                                <TouchableOpacity
                                  style={styles.acceptTaskBtn}
                                  disabled={acceptingTaskId === task.id}
                                  onPress={() => handleAcceptTask(task)}
                                >
                                  <LinearGradient
                                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.acceptTaskGrad}
                                  >
                                    {acceptingTaskId === task.id ? (
                                      <ActivityIndicator size="small" color="#050C15" />
                                    ) : (
                                      <>
                                        <Sparkles size={14} color="#050C15" />
                                        <Text style={styles.acceptTaskBtnText}>
                                          TIẾN HÀNH NHẬN VIỆC
                                        </Text>
                                      </>
                                    )}
                                  </LinearGradient>
                                </TouchableOpacity>
                              </>
                            ) : isInProgress ? (
                              <>
                                <Text style={styles.inProgressPromptText}>
                                  Đang xử lý · Cập nhật khi xong:
                                </Text>
                                <TouchableOpacity
                                  style={styles.completeTaskBtn}
                                  onPress={() => handleCompleteTask(task)}
                                >
                                  <Check size={14} color="#050C15" strokeWidth={2.5} />
                                  <Text style={styles.completeTaskBtnText}>Đánh dấu xong</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <View style={styles.completedStatusRow}>
                                <CheckCircle2 size={16} color="#10B981" />
                                <Text style={styles.completedStatusText}>
                                  Đã hoàn thành công việc
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: SUPERVISION (Giám sát CRM & Nhân sự)                         */}
            {/* ================================================================= */}
            {detailTab === "supervision" && (
              <View style={styles.supervisionSection}>
                <View
                  style={[
                    styles.supervisionCard,
                    {
                      backgroundColor: isDark ? "#121824" : "#FFFFFF",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.supervisionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Tổng Quan Hiệu Suất Vận Hành
                  </Text>
                  <View style={styles.supervisionMetricsRow}>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={styles.supervisionMetricVal}>18</Text>
                      <Text style={styles.supervisionMetricLbl}>Nhân sự hoạt động</Text>
                    </View>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={[styles.supervisionMetricVal, { color: "#10B981" }]}>94%</Text>
                      <Text style={styles.supervisionMetricLbl}>Tỷ lệ nhận việc</Text>
                    </View>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={[styles.supervisionMetricVal, { color: "#DFB76C" }]}>5.5 Tỷ</Text>
                      <Text style={styles.supervisionMetricLbl}>Doanh số CRM</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: OPPORTUNITIES (Cơ hội B2B)                                   */}
            {/* ================================================================= */}
            {detailTab === "opportunities" && (
              <View style={styles.opportunitiesDetailSection}>
                {opportunities.map((opp) => (
                  <View
                    key={opp.id}
                    style={[
                      styles.opportunityCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.oppTopRow}>
                      <View style={styles.oppBadge}>
                        <Text style={styles.oppBadgeText}>{opp.category}</Text>
                      </View>
                      <Text style={styles.oppDaysLeft}>{opp.daysLeft}</Text>
                    </View>

                    <Text style={[styles.oppTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      {opp.title}
                    </Text>

                    <View style={styles.oppOrgRow}>
                      <Building2 size={13} color="#94A3B8" />
                      <Text style={styles.oppOrgText}>{opp.organization}</Text>
                    </View>

                    <View
                      style={[
                        styles.oppFooterRow,
                        { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                      ]}
                    >
                      <View>
                        <Text style={styles.oppValueLabel}>Giá trị dự kiến</Text>
                        <Text style={styles.oppValueText}>{opp.dealValue}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.oppConnectBtn}
                        onPress={() => {
                          setSelectedOppForMeeting(opp);
                          setProposeMeetingVisible(true);
                        }}
                      >
                        <LinearGradient
                          colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                          style={styles.oppConnectGrad}
                        >
                          <Handshake size={13} color="#050C15" />
                          <Text style={styles.oppConnectText}>Đề xuất gặp mặt</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: NEWS (Tin tức & Bài viết)                                    */}
            {/* ================================================================= */}
            {detailTab === "news" && (
              <View style={styles.newsSection}>
                {/* Header "+ Đăng bài viết" */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={[styles.sectionHeaderSmall, { marginBottom: 0 }]}>
                    BẢN TIN & THÔNG BÁO ({newsList.length})
                  </Text>
                  <TouchableOpacity
                    style={{ borderRadius: 12, overflow: "hidden" }}
                    onPress={() => setCreateNewsVisible(true)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 5 }}
                    >
                      <Plus size={13} color="#050C15" strokeWidth={2.5} />
                      <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#050C15" }}>Đăng bài</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {newsList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.newsCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      setSelectedNews(item);
                      setNewsDetailVisible(true);
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.newsAuthorRow}>
                      <Image source={{ uri: item.authorAvatar }} style={styles.newsAuthorAvatar} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.newsAuthorName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                          {item.authorName}
                        </Text>
                        <Text style={styles.newsAuthorMeta}>
                          {item.authorTitle} · {item.timeAgo}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.newsTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={3} style={[styles.newsContent, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                      {item.content}
                    </Text>

                    {item.imageUrl && (
                      <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    )}

                    <View
                      style={[
                        styles.newsFooterRow,
                        { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          setNewsList((prev) =>
                            prev.map((n) =>
                              n.id === item.id ? { ...n, likes: n.likes + 1 } : n
                            )
                          );
                        }}
                      >
                        <Star size={14} color="#DFB76C" />
                        <Text style={styles.newsStatText}>{item.likes} Thích</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          setSelectedNews(item);
                          setNewsDetailVisible(true);
                        }}
                      >
                        <MessageSquare size={14} color="#94A3B8" />
                        <Text style={styles.newsStatText}>{item.comments} Thảo luận</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          Share.share({
                            title: item.title,
                            message: `${item.title}\n\nXem bản tin trên ViOne B2B Network:\nhttps://vione.vn/news/${item.id}`,
                          });
                        }}
                      >
                        <Share2 size={13} color="#D8B282" />
                        <Text style={styles.newsStatText}>Chia sẻ</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: EVENTS (Lịch họp & Sự kiện)                                  */}
            {/* ================================================================= */}
            {detailTab === "events" && (
              <View style={styles.eventsSection}>
                {events.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.upcomingEventCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.eventDateBox}>
                      <Text style={styles.eventMonthText}>THÁNG 10</Text>
                      <Text style={styles.eventDayText}>
                        {ev.startsAt.split(" ")[0].split("-")[2] || "15"}
                      </Text>
                    </View>

                    <View style={styles.eventInfoCol}>
                      <Text
                        numberOfLines={1}
                        style={[styles.eventTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                      >
                        {ev.title}
                      </Text>
                      <View style={styles.eventMetaRow}>
                        <Clock size={12} color="#D8B282" />
                        <Text style={styles.eventMetaText}>{ev.startsAt}</Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text numberOfLines={1} style={styles.eventMetaText}>
                          {ev.location}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.eventRegisterBtn,
                        ev.isRegistered && styles.eventRegisteredBtn,
                      ]}
                      onPress={() => handleRegisterEvent(ev)}
                    >
                      <Text
                        style={[
                          styles.eventRegisterBtnText,
                          ev.isRegistered && styles.eventRegisteredBtnText,
                        ]}
                      >
                        {ev.isRegistered ? "Đã đ.ký" : "Đăng ký"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: MEMBERS (Danh bạ đối tác / Hội viên)                         */}
            {/* ================================================================= */}
            {detailTab === "members" && (
              <View style={styles.membersSection}>
                {INITIAL_MEMBERS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      setSelectedMember({
                        id: m.id,
                        name: m.name,
                        title: m.title,
                        company: m.company,
                        phone: m.phone,
                        email: m.email,
                        avatarUrl: m.avatarUrl,
                        role: m.role,
                      });
                      setMemberSheetVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: m.avatarUrl }} style={styles.memberAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                          {m.name}
                        </Text>
                        {m.role === "admin" && (
                          <View style={styles.adminRolePill}>
                            <Text style={styles.adminRoleText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberTitle}>{m.title}</Text>
                      <Text numberOfLines={1} style={styles.memberCompany}>
                        {m.company}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => {
                        setSelectedMember({
                          id: m.id,
                          name: m.name,
                          title: m.title,
                          company: m.company,
                          phone: m.phone,
                          email: m.email,
                          avatarUrl: m.avatarUrl,
                          role: m.role,
                        });
                        setMemberSheetVisible(true);
                      }}
                    >
                      <MessageSquare size={16} color="#D8B282" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </>
      )}

      {/* ========================================================================= */}
      {/* ALL MODALS (Aligned 100% with PWA)                                        */}
      {/* ========================================================================= */}

      {/* Modal Tạo cộng đồng mới */}
      <CreateCommunityGroupModal
        visible={createCommunityVisible}
        onClose={() => setCreateCommunityVisible(false)}
        onGroupCreated={(newGroup) => {
          const mapped: CommunityDetailModel = {
            id: newGroup.id,
            name: newGroup.name,
            shortDescription: newGroup.description,
            description: newGroup.description,
            communityType: "b2b_networking",
            memberCount: 1,
            viewerRole: "admin",
            isMember: true,
            upcomingEventsCount: 0,
            openOpportunityCount: 0,
            canEdit: true,
          };
          setCommunities((prev) => [mapped, ...prev]);
        }}
      />

      {/* Modal Chỉnh sửa cộng đồng */}
      {currentCommunity && (
        <EditCommunityModal
          visible={editCommunityVisible}
          onClose={() => setEditCommunityVisible(false)}
          communityId={currentCommunity.id}
          currentName={currentCommunity.name}
          currentTagline={currentCommunity.shortDescription}
          currentAbout={currentCommunity.description}
          currentLogoUrl={currentCommunity.logoUrl}
          currentBannerUrl={currentCommunity.bannerUrl}
          currentType={currentCommunity.communityType}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Modal Chia sẻ sự kiện */}
      {currentCommunity && (
        <ShareEventModal
          visible={shareEventVisible}
          onClose={() => setShareEventVisible(false)}
          communityId={currentCommunity.id}
          communityName={currentCommunity.name}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Modal Giao việc nội bộ */}
      {currentCommunity && (
        <AssignTaskModal
          visible={assignTaskVisible}
          onClose={() => setAssignTaskVisible(false)}
          communityId={currentCommunity.id}
          onTaskCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
          }}
        />
      )}

      {/* Modal Tạo cơ hội mới */}
      <CreateOpportunityModal
        visible={createOppVisible}
        onClose={() => setCreateOppVisible(false)}
        onCreate={(newOpp) => {
          setOpportunities((prev) => [newOpp, ...prev]);
        }}
      />

      {/* Modal Đề xuất gặp mặt 1-1 */}
      {selectedOppForMeeting && (
        <ProposeOpportunityMeetingModal
          visible={proposeMeetingVisible}
          onClose={() => {
            setProposeMeetingVisible(false);
            setSelectedOppForMeeting(null);
          }}
          opportunityId={selectedOppForMeeting.id}
          opportunityTitle={selectedOppForMeeting.title}
          posterName={selectedOppForMeeting.organization}
          onProposed={() => {
            Alert.alert(
              "Thành công",
              `Đã gửi đề xuất gặp mặt 1-1 cho dự án "${selectedOppForMeeting.title}"!`
            );
          }}
        />
      )}

      {/* Modal Chi tiết sự kiện */}
      <EventDetailModal
        visible={eventModalVisible}
        onClose={() => {
          setEventModalVisible(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onRegisterToggle={(eventId) => {
          if (selectedEvent) {
            handleRegisterEvent(selectedEvent);
          }
        }}
      />

      {/* Modal Chi tiết cơ hội */}
      <OpportunityDetailModal
        visible={oppModalVisible}
        onClose={() => {
          setOppModalVisible(false);
          setSelectedOpp(null);
        }}
        opportunity={selectedOpp}
        onApplyOpportunity={(oppId) => {
          if (selectedOpp) {
            handleInterestOpp(selectedOpp);
          }
        }}
      />

      {/* Modal Thông báo thời gian thực */}
      <BusinessNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        navigation={navigation}
      />

      {/* Modal Đăng bài viết / Tin tức */}
      <CreateNewsModal
        visible={createNewsVisible}
        onClose={() => setCreateNewsVisible(false)}
        communityId={currentCommunity?.id}
        onPostCreated={(newPost: any) => {
          setNewsList((prev) => [
            {
              id: newPost.id,
              authorName: newPost.authorName,
              authorTitle: newPost.authorTitle,
              authorAvatar: newPost.authorAvatar,
              timeAgo: "Vừa xong",
              title: newPost.title,
              content: newPost.content,
              imageUrl: newPost.imageUrl,
              likes: 0,
              comments: 0,
            },
            ...prev,
          ]);
        }}
      />

      {/* Modal Chi tiết tin tức / bài viết */}
      <CommunityNewsDetailModal
        visible={newsDetailVisible}
        news={selectedNews}
        onClose={() => {
          setNewsDetailVisible(false);
          setSelectedNews(null);
        }}
        onToggleLike={(newsId) => {
          setNewsList((prev) =>
            prev.map((n) =>
              n.id === newsId ? { ...n, likes: n.likes + 1 } : n
            )
          );
        }}
      />

      {/* Modal Mời thành viên tham gia cộng đồng */}
      <CommunityInviteModal
        visible={inviteModalVisible}
        communityId={currentCommunity?.id}
        communityName={currentCommunity?.name || "Cộng đồng Doanh nhân ViOne"}
        communityDescription={currentCommunity?.shortDescription}
        onClose={() => setInviteModalVisible(false)}
      />

      {/* BottomSheet Danh thiếp đối tác / thành viên */}
      <MemberCardBottomSheet
        visible={memberSheetVisible}
        member={selectedMember}
        onClose={() => {
          setMemberSheetVisible(false);
          setSelectedMember(null);
        }}
      />
    </SafeAreaView>
  );
};

// ==========================================
// Stylesheet (Luxury Obsidian & Gold Palette)
// ==========================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#DFB76C",
  },
  logoText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#050C15",
    letterSpacing: 0.8,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: "500",
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
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  createCommunityBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  createCommunityGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createCommunityText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#050C15",
  },
  tabsWrapper: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.2)",
  },
  tabsScroll: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 8,
  },
  tabItem: {
    paddingBottom: 4,
    position: "relative",
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 13.5,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -8,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#DFB76C",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  searchResultCount: {
    fontSize: 12,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 12.5,
    marginTop: 4,
    textAlign: "center",
  },
  communitiesList: {
    gap: 16,
  },
  communityCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBannerWrap: {
    height: 110,
    width: "100%",
    position: "relative",
  },
  cardBannerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardBannerGrad: {
    position: "absolute",
    inset: 0,
  },
  cardCategoryBadge: {
    position: "absolute",
    top: 10,
    left: 12,
  },
  companyPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderWidth: 1,
    borderColor: "#DFB76C",
  },
  companyPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#DFB76C",
  },
  b2bPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  b2bPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
  },
  cardRoleBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardRoleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DFB76C",
  },
  cardBody: {
    padding: 14,
    paddingTop: 0,
  },
  cardAvatarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: -24,
    gap: 12,
  },
  cardAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#121824",
    backgroundColor: "#121824",
  },
  cardNameCol: {
    flex: 1,
    paddingTop: 28,
  },
  nameChevronRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    flex: 1,
    marginRight: 6,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  attendeesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarStack: {
    flexDirection: "row",
  },
  stackAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#121824",
  },
  membersCountText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DFB76C",
  },
  metricBadgesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricBadgeGold: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  metricBadgeGoldText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#DFB76C",
  },
  metricBadgeSlate: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  metricBadgeSlateText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#94A3B8",
  },
  cardActionsGrid: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    overflow: "hidden",
  },
  actionCol: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionColText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DFB76C",
  },
  upcomingEventsList: {
    gap: 10,
  },
  upcomingEventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  eventDateBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventMonthText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#DFB76C",
  },
  eventDayText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#DFB76C",
  },
  eventInfoCol: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  eventMetaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  eventRegisterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#DFB76C",
  },
  eventRegisteredBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  eventRegisterBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050C15",
  },
  eventRegisteredBtnText: {
    color: "#94A3B8",
  },
  opportunitiesList: {
    gap: 12,
  },
  opportunityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  oppTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  oppBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  oppBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DFB76C",
  },
  oppDaysLeft: {
    fontSize: 11,
    color: "#94A3B8",
  },
  oppTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  oppOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  oppOrgText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  oppFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  oppValueLabel: {
    fontSize: 10,
    color: "#94A3B8",
  },
  oppValueText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#DFB76C",
  },
  oppConnectBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  oppConnectGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  oppConnectText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
  adminEntryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
  },
  adminEntryTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  adminEntrySubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  historyPanel: {
    marginTop: 10,
  },
  historyCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  historyTime: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  pendingPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#DFB76C",
  },

  // ==========================================
  // LEVEL 2 DETAIL STYLES
  // ==========================================
  detailTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DFB76C",
  },
  detailTopTitle: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  shareButton: {
    padding: 4,
  },
  detailBannerWrap: {
    height: 150,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  detailBannerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  detailBannerGrad: {
    position: "absolute",
    inset: 0,
  },
  detailCategoryPill: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  detailHeaderSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: -30,
    paddingHorizontal: 4,
    gap: 12,
  },
  detailAvatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#DFB76C",
    backgroundColor: "#121824",
  },
  detailInfoCol: {
    flex: 1,
    paddingTop: 34,
  },
  detailNameText: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  detailShortDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  badgesActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  badgesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  editCommunityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
    borderWidth: 1,
    borderColor: "#DFB76C",
  },
  editCommunityText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DFB76C",
  },
  actionButtons3Col: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#050C15",
  },
  joinBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    backgroundColor: "rgba(216, 178, 130, 0.08)",
    marginTop: 12,
  },
  joinBannerTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  joinBannerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  joinNowBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  joinNowGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinNowText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#050C15",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#DFB76C",
  },
  statLabel: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  detailTabsWrapper: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.2)",
  },
  detailTabsScroll: {
    flexDirection: "row",
    gap: 14,
    paddingBottom: 8,
  },
  detailTabItem: {
    paddingBottom: 4,
    position: "relative",
  },
  detailTabItemActive: {},
  detailTabLabel: {
    fontSize: 13,
  },
  detailActiveIndicator: {
    position: "absolute",
    bottom: -8,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#DFB76C",
  },

  // ==========================================
  // TASKS SECTION STYLES
  // ==========================================
  tasksSection: {
    marginTop: 14,
    gap: 12,
  },
  tasksKpiBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  tasksKpiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tasksIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  tasksBannerTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  tasksBannerSubtitle: {
    fontSize: 10.5,
    color: "#DFB76C",
    marginTop: 1,
  },
  tasksNewBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tasksNewGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tasksNewBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#050C15",
  },
  tasks4KpiGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  kpiTileBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  kpiGoldBox: {
    backgroundColor: "rgba(223, 183, 108, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.25)",
  },
  kpiBlueBox: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  kpiGreenBox: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  kpiTileValue: {
    fontSize: 15,
    fontWeight: "900",
  },
  kpiTileLabel: {
    fontSize: 9.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  taskFilterScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  taskFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  taskFilterPillText: {
    fontSize: 11.5,
  },
  tasksListContainer: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  taskCardAssignedGlow: {
    shadowColor: "#DFB76C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  taskCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskPriorityGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  priorityUrgentText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#EF4444",
  },
  priorityHigh: {
    backgroundColor: "rgba(223, 183, 108, 0.15)",
    borderColor: "rgba(223, 183, 108, 0.3)",
  },
  priorityHighText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#DFB76C",
  },
  priorityMedium: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  priorityMediumText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  priorityText: {},
  taskDeadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDeadlineText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  statusAssignedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.4)",
  },
  statusAssignedText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#DFB76C",
  },
  statusProgressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  statusProgressText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#38BDF8",
  },
  statusCompletedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusCompletedText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#10B981",
  },
  taskTitleText: {
    fontSize: 14.5,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 2,
  },
  taskDescText: {
    fontSize: 12,
    lineHeight: 17,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  taskAssigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskCustomerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
  },
  taskMetaMuted: {
    fontSize: 11.5,
    color: "#94A3B8",
  },
  taskMetaBold: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  acceptedAtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  acceptedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  acceptedAtText: {
    fontSize: 10.5,
    color: "#10B981",
    fontWeight: "600",
  },
  taskActionBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  acceptPromptText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DFB76C",
  },
  acceptTaskBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  acceptTaskGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  acceptTaskBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#050C15",
    letterSpacing: 0.3,
  },
  inProgressPromptText: {
    fontSize: 11,
    color: "#38BDF8",
  },
  completeTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#DFB76C",
  },
  completeTaskBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050C15",
  },
  completedStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedStatusText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#10B981",
  },

  // Supervision styles
  supervisionSection: {
    marginTop: 14,
  },
  supervisionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  supervisionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    marginBottom: 12,
  },
  supervisionMetricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  supervisionMetricCol: {
    flex: 1,
    alignItems: "center",
  },
  supervisionMetricVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  supervisionMetricLbl: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },

  // Opportunities Detail Styles
  opportunitiesDetailSection: {
    marginTop: 14,
    gap: 12,
  },

  sectionHeaderSmall: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#DFB76C",
  },

  // News styles
  newsSection: {
    marginTop: 14,
    gap: 12,
  },
  newsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  newsAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  newsAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  newsAuthorName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  newsAuthorMeta: {
    fontSize: 11,
    color: "#94A3B8",
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  newsContent: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  newsImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    resizeMode: "cover",
  },
  newsFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  newsStatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsStatText: {
    fontSize: 11.5,
    color: "#94A3B8",
  },

  // Events styles
  eventsSection: {
    marginTop: 14,
    gap: 10,
  },

  // Members styles
  membersSection: {
    marginTop: 14,
    gap: 10,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  adminRolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: "rgba(223, 183, 108, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.4)",
  },
  adminRoleText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#DFB76C",
  },
  memberTitle: {
    fontSize: 11.5,
    color: "#DFB76C",
    marginTop: 1,
  },
  memberCompany: {
    fontSize: 11,
    color: "#94A3B8",
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
