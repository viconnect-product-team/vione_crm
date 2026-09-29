import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Calendar,
  Users,
  QrCode,
  ScanLine,
  Radio,
  Sparkles,
  ChevronRight,
  MapPin,
  Clock,
  ArrowUpRight,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/common/Avatar";
import { LuxuryCard } from "../../components/common/LuxuryCard";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { ScanQrModal } from "../quick-connect/ScanQrModal";

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const todayMeetings = [
    {
      id: "m-1",
      title: "Giao lưu Kết nối C-Level & Khởi nghiệp 2026",
      time: "10:30 - 11:30",
      counterpart: "Đoàn Doanh Nghiệp TP.HCM",
      location: "Khách sạn Daewoo Hà Nội",
    },
    {
      id: "m-2",
      title: "Ký kết Thỏa thuận Hợp tác B2B ViOne",
      time: "14:00 - 15:00",
      counterpart: "Chủ tịch CLB Doanh Nhân ViOne Elite",
      location: "Trụ sở ViOne Connect",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar url={user?.avatarUrl} name={user?.displayName} size={48} showGoldBorder />
            <View style={styles.userMeta}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.displayName || "Doanh Nhân C-Level"}</Text>
              <Text style={styles.userRole}>
                {user?.title || "Tổng Giám Đốc"} • {user?.company || "ViOne"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Alert.alert("Thông báo", "Bạn có 2 thông báo kết nối kinh doanh mới.")}
          >
            <Bell size={22} color={Colors.textPrimary} />
            <View style={styles.unreadBadge}>
              <Text style={styles.badgeCount}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Executive Briefing Card */}
        <LuxuryCard highlight style={styles.briefingCard}>
          <View style={styles.briefingTop}>
            <View style={styles.briefingPill}>
              <Sparkles size={12} color={Colors.gold} style={{ marginRight: 4 }} />
              <Text style={styles.briefingPillText}>EXECUTIVE BRIEFING</Text>
            </View>
            <Text style={styles.briefingDate}>Hôm nay, {new Date().toLocaleDateString("vi-VN")}</Text>
          </View>

          <Text style={styles.briefingHeadline}>
            Bạn có 2 lịch hẹn đối tác và 3 lời mời kết nối đang chờ.
          </Text>

          {/* Quick Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>2</Text>
              <Text style={styles.metricLabel}>Cuộc hẹn</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>3</Text>
              <Text style={styles.metricLabel}>Chờ duyệt</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>128</Text>
              <Text style={styles.metricLabel}>Đối tác</Text>
            </View>
          </View>
        </LuxuryCard>

        {/* Quick Action Buttons Grid */}
        <Text style={styles.sectionTitle}>THAO TÁC NHANH</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconWrap, { backgroundColor: `${Colors.gold}15` }]}>
              <QrCode size={22} color={Colors.gold} />
            </View>
            <Text style={styles.qaTitle}>Mã QR của tôi</Text>
            <Text style={styles.qaSub}>Mở danh thiếp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setScanModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconWrap, { backgroundColor: `${Colors.info}15` }]}>
              <ScanLine size={22} color={Colors.info} />
            </View>
            <Text style={styles.qaTitle}>Quét danh thiếp</Text>
            <Text style={styles.qaSub}>Camera QR / OCR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              Alert.alert(
                "Chạm thẻ NFC",
                "Đưa điện thoại lại gần thẻ danh thiếp thông minh để kết nối ngay."
              )
            }
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconWrap, { backgroundColor: `${Colors.success}15` }]}>
              <Radio size={22} color={Colors.success} />
            </View>
            <Text style={styles.qaTitle}>Chạm thẻ NFC</Text>
            <Text style={styles.qaSub}>Titanium 1-chạm</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Meetings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>LỊCH HẸN TRONG NGÀY</Text>
          <TouchableOpacity onPress={() => Alert.alert("Lịch làm việc", "Xem toàn bộ lịch trình.")}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {todayMeetings.map((m) => (
          <LuxuryCard key={m.id} style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <View style={styles.timeTag}>
                <Clock size={12} color={Colors.gold} style={{ marginRight: 4 }} />
                <Text style={styles.timeText}>{m.time}</Text>
              </View>
              <ArrowUpRight size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.meetingTitle}>{m.title}</Text>
            <View style={styles.meetingMetaRow}>
              <Users size={14} color={Colors.goldLight} style={{ marginRight: 6 }} />
              <Text style={styles.meetingMetaText}>{m.counterpart}</Text>
            </View>
            <View style={styles.meetingMetaRow}>
              <MapPin size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.meetingMetaText}>{m.location}</Text>
            </View>
          </LuxuryCard>
        ))}

        {/* Featured B2B Event Banner */}
        <Text style={styles.sectionTitle}>SỰ KIỆN GIAO THƯƠNG NỔI BẬT</Text>
        <LuxuryCard style={styles.eventBanner}>
          <View style={styles.eventBadge}>
            <Calendar size={12} color={Colors.gold} style={{ marginRight: 4 }} />
            <Text style={styles.eventBadgeText}>ĐẠI HỘI GIAO THƯƠNG 2026</Text>
          </View>
          <Text style={styles.eventTitle}>
            Diễn Đàn Chuyển Đổi Số & Kết Nối Đầu Tư B2B Toàn Quốc
          </Text>
          <Text style={styles.eventDesc}>
            Quy tụ 200+ Doanh nghiệp hàng đầu, Cơ hội xúc tiến thương mại và tìm kiếm đối tác chiến lược.
          </Text>
          <View style={styles.eventFooter}>
            <Text style={styles.eventDate}>15 Tháng 10, 2026 • Khách sạn Sheraton</Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => Alert.alert("Thành công", "Đã gửi đăng ký tham dự sự kiện!")}
            >
              <Text style={styles.registerBtnText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </LuxuryCard>
      </ScrollView>

      {/* Modals */}
      <MyQrModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />
      <ScanQrModal visible={scanModalVisible} onClose={() => setScanModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userMeta: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  userRole: {
    color: Colors.goldLight,
    fontSize: 11,
    marginTop: 1,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeCount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  briefingCard: {
    marginBottom: 24,
  },
  briefingTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  briefingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.goldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  briefingPillText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  briefingDate: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  briefingHeadline: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricNumber: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: "800",
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.surfaceBorderLight,
  },
  sectionTitle: {
    color: Colors.goldLight,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 10,
  },
  seeAllText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  qaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  qaTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  qaSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  meetingCard: {
    marginBottom: 10,
  },
  meetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  meetingTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  meetingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  meetingMetaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  eventBanner: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
  },
  eventBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.goldSoft,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventBadgeText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "800",
  },
  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 6,
  },
  eventDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderLight,
  },
  eventDate: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  registerBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  registerBtnText: {
    color: "#05070E",
    fontSize: 12,
    fontWeight: "700",
  },
});
