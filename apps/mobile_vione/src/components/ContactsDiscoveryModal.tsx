import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import {
  X,
  Users,
  Search,
  UserPlus,
  Check,
  Phone,
  Building2,
  Sparkles,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/media";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface PhoneContactItem {
  id: string;
  name: string;
  phone: string;
  company?: string;
  title?: string;
  avatarUrl?: string;
  isRegistered: boolean;
  status: "connected" | "pending" | "unconnected";
}

const INITIAL_CONTACTS: PhoneContactItem[] = [
  {
    id: "cont-1",
    name: "Nguyễn Hoàng Nam",
    phone: "0912 345 678",
    company: "Tập Đoàn Bất Động Sản Hoàng Nam",
    title: "Chủ tịch HĐQT",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    isRegistered: true,
    status: "unconnected",
  },
  {
    id: "cont-2",
    name: "Trần Bích Thảo",
    phone: "0988 234 567",
    company: "Thảo Vy Logistics Quốc Tế",
    title: "Tổng Giám Đốc",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
    isRegistered: true,
    status: "unconnected",
  },
  {
    id: "cont-3",
    name: "Lê Tuấn Dũng",
    phone: "0903 888 999",
    company: "Liên Minh Tài Chính ViOne",
    title: "Phó Chủ Tịch",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
    isRegistered: true,
    status: "unconnected",
  },
  {
    id: "cont-4",
    name: "Đặng Thị Ngọc Lan",
    phone: "0977 456 789",
    company: "Tập Đoàn Dược Mỹ Phẩm Lan Châu",
    title: "Giám Đốc Chiến Lược",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop",
    isRegistered: true,
    status: "unconnected",
  },
  {
    id: "cont-5",
    name: "Phạm Hải Đăng",
    phone: "0918 666 888",
    company: "Hải Đăng Global Tech & IoT",
    title: "Sáng Lập & CTO",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop",
    isRegistered: true,
    status: "unconnected",
  },
];

interface ContactsDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  onConnectSuccess?: (contact: PhoneContactItem) => void;
}

export const ContactsDiscoveryModal: React.FC<ContactsDiscoveryModalProps> = ({
  visible,
  onClose,
  onConnectSuccess,
}) => {
  const { isDark } = useTheme();
  const [contacts, setContacts] = useState<PhoneContactItem[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  const handleConnect = (contact: PhoneContactItem) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, status: "pending" } : c))
    );
    Alert.alert(
      "Gửi lời mời kết nối thành công",
      `Đã gửi lời mời kết nối doanh nhân tới ${contact.name} (${contact.phone}) từ danh bạ của bạn!`
    );
    onConnectSuccess?.(contact);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.headerIconWrap}>
                <Users size={18} color="#D8B282" />
              </View>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Bạn bè từ danh bạ điện thoại
                </Text>
                <Text style={styles.headerSubtitle}>
                  Tìm & kết nối ngay với đối tác đang dùng ViOne
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
            >
              <Search size={15} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                placeholder="Tìm theo tên, số điện thoại, công ty..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List of Contacts */}
          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((item) => {
              const isPending = item.status === "pending";
              const isConnected = item.status === "connected";

              return (
                <View
                  key={item.id}
                  style={[
                    styles.contactCard,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.contactLeft}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: resolveMediaUrl(item.avatarUrl) || item.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text
                          style={[
                            styles.contactName,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.vBadge}>
                          <Sparkles size={9} color="#D8B282" />
                          <Text style={styles.vBadgeText}>Đang dùng ViOne</Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.contactTitle,
                          { color: isDark ? "#D8B282" : "#A3703C" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title || "Doanh nhân"} · {item.company || "Đối tác kinh doanh"}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Phone size={11} color="#94A3B8" />
                        <Text style={styles.contactPhone}>{item.phone}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      isPending && styles.connectBtnPending,
                      isConnected && styles.connectBtnConnected,
                    ]}
                    onPress={() => !isPending && !isConnected && handleConnect(item)}
                    disabled={isPending || isConnected}
                    activeOpacity={0.8}
                  >
                    {isConnected ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Check size={12} color="#10B981" />
                        <Text style={[styles.connectBtnText, { color: "#10B981" }]}>Bạn bè</Text>
                      </View>
                    ) : isPending ? (
                      <Text style={[styles.connectBtnText, { color: "#94A3B8" }]}>Đã gửi</Text>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <UserPlus size={12} color="#050C15" />
                        <Text style={styles.connectBtnText}>Kết nối</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
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
  container: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#D8B282",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D8B282",
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "800",
    color: "#D8B282",
  },
  contactName: {
    fontSize: 13.5,
    fontWeight: "700",
    maxWidth: 130,
  },
  vBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: "rgba(216, 178, 130, 0.18)",
  },
  vBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#D8B282",
  },
  contactTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 11,
    color: "#94A3B8",
  },
  connectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtnPending: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  connectBtnConnected: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  connectBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#050C15",
  },
});
