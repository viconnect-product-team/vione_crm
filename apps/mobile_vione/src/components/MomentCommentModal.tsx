import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  MessageSquare,
  Heart,
  Send,
  Sparkles,
  Building2,
  Check,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./common/Avatar";
import { momentApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatar?: string;
  content: string;
  timeAgo: string;
  likesCount: number;
  liked: boolean;
}

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: "cm-1",
    authorName: "Đặng Quang Huy",
    authorRole: "CEO",
    authorCompany: "Huy Đặng Media",
    content: "Chúc mừng sự kiện quy mô lớn! Rất mong có dịp hợp tác truyền thông đa kênh cùng Quý Doanh nghiệp.",
    timeAgo: "25 phút trước",
    likesCount: 3,
    liked: false,
  },
  {
    id: "cm-2",
    authorName: "Lê Thị Thu Hằng",
    authorRole: "CFO",
    authorCompany: "Quỹ Đầu Tư V-Capital",
    content: "Dự án rất tiềm năng và phù hợp định hướng đầu tư xanh ESG của quỹ. Hẹn gặp anh tại bàn tròn giao thương nhé!",
    timeAgo: "1 giờ trước",
    likesCount: 5,
    liked: true,
  },
];

interface MomentCommentModalProps {
  visible: boolean;
  moment: {
    id: string;
    authorName: string;
    authorTitle?: string;
    authorCompany?: string;
    authorAvatar?: string;
    content: string;
    tag?: string;
  } | null;
  onClose: () => void;
}

const QUICK_REACTIONS = ["👍 Chúc mừng", "🤝 Hợp tác", "👏 Tuyệt vời", "💡 Rất tiềm năng"];

export const MomentCommentModal: React.FC<MomentCommentModalProps> = ({
  visible,
  moment,
  onClose,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (visible && moment?.id) {
      momentApi.getComments(moment.id).then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiComments: CommentItem[] = res.data.map((c: any, idx: number) => ({
            id: c.id || `cm-api-${idx}`,
            authorName: c.authorName || c.userName || "Doanh nhân ViOne",
            authorRole: c.authorRole || c.userTitle || "Thành viên C-Level",
            authorCompany: c.authorCompany || c.companyName || "Đối tác ViOne",
            authorAvatar: c.authorAvatar || c.avatarUrl,
            content: c.body || c.content || "",
            timeAgo: c.timeAgo || "Gần đây",
            likesCount: c.likesCount || 0,
            liked: Boolean(c.liked),
          }));
          setComments(apiComments);
        }
      }).catch((err) => console.warn("Lỗi tải comments từ API:", err));
    }
  }, [visible, moment?.id]);

  if (!moment) return null;

  const handleSendComment = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newComment: CommentItem = {
      id: `cm-${Date.now()}`,
      authorName: user?.displayName || user?.name || "Doanh nhân ViOne",
      authorRole: user?.title || "Tổng Giám Đốc",
      authorCompany: user?.company || "Tập đoàn ViOne",
      authorAvatar: user?.avatarUrl ?? undefined,
      content: text.trim(),
      timeAgo: "Vừa xong",
      likesCount: 0,
      liked: false,
    };

    setComments((prev) => [newComment, ...prev]);
    setInputText("");

    momentApi.addComment(moment.id, text.trim()).catch((err) =>
      console.warn("Lỗi gửi comment lên API:", err)
    );
  };

  const handleToggleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              liked: !c.liked,
              likesCount: c.liked ? c.likesCount - 1 : c.likesCount + 1,
            }
          : c
      )
    );

    momentApi.likeComment(moment.id, commentId).catch((err) =>
      console.warn("Lỗi like comment:", err)
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MessageSquare size={16} color="#D8B282" />
              </View>
              <Text style={styles.headerTitle}>Thảo luận & Bình luận B2B</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Moment Snippet */}
          <View style={styles.momentSnippet}>
            <View style={styles.snippetTop}>
              <Text style={styles.snippetAuthor}>{moment.authorName}</Text>
              {moment.tag && (
                <View style={styles.snippetTag}>
                  <Text style={styles.snippetTagText}>#{moment.tag}</Text>
                </View>
              )}
            </View>
            <Text style={styles.snippetContent} numberOfLines={2}>
              {moment.content}
            </Text>
          </View>

          {/* Comments List */}
          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.45 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {comments.map((cm) => (
              <View key={cm.id} style={styles.commentItem}>
                <Avatar url={cm.authorAvatar} name={cm.authorName} size={36} showGoldBorder />
                <View style={styles.commentBubble}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{cm.authorName}</Text>
                    <Text style={styles.commentTime}>{cm.timeAgo}</Text>
                  </View>
                  <Text style={styles.commentRole}>
                    {cm.authorRole} · {cm.authorCompany}
                  </Text>
                  <Text style={styles.commentContent}>{cm.content}</Text>

                  <View style={styles.commentFooter}>
                    <TouchableOpacity
                      style={styles.likeBtn}
                      onPress={() => handleToggleLikeComment(cm.id)}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={13}
                        color={cm.liked ? "#F43F5E" : "#94A3B8"}
                        fill={cm.liked ? "#F43F5E" : "none"}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.likeCount, cm.liked && styles.likeCountActive]}>
                        {cm.likesCount > 0 ? cm.likesCount : "Thích"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Quick Reactions Bar */}
          <View style={styles.quickReactionsRow}>
            {QUICK_REACTIONS.map((reaction, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickReactionPill}
                onPress={() => handleSendComment(reaction)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickReactionText}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Footer */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết phản hồi trao đổi cùng đối tác..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendComment()}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => handleSendComment()}
              activeOpacity={0.8}
            >
              <Send size={16} color="#050C15" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  momentSnippet: {
    backgroundColor: "rgba(216, 178, 130, 0.06)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  snippetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  snippetAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D8B282",
  },
  snippetTag: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  snippetTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  snippetContent: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#0E1522",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  commentTime: {
    fontSize: 10,
    color: "#64748B",
  },
  commentRole: {
    fontSize: 10,
    color: "#94A3B8",
    marginBottom: 6,
  },
  commentContent: {
    fontSize: 13,
    color: "#E2E8F0",
    lineHeight: 18,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeCount: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  likeCountActive: {
    color: "#F43F5E",
    fontWeight: "700",
  },
  quickReactionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickReactionPill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickReactionText: {
    fontSize: 11,
    color: "#CBD5E1",
    fontWeight: "500",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#0E1522",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: "#F8FAFC",
    fontSize: 13,
    marginRight: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
});
