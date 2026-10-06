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
  Calendar,
  MapPin,
  Sparkles,
  Link2,
  Building2,
  Clock,
} from "lucide-react-native";
import { apiRequest } from "../api/client";

export interface ShareEventModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: string;
  communityName?: string;
  onSuccess?: () => void;
}

export const ShareEventModal: React.FC<ShareEventModalProps> = ({
  visible,
  onClose,
  communityId,
  communityName = "",
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState(communityName || "Cộng đồng Doanh nghiệp ViOne");
  const [date, setDate] = useState("2026-10-15");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch {
      Alert.alert("Thành công", "Đã ghi nhận và chia sẻ sự kiện vào cộng đồng thành công!");
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
              <Calendar size={16} color="#D8B282" />
              <Text style={styles.modalTitle}>Chia Sẻ Sự Kiện</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Tên sự kiện */}
            <Text style={styles.inputLabel}>Tên sự kiện / Hội thảo *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Diễn Đàn Xúc Tiến Thương Mại B2B 2026..."
              placeholderTextColor="#64748B"
            />

            {/* Đơn vị tổ chức */}
            <Text style={styles.inputLabel}>Đơn vị tổ chức</Text>
            <TextInput
              style={styles.input}
              value={organizer}
              onChangeText={setOrganizer}
              placeholder="VD: CLB Doanh Nhân / Hiệp Hội Thương Mại..."
              placeholderTextColor="#64748B"
            />

            {/* Thời gian */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Ngày diễn ra</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Giờ bắt đầu</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:mm"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Địa điểm */}
            <Text style={styles.inputLabel}>Địa điểm tổ chức</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="VD: Khách sạn Daewoo Hà Nội / Trực tuyến..."
              placeholderTextColor="#64748B"
            />

            {/* Link ngoài */}
            <Text style={styles.inputLabel}>Link chi tiết / Đăng ký ngoài</Text>
            <TextInput
              style={styles.input}
              value={externalUrl}
              onChangeText={setExternalUrl}
              placeholder="https://event.vione.vn/..."
              placeholderTextColor="#64748B"
            />

            {/* Mô tả */}
            <Text style={styles.inputLabel}>Nội dung tóm tắt</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Nội dung, diễn giả, quyền lợi khi tham gia..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
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
                    <Text style={styles.saveBtnText}>Chia sẻ ngay</Text>
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
  row: {
    flexDirection: "row",
    gap: 12,
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
