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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Shield,
  Globe,
  QrCode,
  Sparkles,
  Check,
  UserCheck,
  User,
  Briefcase,
  Phone,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { ViOneLogo } from "../../components/ViOneLogo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M16.36 12.72c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.01.72c1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.44-3.7ZM14.1 5.1c.64-.78 1.07-1.85.95-2.93-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.28Z" />
    </Svg>
  );
}

export const LoginScreen: React.FC = () => {
  const { login, register, quickDemoLogin, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [lang, setLang] = useState<"vi" | "en">("vi");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập Email hoặc Số điện thoại đăng nhập");
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

  const handleRegister = async () => {
    if (!regName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên của bạn");
      return;
    }
    if (!regPhone.trim() && !regEmail.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập số điện thoại hoặc email liên hệ");
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp");
      return;
    }

    const res = await register({
      email: regEmail.trim() || `${regPhone.trim().replace(/\D/g, '')}@vione.vn`,
      phone: regPhone.trim(),
      password: regPassword,
      name: regName.trim(),
      company: regCompany.trim() || undefined,
    });

    if (!res.success) {
      Alert.alert("Đăng ký không thành công", res.error || "Vui lòng kiểm tra lại thông tin");
    }
  };

  const handleSocialLogin = (provider: "google" | "apple") => {
    Alert.alert(
      `Đăng nhập ${provider === "google" ? "Google" : "Apple"}`,
      "Hệ thống xác thực SSO ViOne đang kích hoạt. Bạn có thể sử dụng đăng nhập nhanh bằng tài khoản C-Level demo.",
      [
        { text: "Để sau", style: "cancel" },
        { text: "Vào C-Level", onPress: () => quickDemoLogin("executive") },
      ]
    );
  };

  const handleNfcScan = () => {
    Alert.alert(
      "Chạm thẻ NFC / Quét QR",
      "Đưa điện thoại lại gần thẻ doanh nhân thông minh ViOne hoặc quét mã QR trên danh thiếp vật lý để kết nối.",
      [
        { text: "Đóng", style: "cancel" },
        { text: "Đăng nhập C-Level", onPress: () => quickDemoLogin("executive") },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Image & Ambient Obsidian Gradient */}
      <Image
        source={require("../../../assets/connect-auth-bg.jpg")}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          "rgba(11, 15, 23, 0.45)",
          "rgba(11, 15, 23, 0.85)",
          "#0B0F17",
          "#0B0F17",
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.bgGradientOverlay}
      />

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
            {/* Top Bar: Back button (when in register) & Language Switcher */}
            <View style={styles.topBar}>
              {isRegister ? (
                <TouchableOpacity
                  style={styles.backBtnPill}
                  onPress={() => setIsRegister(false)}
                  activeOpacity={0.75}
                >
                  <ChevronLeft size={16} color="#D8B282" />
                  <Text style={styles.backBtnText}>Đăng nhập</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <TouchableOpacity
                style={styles.langPill}
                onPress={() => setLang(lang === "vi" ? "en" : "vi")}
                activeOpacity={0.75}
              >
                <Globe size={13} color="#D8B282" style={{ marginRight: 5 }} />
                <Text style={styles.langText}>
                  {lang === "vi" ? "Tiếng Việt (VN)" : "English (US)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Brand Header */}
            <View style={styles.brandHeader}>
              <ViOneLogo width={160} height={56} />
              <Text style={styles.brandSubtitle}>BUSINESS CONNECT</Text>
              <Text style={styles.loginHeading}>
                {isRegister ? "Đăng ký tài khoản mới" : "Đăng nhập ViOne"}
              </Text>
              <Text style={styles.loginSubheading}>
                {isRegister
                  ? "Khởi tạo tài khoản doanh nhân & gia nhập hệ sinh thái ViOne"
                  : "Cộng đồng doanh nhân tinh hoa & Kết nối giao thương"}
              </Text>
            </View>

            {isRegister ? (
              /* REGISTRATION FORM - Đăng ký trực tiếp vào App ViOne */
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Họ và tên doanh nhân *</Text>
                  <View style={styles.inputBox}>
                    <User size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="VD: Nguyễn Văn Hùng"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regName}
                      onChangeText={setRegName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Số điện thoại *</Text>
                  <View style={styles.inputBox}>
                    <Phone size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="VD: 0912 345 678"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email doanh nghiệp</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="VD: hung.nguyen@vione.vn"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Company / Enterprise Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tên doanh nghiệp / Công ty</Text>
                  <View style={styles.inputBox}>
                    <Briefcase size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="VD: Tập đoàn Công nghệ ViOne"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regCompany}
                      onChangeText={setRegCompany}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mật khẩu *</Text>
                  <View style={styles.inputBox}>
                    <Lock size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry={!showRegPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegPassword((v) => !v)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      {showRegPassword ? (
                        <EyeOff size={16} color="#D4C3A3" />
                      ) : (
                        <Eye size={16} color="#D4C3A3" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Xác nhận mật khẩu *</Text>
                  <View style={styles.inputBox}>
                    <Lock size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor="rgba(212, 195, 163, 0.4)"
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      secureTextEntry={!showRegConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegConfirmPassword((v) => !v)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff size={16} color="#D4C3A3" />
                      ) : (
                        <Eye size={16} color="#D4C3A3" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Gold Gradient Register Button */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.88}
                  style={styles.submitBtnTouch}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtnGradient}
                  >
                    <Text style={styles.submitBtnText}>
                      {isLoading ? "Đang xử lý..." : "Đăng ký & Đăng nhập ngay"}
                    </Text>
                    {!isLoading && (
                      <ArrowRight size={17} color="#050C15" strokeWidth={2.4} style={styles.submitArrow} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch back to Login */}
                <TouchableOpacity
                  style={styles.switchAuthRow}
                  onPress={() => setIsRegister(false)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.switchAuthText}>Đã có tài khoản doanh nhân? </Text>
                  <Text style={styles.switchAuthLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* LOGIN FORM */
              <>
                {/* Social Logins - Elongated buttons matching PWA */}
                <View style={styles.socialSection}>
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => handleSocialLogin("google")}
                    activeOpacity={0.8}
                  >
                    <GoogleIcon />
                    <Text style={styles.socialBtnText}>Đăng nhập với Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => handleSocialLogin("apple")}
                    activeOpacity={0.8}
                  >
                    <AppleIcon />
                    <Text style={styles.socialBtnText}>Đăng nhập với Apple</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>HOẶC</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Credential Form */}
                <View style={styles.formContainer}>
                  {/* Email / Phone */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email hoặc Số điện thoại</Text>
                    <View style={styles.inputBox}>
                      <Mail size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="VD: ceo@vione.vn hoặc 0912 345 678"
                        placeholderTextColor="rgba(212, 195, 163, 0.4)"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="default"
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Mật khẩu</Text>
                    <View style={styles.inputBox}>
                      <Lock size={16} color="#D4C3A3" style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor="rgba(212, 195, 163, 0.4)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((v) => !v)}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color="#D4C3A3" />
                        ) : (
                          <Eye size={16} color="#D4C3A3" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Remember & Forgot */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.rememberRow}
                      onPress={() => setRemember((v) => !v)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                        {remember && <Check size={12} color="#050C15" strokeWidth={3} />}
                      </View>
                      <Text style={styles.rememberLabel}>Ghi nhớ đăng nhập</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Quên mật khẩu",
                          "Vui lòng liên hệ ban quản trị ViOne hoặc sử dụng tính năng đặt lại mật khẩu qua email."
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotLabel}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Gold Gradient Login Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.88}
                    style={styles.submitBtnTouch}
                  >
                    <LinearGradient
                      colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitBtnGradient}
                    >
                      <Text style={styles.submitBtnText}>
                        {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                      </Text>
                      {!isLoading && (
                        <ArrowRight size={17} color="#050C15" strokeWidth={2.4} style={styles.submitArrow} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Quick Demo Bypass (C-Level / Admin) */}
                <View style={styles.demoRow}>
                  <TouchableOpacity
                    style={styles.demoPill}
                    onPress={() => quickDemoLogin("executive")}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={13} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.demoPillText}>Vào C-Level</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoPill}
                    onPress={() => quickDemoLogin("admin")}
                    activeOpacity={0.8}
                  >
                    <UserCheck size={13} color="#38BDF8" style={{ marginRight: 4 }} />
                    <Text style={styles.demoPillText}>Vào Admin</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Up / Create Account Button */}
                <TouchableOpacity
                  style={styles.signUpBtn}
                  onPress={() => setIsRegister(true)}
                  activeOpacity={0.85}
                >
                  <Shield size={16} color="#E2D3B3" />
                  <Text style={styles.signUpText}>Tạo tài khoản mới (Đăng ký vào App)</Text>
                  <ChevronRight size={16} color="#E2D3B3" style={styles.rightChevron} />
                </TouchableOpacity>

                {/* Explore Web Landing ViOne Connect */}
                <TouchableOpacity
                  style={styles.landingBtn}
                  onPress={() =>
                    Alert.alert(
                      "Khám phá ViOne Connect",
                      "Truy cập cổng thông tin doanh nhân: https://vione.vn"
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Globe size={15} color="#D8B282" />
                  <Text style={styles.landingBtnText}>Khám phá ViOne Connect (Web Landing)</Text>
                  <ArrowRight size={15} color="#D8B282" style={styles.rightChevron} />
                </TouchableOpacity>

                {/* Scan NFC / QR Action */}
                <TouchableOpacity
                  style={styles.nfcBtn}
                  onPress={handleNfcScan}
                  activeOpacity={0.8}
                >
                  <View style={styles.nfcIconWrap}>
                    <QrCode size={20} color="#E2D3B3" />
                  </View>
                  <View style={styles.nfcTextCol}>
                    <Text style={styles.nfcTitle}>Chạm thẻ NFC / Quét mã QR</Text>
                    <Text style={styles.nfcSubtitle}>
                      Mở danh thiếp cá nhân hoặc kết nối tức thì
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Footer */}
            <View style={styles.footerWrap}>
              <Text style={styles.footerBrand}>BY VICONNECT</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: 480,
    opacity: 0.55,
  },
  bgGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 4,
    marginBottom: 8,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langText: {
    color: "#D4C3A3",
    fontSize: 11,
    fontWeight: "600",
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  logoWordmark: {
    width: 170,
    height: 60,
  },
  brandSubtitle: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    marginTop: 2,
  },
  loginHeading: {
    color: "#F6E1C3",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  loginSubheading: {
    color: "rgba(212, 195, 163, 0.8)",
    fontSize: 12.5,
    marginTop: 4,
    textAlign: "center",
  },
  socialSection: {
    gap: 9,
    marginBottom: 14,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    gap: 10,
  },
  socialBtnText: {
    color: "#F5F7FA",
    fontSize: 13,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
  },
  dividerText: {
    color: "rgba(212, 195, 163, 0.75)",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 11,
  },
  fieldLabel: {
    color: "#D4C3A3",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 12,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#F5F7FA",
    fontSize: 13.5,
  },
  eyeBtn: {
    padding: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 16,
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
    borderColor: "rgba(216, 178, 130, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: "#D8B282",
    borderColor: "#D8B282",
  },
  rememberLabel: {
    color: "#D4C3A3",
    fontSize: 12,
  },
  forgotLabel: {
    color: "#E2D3B3",
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtnTouch: {
    height: 44,
    borderRadius: 12,
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnGradient: {
    flex: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  submitBtnText: {
    color: "#050C15",
    fontSize: 14.5,
    fontWeight: "700",
  },
  submitArrow: {
    position: "absolute",
    right: 16,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  demoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  demoPillText: {
    color: "#F6E1C3",
    fontSize: 11.5,
    fontWeight: "700",
  },
  signUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.38)",
    backgroundColor: "rgba(24, 27, 39, 0.8)",
    marginTop: 4,
    marginBottom: 8,
    position: "relative",
    gap: 8,
  },
  signUpText: {
    color: "#E2D3B3",
    fontSize: 13,
    fontWeight: "600",
  },
  landingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.28)",
    backgroundColor: "rgba(11, 15, 23, 0.8)",
    marginBottom: 12,
    position: "relative",
    gap: 8,
  },
  landingBtnText: {
    color: "#F6E1C3",
    fontSize: 12.5,
    fontWeight: "600",
  },
  rightChevron: {
    position: "absolute",
    right: 14,
  },
  backBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    gap: 4,
  },
  backBtnText: {
    color: "#D8B282",
    fontSize: 12,
    fontWeight: "600",
  },
  switchAuthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  switchAuthText: {
    color: "#D4C3A3",
    fontSize: 13,
  },
  switchAuthLink: {
    color: "#F6E1C3",
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  nfcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  nfcIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  nfcTextCol: {
    alignItems: "flex-start",
  },
  nfcTitle: {
    color: "#E2D3B3",
    fontSize: 13,
    fontWeight: "700",
  },
  nfcSubtitle: {
    color: "rgba(212, 195, 163, 0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  footerWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  footerBrand: {
    color: "rgba(216, 178, 130, 0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.6,
  },
});
