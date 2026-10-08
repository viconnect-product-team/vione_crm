import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
  TrendingUp,
  Tag,
  CheckCircle,
  Calendar,
  MessageSquare,
  Clock,
  Briefcase,
  Plus,
} from "lucide-react-native";
import { customerApi } from "../api/services";

export interface B2BCustomerData {
  id: string;
  name: string;
  contactPerson: string;
  title?: string;
  phone?: string;
  email?: string;
  dealValue: string;
  stage: string;
  priority: string;
  tags?: string[];
  needs?: string[];
  notes?: string;
  lastContactDate?: string;
}

interface CustomerDetailModalProps {
  visible: boolean;
  customer: B2BCustomerData | null;
  onClose: () => void;
  onOpenChat?: (customer: B2BCustomerData) => void;
  onScheduleMeeting?: (customer: B2BCustomerData) => void;
  onUpdateCustomer?: (customer: B2BCustomerData) => void;
}

const DEAL_STAGES = ["Tiếp cận", "Tư vấn & Báo giá", "Đàm phán HĐ", "Ký kết thành công"];

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  visible,
  customer,
  onClose,
  onOpenChat,
  onScheduleMeeting,
  onUpdateCustomer,
}) => {
  if (!customer) return null;

  const [currentStage, setCurrentStage] = useState(customer.stage || "Đàm phán HĐ");
  const [dealHealth, setDealHealth] = useState<"hot" | "healthy" | "risk">("hot");
  const [notes, setNotes] = useState(
    customer.notes || "Khách hàng quan tâm gói giải pháp chuyển đổi số & cung ứng vật tư. Đã gửi hồ sơ năng lực."
  );
  const [tags, setTags] = useState<string[]>(customer.tags || ["Thầu chính", "Khách VIP", "Cần chăm sóc"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  const [touchpoints, setTouchpoints] = useState<Array<{ id: string; type: string; title: string; time: string }>>([
    { id: "tp-1", type: "meet", title: "Gặp mặt 1-1 tại phòng VIP ViOne Lounge trao đổi nhu cầu", time: "Hôm qua 15:30" },
    { id: "tp-2", type: "quote", title: "Đã gửi hồ sơ năng lực & bảng dự toán sơ bộ", time: "2 ngày trước" },
    { id: "tp-3", type: "call", title: "Cuộc gọi thiết lập mối quan hệ từ sự kiện kết nối", time: "Tuần trước" },
  ]);

  const handleAddTouchpoint = (type: "call" | "meet" | "quote" | "message") => {
    const labels: Record<string, string> = {
      call: "Cuộc gọi điện thoại tư vấn giải pháp",
      meet: "Cuộc gặp trực tiếp 1-1 tại ViOne",
      quote: "Gửi báo giá & dự toán ngân sách",
      message: "Trao đổi tin nhắn tiến độ hợp đồng",
    };
    const newEntry = {
      id: `tp-${Date.now()}`,
      type,
      title: labels[type] || "Tương tác khách hàng",
      time: "Vừa xong",
    };
    setTouchpoints((prev) => [newEntry, ...prev]);
    Alert.alert("Ghi nhận tương tác", `Đã lưu nhật ký: ${labels[type]}`);
  };

  const phone = customer.phone || "0912 345 678";
  const email = customer.email || "contact@" + customer.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".vn";
  const title = customer.title || "Giám Đốc Mua Hàng & Chuỗi Cung Ứng";

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput("");
      setShowAddTag(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.priorityRow}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>Ưu tiên {customer.priority}</Text>
                </View>
                <View style={styles.stageBadge}>
                  <Text style={styles.stageText}>{currentStage}</Text>
                </View>
              </View>
              <Text style={styles.customerName} numberOfLines={1}>
                {customer.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Deal Value Card */}
            <LinearGradient
              colors={["#181D2A", "#0E1522"]}
              style={styles.dealCard}
            >
              <View style={styles.dealIconBox}>
                <DollarSign size={20} color="#D8B282" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dealLabel}>GIÁ TRỊ THỎA THUẬN DỰ KIẾN</Text>
                <Text style={styles.dealValueText}>{customer.dealValue}</Text>
              </View>
              <View style={styles.dealStatusPill}>
                <TrendingUp size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.dealStatusText}>Tiềm năng cao</Text>
              </View>
            </LinearGradient>

            {/* Deal Stage Progression Stepper */}
            <Text style={styles.sectionHeader}>GIAI ĐOẠN PHỄU DEAL (CHẠM ĐỂ CHUYỂN)</Text>
            <View style={styles.stageStepperWrap}>
              {DEAL_STAGES.map((stg, idx) => {
                const isCurrent = currentStage === stg;
                return (
                  <TouchableOpacity
                    key={stg}
                    onPress={() => setCurrentStage(stg)}
                    style={[styles.stageStepBtn, isCurrent && styles.stageStepBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.stageStepText, isCurrent && styles.stageStepTextActive]}>
                      {idx + 1}. {stg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deal Health Selector */}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>SỨC KHỎE THƯƠNG VỤ (DEAL HEALTH)</Text>
            <View style={styles.healthRow}>
              <TouchableOpacity
                style={[styles.healthPill, dealHealth === "hot" && styles.healthPillHotActive]}
                onPress={() => setDealHealth("hot")}
                activeOpacity={0.8}
              >
                <Text style={[styles.healthPillText, dealHealth === "hot" && { color: "#EF4444", fontWeight: "800" }]}>
                  🔥 Nóng (90% Win)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthPill, dealHealth === "healthy" && styles.healthPillHealthyActive]}
                onPress={() => setDealHealth("healthy")}
                activeOpacity={0.8}
              >
                <Text style={[styles.healthPillText, dealHealth === "healthy" && { color: "#10B981", fontWeight: "800" }]}>
                  🟢 Ổn định (70%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthPill, dealHealth === "risk" && styles.healthPillRiskActive]}
                onPress={() => setDealHealth("risk")}
                activeOpacity={0.8}
              >
                <Text style={[styles.healthPillText, dealHealth === "risk" && { color: "#F59E0B", fontWeight: "800" }]}>
                  ⚠️ Cần chăm sóc (40%)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contact Person Details */}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>NGƯỜI ĐẠI DIỆN LIÊN HỆ</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <User size={15} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.infoTextBold}>{customer.contactPerson}</Text>
                <Text style={styles.infoTextSub}> · {title}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Phone size={14} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{phone}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Mail size={14} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{email}</Text>
              </View>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => {
                  onClose();
                  if (onOpenChat) onOpenChat(customer);
                }}
              >
                <MessageSquare size={15} color="#050C15" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrimaryText}>Nhắn tin B2B</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => Alert.alert("Gọi điện", `Kết nối thoại tới: ${phone}`)}
              >
                <Phone size={15} color="#D8B282" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnSecondaryText}>Gọi điện</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  onClose();
                  if (onScheduleMeeting) onScheduleMeeting(customer);
                }}
              >
                <Calendar size={15} color="#D8B282" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnSecondaryText}>Hẹn 1-1</Text>
              </TouchableOpacity>
            </View>

            {/* Touchpoints Timeline */}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>NHẬT KÝ TƯƠNG TÁC ĐA KÊNH</Text>
            <View style={styles.quickTouchpointBar}>
              <TouchableOpacity style={styles.touchpointBtn} onPress={() => handleAddTouchpoint("call")}>
                <Text style={styles.touchpointBtnText}>+ Cuộc gọi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.touchpointBtn} onPress={() => handleAddTouchpoint("meet")}>
                <Text style={styles.touchpointBtnText}>+ Gặp 1-1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.touchpointBtn} onPress={() => handleAddTouchpoint("quote")}>
                <Text style={styles.touchpointBtnText}>+ Báo giá</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.touchpointBtn} onPress={() => handleAddTouchpoint("message")}>
                <Text style={styles.touchpointBtnText}>+ Tin nhắn</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timelineBox}>
              {touchpoints.map((tp) => (
                <View key={tp.id} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineTitle}>{tp.title}</Text>
                    <Text style={styles.timelineTime}>{tp.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tags Management */}
            <View style={[styles.tagsHeaderRow, { marginTop: 14 }]}>
              <Text style={styles.sectionHeader}>THẺ PHÂN LOẠI KHÁCH HÀNG</Text>
              <TouchableOpacity onPress={() => setShowAddTag(!showAddTag)}>
                <Text style={styles.addTagLink}>+ Thêm thẻ</Text>
              </TouchableOpacity>
            </View>

            {showAddTag && (
              <View style={styles.addTagRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Nhập tên thẻ phân loại..."
                  placeholderTextColor="#94A3B8"
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                />
                <TouchableOpacity style={styles.tagConfirmBtn} onPress={handleAddTag}>
                  <Text style={styles.tagConfirmText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.tagsWrap}>
              {tags.map((t, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Tag size={11} color="#D8B282" style={{ marginRight: 4 }} />
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            {/* Notes & Needs */}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>GHI CHÚ CHĂM SÓC & TIẾN ĐỘ</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ghi chú diễn biến cuộc gặp, yêu cầu của đối tác..."
              placeholderTextColor="#94A3B8"
            />
          </ScrollView>

          {/* Footer Save */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={async () => {
                const updated: B2BCustomerData = {
                  ...customer,
                  stage: currentStage,
                  notes,
                  tags,
                };
                if (onUpdateCustomer) {
                  onUpdateCustomer(updated);
                }

                if (customer.id) {
                  try {
                    await customerApi.addCustomerLog(customer.id, { content: notes });
                    await customerApi.setCustomerTags(customer.id, tags);
                  } catch (err) {
                    console.warn("Lỗi lưu customer log lên server:", err);
                  }
                }
                Alert.alert("Thành công", "Đã cập nhật tiến độ chăm sóc khách hàng và giai đoạn deal.");
                onClose();
              }}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGradient}
              >
                <CheckCircle size={16} color="#050C15" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Lưu Tiến Độ Chăm Sóc</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0E1522",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  priorityBadge: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#F43F5E",
  },
  priorityText: {
    color: "#F43F5E",
    fontSize: 10,
    fontWeight: "700",
  },
  stageBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageText: {
    color: "#D8B282",
    fontSize: 10,
    fontWeight: "600",
  },
  customerName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  dealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    marginBottom: 16,
  },
  dealIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dealLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dealValueText: {
    color: "#D8B282",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  dealStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealStatusText: {
    color: "#10B981",
    fontSize: 10.5,
    fontWeight: "700",
  },
  sectionHeader: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "#181D2A",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoTextBold: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  infoTextSub: {
    color: "#94A3B8",
    fontSize: 12,
  },
  infoText: {
    color: "#E2E8F0",
    fontSize: 12.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 8,
  },
  actionsBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    color: "#050C15",
    fontSize: 12,
    fontWeight: "700",
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  actionBtnSecondaryText: {
    color: "#D8B282",
    fontSize: 12,
    fontWeight: "600",
  },
  tagsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addTagLink: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "700",
  },
  addTagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#181D2A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#FFFFFF",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tagConfirmBtn: {
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tagConfirmText: {
    color: "#050C15",
    fontSize: 11,
    fontWeight: "700",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  tagText: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: "#181D2A",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 12.5,
    textAlignVertical: "top",
    minHeight: 70,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  saveBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "800",
  },
  stageStepperWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  stageStepBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  stageStepBtnActive: {
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    borderColor: "#D8B282",
  },
  stageStepText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  stageStepTextActive: {
    color: "#F6E1C3",
    fontWeight: "700",
  },
  healthRow: {
    flexDirection: "row",
    gap: 6,
  },
  healthPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  healthPillHotActive: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
  },
  healthPillHealthyActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10B981",
  },
  healthPillRiskActive: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
  },
  healthPillText: {
    fontSize: 10.5,
    color: "#94A3B8",
    fontWeight: "600",
  },
  quickTouchpointBar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  touchpointBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  touchpointBtnText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
  },
  timelineBox: {
    backgroundColor: "#181D2A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D8B282",
    marginTop: 5,
  },
  timelineTitle: {
    color: "#F8FAFC",
    fontSize: 11.5,
    fontWeight: "600",
  },
  timelineTime: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
});
