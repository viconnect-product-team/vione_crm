import React, { useState, useEffect, useRef } from "react";
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
  Image,
} from "react-native";
import {
  X,
  MessageSquare,
  Heart,
  Send,
  Building2,
  Check,
  Smile,
  Camera,
  AtSign,
  CornerDownRight,
  ThumbsUp,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Avatar } from "./common/Avatar";
import { momentApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CommentItem {
  id: string;
  parentId?: string | null;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatar?: string;
  content: string;
  timeAgo: string;
  likesCount: number;
  liked: boolean;
  photoUrl?: string | null;
  replies?: CommentItem[];
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
    replies: [
      {
        id: "cm-1-rep",
        parentId: "cm-1",
        authorName: "Lê Thị Thu Hằng",
        authorRole: "CFO",
        authorCompany: "Quỹ Đầu Tư V-Capital",
        content: "@Đặng Quang Huy Chắc chắn rồi anh, tuần này bên em sẽ sắp xếp lịch gặp 1-1 để trao đổi kế hoạch chi tiết.",
        timeAgo: "10 phút trước",
        likesCount: 1,
        liked: true,
      },
    ],
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

const QUICK_REACTIONS = ["👍 Chúc mừng", "🤝 Hợp tác", "👏 Tuyệt vời", "💡 Rất tiềm năng", "🔥 Triển vọng"];
const EMOJI_PALETTE = ["👍", "❤️", "👏", "🎉", "💡", "🔥", "😂", "🙏", "🚀", "🤝"];

export const MomentCommentModal: React.FC<MomentCommentModalProps> = ({
  visible,
  moment,
  onClose,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [inputText, setInputText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && moment?.id) {
      momentApi.getComments(moment.id).then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiComments: CommentItem[] = res.data.map((c: any, idx: number) => ({
            id: c.id || `cm-api-${idx}`,
            parentId: c.parentId || null,
            authorName: c.authorName || c.userName || "Doanh nhân ViOne",
            authorRole: c.authorRole || c.userTitle || "Thành viên C-Level",
            authorCompany: c.authorCompany || c.companyName || "Đối tác ViOne",
            authorAvatar: c.authorAvatar || c.avatarUrl,
            content: c.body || c.content || "",
            timeAgo: c.timeAgo || "Gần đây",
            likesCount: c.likesCount || 0,
            liked: Boolean(c.liked),
            photoUrl: c.photoUrl,
            replies: Array.isArray(c.replies)
              ? c.replies.map((r: any, rIdx: number) => ({
                  id: r.id || `cm-rep-${idx}-${rIdx}`,
                  parentId: c.id,
                  authorName: r.authorName || r.userName || "Doanh nhân ViOne",
                  authorRole: r.authorRole || r.userTitle || "Đối tác",
                  authorCompany: r.authorCompany || r.companyName || "Doanh nghiệp B2B",
                  authorAvatar: r.authorAvatar || r.avatarUrl,
                  content: r.body || r.content || "",
                  timeAgo: r.timeAgo || "Vừa xong",
                  likesCount: r.likesCount || 0,
                  liked: Boolean(r.liked),
                }))
              : [],
          }));
          setComments(apiComments);
        }
      }).catch((err) => console.warn("Lỗi tải comments từ API:", err));
    }
  }, [visible, moment?.id]);

  if (!moment) return null;

  const handleSelectReply = (target: CommentItem) => {
    setReplyTarget(target);
    const prefix = `@${target.authorName} `;
    if (!inputText.startsWith(prefix)) {
      setInputText(prefix);
    }
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
    setInputText("");
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleToggleAttachPhoto = () => {
    if (attachedPhoto) {
      setAttachedPhoto(null);
    } else {
      // Use clean verified media asset
      setAttachedPhoto("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80");
    }
  };

  const handleSendComment = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() && !attachedPhoto) return;

    const newComment: CommentItem = {
      id: `cm-${Date.now()}`,
      parentId: replyTarget ? replyTarget.id : null,
      authorName: user?.displayName || user?.name || "Doanh nhân ViOne",
      authorRole: user?.title || "Tổng Giám Đốc",
      authorCompany: user?.company || "Tập đoàn ViOne",
      authorAvatar: user?.avatarUrl ?? undefined,
      content: text.trim(),
      timeAgo: "Vừa xong",
      likesCount: 0,
      liked: false,
      photoUrl: attachedPhoto,
    };

    if (replyTarget) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === replyTarget.id || (replyTarget.parentId && c.id === replyTarget.parentId)) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        })
      );
    } else {
      setComments((prev) => [newComment, ...prev]);
    }

    setInputText("");
    setAttachedPhoto(null);
    setReplyTarget(null);
    setShowEmojiPicker(false);

    momentApi.addComment(moment.id, text.trim()).catch((err) =>
      console.warn("Lỗi gửi comment lên API:", err)
    );
  };

  const handleToggleLikeComment = (commentId: string, isReply = false, parentId?: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (!isReply && c.id === commentId) {
          return {
            ...c,
            liked: !c.liked,
            likesCount: c.liked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
          };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    liked: !r.liked,
                    likesCount: r.liked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );

    momentApi.likeComment(moment.id, commentId).catch((err) =>
      console.warn("Lỗi like comment:", err)
    );
  };

  // Dual-theme dynamic colors
  const themeBg = isDark ? "#0B0F17" : "#FFFFFF";
  const themeCard = isDark ? "#141D2D" : "#F1F5F9";
  const themeBorder = isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0";
  const themeText = isDark ? "#F8FAFC" : "#0F172A";
  const themeMuted = isDark ? "#94A3B8" : "#64748B";
  const themeInputBg = isDark ? "#0E1522" : "#F8FAFC";
  const themeInputBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheetContainer, { backgroundColor: themeBg, borderColor: themeBorder }]}>
          {/* Facebook-Style Top Bar */}
          <View style={[styles.headerBar, { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.15)" : "#FAF0E2" }]}>
                <MessageSquare size={16} color="#B48250" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: themeText }]}>Bình luận bài viết</Text>
                <Text style={[styles.headerSubTitle, { color: themeMuted }]}>
                  {moment.authorName} · {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} phản hồi
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9" }]} activeOpacity={0.7}>
              <X size={18} color={themeMuted} />
            </TouchableOpacity>
          </View>

          {/* Moment Snippet Box */}
          <View style={[styles.momentSnippet, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.06)" : "#FAF7F2", borderBottomColor: themeBorder }]}>
            <View style={styles.snippetTop}>
              <Text style={styles.snippetAuthor}>{moment.authorName}</Text>
              {moment.tag && (
                <View style={styles.snippetTag}>
                  <Text style={styles.snippetTagText}>#{moment.tag}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.snippetContent, { color: themeMuted }]} numberOfLines={2}>
              {moment.content}
            </Text>
          </View>

          {/* Facebook-Style Scrollable Comments Thread */}
          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.48 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {comments.map((cm) => (
              <View key={cm.id} style={styles.commentBlock}>
                {/* Parent Comment */}
                <View style={styles.commentItem}>
                  <Avatar url={cm.authorAvatar} name={cm.authorName} size={36} showGoldBorder />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={[styles.commentBubble, { backgroundColor: themeCard, borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }]}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, { color: themeText }]}>{cm.authorName}</Text>
                      </View>
                      <Text style={[styles.commentRole, { color: isDark ? "#D8B282" : "#926227" }]}>
                        {cm.authorRole} · {cm.authorCompany}
                      </Text>
                      <Text style={[styles.commentContent, { color: themeText }]}>{cm.content}</Text>

                      {cm.photoUrl && (
                        <View style={styles.attachedPhotoWrap}>
                          <Image source={{ uri: cm.photoUrl }} style={styles.attachedPhotoImg} resizeMode="cover" />
                        </View>
                      )}
                    </View>

                    {/* Facebook-style Action Row: Time · Thích · Phản hồi */}
                    <View style={styles.bubbleActionRow}>
                      <Text style={[styles.actionTime, { color: themeMuted }]}>{cm.timeAgo}</Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleToggleLikeComment(cm.id)}
                        activeOpacity={0.7}
                      >
                        <Heart
                          size={13}
                          color={cm.liked ? "#EF4444" : themeMuted}
                          fill={cm.liked ? "#EF4444" : "none"}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[styles.actionBtnText, cm.liked && styles.actionBtnTextLiked]}>
                          {cm.likesCount > 0 ? `${cm.likesCount} Thích` : "Thích"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSelectReply(cm)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: isDark ? "#D8B282" : "#926227" }]}>
                          Phản hồi
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Indented Nested Replies (Facebook Threading) */}
                {cm.replies && cm.replies.length > 0 && (
                  <View style={styles.repliesThreadContainer}>
                    {cm.replies.map((rep) => (
                      <View key={rep.id} style={styles.replyItem}>
                        <View style={styles.threadCurveLine} />
                        <Avatar url={rep.authorAvatar} name={rep.authorName} size={28} showGoldBorder />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={[styles.commentBubble, styles.replyBubble, { backgroundColor: themeCard, borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }]}>
                            <Text style={[styles.commentAuthor, { color: themeText, fontSize: 12 }]}>{rep.authorName}</Text>
                            <Text style={[styles.commentRole, { color: isDark ? "#D8B282" : "#926227", fontSize: 9.5 }]}>
                              {rep.authorRole} · {rep.authorCompany}
                            </Text>
                            <Text style={[styles.commentContent, { color: themeText, fontSize: 12.5 }]}>{rep.content}</Text>
                          </View>

                          <View style={styles.bubbleActionRow}>
                            <Text style={[styles.actionTime, { color: themeMuted, fontSize: 10 }]}>{rep.timeAgo}</Text>
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => handleToggleLikeComment(rep.id, true, cm.id)}
                              activeOpacity={0.7}
                            >
                              <Heart
                                size={11}
                                color={rep.liked ? "#EF4444" : themeMuted}
                                fill={rep.liked ? "#EF4444" : "none"}
                                style={{ marginRight: 2 }}
                              />
                              <Text style={[styles.actionBtnText, rep.liked && styles.actionBtnTextLiked, { fontSize: 11 }]}>
                                {rep.likesCount > 0 ? `${rep.likesCount} Thích` : "Thích"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => handleSelectReply(cm)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.actionBtnText, { color: isDark ? "#D8B282" : "#926227", fontSize: 11 }]}>
                                Phản hồi
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Quick Reactions Bar */}
          <View style={styles.quickReactionsRow}>
            {QUICK_REACTIONS.map((reaction, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickReactionPill, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9", borderColor: themeBorder }]}
                onPress={() => handleSendComment(reaction)}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickReactionText, { color: themeText }]}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Facebook-style Reply Status Banner */}
          {replyTarget && (
            <View style={[styles.replyingBanner, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.12)" : "#FFF8ED", borderColor: themeBorder }]}>
              <View style={styles.replyingBannerLeft}>
                <CornerDownRight size={13} color="#B48250" style={{ marginRight: 6 }} />
                <Text style={[styles.replyingText, { color: themeText }]} numberOfLines={1}>
                  Đang trả lời <Text style={{ fontWeight: "700", color: isDark ? "#D8B282" : "#8C653B" }}>@{replyTarget.authorName}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelReply} style={styles.cancelReplyBtn} activeOpacity={0.7}>
                <X size={14} color={themeMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Attached Image Preview */}
          {attachedPhoto && (
            <View style={styles.attachedPreviewRow}>
              <View style={styles.attachedPreviewContainer}>
                <Image source={{ uri: attachedPhoto }} style={styles.attachedPreviewThumb} />
                <TouchableOpacity onPress={() => setAttachedPhoto(null)} style={styles.removeAttachedBtn}>
                  <X size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.attachedNotice, { color: themeMuted }]}>Đã đính kèm ảnh xác thực giao thương</Text>
            </View>
          )}

          {/* Emoji Popover Tray */}
          {showEmojiPicker && (
            <View style={[styles.emojiTray, { backgroundColor: themeCard, borderColor: themeBorder }]}>
              {EMOJI_PALETTE.map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.emojiBtn}
                  onPress={() => handleInsertEmoji(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Facebook-Style Smart Comment Input Box */}
          <View style={[styles.inputBar, { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}>
            {/* User Avatar */}
            <Avatar url={user?.avatarUrl} name={user?.displayName || user?.name || "Doanh nhân"} size={36} showGoldBorder />

            {/* Pill Container */}
            <View style={[styles.inputPillContainer, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <TextInput
                ref={inputRef}
                style={[styles.commentInput, { color: themeText }]}
                placeholder={replyTarget ? `Phản hồi @${replyTarget.authorName}...` : "Viết bình luận công khai..."}
                placeholderTextColor={themeMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendComment()}
                multiline={false}
              />

              {/* Action Icons inside Pill: Emoji + Camera + @ */}
              <View style={styles.pillActions}>
                <TouchableOpacity
                  style={styles.pillIconBtn}
                  onPress={() => setShowEmojiPicker((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Smile size={18} color={showEmojiPicker ? "#B48250" : themeMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillIconBtn}
                  onPress={handleToggleAttachPhoto}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color={attachedPhoto ? "#10B981" : themeMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillIconBtn}
                  onPress={() => setInputText((prev) => prev + "@")}
                  activeOpacity={0.7}
                >
                  <AtSign size={17} color={themeMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Champagne Gold Send Button */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() && !attachedPhoto) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSendComment()}
              disabled={!inputText.trim() && !attachedPhoto}
              activeOpacity={0.8}
            >
              <Send size={15} color="#050C15" />
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSubTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  momentSnippet: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  snippetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  snippetAuthor: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#B48250",
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
    color: "#B48250",
  },
  snippetContent: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  commentBlock: {
    marginBottom: 14,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentBubble: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignSelf: "flex-start",
    maxWidth: "96%",
  },
  replyBubble: {
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
  },
  commentRole: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: "500",
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  attachedPhotoWrap: {
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
    maxHeight: 120,
    maxWidth: 200,
  },
  attachedPhotoImg: {
    width: "100%",
    height: 120,
  },
  bubbleActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    paddingLeft: 8,
  },
  actionTime: {
    fontSize: 10.5,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  actionBtnTextLiked: {
    color: "#EF4444",
    fontWeight: "700",
  },
  repliesThreadContainer: {
    marginLeft: 26,
    marginTop: 6,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: "rgba(216, 178, 130, 0.3)",
  },
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  threadCurveLine: {
    position: "absolute",
    left: -12,
    top: 14,
    width: 10,
    height: 1.5,
    backgroundColor: "rgba(216, 178, 130, 0.3)",
  },
  quickReactionsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    overflow: "hidden",
  },
  quickReactionPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  quickReactionText: {
    fontSize: 10.5,
    fontWeight: "500",
  },
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  replyingBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  replyingText: {
    fontSize: 11.5,
  },
  cancelReplyBtn: {
    padding: 3,
  },
  attachedPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  attachedPreviewContainer: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
  },
  attachedPreviewThumb: {
    width: "100%",
    height: "100%",
  },
  removeAttachedBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 2,
  },
  attachedNotice: {
    fontSize: 11,
    fontStyle: "italic",
  },
  emojiTray: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 19,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputPillContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  pillActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 6,
  },
  pillIconBtn: {
    padding: 2,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DFB76C",
    borderWidth: 1,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DFB76C",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
