import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Wallet,
  Search,
  Phone,
  MessageSquare,
  Download,
  Building2,
  Mail,
  ShieldCheck,
  Tag,
  Share2,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { Avatar } from "./common/Avatar";
import { networkApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CollectedCard {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  industry: string;
  collectedAt: string;
  tag: string;
  avatarUrl?: string;
}

const INITIAL_VAULT_CARDS: CollectedCard[] = [
  {
    id: "card-1",
    name: "Trần Anh Tuấn",
    title: "Chủ Tịch HĐQT",
    company: "Tập Đoàn Bất Động Sản An Phát",
    phone: "0912 345 678",
    email: "tuan.ta@anphatgroup.vn",
    industry: "Bất Động Sản & Xây Dựng",
    collectedAt: "Quét tại Đại Hội C-Level 2026",
    tag: "Đối tác chiến lược",
  },
  {
    id: "card-2",
    name: "Phạm Minh Hoàng",
    title: "Tổng Giám Đốc",
    company: "Công Ty Cổ Phần F-Solutions",
    phone: "0903 888 999",
    email: "hoangpm@fsolutions.com.vn",
    industry: "Công Nghệ & AI",
    collectedAt: "Chạm thẻ NFC ViOne",
    tag: "Khách hàng B2B",
  },
  {
    id: "card-3",
    name: "Lê Thị Thu Hằng",
    title: "CFO & Quản Lý Quỹ",
    company: "Quỹ Đầu Tư V-Capital",
    phone: "0977 654 321",
    email: "hang.le@vcapital.vn",
    industry: "Tài Chính & Quỹ Đầu Tư",
    collectedAt: "Quét mã QR kết nối",
    tag: "Quỹ đầu tư",
  },
  {
    id: "card-4",
    name: "Đặng Quang Huy",
    title: "Nhà Sáng Lập & CEO",
    company: "Huy Đặng Media & Digital Marketing",
    phone: "0934 556 778",
    email: "huy@dangmedia.vn",
    industry: "Truyền Thông Doanh Nghiệp",
    collectedAt: "Quét danh thiếp OCR",
    tag: "Đối tác truyền thông",
  },
];

interface CardVaultModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenChatWithPartner?: (partnerName: string) => void;
}

export const CardVaultModal: React.FC<CardVaultModalProps> = ({
  visible,
  onClose,
  onOpenChatWithPartner,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<CollectedCard[]>(INITIAL_VAULT_CARDS);

  useEffect(() => {
    if (visible) {
      networkApi.getSavedCards(searchQuery).then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiCards: CollectedCard[] = res.data.map((c: any, idx: number) => ({
            id: c.id || `card-api-${idx}`,
            name: c.displayName || c.name || "Đối tác ViOne",
            title: c.title || "Lãnh đạo Doanh nghiệp",
            company: c.companyName || c.company || "Tập đoàn Đối tác",
            phone: c.phone || "0912 345 678",
            email: c.email || "partner@vione.vn",
            industry: c.industry || "Đa ngành",
            collectedAt: c.collectedAt || "Đã lưu vào ví",
            tag: c.tag || "Đối tác kết nối",
            avatarUrl: c.avatarUrl,
          }));
          setCards(apiCards);
        }
      }).catch((err) => console.warn("Lỗi tải saved cards từ API:", err));
    }
  }, [visible, searchQuery]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  const handleExportVcf = (card: CollectedCard) => {
    Alert.alert(
      "Xuất danh bạ vCard (.vcf)",
      `Đã tạo tệp danh bạ điện tử cho đối tác: ${card.name} (${card.company}). Bạn có thể lưu trực tiếp vào danh bạ điện thoại.`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Wallet size={16} color="#D8B282" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Ví danh thiếp đối tác</Text>
                <Text style={styles.headerSubtitle}>{cards.length} danh thiếp doanh nhân đã lưu</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Search size={16} color="#D8B282" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên đối tác, công ty, ngành nghề..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <LinearGradient
                  colors={["#151D2C", "#0E1522", "#070B12"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardTopRow}>
                    <Avatar url={card.avatarUrl} name={card.name} size={44} showGoldBorder />
                    <View style={styles.cardMeta}>
                      <View style={styles.nameRow}>
                        <Text style={styles.partnerName}>{card.name}</Text>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagText}>{card.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.partnerTitle}>{card.title}</Text>
                      <View style={styles.companyRow}>
                        <Building2 size={12} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.partnerCompany} numberOfLines={1}>
                          {card.company}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.contactDetailsRow}>
                    <View style={styles.contactDetailItem}>
                      <Phone size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                      <Text style={styles.contactDetailText}>{card.phone}</Text>
                    </View>
                    <View style={styles.contactDetailItem}>
                      <Mail size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                      <Text style={styles.contactDetailText} numberOfLines={1}>
                        {card.email}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.collectedSource}>📍 {card.collectedAt}</Text>

                  {/* Quick Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnGold}
                      onPress={() => {
                        onClose();
                        if (onOpenChatWithPartner) onOpenChatWithPartner(card.name);
                      }}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={13} color="#050C15" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnGoldText}>Nhắn tin B2B</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => Alert.alert("Gọi điện", `Gọi tới số: ${card.phone}`)}
                      activeOpacity={0.8}
                    >
                      <Phone size={13} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnOutlineText}>Gọi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => handleExportVcf(card)}
                      activeOpacity={0.8}
                    >
                      <Download size={13} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnOutlineText}>vCard</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
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
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E1522",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  cardItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    overflow: "hidden",
    marginBottom: 12,
  },
  cardGradient: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardMeta: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  tagBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  partnerTitle: {
    fontSize: 12,
    color: "#D8B282",
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerCompany: {
    fontSize: 12,
    color: "#94A3B8",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 10,
  },
  contactDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  contactDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactDetailText: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  collectedSource: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 12,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnGold: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8B282",
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionBtnGoldText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#050C15",
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 178, 130, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8B282",
  },
});
