import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  X,
  Bell,
  CheckCircle2,
  Calendar,
  Handshake,
  TrendingUp,
  FileCheck,
  CheckCheck,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

export interface BusinessNotificationItem {
  id: string;
  type: "connection" | "meeting" | "opportunity" | "event" | "approval";
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  actionText?: string;
}

const INITIAL_NOTIFICATIONS: BusinessNotificationItem[] = [
  {
    id: "notif-1",
    type: "opportunity",
    title: "Cơ hội kinh doanh mới",
    description: "Tập đoàn VTech vừa đăng đề xuất hợp tác cung ứng giải pháp chuyển đổi số & AI Doanh nghiệp.",
    timeAgo: "15 phút trước",
    isRead: false,
    actionText: "Xem chi tiết cơ hội",
  },
  {
    id: "notif-2",
    type: "meeting",
    title: "Lịch hẹn gặp 1-1",
    description: "Ông Trần Đức Nam (CEO Logistics Nam Phát) đã xác nhận cuộc hẹn lúc 14:30 chiều nay.",
    timeAgo: "1 giờ trước",
    isRead: false,
    actionText: "Mở lịch trình",
  },
  {
    id: "notif-3",
    type: "connection",
    title: "Yêu cầu kết nối danh thiếp",
    description: "Bà Hoàng Mai Anh (Giám đốc Tài chính VNPay) đã gửi yêu cầu kết nối đối tác với bạn.",
    timeAgo: "3 giờ trước",
    isRead: false,
    actionText: "Chấp nhận kết nối",
  },
  {
    id: "notif-4",
    type: "event",
    title: "Điểm danh sự kiện thành công",
    description: "Vé NFC điện tử của bạn đã được xác thực tại Diễn đàn Doanh nghiệp ViOne Global 2026.",
    timeAgo: "Hôm qua",
    isRead: true,
  },
  {
    id: "notif-5",
    type: "approval",
    title: "Hồ sơ cần phê duyệt",
    description: "Ban điều hành hiệp hội có 2 hồ sơ đăng ký thành viên VIP mới cần phê duyệt xét duyệt.",
    timeAgo: "2 ngày trước",
    isRead: true,
    actionText: "Xử lý phê duyệt",
  },
];

interface BusinessNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const BusinessNotificationsModal: React.FC<BusinessNotificationsModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<BusinessNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const filteredList = notifications.filter((item) => {
    if (activeFilter === "unread") return !item.isRead;
    return true;
  });

  const getIcon = (type: BusinessNotificationItem["type"]) => {
    switch (type) {
      case "opportunity":
        return <TrendingUp size={18} color="#D8B282" strokeWidth={2} />;
      case "meeting":
        return <Calendar size={18} color="#38BDF8" strokeWidth={2} />;
      case "connection":
        return <Handshake size={18} color="#10B981" strokeWidth={2} />;
      case "approval":
        return <FileCheck size={18} color="#F59E0B" strokeWidth={2} />;
      case "event":
      default:
        return <CheckCircle2 size={18} color="#A855F7" strokeWidth={2} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
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
            <View style={styles.headerTitleRow}>
              <Bell size={20} color={isDark ? "#D8B282" : "#A3703C"} strokeWidth={2} />
              <Text
                style={[
                  styles.titleText,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                Thông báo kết nối
              </Text>
              {unreadCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          {/* Filter Bar & Mark As Read */}
          <View style={styles.filterRow}>
            <View style={styles.filterTabs}>
              <TouchableOpacity
                onPress={() => setActiveFilter("all")}
                style={[
                  styles.filterPill,
                  activeFilter === "all" && [
                    styles.filterPillActive,
                    { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3" },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === "all"
                      ? { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "700" }
                      : { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Tất cả ({notifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter("unread")}
                style={[
                  styles.filterPill,
                  activeFilter === "unread" && [
                    styles.filterPillActive,
                    { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3" },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === "unread"
                      ? { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "700" }
                      : { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Chưa đọc ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllBtn}
                activeOpacity={0.7}
              >
                <CheckCheck size={14} color={isDark ? "#D8B282" : "#A3703C"} />
                <Text
                  style={[
                    styles.markAllText,
                    { color: isDark ? "#D8B282" : "#A3703C" },
                  ]}
                >
                  Đọc hết
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredList.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={40} color={isDark ? "rgba(216, 178, 130, 0.3)" : "#CBD5E1"} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Không có thông báo nào
                </Text>
                <Text style={styles.emptyDesc}>
                  {activeFilter === "unread"
                    ? "Bạn đã đọc hết mọi thông báo và cập nhật mới."
                    : "Các hoạt động đối tác, cơ hội hợp tác và lịch gặp sẽ hiển thị tại đây."}
                </Text>
              </View>
            ) : (
              filteredList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isDark
                        ? item.isRead
                          ? "#12151F"
                          : "rgba(22, 32, 50, 0.75)"
                        : item.isRead
                          ? "#F8FAFC"
                          : "#FFFFFF",
                      borderColor: !item.isRead
                        ? isDark
                          ? "rgba(216, 178, 130, 0.4)"
                          : "rgba(216, 178, 130, 0.6)"
                        : isDark
                          ? "rgba(255, 255, 255, 0.06)"
                          : "#E2E8F0",
                    },
                  ]}
                  onPress={() => markItemAsRead(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.itemIconCol}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : "#F1F5F9",
                        },
                      ]}
                    >
                      {getIcon(item.type)}
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>

                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            color: isDark ? "#FFFFFF" : "#0F172A",
                            fontWeight: item.isRead ? "600" : "800",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={styles.timeRow}>
                        <Clock size={11} color={isDark ? "#94A3B8" : "#94A3B8"} />
                        <Text style={styles.itemTime}>{item.timeAgo}</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.itemDesc,
                        { color: isDark ? "#94A3B8" : "#475569" },
                      ]}
                      numberOfLines={3}
                    >
                      {item.description}
                    </Text>

                    {item.actionText && (
                      <View style={styles.actionBtnRow}>
                        <Text
                          style={[
                            styles.actionLinkText,
                            { color: isDark ? "#D8B282" : "#A3703C" },
                          ]}
                        >
                          {item.actionText}
                        </Text>
                        <ChevronRight
                          size={13}
                          color={isDark ? "#D8B282" : "#A3703C"}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: "85%",
    minHeight: 480,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
  },
  badgeCount: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  filterPillActive: {},
  filterPillText: {
    fontSize: 12,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemIconCol: {
    position: "relative",
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#EF4444",
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13.5,
    flex: 1,
    marginRight: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  itemTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 2,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
});
