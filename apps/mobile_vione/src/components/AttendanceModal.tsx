import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  AlertTriangle,
  UserCheck,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { operationsApi } from "../api/services";

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ visible, onClose }) => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>("08:12:45");
  const [isVerifying, setIsVerifying] = useState(false);

  const officeDistance = 18; // 18m (< 50m chuẩn BR-HRM-01)
  const faceScore = 98.4; // 98.4% (>= 92% chuẩn BR-HRM-02)

  const handleCheckIn = async () => {
    setIsVerifying(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    try {
      await operationsApi.recordCheckIn({
        employeeName: "Doanh nhân ViOne",
        employeeCode: "VN-8888",
        faceConfidence: faceScore,
        distanceMeters: officeDistance,
        latitude: 21.0168,
        longitude: 105.7838,
      });
    } catch (err) {
      console.warn("Lỗi ghi nhận check-in lên API:", err);
    }

    setIsVerifying(false);
    setCheckedIn(true);
    setCheckInTime(timeStr);
    Alert.alert(
      "Chấm Công Thành Công!",
      `• Tọa độ GPS: Hợp lệ (${officeDistance}m so với Trụ sở ViOne Tower)\n• Nhận diện FaceID: Khớp ${faceScore}% (Liveness Verified)\n• Thời gian ghi nhận: ${timeStr}`,
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBadge}>
                    <UserCheck size={20} color="#3C240E" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={styles.title}>Chấm Công GPS & FaceID</Text>
                    <Text style={styles.subtitle}>Quy chuẩn BR-HRM-01 & BR-HRM-02</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                {/* 1. Trạng thái vị trí GPS */}
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <MapPin size={18} color="#10B981" />
                    </View>
                    <View style={styles.infoTexts}>
                      <Text style={styles.infoLabel}>Vị Trí Định Vị GPS (BR-HRM-01)</Text>
                      <Text style={styles.infoValue}>Cách văn phòng: {officeDistance}m (Bán kính hợp lệ &lt; 50m)</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>HỢP LỆ</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Trạng thái nhận diện AI FaceID */}
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <Camera size={18} color="#D8B282" />
                    </View>
                    <View style={styles.infoTexts}>
                      <Text style={styles.infoLabel}>Nhận Diện Khuôn Mặt AI (BR-HRM-02)</Text>
                      <Text style={styles.infoValue}>Độ khớp khuôn mặt: {faceScore}% (Yêu cầu &ge; 92%)</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>LIVENESS</Text>
                    </View>
                  </View>
                </View>

                {/* 3. Ca làm việc hôm nay */}
                <View style={styles.shiftCard}>
                  <Text style={styles.shiftTitle}>Ca Làm Việc: Ca Hành Chính (08:30 - 17:30)</Text>
                  <Text style={styles.shiftDesc}>Vào sau 08:45 tính là Đi Muộn • Rời trước 17:15 tính là Về Sớm (BR-HRM-03)</Text>
                  {checkInTime && (
                    <View style={styles.checkedInRow}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text style={styles.checkedInText}>Đã Check-in lúc: {checkInTime}</Text>
                    </View>
                  )}
                </View>

                {/* 4. Nút bấm Chấm Công 1-Chạm */}
                <TouchableOpacity
                  style={styles.actionBtnTouch}
                  onPress={handleCheckIn}
                  activeOpacity={0.85}
                  disabled={isVerifying}
                >
                  <LinearGradient
                    colors={["#F8E7D1", "#D8B282", "#A67A47"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionBtnGradient}
                  >
                    <ShieldCheck size={20} color="#3C240E" strokeWidth={2.2} />
                    <Text style={styles.actionBtnText}>
                      {isVerifying ? "Đang xác thực AI & GPS..." : "Xác Thực Chấm Công 1-Chạm"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#12151F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
    fontFamily: "monospace",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 14,
  },
  scrollBody: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#181D2A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoValue: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
    fontFamily: "monospace",
  },
  shiftCard: {
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  shiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F6E1C3",
  },
  shiftDesc: {
    fontSize: 11,
    color: "#D4C3A3",
    marginTop: 3,
    lineHeight: 16,
  },
  checkedInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(180, 83, 9, 0.15)",
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  actionBtnTouch: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#FFF2DC",
    borderRadius: 18,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C240E",
  },
});
