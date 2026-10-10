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
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Kanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  X,
  Plus,
  CheckSquare,
  Square,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Send,
  Building2,
  ChevronRight,
  Filter,
} from "lucide-react-native";
import { operationsApi } from "../api/services";
import { resolveMediaUrl } from "../utils/media";

interface WorkflowModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAssignTask?: () => void;
}

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  project: string;
  department?: string;
  assigneeName: string;
  assignerName?: string;
  deadline: string;
  isOverdue: boolean;
  priority: "urgent" | "normal" | "low";
  status: "assigned" | "in_progress" | "completed";
  progress: number; // 0 - 100%
  progressNote?: string;
  checklist: Array<{ id: string; text: string; done: boolean }>;
}

const SAMPLE_EXCEL_TEMPLATES = [
  {
    title: "Quyết toán thuế & Lập báo cáo tài chính quý 1",
    department: "Tài Chính - Kế Toán",
    assigneeName: "Trần Thu Hà",
    priority: "urgent" as const,
    deadline: "17:30 Hôm nay",
  },
  {
    title: "Chăm sóc & tái ký hợp đồng chuỗi 15 đối tác VIP",
    department: "Kinh Doanh B2B",
    assigneeName: "Đặng Nam",
    priority: "normal" as const,
    deadline: "18:00 Ngày mai",
  },
  {
    title: "Tuyển dụng & Thử việc 03 Kỹ sư Hệ thống Cloud",
    department: "Hành Chính Nhân Sự",
    assigneeName: "Vũ Mai Anh",
    priority: "normal" as const,
    deadline: "Hết tuần này",
  },
  {
    title: "Nâng cấp giao diện Mobile & Tối ưu luồng PWA Offline",
    department: "Công Nghệ & Sản Phẩm",
    assigneeName: "Nguyễn Minh Đăng",
    priority: "urgent" as const,
    deadline: "12:00 Ngày mai",
  },
  {
    title: "Chiến dịch Truyền thông Thương hiệu Doanh nhân ViOne",
    department: "Marketing & Thương Hiệu",
    assigneeName: "Lê Phương Thảo",
    priority: "normal" as const,
    deadline: "Hết tháng",
  },
];

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  visible,
  onClose,
  onOpenAssignTask,
}) => {
  const [activeTab, setActiveTab] = useState<"tasks" | "team">("tasks");
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "t1",
      code: "TSK-081",
      title: "Phê duyệt kiến trúc kỹ thuật ViOne Platform 5.0",
      project: "Dự Án ViOne 5.0 Enterprise",
      department: "Công Nghệ & Giải Pháp",
      assigneeName: "Nguyễn Minh Đăng",
      assignerName: "Tổng Giám Đốc",
      deadline: "18:00 Hôm nay",
      isOverdue: false,
      priority: "urgent",
      status: "in_progress",
      progress: 70,
      progressNote: "Đã hoàn thành 80% module Multi-Tenant",
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
      department: "Tài Chính - Kế Toán",
      assigneeName: "Trần Thu Hà",
      assignerName: "Ban Giám Đốc",
      deadline: "Quá hạn 1 ngày",
      isOverdue: true,
      priority: "urgent",
      status: "assigned", // Chưa bấm nhận việc
      progress: 20,
      progressNote: "Đang chờ cấu hình webhook đối tác",
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
      department: "Vận Hành Sản Phẩm",
      assigneeName: "Đặng Nam",
      assignerName: "Phó Tổng Giám Đốc",
      deadline: "15:00 Ngày mai",
      isOverdue: false,
      priority: "normal",
      status: "in_progress",
      progress: 45,
      progressNote: "Đã kiểm nghiệm 200 phôi kim loại mạ vàng",
      checklist: [
        { id: "c6", text: "Kiểm tra phôi Titanium mạ vàng", done: true },
        { id: "c7", text: "Nạp token bảo mật mã hóa AES-256", done: false },
      ],
    },
  ]);

  const [teamMembers, setTeamMembers] = useState([
    {
      id: "emp-1",
      name: "Nguyễn Minh Đăng",
      role: "CEO & Solutions Architect",
      department: "Ban Giám Đốc",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      hoursWeek: 48.5,
      activeTasks: 4,
      avgProgress: 75,
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
      avgProgress: 60,
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
      avgProgress: 85,
      kpi: 96,
      status: "active",
    },
    {
      id: "emp-4",
      name: "Đặng Nam",
      role: "Chuyên Viên Vận Hành Cấp Cao",
      department: "Vận Hành Hệ Thống",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      hoursWeek: 46.0,
      activeTasks: 5,
      avgProgress: 45,
      kpi: 91,
      status: "overloaded",
    },
  ]);

  // Modal Update Progress State
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<TaskItem | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newProgressNote, setNewProgressNote] = useState<string>("");

  // Modal Import Excel State
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (visible) {
      operationsApi.getTasks().then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiTasks = res.data.data.map((t: any, idx: number) => ({
            id: t.id || `t-api-${idx}`,
            code: t.code || `TSK-0${idx + 80}`,
            title: t.title || "Công việc công ty",
            project: t.project || "Vận hành ViOne",
            department: t.department || "Vận Hành Doanh Nghiệp",
            assigneeName: t.assigneeName || "Nhân sự",
            assignerName: t.assignerName || "Lãnh đạo",
            deadline: t.deadline || "Hôm nay",
            isOverdue: Boolean(t.isOverdue),
            priority: t.priority || "normal",
            status: t.status || "in_progress",
            progress: typeof t.progress === "number" ? t.progress : 50,
            progressNote: t.progressNote || t.progress_note || "",
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
          setTasks(apiTasks);
        }
      }).catch((err) => console.warn("Lỗi tải tasks từ API:", err));
    }
  }, [visible]);

  // Luồng 1: Nhận việc (Accept Task)
  const handleAcceptTask = (task: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "in_progress",
              progressNote: `Đã nhận việc lúc ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            }
          : t
      )
    );
    Alert.alert(
      "✅ Đã Nhận Việc Thành Công!",
      `Bạn đã chính thức tiếp nhận công việc "${task.title}".\nHệ thống đã gửi thông báo đến Lãnh đạo (${task.assignerName || "Sếp"}) để bắt đầu theo dõi tiến độ.`
    );
  };

  // Luồng 2: Cập nhật tiến độ (% slider + ghi chú)
  const handleOpenUpdateProgress = (task: TaskItem) => {
    setSelectedTaskForProgress(task);
    setNewProgress(task.progress);
    setNewProgressNote(task.progressNote || "");
  };

  const handleSaveProgress = () => {
    if (!selectedTaskForProgress) return;
    const isCompleted = newProgress >= 100;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskForProgress.id
          ? {
              ...t,
              progress: newProgress,
              progressNote: newProgressNote.trim(),
              status: isCompleted ? "completed" : "in_progress",
            }
          : t
      )
    );
    Alert.alert(
      "✅ Cập Nhật Tiến Độ Thành Công!",
      `Tiến độ đã được ghi nhận: ${newProgress}%. Lãnh đạo có thể xem ngay trên Bảng điều hành.`
    );
    setSelectedTaskForProgress(null);
  };

  // Luồng 3: Import Excel File Mẫu Doanh Nghiệp
  const handleImportSampleExcel = () => {
    setIsImporting(true);
    setTimeout(() => {
      const imported: TaskItem[] = SAMPLE_EXCEL_TEMPLATES.map((tpl, idx) => ({
        id: `t-imp-${Date.now()}-${idx}`,
        code: `TSK-IMP-${idx + 1}`,
        title: tpl.title,
        project: "Kế Hoạch Doanh Nghiệp Quý 1",
        department: tpl.department,
        assigneeName: tpl.assigneeName,
        assignerName: "Tổng Giám Đốc",
        deadline: tpl.deadline,
        isOverdue: false,
        priority: tpl.priority,
        status: "assigned",
        progress: 0,
        progressNote: "Vừa nhập từ file Excel kế hoạch",
        checklist: [
          { id: `c-imp-1`, text: "Tiếp nhận và lập kế hoạch chi tiết", done: false },
          { id: `c-imp-2`, text: "Báo cáo tiến độ cho Lãnh đạo", done: false },
        ],
      }));

      setTasks((prev) => [...imported, ...prev]);
      setIsImporting(false);
      setShowImportExcelModal(false);
      Alert.alert(
        "🎉 Nhập Excel Thành Công!",
        `Đã nhập thành công ${imported.length} công việc mẫu của công ty vào hệ thống điều hành.`
      );
    }, 800);
  };

  const toggleChecklist = (taskId: string, checkId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist = t.checklist.map((c) =>
            c.id === checkId ? { ...c, done: !c.done } : c
          );
          const doneCount = updatedChecklist.filter((c) => c.done).length;
          const calculatedProgress = Math.round((doneCount / updatedChecklist.length) * 100);

          return {
            ...t,
            checklist: updatedChecklist,
            progress: calculatedProgress,
            status: calculatedProgress === 100 ? "completed" : t.status,
          };
        }
        return t;
      })
    );
  };

  const goldColor = "#DFB76C";
  const bgObsidian = "#0B0F17";
  const cardObsidian = "#121A26";
  const borderObsidian = "#1E293B";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header Bar */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBadge, { borderColor: goldColor }]}>
                    <Kanban size={20} color={goldColor} strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={styles.title}>Điều Hành & Giám Sát Công Việc</Text>
                    <Text style={styles.subtitle}>Quy trình chuẩn Doanh nghiệp • Báo cáo tiến độ Sếp</Text>
                  </View>
                </View>

                <View style={styles.headerRightActions}>
                  {/* Import Excel Button */}
                  <TouchableOpacity
                    onPress={() => setShowImportExcelModal(true)}
                    style={[styles.excelBtn, { borderColor: goldColor }]}
                  >
                    <FileSpreadsheet size={15} color={goldColor} />
                    <Text style={[styles.excelBtnText, { color: goldColor }]}>Excel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Segmented Switcher */}
              <View style={styles.tabSwitcher}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === "tasks" && styles.tabBtnActive]}
                  onPress={() => setActiveTab("tasks")}
                >
                  <Text style={[styles.tabBtnText, activeTab === "tasks" && styles.tabBtnTextActive]}>
                    Danh Sách Công Việc ({tasks.length})
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
                {/* PHÂN HỆ 1: CÔNG VIỆC & TIẾN ĐỘ */}
                {activeTab === "tasks" && (
                  <View style={styles.listWrap}>
                    {/* Actions bar */}
                    <View style={styles.listTopActions}>
                      <Text style={styles.sectionHeading}>Tiến độ công việc toàn bộ phòng ban</Text>
                      {onOpenAssignTask && (
                        <TouchableOpacity
                          onPress={() => {
                            onClose();
                            onOpenAssignTask();
                          }}
                          style={[styles.addBtn, { backgroundColor: goldColor }]}
                        >
                          <Plus size={14} color="#0B0F17" />
                          <Text style={styles.addBtnText}>Giao việc mới</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {tasks.map((task) => (
                      <View
                        key={task.id}
                        style={[
                          styles.taskCard,
                          task.isOverdue && styles.taskCardOverdue,
                        ]}
                      >
                        {/* Task Card Header */}
                        <View style={styles.taskCardHeader}>
                          <View style={styles.taskCodeRow}>
                            <Text style={styles.taskCode}>{task.code}</Text>
                            {task.department && (
                              <View style={styles.deptBadge}>
                                <Text style={styles.deptText}>{task.department}</Text>
                              </View>
                            )}
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
                            🕒 {task.deadline}
                          </Text>
                        </View>

                        {/* Title & Project */}
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskProject}>
                          Phụ trách: <Text style={{ color: goldColor, fontWeight: "600" }}>{task.assigneeName}</Text>
                          {task.assignerName ? ` • Người giao: ${task.assignerName}` : ""}
                        </Text>

                        {/* PROGRESS BAR (0 - 100%) */}
                        <View style={styles.progressSection}>
                          <View style={styles.progressHeaderRow}>
                            <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
                            <Text style={[styles.progressValue, { color: goldColor }]}>
                              {task.progress}%
                            </Text>
                          </View>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.min(100, Math.max(0, task.progress))}%`,
                                  backgroundColor: task.progress === 100 ? "#10B981" : goldColor,
                                },
                              ]}
                            />
                          </View>
                          {task.progressNote ? (
                            <Text style={styles.progressNoteText}>
                              📝 Ghi chú: {task.progressNote}
                            </Text>
                          ) : null}
                        </View>

                        {/* Checklist items */}
                        <View style={styles.checklistWrap}>
                          {task.checklist.map((c) => (
                            <TouchableOpacity
                              key={c.id}
                              style={styles.checkItem}
                              onPress={() => toggleChecklist(task.id, c.id)}
                            >
                              {c.done ? (
                                <CheckSquare size={16} color={goldColor} />
                              ) : (
                                <Square size={16} color="#64748B" />
                              )}
                              <Text style={[styles.checkText, c.done && styles.checkTextDone]}>
                                {c.text}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Task Card Bottom Actions */}
                        <View style={styles.taskCardActionsRow}>
                          {task.status === "assigned" ? (
                            <TouchableOpacity
                              onPress={() => handleAcceptTask(task)}
                              style={[styles.acceptTaskBtn, { backgroundColor: goldColor }]}
                            >
                              <UserCheck size={16} color="#0B0F17" />
                              <Text style={styles.acceptTaskBtnText}>Nhận việc ngay</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.statusBadgeAccepted}>
                              <CheckCircle2 size={14} color="#10B981" />
                              <Text style={styles.statusAcceptedText}>
                                {task.status === "completed" ? "Đã nghiệm thu" : "Đang triển khai"}
                              </Text>
                            </View>
                          )}

                          <TouchableOpacity
                            onPress={() => handleOpenUpdateProgress(task)}
                            style={[styles.updateProgressBtn, { borderColor: goldColor }]}
                          >
                            <TrendingUp size={14} color={goldColor} />
                            <Text style={[styles.updateProgressBtnText, { color: goldColor }]}>
                              Cập nhật tiến độ
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* PHÂN HỆ 2: THEO DÕI ĐỘI NGŨ (BOSS MONITORING VIEW) */}
                {activeTab === "team" && (
                  <View style={styles.listWrap}>
                    <View style={styles.kpiBriefing}>
                      <Text style={styles.kpiBriefingTitle}>
                        Tổng quan: 42/45 nhân sự có mặt • 2 nhân sự tải trọng cao
                      </Text>
                      <Text style={styles.kpiBriefingSub}>
                        Hệ thống tự động phát hiện và cảnh báo tiến độ cho Ban Giám Đốc
                      </Text>
                    </View>

                    {teamMembers.map((emp) => {
                      const isOverloaded = emp.hoursWeek > 45;
                      return (
                        <View
                          key={emp.id}
                          style={[styles.memberCard, isOverloaded && styles.memberCardOverloaded]}
                        >
                          <Image source={{ uri: resolveMediaUrl(emp.avatar) || emp.avatar }} style={styles.memberAvatar} />
                          <View style={styles.memberInfo}>
                            <View style={styles.memberNameRow}>
                              <Text style={styles.memberName}>{emp.name}</Text>
                              {isOverloaded && (
                                <View style={styles.overloadedTag}>
                                  <Text style={styles.overloadedTagText}>TẢI CAO</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.memberRole}>{emp.role} • {emp.department}</Text>

                            <View style={styles.memberStatsRow}>
                              <Text style={[styles.statValue, isOverloaded && styles.statValueOverloaded]}>
                                {emp.hoursWeek}h tuần này
                              </Text>
                              <Text style={styles.statDot}>•</Text>
                              <Text style={styles.statValue}>{emp.activeTasks} việc</Text>
                              <Text style={styles.statDot}>•</Text>
                              <Text style={[styles.statValue, { color: goldColor }]}>
                                Tiến độ TB: {emp.avgProgress}%
                              </Text>
                            </View>

                            {/* Mini Progress Bar for Employee */}
                            <View style={styles.miniProgressBarTrack}>
                              <View
                                style={[
                                  styles.miniProgressBarFill,
                                  { width: `${emp.avgProgress}%`, backgroundColor: goldColor },
                                ]}
                              />
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

      {/* POP-UP CẬP NHẬT TIẾN ĐỘ */}
      {selectedTaskForProgress && (
        <Modal transparent animationType="fade" visible={Boolean(selectedTaskForProgress)}>
          <View style={styles.progressModalBackdrop}>
            <View style={styles.progressModalBox}>
              <View style={styles.progressModalHeader}>
                <Text style={styles.progressModalTitle}>Đánh Giá & Cập Nhật Tiến Độ</Text>
                <TouchableOpacity onPress={() => setSelectedTaskForProgress(null)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.progressModalTaskTitle} numberOfLines={2}>
                {selectedTaskForProgress.title}
              </Text>

              {/* Progress Selector Chips */}
              <Text style={styles.progressInputLabel}>Chọn % hoàn thành:</Text>
              <View style={styles.progressChipsRow}>
                {[0, 25, 50, 75, 100].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    onPress={() => setNewProgress(pct)}
                    style={[
                      styles.pctChip,
                      newProgress === pct && [styles.pctChipActive, { borderColor: goldColor }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.pctChipText,
                        newProgress === pct && { color: goldColor, fontWeight: "700" },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Progress Note Input */}
              <Text style={styles.progressInputLabel}>Ghi chú tiến độ gửi Sếp:</Text>
              <TextInput
                value={newProgressNote}
                onChangeText={setNewProgressNote}
                placeholder="Ví dụ: Đã hoàn thiện thiết kế nháp, đang lấy ý kiến khách hàng..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                style={styles.progressNoteInput}
              />

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveProgress}
                style={[styles.saveProgressBtn, { backgroundColor: goldColor }]}
              >
                <Text style={styles.saveProgressBtnText}>Lưu & Báo Cáo Cho Sếp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* POP-UP IMPORT EXCEL DOANH NGHIỆP */}
      {showImportExcelModal && (
        <Modal transparent animationType="fade" visible={showImportExcelModal}>
          <View style={styles.progressModalBackdrop}>
            <View style={styles.progressModalBox}>
              <View style={styles.progressModalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <FileSpreadsheet size={20} color={goldColor} />
                  <Text style={styles.progressModalTitle}>Nhập Công Việc Từ Excel</Text>
                </View>
                <TouchableOpacity onPress={() => setShowImportExcelModal(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.excelDesc}>
                Tính năng hỗ trợ import tự động bảng công việc doanh nghiệp theo chuẩn phòng ban (Kế toán, Kinh doanh, Nhân sự, Vận hành, Marketing).
              </Text>

              <View style={styles.excelTemplatesBox}>
                <Text style={styles.excelTemplateTitle}>Mẫu file kế hoạch sẵn có:</Text>
                {SAMPLE_EXCEL_TEMPLATES.slice(0, 3).map((tpl, i) => (
                  <View key={i} style={styles.excelTemplateRow}>
                    <Text style={styles.excelRowDept}>[{tpl.department}]</Text>
                    <Text style={styles.excelRowTitle} numberOfLines={1}>
                      {tpl.title}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleImportSampleExcel}
                disabled={isImporting}
                style={[styles.saveProgressBtn, { backgroundColor: goldColor, marginTop: 16 }]}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#0B0F17" />
                ) : (
                  <>
                    <Upload size={18} color="#0B0F17" />
                    <Text style={styles.saveProgressBtnText}>Nhập Toàn Bộ Vào Hệ Thống</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    backgroundColor: "#0B0F17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.25)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(223, 183, 108, 0.1)",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  excelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(223, 183, 108, 0.08)",
  },
  excelBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#121A26",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "rgba(223, 183, 108, 0.2)",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabBtnTextActive: {
    color: "#DFB76C",
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  listWrap: {
    gap: 12,
  },
  listTopActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0B0F17",
  },
  taskCard: {
    backgroundColor: "#121A26",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
  },
  taskCardOverdue: {
    borderColor: "#DC2626",
    backgroundColor: "rgba(220, 38, 38, 0.05)",
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  taskCode: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  deptBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
  },
  deptText: {
    fontSize: 10,
    color: "#DFB76C",
    fontWeight: "600",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
  },
  urgentText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "700",
  },
  overdueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
  overdueText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  taskDeadline: {
    fontSize: 11,
    color: "#94A3B8",
  },
  taskDeadlineOverdue: {
    color: "#EF4444",
    fontWeight: "600",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  taskProject: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 10,
  },
  progressSection: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#1E293B",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressNoteText: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 6,
    fontStyle: "italic",
  },
  checklistWrap: {
    gap: 6,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: "#CBD5E1",
    flex: 1,
  },
  checkTextDone: {
    color: "#64748B",
    textDecorationLine: "line-through",
  },
  taskCardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  acceptTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  acceptTaskBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B0F17",
  },
  statusBadgeAccepted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusAcceptedText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
  },
  updateProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  updateProgressBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  kpiBriefing: {
    backgroundColor: "rgba(223, 183, 108, 0.08)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.2)",
    marginBottom: 4,
  },
  kpiBriefingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DFB76C",
  },
  kpiBriefingSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  memberCard: {
    flexDirection: "row",
    backgroundColor: "#121A26",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 12,
  },
  memberCardOverloaded: {
    borderColor: "#DC2626",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  overloadedTag: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overloadedTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  memberRole: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  memberStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  statValue: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  statValueOverloaded: {
    color: "#EF4444",
    fontWeight: "700",
  },
  statDot: {
    color: "#64748B",
  },
  miniProgressBarTrack: {
    height: 4,
    backgroundColor: "#1E293B",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  miniProgressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  progressModalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0B0F17",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.3)",
  },
  progressModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  progressModalTaskTitle: {
    fontSize: 13,
    color: "#DFB76C",
    fontWeight: "600",
    marginBottom: 12,
  },
  progressInputLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
  },
  progressChipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pctChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#121A26",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  pctChipActive: {
    backgroundColor: "rgba(223, 183, 108, 0.15)",
  },
  pctChipText: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  progressNoteInput: {
    backgroundColor: "#121A26",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
    color: "#FFFFFF",
    padding: 10,
    fontSize: 13,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveProgressBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F17",
  },
  excelDesc: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 12,
  },
  excelTemplatesBox: {
    backgroundColor: "#121A26",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 6,
  },
  excelTemplateTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DFB76C",
    marginBottom: 4,
  },
  excelTemplateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  excelRowDept: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  excelRowTitle: {
    fontSize: 11,
    color: "#CBD5E1",
    flex: 1,
  },
});
