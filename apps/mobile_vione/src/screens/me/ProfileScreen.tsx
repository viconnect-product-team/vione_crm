import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  QrCode,
  Mail,
  Phone,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Nfc,
  Sun,
  Moon,
  Send,
  MessageSquare,
  MessageCircle,
  BadgeCheck,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { StickyBrandHeader } from "../../components/common/StickyBrandHeader";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { IdentityPrivacyModal } from "../../components/IdentityPrivacyModal";
import { CardVaultModal } from "../../components/CardVaultModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [cardVaultModalVisible, setCardVaultModalVisible] = useState(false);

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const userPhone = user?.phone || "";
  const userEmail = user?.email || "";
  const userTitle = user?.title || "Doanh nhân C-Level";
  const userCompany = user?.company || "ViOne Business Network";
  const userCode = user?.code || "";

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi ViOne Connect?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const handleNfc = () => {
    Alert.alert(
      "Chạm NFC ViOne",
      "Chạm thẻ danh thiếp thông minh ViOne vào mặt sau điện thoại để truyền danh tính số tức thì.",
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  const handleQuickContact = (type: "call" | "email" | "viber" | "whatsapp" | "telegram") => {
    switch (type) {
      case "call":
        Linking.openURL(`tel:${userPhone.replace(/\s+/g, "")}`).catch(() => {
          Alert.alert("Gọi điện", `Số điện thoại: ${userPhone}`);
        });
        break;
      case "email":
        Linking.openURL(`mailto:${userEmail}`).catch(() => {
          Alert.alert("Email", `Địa chỉ email: ${userEmail}`);
        });
        break;
      case "viber":
        Linking.openURL(`viber://chat?number=${userPhone.replace(/\s+/g, "")}`).catch(() => {
          Alert.alert("Viber", `Kết nối Viber với số: ${userPhone}`);
        });
        break;
      case "whatsapp":
        Linking.openURL(`whatsapp://send?phone=${userPhone.replace(/\s+/g, "")}`).catch(() => {
          Alert.alert("WhatsApp", `Kết nối WhatsApp với số: ${userPhone}`);
        });
        break;
      case "telegram":
        Linking.openURL("tg://resolve?domain=vione_ceo").catch(() => {
          Alert.alert("Telegram", "Kết nối Telegram: @vione_ceo");
        });
        break;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {/* 1. Sticky Header Thương Hiệu Khớp 100% PWA */}
      <StickyBrandHeader
        rightActions={
          <TouchableOpacity
            style={[
              styles.headerSquareBtn,
              {
                backgroundColor: isDark ? "rgba(22, 32, 50, 0.65)" : "#F1F5F9",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={() => Alert.alert("Thông báo", "Bạn không có cảnh báo mới.")}
            activeOpacity={0.7}
          >
            <Bell size={16} color={isDark ? "#D8B282" : "#64748B"} strokeWidth={1.8} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CARD DANH TÍNH SỐ (Matching 100% Screenshot 4 & Web Responsive MeIdentityCard) */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
              shadowColor: isDark ? "#000" : "#64748B",
            },
          ]}
        >
          {/* Subtle Watermark 'V' */}
          <Text
            style={[
              styles.watermarkV,
              { color: isDark ? "rgba(216, 178, 130, 0.06)" : "rgba(216, 178, 130, 0.12)" },
            ]}
          >
            V
          </Text>

          {/* Top Row: DANH TÍNH SỐ & VIONE BUSINESS CONNECT */}
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTopBadge}>DANH TÍNH SỐ</Text>
            <View style={styles.cardTopRight}>
              <Text style={styles.cardBrandVione}>VIONE</Text>
              <Text style={styles.cardBrandSub}>BUSINESS CONNECT</Text>
            </View>
          </View>

          {/* Main Row: Name / Info on Left & Portrait Image on Right */}
          <View style={styles.cardMainRow}>
            <View style={styles.cardLeftCol}>
              <Text
                style={[
                  styles.cardDisplayName,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
                numberOfLines={2}
              >
                {displayName}
              </Text>
              <Text style={styles.cardJobTitle} numberOfLines={1}>
                {userTitle}
              </Text>
              <Text
                style={[
                  styles.cardCompany,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
                numberOfLines={2}
              >
                {userCompany}
              </Text>
            </View>

            <View style={styles.portraitWrap}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.portraitImg}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("../../../assets/vba-hero.jpg")}
                  style={styles.portraitImg}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          {/* 2 Gold Pill Buttons: [QR của tôi] & [Chạm NFC] */}
          <View style={styles.cardBtnRow}>
            <TouchableOpacity
              style={styles.pillBtnWrap}
              onPress={() => setQrModalVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#E8C98E", "#D4AF37", "#B38A4B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillBtnGradient}
              >
                <QrCode size={15} color="#050C15" strokeWidth={2} />
                <Text style={styles.pillBtnText}>QR của tôi</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pillBtnWrap}
              onPress={handleNfc}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#E8C98E", "#D4AF37", "#B38A4B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillBtnGradient}
              >
                <Nfc size={15} color="#050C15" strokeWidth={2} />
                <Text style={styles.pillBtnText}>Chạm NFC</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom Right Link: Xem hồ sơ > */}
          <TouchableOpacity
            style={styles.viewProfileLink}
            onPress={() =>
              Alert.alert(
                "Hồ sơ doanh nhân",
                `Mã danh tính: ${userCode}\nChức danh: ${userTitle}\nDoanh nghiệp: ${userCompany}`
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.viewProfileText}>Xem hồ sơ</Text>
            <ChevronRight size={14} color="#D8B282" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 3. CARD LIÊN HỆ NHANH (Matching 100% Screenshot 4 & Web Responsive MeQuickContact) */}
        <View
          style={[
            styles.quickContactCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              shadowColor: isDark ? "#000" : "#64748B",
            },
          ]}
        >
          <Text
            style={[
              styles.quickContactTitle,
              { color: isDark ? "#94A3B8" : "#475569" },
            ]}
          >
            LIÊN HỆ NHANH
          </Text>

          <View style={styles.contactGrid}>
            {/* 1. Gọi điện */}
            <TouchableOpacity
              style={[
                styles.contactItemBox,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => handleQuickContact("call")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(216, 178, 130, 0.12)"
                      : "rgba(216, 178, 130, 0.18)",
                  },
                ]}
              >
                <Phone size={15} color="#D8B282" />
              </View>
              <Text
                style={[
                  styles.contactItemLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Gọi điện
              </Text>
            </TouchableOpacity>

            {/* 2. Email */}
            <TouchableOpacity
              style={[
                styles.contactItemBox,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => handleQuickContact("email")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(216, 178, 130, 0.12)"
                      : "rgba(216, 178, 130, 0.18)",
                  },
                ]}
              >
                <Mail size={15} color="#D8B282" />
              </View>
              <Text
                style={[
                  styles.contactItemLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>

            {/* 3. Viber */}
            <TouchableOpacity
              style={[
                styles.contactItemBox,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => handleQuickContact("viber")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(216, 178, 130, 0.12)"
                      : "rgba(216, 178, 130, 0.18)",
                  },
                ]}
              >
                <MessageCircle size={15} color="#D8B282" />
              </View>
              <Text
                style={[
                  styles.contactItemLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Viber
              </Text>
            </TouchableOpacity>

            {/* 4. WhatsApp */}
            <TouchableOpacity
              style={[
                styles.contactItemBox,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => handleQuickContact("whatsapp")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(216, 178, 130, 0.12)"
                      : "rgba(216, 178, 130, 0.18)",
                  },
                ]}
              >
                <MessageSquare size={15} color="#D8B282" />
              </View>
              <Text
                style={[
                  styles.contactItemLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>

            {/* 5. Telegram */}
            <TouchableOpacity
              style={[
                styles.contactItemBox,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => handleQuickContact("telegram")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(216, 178, 130, 0.12)"
                      : "rgba(216, 178, 130, 0.18)",
                  },
                ]}
              >
                <Send size={14} color="#D8B282" />
              </View>
              <Text
                style={[
                  styles.contactItemLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Telegram
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. CÀI ĐẶT & BẢO MẬT (Minimalist, No Walls of Text) */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPrivacyModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Lock size={16} color="#D8B282" style={{ marginRight: 12 }} />
              <Text
                style={[
                  styles.settingLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Quyền riêng tư danh tính
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" },
            ]}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setCardVaultModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Wallet size={16} color="#D8B282" style={{ marginRight: 12 }} />
              <Text
                style={[
                  styles.settingLabel,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Ví danh thiếp đối tác đã thu thập
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 5. Nút Đăng xuất */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? "rgba(244, 63, 94, 0.08)" : "#FFF1F2",
              borderColor: isDark ? "rgba(244, 63, 94, 0.25)" : "#FECDD3",
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <LogOut size={16} color="#F43F5E" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <MyQrModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />
      <IdentityPrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
      <CardVaultModal
        visible={cardVaultModalVisible}
        onClose={() => setCardVaultModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#D8B282",
    overflow: "hidden",
    marginRight: 10,
  },
  headerAvatarImg: {
    width: "100%",
    height: "100%",
  },
  headerTitleCol: {
    justifyContent: "center",
  },
  titleVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitleText: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerSquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },
  identityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  watermarkV: {
    position: "absolute",
    bottom: -15,
    right: 12,
    fontSize: 90,
    fontWeight: "700",
    fontFamily: "serif",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTopBadge: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  cardTopRight: {
    alignItems: "flex-end",
  },
  cardBrandVione: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardBrandSub: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardLeftCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardDisplayName: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  cardJobTitle: {
    color: "#D8B282",
    fontSize: 13.5,
    fontWeight: "600",
    marginTop: 4,
  },
  cardCompany: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  portraitWrap: {
    width: 115,
    height: 135,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
  },
  portraitImg: {
    width: "100%",
    height: "100%",
  },
  cardBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  pillBtnWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pillBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 6,
  },
  pillBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "700",
  },
  viewProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  viewProfileText: {
    color: "#D8B282",
    fontSize: 12.5,
    fontWeight: "700",
    marginRight: 2,
  },
  quickContactCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickContactTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  contactItemBox: {
    width: (SCREEN_WIDTH - 32 - 32 - 10) / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  contactItemLabel: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  settingsCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 13.5,
    fontWeight: "500",
  },
  settingDivider: {
    height: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutBtnText: {
    color: "#F43F5E",
    fontSize: 13.5,
    fontWeight: "600",
  },
});
