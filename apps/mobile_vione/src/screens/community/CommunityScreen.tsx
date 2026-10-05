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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  ChevronRight,
  Award,
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
  Flame,
  Crown,
  Star,
  ScanLine,
  Filter,
  Sun,
  Moon,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { CommunityItem, B2BEvent } from "../../types";
import { CreateCommunityGroupModal } from "../../components/CreateCommunityGroupModal";
import { EventDetailModal } from "../../components/EventDetailModal";
import {
  OpportunityDetailModal,
  CommunityOpportunityItem,
} from "../../components/OpportunityDetailModal";
import { CreateOpportunityModal } from "../../components/CreateOpportunityModal";
import { CardScanReviewModal, CustomerLeadTier } from "../../components/CardScanReviewModal";
import { ScheduleMeetingModal } from "../../components/ScheduleMeetingModal";
import { communityApi, eventsApi, opportunityApi, customerApi, B2BCustomerData } from "../../api";

export interface CustomerLeadItem {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  dealValue: string;
  tier: CustomerLeadTier;
  stage: "prospect" | "qualified" | "proposal" | "negotiation";
  assignedStaff: string;
  notes: string;
  nextAction: string;
  source: string;
}

const MOCK_LEADS: CustomerLeadItem[] = [
  {
    id: "lead-1",
    name: "Nguyễn Văn Hùng",
    title: "Tổng Giám Đốc",
    company: "Tập Đoàn Đầu Tư Hạ Tầng Hùng Cường",
    phone: "0918 889 999",
    email: "hung.nguyen@hungcuonggroup.vn",
    dealValue: "1.5 Tỷ VNĐ",
    tier: "hot",
    stage: "prospect",
    assignedStaff: "Trần Minh Hoàng (Trưởng phòng KD)",
    notes: "Đã quét danh thiếp tại sự kiện. Cần báo giá ViOne ERP và hệ thống danh thiếp số 250 tài khoản.",
    nextAction: "Hẹn gặp 1-1 tại Landmark 81 chiều nay",
    source: "Card Scan AI OCR",
  },
  {
    id: "lead-2",
    name: "Phạm Hải Yến",
    title: "Chủ Tịch HĐQT",
    company: "Chuỗi Khách Sạn & Nghỉ Dưỡng Grand Sapphire",
    phone: "0903 222 111",
    email: "yen.pham@grandsapphire.vn",
    dealValue: "3.2 Tỷ VNĐ",
    tier: "vip",
    stage: "proposal",
    assignedStaff: "Lê Thu Hà (Chuyên viên CSKH)",
    notes: "Nhu cầu số hóa quản trị tài sản và thẻ hội viên VIP cho 5 cụm resort Đà Nẵng - Phú Quốc.",
    nextAction: "Gửi bản trình diễn tính năng và dự thảo hợp đồng",
    source: "Cộng đồng ViOne",
  },
  {
    id: "lead-3",
    name: "Vũ Quang Vinh",
    title: "Giám Đốc Cung Ứng Toàn Cầu",
    company: "Tập Đoàn Logistics & Xuất Nhập Khẩu Vinh Phát",
    phone: "0938 777 666",
    email: "vinh.vu@vinhphatlogistics.com",
    dealValue: "800 Triệu VNĐ",
    tier: "care24h",
    stage: "negotiation",
    assignedStaff: "Trần Minh Hoàng (Trưởng phòng KD)",
    notes: "Cần care gấp trong 24h: Khách hàng muốn chốt hợp đồng trước thứ 2 tuần tới.",
    nextAction: "Gọi điện chốt phương án chiết khấu thanh toán",
    source: "Đối tác kết nối B2B",
  },
  {
    id: "lead-4",
    name: "Lê Hoàng Long",
    title: "Phó Tổng Giám Đốc Công Nghệ",
    company: "Công Ty Cổ Phần Năng Lượng Tái Tạo Solaria",
    phone: "0977 444 333",
    email: "long.le@solariaenergy.vn",
    dealValue: "650 Triệu VNĐ",
    tier: "featured",
    stage: "prospect",
    assignedStaff: "Lê Thu Hà (Chuyên viên CSKH)",
    notes: "Khách hàng nổi bật tại Diễn đàn Đầu tư B2B, quan tâm mở rộng chuỗi cung ứng điện mặt trời.",
    nextAction: "Xếp lịch cà phê CEO 1-1",
    source: "Sự kiện B2B",
  },
];

