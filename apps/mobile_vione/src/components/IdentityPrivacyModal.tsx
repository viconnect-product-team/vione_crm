import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Lock,
  Eye,
  Shield,
  Phone,
  Mail,
  Users,
  Sparkles,
  Check,
  ShieldCheck,
} from "lucide-react-native";
import { Colors } from "../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface IdentityPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const IdentityPrivacyModal: React.FC<IdentityPrivacyModalProps> = ({
  visible,
  onClose,
}) => {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [allowDirectMeeting, setAllowDirectMeeting] = useState(true);
  const [allowAiMatching, setAllowAiMatching] = useState(true);
  const [anonymousAtEvents, setAnonymousAtEvents] = useState(false);
  const [watermarkCard, setWatermarkCard] = useState(true);

  const handleSave = () => {
    Alert.alert(
      "Đã cập nhật quyền riêng tư",
      "Cấu hình bảo mật danh tính doanh nhân ViOne đã được đồng bộ an toàn lên hệ sinh thái."
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
                <Lock size={16} color="#D8B282" />
              </View>
              <Text style={styles.headerTitle}>Quyền riêng tư danh tính</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.75 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner Security */}
            <View style={styles.securityBanner}>
              <ShieldCheck size={20} color="#D8B282" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Bảo Mật Tiêu Chuẩn Doanh Nghiệp</Text>
                <Text style={styles.securitySubtitle}>
                  Kiểm soát dữ liệu cá nhân & thông tin liên hệ hiển thị với đối tác ngoài mạng lưới.
                </Text>
              </View>
            </View>

            {/* Toggle 1: Phone */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={styles.toggleLabelRow}>
                  <Phone size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.toggleLabel}>Hiển thị SĐT với đối tác chưa kết nối</Text>
                </View>
                <Text style={styles.toggleDesc}>
                  Khi tắt, đối tác phải gửi yêu cầu kết nối và được bạn chấp thuận mới thấy số điện thoại.
                </Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: "#334155", true: "#D8B282" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 2: Email */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={styles.toggleLabelRow}>
                  <Mail size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.toggleLabel}>Hiển thị Email công việc trên danh thiếp số</Text>
                </View>
                <Text style={styles.toggleDesc}>
                  Cho phép đối tác quét mã QR hoặc chạm NFC nhận diện địa chỉ email doanh nghiệp.
                </Text>
              </View>
              <Switch
                value={showEmail}
                onValueChange={setShowEmail}
                trackColor={{ false: "#334155", true: "#D8B282" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 3: Direct Meeting */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={styles.toggleLabelRow}>
                  <Users size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.toggleLabel}>Cho phép gửi lời mời cuộc gặp 1-1</Text>
                </View>
                <Text style={styles.toggleDesc}>
                  Nhận thông báo khi đối tác C-Level trong cộng đồng muốn đặt lịch hẹn kinh doanh.
                </Text>
              </View>
              <Switch
                value={allowDirectMeeting}
                onValueChange={setAllowDirectMeeting}
                trackColor={{ false: "#334155", true: "#D8B282" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 4: AI Matching */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelRow}>
                <View style={styles.toggleInfo}>
                  <View style={styles.toggleLabelRow}>
                    <Sparkles size={14} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.toggleLabel}>AI đề xuất kết nối & cơ hội giao thương</Text>
                  </View>
                  <Text style={styles.toggleDesc}>
                    Thuật toán AI tự động phân tích hồ sơ năng lực để ghép cặp với dự án phù hợp nhất.
                  </Text>
                </View>
              </View>
              <Switch
                value={allowAiMatching}
                onValueChange={setAllowAiMatching}
                trackColor={{ false: "#334155", true: "#D8B282" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 5: Watermark */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={styles.toggleLabelRow}>
                  <Shield size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.toggleLabel}>Hình mờ (Watermark) bảo vệ danh thiếp</Text>
                </View>
                <Text style={styles.toggleDesc}>
                  Chống sao chép trái phép danh thiếp điện tử của bạn khi chia sẻ ra bên ngoài.
                </Text>
              </View>
              <Switch
                value={watermarkCard}
                onValueChange={setWatermarkCard}
                trackColor={{ false: "#334155", true: "#D8B282" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.88}>
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGradient}
              >
                <Check size={16} color="#050C15" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Lưu cấu hình quyền riêng tư</Text>
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
    backgroundColor: "#0A0A0B",
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
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D8B282",
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  toggleDesc: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 4,
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    paddingVertical: 15,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
