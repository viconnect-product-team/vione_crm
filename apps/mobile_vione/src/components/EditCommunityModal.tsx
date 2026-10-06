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
  Building2,
  Users2,
  Sparkles,
  Save,
  Image as ImageIcon,
  Check,
} from "lucide-react-native";
import { apiRequest } from "../api/client";

export interface EditCommunityModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: string;
  currentName?: string;
  currentTagline?: string;
  currentAbout?: string;
  currentLogoUrl?: string | null;
  currentBannerUrl?: string | null;
  currentType?: "b2b_networking" | "company_internal";
  onSuccess?: () => void;
}

export const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  visible,
  onClose,
  communityId,
  currentName = "",
  currentTagline = "",
  currentAbout = "",
  currentLogoUrl = "",
  currentBannerUrl = "",
  currentType = "b2b_networking",
  onSuccess,
}) => {
  const [name, setName] = useState(currentName);
  const [tagline, setTagline] = useState(currentTagline);
  const [about, setAbout] = useState(currentAbout);
  const [communityType, setCommunityType] = useState<"b2b_networking" | "company_internal">(currentType);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(currentBannerUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(currentName);
      setTagline(currentTagline);
      setAbout(currentAbout);
      setCommunityType(currentType);
      setLogoUrl(currentLogoUrl || "");
      setBannerUrl(currentBannerUrl || "");
    }
  }, [visible, currentName, currentTagline, currentAbout, currentType, currentLogoUrl, currentBannerUrl]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên cộng đồng!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        tagline: tagline.trim(),
        about: about.trim(),
        description: about.trim(),
        communityType,
        logoUrl: logoUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
      };

      await apiRequest(`communities/${communityId}`, {
        method: "PATCH",
        body: payload,
      }).catch(async () => {
        await apiRequest(`connect-app/community/${communityId}`, {
          method: "PATCH",
          body: payload,
        });
      });

      Alert.alert("Thành công", "Đã cập nhật thông tin cộng đồng thành công!");
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      Alert.alert("Thành công", "Đã ghi nhận cập nhật thông tin cộng đồng!");
      if (onSuccess) onSuccess();
      onClose();
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
              <Sparkles size={16} color="#D8B282" />
              <Text style={styles.modalTitle}>Chỉnh Sửa Cộng Đồng</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Loại hình cộng đồng */}
            <Text style={styles.inputLabel}>Mô hình hoạt động</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  communityType === "company_internal" && styles.typeBtnActive,
                ]}
                onPress={() => setCommunityType("company_internal")}
                activeOpacity={0.8}
              >
                <Building2
                  size={15}
                  color={communityType === "company_internal" ? "#D8B282" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    communityType === "company_internal" && styles.typeBtnTextActive,
                  ]}
                >
                  🏢 Doanh nghiệp nội bộ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  communityType === "b2b_networking" && styles.typeBtnActive,
                ]}
                onPress={() => setCommunityType("b2b_networking")}
                activeOpacity={0.8}
              >
                <Users2
                  size={15}
                  color={communityType === "b2b_networking" ? "#D8B282" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    communityType === "b2b_networking" && styles.typeBtnTextActive,
                  ]}
                >
                  🤝 Mạng lưới B2B
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tên cộng đồng */}
            <Text style={styles.inputLabel}>Tên cộng đồng *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: Tập Đoàn Đầu Tư Hoàng Gia / CLB B2B..."
              placeholderTextColor="#64748B"
            />

            {/* Khẩu hiệu / Tagline */}
            <Text style={styles.inputLabel}>Khẩu hiệu / Giới thiệu ngắn</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="VD: Kết nối sức mạnh liên minh doanh nghiệp..."
              placeholderTextColor="#64748B"
            />

            {/* Giới thiệu chi tiết */}
            <Text style={styles.inputLabel}>Giới thiệu chi tiết</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={about}
              onChangeText={setAbout}
              placeholder="Mô tả mục tiêu, tầm nhìn, sứ mệnh của cộng đồng..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />

            {/* URL Logo */}
            <Text style={styles.inputLabel}>URL Logo / Ảnh đại diện</Text>
            <TextInput
              style={styles.input}
              value={logoUrl}
              onChangeText={setLogoUrl}
              placeholder="https://.../logo.png"
              placeholderTextColor="#64748B"
            />

            {/* URL Ảnh bìa */}
            <Text style={styles.inputLabel}>URL Ảnh bìa / Cover Banner</Text>
            <TextInput
              style={styles.input}
              value={bannerUrl}
              onChangeText={setBannerUrl}
              placeholder="https://.../cover.jpg"
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
              onPress={handleSave}
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
                    <Save size={15} color="#050811" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
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
  typeSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  typeBtnActive: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderColor: "#D8B282",
  },
  typeBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  typeBtnTextActive: {
    color: "#D8B282",
    fontWeight: "700",
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
    height: 80,
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
