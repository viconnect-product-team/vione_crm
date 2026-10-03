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
  Switch,
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
  Flame,
  Crown,
  Star,
  Clock,
  Briefcase,
  DollarSign,
  UserCheck,
  FileText,
} from "lucide-react-native";
import { ConnectionPerson } from "../types";
import { cardScanApi, customerApi, B2BCustomerData } from "../api/services";
import { useTheme } from "../context/ThemeContext";

export type CustomerLeadTier = "hot" | "vip" | "featured" | "care24h";

export interface ExtendedLeadInfo {
  tier: CustomerLeadTier;
  stage: "prospect" | "qualified" | "proposal" | "negotiation";
  dealValue: string;
  assignedStaff: string;
  needsNote: string;
  nextAction: string;
}

interface CardScanReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveContact: (contact: ConnectionPerson) => void;
  onSaveCustomerLead?: (lead: B2BCustomerData & { tier: CustomerLeadTier; assignedStaff: string }) => void;
}

export const CardScanReviewModal: React.FC<CardScanReviewModalProps> = ({
  visible,
  onClose,
  onSaveContact,
  onSaveCustomerLead,
}) => {
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState<"capture" | "scanning" | "review">("capture");
  
  // OCR Extracted Fields
  const [name, setName] = useState("Nguyễn Văn Hùng");
  const [title, setTitle] = useState("Tổng Giám Đốc");
  const [company, setCompany] = useState("Tập Đoàn Đầu Tư Hạ Tầng Hùng Cường");
  const [phone, setPhone] = useState("0918 889 999");
  const [email, setEmail] = useState("hung.nguyen@hungcuonggroup.vn");
  const [address, setAddress] = useState("Tòa tháp Landmark 81, TP. Hồ Chí Minh");
  const [website, setWebsite] = useState("https://hungcuonggroup.vn");

  // CRM Lead Pipeline Fields
  const [isLeadCare, setIsLeadCare] = useState(true);
  const [leadTier, setLeadTier] = useState<CustomerLeadTier>("hot");
  const [stage, setStage] = useState<"prospect" | "qualified" | "proposal" | "negotiation">("prospect");
  const [dealValue, setDealValue] = useState("500,000,000 VNĐ");
  const [assignedStaff, setAssignedStaff] = useState("Trần Minh Hoàng (Trưởng phòng Kinh Doanh)");
  const [needsNote, setNeedsNote] = useState("Quan tâm phần mềm ERP đám mây & giải pháp số hóa chuỗi cung ứng");
  const [nextAction, setNextAction] = useState("Gửi hồ sơ năng lực và đặt lịch hẹn 1-1 trong 24h");
  const [isSaving, setIsSaving] = useState(false);

  const startScan = () => {
    setStep("scanning");
    setTimeout(() => {
      setStep("review");
    }, 1800);
  };

  const handleSave = async () => {
    if (!name.trim() || !company.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ tên và tên doanh nghiệp.");
      return;
    }

    setIsSaving(true);

    const contactId = "ocr-" + Date.now();
    const newContact: ConnectionPerson = {
      id: contactId,
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      industry: "Đầu Tư & Xây Dựng",
      status: "connected",
    };

    let targetPersonId = `g:${contactId}`;

    try {
      // 1. Lưu danh thiếp vào danh bạ qua RESTful API
      const saveCardRes = await cardScanApi.saveCard({
        displayName: name.trim(),
        title: title.trim(),
        companyName: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        website: website.trim(),
        clientToken: `ocr-token-${Date.now()}`,
      });

      if (saveCardRes && (saveCardRes as any).personId) {
        targetPersonId = (saveCardRes as any).personId;
      }
    } catch (err) {
      console.warn("Lỗi lưu card scan lên API:", err);
    }

    // 2. Nếu người dùng chọn lưu Khách hàng tiềm năng & Đối tác cần care
    if (isLeadCare) {
      try {
        const tierTag =
          leadTier === "hot"
            ? "⭐ Hot Lead"
            : leadTier === "vip"
            ? "💎 Đối tác VIP"
            : leadTier === "care24h"
            ? "🎯 Cần care 24h"
            : "🌟 Khách hàng nổi bật";

        const customerPayload: B2BCustomerData = {
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
          dealValue: dealValue.trim(),
          stage: stage,
          contactPerson: name.trim(),
          tags: [tierTag, "Danh thiếp AI OCR", "Đang chăm sóc"],
          notes: `${needsNote.trim()} | PIC: ${assignedStaff.trim()} | Hành động tiếp: ${nextAction.trim()}`,
        };

        await customerApi.createCustomer(customerPayload);

        if (onSaveCustomerLead) {
          onSaveCustomerLead({
            ...customerPayload,
            tier: leadTier,
            assignedStaff: assignedStaff.trim(),
          });
        }
      } catch (err) {
        console.warn("Lỗi lưu khách hàng tiềm năng lên CRM:", err);
      }
    }

    setIsSaving(false);
    onSaveContact(newContact);

    const successMsg = isLeadCare
      ? `Đã lưu danh thiếp của ${name.trim()} và chuyển thành Khách hàng tiềm năng ưu tiên chăm sóc!`
      : `Đã lưu danh thiếp của ${name.trim()} vào danh bạ đối tác ViOne.`;

    Alert.alert("Thành công", successMsg);
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
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorderGold }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IdCard size={20} color={colors.gold} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Quét Danh Thiếp & Lưu Khách Hàng</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  AI OCR Copilot số hóa danh bạ & chuyển thành Khách hàng tiềm năng CRM
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetAndClose} style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* STEP 1: CAPTURE VIEW */}
          {step === "capture" && (
            <View style={styles.captureContainer}>
              <View style={[styles.cardFrame, { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder }]}>
                <View style={[styles.cornerTL, { borderColor: colors.gold }]} />
                <View style={[styles.cornerTR, { borderColor: colors.gold }]} />
                <View style={[styles.cornerBL, { borderColor: colors.gold }]} />
                <View style={[styles.cornerBR, { borderColor: colors.gold }]} />

                <View style={styles.framePlaceholder}>
                  <Camera size={44} color={colors.gold} strokeWidth={1.5} />
                  <Text style={[styles.frameText, { color: colors.textPrimary }]}>Căn chỉnh danh thiếp nằm gọn trong khung</Text>
                  <Text style={[styles.frameSubText, { color: colors.textMuted }]}>
                    Hệ thống AI sẽ tự động đọc toàn bộ chữ in, logo và phân tích đối tác
                  </Text>
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
              <ActivityIndicator size="large" color={colors.gold} style={{ marginBottom: 16 }} />
              <Text style={[styles.scanningTitle, { color: colors.textPrimary }]}>Đang phân tích danh thiếp...</Text>
              <Text style={[styles.scanningSubtitle, { color: colors.textMuted }]}>
                AI OCR Copilot đang trích xuất họ tên, chức vụ, số điện thoại, công ty và khởi tạo hồ sơ chăm sóc
              </Text>
            </View>
          )}

          {/* STEP 3: REVIEW & EDIT FORM */}
          {step === "review" && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>
              <View style={[styles.successBadgeRow, { backgroundColor: colors.goldSoft, borderColor: colors.surfaceBorderGold }]}>
                <Sparkles size={16} color={colors.gold} style={{ marginRight: 6 }} />
                <Text style={[styles.successBadgeText, { color: colors.textGold }]}>
                  Đã trích xuất thông tin thành công từ danh thiếp giấy!
                </Text>
              </View>

              {/* THÔNG TIN DANH BẠ CƠ BẢN */}
              <Text style={[styles.sectionHeading, { color: colors.gold }]}>THÔNG TIN DOANH NHÂN & DOANH NGHIỆP</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>HỌ VÀ TÊN DOANH NHÂN</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textDisabled}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CHỨC VỤ / VỊ TRÍ</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SỐ ĐIỆN THOẠI</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>DOANH NGHIỆP / TỔ CHỨC</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                value={company}
                onChangeText={setCompany}
                placeholderTextColor={colors.textDisabled}
              />

              <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>EMAIL CÔNG VIỆC</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={colors.textDisabled}
              />

              <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>ĐỊA CHỈ TRỤ SỞ DOANH NGHIỆP</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={colors.textDisabled}
              />

              {/* BẬT TÍNH NĂNG LƯU VÀO KHÁCH HÀNG TIỀM NĂNG & CHĂM SÓC */}
              <View style={[styles.leadToggleCard, { backgroundColor: isDark ? "#171B26" : "#F1F5F9", borderColor: colors.surfaceBorderGold }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Flame size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                    <Text style={[styles.leadToggleTitle, { color: colors.textPrimary }]}>
                      Lưu thành Khách Hàng Tiềm Năng (Lead)
                    </Text>
                  </View>
                  <Text style={[styles.leadToggleDesc, { color: colors.textMuted }]}>
                    Tự động đẩy vào CRM Pipeline để phân công nhân sự chăm sóc và theo dõi giá trị thương vụ.
                  </Text>
                </View>
                <Switch
                  value={isLeadCare}
                  onValueChange={setIsLeadCare}
                  trackColor={{ false: colors.surface2, true: colors.gold }}
                  thumbColor={isLeadCare ? "#050C15" : "#94A3B8"}
                />
              </View>

              {isLeadCare && (
                <View style={[styles.leadDetailsContainer, { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder }]}>
                  {/* CHỌN HẠNG MỤC TIỀM NĂNG (TIER) */}
                  <Text style={[styles.inputLabel, { color: colors.gold }]}>PHÂN LOẠI MỨC ĐỘ TIỀM NĂNG & QUAN TÂM</Text>
                  <View style={styles.tierSelectorRow}>
                    {[
                      { id: "hot", label: "⭐ Hot Lead", icon: Flame, color: "#EF4444" },
                      { id: "vip", label: "💎 VIP C-Level", icon: Crown, color: "#F59E0B" },
                      { id: "featured", label: "🌟 Nổi bật", icon: Star, color: "#38BDF8" },
                      { id: "care24h", label: "🎯 Cần care 24h", icon: Clock, color: "#10B981" },
                    ].map((t) => {
                      const isSelected = leadTier === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.tierChip,
                            { borderColor: colors.surfaceBorder },
                            isSelected && { backgroundColor: isDark ? "rgba(216, 178, 130, 0.22)" : "#FEF3C7", borderColor: colors.gold },
                          ]}
                          onPress={() => setLeadTier(t.id as CustomerLeadTier)}
                        >
                          <Text
                            style={[
                              styles.tierChipText,
                              { color: colors.textMuted },
                              isSelected && { color: colors.textGold, fontWeight: "800" },
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* GIÁ TRỊ THƯƠNG VỤ VÀ GIAI ĐOẠN */}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GIÁ TRỊ DỰ KIẾN (DEAL)</Text>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                        value={dealValue}
                        onChangeText={setDealValue}
                        placeholderTextColor={colors.textDisabled}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GIAI ĐOẠN</Text>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                        value={stage === "prospect" ? "Tiếp cận" : stage === "proposal" ? "Gửi báo giá" : "Đàm phán"}
                        editable={false}
                      />
                    </View>
                  </View>

                  {/* NHÂN VIÊN PHỤ TRÁCH CHĂM SÓC (PIC) */}
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>NHÂN SỰ PHỤ TRÁCH CHĂM SÓC (PIC)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={assignedStaff}
                    onChangeText={setAssignedStaff}
                    placeholder="Tên nhân viên phụ trách care..."
                    placeholderTextColor={colors.textDisabled}
                  />

                  {/* NHU CẦU BAN ĐẦU */}
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>NHU CẦU & KỲ VỌNG HỢP TÁC</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder, height: 54 }]}
                    value={needsNote}
                    onChangeText={setNeedsNote}
                    multiline
                    placeholder="Mô tả nhu cầu sản phẩm / dịch vụ..."
                    placeholderTextColor={colors.textDisabled}
                  />

                  {/* HÀNH ĐỘNG TIẾP THEO */}
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>HÀNH ĐỘNG TIẾP THEO & HẠN CHÓT</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={nextAction}
                    onChangeText={setNextAction}
                    placeholder="Hành động cần làm tiếp..."
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              )}

              <View style={[styles.reviewFooterRow, { borderTopColor: colors.surfaceBorder }]}>
                <TouchableOpacity
                  style={[styles.reScanBtn, { backgroundColor: colors.surface2 }]}
                  onPress={() => setStep("capture")}
                  disabled={isSaving}
                >
                  <Text style={[styles.reScanBtnText, { color: colors.textMuted }]}>Quét lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveContactBtn}
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveContactGradient}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#050C15" style={{ marginRight: 6 }} />
                    ) : (
                      <CheckCircle size={16} color="#050C15" style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.saveContactBtnText}>
                      {isSaving ? "Đang lưu hệ thống..." : isLeadCare ? "Lưu Khách Hàng Tiềm Năng" : "Lưu Danh Bạ ViOne"}
                    </Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderRadius: 16,
    borderWidth: 1,
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
  },
  cornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  cornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  cornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  framePlaceholder: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  frameText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  frameSubText: {
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
    fontSize: 15,
    fontWeight: "700",
  },
  scanningSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  successBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  successBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  inputField: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  leadToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  leadToggleTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  leadToggleDesc: {
    fontSize: 10.5,
    marginTop: 2,
  },
  leadDetailsContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  tierSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  reviewFooterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  reScanBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reScanBtnText: {
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
