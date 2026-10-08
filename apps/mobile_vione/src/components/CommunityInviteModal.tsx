import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { X, QrCode, Copy, Share2, Users, ShieldCheck, Check, Sparkles, Building2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface CommunityInviteData {
  id: string;
  name: string;
  shortDescription?: string;
  logoUrl?: string | null;
  communityType?: string;
  memberCount?: number;
}

interface CommunityInviteModalProps {
  visible: boolean;
  onClose: () => void;
  community?: CommunityInviteData | null;
  communityId?: string;
  communityName?: string;
  communityDescription?: string;
}

export const CommunityInviteModal: React.FC<CommunityInviteModalProps> = ({
  visible,
  onClose,
  community: communityProp,
  communityId,
  communityName,
  communityDescription,
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const community: CommunityInviteData = communityProp || {
    id: communityId || "comm-vione",
    name: communityName || "Cộng đồng Doanh nhân ViOne",
    shortDescription: communityDescription || "Kết nối giao thương B2B & xúc tiến thương mại",
    communityType: "b2b_networking",
    memberCount: 128,
  };

  const inviteUrl = `https://vione.vn/c/${community.id}`;

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      Alert.alert("Đã sao chép", "Đã sao chép liên kết mời gia nhập cộng đồng vào bộ nhớ tạm.");
    } catch {
      Alert.alert("Sao chép", `Liên kết: ${inviteUrl}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Gia nhập cộng đồng ${community.name}`,
        message: `Kính mời bạn tham gia cộng đồng "${community.name}" trên hệ sinh thái ViOne Connect:\n\n${inviteUrl}\n\nKết nối doanh nhân C-Level & mở ra cơ hội hợp tác kinh doanh!`,
      });
    } catch {
      Alert.alert("Chia sẻ", "Không thể kích hoạt chia sẻ.");
    }
  };

  const isCompany =
    community.communityType === "company_internal" ||
    community.name?.toLowerCase().includes("công ty") ||
    community.name?.toLowerCase().includes("tập đoàn");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Sparkles size={11} color="#DFB76C" />
                <Text style={styles.headerBadgeText}>KẾT NỐI HỘI VIÊN</Text>
              </View>
              <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                Mời Gia Nhập Cộng Đồng
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Community Card Box */}
            <View
              style={[
                styles.communityBox,
                {
                  backgroundColor: isDark ? "#141C2B" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              {community.logoUrl ? (
                <Image source={{ uri: community.logoUrl }} style={styles.communityLogo} />
              ) : (
                <View style={styles.logoFallback}>
                  <Building2 size={24} color="#DFB76C" />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.communityName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  {community.name}
                </Text>
                <Text style={styles.communitySub} numberOfLines={2}>
                  {community.shortDescription || "Mạng lưới kết nối doanh nghiệp C-Level."}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {isCompany ? "NỘI BỘ DOANH NGHIỆP" : "LIÊN MINH B2B"}
                    </Text>
                  </View>
                  <Text style={styles.memberCountText}>
                    {community.memberCount || 24} thành viên
                  </Text>
                </View>
              </View>
            </View>

            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              <View
                style={[
                  styles.qrWhiteBox,
                  { borderColor: isDark ? "#DFB76C" : "rgba(216, 178, 130, 0.6)" },
                ]}
              >
                {/* Simulated QR Code Graphic */}
                <View style={styles.qrInner}>
                  <QrCode size={160} color="#050C15" strokeWidth={1.5} />
                  <View style={styles.qrCenterBadge}>
                    <Text style={styles.qrCenterV}>V</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.qrInstruction}>
                Quét mã QR bằng Camera điện thoại hoặc Zalo để tham gia
              </Text>
            </View>

            {/* Invite Link Box */}
            <Text style={[styles.fieldLabel, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
              LIÊN KẾT MỜI GIA NHẬP
            </Text>
            <View
              style={[
                styles.linkBox,
                {
                  backgroundColor: isDark ? "#141C2B" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={[
                  styles.linkText,
                  { color: isDark ? "#E2E8F0" : "#334155" },
                ]}
                numberOfLines={1}
              >
                {inviteUrl}
              </Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                {copied ? (
                  <Check size={16} color="#10B981" />
                ) : (
                  <Copy size={16} color="#DFB76C" />
                )}
                <Text style={[styles.copyBtnText, copied && { color: "#10B981" }]}>
                  {copied ? "Đã chép" : "Sao chép"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Information Policy */}
            <View
              style={[
                styles.policyBox,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.08)" : "#FDF6EC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "rgba(216, 178, 130, 0.4)",
                },
              ]}
            >
              <ShieldCheck size={16} color="#DFB76C" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.policyText}>
                {isCompany
                  ? "Cộng đồng nội bộ: Người được mời sẽ gửi yêu cầu gia nhập và cần được Giám đốc / Quản trị viên duyệt để kích hoạt phân quyền giao việc."
                  : "Mạng lưới B2B: Mọi doanh nhân C-Level quét mã hoặc mở liên kết sẽ tham gia ngay để kết nối cơ hội kinh doanh và lịch họp 1-1."}
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <LinearGradient
                colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                style={styles.shareGrad}
              >
                <Share2 size={16} color="#050C15" style={{ marginRight: 6 }} />
                <Text style={styles.shareBtnText}>Chia sẻ qua Zalo / Tin nhắn</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.15)",
    paddingBottom: 12,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: "#DFB76C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  scrollBody: {
    marginTop: 14,
  },
  communityBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  communityLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#DFB76C",
  },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DFB76C",
    alignItems: "center",
    justifyContent: "center",
  },
  communityName: {
    fontSize: 15,
    fontWeight: "700",
  },
  communitySub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
  },
  typeBadgeText: {
    color: "#DFB76C",
    fontSize: 9,
    fontWeight: "800",
  },
  memberCountText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  qrWhiteBox: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  qrInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrCenterBadge: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DFB76C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  qrCenterV: {
    color: "#050C15",
    fontWeight: "900",
    fontSize: 16,
  },
  qrInstruction: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 10,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    marginRight: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
  },
  copyBtnText: {
    color: "#DFB76C",
    fontSize: 12,
    fontWeight: "700",
  },
  policyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: "#A3703C",
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  shareBtn: {
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  shareGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
