import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Camera,
  ScanLine,
  CheckCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  IdCard,
} from "lucide-react-native";
import { ConnectionPerson } from "../types";

interface CardScanReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveContact: (contact: ConnectionPerson) => void;
}

export const CardScanReviewModal: React.FC<CardScanReviewModalProps> = ({
  visible,
  onClose,
  onSaveContact,
}) => {
  const [step, setStep] = useState<"capture" | "scanning" | "review">("capture");
  const [name, setName] = useState("Nguyễn Văn Hùng");
  const [title, setTitle] = useState("Tổng Giám Đốc");
  const [company, setCompany] = useState("Tập Đoàn Đầu Tư Hạ Tầng Hùng Cường");
  const [phone, setPhone] = useState("0918 889 999");
  const [email, setEmail] = useState("hung.nguyen@hungcuonggroup.vn");
  const [address, setAddress] = useState("Tòa tháp Landmark 81, TP. Hồ Chí Minh");
  const [website, setWebsite] = useState("https://hungcuonggroup.vn");

  const startScan = () => {
    setStep("scanning");
    setTimeout(() => {
      setStep("review");
    }, 1800);
  };

  const handleSave = () => {
    if (!name.trim() || !company.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ tên và tên doanh nghiệp.");
      return;
    }

    const newContact: ConnectionPerson = {
      id: "ocr-" + Date.now(),
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      industry: "Đầu Tư & Xây Dựng",
      status: "connected",
    };

    onSaveContact(newContact);
    Alert.alert("Thành công", `Đã lưu danh thiếp của ${name.trim()} vào danh bạ đối tác ViOne.`);
    setStep("capture");
    onClose();
  };

  const resetAndClose = () => {
    setStep("capture");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IdCard size={20} color="#D8B282" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.headerTitle}>Quét Danh Thiếp Giấy (AI OCR)</Text>
                <Text style={styles.headerSubtitle}>
                  Nhận diện tự động & số hóa danh tính doanh nghiệp trong 1s
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* STEP 1: CAPTURE VIEW */}
          {step === "capture" && (
            <View style={styles.captureContainer}>
              <View style={styles.cardFrame}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                <View style={styles.framePlaceholder}>
                  <Camera size={44} color="#D8B282" strokeWidth={1.5} />
                  <Text style={styles.frameText}>Căn chỉnh danh thiếp nằm gọn trong khung</Text>
                  <Text style={styles.frameSubText}>Hệ thống AI sẽ tự động đọc toàn bộ chữ in và logo</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.captureBtn} onPress={startScan} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.captureGradient}
                >
                  <ScanLine size={18} color="#050C15" style={{ marginRight: 6 }} />
                  <Text style={styles.captureBtnText}>Chụp & Quét AI OCR</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SCANNING PROGRESS */}
          {step === "scanning" && (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color="#D8B282" style={{ marginBottom: 16 }} />
              <Text style={styles.scanningTitle}>Đang phân tích danh thiếp...</Text>
              <Text style={styles.scanningSubtitle}>
                AI OCR Copilot 5.0 đang trích xuất họ tên, chức vụ, số điện thoại và công ty
              </Text>
            </View>
          )}

          {/* STEP 3: REVIEW & EDIT FORM */}
          {step === "review" && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              <View style={styles.successBadgeRow}>
                <Sparkles size={16} color="#D8B282" style={{ marginRight: 6 }} />
                <Text style={styles.successBadgeText}>Đã trích xuất thông tin thành công từ danh thiếp!</Text>
              </View>

              <Text style={styles.inputLabel}>HỌ VÀ TÊN DOANH NHÂN</Text>
              <TextInput
                style={styles.inputField}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#94A3B8"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>CHỨC VỤ / VỊ TRÍ</Text>
              <TextInput
                style={styles.inputField}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94A3B8"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>DOANH NGHIỆP / TỔ CHỨC</Text>
              <TextInput
                style={styles.inputField}
                value={company}
                onChangeText={setCompany}
                placeholderTextColor="#94A3B8"
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI</Text>
                  <TextInput
                    style={styles.inputField}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabel}>EMAIL CÔNG VIỆC</Text>
                  <TextInput
                    style={styles.inputField}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>ĐỊA CHỈ TRỤ SỞ DOANH NGHIỆP</Text>
              <TextInput
                style={styles.inputField}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#94A3B8"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>WEBSITE DOANH NGHIỆP</Text>
              <TextInput
                style={styles.inputField}
                value={website}
                onChangeText={setWebsite}
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.reviewFooterRow}>
                <TouchableOpacity style={styles.reScanBtn} onPress={() => setStep("capture")}>
                  <Text style={styles.reScanBtnText}>Quét lại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveContactBtn} onPress={handleSave} activeOpacity={0.85}>
                  <LinearGradient
                    colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveContactGradient}
                  >
                    <CheckCircle size={16} color="#050C15" style={{ marginRight: 6 }} />
                    <Text style={styles.saveContactBtnText}>Lưu Danh Bạ ViOne</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
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
    backgroundColor: "#12151F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureContainer: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cardFrame: {
    width: "100%",
    height: 190,
    backgroundColor: "#181D2A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  cornerTL: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "#D8B282",
  },
  cornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#D8B282",
  },
  cornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "#D8B282",
  },
  cornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#D8B282",
  },
  framePlaceholder: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  frameText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  frameSubText: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  captureBtn: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  captureGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  captureBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "800",
  },
  scanningContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  scanningTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  scanningSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  successBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  successBadgeText: {
    color: "#D8B282",
    fontSize: 11.5,
    fontWeight: "700",
  },
  inputLabel: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  inputField: {
    backgroundColor: "#181D2A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#FFFFFF",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  reviewFooterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  reScanBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  reScanBtnText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  saveContactBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveContactGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveContactBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "800",
  },
});
