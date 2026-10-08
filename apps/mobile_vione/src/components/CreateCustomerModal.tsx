import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  AlertCircle,
  Check,
  Tag,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface NewCustomerData {
  id: string;
  name: string;
  contactPerson: string;
  role?: string;
  phone?: string;
  email?: string;
  dealValue: string;
  stage: string;
  priority: string;
  notes?: string;
  tags?: string[];
  lastInteraction?: string;
}

interface CreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: NewCustomerData) => void;
}

const STAGES = [
  "Tiếp cận ban đầu",
  "Đang đàm phán",
  "Ký kết thành công",
  "Chăm sóc sau bán",
];

const PRIORITIES = [
  { label: "ƯU TIÊN CAO", color: "#EF4444" },
  { label: "TRUNG BÌNH", color: "#F59E0B" },
  { label: "TIÊU CHUẨN", color: "#3B82F6" },
];

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  visible,
  onClose,
  onCustomerCreated,
}) => {
  const { isDark } = useTheme();

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [stage, setStage] = useState(STAGES[1]); // "Đang đàm phán"
  const [priority, setPriority] = useState(PRIORITIES[0].label); // "ƯU TIÊN CAO"
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setName("");
    setContactPerson("");
    setRole("");
    setPhone("");
    setEmail("");
    setDealValue("");
    setStage(STAGES[1]);
    setPriority(PRIORITIES[0].label);
    setNotes("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên công ty hoặc khách hàng.");
      return;
    }
    if (!contactPerson.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên người liên hệ đại diện.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newCust: NewCustomerData = {
        id: `cust-${Date.now()}`,
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        role: role.trim() || "Đại diện kinh doanh",
        phone: phone.trim() || "0912 345 678",
        email: email.trim() || "contact@b2b.vn",
        dealValue: dealValue.trim() || "500 Triệu VND",
        stage,
        priority,
        notes: notes.trim(),
        tags: ["Khách hàng mới", priority],
        lastInteraction: "Vừa tạo hôm nay",
      };

      onCustomerCreated(newCust);
      setIsSubmitting(false);
      handleClose();
      Alert.alert("Thành công", `Đã lưu khách hàng "${newCust.name}" vào hệ thống CRM.`);
    }, 400);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0A0D14" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Thêm Khách Hàng Tiềm Năng
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Quản trị cơ hội và dữ liệu đối tác trong phễu CRM
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDark ? "#D8B282" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Tên công ty / Doanh nghiệp */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                Tên công ty / Doanh nghiệp <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? "#121722" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                  },
                ]}
              >
                <Building2 size={16} color="#D8B282" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                  placeholder="VD: Tập đoàn Dược Phẩm V-Pharma"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Người liên hệ & Chức vụ */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Người liên hệ <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? "#121722" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <User size={16} color="#D8B282" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="VD: Hoàng Tuấn Anh"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    value={contactPerson}
                    onChangeText={setContactPerson}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Chức vụ
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? "#121722" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Briefcase size={16} color="#D8B282" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="VD: Phó Giám đốc"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    value={role}
                    onChangeText={setRole}
                  />
                </View>
              </View>
            </View>

            {/* Số điện thoại & Email */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Số điện thoại
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? "#121722" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Phone size={16} color="#D8B282" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="0912 345 678"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Email
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? "#121722" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Mail size={16} color="#D8B282" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="b2b@company.vn"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
            </View>

            {/* Quy mô / Giá trị thương vụ */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                Quy mô thương vụ dự kiến
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? "#121722" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                  },
                ]}
              >
                <DollarSign size={16} color="#D8B282" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                  placeholder="VD: 1.50 Tỷ VND"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                  value={dealValue}
                  onChangeText={setDealValue}
                />
              </View>
            </View>

            {/* Giai đoạn phễu Pipeline */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                Giai đoạn Pipeline
              </Text>
              <View style={styles.chipsRow}>
                {STAGES.map((s) => {
                  const isSelected = stage === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.stageChip,
                        {
                          backgroundColor: isSelected
                            ? "#D8B282"
                            : isDark
                            ? "#181D2A"
                            : "#F1F5F9",
                          borderColor: isSelected
                            ? "#D8B282"
                            : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                        },
                      ]}
                      onPress={() => setStage(s)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stageChipText,
                          {
                            color: isSelected ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Mức độ ưu tiên */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                Mức độ ưu tiên
              </Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.label;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(216, 178, 130, 0.2)"
                              : "#F6E1C3"
                            : isDark
                            ? "#181D2A"
                            : "#F1F5F9",
                          borderColor: isSelected
                            ? "#D8B282"
                            : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                        },
                      ]}
                      onPress={() => setPriority(p.label)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text
                        style={[
                          styles.priorityChipText,
                          {
                            color: isSelected
                              ? isDark
                                ? "#D8B282"
                                : "#8C653B"
                              : isDark
                              ? "#94A3B8"
                              : "#64748B",
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ghi chú chiến lược */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                Ghi chú nội bộ
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? "#121722" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                  },
                ]}
                placeholder="Ghi lại nhu cầu trọng tâm, mối quan tâm về giá hoặc thời gian dự kiến..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                backgroundColor: isDark ? "#0A0D14" : "#FFFFFF",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
                },
              ]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Hủy bỏ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGrad}
              >
                <Check size={16} color="#050C15" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.submitText}>
                  {isSubmitting ? "Đang lưu..." : "Lưu khách hàng"}
                </Text>
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
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  sheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.12)",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  rowFields: {
    flexDirection: "row",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 12.5,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  priorityChipText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  submitBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
