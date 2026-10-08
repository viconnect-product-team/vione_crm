import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogOut,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

interface AccountSecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Active Sessions
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Thiết bị hiện tại (iPhone 16 Pro Max)",
      platform: "iOS 18.1 · ViOne Native App",
      ip: "118.70.190.22",
      location: "Hà Nội, Việt Nam",
      lastActive: "Đang hoạt động",
      isCurrent: true,
    },
    {
      id: "sess-2",
      device: "MacBook Pro 16 M3 Max",
      platform: "macOS · Chrome 130",
      ip: "118.70.190.22",
      location: "Hà Nội, Việt Nam",
      lastActive: "12 phút trước",
      isCurrent: false,
    },
    {
      id: "sess-3",
      device: "iPad Pro 13 M4",
      platform: "iPadOS 18 · Safari",
      ip: "14.161.42.10",
      location: "TP. Hồ Chí Minh, Việt Nam",
      lastActive: "2 ngày trước",
      isCurrent: false,
    },
  ]);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call to /users/change-password
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Thành công", "Đã cập nhật mật khẩu tài khoản thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 800);
  };

  const handleRevokeOtherSessions = () => {
    Alert.alert(
      "Đăng xuất thiết bị khác",
      "Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác ngoài thiết bị này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          style: "destructive",
          onPress: () => {
            setSessions((prev) => prev.filter((s) => s.isCurrent));
            Alert.alert("Hoàn tất", "Đã thu hồi phiên đăng nhập của các thiết bị khác.");
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <ShieldCheck size={12} color="#DFB76C" />
                <Text style={styles.badgeText}>TRUNG TÂM BẢO MẬT VIONE</Text>
              </View>
              <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                Bảo Mật Tài Khoản & Mật Khẩu
              </Text>
              <Text style={styles.subtitle}>
                Quản lý mật khẩu, phiên đăng nhập và bảo vệ 2 lớp.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Đổi mật khẩu */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <KeyRound size={16} color="#DFB76C" />
                <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Đổi Mật Khẩu Đăng Nhập
                </Text>
              </View>

              {/* Mật khẩu hiện tại */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                  MẬT KHẨU HIỆN TẠI
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1",
                    },
                  ]}
                >
                  <Lock size={15} color={isDark ? "#D8B282" : "#8C653B"} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="Nhập mật khẩu đang dùng"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.eyeBtn}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mật khẩu mới */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                  MẬT KHẨU MỚI (TỐI THIỂU 6 KÝ TỰ)
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1",
                    },
                  ]}
                >
                  <KeyRound size={15} color={isDark ? "#D8B282" : "#8C653B"} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="Nhập mật khẩu mới an toàn"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Xác nhận mật khẩu mới */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                  XÁC NHẬN MẬT KHẨU MỚI
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1",
                    },
                  ]}
                >
                  <Lock size={15} color={isDark ? "#D8B282" : "#8C653B"} />
                  <TextInput
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nút Cập nhật mật khẩu */}
              <TouchableOpacity
                style={styles.savePasswordBtn}
                onPress={handleChangePassword}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                  style={styles.savePasswordGrad}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#050C15" />
                  ) : (
                    <>
                      <KeyRound size={15} color="#050C15" strokeWidth={2.2} />
                      <Text style={styles.savePasswordText}>Cập Nhật Mật Khẩu</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* 2. Xác thực 2 lớp (2FA) */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.twoFaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Xác Thực Hai Lớp (2FA)
                  </Text>
                  <Text style={styles.twoFaDesc}>
                    Yêu cầu mã OTP qua tin nhắn SMS hoặc ứng dụng bảo mật khi đăng nhập trên thiết bị lạ.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: twoFactorEnabled
                        ? "#10B981"
                        : isDark
                        ? "#334155"
                        : "#CBD5E1",
                    },
                  ]}
                  onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      twoFactorEnabled ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Phiên đăng nhập hoạt động */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.sectionHeaderBetween}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Smartphone size={16} color="#DFB76C" />
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Thiết Bị Đang Đăng Nhập ({sessions.length})
                  </Text>
                </View>
                {sessions.length > 1 && (
                  <TouchableOpacity onPress={handleRevokeOtherSessions}>
                    <Text style={styles.revokeAllLink}>Đăng xuất khác</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sessionsList}>
                {sessions.map((sess) => (
                  <View
                    key={sess.id}
                    style={[
                      styles.sessionItem,
                      {
                        backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                        borderColor: sess.isCurrent
                          ? "rgba(216, 178, 130, 0.4)"
                          : isDark
                          ? "rgba(255, 255, 255, 0.06)"
                          : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.sessionLeft}>
                      <Smartphone size={18} color={sess.isCurrent ? "#DFB76C" : "#94A3B8"} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text
                            style={[
                              styles.sessionDevice,
                              { color: isDark ? "#FFFFFF" : "#0F172A" },
                            ]}
                          >
                            {sess.device}
                          </Text>
                          {sess.isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>HIỆN TẠI</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sessionPlatform}>{sess.platform}</Text>
                        <Text style={styles.sessionMeta}>
                          {sess.location} · {sess.lastActive}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
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
    height: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DFB76C",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  revokeAllLink: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#EF4444",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  eyeBtn: {
    padding: 6,
  },
  savePasswordBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  savePasswordGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  savePasswordText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#050C15",
  },
  twoFaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  twoFaDesc: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 16,
  },
  toggleBtn: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sessionDevice: {
    fontSize: 13,
    fontWeight: "700",
  },
  currentBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
  },
  sessionPlatform: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  sessionMeta: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },
});
