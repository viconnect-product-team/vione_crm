import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  Share,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  QrCode,
  Nfc,
  Share2,
  X,
  Phone,
  Mail,
  Building2,
  Globe,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  User,
  Crown,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { VIconMark } from "./VIconMark";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MemberCardBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpenMyQr?: () => void;
  onOpenNfc?: () => void;
  onOpenProfile?: () => void;
}

export const MemberCardBottomSheet: React.FC<MemberCardBottomSheetProps> = ({
  visible,
  onClose,
  onOpenMyQr,
  onOpenNfc,
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const jobTitle = user?.title || "Chủ tịch HĐQT & Tổng Giám Đốc";
  const companyName = user?.company || "Tập đoàn Đầu tư & Công nghệ ViOne";
  const phone = user?.phone || "0912 345 678";
  const email = user?.email || "ceo@vione.vn";
  const memberCode = user?.code || "VN-8888";
  const website = user?.website || "https://vione.vn";

  const getInitial = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "V";
    return parts[parts.length - 1][0].toUpperCase();
  };

  // PanResponder for smooth Swipe Down to Dismiss gesture
  const panY = useRef(new Animated.Value(0)).current;

  const resetPosition = () => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeWithAnimation = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      panY.setValue(0);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ bắt cử chỉ khi vuốt xuống rõ ràng
        return gestureState.dy > 8;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.6) {
          closeWithAnimation();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Danh thiếp Doanh nhân ViOne - ${displayName}`,
        message: `Kính mời Quý đối tác kết nối với ${displayName} (${jobTitle} - ${companyName}) trên ViOne Connect: ${user?.shareUrl || `https://vione.vn/c/${memberCode}`}`,
        url: user?.shareUrl || `https://vione.vn/c/${memberCode}`,
      });
    } catch (err: any) {
      Alert.alert("Chia sẻ", "Không thể mở bảng chia sẻ trên thiết bị.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropDismissArea} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.35)" : "rgba(216, 178, 130, 0.45)",
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Top Drag Handle Header - Vuốt tay xuống để đóng */}
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View
              style={[
                styles.dragHandleBar,
                { backgroundColor: isDark ? "rgba(216, 178, 130, 0.45)" : "rgba(163, 112, 60, 0.4)" },
              ]}
            />
            <View style={styles.headerTitleRow}>
              <View style={styles.headerLeft}>
                <View style={styles.vipTagPill}>
                  <Crown size={12} color="#D8B282" />
                  <Text style={styles.vipTagText}>DOANH NHÂN VIONE</Text>
                </View>
                <Text
                  style={[
                    styles.sheetMainTitle,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Thẻ Hội Viên Doanh Nghiệp
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeWithAnimation}
                style={[
                  styles.closeCircleBtn,
                  { backgroundColor: isDark ? "#181D2A" : "#F1F5F9" },
                ]}
                activeOpacity={0.7}
              >
                <X size={16} color={isDark ? "#D8B282" : "#475569"} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.76 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* THẺ DOANH NHÂN VIONE 3D LUXURY CARD */}
            <View style={styles.cardOuterFrame}>
              <LinearGradient
                colors={["#1E2738", "#121724", "#090D15"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {/* ViOne Sculpted Watermark Emblem chìm */}
                <View style={styles.watermarkWrap}>
                  <VIconMark size={145} />
                </View>

                {/* Top Badge & Member Code */}
                <View style={styles.cardTopRow}>
                  <View style={styles.membershipPill}>
                    <Sparkles size={11} color="#D8B282" />
                    <Text style={styles.membershipPillText}>VIONE TITANIUM VIP</Text>
                  </View>
                  <Text style={styles.codeText}>MÃ: {memberCode}</Text>
                </View>

                {/* Avatar & Main Identity */}
                <View style={styles.identityRow}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.cardAvatar} />
                  ) : (
                    <LinearGradient
                      colors={["#C29B69", "#8C653B"]}
                      style={styles.cardAvatarCircle}
                    >
                      <Text style={styles.avatarInitialText}>{getInitial(displayName)}</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.identityDetails}>
                    <Text style={styles.cardDisplayName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.cardJobTitle} numberOfLines={1}>
                      {jobTitle}
                    </Text>
                    <View style={styles.companyRow}>
                      <Building2 size={12} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.cardCompany} numberOfLines={1}>
                        {companyName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Golden Laser Divider */}
                <View style={styles.cardDivider} />

                {/* Meta details: Phone, Email, Website */}
                <View style={styles.metaInfoGrid}>
                  <View style={styles.metaRowItem}>
                    <Phone size={13} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.metaValueText}>{phone}</Text>
                  </View>
                  <View style={styles.metaRowItem}>
                    <Mail size={13} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.metaValueText} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                  <View style={styles.metaRowItem}>
                    <Globe size={13} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.metaValueText}>{website}</Text>
                  </View>
                </View>

                {/* Verification Footer */}
                <View style={styles.cardFooterVerified}>
                  <ShieldCheck size={13} color="#38BDF8" style={{ marginRight: 5 }} />
                  <Text style={styles.verifiedText}>Đã xác thực danh tính Hội đồng Doanh nhân ViOne</Text>
                </View>
              </LinearGradient>
            </View>

            {/* HÀNH ĐỘNG NHANH 4 NÚT TIỆN ÍCH */}
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? "#D8B282" : "#996515" },
              ]}
            >
              THAO TÁC DANH THIẾP SỐ
            </Text>

            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  onClose();
                  onOpenMyQr?.();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconPill, { backgroundColor: "rgba(216, 178, 130, 0.15)" }]}>
                  <QrCode size={20} color="#D8B282" />
                </View>
                <Text style={[styles.actionCardTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Mã QR của tôi
                </Text>
                <Text style={styles.actionCardSub}>Quét kết nối 1-chạm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  onClose();
                  onOpenNfc?.();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconPill, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                  <Nfc size={20} color="#38BDF8" />
                </View>
                <Text style={[styles.actionCardTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Chạm thẻ NFC
                </Text>
                <Text style={styles.actionCardSub}>Truyền danh thiếp</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconPill, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                  <Share2 size={20} color="#C084FC" />
                </View>
                <Text style={[styles.actionCardTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Chia sẻ hồ sơ
                </Text>
                <Text style={styles.actionCardSub}>Gửi link đối tác</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  onClose();
                  onOpenProfile?.();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconPill, { backgroundColor: "rgba(34, 197, 94, 0.15)" }]}>
                  <User size={20} color="#4ADE80" />
                </View>
                <Text style={[styles.actionCardTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Hồ sơ đầy đủ
                </Text>
                <Text style={styles.actionCardSub}>Xem & chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

            {/* QUYỀN LỢI ĐẶC QUYỀN HỘI VIÊN VIONE */}
            <View
              style={[
                styles.privilegesBox,
                {
                  backgroundColor: isDark ? "#121724" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.privilegeItem}>
                <Crown size={15} color="#D8B282" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privilegeTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Mạng lưới 5.000+ Lãnh đạo Doanh nghiệp
                  </Text>
                  <Text style={styles.privilegeDesc}>
                    Kết nối 1-1, trao đổi cơ hội kinh doanh và tìm kiếm đối tác chiến lược.
                  </Text>
                </View>
              </View>

              <View style={styles.privilegeItem}>
                <Sparkles size={15} color="#D8B282" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privilegeTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    AI Copilot Gợi Ý Đối Tác Tự Động
                  </Text>
                  <Text style={styles.privilegeDesc}>
                    Thuật toán phân tích ngành nghề và ghép cặp cơ hội B2B theo thời gian thực.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
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
  backdropDismissArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 20,
  },
  dragZone: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dragHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  vipTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  vipTagText: {
    color: "#D8B282",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sheetMainTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardOuterFrame: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(216, 178, 130, 0.45)",
    marginBottom: 18,
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cardGradient: {
    padding: 18,
    position: "relative",
  },
  watermarkWrap: {
    position: "absolute",
    right: -25,
    bottom: -30,
    opacity: 0.14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  membershipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
  },
  membershipPillText: {
    color: "#F6E1C3",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  codeText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#D8B282",
    marginRight: 14,
  },
  cardAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D8B282",
    marginRight: 14,
  },
  avatarInitialText: {
    color: "#050C15",
    fontSize: 22,
    fontWeight: "900",
  },
  identityDetails: {
    flex: 1,
  },
  cardDisplayName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  cardJobTitle: {
    color: "#D8B282",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 2,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  cardCompany: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11.5,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.22)",
    marginBottom: 12,
  },
  metaInfoGrid: {
    gap: 7,
    marginBottom: 12,
  },
  metaRowItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaValueText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
  },
  cardFooterVerified: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  verifiedText: {
    color: "#38BDF8",
    fontSize: 10.5,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
    padding: 12,
  },
  actionIconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionCardSub: {
    color: "#94A3B8",
    fontSize: 10.5,
    marginTop: 2,
  },
  privilegesBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  privilegeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  privilegeTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  privilegeDesc: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 15,
  },
});
