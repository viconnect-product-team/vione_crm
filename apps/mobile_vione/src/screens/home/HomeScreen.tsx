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
  Clock,
  MapPin,
  CalendarDays,
  Handshake,
  Video,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { ScanQrModal } from "../quick-connect/ScanQrModal";

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

  // Định dạng ngày tiếng Việt: "Thứ Năm, 01 Tháng 10"
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

  // Lấy chữ cái đầu đại diện avatar
  const getInitial = (name?: string | null) => {
    if (!name) return "A";
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return "A";
    return words[words.length - 1][0].toUpperCase();
  };

  const displayName = user?.displayName || user?.name || "Administrator";
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B45309"
            colors={["#B45309"]}
          />
        }
      >
        {/* Top Header: Logo ViOne + Chào buổi sáng & Chuông thông báo */}
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
            onPress={() => Alert.alert("Thông báo", "Bạn chưa có thông báo mới nào.")}
            activeOpacity={0.7}
          >
            <Bell size={22} color="#334155" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerDivider} />

        {/* 1. Thẻ Doanh Nhân ViOne (Identity Card) */}
        <View style={styles.identityCard}>
          {/* Ảnh bìa gradient tối sang trọng */}
          <LinearGradient
            colors={["#0B0F17", "#1E293B", "#0F172A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverBanner}
          >
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => Alert.alert("Hồ sơ", "Chức năng chỉnh sửa thông tin doanh nhân.")}
              activeOpacity={0.8}
            >
              <Pencil size={15} color="#0F172A" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Thông tin hội viên bên dưới ảnh bìa */}
          <View style={styles.identityBody}>
            <View style={styles.identityLeft}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>DOANH NHÂN VIONE</Text>
              </View>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
            </View>

            {/* Avatar tròn viền vàng bên phải */}
            <View style={styles.avatarWrap}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitialText}>{avatarInitial}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 2. Phân Hệ HÔM NAY */}
        <View style={styles.sectionToday}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.todaySectionTitle}>HÔM NAY</Text>
            <TouchableOpacity
              style={styles.viewCalendarBtn}
              onPress={() => Alert.alert("Lịch", "Xem toàn bộ lịch hoạt động & sự kiện.")}
              activeOpacity={0.7}
            >
              <SlidersHorizontal size={14} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.viewCalendarText}>Xem lịch</Text>
              <ChevronRight size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Ngày tiếng Việt động */}
          <Text style={styles.todayDateTitle}>{getFormattedDate()}</Text>

          {/* Bộ 3 Tabs: [Hôm nay] [Sắp tới 1] [Nhắc lịch 1] */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === "today" ? styles.tabPillActive : styles.tabPillInactive]}
              onPress={() => setActiveTab("today")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === "today" ? styles.tabPillTextActive : styles.tabPillTextInactive]}>
                Hôm nay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabPill, activeTab === "upcoming" ? styles.tabPillActive : styles.tabPillInactive]}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === "upcoming" ? styles.tabPillTextActive : styles.tabPillTextInactive]}>
                Sắp tới
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{upcomingEvents.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabPill, activeTab === "reminders" ? styles.tabPillActive : styles.tabPillInactive]}
              onPress={() => setActiveTab("reminders")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === "reminders" ? styles.tabPillTextActive : styles.tabPillTextInactive]}>
                Nhắc lịch
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{remindersList.length}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Nội dung Tab HÔM NAY: Trạng thái yên tĩnh */}
          {activeTab === "today" && (
            <View style={styles.quietBox}>
              <View style={styles.quietIconWrap}>
                <CheckCircle2 size={28} color="#B45309" strokeWidth={1.8} />
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
                activeOpacity={0.8}
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
                <View key={ev.id} style={styles.eventCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTag}>
                      <CalendarDays size={12} color="#B45309" style={{ marginRight: 4 }} />
                      <Text style={styles.cardTagText}>{ev.community}</Text>
                    </View>
                    <Text style={styles.cardDate}>{ev.time} · {ev.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  <View style={styles.cardLocationRow}>
                    <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.cardLocationText}>{ev.location}</Text>
                  </View>
                </View>
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
                      <Handshake size={12} color="#B45309" style={{ marginRight: 4 }} />
                      <Text style={styles.cardTagText}>Cuộc gặp 1-1 đã hẹn</Text>
                    </View>
                    <Text style={styles.cardDate}>{rem.time} · {rem.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{rem.title}</Text>
                  <View style={styles.cardLocationRow}>
                    <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.cardLocationText}>{rem.location}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. Khối INSIGHT DÀNH CHO BẠN */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeaderRow}>
            <Sparkles size={16} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.insightSmallLabel}>INSIGHT DÀNH CHO BẠN</Text>
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
            <ArrowRight size={15} color="#B45309" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals hỗ trợ kết nối nhanh */}
      <MyQrModal visible={myQrVisible} onClose={() => setMyQrVisible(false)} />
      <ScanQrModal visible={scanQrVisible} onClose={() => setScanQrVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerBrand: {
    flexDirection: "column",
  },
  logoWordmark: {
    width: 68,
    height: 22,
    marginBottom: 2,
  },
  headerGreeting: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
  },

  /* 1. Identity Card */
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  coverBanner: {
    height: 120,
    width: "100%",
    position: "relative",
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  identityBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identityLeft: {
    flex: 1,
    marginRight: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FBF3E4",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3E3C7",
    marginBottom: 6,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#92400E",
    letterSpacing: 0.6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#D4AF37",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
  },
  avatarCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* 2. Section HÔM NAY */
  sectionToday: {
    marginTop: 24,
  },
  todayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  todaySectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  viewCalendarBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewCalendarText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#475569",
    marginRight: 2,
  },
  todayDateTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: "#DEBA89",
  },
  tabPillInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabPillText: {
    fontSize: 13,
  },
  tabPillTextActive: {
    fontWeight: "700",
    color: "#1E293B",
  },
  tabPillTextInactive: {
    fontWeight: "500",
    color: "#475569",
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },

  /* Quiet Box */
  quietBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quietIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quietTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  quietSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 260,
    marginBottom: 16,
  },
  openVBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF6",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  vMiniEmblem: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#DEBA89",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#B45309",
  },
  vMiniText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#451A03",
  },
  openVBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },

  /* List cards */
  listContainer: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },
  cardDate: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLocationText: {
    fontSize: 12,
    color: "#64748B",
  },

  /* 3. Insight Card */
  insightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 20,
    marginTop: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  insightSmallLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  insightHeadline: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 27,
    marginBottom: 8,
  },
  insightGoldNumber: {
    color: "#D97706",
    fontWeight: "900",
  },
  insightSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    marginBottom: 14,
  },
  insightCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  insightCtaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
  },
});
