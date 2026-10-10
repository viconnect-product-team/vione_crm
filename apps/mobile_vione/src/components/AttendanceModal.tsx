import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Users,
  Clock,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Calendar,
  ShieldAlert,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { operationsApi } from "../api/services";
import { resolveMediaUrl } from "../utils/media";

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StaffRecord {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  avatar?: string;
  checkInTime: string;
  status: "on_time" | "late" | "absent";
  minutesLate: number;
}

interface TopLateItem {
  employeeName: string;
  employeeCode: string;
  department: string;
  lateCount: number;
  totalMinutesLate: number;
  pattern?: string;
  onTimeRate?: string;
  avatar?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [companyName, setCompanyName] = useState("Doanh Nghiệp ViOne");
  const [activeTab, setActiveTab] = useState<"today" | "late_stats">("today");
  const [latePeriod, setLatePeriod] = useState<"week" | "month">("week");

  // Summary Metrics
  const [summary, setSummary] = useState({
    totalStaff: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    onTimeRate: 0,
  });

  const [todayRecords, setTodayRecords] = useState<StaffRecord[]>([]);
  const [weeklyTopLate, setWeeklyTopLate] = useState<TopLateItem[]>([]);
  const [monthlyTopLate, setMonthlyTopLate] = useState<TopLateItem[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");

  useEffect(() => {
    if (visible) {
      loadCompanyAttendance();
    }
  }, [visible]);

  const loadCompanyAttendance = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.getCompanyAttendanceSummary();
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        if (data.hasCompanyCommunity === false) {
          setHasPermission(false);
        } else {
          setHasPermission(true);
          setCompanyName(data.companyName || "Doanh Nghiệp ViOne");
          if (data.summary) setSummary(data.summary);
          if (data.todayRecords) setTodayRecords(data.todayRecords);
          if (data.lateStatistics) {
            setWeeklyTopLate(data.lateStatistics.weeklyTopLate || []);
            setMonthlyTopLate(data.lateStatistics.monthlyTopLate || []);
            setAiInsight(data.lateStatistics.aiPunctualityInsight || "");
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi tải báo cáo giờ giấc công ty:", err);
    } finally {
      setLoading(false);
    }
  };

  // Color tokens (Strict 3-color palette: Gold Accent #D8B282, Slate Dark/Light, Neutral text)
  const colors = {
    accent: isDark ? "#D8B282" : "#B88E56",
    bg: isDark ? "#0B0F19" : "#FFFFFF",
    surface: isDark ? "#151D2C" : "#F8FAFC",
    cardBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    green: "#10B981",
    amber: "#F59E0B",
    red: "#EF4444",
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.bg }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#FDF6ED" }]}>
                    <Building2 size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                      Theo Dõi Giờ Giấc & Chuyên Cần
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                      {companyName} • Dành cho Ban Lãnh Đạo
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Đang tải dữ liệu giờ giấc nhân sự...
                  </Text>
                </View>
              ) : !hasPermission ? (
                /* Empty state when account has no company community */
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.12)" : "#FDF6ED" }]}>
                    <ShieldAlert size={36} color={colors.accent} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    Phân Quyền Doanh Nghiệp Riêng
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                    Chức năng Theo Dõi Giờ Giấc & Đi Muộn chỉ kích hoạt khi tài khoản của Bạn sở hữu hoặc quản lý Cộng đồng Doanh nghiệp có nhân sự.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                    onPress={onClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryActionBtnText}>Đã Hiểu</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  {/* Top Stats 4 Grid */}
                  <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                        {summary.totalStaff}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tổng Nhân Sự</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.metricValue, { color: colors.green }]}>
                        {summary.onTimeCount}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Đúng Giờ</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.metricValue, { color: colors.amber }]}>
                        {summary.lateCount}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Đi Muộn</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                        {summary.onTimeRate}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tỷ Lệ Đúng Giờ</Text>
                    </View>
                  </View>

                  {/* Tab Selector */}
                  <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <TouchableOpacity
                      style={[
                        styles.tabItem,
                        activeTab === "today" && [styles.tabItemActive, { backgroundColor: colors.bg }],
                      ]}
                      onPress={() => setActiveTab("today")}
                      activeOpacity={0.7}
                    >
                      <Clock size={15} color={activeTab === "today" ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.tabText,
                          { color: activeTab === "today" ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        Hôm Nay ({todayRecords.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tabItem,
                        activeTab === "late_stats" && [styles.tabItemActive, { backgroundColor: colors.bg }],
                      ]}
                      onPress={() => setActiveTab("late_stats")}
                      activeOpacity={0.7}
                    >
                      <TrendingDown size={15} color={activeTab === "late_stats" ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.tabText,
                          { color: activeTab === "late_stats" ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        Ai Hay Đi Muộn
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* TAB 1: HÔM NAY (Realtime Staff Log) */}
                  {activeTab === "today" && (
                    <View style={styles.tabSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Giờ Giấc Check-in Thực Tế Hôm Nay
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                          Chuẩn vào làm: 08:30:00
                        </Text>
                      </View>

                      {todayRecords.map((item) => {
                        const isLate = item.status === "late";
                        const isAbsent = item.status === "absent";
                        const statusColor = isLate ? colors.amber : isAbsent ? colors.textSecondary : colors.green;
                        const statusText = isLate
                          ? `Muộn +${item.minutesLate}p`
                          : isAbsent
                          ? "Chưa check-in"
                          : "Đúng giờ";

                        return (
                          <View
                            key={item.id}
                            style={[
                              styles.staffRow,
                              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                            ]}
                          >
                            <Image
                              source={{
                                uri:
                                  resolveMediaUrl(item.avatar) ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                              }}
                              style={styles.staffAvatar}
                            />
                            <View style={styles.staffInfo}>
                              <View style={styles.staffNameRow}>
                                <Text style={[styles.staffName, { color: colors.textPrimary }]}>
                                  {item.employeeName}
                                </Text>
                                <Text style={[styles.staffCode, { color: colors.textSecondary }]}>
                                  {item.employeeCode}
                                </Text>
                              </View>
                              <Text style={[styles.staffDept, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.department} • {item.position}
                              </Text>
                            </View>

                            <View style={styles.staffCheckInBox}>
                              <Text style={[styles.checkInTimeText, { color: colors.textPrimary }]}>
                                {item.checkInTime}
                              </Text>
                              <View style={[styles.statusBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9" }]}>
                                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                  {statusText}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* TAB 2: AI HAY ĐI MUỘN (Tuần & Tháng) */}
                  {activeTab === "late_stats" && (
                    <View style={styles.tabSection}>
                      {/* Period Switcher: Week vs Month */}
                      <View style={styles.periodSwitcher}>
                        <TouchableOpacity
                          style={[
                            styles.periodBtn,
                            latePeriod === "week" && [styles.periodBtnActive, { backgroundColor: colors.accent }],
                          ]}
                          onPress={() => setLatePeriod("week")}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodBtnText,
                              { color: latePeriod === "week" ? "#FFFFFF" : colors.textSecondary },
                            ]}
                          >
                            Theo Tuần Này (7 Ngày)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.periodBtn,
                            latePeriod === "month" && [styles.periodBtnActive, { backgroundColor: colors.accent }],
                          ]}
                          onPress={() => setLatePeriod("month")}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodBtnText,
                              { color: latePeriod === "month" ? "#FFFFFF" : colors.textSecondary },
                            ]}
                          >
                            Theo Tháng Này (30 Ngày)
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Ranking List */}
                      <View style={styles.rankingCard}>
                        <Text style={[styles.rankingTitle, { color: colors.textPrimary }]}>
                          🏆 Bảng Xếp Hạng Nhân Sự Đi Muộn ({latePeriod === "week" ? "Tuần Này" : "Tháng Này"})
                        </Text>
                        <Text style={[styles.rankingSubtitle, { color: colors.textSecondary }]}>
                          Cảnh báo kỷ luật & giờ giấc nhân sự nội bộ
                        </Text>

                        {(latePeriod === "week" ? weeklyTopLate : monthlyTopLate).map((item, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.rankingItem,
                              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                            ]}
                          >
                            <View style={[styles.rankNumberBadge, { backgroundColor: idx === 0 ? colors.amber : isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }]}>
                              <Text style={[styles.rankNumberText, { color: idx === 0 ? "#FFFFFF" : colors.textPrimary }]}>
                                #{idx + 1}
                              </Text>
                            </View>

                            <Image
                              source={{
                                uri:
                                  resolveMediaUrl(item.avatar) ||
                                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
                              }}
                              style={styles.rankingAvatar}
                            />

                            <View style={styles.rankingInfo}>
                              <Text style={[styles.rankingName, { color: colors.textPrimary }]}>
                                {item.employeeName}
                              </Text>
                              <Text style={[styles.rankingDept, { color: colors.textSecondary }]}>
                                {item.department} ({item.employeeCode})
                              </Text>
                              {item.pattern && (
                                <Text style={[styles.rankingPattern, { color: colors.amber }]}>
                                  • {item.pattern}
                                </Text>
                              )}
                            </View>

                            <View style={styles.rankingStats}>
                              <Text style={[styles.lateCountText, { color: colors.amber }]}>
                                {item.lateCount} lần muộn
                              </Text>
                              <Text style={[styles.totalMinutesText, { color: colors.textSecondary }]}>
                                Tổng {item.totalMinutesLate} phút
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* AI HR Audit Insight Card */}
                      {aiInsight ? (
                        <View
                          style={[
                            styles.aiInsightCard,
                            {
                              backgroundColor: isDark ? "rgba(216, 178, 130, 0.08)" : "#FDF8F2",
                              borderColor: colors.accent,
                            },
                          ]}
                        >
                          <View style={styles.aiInsightHeader}>
                            <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
                            <Text style={[styles.aiInsightTitle, { color: colors.accent }]}>
                              Trợ Lý Nhân Sự AI • Lời Khuyên Quản Trị
                            </Text>
                          </View>
                          <Text style={[styles.aiInsightBody, { color: colors.textPrimary }]}>
                            {aiInsight}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryActionBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabItemActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tabSection: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  staffInfo: {
    flex: 1,
  },
  staffNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  staffName: {
    fontSize: 13,
    fontWeight: "700",
  },
  staffCode: {
    fontSize: 10,
    fontWeight: "600",
  },
  staffDept: {
    fontSize: 11,
    marginTop: 2,
  },
  staffCheckInBox: {
    alignItems: "flex-end",
  },
  checkInTimeText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  periodSwitcher: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  periodBtnActive: {},
  periodBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rankingCard: {
    marginBottom: 14,
  },
  rankingTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  rankingSubtitle: {
    fontSize: 11,
    marginBottom: 10,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rankNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankNumberText: {
    fontSize: 11,
    fontWeight: "800",
  },
  rankingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 13,
    fontWeight: "700",
  },
  rankingDept: {
    fontSize: 11,
    marginTop: 2,
  },
  rankingPattern: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  rankingStats: {
    alignItems: "flex-end",
  },
  lateCountText: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  totalMinutesText: {
    fontSize: 10,
  },
  aiInsightCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  aiInsightTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  aiInsightBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});
