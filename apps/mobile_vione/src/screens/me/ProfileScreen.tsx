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
  User,
  Briefcase,
  Trophy,
  Sparkles,
  Building2,
  ExternalLink,
  Share2,
  RotateCcw,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { StickyBrandHeader } from "../../components/common/StickyBrandHeader";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { IdentityPrivacyModal } from "../../components/IdentityPrivacyModal";
import { CardVaultModal } from "../../components/CardVaultModal";
import { BusinessNotificationsModal } from "../../components/BusinessNotificationsModal";
import { ViOneVoiceAssistantModal } from "../../components/ai/ViOneVoiceAssistantModal";
import { EditProfileModal } from "../../components/EditProfileModal";
import { AccountSecurityModal } from "../../components/AccountSecurityModal";
import { NfcTagsModal } from "../../components/NfcTagsModal";
import { UserProfile } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function initialsOf(name: string | null, emailFallback: string | null): string {
  const source = (name ?? "").trim() || (emailFallback ?? "");
  const parts = source.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return "VO";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme, setTheme } = useTheme();

  const [activeUser, setActiveUser] = useState<UserProfile | null>(user);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [cardVaultModalVisible, setCardVaultModalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [nfcTagsModalVisible, setNfcTagsModalVisible] = useState(false);

  const currentUser = activeUser || user;
  const displayName = currentUser?.displayName || currentUser?.name || "Doanh nhân ViOne";
  const userPhone = currentUser?.phone || "0983 000 001";
  const userEmail = currentUser?.email || "ceo@vione.vn";
  const userTitle = currentUser?.title || "Chủ tịch HĐQT & Tổng Giám Đốc";
  const userCompany = currentUser?.company || "Tập đoàn Đầu tư & Công nghệ ViOne";
  const userCode = currentUser?.code || "VN-CEO-001";
  const userBio =
    currentUser?.bio ||
    "Doanh nhân, nhà sáng lập và điều hành doanh nghiệp. Đam mê kết nối kinh doanh B2B và xúc tiến thương mại chuyển đổi số toàn diện.";

  const handleRestoreFloatingAi = async () => {
    try {
      await AsyncStorage.removeItem("vione_ai_floating_closed");
    } catch {}
    setAiAssistantVisible(true);
    Alert.alert(
      "Trợ lý AI ViOne",
      "Đã mở Trợ lý AI ViOne và kích hoạt lại biểu tượng AI nổi trên màn hình chính!"
    );
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi ViOne Connect?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const handleNfc = () => {
    setNfcTagsModalVisible(true);
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
            onPress={() => setNotificationsVisible(true)}
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
        {/* 2. CARD DANH TÍNH SỐ (Matching 100% PWA MeIdentityCard) */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.05,
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
            <View style={styles.cardTopBadgeWrap}>
              <Sparkles size={11} color={isDark ? "#D8B282" : "#8C653B"} />
              <Text
                style={[
                  styles.cardTopBadge,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                DANH TÍNH SỐ DOANH NHÂN
              </Text>
            </View>
            <View style={styles.cardTopRight}>
              <Text style={styles.cardBrandVione}>VIONE</Text>
              <Text style={styles.cardBrandSub}>BUSINESS CONNECT</Text>
            </View>
          </View>

          {/* Main Row: Name / Info on Left & Portrait / Avatar on Right */}
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
              <Text
                style={[
                  styles.cardJobTitle,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
                numberOfLines={1}
              >
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

            {/* Sync Avatar: Real avatar URL or Monogram Initials (NO RANDOM CITY PHOTO) */}
            <View
              style={[
                styles.portraitWrap,
                {
                  backgroundColor: isDark ? "#182030" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.35)" : "rgba(216, 178, 130, 0.45)",
                },
              ]}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.portraitImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.portraitInitialWrap}>
                  <Text
                    style={[
                      styles.portraitInitialText,
                      { color: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    {initialsOf(displayName, userEmail)}
                  </Text>
                  <Text
                    style={[
                      styles.portraitInitialSub,
                      { color: isDark ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    ViOne VIP
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 3 Champagne Gold Action Buttons: [QR của tôi], [Chạm NFC] & [Chỉnh sửa] */}
          <View style={styles.cardBtnRow}>
            <TouchableOpacity
              style={[
                styles.pillBtnWrap,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.16)" : "#FDF6EC",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                },
              ]}
              onPress={() => setQrModalVisible(true)}
              activeOpacity={0.8}
            >
              <QrCode size={15} color={isDark ? "#D8B282" : "#8C653B"} strokeWidth={2} />
              <Text
                style={[
                  styles.pillBtnText,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                QR của tôi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtnWrap,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.16)" : "#FDF6EC",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                },
              ]}
              onPress={handleNfc}
              activeOpacity={0.8}
            >
              <Nfc size={15} color={isDark ? "#D8B282" : "#8C653B"} strokeWidth={2} />
              <Text
                style={[
                  styles.pillBtnText,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                Chạm NFC
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtnWrap,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.16)" : "#FDF6EC",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                },
              ]}
              onPress={() => setEditProfileModalVisible(true)}
              activeOpacity={0.8}
            >
              <User size={15} color={isDark ? "#D8B282" : "#8C653B"} strokeWidth={2} />
              <Text
                style={[
                  styles.pillBtnText,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                Chỉnh sửa
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Right Link: Chỉnh sửa hồ sơ */}
          <TouchableOpacity
            style={styles.viewProfileLink}
            onPress={() => setEditProfileModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewProfileText,
                { color: isDark ? "#D8B282" : "#8C653B" },
              ]}
            >
              Chỉnh sửa thông tin hồ sơ
            </Text>
            <ChevronRight size={14} color={isDark ? "#D8B282" : "#8C653B"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 3. CARD LIÊN HỆ NHANH (Khớp 100% PWA MeQuickContact) */}
        <View
          style={[
            styles.quickContactCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitleSmall,
              { color: isDark ? "#D8B282" : "#8C653B" },
            ]}
          >
            LIÊN HỆ NHANH
          </Text>

          <View style={styles.contactGrid}>
            {/* Gọi điện */}
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
                <Phone size={15} color={isDark ? "#D8B282" : "#8C653B"} />
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

            {/* Email */}
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
                <Mail size={15} color={isDark ? "#D8B282" : "#8C653B"} />
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

            {/* Viber */}
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
                <MessageCircle size={15} color={isDark ? "#D8B282" : "#8C653B"} />
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

            {/* WhatsApp */}
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
                <MessageSquare size={15} color={isDark ? "#D8B282" : "#8C653B"} />
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

            {/* Telegram */}
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
                <Send size={14} color={isDark ? "#D8B282" : "#8C653B"} />
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

        {/* 4. PANEL VỀ TÔI (Matching 100% PWA MeAboutPanel) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <User size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.sectionCardTitle,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Về tôi
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(true)}
            >
              <Text
                style={[
                  styles.sectionHeaderLink,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                Chỉnh sửa
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.bioParagraph,
              { color: isDark ? "rgba(255, 255, 255, 0.8)" : "#475569" },
            ]}
          >
            {userBio}
          </Text>

          {/* 3 Metrics: Kinh nghiệm, Đối tác, Kết nối */}
          <View
            style={[
              styles.metricsRow,
              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <View style={styles.metricItem}>
              <Text
                style={[
                  styles.metricValue,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                12+
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Năm kinh nghiệm
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text
                style={[
                  styles.metricValue,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                50+
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Đối tác chiến lược
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text
                style={[
                  styles.metricValue,
                  { color: isDark ? "#D8B282" : "#8C653B" },
                ]}
              >
                500+
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Doanh nhân kết nối
              </Text>
            </View>
          </View>

          {/* Interests Chips */}
          <View style={styles.interestsWrap}>
            {[
              "Công nghệ B2B",
              "Chuyển đổi số",
              "Đầu tư & M&A",
              "Chuỗi cung ứng",
              "Quản trị tinh gọn",
            ].map((tag) => (
              <View
                key={tag}
                style={[
                  styles.interestChip,
                  {
                    backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    { color: isDark ? "#D8B282" : "#475569" },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5. LĨNH VỰC KINH DOANH & SẢN PHẨM (Matching 100% PWA MeShowcasePanel) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Briefcase size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.sectionCardTitle,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Lĩnh vực kinh doanh & Sản phẩm
              </Text>
            </View>
          </View>

          <View style={styles.showcaseList}>
            {[
              {
                id: "b1",
                title: "Tư vấn Chuyển đổi số & AI ERP",
                desc: "Giải pháp ERP đám mây tích hợp trợ lý AI tự động hoá quy trình cho doanh nghiệp quy mô lớn.",
              },
              {
                id: "b2",
                title: "Xúc tiến Thương mại & Kết nối B2B",
                desc: "Mạng lưới kết nối chuỗi cung ứng, tìm kiếm đại lý phân phối và đối tác liên doanh chiến lược.",
              },
              {
                id: "b3",
                title: "Đầu tư Doanh nghiệp & Vốn mạo hiểm",
                desc: "Tư vấn huy động vốn, sáp nhập & mua bán doanh nghiệp (M&A) công nghệ và sản xuất tiêu biểu.",
              },
            ].map((item) => (
              <View
                key={item.id}
                style={[
                  styles.showcaseItem,
                  {
                    backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.showcaseItemHeader}>
                  <Building2 size={15} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.showcaseItemTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.showcaseItemDesc,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. KHÁCH HÀNG & ĐỐI TÁC TIÊU BIỂU (Matching 100% PWA MeShowcasePanel Clients) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Trophy size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.sectionCardTitle,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Khách hàng & Đối tác tiêu biểu
              </Text>
            </View>
          </View>

          <View style={styles.clientGrid}>
            {[
              { id: "c1", name: "V-Pharma Global", tag: "Dược phẩm" },
              { id: "c2", name: "Techcom Solutions", tag: "Công nghệ" },
              { id: "c3", name: "VietLogistics Corp", tag: "Vận tải B2B" },
              { id: "c4", name: "Tân Hoàng Minh Group", tag: "Bất động sản" },
              { id: "c5", name: "An Phát Holdings", tag: "Sản xuất" },
              { id: "c6", name: "+12 Doanh nghiệp khác", tag: "Mạng lưới" },
            ].map((c) => (
              <View
                key={c.id}
                style={[
                  styles.clientCard,
                  {
                    backgroundColor: isDark ? "#181D2A" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                  },
                ]}
              >
                <View
                  style={[
                    styles.clientLogoMonogram,
                    {
                      backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#F6E1C3",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.clientLogoInitial,
                      { color: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    {c.name.charAt(0)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.clientName,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <Text
                  style={[
                    styles.clientTag,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  {c.tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. CHIA SẺ DANH TÍNH & DANH THIẾP */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitleSmall,
              { color: isDark ? "#D8B282" : "#8C653B", paddingHorizontal: 4, paddingTop: 6 },
            ]}
          >
            QUẢN LÝ DANH THIẾP & BẢO MẬT
          </Text>

          {/* Tap to connect row */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleNfc}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Nfc size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Chạm để kết nối (Tap to Connect)
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Sẵn sàng truyền danh tính số qua chip NFC
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" },
            ]}
          />

          {/* Ví danh thiếp */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setCardVaultModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Wallet size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Ví danh thiếp đối tác đã thu thập
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Lưu trữ và phân loại các danh thiếp số đã quét
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" },
            ]}
          />

          {/* Quyền riêng tư */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPrivacyModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Lock size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Quyền riêng tư danh tính số
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Ẩn/hiện số điện thoại, email và hồ sơ công khai
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" },
            ]}
          />

          {/* Bảo mật tài khoản & Đổi mật khẩu (Matching 100% PWA /connect-app/me/security) */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setSecurityModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <ShieldCheck size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Bảo mật tài khoản & Đổi mật khẩu
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Đổi mật khẩu, xác thực 2 lớp (2FA) & quản lý phiên đăng nhập
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
        </View>

        {/* 8. GIAO DIỆN (THEME SWITCHER) */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitleSmall,
              { color: isDark ? "#D8B282" : "#8C653B", paddingHorizontal: 4, paddingTop: 6 },
            ]}
          >
            GIAO DIỆN ỨNG DỤNG
          </Text>

          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: !isDark ? "#FDF6EC" : isDark ? "#181D2A" : "#F1F5F9",
                  borderColor: !isDark ? "#D8B282" : "transparent",
                  borderWidth: !isDark ? 1.5 : 1,
                },
              ]}
              onPress={() => setTheme("light")}
              activeOpacity={0.8}
            >
              <Sun size={18} color={!isDark ? "#8C653B" : "#94A3B8"} />
              <Text
                style={[
                  styles.themeBtnText,
                  {
                    color: !isDark ? "#8C653B" : "#94A3B8",
                    fontWeight: !isDark ? "700" : "500",
                  },
                ]}
              >
                Chế độ Sáng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#F1F5F9",
                  borderColor: isDark ? "#D8B282" : "transparent",
                  borderWidth: isDark ? 1.5 : 1,
                },
              ]}
              onPress={() => setTheme("dark")}
              activeOpacity={0.8}
            >
              <Moon size={18} color={isDark ? "#D8B282" : "#64748B"} />
              <Text
                style={[
                  styles.themeBtnText,
                  {
                    color: isDark ? "#D8B282" : "#64748B",
                    fontWeight: isDark ? "700" : "500",
                  },
                ]}
              >
                Chế độ Tối
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. TRỢ LÝ AI VIONE (AI COPILOT) */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: isDark ? "#12151F" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
              shadowColor: isDark ? "#000000" : "#64748B",
              shadowOpacity: isDark ? 0.3 : 0.04,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitleSmall,
              { color: isDark ? "#D8B282" : "#8C653B", paddingHorizontal: 4, paddingTop: 6 },
            ]}
          >
            TRỢ LÝ AI VIONE (AI COPILOT)
          </Text>

          {/* Mở Trợ lý AI */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setAiAssistantVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Sparkles size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Mở Trợ lý Doanh Nhân ViOne AI
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Tra cứu dữ liệu realtime, đối tác, lịch hẹn và sự kiện
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" },
            ]}
          />

          {/* Khôi phục nút AI nổi ở Trang chủ */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleRestoreFloatingAi}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <RotateCcw size={16} color={isDark ? "#D8B282" : "#8C653B"} style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Khôi phục nút AI nổi ở Trang chủ
                </Text>
                <Text
                  style={[
                    styles.settingSub,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Mở lại bong bóng AI di chuyển tự do trên màn hình
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
        </View>

        {/* 10. Nút Đăng xuất */}
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

      {/* Floating AI Copilot Assistant Button */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => setAiAssistantVisible(true)}
        activeOpacity={0.85}
      >
        <Sparkles size={18} color="#050C15" />
        <Text style={styles.floatingAiText}>ViOne AI</Text>
      </TouchableOpacity>

      {/* Realtime Business Notifications Modal */}
      <BusinessNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

      {/* ViOne AI Voice Assistant Modal */}
      <ViOneVoiceAssistantModal
        visible={aiAssistantVisible}
        onClose={() => setAiAssistantVisible(false)}
      />

      {/* Parity Modals */}
      <MyQrModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />
      <IdentityPrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
      <CardVaultModal
        visible={cardVaultModalVisible}
        onClose={() => setCardVaultModalVisible(false)}
      />
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => setActiveUser(updated)}
      />
      <AccountSecurityModal
        visible={securityModalVisible}
        onClose={() => setSecurityModalVisible(false)}
      />
      <NfcTagsModal
        visible={nfcTagsModalVisible}
        onClose={() => setNfcTagsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    paddingTop: 4,
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
  identityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
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
  cardTopBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardTopBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
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
    width: 105,
    height: 125,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  portraitImg: {
    width: "100%",
    height: "100%",
  },
  portraitInitialWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  portraitInitialText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  portraitInitialSub: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.8,
  },
  cardBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  pillBtnWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillBtnText: {
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
    fontSize: 12,
    fontWeight: "700",
    marginRight: 2,
  },
  quickContactCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitleSmall: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeaderLink: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  bioParagraph: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  interestChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  interestChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  showcaseList: {
    gap: 8,
  },
  showcaseItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  showcaseItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  showcaseItemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  showcaseItemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  clientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clientCard: {
    width: (SCREEN_WIDTH - 32 - 32 - 16) / 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  clientLogoMonogram: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  clientLogoInitial: {
    fontSize: 14,
    fontWeight: "800",
  },
  clientName: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  clientTag: {
    fontSize: 9.5,
    fontWeight: "500",
    textAlign: "center",
  },
  settingsCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  settingSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  themeBtnText: {
    fontSize: 12.5,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 24,
  },
  logoutBtnText: {
    color: "#F43F5E",
    fontSize: 13.5,
    fontWeight: "600",
  },
  floatingAiBtn: {
    position: "absolute",
    bottom: 24,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D8B282",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  floatingAiText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#050C15",
  },
});
