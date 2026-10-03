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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ListTodo,
  Kanban,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  X,
  Plus,
  CheckSquare,
  Square,
  TrendingUp,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { operationsApi } from "../api/services";

interface WorkflowModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<"tasks" | "team">("tasks");

  const [myTasks, setMyTasks] = useState([
    {
      id: "t1",
      code: "TSK-081",
      title: "Phê duyệt kiến trúc kỹ thuật ViOne Platform 5.0",
      project: "Dự Án ViOne 5.0 Enterprise",
      deadline: "18:00 Hôm nay",
      isOverdue: false,
      priority: "urgent",
      status: "in_progress",
      checklist: [
        { id: "c1", text: "Kiểm tra 80 Quy tắc nghiệp vụ BRD", done: true },
        { id: "c2", text: "Thẩm định kiến trúc Multi-Tenancy", done: true },
        { id: "c3", text: "Ký biên bản thẩm định giải pháp", done: false },
      ],
    },
    {
      id: "t2",
      code: "TSK-082",
      title: "Đối soát Napas VietQR 24/7 gạch nợ tức thời 1 giây",
      project: "Phân Hệ Tài Chính Số",
      deadline: "Quá hạn 1 ngày",
      isOverdue: true, // Cảnh báo ĐỎ RỰC BR-WRK-02
      priority: "urgent",
      status: "in_progress",
      checklist: [
        { id: "c4", text: "Kết nối API Napas QR động", done: true },
        { id: "c5", text: "Xử lý Webhook gạch nợ tự động trong 1s", done: false },
      ],
    },
    {
      id: "t3",
      code: "TSK-083",
      title: "Sản xuất và nạp chip Thẻ Titanium NFC đợt 1",
      project: "Hệ Sinh Thái Danh Thiếp Số",
      deadline: "15:00 Ngày mai",
      isOverdue: false,
      priority: "normal",
      status: "todo",
      checklist: [
        { id: "c6", text: "Kiểm tra phôi Titanium mạ vàng", done: false },
        { id: "c7", text: "Nạp token bảo mật mã hóa AES-256", done: false },
      ],
    },
  ]);

  const teamMembers = [
    {
      id: "emp-1",
      name: "Nguyễn Minh Đăng",
      role: "CEO & Solutions Architect",
      department: "Ban Giám Đốc",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      hoursWeek: 48.5, // > 45h -> QUÁ TẢI BR-WRK-14
      activeTasks: 4,
      kpi: 98,
      status: "overloaded",
    },
    {
      id: "emp-2",
      name: "Trần Thu Hà",
      role: "Giám Đốc Tài Chính (CFO)",
      department: "Tài Chính - Kế Toán",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      hoursWeek: 42.0,
      activeTasks: 3,
      kpi: 94,
      status: "active",
    },
    {
      id: "emp-3",
      name: "Vũ Mai Anh",
      role: "Trưởng Phòng Nhân Sự (HR Manager)",
      department: "Hành Chính Nhân Sự",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      hoursWeek: 38.0,
      activeTasks: 2,
      kpi: 96,
      status: "active",
    },
    {
      id: "emp-4",
      name: "Đặng Nam",
      role: "Chuyên Viên Vận Hành Cấp Cao",
      department: "Vận Hành Hệ Thống",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      hoursWeek: 46.0, // > 45h BR-WRK-14
      activeTasks: 5, // WIP = 5 BR-WRK-04
      kpi: 91,
      status: "overloaded",
    },
  ];

  useEffect(() => {
    if (visible) {
      operationsApi.getTasks().then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiTasks = res.data.data.map((t: any, idx: number) => ({
            id: t.id || `t-api-${idx}`,
            code: t.code || `TSK-0${idx + 80}`,
            title: t.title || "Công việc BPMN",
            project: t.project || "Vận hành ViOne",
            deadline: t.deadline || "Hôm nay",
            isOverdue: Boolean(t.isOverdue),
            priority: t.priority || "normal",
            status: t.status || "in_progress",
            checklist: Array.isArray(t.checklist)
              ? t.checklist.map((item: any, cIdx: number) => ({
                  id: `c-${cIdx}`,
                  text: typeof item === "string" ? item : item.text || "Checklist",
                  done: typeof item === "object" ? Boolean(item.done) : false,
                }))
              : [
                  { id: "c1", text: "Khảo sát và thẩm định", done: true },
                  { id: "c2", text: "Thực hiện và nghiệm thu", done: false },
                ],
          }));
          setMyTasks(apiTasks);
        }
      }).catch((err) => console.warn("Lỗi tải tasks từ API:", err));
    }
  }, [visible]);

  const toggleChecklist = (taskId: string, checkId: string) => {
    setMyTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist = t.checklist.map((c) =>
            c.id === checkId ? { ...c, done: !c.done } : c
          );
          const doneIndices = updatedChecklist
            .map((c, i) => (c.done ? i : -1))
            .filter((i) => i >= 0);

          operationsApi.updateTask(taskId, {
            completedChecklistIndices: doneIndices,
          }).catch((err) => console.warn("Lỗi cập nhật task lên API:", err));

          return {
            ...t,
            checklist: updatedChecklist,
          };
        }
        return t;
      })
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBadge}>
                    <Kanban size={20} color="#3C240E" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={styles.title}>Điều Hành & Giám Sát Doanh Nghiệp</Text>
                    <Text style={styles.subtitle}>BPMN 2.0 • Quy tắc BR-WRK-01 &rarr; 15</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Segmented Switcher */}
              <View style={styles.tabSwitcher}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === "tasks" && styles.tabBtnActive]}
                  onPress={() => setActiveTab("tasks")}
                >
                  <Text style={[styles.tabBtnText, activeTab === "tasks" && styles.tabBtnTextActive]}>
                    Việc Của Tôi ({myTasks.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === "team" && styles.tabBtnActive]}
                  onPress={() => setActiveTab("team")}
                >
                  <Text style={[styles.tabBtnText, activeTab === "team" && styles.tabBtnTextActive]}>
                    Theo Dõi Đội Ngũ ({teamMembers.length})
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                {/* PHÂN HỆ 1: VIỆC CỦA TÔI */}
                {activeTab === "tasks" && (
                  <View style={styles.listWrap}>
                    {myTasks.map((task) => (
                      <View
                        key={task.id}
                        style={[
                          styles.taskCard,
                          task.isOverdue && styles.taskCardOverdue, // ĐỎ RỰC BR-WRK-02
                        ]}
                      >
                        <View style={styles.taskCardHeader}>
                          <View style={styles.taskCodeRow}>
                            <Text style={styles.taskCode}>{task.code}</Text>
                            {task.priority === "urgent" && (
                              <View style={styles.urgentBadge}>
                                <Flame size={12} color="#DC2626" />
                                <Text style={styles.urgentText}>KHẨN CẤP</Text>
                              </View>
                            )}
                            {task.isOverdue && (
                              <View style={styles.overdueBadge}>
                                <Text style={styles.overdueText}>QUÁ HẠN</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.taskDeadline, task.isOverdue && styles.taskDeadlineOverdue]}>
                            {task.deadline}
                          </Text>
                        </View>

                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskProject}>{task.project}</Text>

                        {/* Checklist */}
                        <View style={styles.checklistWrap}>
                          {task.checklist.map((c) => (
                            <TouchableOpacity
                              key={c.id}
                              style={styles.checkItem}
                              onPress={() => toggleChecklist(task.id, c.id)}
                            >
                              {c.done ? (
                                <CheckSquare size={16} color="#D8B282" />
                              ) : (
                                <Square size={16} color="#94A3B8" />
                              )}
                              <Text style={[styles.checkText, c.done && styles.checkTextDone]}>
                                {c.text}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* PHÂN HỆ 2: THEO DÕI ĐỘI NGŨ (TEAM WORKLOAD) */}
                {activeTab === "team" && (
                  <View style={styles.listWrap}>
                    <View style={styles.kpiBriefing}>
                      <Text style={styles.kpiBriefingTitle}>
                        Tổng quan: 42/45 nhân sự có mặt • 2 nhân sự quá tải &gt;45h/tuần
                      </Text>
                      <Text style={styles.kpiBriefingSub}>
                        Hệ thống tự động phát hiện nguy cơ kiệt sức theo quy tắc BR-WRK-14
                      </Text>
                    </View>

                    {teamMembers.map((emp) => {
                      const isOverloaded = emp.hoursWeek > 45;
                      return (
                        <View
                          key={emp.id}
                          style={[styles.memberCard, isOverloaded && styles.memberCardOverloaded]}
                        >
                          <Image source={{ uri: emp.avatar }} style={styles.memberAvatar} />
                          <View style={styles.memberInfo}>
                            <View style={styles.memberNameRow}>
                              <Text style={styles.memberName}>{emp.name}</Text>
                              {isOverloaded && (
                                <View style={styles.overloadedTag}>
                                  <Text style={styles.overloadedTagText}>QUÁ TẢI</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.memberRole}>{emp.role} • {emp.department}</Text>

                            <View style={styles.memberStatsRow}>
                              <Text style={[styles.statValue, isOverloaded && styles.statValueOverloaded]}>
                                {emp.hoursWeek}h tuần này
                              </Text>
                              <Text style={styles.statDot}>•</Text>
                              <Text style={styles.statValue}>{emp.activeTasks} việc (WIP)</Text>
                              <Text style={styles.statDot}>•</Text>
                              <Text style={styles.statValue}>KPI {emp.kpi}%</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#12151F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
    fontFamily: "monospace",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#181D2A",
    borderRadius: 14,
    padding: 3,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: "#D8B282",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabBtnTextActive: {
    fontWeight: "800",
    color: "#050C15",
  },
  scrollBody: {
    paddingTop: 6,
    paddingBottom: 16,
  },
  listWrap: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: "#181D2A",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  taskCardOverdue: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  taskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  taskCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskCode: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
    color: "#D8B282",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#F43F5E",
  },
  overdueBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  taskDeadline: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  taskDeadlineOverdue: {
    color: "#F43F5E",
    fontWeight: "800",
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  taskProject: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  checklistWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: "#F5F7FA",
  },
  checkTextDone: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  kpiBriefing: {
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  kpiBriefingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F6E1C3",
  },
  kpiBriefingSub: {
    fontSize: 11,
    color: "#D4C3A3",
    marginTop: 2,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#181D2A",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  memberCardOverloaded: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "#EF4444",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  overloadedTag: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  overloadedTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  memberRole: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  memberStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D4C3A3",
  },
  statValueOverloaded: {
    color: "#F43F5E",
    fontWeight: "800",
  },
  statDot: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.2)",
  },
});
