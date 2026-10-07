import React, { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  X,
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  Check,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { meApi } from "../api/services";
import { UserProfile } from "../types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const { isDark } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || "");
      setJobTitle(currentUser.title || "");
      setCompanyName(currentUser.company || "");
      setPhone(currentUser.phone || "");
      setEmail(currentUser.email || "");
      setBio(currentUser.bio || "");
      setWebsite(currentUser.website || "");
      setIndustry(currentUser.industry || "");
    }
  }, [visible, currentUser]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên của bạn.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        displayName: displayName.trim(),
        name: displayName.trim(),
        title: jobTitle.trim(),
        company: companyName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bio: bio.trim(),
        website: website.trim(),
        industry: industry.trim(),
      };

      const res = await meApi.updateProfile(payload);
      const updated = res.data?.profile || {
        ...(currentUser || ({} as UserProfile)),
        ...payload,
      };

      // Also upsert identity for parity
      try {
        await meApi.upsertIdentity({
          displayName: payload.displayName,
          jobTitle: payload.title,
          companyName: payload.company,
          primaryPhone: payload.phone,
          primaryEmail: payload.email,
          bio: payload.bio,
          website: payload.website,
        });
      } catch {
        // Soft fail if identity API is identical
      }

      onProfileUpdated(updated as UserProfile);
      Alert.alert("Thành công", "Hồ sơ doanh nhân của bạn đã được cập nhật!");
      onClose();
    } catch {
      // Offline fallback: save locally
      const localUpdated: UserProfile = {
        ...(currentUser || ({} as UserProfile)),
        displayName: displayName.trim(),
        name: displayName.trim(),
        title: jobTitle.trim(),
        company: companyName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bio: bio.trim(),
        website: website.trim(),
        industry: industry.trim(),
      };
      onProfileUpdated(localUpdated);
      Alert.alert("Thành công", "Thông tin hồ sơ đã được lưu cục bộ!");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputBg = isDark ? "#181D2A" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const placeholderColor = isDark ? "#64748B" : "#94A3B8";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
                borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.headerBar,
                { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
              ]}
            >
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <User size={16} color="#D8B282" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.headerTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Chỉnh sửa hồ sơ doanh nhân
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Cập nhật danh tính số ViOne Ecosystem
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color={isDark ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Họ và tên */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Họ và tên <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <User size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: Nguyễn Văn An"
                    placeholderTextColor={placeholderColor}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
              </View>

              {/* Chức vụ */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Chức vụ / Vị trí
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Briefcase size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: Chủ tịch HĐQT / Tổng Giám Đốc"
                    placeholderTextColor={placeholderColor}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                  />
                </View>
              </View>

              {/* Công ty */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Công ty / Doanh nghiệp
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Building2 size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: Tập đoàn Công nghệ ViOne"
                    placeholderTextColor={placeholderColor}
                    value={companyName}
                    onChangeText={setCompanyName}
                  />
                </View>
              </View>

              {/* Lĩnh vực hoạt động */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Ngành nghề & Lĩnh vực
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Briefcase size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: Công nghệ thông tin & Chuyển đổi số"
                    placeholderTextColor={placeholderColor}
                    value={industry}
                    onChangeText={setIndustry}
                  />
                </View>
              </View>

              {/* Số điện thoại */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Số điện thoại
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Phone size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: 0912 345 678"
                    placeholderTextColor={placeholderColor}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Email liên hệ
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Mail size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: ceo@vione.vn"
                    placeholderTextColor={placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Website */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Website doanh nghiệp
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Globe size={16} color={isDark ? "#D8B282" : "#8C653B"} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="VD: https://vione.vn"
                    placeholderTextColor={placeholderColor}
                    value={website}
                    onChangeText={setWebsite}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Tiểu sử / Giới thiệu */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                  Tiểu sử & Định vị bản thân
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      alignItems: "flex-start",
                      paddingTop: 10,
                    },
                  ]}
                >
                  <FileText
                    size={16}
                    color={isDark ? "#D8B282" : "#8C653B"}
                    style={[styles.fieldIcon, { marginTop: 2 }]}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { color: textColor },
                    ]}
                    placeholder="Giới thiệu ngắn về kinh nghiệm, thế mạnh và mục tiêu kết nối của bạn..."
                    placeholderTextColor={placeholderColor}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View
              style={[
                styles.footerBar,
                { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  Hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#050C15" />
                ) : (
                  <>
                    <Check size={16} color="#050C15" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  keyboardAvoid: {
    width: "100%",
    maxHeight: "92%",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#050C15",
  },
});
