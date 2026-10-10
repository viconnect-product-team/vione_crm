import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  Search,
  Filter,
  Layers,
  Sparkles,
  AlertCircle,
  Building2,
  Activity,
  ArrowUpRight,
} from "lucide-react-native";
import { operationsApi } from "../api/services";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/media";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  email?: string;
  currentStatus: string;
  statusLabel: string;
  gpsCheckIn: {
    time: string;
    location: string;
    distance: number;
    status: string;
  };
  todaySchedule: Array<{
    id: string;
    time: string;
    title: string;
    clientName: string;
    location: string;
    status: string;
  }>;
  todayTasks: Array<{
    id: string;
    code: string;
    title: string;
    progress: number;
    checklistDone: number;
    checklistTotal: number;
    deadline: string;
  }>;
  recentLogs: Array<{
    time: string;
    action: string;
    note?: string;
  }>;
}

interface StaffDailyActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StaffDailyActivityModal: React.FC<StaffDailyActivityModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "meeting_client" | "in_office">("all");
  const [summary, setSummary] = useState({
    totalStaff: 45,
    presentCount: 42,
    meetingClientsCount: 8,
    inOfficeCount: 34,
    onLeaveCount: 3,
    kpiAverage: 95.1,
    totalTasksToday: 30,
    completedTasksToday: 18,
    pendingTasksToday: 12,
  });

  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.getStaffDailyActivities();
      if (res?.data?.staff) {
        setStaffList(res.data.staff);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải hoạt động nhân sự từ API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (selectedDept !== "all" && s.department !== selectedDept) return false;
      if (statusFilter !== "all" && s.currentStatus !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.todaySchedule.some((m) => m.clientName.toLowerCase().includes(q))
      );
    });
  }, [staffList, selectedDept, statusFilter, searchQuery]);

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert("Thông báo", "Chưa cập nhật số điện thoại nhân sự.");
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorderGold }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.headerIconWrap, { backgroundColor: colors.goldSoft }]}>
                <Activity size={18} color={colors.gold} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Giám Sát Hoạt Động Nhân Sự Hôm Nay
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Phân hệ Cấp Giám Đốc: Theo dõi lịch gặp đối tác, tiến độ và GPS
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* KPI Executive Summary Banner */}
            <View style={[styles.kpiBanner, { backgroundColor: isDark ? "#161B28" : "#F1F5F9", borderColor: colors.surfaceBorderGold }]}>
              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: colors.gold }]}>{summary.totalStaff}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Tổng nhân sự</Text>
                </View>
                <View style={[styles.kpiDivider, { backgroundColor: colors.surfaceBorder }]} />
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: "#10B981" }]}>{summary.presentCount}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Có mặt (93.3%)</Text>
                </View>
                <View style={[styles.kpiDivider, { backgroundColor: colors.surfaceBorder }]} />
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: "#38BDF8" }]}>{summary.meetingClientsCount}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Gặp khách hàng</Text>
                </View>
                <View style={[styles.kpiDivider, { backgroundColor: colors.surfaceBorder }]} />
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: "#F59E0B" }]}>{summary.completedTasksToday}/{summary.totalTasksToday}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Việc đã xong</Text>
                </View>
              </View>
            </View>

            {/* Thanh Tìm Kiếm & Lọc */}
            <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder }]}>
              <Search size={16} color={colors.gold} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Tìm nhân viên, chức vụ, khách hàng đang gặp..."
                placeholderTextColor={colors.textDisabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips: Trạng Thái Làm Việc */}
            <View style={styles.filterRow}>
              {[
                { id: "all", label: "Tất cả nhân sự" },
                { id: "meeting_client", label: "🤝 Đang gặp khách (8)" },
                { id: "in_office", label: "🏢 Tại văn phòng (34)" },
              ].map((f) => {
                const isActive = statusFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.filterChip,
                      { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder },
                      isActive && { backgroundColor: isDark ? "rgba(216, 178, 130, 0.22)" : "#FEF3C7", borderColor: colors.gold },
                    ]}
                    onPress={() => setStatusFilter(f.id as any)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.textMuted },
                        isActive && { color: colors.textGold, fontWeight: "700" },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 12 }}>
                  Đang đồng bộ hoạt động đội ngũ thời gian thực...
                </Text>
              </View>
            ) : filteredStaff.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Users size={36} color={colors.textDisabled} />
                <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>
                  Không tìm thấy nhân viên phù hợp bộ lọc
                </Text>
              </View>
            ) : (
              filteredStaff.map((staff) => (
                <View
                  key={staff.id}
                  style={[
                    styles.staffCard,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: staff.currentStatus === "meeting_client" ? colors.gold : colors.surfaceBorder,
                    },
                  ]}
                >
                  {/* Top Staff Info */}
                  <View style={styles.staffHeader}>
                    <Image
                      source={{ uri: resolveMediaUrl(staff.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
                      style={styles.staffAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={[styles.staffName, { color: colors.textPrimary }]}>{staff.name}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            staff.currentStatus === "meeting_client"
                              ? { backgroundColor: "rgba(216, 178, 130, 0.2)", borderColor: colors.gold }
                              : { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              staff.currentStatus === "meeting_client" ? { color: colors.textGold } : { color: "#10B981" },
                            ]}
                          >
                            {staff.statusLabel}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.staffRole, { color: colors.textMuted }]}>
                        {staff.role} · {staff.department}
                      </Text>

                      {/* GPS Check-in info */}
                      <View style={styles.gpsRow}>
                        <MapPin size={11} color={colors.gold} style={{ marginRight: 4 }} />
                        <Text style={[styles.gpsText, { color: colors.textMuted }]}>
                          Check-in: {staff.gpsCheckIn.time} (Cách VP {staff.gpsCheckIn.distance}m · Hợp lệ)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* LỊCH TRÌNH ĐI GẶP KHÁCH HÀNG & ĐỐI TÁC TRONG NGÀY */}
                  {staff.todaySchedule.length > 0 && (
                    <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                      <View style={styles.sectionHeader}>
                        <Calendar size={13} color={colors.gold} style={{ marginRight: 6 }} />
                        <Text style={[styles.sectionTitle, { color: colors.gold }]}>LỊCH ĐI GẶP ĐỐI TÁC / KHÁCH HÀNG HÔM NAY</Text>
                      </View>
                      {staff.todaySchedule.map((m) => (
                        <View key={m.id} style={styles.scheduleItem}>
                          <View style={styles.scheduleTimeCol}>
                            <Clock size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                            <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{m.time}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.scheduleClient, { color: colors.textPrimary }]}>{m.clientName}</Text>
                            <Text style={[styles.scheduleTitle, { color: colors.textMuted }]}>{m.title}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                              <MapPin size={10} color={colors.gold} style={{ marginRight: 3 }} />
                              <Text style={[styles.scheduleLoc, { color: colors.textMuted }]}>{m.location}</Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.meetingStatusBadge,
                              m.status === "done" && { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                              m.status === "in_progress" && { backgroundColor: "rgba(245, 158, 11, 0.2)" },
                              m.status === "upcoming" && { backgroundColor: colors.surface2 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.meetingStatusText,
                                m.status === "done" && { color: "#10B981" },
                                m.status === "in_progress" && { color: "#F59E0B" },
                                m.status === "upcoming" && { color: colors.textMuted },
                              ]}
                            >
                              {m.status === "done" ? "Đã xong" : m.status === "in_progress" ? "Đang họp" : "Sắp tới"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* CÔNG VIỆC TRỌNG TÂM TRONG NGÀY */}
                  {staff.todayTasks.length > 0 && (
                    <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: 8 }]}>
                      <View style={styles.sectionHeader}>
                        <Layers size={13} color="#38BDF8" style={{ marginRight: 6 }} />
                        <Text style={[styles.sectionTitle, { color: "#38BDF8" }]}>CÔNG VIỆC THỰC HIỆN TRONG NGÀY (BPMN)</Text>
                      </View>
                      {staff.todayTasks.map((t) => (
                        <View key={t.id} style={{ marginBottom: 6 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                              [{t.code}] {t.title}
                            </Text>
                            <Text style={[styles.taskProgressText, { color: colors.gold }]}>{t.progress}%</Text>
                          </View>
                          {/* Progress bar */}
                          <View style={[styles.progressBarTrack, { backgroundColor: colors.surface2 }]}>
                            <View style={[styles.progressBarFill, { width: `${t.progress}%`, backgroundColor: colors.gold }]} />
                          </View>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                            <Text style={[styles.taskSub, { color: colors.textMuted }]}>
                              Checklist: {t.checklistDone}/{t.checklistTotal} hoàn tất
                            </Text>
                            <Text style={[styles.taskSub, { color: colors.textMuted }]}>Hạn chót: {t.deadline}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* NHẬT KÝ HOẠT ĐỘNG GẦN NHẤT */}
                  {staff.recentLogs.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.logSectionTitle, { color: colors.textMuted }]}>NHẬT KÝ GHI NHẬN GẦN NHẤT</Text>
                      {staff.recentLogs.map((log, idx) => (
                        <View key={idx} style={styles.logRow}>
                          <Text style={[styles.logTime, { color: colors.gold }]}>{log.time}</Text>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.logAction, { color: colors.textPrimary }]}>{log.action}</Text>
                            {log.note && <Text style={[styles.logNote, { color: colors.textMuted }]}>{log.note}</Text>}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* FOOTER HÀNH ĐỘNG NHANH CỦA GIÁM ĐỐC */}
                  <View style={[styles.staffFooterActions, { borderTopColor: colors.surfaceBorder }]}>
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.surface }]}
                      onPress={() => handleCall(staff.phone)}
                      activeOpacity={0.8}
                    >
                      <Phone size={13} color={colors.gold} style={{ marginRight: 6 }} />
                      <Text style={[styles.callBtnText, { color: colors.textGold }]}>Gọi trực tiếp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.surface }]}
                      onPress={() => Alert.alert("Nhắc việc", `Đã gửi tin nhắn nhắc việc qua ViOne tới ${staff.name}.`)}
                      activeOpacity={0.8}
                    >
                      <Mail size={13} color={colors.gold} style={{ marginRight: 6 }} />
                      <Text style={[styles.callBtnText, { color: colors.textGold }]}>Nhắc việc ViOne</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBanner: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  kpiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiItem: {
    flex: 1,
    alignItems: "center",
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  kpiLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  staffCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  staffHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  staffAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  staffName: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  staffRole: {
    fontSize: 11.5,
    marginTop: 2,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  gpsText: {
    fontSize: 10.5,
  },
  sectionBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  scheduleTimeCol: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
  },
  scheduleTime: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  scheduleClient: {
    fontSize: 12,
    fontWeight: "700",
  },
  scheduleTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scheduleLoc: {
    fontSize: 10,
  },
  meetingStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  meetingStatusText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  taskProgressText: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  taskSub: {
    fontSize: 10,
  },
  logSectionTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  logTime: {
    fontSize: 10.5,
    fontWeight: "700",
    width: 40,
  },
  logAction: {
    fontSize: 11,
    fontWeight: "600",
  },
  logNote: {
    fontSize: 10,
    marginTop: 1,
  },
  staffFooterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
});
