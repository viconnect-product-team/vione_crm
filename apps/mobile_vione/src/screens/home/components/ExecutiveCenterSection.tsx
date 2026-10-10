import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  ArrowRight,
  Activity,
  FileCheck,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  CalendarDays,
  MapPin,
  ChevronRight,
  Layers,
  ShieldCheck,
} from "lucide-react-native";
import { QuickMeetIcon, QuickScanIcon, QuickCardIcon } from "../../../components/NavIcons";
import { styles } from "./home.styles";

export interface ExecutiveCenterSectionProps {
  isDark: boolean;
  navigation?: any;
  hasCompanyWithStaff?: boolean;
  setScheduleMeetingVisible: (v: boolean) => void;
  setScanQrVisible: (v: boolean) => void;
  setMyQrVisible: (v: boolean) => void;
  setAttendanceVisible: (v: boolean) => void;
  setWorkflowVisible: (v: boolean) => void;
  setApprovalsVisible: (v: boolean) => void;
  setAiAssistantVisible: (v: boolean) => void;
  setSelectedPartnerForMeeting: (p: { name: string; company: string } | null) => void;
  setCardScanReviewVisible: (v: boolean) => void;
  setMemberCardModalVisible: (v: boolean) => void;
}

export const ExecutiveCenterSection: React.FC<ExecutiveCenterSectionProps> = ({
  isDark,
  navigation,
  hasCompanyWithStaff = false,
  setScheduleMeetingVisible,
  setScanQrVisible,
  setMyQrVisible,
  setAttendanceVisible,
  setWorkflowVisible,
  setApprovalsVisible,
  setAiAssistantVisible,
  setSelectedPartnerForMeeting,
  setCardScanReviewVisible,
  setMemberCardModalVisible,
}) => {
  return (
    <>
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

          {/* Metric Tiles: Chỉ hiện Chấm công & Ký duyệt khi có công ty & nhân sự */}
          {hasCompanyWithStaff ? (
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
          ) : (
            <TouchableOpacity
              style={[
                styles.opsMetricTile,
                {
                  width: "100%",
                  padding: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
              onPress={() => setWorkflowVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.metricTileHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.metricIconWrap}>
                    <Layers size={15} color="#D8B282" />
                  </View>
                  <Text style={[styles.opsSectionLabel, { marginBottom: 0 }]}>CÔNG VIỆC & TIẾN ĐỘ</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? "#FFFFFF" : "#0F172A", marginTop: 6 }]}>
                12 <Text style={{ fontSize: 13, fontWeight: "500", color: isDark ? "#94A3B8" : "#64748B" }}>nhiệm vụ của tôi</Text>
              </Text>
              <Text style={styles.metricBadgeGreen}>83% hoàn thành đúng hạn</Text>
              <Text style={[styles.metricLabel, { color: isDark ? "#94A3B8" : "#64748B", marginTop: 4 }]}>
                Theo dõi tiến độ, nhận việc được phân công và cập nhật tỷ lệ hoàn thành.
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Banner mạ vàng sang trọng */}
          <View style={styles.opsActionBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <Sparkles size={14} color="#D8B282" />
              <Text
                style={[styles.opsBannerText, { color: isDark ? "#F8FAFC" : "#0F172A" }]}
                numberOfLines={1}
              >
                {hasCompanyWithStaff
                  ? "Hôm nay: 3 việc ưu tiên & 1 tờ trình cần ký"
                  : "Hôm nay: 3 nhiệm vụ ưu tiên cần thực hiện"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.opsBannerBtn}
              onPress={() => {
                if (hasCompanyWithStaff) {
                  setAttendanceVisible(true);
                } else {
                  setWorkflowVisible(true);
                }
              }}
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
                  {hasCompanyWithStaff ? "Chấm công ngay" : "Xem công việc"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

    </>
  );
};
