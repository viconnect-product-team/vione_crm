import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X, Flashlight, Camera } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { GoldButton } from "../../components/common/GoldButton";

interface ScanQrModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned?: (data: string) => void;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({
  visible,
  onClose,
  onScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (onScanned) {
      onScanned(data);
    } else {
      Alert.alert(
        "Đã nhận diện mã QR",
        `Dữ liệu: ${data}\n\nBạn có muốn gửi yêu cầu kết nối đối tác không?`,
        [
          {
            text: "Quét lại",
            onPress: () => setScanned(false),
            style: "cancel",
          },
          {
            text: "Kết nối ngay",
            onPress: () => {
              Alert.alert("Thành công", "Đã gửi lời mời kết nối đối tác!");
              setScanned(false);
              onClose();
            },
          },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Permission Request View */}
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <Camera size={56} color={Colors.gold} />
            <Text style={styles.permTitle}>Quyền truy cập Camera</Text>
            <Text style={styles.permDesc}>
              ViOne cần quyền sử dụng camera để quét mã QR và quét danh thiếp giấy trao đổi đối tác kinh doanh.
            </Text>
            <GoldButton
              title="Cho phép Camera"
              onPress={requestPermission}
              style={{ marginTop: 24, width: "100%" }}
            />
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={torch}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            {/* Top Bar Controls */}
            <View style={styles.overlayTop}>
              <TouchableOpacity onPress={onClose} style={styles.circleBtn}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Quét Mã QR Đối Tác</Text>
              <TouchableOpacity
                onPress={() => setTorch((v) => !v)}
                style={[styles.circleBtn, torch && styles.circleBtnActive]}
              >
                <Flashlight size={20} color={torch ? Colors.gold : "#FFFFFF"} />
              </TouchableOpacity>
            </View>

            {/* Center Viewfinder */}
            <View style={styles.viewfinderCenter}>
              <View style={styles.targetFrame}>
                {/* 4 Golden Corners */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.hintText}>
                Đặt mã QR của đối tác hoặc danh thiếp vào trong khung
              </Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.overlayBottom}>
              <TouchableOpacity
                style={styles.simulateScanBtn}
                onPress={() =>
                  handleBarcodeScanned({
                    data: "https://vione.vn/c/VIONE-TEST-PARTNER",
                  })
                }
              >
                <Text style={styles.simulateText}>Thử nghiệm quét nhanh</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  permTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },
  permDesc: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 16,
    padding: 12,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  overlayTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  viewfinderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  targetFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: Colors.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  hintText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 24,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  overlayBottom: {
    paddingBottom: 48,
    alignItems: "center",
  },
  simulateScanBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  simulateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
});
