import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Briefcase,
  DollarSign,
  Tag,
  Calendar,
  Building2,
  FileText,
  Plus,
  Check,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { CommunityOpportunityItem } from "./OpportunityDetailModal";
import { opportunityApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CreateOpportunityModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (newOpp: CommunityOpportunityItem) => void;
}

const CATEGORIES = [
  "Công Nghệ & AI",
  "Đầu Tư & Xây Dựng",
  "Thiết Kế Nội Thất",
  "Bán Lẻ & Logistics",
  "Tài Chính & M&A",
];

const COMMUNITIES = [
  "ViOne C-Level Enterprise Hub",
  "CLB Doanh Nhân ViOne Global Leaders",
  "Liên Minh Doanh Nghiệp Công Nghệ & AI",
  "Diễn Đàn Đầu Tư B2B Việt Nam",
];

const DURATIONS = [
  { id: "7", label: "7 ngày" },
  { id: "14", label: "14 ngày" },
  { id: "30", label: "30 ngày" },
];

export const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dealValue, setDealValue] = useState("");
  const [communityName, setCommunityName] = useState(COMMUNITIES[0]);
  const [duration, setDuration] = useState("14");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên dự án hoặc gói thầu B2B.");
      return;
    }
    if (!dealValue.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập quy mô ngân sách (ví dụ: 1.5 Tỷ VNĐ).");
      return;
    }

    setSubmitting(true);
    const newOpp: CommunityOpportunityItem = {
      id: `opp-${Date.now()}`,
      title: title.trim(),
      organization: "Doanh nghiệp thành viên ViOne",
      communityName,
      dealValue: dealValue.trim(),
      category,
      daysLeft: `Còn ${duration} ngày`,
      interested: false,
    };

    try {
      await opportunityApi.createOpportunity({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        duration: `${duration} ngày`,
      });
    } catch (err) {
      console.warn("Lỗi tạo opportunity lên API:", err);
    }

    onCreate(newOpp);
    setSubmitting(false);
    Alert.alert("Thành công", "Cơ hội kinh doanh B2B đã được công bố trên mạng lưới cộng đồng ViOne.");
    setTitle("");
    setDealValue("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Briefcase size={16} color="#D8B282" />
              </View>
              <Text style={styles.headerTitle}>Đăng cơ hội kinh doanh B2B</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.8 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Project Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên dự án / Nhu cầu cung ứng B2B *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Triển khai Hệ thống MEP Tòa Nhà Keangnam..."
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Deal Value */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quy mô ngân sách / Giá trị hợp đồng *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: 3.5 Tỷ VNĐ hoặc Thỏa thuận"
                placeholderTextColor="#64748B"
                value={dealValue}
                onChangeText={setDealValue}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lĩnh vực ngành nghề</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.tagPill, category === cat && styles.tagPillActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tagPillText, category === cat && styles.tagPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Target Community */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Đăng trong cộng đồng / Liên minh</Text>
              <View style={styles.communityOptionsCol}>
                {COMMUNITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.communityOption, communityName === c && styles.communityOptionActive]}
                    onPress={() => setCommunityName(c)}
                    activeOpacity={0.8}
                  >
                    <Building2
                      size={15}
                      color={communityName === c ? "#D8B282" : "#94A3B8"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.communityOptionText,
                        communityName === c && styles.communityOptionTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                    {communityName === c && <Check size={16} color="#D8B282" style={{ marginLeft: "auto" }} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Thời hạn tiếp nhận hồ sơ</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((dur) => (
                  <TouchableOpacity
                    key={dur.id}
                    style={[styles.durBtn, duration === dur.id && styles.durBtnActive]}
                    onPress={() => setDuration(dur.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.durBtnText, duration === dur.id && styles.durBtnTextActive]}>
                      {dur.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description & Criteria */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mô tả yêu cầu & tiêu chí chọn nhà thầu</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Yêu cầu về năng lực, hồ sơ chứng chỉ, tiến độ nghiệm thu và thông tin liên hệ bảo mật..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </ScrollView>

          {/* Bottom Submit */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Plus size={18} color="#050C15" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>
                  {submitting ? "Đang đăng cơ hội..." : "Công bố cơ hội kinh doanh"}
                </Text>
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
    backgroundColor: "#0B0F17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 13,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  tagScroll: {
    flexDirection: "row",
    marginTop: 4,
  },
  tagPill: {
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  tagPillActive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderColor: "#D8B282",
  },
  tagPillText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  tagPillTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  communityOptionsCol: {
    gap: 8,
    marginTop: 4,
  },
  communityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  communityOptionActive: {
    borderColor: "rgba(216, 178, 130, 0.5)",
    backgroundColor: "rgba(216, 178, 130, 0.08)",
  },
  communityOptionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  communityOptionTextActive: {
    color: "#F8FAFC",
    fontWeight: "600",
  },
  durationRow: {
    flexDirection: "row",
    gap: 10,
  },
  durBtn: {
    flex: 1,
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  durBtnActive: {
    borderColor: "#D8B282",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
  },
  durBtnText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  durBtnTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  submitBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
