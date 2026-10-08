import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { X, Star, MessageSquare, Share2, Tag, Calendar, User, Building2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CommunityNewsItem {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  timeAgo: string;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  category?: string;
  createdAt?: string;
}

interface CommunityNewsDetailModalProps {
  visible: boolean;
  onClose: () => void;
  news: CommunityNewsItem | null;
  onLikeToggle?: (newsId: string) => void;
  onToggleLike?: (newsId: string) => void;
}

export const CommunityNewsDetailModal: React.FC<CommunityNewsDetailModalProps> = ({
  visible,
  onClose,
  news,
  onLikeToggle,
  onToggleLike,
}) => {
  const { isDark } = useTheme();

  if (!news) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        title: news.title,
        message: `${news.title}\n\n${news.content.slice(0, 150)}...\n\nĐọc tiếp trên ViOne Connect: https://vione.vn`,
      });
    } catch {
      Alert.alert("Chia sẻ", "Không thể kích hoạt chia sẻ hệ thống.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Top Bar with Close & Share */}
          <View style={styles.topBar}>
            <View style={styles.categoryPill}>
              <Tag size={12} color="#DFB76C" />
              <Text style={styles.categoryPillText}>
                {news.category || "TIN TỨC CỘNG ĐỒNG"}
              </Text>
            </View>
            <View style={styles.topRightBtns}>
              <TouchableOpacity onPress={handleShare} style={styles.iconCircleBtn}>
                <Share2 size={16} color={isDark ? "#D8B282" : "#8C653B"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconCircleBtn}>
                <X size={18} color={isDark ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Cover Banner if exists */}
            {news.imageUrl && (
              <View style={styles.coverWrap}>
                <Image source={{ uri: news.imageUrl }} style={styles.coverImg} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", isDark ? "rgba(11, 15, 23, 0.9)" : "rgba(255, 255, 255, 0.8)"]}
                  style={styles.coverGradient}
                />
              </View>
            )}

            {/* Title */}
            <Text style={[styles.articleTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
              {news.title}
            </Text>

            {/* Author Row */}
            <View
              style={[
                styles.authorRow,
                { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
              ]}
            >
              {news.authorAvatar ? (
                <Image source={{ uri: news.authorAvatar }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarFallback}>
                  <Text style={styles.authorInitial}>
                    {news.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.authorName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  {news.authorName}
                </Text>
                <Text style={styles.authorTitle}>
                  {news.authorTitle} · {news.timeAgo}
                </Text>
              </View>
            </View>

            {/* Content Body */}
            <View style={styles.contentWrap}>
              <Text style={[styles.articleContent, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                {news.content}
              </Text>
            </View>

            {/* Additional editorial notes */}
            <View
              style={[
                styles.noteBox,
                {
                  backgroundColor: isDark ? "#121824" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                },
              ]}
            >
              <Text style={styles.noteTitle}>ViOne B2B Connect Bulletin</Text>
              <Text style={styles.noteText}>
                Tin tức được phát hành chính thức trong cộng đồng nội bộ và đối tác liên kết. Mọi thắc mắc vui lòng liên hệ ban điều hành.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Bottom Interaction Bar */}
          <View
            style={[
              styles.bottomBar,
              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#FDF6EC" },
              ]}
              onPress={() => {
                onLikeToggle?.(news.id);
                onToggleLike?.(news.id);
                Alert.alert("Tương tác", "Đã ghi nhận tương tác thích bài viết.");
              }}
            >
              <Star size={16} color="#DFB76C" fill="#DFB76C" />
              <Text style={[styles.actionBtnText, { color: "#DFB76C" }]}>
                {news.likes} Thích
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isDark ? "#182030" : "#F1F5F9" },
              ]}
              onPress={() => Alert.alert("Bình luận", "Mở khung thảo luận trao đổi.")}
            >
              <MessageSquare size={16} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text style={[styles.actionBtnText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                {news.comments} Bình luận
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isDark ? "#182030" : "#F1F5F9" },
              ]}
              onPress={handleShare}
            >
              <Share2 size={16} color={isDark ? "#D8B282" : "#8C653B"} />
              <Text style={[styles.actionBtnText, { color: isDark ? "#D8B282" : "#8C653B" }]}>
                Chia sẻ
              </Text>
            </TouchableOpacity>
          </View>
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
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
  },
  categoryPillText: {
    color: "#DFB76C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  topRightBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  coverWrap: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  coverImg: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#DFB76C",
  },
  authorAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DFB76C",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#050C15",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
  },
  authorTitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  contentWrap: {
    marginBottom: 20,
  },
  articleContent: {
    fontSize: 15,
    lineHeight: 24,
  },
  noteBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  noteTitle: {
    color: "#DFB76C",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  noteText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
