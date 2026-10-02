import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  QrCode,
  Radio,
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Share2,
  Nfc,
  Eye,
  Sparkles,
  Award,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/common/Avatar";
import { MyQrModal } from "../quick-connect/MyQrModal";
import { IdentityPrivacyModal } from "../../components/IdentityPrivacyModal";
import { CardVaultModal } from "../../components/CardVaultModal";

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [cardVaultModalVisible, setCardVaultModalVisible] = useState(false);

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const userPhone = user?.phone || "0983 000 001";
  const userEmail = user?.email || "ceo@vione.vn";
  const userTitle = user?.title || "Chủ tịch HĐQT & Tổng Giám Đốc";
  const userCompany = user?.company || "Tập đoàn Đầu tư & Công nghệ ViOne";
  const userCode = user?.code || "VIONE-8888";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi ViOne Connect?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const handleNfc = () => {
    Alert.alert(
      "Thẻ NFC ViOne",
      "Chạm mặt sau điện thoại vào thẻ danh thiếp thông minh để kích hoạt hoặc truyền danh tính số.",
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* 1. Header Thương Hiệu ViOne */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require("../../../assets/vione-wordmark.png")}
            style={styles.logoWordmark}
            resizeMode="contain"
          />
          <Text style={styles.headerGreeting}>{getGreeting()}</Text>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => Alert.alert("Thông báo", "Bạn không có cảnh báo bảo mật mới.")}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#D8B282" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Identity Hero Profile Box */}
        <View style={styles.heroProfileCard}>
          <View style={styles.heroProfileMain}>
            <Avatar url={user?.avatarUrl} name={displayName} size={64} showGoldBorder />
            <View style={styles.heroProfileTexts}>
              <View style={styles.verifiedRow}>
                <ShieldCheck size={13} color="#D8B282" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedText}>DOANH NHÂN VIONE XÁC THỰC</Text>
              </View>
              <Text style={styles.heroDisplayName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.heroJobTitle} numberOfLines={1}>
                {userTitle}
              </Text>
              <Text style={styles.heroCompany} numberOfLines={1}>
                {userCompany}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Phone size={13} color="#D8B282" style={{ marginRight: 5 }} />
              <Text style={styles.contactItemText}>{userPhone}</Text>
            </View>
            <View style={styles.contactDot} />
            <View style={styles.contactItem}>
              <Mail size={13} color="#D8B282" style={{ marginRight: 5 }} />
              <Text style={styles.contactItemText}>{userEmail}</Text>
            </View>
          </View>
        </View>

        {/* 3. Quick Actions Grid (4 Icons in row - Matching Web PWA) */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => Alert.alert("Chia sẻ", `Liên kết danh thiếp số: https://vione.vn/c/${userCode}`)}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionCircle}>
              <Share2 size={18} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Chia sẻ link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionCircle}>
              <QrCode size={18} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Mã QR của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={handleNfc}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionCircle}>
              <Nfc size={18} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Thẻ NFC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setCardVaultModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionCircle}>
              <Wallet size={18} color="#D8B282" />
            </View>
            <Text style={styles.quickActionLabel}>Ví danh thiếp</Text>
          </TouchableOpacity>
        </View>

        {/* 4. 3D Digital Business Card */}
        <Text style={styles.sectionHeader}>DANH THIẾP ĐIỆN TỬ TITANIUM</Text>
        <View style={styles.card3dWrapper}>
          <LinearGradient
            colors={["#181D2A", "#12151F", "#0A0A0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card3d}
          >
            <View style={styles.cardTrim}>
              <View style={styles.cardTopRow}>
                <View style={styles.brandRow}>
                  <View style={styles.cardLogoBadge}>
                    <Text style={styles.cardLogoV}>V</Text>
                  </View>
                  <Text style={styles.cardBrandName}>VIONE CONNECT</Text>
                </View>

                <View style={styles.nfcIndicator}>
                  <Radio size={14} color="#D8B282" />
                  <Text style={styles.nfcText}>NFC TITANIUM</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                <View style={styles.smartChip}>
                  <View style={styles.chipLine1} />
                  <View style={styles.chipLine2} />
                </View>
                <View style={styles.codePill}>
                  <Text style={styles.cardCodeText}>{userCode}</Text>
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <View style={styles.cardUserMeta}>
                  <Text style={styles.cardUserName}>{displayName}</Text>
                  <Text style={styles.cardUserTitle}>{userTitle}</Text>
                  <Text style={styles.cardUserCompany}>{userCompany}</Text>
                </View>

                <TouchableOpacity
                  style={styles.qrShortcutBtn}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <QrCode size={22} color="#050C15" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 5. Về tôi (About Me Showcase) */}
        <Text style={styles.sectionHeader}>VỀ TÔI & NĂNG LỰC DOANH NGHIỆP</Text>
        <View style={styles.infoCard}>
          <Text style={styles.bioText}>
            Doanh nhân, nhà sáng lập và điều hành doanh nghiệp. Đam mê kết nối kinh doanh, mở rộng chuỗi cung ứng và xúc tiến thương mại chuyển đổi số.
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>15+ Năm</Text>
              <Text style={styles.metricLab}>Kinh nghiệm</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>500+</Text>
              <Text style={styles.metricLab}>Đối tác kết nối</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>20+ Dự án</Text>
              <Text style={styles.metricLab}>Hợp tác B2B</Text>
            </View>
          </View>

          <View style={styles.interestsWrap}>
            {["Chuyển đổi số", "M&A Doanh nghiệp", "Đầu tư vốn", "Fintech", "AI Copilot 5.0"].map((item) => (
              <View key={item} style={styles.interestPill}>
                <Text style={styles.interestText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Thông tin liên hệ & Doanh nghiệp */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>THÔNG TIN LIÊN HỆ & DOANH NGHIỆP</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Mail size={16} color="#D8B282" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Email công việc</Text>
              <Text style={styles.infoValue}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Phone size={16} color="#D8B282" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Briefcase size={16} color="#D8B282" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Lĩnh vực hoạt động</Text>
              <Text style={styles.infoValue}>Công Nghệ & Đầu Tư Doanh Nghiệp</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Globe size={16} color="#D8B282" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Website doanh nghiệp</Text>
              <Text style={styles.infoValue}>https://vione.vn</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MapPin size={16} color="#D8B282" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Trụ sở văn phòng</Text>
              <Text style={styles.infoValue}>Tòa nhà Keangnam Landmark 72, Hà Nội</Text>
            </View>
          </View>
        </View>

        {/* 7. Cài đặt & Bảo mật */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>CÀI ĐẶT & BẢO MẬT</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Lock size={17} color="#D8B282" style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Quản lý quyền riêng tư danh tính</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setCardVaultModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Wallet size={17} color="#D8B282" style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Ví danh thiếp đối tác đã thu thập</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert("Cá nhân hóa AI", "Cài đặt đề xuất kết nối AI Copilot 5.0.")}
          >
            <View style={styles.settingLeft}>
              <Sparkles size={17} color="#D8B282" style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Cá nhân hóa AI Copilot</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert("Đổi mật khẩu", "Nhập mật khẩu hiện tại và mật khẩu mới.")}
          >
            <View style={styles.settingLeft}>
              <Shield size={17} color="#D8B282" style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Đổi mật khẩu tài khoản</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.appInfoBox}>
          <Smartphone size={13} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.appInfoText}>
            ViOne Business Connect • Native React Native v5.0.0
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <LogOut size={17} color="#F43F5E" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Modal */}
      <MyQrModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />

      {/* Identity Privacy Modal */}
      <IdentityPrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      {/* Partner Card Vault Modal */}
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
    backgroundColor: "#0A0A0B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#0A0A0B",
  },
  headerBrand: {
    justifyContent: "center",
  },
  logoWordmark: {
    width: 140,
    height: 48,
  },
  headerGreeting: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: -2,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  heroProfileCard: {
    backgroundColor: "#12151F",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    padding: 16,
    marginBottom: 16,
  },
  heroProfileMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroProfileTexts: {
    flex: 1,
    marginLeft: 14,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  verifiedText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroDisplayName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  heroJobTitle: {
    color: "#D8B282",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 2,
  },
  heroCompany: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    marginVertical: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactItemText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11.5,
  },
  contactDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D8B282",
    marginHorizontal: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  quickActionItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#12151F",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  quickActionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionHeader: {
    color: "#D8B282",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
  card3dWrapper: {
    marginBottom: 20,
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  card3d: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(216, 178, 130, 0.45)",
  },
  cardTrim: {
    padding: 18,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLogoBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardLogoV: {
    color: "#050C15",
    fontSize: 15,
    fontWeight: "900",
  },
  cardBrandName: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  nfcIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nfcText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
  },
  smartChip: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "#D8B282",
    padding: 3,
    justifyContent: "space-around",
  },
  chipLine1: {
    height: 1,
    backgroundColor: "#D8B282",
  },
  chipLine2: {
    height: 1,
    backgroundColor: "#D8B282",
  },
  codePill: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  cardCodeText: {
    color: "#D8B282",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardUserMeta: {
    flex: 1,
  },
  cardUserName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  cardUserTitle: {
    color: "#D8B282",
    fontSize: 11.5,
    marginTop: 2,
  },
  cardUserCompany: {
    color: "#94A3B8",
    fontSize: 10.5,
    marginTop: 2,
  },
  qrShortcutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: "#12151F",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
  },
  bioText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12.5,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricVal: {
    color: "#D8B282",
    fontSize: 14,
    fontWeight: "800",
  },
  metricLab: {
    color: "#94A3B8",
    fontSize: 10.5,
    marginTop: 2,
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  interestPill: {
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  interestText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    color: "#94A3B8",
    fontSize: 10.5,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 10,
  },
  settingsCard: {
    backgroundColor: "#12151F",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  appInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 12,
  },
  appInfoText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.4)",
    borderRadius: 16,
    paddingVertical: 14,
  },
  logoutBtnText: {
    color: "#F43F5E",
    fontSize: 14,
    fontWeight: "700",
  },
});
