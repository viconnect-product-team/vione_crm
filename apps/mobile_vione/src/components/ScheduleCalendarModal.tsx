import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  ChevronRight,
  CheckCircle2,
  Users,
  Building2,
  Sparkles,
  AlertTriangle,
  Heart,
  Bell,
  CheckSquare,
  RefreshCw,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { operationsApi, meetingsApi } from "../api/services";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface CalendarEventItem {
  id: string;
  title: string;
  kind: "meeting" | "task" | "event" | "reminder";
  date: string;
  time: string;
  location?: string;
  format?: "online" | "offline";
  participants?: string;
  company?: string;
  status: "confirmed" | "pending" | "completed" | "todo";
  priority?: "urgent" | "high" | "medium" | "low";
  notes?: string;
}

interface WorkloadHealth {
  totalMeetingsToday: number;
  consecutiveMeetingsCount: number;
  healthScore: number;
  workloadStatus: "relaxed" | "balanced" | "hectic" | "overloaded";
  healthWarning: string;
  aiRecommendation: string;
}

interface SmartReminder {
  id: string;
  title: string;
  time: string;
  severity: string;
  icon: string;
  category: string;
}

interface ScheduleCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenScheduleMeeting?: () => void;
  onOpenAiAssistant?: () => void;
  onSelectEvent?: (event: CalendarEventItem) => void;
}

