import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Check,
  X,
  Phone,
  Mail,
  Sparkles,
  Building2,
  MessageSquare,
  Users,
  Plus,
  ArrowRight,
  Shield,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Avatar } from "../../components/common/Avatar";
import { LuxuryCard } from "../../components/common/LuxuryCard";
import { ConnectionPerson, DmThreadSummary } from "../../types";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ChatThreadModal } from "./ChatThreadModal";
import { CreateGroupModal } from "./CreateGroupModal";

// Dữ liệu đối tác kết nối mặc định
const INITIAL_PARTNERS: ConnectionPerson[] = [
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

// Dữ liệu hội thoại mẫu mặc định
const INITIAL_THREADS: DmThreadSummary[] = [
  {
    threadId: "th-1",
    counterpartUserId: "p-1",
    displayName: "Trần Anh Tuấn",
    headline: "Chủ Tịch HĐQT • Tập Đoàn Bất Động Sản An Phát",
    companyName: "Tập Đoàn Bất Động Sản An Phát",
    lastMessagePreview: "Chào anh, thứ 6 này mình gặp trao đổi về dự án nhé.",
    lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    lastMessageFromMe: false,
    unreadCount: 1,
    isConnected: true,
    isOnline: true,
  },
  {
    threadId: "th-2",
    counterpartUserId: "p-2",
    displayName: "Phạm Minh Hoàng",
    headline: "Tổng Giám Đốc • F-Solutions",
    companyName: "F-Solutions",
    lastMessagePreview: "Tôi đã gửi tài liệu giải pháp qua email cho anh rồi.",
    lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lastMessageFromMe: true,
    unreadCount: 0,
    isConnected: true,
    isOnline: false,
  },
  {
    threadId: "th-group-1",
    counterpartUserId: "group_lead",
    displayName: "👥 Ban Điều Hành ViOne C-Level",
    companyName: "5 thành viên",
    lastMessagePreview: "Lịch họp quý 4 sẽ chốt vào 14:00 chiều mai.",
    lastMessageAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    lastMessageFromMe: false,
    unreadCount: 2,
    isConnected: true,
    isGroup: true,
    membersCount: 5,
  },
  {
    threadId: "th-pending-1",
    counterpartUserId: "p-9",
    displayName: "Vũ Hải Đăng",
    headline: "Giám Đốc Phát Triển • Tech Logistics",
    companyName: "Tech Logistics",
    lastMessagePreview: "Chào anh, tôi muốn kết nối để tìm hiểu giải pháp doanh nghiệp.",
    lastMessageAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    lastMessageFromMe: false,
    unreadCount: 0,
    isConnected: false,
    isOnline: false,
  },
];

type ViewMode = "partners" | "messages";
type MessageTab = "all" | "unread" | "groups" | "requests";

export const NetworkScreen: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("partners");

  // Partners state
  const [partners, setPartners] = useState<ConnectionPerson[]>(INITIAL_PARTNERS);
  const [activePartnerTab, setActivePartnerTab] = useState<"connected" | "pending" | "suggested">("connected");
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");

  // Messaging state
  const [threads, setThreads] = useState<DmThreadSummary[]>(INITIAL_THREADS);
  const [activeMessageTab, setActiveMessageTab] = useState<MessageTab>("all");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  // Modals
  const [selectedThread, setSelectedThread] = useState<DmThreadSummary | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);

  // Tải danh sách cuộc trò chuyện từ API
  useEffect(() => {
    let isMounted = true;
    const fetchThreads = async () => {
      try {
        setIsLoadingThreads(true);
        const res = await apiRequest<{ ok?: boolean; threads?: DmThreadSummary[] }>("connect-app/dm/threads");
        if (!isMounted) return;

        if (res.data?.threads && Array.isArray(res.data.threads) && res.data.threads.length > 0) {
          setThreads(res.data.threads);
        }
      } catch (err) {
        console.warn("Lỗi tải threads từ API:", err);
      } finally {
        if (isMounted) setIsLoadingThreads(false);
      }
    };

    fetchThreads();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc đối tác
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchTab =
        activePartnerTab === "connected"
          ? p.status === "connected"
          : activePartnerTab === "pending"
          ? p.status === "pending"
          : p.status === "suggested";

      const q = partnerSearchQuery.trim().toLowerCase();
      const matchQuery =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.industry?.toLowerCase().includes(q);

      return matchTab && matchQuery;
    });
  }, [partners, activePartnerTab, partnerSearchQuery]);

  // Phân loại danh mục Hộp thư chuẩn Messenger:
  // - Tất cả: Toàn bộ hội thoại do chính tài khoản này đã nhắn tin tới (lastMessageFromMe), hội thoại đã có tin nhắn, nhóm, và người đã kết nối
  const allThreads = useMemo(() => {
    return threads.filter((t) => {
      if (t.isGroup) return true;
      if (t.lastMessageFromMe) return true;
      if (Boolean(t.lastMessagePreview)) return true;
      if (t.isConnected !== false) return true;
      return false;
    });
  }, [threads]);

  const unreadThreads = useMemo(() => {
    return allThreads.filter((t) => (t.unreadCount || 0) > 0);
  }, [allThreads]);

  const groupThreads = useMemo(() => {
    return threads.filter((t) => t.isGroup);
  }, [threads]);

  // Tin nhắn chờ: Chỉ chứa tin nhắn từ người lạ CHƯA kết nối gửi đến và KHÔNG PHẢI do chính mình gửi đi
  const pendingThreads = useMemo(() => {
    return threads.filter(
      (t) => t.isConnected === false && !t.lastMessageFromMe && Boolean(t.lastMessagePreview)
    );
  }, [threads]);

  const totalUnreadCount = useMemo(() => {
    return unreadThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  }, [unreadThreads]);

  // Lọc danh sách hội thoại theo tab & tìm kiếm
  const filteredThreads = useMemo(() => {
    let baseList = allThreads;
    if (activeMessageTab === "unread") baseList = unreadThreads;
    if (activeMessageTab === "groups") baseList = groupThreads;
    if (activeMessageTab === "requests") baseList = pendingThreads;

    const q = messageSearchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter((t) => {
      const name = (t.displayName || "").toLowerCase();
      const company = (t.companyName || "").toLowerCase();
      const msg = (t.lastMessagePreview || "").toLowerCase();
      return name.includes(q) || company.includes(q) || msg.includes(q);
    });
  }, [activeMessageTab, allThreads, unreadThreads, groupThreads, pendingThreads, messageSearchQuery]);

  const handleOpenChatWithPartner = (partner: ConnectionPerson) => {
    // Tìm thread có sẵn hoặc tạo mới
    const existing = threads.find((t) => t.counterpartUserId === partner.id);
    if (existing) {
      setSelectedThread(existing);
    } else {
      const newThread: DmThreadSummary = {
        threadId: "th-" + partner.id,
        counterpartUserId: partner.id,
        displayName: partner.name,
        companyName: partner.company,
        avatarUrl: partner.avatarUrl,
        lastMessagePreview: "Bắt đầu cuộc trò chuyện kinh doanh mới",
        lastMessageAt: new Date().toISOString(),
        lastMessageFromMe: true,
        unreadCount: 0,
        isConnected: partner.status === "connected",
        isOnline: true,
      };
      setThreads((prev) => [newThread, ...prev]);
      setSelectedThread(newThread);
    }
    setChatModalVisible(true);
  };

  const handleMessageSent = (threadId: string, lastMessage: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.threadId === threadId
          ? {
              ...t,
              lastMessagePreview: lastMessage,
              lastMessageAt: new Date().toISOString(),
              lastMessageFromMe: true,
              unreadCount: 0,
            }
          : t
      )
    );
  };

  const handleGroupCreated = (newGroup: DmThreadSummary) => {
    setThreads((prev) => [newGroup, ...prev]);
    setSelectedThread(newGroup);
    setChatModalVisible(true);
  };

  const formatThreadTime = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Segment Switcher Header */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>Mạng Lưới & Kết Nối</Text>

          <View style={styles.mainSegmentWrap}>
            <TouchableOpacity
              style={[styles.mainSegmentBtn, viewMode === "partners" && styles.mainSegmentBtnActive]}
              onPress={() => setViewMode("partners")}
            >
              <Text
                style={[
                  styles.mainSegmentText,
                  viewMode === "partners" && styles.mainSegmentTextActive,
                ]}
              >
                Đối tác
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainSegmentBtn, viewMode === "messages" && styles.mainSegmentBtnActive]}
              onPress={() => setViewMode("messages")}
            >
              <View style={styles.msgSegmentContent}>
                <Text
                  style={[
                    styles.mainSegmentText,
                    viewMode === "messages" && styles.mainSegmentTextActive,
                  ]}
                >
                  Tin nhắn
                </Text>
                {totalUnreadCount > 0 && (
                  <View style={styles.headerUnreadBadge}>
                    <Text style={styles.headerUnreadText}>{totalUnreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── PHÂN HỆ 1: ĐỐI TÁC KẾT NỐI (PARTNERS) ─── */}
        {viewMode === "partners" && (
          <>
            {/* Search Bar */}
            <View style={styles.searchWrapper}>
              <Search size={18} color="#D97706" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đối tác, công ty, ngành nghề..."
                placeholderTextColor="#94A3B8"
                value={partnerSearchQuery}
                onChangeText={setPartnerSearchQuery}
              />
              {partnerSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setPartnerSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activePartnerTab === "connected" && styles.tabBtnActive]}
                onPress={() => setActivePartnerTab("connected")}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activePartnerTab === "connected" && styles.tabBtnTextActive,
                  ]}
                >
                  Đã kết nối ({partners.filter((p) => p.status === "connected").length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activePartnerTab === "pending" && styles.tabBtnActive]}
                onPress={() => setActivePartnerTab("pending")}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activePartnerTab === "pending" && styles.tabBtnTextActive,
                  ]}
                >
                  Lời mời ({partners.filter((p) => p.status === "pending").length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activePartnerTab === "suggested" && styles.tabBtnActive]}
                onPress={() => setActivePartnerTab("suggested")}
              >
                <Sparkles
                  size={12}
                  color={activePartnerTab === "suggested" ? "#05070E" : "#D97706"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activePartnerTab === "suggested" && styles.tabBtnTextActive,
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
                <View style={styles.partnerCard}>
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
                        <Building2 size={12} color="#64748B" style={{ marginRight: 4 }} />
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
                    <TouchableOpacity
                      style={styles.chatActionBtn}
                      onPress={() => handleOpenChatWithPartner(item)}
                    >
                      <MessageSquare size={14} color="#B45309" style={{ marginRight: 5 }} />
                      <Text style={styles.chatActionText}>Nhắn tin</Text>
                    </TouchableOpacity>

                    {item.status === "connected" && (
                      <>
                        <TouchableOpacity
                          style={styles.iconActionBtn}
                          onPress={() => Alert.alert("Gọi điện", `Gọi tới số: ${item.phone}`)}
                        >
                          <Phone size={15} color="#D97706" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconActionBtn}
                          onPress={() => Alert.alert("Gửi email", `Gửi tới: ${item.email}`)}
                        >
                          <Mail size={15} color="#D97706" />
                        </TouchableOpacity>
                      </>
                    )}

                    {item.status === "pending" && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Đang chờ duyệt</Text>
                      </View>
                    )}

                    {item.status === "suggested" && (
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => {
                          setPartners((prev) =>
                            prev.map((p) => (p.id === item.id ? { ...p, status: "pending" } : p))
                          );
                          Alert.alert("Thành công", `Đã gửi lời mời kết nối tới ${item.name}.`);
                        }}
                      >
                        <Text style={styles.connectBtnText}>Kết nối ngay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </>
        )}

        {/* ─── PHÂN HỆ 2: HỘP THƯ TIN NHẮN (MESSENGER INBOX) ─── */}
        {viewMode === "messages" && (
          <>
            {/* Search & Create Group Header Row */}
            <View style={styles.inboxActionRow}>
              <View style={styles.inboxSearchWrap}>
                <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inboxSearchInput}
                  placeholder="Tìm người liên hệ, nhóm phòng ban..."
                  placeholderTextColor="#94A3B8"
                  value={messageSearchQuery}
                  onChangeText={setMessageSearchQuery}
                />
                {messageSearchQuery !== "" && (
                  <TouchableOpacity onPress={() => setMessageSearchQuery("")}>
                    <X size={15} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.createGroupBtn}
                onPress={() => setCreateGroupVisible(true)}
              >
                <Users size={15} color="#B45309" style={{ marginRight: 5 }} />
                <Text style={styles.createGroupText}>Tạo nhóm</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Messenger-Style Category Tabs */}
            <View style={styles.categoryTabsRow}>
              <TouchableOpacity
                style={[styles.categoryTab, activeMessageTab === "all" && styles.categoryTabActive]}
                onPress={() => setActiveMessageTab("all")}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeMessageTab === "all" && styles.categoryTabTextActive,
                  ]}
                >
                  Tất cả ({allThreads.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryTab, activeMessageTab === "unread" && styles.categoryTabActive]}
                onPress={() => setActiveMessageTab("unread")}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeMessageTab === "unread" && styles.categoryTabTextActive,
                  ]}
                >
                  Chưa đọc {unreadThreads.length > 0 ? `(${unreadThreads.length})` : ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryTab, activeMessageTab === "groups" && styles.categoryTabActive]}
                onPress={() => setActiveMessageTab("groups")}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeMessageTab === "groups" && styles.categoryTabTextActive,
                  ]}
                >
                  Nhóm ({groupThreads.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryTab, activeMessageTab === "requests" && styles.categoryTabActive]}
                onPress={() => setActiveMessageTab("requests")}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeMessageTab === "requests" && styles.categoryTabTextActive,
                  ]}
                >
                  Tin nhắn chờ {pendingThreads.length > 0 ? `(${pendingThreads.length})` : ""}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Thread List */}
            {isLoadingThreads ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#D97706" />
                <Text style={styles.loadingText}>Đang đồng bộ hộp thư ViOne...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredThreads}
                keyExtractor={(item) => item.threadId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.threadsListContent}
                ListEmptyComponent={
                  <View style={styles.emptyInboxBox}>
                    <MessageSquare size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                    <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
                    <Text style={styles.emptySubtitle}>
                      {activeMessageTab === "unread"
                        ? "Bạn đã đọc hết mọi tin nhắn."
                        : activeMessageTab === "groups"
                        ? "Chưa tham gia nhóm nào. Bấm 'Tạo nhóm' để kết nối nhóm làm việc."
                        : "Chọn một đối tác trong danh bạ để bắt đầu nhắn tin."}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const hasUnread = (item.unreadCount || 0) > 0;
                  return (
                    <TouchableOpacity
                      style={[styles.threadItem, hasUnread && styles.threadItemUnread]}
                      onPress={() => {
                        setSelectedThread(item);
                        setChatModalVisible(true);
                      }}
                    >
                      <View style={styles.threadAvatarWrap}>
                        <Avatar
                          url={item.avatarUrl}
                          name={item.displayName}
                          size={48}
                          showGoldBorder={hasUnread}
                        />
                        {item.isOnline && <View style={styles.onlineDot} />}
                      </View>

                      <View style={styles.threadBody}>
                        <View style={styles.threadHeaderRow}>
                          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                            <Text
                              style={[
                                styles.threadName,
                                hasUnread && styles.threadNameBold,
                              ]}
                              numberOfLines={1}
                            >
                              {item.displayName}
                            </Text>
                            {item.isGroup && (
                              <View style={styles.threadGroupTag}>
                                <Users size={10} color="#B45309" />
                                <Text style={styles.threadGroupTagText}>Nhóm</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.threadTime}>
                            {formatThreadTime(item.lastMessageAt)}
                          </Text>
                        </View>

                        <View style={styles.threadPreviewRow}>
                          <Text
                            style={[
                              styles.threadPreviewText,
                              hasUnread && styles.threadPreviewTextUnread,
                            ]}
                            numberOfLines={1}
                          >
                            {item.lastMessageFromMe && (
                              <Text style={{ fontWeight: "700", color: "#B45309" }}>
                                Bạn:{" "}
                              </Text>
                            )}
                            {item.lastMessagePreview || "Chưa có tin nhắn"}
                          </Text>

                          {hasUnread && (
                            <View style={styles.unreadCounter}>
                              <Text style={styles.unreadCounterText}>{item.unreadCount}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        )}
      </View>

      {/* Global Modals */}
      <ChatThreadModal
        visible={chatModalVisible}
        thread={selectedThread}
        onClose={() => setChatModalVisible(false)}
        onMessageSent={handleMessageSent}
      />

      <CreateGroupModal
        visible={createGroupVisible}
        partners={partners}
        onClose={() => setCreateGroupVisible(false)}
        onGroupCreated={handleGroupCreated}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  mainSegmentWrap: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mainSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mainSegmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  mainSegmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  mainSegmentTextActive: {
    color: "#B45309",
    fontWeight: "700",
  },
  msgSegmentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUnreadBadge: {
    backgroundColor: "#DC2626",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    paddingHorizontal: 3,
  },
  headerUnreadText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 8,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#92400E",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 24,
  },
  partnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardMain: {
    flexDirection: "row",
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  matchBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  partnerTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  partnerCompany: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },
  industryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  industryText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  chatActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  chatActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  connectBtn: {
    marginLeft: "auto",
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pendingBadge: {
    marginLeft: "auto",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  /* Inbox Styles */
  inboxActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  inboxSearchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  createGroupText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  categoryTabsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryTabActive: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  threadsListContent: {
    paddingBottom: 24,
  },
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  threadItemUnread: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFDF5",
  },
  threadAvatarWrap: {
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  threadBody: {
    flex: 1,
    marginLeft: 12,
  },
  threadHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  threadName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  threadNameBold: {
    fontWeight: "800",
  },
  threadGroupTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  threadGroupTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 2,
  },
  threadTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  threadPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  threadPreviewText: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
    marginRight: 8,
  },
  threadPreviewTextUnread: {
    color: "#0F172A",
    fontWeight: "600",
  },
  unreadCounter: {
    backgroundColor: "#D97706",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadCounterText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },
  emptyInboxBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
});
