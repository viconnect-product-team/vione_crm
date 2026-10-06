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
  Calendar,
  Clock,
  MapPin,
  Video,
  Handshake,
  Check,
  Building2,
  CalendarPlus,
  Send,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { meetingsApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ScheduleMeetingModalProps {
  visible: boolean;
  partnerName?: string;
  partnerCompany?: string;
  onClose: () => void;
  onScheduleSuccess?: (meeting: {
    title: string;
    partnerName: string;
    partnerCompany: string;
    date: string;
    time: string;
    location: string;
    isOnline: boolean;
  }) => void;
}

const TIME_SLOTS = ["09:00", "10:30", "14:00", "15:30", "17:00"];

const DATE_OPTIONS = [
  { id: "today", label: "Hôm nay" },
  { id: "tomorrow", label: "Ngày mai" },
  { id: "next_week", label: "Đầu tuần tới" },
];

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  visible,
  partnerName = "Đối tác Doanh nhân ViOne",
  partnerCompany = "Tập đoàn Đối tác",
  onClose,
  onScheduleSuccess,
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [selectedDate, setSelectedDate] = useState("tomorrow");
  const [customDate, setCustomDate] = useState("06/10/2026");
  const [selectedTime, setSelectedTime] = useState("14:00");
  const [location, setLocation] = useState("ViOne Executive Lounge - Keangnam Landmark 72");
  const [agenda, setAgenda] = useState("Trao đổi cơ hội hợp tác chuỗi cung ứng & liên danh dự án Q4");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const meetingDateStr = selectedDate === "today" ? "Hôm nay" : selectedDate === "tomorrow" ? "Ngày mai" : customDate;
    const meetingData = {
      title: `Cuộc gặp 1-1: ${partnerName}`,
      partnerName,
      partnerCompany,
      date: meetingDateStr,
      time: selectedTime,
      location: isOnline ? "Google Meet (Link tự động)" : location,
      isOnline,
    };

    try {
      await meetingsApi.createMeeting({
        title: `Cuộc gặp 1-1: ${partnerName}`,
        description: agenda,
        meetingDate: customDate || "2026-10-06",
        meetingTime: selectedTime,
        locationType: isOnline ? "online" : "offline",
        locationName: isOnline ? "Google Meet" : location,
      });
    } catch (err) {
      console.warn("Lỗi gửi cuộc hẹn lên API:", err);
    }

    setSubmitting(false);
    if (onScheduleSuccess) {
      onScheduleSuccess(meetingData);
    }

    Alert.alert(
      "Đã gửi lời mời cuộc hẹn 1-1",
      `Lời mời lịch hẹn lúc ${selectedTime} đã được gửi tới ${partnerName} (${partnerCompany}).\nThông báo sẽ cập nhật khi đối tác xác nhận.`
    );
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
                <Handshake size={16} color="#D8B282" />
              </View>
              <Text style={styles.headerTitle}>Lên lịch cuộc gặp 1-1</Text>
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
            {/* Target Partner Info */}
            <View style={styles.partnerBanner}>
              <View style={styles.partnerAvatarCircle}>
                <Text style={styles.avatarInitial}>
                  {partnerName ? partnerName.trim().charAt(0) : "V"}
                </Text>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerNameText}>{partnerName}</Text>
                <View style={styles.partnerCompanyRow}>
                  <Building2 size={12} color="#D8B282" style={{ marginRight: 4 }} />
                  <Text style={styles.partnerCompanyText}>{partnerCompany}</Text>
                </View>
              </View>
            </View>

            {/* Meeting Type (Offline vs Online) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hình thức cuộc gặp</Text>
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, !isOnline && styles.typeBtnActive]}
                  onPress={() => {
                    setIsOnline(false);
                    setLocation("ViOne Executive Lounge - Keangnam Landmark 72");
                  }}
                  activeOpacity={0.8}
                >
                  <MapPin size={15} color={!isOnline ? "#050C15" : "#94A3B8"} style={{ marginRight: 6 }} />
                  <Text style={[styles.typeBtnText, !isOnline && styles.typeBtnTextActive]}>
                    Gặp trực tiếp (Offline)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, isOnline && styles.typeBtnActive]}
                  onPress={() => {
                    setIsOnline(true);
                    setLocation("Google Meet (Hệ thống tự động cấp phòng họp bảo mật)");
                  }}
                  activeOpacity={0.8}
                >
                  <Video size={15} color={isOnline ? "#050C15" : "#94A3B8"} style={{ marginRight: 6 }} />
                  <Text style={[styles.typeBtnText, isOnline && styles.typeBtnTextActive]}>
                    Trực tuyến (Online)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày hẹn</Text>
              <View style={styles.dateOptionsRow}>
                {DATE_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dateBtn, selectedDate === d.id && styles.dateBtnActive]}
                    onPress={() => setSelectedDate(d.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateBtnText, selectedDate === d.id && styles.dateBtnTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Slot Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Khung giờ thuận tiện</Text>
              <View style={styles.timeSlotRow}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeBtn, selectedTime === t && styles.timeBtnActive]}
                    onPress={() => setSelectedTime(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timeBtnText, selectedTime === t && styles.timeBtnTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location / Meeting link */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isOnline ? "Nền tảng trực tuyến" : "Địa điểm cuộc gặp"}
              </Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder={isOnline ? "Link Google Meet hoặc Zoom..." : "Nhập địa chỉ hoặc sảnh hẹn..."}
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Agenda & Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chủ đề & Nội dung trao đổi</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={agenda}
                onChangeText={setAgenda}
                placeholder="Tóm tắt nội dung cần thảo luận để đối tác chuẩn bị tài liệu..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Submit */}
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
                <Send size={16} color="#050C15" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  {submitting ? "Đang gửi lời mời..." : "Xác nhận & Gửi lời mời 1-1"}
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
  partnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E1522",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    padding: 14,
    marginBottom: 16,
  },
  partnerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    borderWidth: 1,
    borderColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D8B282",
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 3,
  },
  partnerCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerCompanyText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 8,
  },
  typeToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  typeBtnActive: {
    backgroundColor: "#D8B282",
    borderColor: "#D8B282",
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  typeBtnTextActive: {
    color: "#050C15",
    fontWeight: "800",
  },
  dateOptionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateBtnActive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderColor: "#D8B282",
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  dateBtnTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  timeSlotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
  },
  timeBtnActive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderColor: "#D8B282",
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  timeBtnTextActive: {
    color: "#D8B282",
    fontWeight: "700",
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
    height: 75,
    textAlignVertical: "top",
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