export const ScheduleCalendarModal: React.FC<ScheduleCalendarModalProps> = ({
  visible,
  onClose,
  onOpenScheduleMeeting,
  onOpenAiAssistant,
  onSelectEvent,
}) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "meeting" | "task" | "reminder">("all");

  const [workloadHealth, setWorkloadHealth] = useState<WorkloadHealth>({
    totalMeetingsToday: 3,
    consecutiveMeetingsCount: 2,
    healthScore: 58,
    workloadStatus: "hectic",
    healthWarning: "⚠️ Lịch trình chiều nay có 3 cuộc họp liên tiếp, đệm nghỉ chỉ 15 phút. Nguy cơ căng thẳng và kiệt sức!",
    aiRecommendation: "Thư ký AI đề xuất: Lùi cuộc họp nội bộ 17h00 sang 09h30 sáng mai để có 45 phút nghỉ trà chiều nạp năng lượng.",
  });

  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [eventsList, setEventsList] = useState<CalendarEventItem[]>([]);

  useEffect(() => {
    if (visible) {
      loadExecutiveSchedule();
    }
  }, [visible]);

  const loadExecutiveSchedule = async () => {
    setLoading(true);
    try {
      const res = await operationsApi.getExecutiveSchedule();
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        if (data.workloadHealth) setWorkloadHealth(data.workloadHealth);
        if (data.smartReminders) setReminders(data.smartReminders);

        const items: CalendarEventItem[] = [];

        // Chuyển meetings sang events
        if (Array.isArray(data.meetings)) {
          data.meetings.forEach((m: any, idx: number) => {
            items.push({
              id: m.id || `meet-${idx}`,
              title: m.title || "Cuộc gặp đối tác",
              kind: "meeting",
              date: "Hôm nay",
              time: m.timeSlot || "14:00 - 15:30",
              format: m.format === "online" ? "online" : "offline",
              location: m.location || "ViOne Tower",
              participants: m.counterpart_name || "Đối tác VIP",
              company: m.counterpart_company || "Tập đoàn B2B",
              status: m.status === "confirmed" ? "confirmed" : "pending",
              priority: m.priority || "high",
              notes: m.description,
            });
          });
        }

        // Chuyển tasks sang events
        if (Array.isArray(data.tasks)) {
          data.tasks.forEach((t: any, idx: number) => {
            items.push({
              id: t.id || `task-${idx}`,
              title: t.title || "Nhiệm vụ quản trị",
              kind: "task",
              date: t.deadline || "Hôm nay",
              time: "Hạn chót 18:00",
              participants: t.assignee || "CEO & Trợ lý",
              company: t.department || "Ban Lãnh Đạo",
              status: t.status === "done" ? "completed" : "todo",
              priority: t.priority === "high" ? "urgent" : "medium",
              notes: t.description,
            });
          });
        }

        setEventsList(items);
      }
    } catch (err) {
      console.warn("Lỗi tải lịch trình điều hành:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await operationsApi.aiOptimizeSchedule();
      if (res.data?.success && res.data.data) {
        const opt = res.data.data;
        setWorkloadHealth((prev) => ({
          ...prev,
          healthScore: opt.healthScoreAfter || 88,
          workloadStatus: "balanced",
          healthWarning: "🌿 Lịch trình đã được Thư ký AI tái cấu trúc đạt trạng thái CÂN BẰNG LÝ TƯỞNG!",
          aiRecommendation: "Cuộc họp nội bộ đã được chuyển sang 09h30 sáng mai, bố trí 45 phút nghỉ trà chiều phục hồi năng lượng.",
        }));

        // Cập nhật lại danh sách cuộc họp hiển thị
        setEventsList((prev) =>
          prev.map((e) => {
            if (e.title.includes("nội bộ") || e.title.includes("giao ban")) {
              return { ...e, time: "09:30 - 10:30 Sáng mai", date: "Sáng mai" };
            }
            return e;
          })
        );

        Alert.alert(
          "✨ Thư Ký AI Đã Tối Ưu Lịch Trình!",
          opt.aiSecretaryNote || "Đã giãn lịch và tạo 45 phút nghỉ trà chiều cho Sếp. Chỉ số sức khỏe tăng lên 88/100!",
          [{ text: "Rất Tuyệt Vời", style: "default" }]
        );
      }
    } catch (err) {
      console.warn("Lỗi tối ưu lịch:", err);
      Alert.alert("Thông báo", "Lỗi kết nối Thư ký AI, vui lòng thử lại.");
    } finally {
      setOptimizing(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return eventsList;
    return eventsList.filter((e) => e.kind === activeFilter);
  }, [activeFilter, eventsList]);

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

  const isHectic = workloadHealth.healthScore < 70;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Sparkles size={12} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.headerBadgeText, { color: colors.accent }]}>
                  LỊCH TRÌNH & CÔNG VIỆC CEO
                </Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Tổng Kho Công Việc & Lịch Trình
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Tự động quy tụ toàn bộ lịch họp, công việc & nhắc nhở cá nhân
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Thư ký AI đang đồng bộ toàn bộ công việc & lịch trình...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* 1. HEALTH & WORKLOAD AUDIT CARD (Đánh giá sức khỏe & Mật độ dồn dập) */}
              <View
                style={[
                  styles.healthCard,
                  {
                    backgroundColor: isDark
                      ? isHectic
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(16, 185, 129, 0.08)"
                      : isHectic
                      ? "#FEF2F2"
                      : "#F0FDF4",
                    borderColor: isHectic ? (isDark ? "rgba(239, 68, 68, 0.3)" : "#FCA5A5") : (isDark ? "rgba(16, 185, 129, 0.3)" : "#86EFAC"),
                  },
                ]}
              >
                <View style={styles.healthHeader}>
                  <View style={styles.healthTitleRow}>
                    <Heart size={16} color={isHectic ? colors.red : colors.green} style={{ marginRight: 6 }} />
                    <Text style={[styles.healthTitle, { color: isHectic ? colors.red : colors.green }]}>
                      Chỉ Số Cân Bằng Sức Khỏe: {workloadHealth.healthScore}/100 ({isHectic ? "Dồn Dập" : "Cân Bằng"})
                    </Text>
                  </View>
                  <View style={[styles.healthBadge, { backgroundColor: isHectic ? colors.red : colors.green }]}>
                    <Text style={styles.healthBadgeText}>
                      {isHectic ? "CẢNH BÁO MỆT MỎI" : "TỐI ƯU"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.healthWarningText, { color: colors.textPrimary }]}>
                  {workloadHealth.healthWarning}
                </Text>

                <Text style={[styles.healthAiText, { color: colors.textSecondary }]}>
                  💡 {workloadHealth.aiRecommendation}
                </Text>

                {/* Nút 1-Chạm: Thư Ký AI Tối Ưu Lịch */}
                {isHectic && (
                  <TouchableOpacity
                    style={[styles.optimizeBtn, { backgroundColor: colors.accent }]}
                    onPress={handleAiOptimize}
                    disabled={optimizing}
                    activeOpacity={0.85}
                  >
                    {optimizing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.optimizeBtnText}>
                          Thư Ký AI: Tối Ưu Lịch Cho Đỡ Dồn Dập
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* 2. SMART REMINDERS SECTION (Nhắc nhở thông minh) */}
              {reminders.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Bell size={15} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Nhắc Nhở Thông Minh Hôm Nay ({reminders.length})
                      </Text>
                    </View>
                  </View>

                  {reminders.map((rem) => (
                    <View
                      key={rem.id}
                      style={[
                        styles.reminderItem,
                        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                      ]}
                    >
                      <View style={[styles.reminderDot, { backgroundColor: rem.severity === "urgent" ? colors.red : colors.accent }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reminderTitle, { color: colors.textPrimary }]}>
                          {rem.title}
                        </Text>
                        <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
                          ⏰ {rem.time}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 3. FILTER TABS */}
              <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "meeting", label: "Cuộc gặp 1-1" },
                  { id: "task", label: "Việc cần làm" },
                ].map((f) => {
                  const isActive = activeFilter === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.filterChip,
                        isActive && [styles.filterChipActive, { backgroundColor: colors.bg }],
                      ]}
                      onPress={() => setActiveFilter(f.id as any)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isActive ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. LIST OF SCHEDULED EVENTS & TASKS */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Lịch Trình Chi Tiết ({filteredEvents.length})
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={onOpenScheduleMeeting}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>
                      Thêm lịch
                    </Text>
                  </TouchableOpacity>
                </View>

                {filteredEvents.map((item) => {
                  const isMeeting = item.kind === "meeting";
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.eventCard,
                        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => onSelectEvent && onSelectEvent(item)}
                    >
                      <View style={styles.eventTimeCol}>
                        <Clock size={14} color={colors.accent} style={{ marginBottom: 4 }} />
                        <Text style={[styles.eventTimeText, { color: colors.textPrimary }]}>
                          {item.time.split(" ")[0]}
                        </Text>
                        <Text style={[styles.eventDateSub, { color: colors.textSecondary }]}>
                          {item.date}
                        </Text>
                      </View>

                      <View style={styles.eventInfoCol}>
                        <View style={styles.eventBadgeRow}>
                          <View style={[styles.kindBadge, { backgroundColor: isMeeting ? (isDark ? "rgba(216, 178, 130, 0.15)" : "#FDF6ED") : (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5") }]}>
                            <Text style={[styles.kindBadgeText, { color: isMeeting ? colors.accent : colors.green }]}>
                              {isMeeting ? "CUỘC GẶP 1-1" : "NHIỆM VỤ"}
                            </Text>
                          </View>
                          {item.priority === "urgent" && (
                            <View style={[styles.priorityBadge, { backgroundColor: colors.red }]}>
                              <Text style={styles.priorityBadgeText}>GẤP</Text>
                            </View>
                          )}
                        </View>

                        <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {item.title}
                        </Text>

                        {isMeeting ? (
                          <View style={styles.partnerRow}>
                            <Users size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.partnerText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.participants} • {item.company}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.partnerRow}>
                            <CheckSquare size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.partnerText, { color: colors.textSecondary }]} numberOfLines={1}>
                              Phụ trách: {item.participants}
                            </Text>
                          </View>
                        )}

                        {item.location && (
                          <View style={styles.locationRow}>
                            {item.format === "online" ? (
                              <Video size={13} color={colors.accent} style={{ marginRight: 4 }} />
                            ) : (
                              <MapPin size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            )}
                            <Text style={[styles.locationText, { color: item.format === "online" ? colors.accent : colors.textSecondary }]} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. THƯ KÝ AI FLOATING BANNER */}
              <TouchableOpacity
                style={[
                  styles.aiSecretaryBanner,
                  {
                    backgroundColor: isDark ? "rgba(216, 178, 130, 0.12)" : "#FDF8F2",
                    borderColor: colors.accent,
                  },
                ]}
                onPress={onOpenAiAssistant}
                activeOpacity={0.85}
              >
                <View style={styles.aiSecretaryIconWrap}>
                  <Sparkles size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiSecretaryTitle, { color: colors.textPrimary }]}>
                    Trợ Lý Thư Ký AI Luôn Sẵn Sàng
                  </Text>
                  <Text style={[styles.aiSecretaryDesc, { color: colors.textSecondary }]}>
                    Nhấn để ra lệnh: "Tôi có lịch họp lúc mấy giờ?", "Sắp xếp lại công việc hôm nay"...
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.accent} />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
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
    maxHeight: "92%",
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
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 11,
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
    textAlign: "center",
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  healthCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  healthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  healthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  healthBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  healthWarningText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
  },
  healthAiText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  optimizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  optimizeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  reminderTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  reminderTime: {
    fontSize: 11,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  filterChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterChipActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  eventCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  eventTimeCol: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(150, 150, 150, 0.15)",
    paddingRight: 8,
    marginRight: 10,
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  eventDateSub: {
    fontSize: 10,
    marginTop: 2,
  },
  eventInfoCol: {
    flex: 1,
  },
  eventBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  kindBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  partnerText: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
  },
  aiSecretaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  aiSecretaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  aiSecretaryTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  aiSecretaryDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