const MOCK_OPPORTUNITIES: CommunityOpportunityItem[] = [
  {
    id: "opp-1",
    title: "Dự án Tổng thầu EPC Điện Mặt Trời Áp Mái KCN VSIP",
    organization: "Tập Đoàn Năng Lượng Xanh ViOne",
    communityName: "ViOne C-Level Enterprise Hub",
    dealValue: "15 Tỷ VNĐ",
    category: "Đầu Tư & Xây Dựng",
    daysLeft: "Còn 5 ngày",
    interested: false,
  },
  {
    id: "opp-2",
    title: "Triển khai Hệ thống Quản trị ERP & AI Data Warehouse Doanh nghiệp",
    organization: "Công Ty Cổ Phần F-Solutions",
    communityName: "Liên Minh Doanh Nghiệp Công Nghệ & AI",
    dealValue: "850 Triệu VNĐ",
    category: "Công Nghệ & AI",
    daysLeft: "Còn 12 ngày",
    interested: true,
  },
  {
    id: "opp-3",
    title: "Thiết kế & Thi công Chuỗi Văn Phòng Hạng A Tòa Nhà Keangnam",
    organization: "LuxVillas Architecture & Interior",
    communityName: "CLB Doanh Nhân ViOne Global Leaders",
    dealValue: "5.2 Tỷ VNĐ",
    category: "Thiết Kế Nội Thất",
    daysLeft: "Còn 8 ngày",
    interested: false,
  },
];

const MOCK_COMMUNITIES: CommunityItem[] = [
  {
    id: "c-1",
    name: "CLB Doanh Nhân ViOne Global Leaders",
    description: "Cộng đồng quy tụ các Chủ tịch, CEO & Nhà sáng lập doanh nghiệp tiên phong kết nối & phát triển bền vững.",
    memberCount: 320,
    isMember: true,
    role: "Thành viên Doanh nghiệp chính thức",
  },
  {
    id: "c-2",
    name: "ViOne C-Level Enterprise Hub",
    description: "Liên minh Doanh nghiệp Chuyển đổi số & Xúc tiến thương mại đa ngành toàn quốc.",
    memberCount: 450,
    isMember: true,
    role: "Ban Điều Hành",
  },
  {
    id: "c-3",
    name: "Diễn Đàn Đầu Tư B2B Việt Nam",
    description: "Mạng lưới kết nối các Quỹ đầu tư, Vốn tư nhân và Doanh nghiệp vừa & lớn mở rộng quy mô.",
    memberCount: 310,
    isMember: false,
  },
  {
    id: "c-4",
    name: "Liên Minh Doanh Nghiệp Công Nghệ & AI Việt Nam",
    description: "Tổ chức xúc tiến ứng dụng Trí tuệ nhân tạo và Tự động hóa quy trình cho doanh nghiệp quy mô lớn.",
    memberCount: 280,
    isMember: true,
    role: "Thành viên Doanh nghiệp chính thức",
  },
];

const MOCK_EVENTS: B2BEvent[] = [
  {
    id: "e-1",
    title: "Đại Hội Thượng Đỉnh Giao Thương Doanh Nhân 2026",
    startsAt: "2026-10-15 08:30",
    location: "Trung Tâm Hội Nghị Quốc Gia, Hà Nội",
    category: "Đại Hội Toàn Thể",
    isRegistered: true,
    registeredCount: 185,
  },
  {
    id: "e-2",
    title: "Workshop Chuyên Đề: Ứng Dụng AI & Tự Động Hóa Vận Hành Doanh Nghiệp",
    startsAt: "2026-10-22 14:00",
    location: "Khách Sạn Lotte Hà Nội",
    category: "Hội Thảo Chuyên Đề",
    isRegistered: false,
    registeredCount: 92,
  },
  {
    id: "e-3",
    title: "Coffee CEO: Kết Nối 1-on-1 & Thảo Luận Cơ Hội Đầu Tư Quý 4",
    startsAt: "2026-10-28 09:00",
    location: "ViOne Executive Lounge",
    category: "Gặp Gỡ Định Kỳ",
    isRegistered: false,
    registeredCount: 45,
  },
];

type CommunityTab = "all" | "joined" | "admin" | "events" | "leads";

