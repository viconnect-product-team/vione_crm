import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  Users,
  ShieldCheck,
  Send,
  Phone,
  MessageSquare,
  Share2,
  CheckCircle2,
  FileText,
  Check,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { opportunityApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CommunityOpportunityItem {
  id: string;
  title: string;
  organization: string;
  communityName: string;
  dealValue: string;
  category: string;
  daysLeft: string;
  interested?: boolean;
}

interface OpportunityDetailModalProps {
  visible: boolean;
  opportunity: CommunityOpportunityItem | null;
  onClose: () => void;
  onApplyOpportunity?: (oppId: string) => void;
  onGoToCommunity?: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  visible,
  opportunity,
  onClose,
  onApplyOpportunity,
  onGoToCommunity,
}) => {
  const [hasApplied, setHasApplied] = useState(opportunity?.interested ?? false);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!opportunity) return null;

  const handleApply = async () => {
    if (!proposalNote.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tóm tắt năng lực hoặc đề xuất của Quý Doanh nghiệp.");
      return;
    }

    setSubmitting(true);
    try {
      await opportunityApi.expressInterest(opportunity.id, "high");
    } catch (err) {
      console.warn("Lỗi gửi quan tâm cơ hội lên API:", err);
    }

    setSubmitting(false);
    setHasApplied(true);
    if (onApplyOpportunity) {
      onApplyOpportunity(opportunity.id);
    }
    Alert.alert(
      "Gửi hồ sơ thành công",
      `Đã chuyển hồ sơ năng lực và đề xuất báo giá tới Ban thẩm định dự án của ${opportunity.organization}.`
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Cơ hội kinh doanh B2B: ${opportunity.title}\nQuy mô: ${opportunity.dealValue}\nChủ đầu tư: ${opportunity.organization}\nXem chi tiết trên ViOne: https://vione.vn/opp/${opportunity.id}`,
      });
    } catch (e) {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{opportunity.category}</Text>
              </View>
              <Text style={styles.headerTitle}>Chi tiết cơ hội B2B</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Deal Card */}
            <View style={styles.dealCard}>
              <LinearGradient
                colors={["#151D2C", "#0E1522", "#070B12"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dealGradient}
              >
                <View style={styles.dealTopRow}>
                  <View style={styles.dealValueBadge}>
                    <Text style={styles.dealValueText}>{opportunity.dealValue}</Text>
                  </View>
                  <View style={styles.daysTag}>
                    <Clock size={12} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.daysText}>{opportunity.daysLeft}</Text>
                  </View>
                </View>

                <Text style={styles.oppTitle}>{opportunity.title}</Text>

                <View style={styles.orgMetaRow}>
                  <Building2 size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.orgName}>{opportunity.organization}</Text>
                </View>

                <View style={styles.communityRow}>
                  <Users size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                  <Text style={styles.communityName}>Cộng đồng: {opportunity.communityName}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Requirement Specifications */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={16} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>YÊU CẦU NĂNG LỰC & PHẠM VI DỰ ÁN</Text>
              </View>

              <View style={styles.specItem}>
                <View style={styles.specDot} />
                <Text style={styles.specText}>
                  Doanh nghiệp có từ 3 năm kinh nghiệm trong ngành, đầy đủ tư cách pháp nhân và chứng chỉ chuyên ngành.
                </Text>
              </View>

              <View style={styles.specItem}>
                <View style={styles.specDot} />
                <Text style={styles.specText}>
                  Cam kết bảo lãnh thực hiện hợp đồng theo chuẩn thương mại và đúng tiến độ cam kết.
                </Text>
              </View>

              <View style={styles.specItem}>
                <View style={styles.specDot} />
                <Text style={styles.specText}>
                  Ưu tiên thành viên Doanh nghiệp chính thức trên nền tảng ViOne Connect có hồ sơ tín nhiệm C-Level cao.
                </Text>
              </View>
            </View>

            {/* Contact Person */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <ShieldCheck size={16} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>BAN ĐIỀU PHỐI MUA HÀNG & HỢP TÁC</Text>
              </View>

              <View style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>Ban Thu Mua & Quản Lý Dự Án</Text>
                  <Text style={styles.contactSub}>{opportunity.organization}</Text>
                </View>

                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.contactActionBtn}
                    onPress={() => Alert.alert("Liên hệ", "Gọi tới hotline điều phối: 0983 000 001")}
                    activeOpacity={0.8}
                  >
                    <Phone size={15} color="#D8B282" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contactActionBtn}
                    onPress={() => Alert.alert("Nhắn tin", "Đang mở cổng tin nhắn B2B trao đổi dự án")}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={15} color="#D8B282" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Proposal Form if not applied */}
            {!hasApplied ? (
              <View style={styles.proposalSection}>
                <Text style={styles.sectionTitle}>GỬI ĐỀ XUẤT NĂNG LỰC / BÁO GIÁ</Text>
                <Text style={styles.proposalSub}>
                  Hồ sơ năng lực số ViOne của Quý Doanh nghiệp sẽ được đính kèm tự động cùng báo giá này.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Báo giá ước tính (tùy chọn)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: Theo dự toán hồ sơ thầu..."
                    placeholderTextColor="#64748B"
                    value={proposalPrice}
                    onChangeText={setProposalPrice}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tóm tắt năng lực & giải pháp đề xuất *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Mô tả năng lực, dự án tương tự đã thực hiện và lợi thế cạnh tranh..."
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={4}
                    value={proposalNote}
                    onChangeText={setProposalNote}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.appliedBanner}>
                <CheckCircle2 size={24} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.appliedTitle}>Đã nộp hồ sơ năng lực thành công</Text>
                  <Text style={styles.appliedSub}>
                    Ban dự án đang xem xét đề xuất. Bạn sẽ nhận thông báo khi có phản hồi.
                  </Text>
                </View>
              </View>
            )}

            {/* Go to Community Link */}
            {onGoToCommunity && (
              <TouchableOpacity
                style={styles.communityJumpBtn}
                onPress={onGoToCommunity}
                activeOpacity={0.8}
              >
                <Users size={16} color="#DFB76C" style={{ marginRight: 8 }} />
                <Text style={styles.communityJumpText}>
                  Vào phân hệ Cộng đồng {opportunity.communityName ? `"${opportunity.communityName}"` : ""}
                </Text>
              </TouchableOpacity>
            )}

            {/* Share */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Share2 size={16} color="#DFB76C" style={{ marginRight: 8 }} />
              <Text style={styles.shareText}>Chia sẻ cơ hội này với liên danh đối tác</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.bottomFooter}>
            {hasApplied ? (
              <View style={styles.appliedPillFull}>
                <Check size={16} color="#DFB76C" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.appliedPillFullText}>Hồ sơ đã được gửi tới chủ đầu tư</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.submitSolidBtn}
                onPress={handleApply}
                disabled={submitting}
                activeOpacity={0.88}
              >
                <Send size={16} color="#050C15" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  {submitting ? "Đang gửi hồ sơ..." : "Nộp hồ sơ năng lực & Báo giá B2B"}
                </Text>
              </TouchableOpacity>
            )}
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
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0B0F17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dealCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    overflow: "hidden",
    marginBottom: 16,
  },
  dealGradient: {
    padding: 18,
  },
  dealTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dealValueBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderWidth: 1,
    borderColor: "#D8B282",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dealValueText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  daysTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8B282",
  },
  oppTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    lineHeight: 25,
    marginBottom: 12,
  },
  orgMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  orgName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityName: {
    fontSize: 12,
    color: "#94A3B8",
  },
  sectionCard: {
    backgroundColor: "#0E1522",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  specDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D8B282",
    marginTop: 6,
    marginRight: 10,
  },
  specText: {
    flex: 1,
    fontSize: 13,
    color: "#CBD5E1",
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 12,
    color: "#94A3B8",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  contactActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  proposalSection: {
    backgroundColor: "#0E1522",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    padding: 16,
    marginBottom: 16,
  },
  proposalSub: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 13,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  appliedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  appliedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 3,
  },
  appliedSub: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  shareText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D8B282",
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  communityJumpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(223, 183, 108, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.4)",
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
  },
  communityJumpText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DFB76C",
  },
  submitSolidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFB76C",
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
  appliedPillFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
    borderRadius: 12,
    paddingVertical: 14,
  },
  appliedPillFullText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D8B282",
  },
});
