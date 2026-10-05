import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Tag,
  Globe,
  Users,
  Check,
  Send,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./common/Avatar";
import { momentApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PostMomentModalProps {
  visible: boolean;
  onClose: () => void;
  onPostSuccess: (newMoment: {
    id: string;
    authorName: string;
    authorTitle: string;
    authorCompany: string;
    authorAvatar?: string;
    content: string;
    imageUrl?: string;
    tag: string;
    timeAgo: string;
    likesCount: number;
    commentsCount: number;
  }) => void;
}

const MOMENT_TAGS = [
  "Ký kết đối tác",
  "Xúc tiến đầu tư",
  "Hội nghị cấp cao",
  "Bàn tròn CEO",
  "Dự án mới",
  "Giao lưu 1-1",
];

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80",
];

export const PostMomentModal: React.FC<PostMomentModalProps> = ({
  visible,
  onClose,
  onPostSuccess,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState(MOMENT_TAGS[0]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(SAMPLE_PHOTOS[0]);
  const [audience, setAudience] = useState<"public" | "community">("public");
  const [submitting, setSubmitting] = useState(false);

  const displayName = user?.displayName || user?.name || "Doanh nhân ViOne";
  const userTitle = user?.title || "Chủ tịch HĐQT & Tổng Giám Đốc";
  const userCompany = user?.company || "Tập đoàn ViOne";

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung chia sẻ khoảnh khắc doanh nhân.");
      return;
    }

    setSubmitting(true);
    const newMoment = {
      id: `moment-${Date.now()}`,
      authorName: displayName,
      authorTitle: userTitle,
      authorCompany: userCompany,
      authorAvatar: user?.avatarUrl ?? undefined,
      content: content.trim(),
      imageUrl: selectedPhoto || undefined,
      tag: selectedTag,
      timeAgo: "Vừa xong",
      likesCount: 1,
      commentsCount: 0,
    };

    try {
      await momentApi.createMoment({
        content: content.trim(),
        photoUrls: selectedPhoto ? [selectedPhoto] : [],
        visibility: audience,
      });
    } catch (err) {
      console.warn("Lỗi đăng moment lên API:", err);
    }

    setSubmitting(false);
    onPostSuccess(newMoment);
    Alert.alert("Thành công", "Khoảnh khắc giao thương đã được công bố trên bản tin ViOne.");
    setContent("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Sparkles size={16} color="#D8B282" />
              </View>
              <Text style={styles.headerTitle}>Đăng khoảnh khắc doanh nhân</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.8 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Author Row */}
            <View style={styles.authorRow}>
              <Avatar url={user?.avatarUrl} name={displayName} size={44} showGoldBorder />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{displayName}</Text>
                <Text style={styles.authorRole}>{userTitle} · {userCompany}</Text>
              </View>

              {/* Audience Pill */}
              <TouchableOpacity
                style={styles.audienceBtn}
                onPress={() => setAudience(audience === "public" ? "community" : "public")}
                activeOpacity={0.8}
              >
                {audience === "public" ? (
                  <>
                    <Globe size={11} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.audienceText}>Mạng lưới ViOne</Text>
                  </>
                ) : (
                  <>
                    <Users size={11} color="#D8B282" style={{ marginRight: 4 }} />
                    <Text style={styles.audienceText}>Cộng đồng</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Tag Selector */}
            <View style={styles.tagSection}>
              <Text style={styles.sectionLabel}>CHỦ ĐỀ KHOẢNH KHẮC</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {MOMENT_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]}
                    onPress={() => setSelectedTag(tag)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tagPillText, selectedTag === tag && styles.tagPillTextActive]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Content Input */}
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textArea}
                placeholder="Chia sẻ bước tiến doanh nghiệp, hợp đồng ký kết mới hoặc cảm nghĩ sau buổi gặp giao thương..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={5}
                value={content}
                onChangeText={setContent}
              />
            </View>

            {/* Photo Attachment Picker */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionLabel}>ĐÍNH KÈM HÌNH ẢNH HOẠT ĐỘNG</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {SAMPLE_PHOTOS.map((imgUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.photoThumb, selectedPhoto === imgUri && styles.photoThumbActive]}
                    onPress={() => setSelectedPhoto(selectedPhoto === imgUri ? null : imgUri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: imgUri }} style={styles.photoImg} />
                    {selectedPhoto === imgUri && (
                      <View style={styles.photoCheckOverlay}>
                        <Check size={14} color="#050C15" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Bottom Submit */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handlePost}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Send size={16} color="#050C15" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  {submitting ? "Đang công bố..." : "Đăng khoảnh khắc doanh nhân"}
                </Text>
              </LinearGradient>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 11,
    color: "#94A3B8",
  },
  audienceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
  },
  tagSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagScroll: {
    flexDirection: "row",
  },
  tagPill: {
    backgroundColor: "#12151F",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagPillActive: {
    backgroundColor: "rgba(216, 178, 130, 0.18)",
    borderColor: "#D8B282",
  },
  tagPillText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  tagPillTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  inputWrap: {
    backgroundColor: "#12151F",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    fontSize: 14,
    color: "#F8FAFC",
    minHeight: 100,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoScroll: {
    flexDirection: "row",
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  photoThumbActive: {
    borderColor: "#D8B282",
    borderWidth: 2,
  },
  photoImg: {
    width: "100%",
    height: "100%",
  },
  photoCheckOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#D8B282",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
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
});
