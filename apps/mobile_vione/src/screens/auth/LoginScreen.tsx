import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Mail, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { GoldButton } from "../../components/common/GoldButton";

export const LoginScreen: React.FC = () => {
  const { login, quickDemoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email hoặc tên đăng nhập");
      return;
    }
    if (!password) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu");
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      Alert.alert("Đăng nhập thất bại", res.error || "Vui lòng kiểm tra lại thông tin");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <Image
              source={require("../../../assets/vione-wordmark.png")}
              style={styles.logoWordmark}
              resizeMode="contain"
            />
            <Text style={styles.brandSubtitle}>BUSINESS CONNECT</Text>
            <Text style={styles.brandTagline}>
              Mạng Lưới Kết Nối & Danh Thiếp Số C-Level
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.loginTitle}>Đăng Nhập Tài Khoản</Text>
            <Text style={styles.loginSubtitle}>
              Sử dụng tài khoản doanh nghiệp đã được cấp
            </Text>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL HOẶC MÃ ĐỊNH DANH</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textMuted} />
                  ) : (
                    <Eye size={18} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                  {remember && <View style={styles.checkboxCheck} />}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ phiên đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Quên mật khẩu",
                    "Vui lòng liên hệ Quản trị viên hệ thống để khôi phục mật khẩu tài khoản."
                  )
                }
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <GoldButton
              title="Đăng Nhập ViOne"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: 24 }}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>HOẶC THỬ NGHIỆM NHANH</Text>
              <View style={styles.line} />
            </View>

            {/* Demo Instant Logins */}
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => quickDemoLogin("executive")}
                disabled={isLoading}
              >
                <Sparkles size={16} color={Colors.gold} style={{ marginRight: 6 }} />
                <Text style={styles.demoBtnText}>Vào thẳng C-Level</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => quickDemoLogin("admin")}
                disabled={isLoading}
              >
                <ShieldCheck size={16} color={Colors.info} style={{ marginRight: 6 }} />
                <Text style={styles.demoBtnText}>Vào vai Quản trị</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bảo mật 100% tiêu chuẩn Doanh nghiệp • ViOne Connect 2026
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWordmark: {
    width: 175,
    height: 66,
    marginBottom: 4,
  },
  brandSubtitle: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  brandTagline: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  loginTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  loginSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.goldLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: Colors.gold,
  },
  checkboxCheck: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#05070E",
  },
  rememberText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  forgotText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "500",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceBorderLight,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 10,
  },
  demoButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 12,
    borderRadius: 12,
  },
  demoBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
});
