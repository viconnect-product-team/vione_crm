import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
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
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { CommunityItem, B2BEvent } from "../../types";
import { CreateCommunityGroupModal } from "../../components/CreateCommunityGroupModal";
import { EventDetailModal } from "../../components/EventDetailModal";
import {
  OpportunityDetailModal,
  CommunityOpportunityItem,
} from "../../components/OpportunityDetailModal";
import { CreateOpportunityModal } from "../../components/CreateOpportunityModal";

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

type CommunityTab = "all" | "joined" | "admin" | "events";

export const CommunityScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CommunityTab>("all");
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  const handleRegisterEvent = (id: string, title: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isRegistered: true } : e))
    );
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký tham gia: ${title}. Thẻ vé điện tử QR đã được cấp.`);
  };

  const handleInterestOpportunity = (id: string, title: string) => {
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* 1. Header Thương Hiệu ViOne */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require("../../../assets/vione-wordmark.png")}
            style={styles.logoWordmark}
            resizeMode="contain"
          />
          <Text style={styles.headerGreeting}>{getGreeting()}</Text>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => Alert.alert("Thông báo", "Bạn có 2 thông báo sự kiện cộng đồng mới.")}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#D8B282" strokeWidth={1.8} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Tiêu Đề Phân Hệ & Nút Tạo Liên Minh */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.screenTitle}>Cộng đồng</Text>
              <Text style={styles.screenSubtitle}>
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
            { id: "all", label: "Tất cả" },
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
        {activeTab !== "events" ? (
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#0A0A0B",
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
});
