import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { X, Share2, Copy } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/common/Avatar";
import { GoldButton } from "../../components/common/GoldButton";

interface MyQrModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MyQrModal: React.FC<MyQrModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();

  const shareUrl = user?.shareUrl || `https://vione.vn/c/${user?.code || "VIONE"}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Danh thiếp số ViOne - ${user?.displayName || "Doanh Nhân"}`,
        message: `Kết nối với tôi trên ViOne Business Connect: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.warn("Lỗi chia sẻ:", e);
    }
  };

  const handleCopy = () => {
    Alert.alert("Đã sao chép liên kết", shareUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.topRow}>
            <Text style={styles.brandTitle}>DANH THIẾP SỐ VIONE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userSection}>
            <Avatar url={user?.avatarUrl} name={user?.displayName} size={64} showGoldBorder />
            <Text style={styles.userName}>{user?.displayName || "Doanh Nhân C-Level"}</Text>
            <Text style={styles.userTitle}>{user?.title || "Tổng Giám Đốc"}</Text>
            <Text style={styles.userCompany}>{user?.company || "ViOne Business Network"}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>MÃ ĐỊNH DANH: {user?.code || "VIONE-8888"}</Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrInner}>
              <QRCode
                value={shareUrl}
                size={190}
                color="#05070E"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrHint}>Đưa mã cho đối tác quét bằng Camera hoặc Zalo</Text>
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <GoldButton
              title="Chia sẻ danh thiếp"
              icon={<Share2 size={16} color="#05070E" />}
              onPress={handleShare}
              style={{ flex: 1, marginRight: 8 }}
            />
            <GoldButton
              title="Sao chép link"
              icon={<Copy size={16} color={Colors.gold} />}
              onPress={handleCopy}
              variant="outline"
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  userSection: {
    alignItems: "center",
    marginTop: 16,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  userTitle: {
    color: Colors.goldLight,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  userCompany: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  codeBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  codeText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  qrWrapper: {
    alignItems: "center",
    marginVertical: 20,
  },
  qrInner: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  qrHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },
  btnRow: {
    flexDirection: "row",
    marginTop: 4,
  },
});
