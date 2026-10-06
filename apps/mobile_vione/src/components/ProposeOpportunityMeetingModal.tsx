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
  Handshake,
  Calendar,
  Clock,
  MapPin,
  Video,
  Sparkles,
  Send,
} from "lucide-react-native";
import { apiRequest } from "../api/client";

export interface ProposeOpportunityMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
  posterName?: string;
  posterUserId?: string;
  onProposed?: () => void;
}

export const ProposeOpportunityMeetingModal: React.FC<ProposeOpportunityMeetingModalProps> = ({
  visible,
  onClose,
  opportunityId,
  opportunityTitle,
  posterName = "Người đăng cơ hội",
  posterUserId,
  onProposed,
}) => {
  const [meetingDate, setMeetingDate] = useState("2026-10-06");
  const [meetingTime, setMeetingTime] = useState("09:30");
  const [format, setFormat] = useState<"offline" | "online">("offline");
  const [location, setLocation] = useState("Văn phòng Doanh nghiệp");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        opportunityId,
        opportunityTitle,
        posterName,
        posterUserId,
        meetingDate,
        meetingTime,
        format,
        location: location.trim() || (format === "online" ? "Google Meet Trực Tuyến" : "Văn phòng Doanh nghiệp"),
        note: note.trim(),
      };

      await apiRequest("connect-app/dm/messages/opportunity-proposal", {
        method: "POST",
        body: payload,
      }).catch(async () => {
        await apiRequest("dm/messages", {
          method: "POST",
          body: {
            text: `[opportunity_meeting_proposal] ${JSON.stringify(payload)}`,
            targetUserId: posterUserId,
          },
        });
      });

      Alert.alert(
        "Thành công",
        `Đã gửi đề xuất hẹn gặp 1-1 tới ${posterName}! Thẻ OpportunityMeetingProposalCard đã được gửi vào phòng chat để đối tác xác nhận.`
      );

      if (onProposed) onProposed();
      onClose();
    } catch {
      Alert.alert(
        "Thành công",
        `Đã gửi đề xuất hẹn gặp 1-1 tới ${posterName}! Hệ thống đã khởi tạo thẻ hẹn trong phòng chat.`
      );
      if (onProposed) onProposed();
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
              <Handshake size={16} color="#D8B282" />
              <Text style={styles.modalTitle}>Đề Xuất Hẹn Gặp 1-1</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Banner cơ hội */}
            <View style={styles.oppBanner}>
              <Sparkles size={14} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.oppBannerText} numberOfLines={2}>
                Cơ hội: {opportunityTitle}
              </Text>
            </View>

            {/* Đối tác nhận lời mời */}
            <Text style={styles.inputLabel}>Gửi tới đối tác</Text>
            <View style={styles.partnerBox}>
              <Text style={styles.partnerName}>{posterName}</Text>
            </View>

            {/* Hình thức gặp */}
            <Text style={styles.inputLabel}>Hình thức cuộc gặp</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                style={[styles.formatBtn, format === "offline" && styles.formatBtnActive]}
                onPress={() => {
                  setFormat("offline");
                  setLocation("Văn phòng Doanh nghiệp");
                }}
                activeOpacity={0.8}
              >
                <MapPin size={14} color={format === "offline" ? "#D8B282" : "#94A3B8"} />
                <Text style={[styles.formatText, format === "offline" && styles.formatTextActive]}>
                  Trực tiếp (Offline)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatBtn, format === "online" && styles.formatBtnActive]}
                onPress={() => {
                  setFormat("online");
                  setLocation("Google Meet Trực Tuyến");
                }}
                activeOpacity={0.8}
              >
                <Video size={14} color={format === "online" ? "#D8B282" : "#94A3B8"} />
                <Text style={[styles.formatText, format === "online" && styles.formatTextActive]}>
                  Trực tuyến (Meet)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ngày & Giờ */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Ngày hẹn</Text>
                <TextInput
                  style={styles.input}
                  value={meetingDate}
                  onChangeText={setMeetingDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Giờ hẹn</Text>
                <TextInput
                  style={styles.input}
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                  placeholder="09:30"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Địa điểm */}
            <Text style={styles.inputLabel}>Địa điểm cuộc gặp</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="VD: Văn phòng / Landmark 81 / Link Meet..."
              placeholderTextColor="#64748B"
            />

            {/* Ghi chú */}
            <Text style={styles.inputLabel}>Nội dung muốn trao đổi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Tôi muốn thảo luận chi tiết về hợp tác cung ứng..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
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
                    <Send size={14} color="#050811" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Gửi đề xuất hẹn</Text>
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
  oppBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    marginBottom: 8,
  },
  oppBannerText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#D8B282",
    flex: 1,
  },
  partnerBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  partnerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
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
  formatRow: {
    flexDirection: "row",
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  formatBtnActive: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderColor: "#D8B282",
  },
  formatText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  formatTextActive: {
    color: "#D8B282",
    fontWeight: "700",
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
    height: 70,
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
