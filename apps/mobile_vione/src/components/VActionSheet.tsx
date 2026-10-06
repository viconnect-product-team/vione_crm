import React from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  QrCode,
  ScanLine,
  Nfc,
  IdCard,
  NotebookPen,
  X,
  MapPin,
  Layers,
  ShieldCheck,
  ChevronRight,
  Globe,
  Contact,
  Wallet,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { VIconMark } from "./VIconMark";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpenMyQr: () => void;
  onOpenScanQr: () => void;
  onOpenCardScan?: () => void;
  onPostMoment?: () => void;
  onOpenAttendance?: () => void;
  onOpenWorkflow?: () => void;
  onOpenApprovals?: () => void;
}

export const VActionSheet: React.FC<VActionSheetProps> = ({
  visible,
  onClose,
  onOpenMyQr,
  onOpenScanQr,
  onOpenCardScan,
  onPostMoment,
  onOpenAttendance,
  onOpenWorkflow,
  onOpenApprovals,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const jobTitle = user?.title || "Chủ tịch HĐQT & Tổng Giám Đốc";
  const companyName = user?.company || "Tập đoàn Đầu tư & Công nghệ ViOne";
  const location = "Hà Nội, Việt Nam";
  const website = user?.website || "https://vione.vn";

  const getInitial = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "V";
    return parts[parts.length - 1][0].toUpperCase();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "rgba(216, 178, 130, 0.45)",
                },
              ]}
            >
              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <Text style={[styles.sheetHeaderLabel, { color: isDark ? "#D8B282" : "#A3703C" }]}>
                  DANH TÍNH DOANH NGHIỆP
                </Text>
                <Text style={[styles.sheetHeaderSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  Chạm hoặc quét để trao đổi danh thiếp với đối tác trong 1 giây
                </Text>

                {/* Identity Card with Gold V Watermark */}
                <View style={styles.identityCardWrapper}>
                  <LinearGradient
                    colors={isDark ? ["#151D2C", "#0E1522", "#070B12"] : ["#FFFFFF", "#FAF8F5", "#F5F0E8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.identityCardGradient}
                  >
                    {/* ViOne Sculpted Watermark Emblem */}
                    <View style={styles.watermarkWrap}>
                      <VIconMark size={140} />
                    </View>

                    <View style={styles.identityCardBody}>
                      <View style={styles.identityTopRow}>
                        {/* Avatar */}
                        {user?.avatarUrl ? (
                          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                        ) : (
                          <LinearGradient
                            colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                            style={styles.avatarCircle}
                          >
                            <Text style={styles.avatarInitial}>{getInitial(displayName)}</Text>
                          </LinearGradient>
                        )}

                        <View style={styles.identityInfo}>
                          <Text style={[styles.userName, { color: isDark ? "#FFFFFF" : "#0F172A" }]} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={[styles.userTitle, { color: isDark ? "#D8B282" : "#A3703C" }]} numberOfLines={1}>
                            {jobTitle}
                          </Text>
                          <Text style={[styles.userCompany, { color: isDark ? "rgba(255, 255, 255, 0.8)" : "#475569" }]} numberOfLines={1}>
                            {companyName}
                          </Text>
                          <View style={styles.memberBadge}>
                            <ShieldCheck size={11} color="#D8B282" style={{ marginRight: 4 }} />
                            <Text style={styles.memberBadgeText}>DOANH NHÂN VIONE XÁC THỰC</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Meta Location & Web */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <MapPin size={12} color="#D8B282" style={{ marginRight: 4 }} />
                          <Text style={[styles.metaText, { color: isDark ? "rgba(255, 255, 255, 0.8)" : "#64748B" }]} numberOfLines={1}>
                            {location}
                          </Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                          <Globe size={12} color="#D8B282" style={{ marginRight: 4 }} />
                          <Text style={[styles.metaText, { color: isDark ? "rgba(255, 255, 255, 0.8)" : "#64748B" }]} numberOfLines={1}>
                            {website}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Core 5 Capabilities */}
                <View style={styles.actionsContainer}>
                  {/* Action 1: Đưa mã QR - ELEGANT CHAMPAGNE GOLD */}
                  <TouchableOpacity
                    style={[
                      styles.heroGoldBtn,
                      {
                        backgroundColor: isDark ? "rgba(216, 178, 130, 0.16)" : "#FDFBF7",
                        borderColor: "#D8B282",
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      onOpenMyQr();
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.heroGoldGradient}>
                      <View style={[styles.heroIconBox, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.22)" : "rgba(216, 178, 130, 0.25)" }]}>
                        <QrCode size={22} color={isDark ? "#D8B282" : "#8A5C1E"} />
                      </View>
                      <View style={styles.heroTexts}>
                        <Text style={[styles.heroTitle, { color: isDark ? "#FFFFFF" : "#8A5C1E" }]}>Đưa mã QR của bạn</Text>
                        <Text style={[styles.heroSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                          Mở danh thiếp cá nhân để đối tác quét kết nối
                        </Text>
                      </View>
                      <ChevronRight size={18} color={isDark ? "#D8B282" : "#8A5C1E"} />
                    </View>
                  </TouchableOpacity>

                  {/* Action 2: Chạm thẻ NFC */}
                  <TouchableOpacity
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      onOpenMyQr();
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.actionIconBox}>
                      <Nfc size={22} color="#D8B282" />
                    </View>
                    <View style={styles.actionTexts}>
                      <Text style={[styles.actionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Chạm thẻ NFC</Text>
                      <Text style={[styles.actionSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                        Chạm mặt sau điện thoại vào thẻ thông minh
                      </Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? "#94A3B8" : "#94A3B8"} />
                  </TouchableOpacity>

                  {/* Action 3: Quét mã QR */}
                  <TouchableOpacity
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      onOpenScanQr();
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.actionIconBox}>
                      <ScanLine size={22} color="#D8B282" />
                    </View>
                    <View style={styles.actionTexts}>
                      <Text style={[styles.actionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Quét mã QR</Text>
                      <Text style={[styles.actionSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                        Mở máy ảnh quét mã kết nối của đối tác
                      </Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? "#94A3B8" : "#94A3B8"} />
                  </TouchableOpacity>

                  {/* Action 4: Quét danh thiếp */}
                  <TouchableOpacity
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      if (onOpenCardScan) {
                        onOpenCardScan();
                      } else {
                        onOpenScanQr();
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.actionIconBox}>
                      <IdCard size={22} color="#D8B282" />
                    </View>
                    <View style={styles.actionTexts}>
                      <Text style={[styles.actionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Quét danh thiếp</Text>
                      <Text style={[styles.actionSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                        Chụp danh thiếp giấy để AI nhận diện
                      </Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? "#94A3B8" : "#94A3B8"} />
                  </TouchableOpacity>

                  {/* Action 5: Ghi chú cuộc gặp */}
                  <TouchableOpacity
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      if (onPostMoment) onPostMoment();
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.actionIconBox}>
                      <NotebookPen size={22} color="#D8B282" />
                    </View>
                    <View style={styles.actionTexts}>
                      <Text style={[styles.actionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Ghi chú cuộc gặp</Text>
                      <Text style={[styles.actionSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                        Lưu ảnh & thỏa thuận hợp tác sau buổi gặp
                      </Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? "#94A3B8" : "#94A3B8"} />
                  </TouchableOpacity>
                </View>

                {/* Section Quick Tiles (3 cols) */}
                <View
                  style={[
                    styles.quickTilesRow,
                    {
                      borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.quickTile}
                    onPress={() => {
                      onClose();
                      onOpenMyQr();
                    }}
                  >
                    <View
                      style={[
                        styles.quickTileCircle,
                        {
                          backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#E2E8F0",
                        },
                      ]}
                    >
                      <Contact size={18} color="#D8B282" />
                    </View>
                    <Text style={[styles.quickTileTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Danh thiếp số</Text>
                    <Text style={[styles.quickTileDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>Xem thẻ của tôi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickTile}
                    onPress={() => {
                      onClose();
                      onOpenMyQr();
                    }}
                  >
                    <View
                      style={[
                        styles.quickTileCircle,
                        {
                          backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#E2E8F0",
                        },
                      ]}
                    >
                      <Wallet size={18} color="#D8B282" />
                    </View>
                    <Text style={[styles.quickTileTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Ví thẻ</Text>
                    <Text style={[styles.quickTileDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>Danh bạ thẻ lưu</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickTile}
                    onPress={() => {
                      onClose();
                    }}
                  >
                    <View
                      style={[
                        styles.quickTileCircle,
                        {
                          backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.4)" : "#E2E8F0",
                        },
                      ]}
                    >
                      <ShieldCheck size={18} color="#D8B282" />
                    </View>
                    <Text style={[styles.quickTileTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Bảo mật</Text>
                    <Text style={[styles.quickTileDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>Quyền riêng tư</Text>
                  </TouchableOpacity>
                </View>

                {/* Group 2: VẬN HÀNH & GIÁM SÁT DOANH NGHIỆP */}
                <View style={styles.opsGroup}>
                  <Text style={[styles.opsGroupTitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    VẬN HÀNH & GIÁM SÁT DOANH NGHIỆP
                  </Text>
                  <View style={styles.opsRow}>
                    <TouchableOpacity
                      style={[
                        styles.opsColItem,
                        {
                          backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        if (onOpenAttendance) onOpenAttendance();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.opsIconWrap, { backgroundColor: "rgba(216, 178, 130, 0.18)" }]}>
                        <MapPin size={18} color="#D8B282" />
                      </View>
                      <Text style={[styles.opsColTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Chấm công</Text>
                      <Text style={[styles.opsColSub, { color: isDark ? "#94A3B8" : "#64748B" }]}>GPS & FaceID</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.opsColItem,
                        {
                          backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        if (onOpenWorkflow) onOpenWorkflow();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.opsIconWrap, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                        <Layers size={18} color="#38BDF8" />
                      </View>
                      <Text style={[styles.opsColTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Quy trình</Text>
                      <Text style={[styles.opsColSub, { color: isDark ? "#94A3B8" : "#64748B" }]}>BPMN Kanban</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.opsColItem,
                        {
                          backgroundColor: isDark ? "#0E1522" : "#F8FAFC",
                          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        if (onOpenApprovals) onOpenApprovals();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.opsIconWrap, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                        <ShieldCheck size={18} color="#C084FC" />
                      </View>
                      <Text style={[styles.opsColTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>Phê duyệt</Text>
                      <Text style={[styles.opsColSub, { color: isDark ? "#94A3B8" : "#64748B" }]}>3 cấp chuẩn</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Circular Close Button at bottom */}
                <View style={styles.closeRow}>
                  <TouchableOpacity
                    style={[
                      styles.circularCloseBtn,
                      {
                        backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.5)" : "#E2E8F0",
                      },
                    ]}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <X size={20} color={isDark ? "#D8B282" : "#475569"} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0B0F17",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetHeaderLabel: {
    textAlign: "center",
    color: "#D8B282",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  sheetHeaderSubtitle: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  identityCardWrapper: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    marginBottom: 16,
  },
  identityCardGradient: {
    padding: 16,
    position: "relative",
  },
  watermarkWrap: {
    position: "absolute",
    right: -20,
    bottom: -25,
    opacity: 0.16,
  },
  identityCardBody: {
    position: "relative",
    zIndex: 2,
  },
  identityTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "#D8B282",
    marginRight: 14,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D8B282",
    marginRight: 14,
  },
  avatarInitial: {
    color: "#050C15",
    fontSize: 24,
    fontWeight: "900",
  },
  identityInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  userTitle: {
    color: "#D8B282",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  userCompany: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  memberBadgeText: {
    color: "#D8B282",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  metaText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11.5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D8B282",
    marginHorizontal: 8,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  heroGoldBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroGoldGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heroIconBox: {
    marginRight: 14,
  },
  heroTexts: {
    flex: 1,
  },
  heroTitle: {
    color: "#050C15",
    fontSize: 16,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(5, 12, 21, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionIconBox: {
    marginRight: 14,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  quickTilesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  quickTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  quickTileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
    backgroundColor: "#181D2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickTileTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  quickTileDesc: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 1,
  },
  opsGroup: {
    marginBottom: 16,
  },
  opsGroupTitle: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  opsRow: {
    flexDirection: "row",
    gap: 8,
  },
  opsColItem: {
    flex: 1,
    backgroundColor: "#0E1522",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    alignItems: "center",
  },
  opsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  opsColTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  opsColSub: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
  closeRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  circularCloseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(216, 178, 130, 0.5)",
    backgroundColor: "#181D2A",
    alignItems: "center",
    justifyContent: "center",
  },
});
