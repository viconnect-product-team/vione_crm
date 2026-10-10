import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  User,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Sparkles,
  Check,
  ShieldCheck,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { resolveMediaUrl } from "../../utils/media";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface QrRequesterProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  connectionId?: string;
}

interface IncomingQrConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  requester: QrRequesterProfile | null;
  onAccept: (requester: QrRequesterProfile) => Promise<void> | void;
  onDecline: (requester: QrRequesterProfile) => Promise<void> | void;
}

export const IncomingQrConnectionModal: React.FC<IncomingQrConnectionModalProps> = ({
  visible,
  onClose,
  requester,
  onAccept,
  onDecline,
}) => {
  const { isDark } = useTheme();
  const [busy, setBusy] = useState(false);

  if (!requester || !visible) return null;

  const handleAccept = async () => {
    setBusy(true);
    try {
      await onAccept(requester);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await onDecline(requester);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.35)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleCircle}>
                <Sparkles size={16} color="#DFB76C" />
              </View>
              <View>
                <Text style={styles.bannerTag}>YÊU CẦU KẾT NỐI MỚI</Text>
                <Text style={styles.bannerTitle}>HỆ SINH THÁI DOANH NHÂN VIONE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Avatar */}
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: isDark ? "#161B29" : "#F8FAFC",
                  borderColor: "#DFB76C",
                },
              ]}
            >
              {requester.avatarUrl ? (
                <Image
                  source={{ uri: resolveMediaUrl(requester.avatarUrl) || requester.avatarUrl }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <User size={40} color={isDark ? "#DFB76C" : "#8C653B"} />
              )}
            </View>

            <Text
              style={[
                styles.requesterName,
                { color: isDark ? "#FFFFFF" : "#0F172A" },
              ]}
            >
              {requester.name}
            </Text>

            {requester.title ? (
              <Text style={styles.requesterTitle}>{requester.title}</Text>
            ) : null}

            {requester.company ? (
              <Text
                style={[
                  styles.requesterCompany,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                {requester.company}
              </Text>
            ) : null}

            {/* Info Badges */}
            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: isDark ? "#121824" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                },
              ]}
            >
              {requester.phone ? (
                <View style={styles.detailRow}>
                  <Phone size={13} color={isDark ? "#DFB76C" : "#8C653B"} style={{ marginRight: 8 }} />
                  <Text style={[styles.detailText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                    {requester.phone}
                  </Text>
                </View>
              ) : null}

              {requester.email ? (
                <View style={styles.detailRow}>
                  <Mail size={13} color={isDark ? "#DFB76C" : "#8C653B"} style={{ marginRight: 8 }} />
                  <Text style={[styles.detailText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                    {requester.email}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <ShieldCheck size={13} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={[styles.detailText, { color: "#10B981", fontWeight: "600" }]}>
                  Đã xác thực danh tính số qua QR ViOne
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.promptText,
                { color: isDark ? "#94A3B8" : "#64748B" },
              ]}
            >
              Đối tác vừa quét mã QR của bạn và muốn kết nối danh thiếp kinh doanh trực tiếp.
            </Text>
          </View>

          {/* Action Buttons: [Từ chối] & [Đồng ý kết nối] */}
          <View
            style={[
              styles.actionsRow,
              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.declineBtn,
                {
                  backgroundColor: isDark ? "#181D2A" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1",
                },
              ]}
              onPress={handleDecline}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.declineBtnText,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Từ chối
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptBtn, busy && { opacity: 0.7 }]}
              onPress={handleAccept}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#050C15" />
              ) : (
                <>
                  <Check size={16} color="#050C15" style={{ marginRight: 6 }} />
                  <Text style={styles.acceptBtnText}>Đồng ý kết nối</Text>
                </>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerBanner: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(223, 183, 108, 0.2)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTag: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#DFB76C",
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  requesterName: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  requesterTitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#DFB76C",
    textAlign: "center",
    marginBottom: 2,
  },
  requesterCompany: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  detailsBox: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
  },
  promptText: {
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFB76C",
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: "#DFB76C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#050C15",
  },
});
