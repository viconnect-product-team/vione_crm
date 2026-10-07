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
  Image,
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
  Upload,
  Image as ImageIcon,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
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
  "Gia Đình ViOne",
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
  const { isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dealValue, setDealValue] = useState("");
  const [communityName, setCommunityName] = useState(COMMUNITIES[0]);
  const [duration, setDuration] = useState("14");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = () => {
    if (images.length >= 5) {
      Alert.alert("Giới hạn ảnh", "Tối đa 5 ảnh đính kèm cho mỗi cơ hội kinh doanh.");
      return;
    }
    const sampleImages = [
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80",
    ];
    const nextImg = sampleImages[images.length % sampleImages.length];
    setImages((prev) => [...prev, nextImg]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
    setImages([]);
    onClose();
  };

  const sheetBg = isDark ? "#0B0F17" : "#FFFFFF";
  const inputBg = isDark ? "#0E1522" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const mutedText = isDark ? "#94A3B8" : "#64748B";
  const labelColor = isDark ? "#CBD5E1" : "#334155";
  const borderColor = isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: sheetBg, borderColor }]}>
          {/* Header */}
          <View style={[styles.headerBar, { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Briefcase size={16} color="#DFB76C" />
              </View>
              <Text style={[styles.headerTitle, { color: textColor }]}>Đăng cơ hội kinh doanh B2B</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" }]}
              activeOpacity={0.7}
            >
              <X size={20} color={mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.8 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Project Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Tên dự án / Nhu cầu cung ứng B2B *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                placeholder="Ví dụ: Triển khai Hệ thống MEP Tòa Nhà Keangnam..."
                placeholderTextColor={mutedText}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Deal Value */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Quy mô ngân sách / Giá trị hợp đồng *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                placeholder="Ví dụ: 3.5 Tỷ VNĐ hoặc Thỏa thuận"
                placeholderTextColor={mutedText}
                value={dealValue}
                onChangeText={setDealValue}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Lĩnh vực ngành nghề</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: active
                            ? isDark ? "rgba(223, 183, 108, 0.18)" : "#FDF6EC"
                            : inputBg,
                          borderColor: active ? "#DFB76C" : inputBorder,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tagPillText,
                          {
                            color: active ? (isDark ? "#DFB76C" : "#8C653B") : mutedText,
                            fontWeight: active ? "700" : "500",
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Target Community */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Đăng trong cộng đồng / Liên minh</Text>
              <View style={styles.communityOptionsCol}>
                {COMMUNITIES.map((c) => {
                  const active = communityName === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.communityOption,
                        {
                          backgroundColor: active
                            ? isDark ? "rgba(223, 183, 108, 0.12)" : "#FDF6EC"
                            : inputBg,
                          borderColor: active ? "#DFB76C" : inputBorder,
                        },
                      ]}
                      onPress={() => setCommunityName(c)}
                      activeOpacity={0.8}
                    >
                      <Building2
                        size={15}
                        color={active ? "#DFB76C" : mutedText}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.communityOptionText,
                          {
                            color: active ? textColor : mutedText,
                            fontWeight: active ? "700" : "500",
                          },
                        ]}
                      >
                        {c}
                      </Text>
                      {active && <Check size={16} color="#DFB76C" style={{ marginLeft: "auto" }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Thời hạn tiếp nhận hồ sơ</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((dur) => {
                  const active = duration === dur.id;
                  return (
                    <TouchableOpacity
                      key={dur.id}
                      style={[
                        styles.durBtn,
                        {
                          backgroundColor: active
                            ? isDark ? "rgba(223, 183, 108, 0.18)" : "#FDF6EC"
                            : inputBg,
                          borderColor: active ? "#DFB76C" : inputBorder,
                        },
                      ]}
                      onPress={() => setDuration(dur.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.durBtnText,
                          {
                            color: active ? (isDark ? "#DFB76C" : "#8C653B") : mutedText,
                            fontWeight: active ? "700" : "500",
                          },
                        ]}
                      >
                        {dur.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Image attachments with thumbnails and delete buttons */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: labelColor, marginBottom: 0 }]}>
                  Hình ảnh minh họa sản phẩm / dịch vụ
                </Text>
                <Text style={{ fontSize: 11, color: mutedText }}>
                  {images.length > 0 ? `${images.length}/5 ảnh` : "Tối đa 5 ảnh"}
                </Text>
              </View>

              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((img, idx) => (
                    <View key={idx} style={[styles.imagePreviewBox, { borderColor: inputBorder }]}>
                      <Image source={{ uri: img }} style={styles.imageThumbnail} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => handleRemoveImage(idx)}
                        activeOpacity={0.8}
                      >
                        <X size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Upload size={16} color="#DFB76C" style={{ marginRight: 8 }} />
                <Text style={[styles.uploadBtnText, { color: textColor }]}>
                  {images.length === 0 ? "Chạm để đính kèm ảnh minh họa" : "Thêm ảnh khác (+)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description & Criteria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Mô tả yêu cầu & tiêu chí chọn nhà thầu</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                ]}
                placeholder="Yêu cầu về năng lực, hồ sơ chứng chỉ, tiến độ nghiệm thu và thông tin liên hệ bảo mật..."
                placeholderTextColor={mutedText}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </ScrollView>

          {/* Bottom Submit */}
          <View style={[styles.bottomFooter, { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FFF2DC", "#DFB76C", "#D4AF37", "#B88E3E"]}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  tagPillText: {
    fontSize: 12,
  },
  communityOptionsCol: {
    gap: 8,
    marginTop: 4,
  },
  communityOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  communityOptionText: {
    fontSize: 12,
  },
  durationRow: {
    flexDirection: "row",
    gap: 10,
  },
  durBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  durBtnText: {
    fontSize: 12,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  imagePreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
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
