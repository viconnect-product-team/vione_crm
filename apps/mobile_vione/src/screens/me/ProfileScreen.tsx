import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/common/Avatar";
import { LuxuryCard } from "../../components/common/LuxuryCard";
import { MyQrModal } from "../quick-connect/MyQrModal";

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi ViOne Connect?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.screenTitle}>Hồ Sơ C-Level</Text>

        {/* 3D Digital Business Card */}
        <View style={styles.card3dWrapper}>
          <LinearGradient
            colors={["#161E34", "#0C1122", "#05070E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card3d}
          >
            {/* Card Gold Trim Border */}
            <View style={styles.cardTrim}>
              {/* Card Top Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.brandRow}>
                  <View style={styles.cardLogoBadge}>
                    <Text style={styles.cardLogoV}>V</Text>
                  </View>
                  <Text style={styles.cardBrandName}>VIONE CONNECT</Text>
                </View>

                {/* NFC Indicator */}
                <View style={styles.nfcIndicator}>
                  <Radio size={16} color={Colors.gold} />
                  <Text style={styles.nfcText}>NFC</Text>
                </View>
              </View>

              {/* Card Chip & Identity */}
              <View style={styles.chipRow}>
                <View style={styles.smartChip}>
                  <View style={styles.chipLine1} />
                  <View style={styles.chipLine2} />
                </View>
                <View style={styles.codePill}>
                  <Text style={styles.cardCodeText}>
                    {user?.code || "VIONE-8888"}
                  </Text>
                </View>
              </View>

              {/* Card Bottom Meta */}
              <View style={styles.cardBottomRow}>
                <View style={styles.cardUserMeta}>
                  <Text style={styles.cardUserName}>{user?.displayName || "Doanh Nhân C-Level"}</Text>
                  <Text style={styles.cardUserTitle}>{user?.title || "Tổng Giám Đốc"}</Text>
                  <Text style={styles.cardUserCompany}>{user?.company || "ViOne Business Network"}</Text>
                </View>

                <TouchableOpacity
                  style={styles.qrShortcutBtn}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <QrCode size={24} color="#05070E" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Info Rows */}
        <Text style={styles.sectionHeader}>THÔNG TIN LIÊN HỆ & DOANH NGHIỆP</Text>
        <LuxuryCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Mail size={16} color={Colors.gold} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Email công việc</Text>
              <Text style={styles.infoValue}>{user?.email || "Chưa cập nhật"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Phone size={16} color={Colors.gold} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phone || "0988 123 456"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Briefcase size={16} color={Colors.gold} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Lĩnh vực hoạt động</Text>
              <Text style={styles.infoValue}>{user?.industry || "Công Nghệ & Đầu Tư Doanh Nghiệp"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Globe size={16} color={Colors.gold} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Website doanh nghiệp</Text>
              <Text style={styles.infoValue}>{user?.website || "https://vione.vn"}</Text>
            </View>
          </View>
        </LuxuryCard>

        {/* Settings & Security */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>CÀI ĐẶT & BẢO MẬT</Text>
        <LuxuryCard style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert("Đổi mật khẩu", "Nhập mật khẩu hiện tại và mật khẩu mới.")}
          >
            <View style={styles.settingLeft}>
              <Lock size={18} color={Colors.gold} style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Đổi mật khẩu tài khoản</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert("Thông báo", "Cài đặt nhắc hẹn và thông báo kết nối.")}
          >
            <View style={styles.settingLeft}>
              <Bell size={18} color={Colors.gold} style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Cài đặt thông báo</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert("Sinh trắc học", "Bật Face ID / Vân tay để mở app.")}
          >
            <View style={styles.settingLeft}>
              <Shield size={18} color={Colors.gold} style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>Bảo mật sinh trắc học</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </LuxuryCard>

        {/* App Version Info */}
        <View style={styles.appInfoBox}>
          <Smartphone size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.appInfoText}>
            ViOne Business Connect • Native React Native v1.0.0
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <LogOut size={18} color={Colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Modal */}
      <MyQrModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  card3dWrapper: {
    marginBottom: 24,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card3d: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  cardTrim: {
    padding: 20,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardLogoV: {
    color: "#05070E",
    fontSize: 16,
    fontWeight: "900",
  },
  cardBrandName: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  nfcIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nfcText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 18,
  },
  smartChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 4,
    justifyContent: "space-around",
  },
  chipLine1: {
    height: 1,
    backgroundColor: Colors.gold,
  },
  chipLine2: {
    height: 1,
    backgroundColor: Colors.gold,
  },
  codePill: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  cardCodeText: {
    color: Colors.goldLight,
    fontSize: 10,
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
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  cardUserTitle: {
    color: Colors.goldLight,
    fontSize: 12,
    marginTop: 2,
  },
  cardUserCompany: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  qrShortcutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionHeader: {
    color: Colors.goldLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorderLight,
    marginVertical: 12,
  },
  settingsCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
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
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  appInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  appInfoText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});
