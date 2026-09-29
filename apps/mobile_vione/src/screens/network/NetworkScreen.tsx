import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, UserPlus, Check, X, Phone, Mail, Sparkles, Building2 } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Avatar } from "../../components/common/Avatar";
import { LuxuryCard } from "../../components/common/LuxuryCard";
import { ConnectionPerson } from "../../types";

const MOCK_PARTNERS: ConnectionPerson[] = [
  {
    id: "p-1",
    name: "Trần Anh Tuấn",
    title: "Chủ Tịch HĐQT",
    company: "Tập Đoàn Bất Động Sản An Phát",
    industry: "Bất Động Sản",
    phone: "0912 345 678",
    email: "tuan.ta@anphatgroup.vn",
    status: "connected",
  },
  {
    id: "p-2",
    name: "Phạm Minh Hoàng",
    title: "Tổng Giám Đốc",
    company: "Công Ty Cổ Phần Công Nghệ F-Solutions",
    industry: "Công Nghệ Thông Tin",
    phone: "0903 888 999",
    email: "hoangpm@fsolutions.com.vn",
    status: "connected",
  },
  {
    id: "p-3",
    name: "Lê Thị Thu Hằng",
    title: "Giám Đốc Tài Chính (CFO)",
    company: "Quỹ Đầu Tư Khởi Nghiệp V-Capital",
    industry: "Tài Chính & Quỹ Đầu Tư",
    phone: "0977 654 321",
    email: "hang.le@vcapital.vn",
    status: "pending",
  },
  {
    id: "p-4",
    name: "Hoàng Gia Bảo",
    title: "Phó Tổng Giám Đốc",
    company: "Chuỗi Bán Lẻ & Logistics Toàn Quốc",
    industry: "Bán Lẻ & Vận Tải",
    phone: "0989 112 233",
    email: "bao.hoang@retail-logistics.vn",
    status: "suggested",
    matchScore: 94,
  },
  {
    id: "p-5",
    name: "Đặng Quang Huy",
    title: "Nhà Sáng Lập & CEO",
    company: "Huy Đặng Media & Digital Marketing",
    industry: "Truyền Thông & Marketing",
    phone: "0934 556 778",
    email: "huy@dangmedia.vn",
    status: "suggested",
    matchScore: 88,
  },
];

export const NetworkScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"connected" | "pending" | "suggested">("connected");
  const [searchQuery, setSearchQuery] = useState("");
  const [partners, setPartners] = useState<ConnectionPerson[]>(MOCK_PARTNERS);

  const filteredPartners = partners.filter((p) => {
    const matchTab =
      activeTab === "connected"
        ? p.status === "connected"
        : activeTab === "pending"
        ? p.status === "pending"
        : p.status === "suggested";

    const matchQuery =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchQuery;
  });

  const handleAccept = (id: string, name: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "connected" } : p))
    );
    Alert.alert("Kết nối thành công", `Bạn và ${name} đã trở thành đối tác kinh doanh.`);
  };

  const handleReject = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConnect = (id: string, name: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "pending" } : p))
    );
    Alert.alert("Đã gửi lời mời", `Đã gửi lời mời kết nối tới ${name}.`);
  };

  const pendingCount = partners.filter((p) => p.status === "pending").length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.screenTitle}>Mạng Lưới Đối Tác</Text>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={18} color={Colors.gold} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đối tác, công ty, ngành nghề..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "connected" && styles.tabBtnActive]}
            onPress={() => setActiveTab("connected")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "connected" && styles.tabBtnTextActive,
              ]}
            >
              Đã kết nối ({partners.filter((p) => p.status === "connected").length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "pending" && styles.tabBtnActive]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "pending" && styles.tabBtnTextActive,
              ]}
            >
              Lời mời {pendingCount > 0 ? `(${pendingCount})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "suggested" && styles.tabBtnActive]}
            onPress={() => setActiveTab("suggested")}
          >
            <Sparkles
              size={12}
              color={activeTab === "suggested" ? "#05070E" : Colors.gold}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "suggested" && styles.tabBtnTextActive,
              ]}
            >
              Gợi ý AI
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Partners */}
        <FlatList
          data={filteredPartners}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Chưa tìm thấy đối tác phù hợp</Text>
              <Text style={styles.emptySubtitle}>
                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <LuxuryCard style={styles.partnerCard}>
              <View style={styles.cardMain}>
                <Avatar url={item.avatarUrl} name={item.name} size={50} showGoldBorder />
                <View style={styles.partnerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.partnerName}>{item.name}</Text>
                    {item.matchScore && (
                      <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>{item.matchScore}% Phù hợp</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.partnerTitle}>{item.title}</Text>

                  <View style={styles.companyRow}>
                    <Building2 size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.partnerCompany} numberOfLines={1}>
                      {item.company}
                    </Text>
                  </View>

                  {item.industry && (
                    <View style={styles.industryTag}>
                      <Text style={styles.industryText}>{item.industry}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {item.status === "connected" && (
                  <>
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => Alert.alert("Gọi điện", `Gọi tới số: ${item.phone}`)}
                    >
                      <Phone size={15} color={Colors.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => Alert.alert("Gửi email", `Gửi tới: ${item.email}`)}
                    >
                      <Mail size={15} color={Colors.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.profileBtn}
                      onPress={() =>
                        Alert.alert("Hồ sơ đối tác", `${item.name} - ${item.company}`)
                      }
                    >
                      <Text style={styles.profileBtnText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item.status === "pending" && (
                  <View style={styles.acceptRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item.id, item.name)}
                    >
                      <Check size={14} color="#05070E" style={{ marginRight: 4 }} />
                      <Text style={styles.acceptText}>Chấp nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(item.id)}
                    >
                      <X size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === "suggested" && (
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleConnect(item.id, item.name)}
                  >
                    <UserPlus size={14} color="#05070E" style={{ marginRight: 4 }} />
                    <Text style={styles.connectText}>Kết nối ngay</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LuxuryCard>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tabBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  tabBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#05070E",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 32,
  },
  partnerCard: {
    marginBottom: 12,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  partnerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  matchBadge: {
    backgroundColor: Colors.goldSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  matchText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "800",
  },
  partnerTitle: {
    color: Colors.goldLight,
    fontSize: 12,
    marginTop: 2,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  partnerCompany: {
    color: Colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  industryTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  industryText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderLight,
    gap: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtn: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  profileBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  acceptRow: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  acceptText: {
    color: "#05070E",
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtn: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.danger,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  connectText: {
    color: "#05070E",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
