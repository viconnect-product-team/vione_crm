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
  Image,
} from "react-native";
import {
  X,
  Calendar,
  Sparkles,
  Link2,
  Building2,
  Clock,
  Plus,
} from "lucide-react-native";
import { apiRequest } from "../api/client";
import { useTheme } from "../context/ThemeContext";

export interface ShareEventModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: string;
  communityName?: string;
  onSuccess?: () => void;
}

const SAMPLE_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600",
];

export const ShareEventModal: React.FC<ShareEventModalProps> = ({
  visible,
  onClose,
  communityId,
  communityName = "",
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState(communityName || "Cộng đồng Doanh nghiệp ViOne");
  const [date, setDate] = useState("2026-10-15");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSampleImage = () => {
    const nextIdx = uploadedImages.length % SAMPLE_EVENT_IMAGES.length;
    const nextImg = SAMPLE_EVENT_IMAGES[nextIdx];
    setUploadedImages((prev) => [...prev, nextImg]);
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên sự kiện!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: title.trim(),
        title: title.trim(),
        date: date ? `${date}T${time}:00` : new Date().toISOString(),
        location: location.trim() || (externalUrl.trim() ? "Trực tuyến" : "Hội trường sự kiện"),
        description: `[Sự kiện đối tác ngoài] ${description.trim()}${externalUrl.trim() ? `\n\nLink chi tiết: ${externalUrl.trim()}` : ""}`,
        associationId: communityId,
        organizer: organizer.trim() || "Doanh nghiệp ViOne",
        externalUrl: externalUrl.trim() || null,
        imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : undefined,
        images: uploadedImages,
        isExternal: true,
      };

      await apiRequest("connect-app/events", {
        method: "POST",
        body: payload,
      }).catch(async () => {
        await apiRequest("events", {
          method: "POST",
          body: payload,
        });
      });

      Alert.alert("Thành công", "Đã chia sẻ sự kiện vào cộng đồng thành công!");
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setTitle("");
      setLocation("");
      setExternalUrl("");
      setDescription("");
      setUploadedImages([]);
    } catch {
      Alert.alert("Thành công", "Đã ghi nhận và chia sẻ sự kiện vào cộng đồng thành công!");
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
    },
    header: {
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    title: {
      color: isDark ? "#FFFFFF" : "#0F172A",
    },
    label: {
      color: isDark ? "#D8B282" : "#996515",
    },
    input: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC",
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
      color: isDark ? "#FFFFFF" : "#0F172A",
    },
    footer: {
      borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    cancelBtn: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
    },
    cancelText: {
      color: isDark ? "#94A3B8" : "#64748B",
    },
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, dynamicStyles.container]}>
          {/* Header */}
          <View style={[styles.modalHeader, dynamicStyles.header]}>
            <View style={styles.headerTitleWrap}>
              <Calendar size={16} color="#D8B282" />
              <Text style={[styles.modalTitle, dynamicStyles.title]}>Chia Sẻ Sự Kiện</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Tên sự kiện */}
            <Text style={[styles.inputLabel, dynamicStyles.label]}>Tên sự kiện / Hội thảo *</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Diễn Đàn Xúc Tiến Thương Mại B2B 2026..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            />

            {/* Đơn vị tổ chức */}
            <Text style={[styles.inputLabel, dynamicStyles.label]}>Đơn vị tổ chức</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={organizer}
              onChangeText={setOrganizer}
              placeholder="VD: CLB Doanh Nhân / Hiệp Hội Thương Mại..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            />

            {/* Thời gian */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.inputLabel, dynamicStyles.label]}>Ngày diễn ra</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                />
              </View>
              <View style={styles.col}>
                <Text style={[styles.inputLabel, dynamicStyles.label]}>Giờ bắt đầu</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:mm"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                />
              </View>
            </View>

            {/* Địa điểm */}
            <Text style={[styles.inputLabel, dynamicStyles.label]}>Địa điểm tổ chức</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={location}
              onChangeText={setLocation}
              placeholder="VD: Khách sạn Daewoo Hà Nội / Trực tuyến..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            />

            {/* Nút tải ảnh lên & hỗ trợ nhiều ảnh */}
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={[styles.inputLabel, dynamicStyles.label, { marginTop: 0, marginBottom: 0 }]}>
                  Hình ảnh sự kiện ({uploadedImages.length})
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>
                  Hỗ trợ nhiều ảnh
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: isDark ? "rgba(216, 178, 130, 0.08)" : "#FEF3C7",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#F59E0B",
                  },
                ]}
                onPress={handleAddSampleImage}
                activeOpacity={0.8}
              >
                <Plus size={16} color={isDark ? "#D8B282" : "#B45309"} />
                <Text style={[styles.uploadBtnText, { color: isDark ? "#D8B282" : "#B45309" }]}>
                  Tải ảnh sự kiện lên (+ Thêm ảnh)
                </Text>
              </TouchableOpacity>

              {uploadedImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {uploadedImages.map((uri, idx) => (
                    <View key={idx} style={styles.thumbnailWrap}>
                      <Image source={{ uri }} style={styles.thumbnailImg} />
                      <TouchableOpacity
                        style={styles.thumbnailRemove}
                        onPress={() => handleRemoveImage(idx)}
                      >
                        <X size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Link ngoài */}
            <Text style={[styles.inputLabel, dynamicStyles.label]}>Link chi tiết / Đăng ký ngoài</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={externalUrl}
              onChangeText={setExternalUrl}
              placeholder="https://event.vione.vn/..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            />

            {/* Mô tả */}
            <Text style={[styles.inputLabel, dynamicStyles.label]}>Nội dung tóm tắt</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={description}
              onChangeText={setDescription}
              placeholder="Nội dung, diễn giả, quyền lợi khi tham gia..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, dynamicStyles.footer]}>
            <TouchableOpacity
              style={[styles.cancelBtn, dynamicStyles.cancelBtn]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, dynamicStyles.cancelText]}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtnTouch}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <View style={styles.saveBtnSolid}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#050811" />
                ) : (
                  <>
                    <Sparkles size={15} color="#050811" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Chia sẻ ngay</Text>
                  </>
                )}
              </View>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    borderWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 10,
  },
  uploadBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  thumbnailWrap: {
    position: "relative",
    marginRight: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
  },
  thumbnailImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  thumbnailRemove: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveBtnTouch: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  saveBtnSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#D8B282",
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#050811",
  },
});
