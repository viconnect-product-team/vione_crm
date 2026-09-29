import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { QrCode, ScanLine, Radio, Camera, X, Sparkles } from "lucide-react-native";
import { Colors } from "../theme/colors";

interface VActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpenMyQr: () => void;
  onOpenScanQr: () => void;
  onPostMoment?: () => void;
}

export const VActionSheet: React.FC<VActionSheetProps> = ({
  visible,
  onClose,
  onOpenMyQr,
  onOpenScanQr,
  onPostMoment,
}) => {
  const handleNfcTap = () => {
    onClose();
    Alert.alert(
      "Sẵn sàng chạm thẻ NFC",
      "Hãy đưa mặt sau điện thoại chạm vào thẻ danh thiếp thông minh Titanium của đối tác để trao đổi danh thiếp 1-chạm.",
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  const actions = [
    {
      id: "my-qr",
      title: "Mã QR của tôi",
      subtitle: "Hiển thị danh thiếp số để đối tác quét",
      icon: QrCode,
      color: Colors.gold,
      onPress: () => {
        onClose();
        onOpenMyQr();
      },
    },
    {
      id: "scan-qr",
      title: "Quét mã QR / Chụp danh thiếp",
      subtitle: "Mở camera lưu thông tin đối tác trong 1 giây",
      icon: ScanLine,
      color: Colors.info,
      onPress: () => {
        onClose();
        onOpenScanQr();
      },
    },
    {
      id: "nfc-tap",
      title: "Chạm thẻ NFC 1-chạm",
      subtitle: "Đọc danh thiếp thông minh Titanium",
      icon: Radio,
      color: Colors.success,
      onPress: handleNfcTap,
    },
    {
      id: "post-moment",
      title: "Tạo khoảnh khắc B2B",
      subtitle: "Lưu lại ghi chú & hình ảnh cuộc gặp gỡ",
      icon: Sparkles,
      color: "#C084FC",
      onPress: () => {
        onClose();
        if (onPostMoment) {
          onPostMoment();
        } else {
          Alert.alert("Tạo khoảnh khắc", "Tính năng lưu ghi chú và ảnh gặp gỡ đối tác.");
        }
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.vBadge}>
                    <Text style={styles.vBadgeText}>V</Text>
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>ViOne Quick Connect</Text>
                    <Text style={styles.headerSubtitle}>Kết nối kinh doanh trong tầm tay</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Actions List */}
              <View style={styles.actionsList}>
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <TouchableOpacity
                      key={act.id}
                      style={styles.actionItem}
                      onPress={act.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: `${act.color}15`, borderColor: act.color }]}>
                        <Icon size={22} color={act.color} />
                      </View>
                      <View style={styles.actionTexts}>
                        <Text style={styles.actionTitle}>{act.title}</Text>
                        <Text style={styles.actionSubtitle}>{act.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  vBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  vBadgeText: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: "900",
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorderLight,
    marginVertical: 16,
  },
  actionsList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  actionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