export const CommunityScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<CommunityTab>("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<CommunityItem[]>(MOCK_COMMUNITIES);
  const [events, setEvents] = useState<B2BEvent[]>(MOCK_EVENTS);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);
  const [opportunities, setOpportunities] = useState<CommunityOpportunityItem[]>(MOCK_OPPORTUNITIES);
  const [selectedEvent, setSelectedEvent] = useState<B2BEvent | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<CommunityOpportunityItem | null>(null);
  const [oppModalVisible, setOppModalVisible] = useState(false);
  const [createOppVisible, setCreateOppVisible] = useState(false);
  const [cardScanVisible, setCardScanVisible] = useState(false);
  const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<CustomerLeadItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // CRM Leads Pipeline State
  const [leadsList, setLeadsList] = useState<CustomerLeadItem[]>(MOCK_LEADS);
  const [leadTierFilter, setLeadTierFilter] = useState<"all" | CustomerLeadTier>("all");

  const loadData = async () => {
    try {
      // 1. Communities
      const commRes = await communityApi.getMyCommunities();
      const commList = Array.isArray(commRes?.data) ? commRes.data : [];
      if (commList.length > 0) {
        setCommunities(commList);
      }
    } catch (e) {
      // fallback
    }

    try {
      // 2. Events
      const eventsRes = await eventsApi.getEvents();
      const eventsList = Array.isArray(eventsRes?.data) ? eventsRes.data : [];
      if (eventsList.length > 0) {
        setEvents(eventsList);
      }
    } catch (e) {
      // fallback
    }

    try {
      // 3. Opportunities
      const oppRes = await opportunityApi.getOpportunities();
      const oppList = Array.isArray(oppRes?.data) ? oppRes.data : [];
      if (oppList.length > 0) {
        setOpportunities(
          oppList.map((op: any, idx: number) => ({
            id: op.id || `opp-${idx}`,
            title: op.title || "Cơ hội kinh doanh B2B",
            organization: op.organization || op.companyName || "Doanh nghiệp ViOne",
            communityName: op.communityName || "Cộng đồng ViOne",
            dealValue: op.budget ? `${op.budget.toLocaleString("vi-VN")} đ` : (op.dealValue || "Thỏa thuận"),
            category: op.category || "Hợp tác kinh doanh",
            daysLeft: op.duration || "Còn 7 ngày",
            interested: !!op.interested,
          }))
        );
      }
    } catch (e) {
      // fallback
    }

    try {
      // 4. CRM Customers & Leads
      const custRes = await customerApi.getCustomers();
      const custList = Array.isArray(custRes?.data) ? custRes.data : [];
      if (custList.length > 0) {
        const mapped = custList.map((c: any, idx: number) => {
          const tierStr = (c.tags || []).join(" ").toLowerCase();
          const tier: CustomerLeadTier = tierStr.includes("hot")
            ? "hot"
            : tierStr.includes("vip")
            ? "vip"
            : tierStr.includes("24h")
            ? "care24h"
            : "featured";

          return {
            id: c.id || `lead-api-${idx}`,
            name: c.name || c.displayName || c.contactPerson || "Khách hàng B2B",
            title: c.title || "Lãnh đạo Doanh nghiệp",
            company: c.company || c.companyName || "Doanh nghiệp ViOne",
            phone: c.phone || "0900 000 000",
            email: c.email || "partner@vione.vn",
            dealValue: c.dealValue || (c.expectedValue ? `${Number(c.expectedValue).toLocaleString("vi-VN")} đ` : "500 Triệu VNĐ"),
            tier: tier,
            stage: (c.stage as any) || "prospect",
            assignedStaff: c.assignedStaff || "Trần Minh Hoàng (Trưởng phòng KD)",
            notes: c.notes || c.note || "Nhu cầu hợp tác phát triển thị trường",
            nextAction: c.nextAction || "Liên hệ tư vấn trong 24h",
            source: c.sourceLabel || "Card Scan AI OCR",
          };
        });
        setLeadsList(mapped);
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  const handleRegisterEvent = async (id: string, title: string) => {
    try {
      await eventsApi.registerEvent(id);
    } catch (e) {
      // Silent error or fallback
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isRegistered: true } : e))
    );
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký tham gia: ${title}. Thẻ vé điện tử QR đã được cấp.`);
  };

  const handleInterestOpportunity = async (id: string, title: string) => {
    try {
      await opportunityApi.expressInterest(id, "high");
    } catch (e) {
      // Silent error or fallback
    }
    setOpportunities((prev) =>
      prev.map((op) => (op.id === id ? { ...op, interested: true } : op))
    );
    Alert.alert("Quan tâm cơ hội", `Đã gửi hồ sơ năng lực và thông tin kết nối tới ban quản trị dự án: ${title}`);
  };

  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      if (activeTab === "joined" && !c.isMember) return false;
      if (activeTab === "admin" && c.role !== "Ban Điều Hành") return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    });
  }, [communities, activeTab, searchQuery]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {/* 1. Header Thương Hiệu ViOne */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
        ]}
      >
        <View style={styles.headerBrand}>
          <Image
            source={require("../../../assets/vione-wordmark.png")}
            style={styles.logoWordmark}
            resizeMode="contain"
          />
          <Text style={[styles.headerGreeting, { color: isDark ? "#94A3B8" : "#64748B" }]}>
            {getGreeting()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.bellBtn,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                borderColor: isDark ? "rgba(216, 178, 130, 0.22)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? (
              <Sun size={19} color="#D8B282" strokeWidth={1.8} />
            ) : (
              <Moon size={19} color="#A3703C" strokeWidth={1.8} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bellBtn,
              {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                borderColor: isDark ? "rgba(216, 178, 130, 0.22)" : "rgba(216, 178, 130, 0.3)",
              },
            ]}
            onPress={() => Alert.alert("Thông báo", "Bạn có 2 thông báo sự kiện cộng đồng mới.")}
            activeOpacity={0.7}
          >
            <Bell size={20} color={isDark ? "#D8B282" : "#A3703C"} strokeWidth={1.8} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.headerDivider,
          { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#E2E8F0" },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* 2. Tiêu Đề Phân Hệ & Nút Tạo Liên Minh */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.screenTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                Cộng đồng
              </Text>
              <Text style={[styles.screenSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Thành viên · Sự kiện · Cơ hội
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createGroupBtn}
              onPress={() => setCreateGroupVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createGroupGradient}
              >
                <Plus size={15} color="#050C15" strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.createGroupBtnText}>Tạo nhóm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={16} color="#D8B282" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm cộng đồng, sự kiện, ngành nghề..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Horizontal Tabs (Khớp 100% CommunityHome) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {[
            { id: "leads", label: "🎯 Khách hàng tiềm năng & Cần care" },
            { id: "all", label: "Tất cả cộng đồng" },
            { id: "joined", label: "Đã tham gia" },
            { id: "admin", label: "Ban Điều Hành" },
            { id: "events", label: "Sự kiện B2B" },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabPill, activeTab === t.id && styles.tabPillActive]}
              onPress={() => setActiveTab(t.id as any)}
            >
              <Text
                style={[
                  styles.tabPillText,
                  activeTab === t.id && styles.tabPillTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 5. Content theo Tab */}
        {activeTab === "leads" ? (
          <View style={styles.leadsSection}>
            {/* Hero Banner: Trung Tâm Chăm Sóc Khách Hàng Tiềm Năng */}
            <View style={[styles.leadHeroBanner, { backgroundColor: isDark ? "#141824" : "#F1F5F9", borderColor: isDark ? "rgba(216, 178, 130, 0.35)" : "rgba(163, 112, 60, 0.4)" }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Flame size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={[styles.leadHeroTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    PIPELINE KHÁCH HÀNG & ĐỐI TÁC CẦN CARE
                  </Text>
                </View>
                <Text style={[styles.leadHeroSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  {leadsList.length} khách hàng tiềm năng · 4 Hot Leads · 6.15 Tỷ VNĐ giá trị dự kiến
                </Text>
              </View>

              <TouchableOpacity
                style={styles.scanLeadBtn}
                onPress={() => setCardScanVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scanLeadGradient}
                >
                  <ScanLine size={13} color="#050C15" style={{ marginRight: 4 }} />
                  <Text style={styles.scanLeadBtnText}>Quét Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Bộ Lọc Tier: Hot Lead / VIP / Cần care 24h / Nổi bật */}
            <View style={{ marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { id: "all", label: "Tất cả khách hàng" },
                  { id: "hot", label: "⭐ Hot Lead" },
                  { id: "vip", label: "💎 VIP C-Level" },
                  { id: "care24h", label: "🎯 Cần care 24h" },
                  { id: "featured", label: "🌟 Nổi bật" },
                ].map((tierItem) => {
                  const active = leadTierFilter === tierItem.id;
                  return (
                    <TouchableOpacity
                      key={tierItem.id}
                      style={[
                        styles.tierFilterChip,
                        { borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)", backgroundColor: isDark ? "#181D2A" : "#FFFFFF" },
                        active && {
                          backgroundColor: isDark ? "rgba(216, 178, 130, 0.22)" : "#FEF3C7",
                          borderColor: isDark ? "#D8B282" : "#A3703C",
                        },
                      ]}
                      onPress={() => setLeadTierFilter(tierItem.id as any)}
                    >
                      <Text
                        style={[
                          styles.tierFilterChipText,
                          { color: isDark ? "#94A3B8" : "#64748B" },
                          active && { color: isDark ? "#D8B282" : "#A3703C", fontWeight: "700" },
                        ]}
                      >
                        {tierItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Danh Sách Khách Hàng Tiềm Năng */}
            <View style={{ gap: 12 }}>
              {leadsList
                .filter((l) => leadTierFilter === "all" || l.tier === leadTierFilter)
                .filter((l) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase().trim();
                  return (
                    l.name.toLowerCase().includes(q) ||
                    l.company.toLowerCase().includes(q) ||
                    l.notes.toLowerCase().includes(q)
                  );
                })
                .map((lead) => (
                  <View
                    key={lead.id}
                    style={[
                      styles.leadCard,
                      {
                        backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                        borderColor: lead.tier === "hot" ? "#EF4444" : lead.tier === "vip" ? "#F59E0B" : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                      },
                    ]}
                  >
                    {/* Header Lead Card */}
                    <View style={styles.leadCardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={[styles.leadName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>{lead.name}</Text>
                          <View
                            style={[
                              styles.leadTierBadge,
                              lead.tier === "hot" && { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444" },
                              lead.tier === "vip" && { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#F59E0B" },
                              lead.tier === "care24h" && { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" },
                              lead.tier === "featured" && { backgroundColor: "rgba(56, 189, 248, 0.15)", borderColor: "#38BDF8" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.leadTierBadgeText,
                                lead.tier === "hot" && { color: "#EF4444" },
                                lead.tier === "vip" && { color: "#F59E0B" },
                                lead.tier === "care24h" && { color: "#10B981" },
                                lead.tier === "featured" && { color: "#38BDF8" },
                              ]}
                            >
                              {lead.tier === "hot"
                                ? "⭐ HOT LEAD"
                                : lead.tier === "vip"
                                ? "💎 VIP C-LEVEL"
                                : lead.tier === "care24h"
                                ? "🎯 CẦN CARE 24H"
                                : "🌟 NỔI BẬT"}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.leadTitleCompany, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                          {lead.title} · {lead.company}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata Row: Deal Value & PIC */}
                    <View style={[styles.leadMetaBox, { backgroundColor: isDark ? "#12151F" : "#F8FAFC" }]}>
                      <View style={styles.leadMetaCol}>
                        <Text style={[styles.leadMetaLabel, { color: isDark ? "#D8B282" : "#A3703C" }]}>GIÁ TRỊ DEAL DỰ KIẾN</Text>
                        <Text style={[styles.leadMetaVal, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>{lead.dealValue}</Text>
                      </View>
                      <View style={{ width: 1, height: 28, backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" }} />
                      <View style={styles.leadMetaCol}>
                        <Text style={[styles.leadMetaLabel, { color: isDark ? "#D8B282" : "#A3703C" }]}>NHÂN SỰ PHỤ TRÁCH (PIC)</Text>
                        <Text style={[styles.leadMetaVal, { color: isDark ? "#FFFFFF" : "#0F172A" }]} numberOfLines={1}>{lead.assignedStaff}</Text>
                      </View>
                    </View>

                    {/* Nhu cầu & Hành động tiếp theo */}
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.leadNoteText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                        💡 Nhu cầu: {lead.notes}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Clock size={11} color={isDark ? "#D8B282" : "#A3703C"} style={{ marginRight: 4 }} />
                        <Text style={[styles.leadDeadlineText, { color: isDark ? "#D8B282" : "#A3703C" }]}>
                          Hạn chót: {lead.nextAction}
                        </Text>
                      </View>
                    </View>

                    {/* Hành Động Nhanh 1-Chạm: Gọi điện, Nhắn tin, Hẹn 1-1 */}
                    <View style={[styles.leadActionsRow, { borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.06)" }]}>
                      <TouchableOpacity
                        style={[styles.leadActionBtn, { backgroundColor: isDark ? "#12151F" : "#F8FAFC" }]}
                        onPress={() => Alert.alert("Gọi điện", `Đang kết nối tới ${lead.name} qua số ${lead.phone}`)}
                        activeOpacity={0.8}
                      >
                        <Phone size={13} color={isDark ? "#D8B282" : "#A3703C"} style={{ marginRight: 4 }} />
                        <Text style={[styles.leadActionBtnText, { color: isDark ? "#D8B282" : "#A3703C" }]}>Gọi điện</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.leadActionBtn, { backgroundColor: isDark ? "#12151F" : "#F8FAFC" }]}
                        onPress={() => Alert.alert("Nhắn tin", `Mở khung chat ViOne với đối tác ${lead.name}`)}
                        activeOpacity={0.8}
                      >
                        <MessageSquare size={13} color={isDark ? "#D8B282" : "#A3703C"} style={{ marginRight: 4 }} />
                        <Text style={[styles.leadActionBtnText, { color: isDark ? "#D8B282" : "#A3703C" }]}>Nhắn tin</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.leadActionBtn, { backgroundColor: isDark ? "#12151F" : "#F8FAFC" }]}
                        onPress={() => {
                          setSelectedLeadForMeeting(lead);
                          setScheduleMeetingVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Handshake size={13} color={isDark ? "#D8B282" : "#A3703C"} style={{ marginRight: 4 }} />
                        <Text style={[styles.leadActionBtnText, { color: isDark ? "#D8B282" : "#A3703C" }]}>Hẹn 1-1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        ) : activeTab !== "events" ? (
          <View style={styles.communityList}>
            {filteredCommunities.map((c) => (
              <View key={c.id} style={styles.communityCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.clubIconBadge}>
                    <Award size={20} color="#D8B282" />
                  </View>
                  <View style={styles.clubHeaderMeta}>
                    <Text style={styles.clubName}>{c.name}</Text>
                    <View style={styles.memberMetaRow}>
                      <Users size={12} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.memberCountText}>{c.memberCount} Thành viên C-Level</Text>
                      {c.role && (
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleText}>{c.role}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.clubDesc}>{c.description}</Text>

                <View style={styles.clubFooter}>
                  {c.isMember ? (
                    <View style={styles.memberStatus}>
                      <CheckCircle size={14} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={styles.memberStatusText}>Đã tham gia</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() => {
                        setCommunities((prev) =>
                          prev.map((item) => (item.id === c.id ? { ...item, isMember: true } : item))
                        );
                        Alert.alert("Gia nhập", `Đã gửi yêu cầu gia nhập ${c.name}`);
                      }}
                    >
                      <Text style={styles.joinBtnText}>Gia nhập cộng đồng</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => Alert.alert(c.name, c.description || "")}
                  >
                    <Text style={styles.detailBtnText}>Xem ban điều hành</Text>
                    <ChevronRight size={14} color="#D8B282" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Cơ Hội Kinh Doanh B2B Trong Cộng Đồng (Khớp 100% CommunityOpportunitiesSection web) */}
            <View style={styles.opportunitiesSection}>
              <View style={styles.oppSectionHeader}>
                <Text style={styles.oppSectionTitle}>CƠ HỘI KINH DOANH TRONG CỘNG ĐỒNG</Text>
                <TouchableOpacity
                  style={styles.postOppBtn}
                  onPress={() => setCreateOppVisible(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={13} color="#D8B282" style={{ marginRight: 3 }} />
                  <Text style={styles.postOppBtnText}>Đăng cơ hội</Text>
                </TouchableOpacity>
              </View>

              {/* Banner */}
              <View style={styles.oppBanner}>
                <View style={styles.oppBannerIcon}>
                  <Briefcase size={20} color="#D8B282" />
                </View>
                <View style={styles.oppBannerTexts}>
                  <Text style={styles.oppBannerTitle}>
                    {opportunities.length} cơ hội giao thương đang mở
                  </Text>
                  <Text style={styles.oppBannerSubtitle}>
                    Dành riêng cho doanh nghiệp thành viên kết nối & cung ứng
                  </Text>
                </View>
              </View>

              {/* List of Opportunities */}
              <View style={styles.oppList}>
                {opportunities.map((opp) => (
                  <TouchableOpacity
                    key={opp.id}
                    style={styles.oppCard}
                    onPress={() => {
                      setSelectedOpp(opp);
                      setOppModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.oppTitle}>{opp.title}</Text>
                    <Text style={styles.oppMeta}>
                      {opp.category} · {opp.organization} · {opp.communityName}
                    </Text>

                    <View style={styles.oppBottomRow}>
                      <View style={styles.oppLeftInfo}>
                        <View style={styles.dealBadge}>
                          <Text style={styles.dealBadgeText}>{opp.dealValue}</Text>
                        </View>
                        <View style={styles.daysTag}>
                          <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                          <Text style={styles.daysText}>{opp.daysLeft}</Text>
                        </View>
                      </View>

                      {opp.interested ? (
                        <View style={styles.interestedPill}>
                          <Check size={13} color="#D8B282" strokeWidth={2.5} style={{ marginRight: 4 }} />
                          <Text style={styles.interestedPillText}>Đã gửi hồ sơ</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.interestBtn}
                          onPress={() => {
                            setSelectedOpp(opp);
                            setOppModalVisible(true);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.interestBtnText}>Chi tiết & Nộp</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.eventCard}
                onPress={() => {
                  setSelectedEvent(e);
                  setEventModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.eventCategoryRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{e.category}</Text>
                  </View>
                  <View style={styles.dateTag}>
                    <Calendar size={12} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{e.startsAt}</Text>
                  </View>
                </View>

                <Text style={styles.eventTitle}>{e.title}</Text>

                <View style={styles.eventLocationRow}>
                  <MapPin size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                  <Text style={styles.eventLocationText}>{e.location}</Text>
                </View>

                <View style={styles.eventBottomRow}>
                  <View style={styles.registeredCountBadge}>
                    <Text style={styles.registeredCountText}>
                      🔥 {e.registeredCount} Doanh nhân đã đăng ký
                    </Text>
                  </View>

                  {e.isRegistered ? (
                    <TouchableOpacity
                      style={styles.registeredPill}
                      onPress={() => {
                        setSelectedEvent(e);
                        setEventModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={13} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.registeredPillText}>Xem vé QR</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.eventActionBtn}
                      onPress={() => {
                        setSelectedEvent(e);
                        setEventModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.eventActionText}>Đăng ký vé mời</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Khởi Tạo Nhóm / Liên Minh Doanh Nghiệp */}
      <CreateCommunityGroupModal
        visible={createGroupVisible}
        onClose={() => setCreateGroupVisible(false)}
        onGroupCreated={(newGroup) => {
          setCommunities((prev) => [newGroup, ...prev]);
        }}
      />

      {/* Modal Chi Tiết Sự Kiện & Thẻ Vé QR VIP */}
      <EventDetailModal
        visible={eventModalVisible}
        event={selectedEvent}
        onClose={() => setEventModalVisible(false)}
        onRegisterToggle={(eventId) => {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId ? { ...e, isRegistered: !e.isRegistered } : e
            )
          );
        }}
      />

      {/* Modal Chi Tiết Cơ Hội B2B & Nộp Báo Giá */}
      <OpportunityDetailModal
        visible={oppModalVisible}
        opportunity={selectedOpp}
        onClose={() => setOppModalVisible(false)}
        onApplyOpportunity={(oppId) => {
          setOpportunities((prev) =>
            prev.map((op) => (op.id === oppId ? { ...op, interested: true } : op))
          );
        }}
      />

      {/* Modal Đăng Cơ Hội Giao Thương B2B */}
      <CreateOpportunityModal
        visible={createOppVisible}
        onClose={() => setCreateOppVisible(false)}
        onCreate={(newOpp) => {
          setOpportunities((prev) => [newOpp, ...prev]);
        }}
      />

      {/* Modal Quét Danh Thiếp OCR & Chuyển Thành Khách Hàng Tiềm Năng */}
      <CardScanReviewModal
        visible={cardScanVisible}
        onClose={() => setCardScanVisible(false)}
        onSaveContact={(contact) => {
          Alert.alert("Danh bạ", `Đã lưu ${contact.name} vào danh bạ.`);
        }}
        onSaveCustomerLead={(newLead) => {
          const item: CustomerLeadItem = {
            id: `lead-${Date.now()}`,
            name: newLead.name,
            title: "Tổng Giám Đốc",
            company: newLead.company || "Doanh nghiệp đối tác",
            phone: newLead.phone || "—",
            email: newLead.email || "—",
            dealValue: newLead.dealValue || "500 Triệu VNĐ",
            tier: newLead.tier,
            stage: (newLead.stage as any) || "prospect",
            assignedStaff: newLead.assignedStaff,
            notes: newLead.notes || "",
            nextAction: "Liên hệ tư vấn trong 24h",
            source: "Card Scan AI OCR",
          };
          setLeadsList((prev) => [item, ...prev]);
        }}
      />

      {/* Modal Đặt Lịch Hẹn Kinh Doanh 1-1 Cho Khách Hàng Tiềm Năng */}
      <ScheduleMeetingModal
        visible={scheduleMeetingVisible}
        partnerName={selectedLeadForMeeting?.name}
        partnerCompany={selectedLeadForMeeting?.company}
        onClose={() => setScheduleMeetingVisible(false)}
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
    fontSize: 9,
    fontWeight: "800",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    marginBottom: 8,
  },
  scrollContent: {
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
  createGroupBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  createGroupGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createGroupBtnText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "800",
  },
  screenTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    color: "#94A3B8",
    fontSize: 12.5,
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12151F",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
    padding: 0,
  },
  tabsScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12151F",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabPillActive: {
    backgroundColor: "#D8B282",
    borderColor: "#D8B282",
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabPillTextActive: {
    color: "#050C15",
    fontWeight: "800",
  },
  communityList: {
    gap: 12,
  },
  communityCard: {
    backgroundColor: "#12151F",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  clubIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  clubHeaderMeta: {
    flex: 1,
  },
  clubName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 6,
  },
  memberCountText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "500",
  },
  roleBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#D8B282",
  },
  roleText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "700",
  },
  clubDesc: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  clubFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  memberStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberStatusText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  joinBtn: {
    backgroundColor: "#D8B282",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: {
    color: "#050C15",
    fontSize: 11,
    fontWeight: "700",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailBtnText: {
    color: "#D8B282",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 2,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: "#12151F",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
  },
  eventCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: "#181D2A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "600",
  },
  dateTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "600",
  },
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventLocationText: {
    color: "#94A3B8",
    fontSize: 12,
    flex: 1,
  },
  eventBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  registeredCountBadge: {
    backgroundColor: "#181D2A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  registeredCountText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
  },
  registeredPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  registeredPillText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  eventActionBtn: {
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  eventActionText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  /* Opportunities Section */
  opportunitiesSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  oppSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  postOppBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postOppBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  oppSectionTitle: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  oppBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  oppBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  oppBannerTexts: {
    flex: 1,
  },
  oppBannerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  oppBannerSubtitle: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  oppList: {
    gap: 12,
  },
  oppCard: {
    backgroundColor: "#12151F",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  oppTitle: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 20,
  },
  oppMeta: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  oppBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  oppLeftInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dealBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#D8B282",
  },
  dealBadgeText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "700",
  },
  daysTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  interestedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8B282",
  },
  interestedPillText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "700",
  },
  interestBtn: {
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  interestBtnText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  /* Leads Pipeline Styles */
  leadsSection: {
    marginTop: 6,
    marginBottom: 20,
  },
  leadHeroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  leadHeroTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  leadHeroSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  scanLeadBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  scanLeadGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scanLeadBtnText: {
    color: "#050C15",
    fontSize: 11.5,
    fontWeight: "800",
  },
  tierFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierFilterChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  leadCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  leadCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leadName: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  leadTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  leadTierBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  leadTitleCompany: {
    fontSize: 11.5,
    marginTop: 3,
  },
  leadMetaBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  leadMetaCol: {
    flex: 1,
  },
  leadMetaLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  leadMetaVal: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  leadNoteText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  leadDeadlineText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  leadActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  leadActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  leadActionBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
