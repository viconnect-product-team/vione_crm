import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Briefcase,
  User,
  Clock,
  Sparkles,
  Target,
  Phone,
  AlertTriangle,
} from "lucide-react-native";
import { apiRequest } from "../api/client";

export interface AssignTaskModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: string;
  onTaskCreated?: (task: any) => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  visible,
  onClose,
  communityId,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeName, setAssigneeName] = useState("Nguyễn Thị Mai");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium">("high");
  const [deadline, setDeadline] = useState("Hôm nay, 17:30");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerRequirements, setCustomerRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề công việc!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigneeName: assigneeName.trim() || "Nhân sự",
        priority,
        deadline: deadline.trim() || "Trong hôm nay",
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerRequirements: customerRequirements.trim() || null,
      };

      const res = await apiRequest(`connect-app/community/${communityId}/tasks`, {
        method: "POST",
        body: payload,
      }).catch(async () => {
        return await apiRequest(`communities/${communityId}/tasks`, {
          method: "POST",
          body: payload,
        });
      });

      const newTask = res.data?.task || {
        id: `task-${Date.now()}`,
        communityId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: "emp-new",
        assigneeName: assigneeName.trim() || "Nhân sự",
        assignerName: "Ban Giám Đốc",
        priority,
        status: "assigned",
        acceptedAt: null,
        completedAt: null,
        deadline: deadline.trim() || "Trong hôm nay",
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerRequirements: customerRequirements.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      Alert.alert(
        "Thành công",
        `Đã giao việc "${title}" cho ${assigneeName} thành công! Nhân viên sẽ thấy nút [⚡ TIẾN HÀNH NHẬN VIỆC] trên ứng dụng.`
      );

      if (onTaskCreated) onTaskCreated(newTask);
      onClose();

      // Reset
      setTitle("");
      setDescription("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerRequirements("");
    } catch {
      Alert.alert("Lỗi", "Không thể giao việc. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <Briefcase size={16} color="#D8B282" />
              <Text style={styles.modalTitle}>Giao Việc Mới Cho Nhân Sự</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Tiêu đề việc */}
            <Text style={styles.inputLabel}>Tiêu đề công việc *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Tư vấn giải pháp Thẻ NFC cho Tập đoàn ABC..."
              placeholderTextColor="#64748B"
            />

            {/* Độ ưu tiên */}
            <Text style={styles.inputLabel}>Mức độ ưu tiên</Text>
            <View style={styles.priorityRow}>
              {(
                [
                  { key: "urgent", label: "Khẩn cấp", color: "#EF4444" },
                  { key: "high", label: "Ưu tiên cao", color: "#F59E0B" },
                  { key: "medium", label: "Bình thường", color: "#10B981" },
                ] as const
              ).map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.priorityBtn,
                    priority === p.key && {
                      borderColor: p.color,
                      backgroundColor: `${p.color}20`,
                    },
                  ]}
                  onPress={() => setPriority(p.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      priority === p.key && { color: p.color, fontWeight: "800" },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nhân viên & Deadline */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Nhân viên thực hiện</Text>
                <TextInput
                  style={styles.input}
                  value={assigneeName}
                  onChangeText={setAssigneeName}
                  placeholder="Họ tên nhân viên"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Hạn chót (Deadline)</Text>
                <TextInput
                  style={styles.input}
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="Hôm nay, 17:30"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Khách hàng liên kết */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Tên khách hàng / Đối tác</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="VD: Tập Đoàn Hoàng Minh"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Số điện thoại khách</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="0912..."
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Chi tiết nội dung */}
            <Text style={styles.inputLabel}>Yêu cầu & Hướng dẫn chi tiết</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Gặp gỡ ban lãnh đạo, tư vấn cấu hình thẻ NFC và đồng bộ CRM..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />

            {/* Yêu cầu của khách */}
            <Text style={styles.inputLabel}>Ghi chú nhu cầu khách hàng</Text>
            <TextInput
              style={styles.input}
              value={customerRequirements}
              onChangeText={setCustomerRequirements}
              placeholder="Tích hợp logo thương hiệu mạ vàng, phân quyền CRM 3 cấp..."
              placeholderTextColor="#64748B"
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtnTouch}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#050811" />
                ) : (
                  <>
                    <Sparkles size={15} color="#050811" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Giao việc ngay</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D8B282",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  priorityBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  priorityBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#FFFFFF",
  },
  textArea: {
    height: 75,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  saveBtnTouch: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#050811",
  },
});
