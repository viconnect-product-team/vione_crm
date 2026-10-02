import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  X,
  CreditCard,
  QrCode,
} from "lucide-react-native";
import { Colors } from "../theme/colors";

interface ApprovalsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ApprovalsModal: React.FC<ApprovalsModalProps> = ({ visible, onClose }) => {
  const [payments, setPayments] = useState([
    {
      id: "pay-1",
      code: "CHI-104",
      title: "Thanh toán hạ tầng Cloud Multi-Tenancy AWS & Cloudflare",
      amountVnd: 28500000,
      department: "Ban Công Nghệ",
      maker: "Đặng Nam",
      checkerApproved: true,
      ceoStatus: "pending",
      tier: "approver", // Cần CEO duyệt BR-FIN-02
    },
    {
      id: "pay-2",
      code: "CHI-105",
      title: "Sản xuất gia công 100 phôi Thẻ Titanium NFC mạ vàng",
      amountVnd: 18000000,
      department: "Vận Hành",
      maker: "Đặng Nam",
      checkerApproved: false,
      ceoStatus: "pending",
      tier: "checker", // Cần Kế toán trưởng duyệt
    },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: "req-1",
      name: "Đặng Nam",
      type: "Làm thêm giờ OT (3 tiếng)",
      date: "02/10/2026 (18:00 - 21:00)",
      reason: "Nạp chip Titanium NFC cho sự kiện C-Level",
      status: "pending",
    },
  ]);

  const handleCeoApprove = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ceoStatus: "approved" } : p))
    );
    Alert.alert("Đã Phê Duyệt!", "Bạn đã ký điện tử duyệt chi thành công khoản tiền > 20 triệu VNĐ theo chuẩn BR-FIN-01.");
  };

  const handleLeaveApprove = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    Alert.alert("Đã Duyệt Đơn!", "Đơn đăng ký OT đã được phê duyệt và ghi nhận vào bảng tính lương BR-HRM-06.");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBadge}>
                    <ShieldCheck size={20} color="#3C240E" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={styles.title}>Trung Tâm Phê Duyệt C-Level</Text>
                    <Text style={styles.subtitle}>Nguyên tắc 3 cấp (Maker - Checker - Approver)</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                {/* 1. KHOẢN CHI CHỜ DUYỆT */}
                <Text style={styles.sectionHeader}>Khoản Chi Tiền (BR-FIN-01 / BR-FIN-02)</Text>
                {payments.map((p) => (
                  <View key={p.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.codeText}>{p.code}</Text>
                      <View style={styles.badgeWrap}>
                        <Text style={styles.badgeText}>
                          {p.amountVnd > 20000000 ? "HẠN MỨC CEO DUYỆT" : "HẠN MỨC KẾ TOÁN TRƯỞNG"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{p.title}</Text>
                    <Text style={styles.amountText}>{p.amountVnd.toLocaleString("vi-VN")} VNĐ</Text>
                    <Text style={styles.deptText}>{p.department} • Maker: {p.maker}</Text>

                    {/* Stepper Status */}
                    <View style={styles.stepperRow}>
                      <Text style={styles.stepDone}>Maker: Đã đề xuất ✓</Text>
                      <Text style={styles.stepArrow}>&rarr;</Text>
                      <Text style={p.checkerApproved ? styles.stepDone : styles.stepPending}>
                        Checker: {p.checkerApproved ? "Đã duyệt ✓" : "Chờ Kế Toán"}
                      </Text>
                      <Text style={styles.stepArrow}>&rarr;</Text>
                      <Text style={p.ceoStatus === "approved" ? styles.stepDone : styles.stepUrgent}>
                        Approver: {p.ceoStatus === "approved" ? "Đã duyệt ✓" : "Chờ CEO"}
                      </Text>
                    </View>

                    {p.ceoStatus === "pending" && p.checkerApproved && (
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleCeoApprove(p.id)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={["#F8E7D1", "#D8B282", "#A67A47"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.btnGradient}
                        >
                          <Text style={styles.btnText}>Ký Điện Tử Phê Duyệt (CEO)</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* 2. ĐƠN TỪ NHÂN SỰ CHỜ DUYỆT */}
                <Text style={[styles.sectionHeader, { marginTop: 12 }]}>Đơn Từ Nhân Sự (BR-HRM-04 / 06)</Text>
                {leaveRequests.map((r) => (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{r.name}</Text>
                      <View style={styles.leaveBadge}>
                        <Text style={styles.leaveBadgeText}>{r.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.deptText}>Thời gian: {r.date}</Text>
                    <Text style={styles.reasonText}>Lý do: {r.reason}</Text>

                    {r.status === "pending" ? (
                      <TouchableOpacity
                        style={styles.leaveApproveBtn}
                        onPress={() => handleLeaveApprove(r.id)}
                      >
                        <Text style={styles.leaveApproveText}>Duyệt Đơn 1-Chạm</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.approvedNotice}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.approvedNoticeText}>Đã Phê Duyệt</Text>
                      </View>
                    )}
                  </View>
                ))}
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#12151F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
    fontFamily: "monospace",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 14,
  },
  scrollBody: {
    gap: 10,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D4C3A3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#181D2A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  codeText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "800",
    color: "#D8B282",
  },
  badgeWrap: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F59E0B",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#D8B282",
    fontFamily: "monospace",
    marginVertical: 4,
  },
  deptText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  reasonText: {
    fontSize: 11,
    color: "#F5F7FA",
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    flexWrap: "wrap",
  },
  stepDone: {
    fontSize: 10,
    fontWeight: "700",
    color: "#166534",
  },
  stepPending: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  stepUrgent: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  stepArrow: {
    fontSize: 10,
    color: "#94A3B8",
  },
  approveBtn: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C240E",
  },
  leaveBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaveBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1E40AF",
  },
  leaveApproveBtn: {
    marginTop: 8,
    backgroundColor: "#10B981",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  leaveApproveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  approvedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  approvedNoticeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
});
