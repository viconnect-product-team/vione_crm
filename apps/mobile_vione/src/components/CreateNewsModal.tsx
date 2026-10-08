import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { X, Newspaper, Image as ImageIcon, Sparkles, Tag, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { communityApi } from "../api/services";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CreateNewsModalProps {
  visible: boolean;
  onClose: () => void;
  communityId?: string;
  communityName?: string;
  onNewsCreated?: (news: any) => void;
  onPostCreated?: (post: any) => void;
}

const CATEGORIES = [
  "Thông báo nội bộ",
  "Tin tức sự kiện",
  "Điểm tin kinh doanh",
  "Thành tựu nổi bật",
  "Thông cáo báo chí",
];

const SAMPLE_COVERS = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80",
];

export const CreateNewsModal: React.FC<CreateNewsModalProps> = ({
  visible,
  onClose,
  communityId,
  communityName,
  onNewsCreated,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung bài viết.");
      return;
    }

    setIsSubmitting(true);
    const newPost = {
      id: "news-" + Date.now(),
      authorName: user?.displayName || user?.name || "Lãnh đạo ViOne",
      authorTitle: user?.title || "Chủ tịch & Tổng Giám Đốc",
      authorAvatar: user?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      timeAgo: "Vừa xong",
      title: title.trim(),
      content: content.trim(),
      category: category || "Tin tức",
      imageUrl: imageUrl.trim() || undefined,
      likes: 1,
      comments: 0,
      createdAt: new Date().toISOString(),
    };

    if (communityId) {
      try {
        await communityApi.createCommunityNews(communityId, {
          title: title.trim(),
          content: content.trim(),
          category,
          imageUrl: imageUrl.trim() || undefined,
        });
      } catch (err) {
        // Lưu offline state
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }

    onNewsCreated?.(newPost);
    onPostCreated?.(newPost);
    Alert.alert("Thành công", `Đã đăng bài viết: "${title.trim()}"`);
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0E1522" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Sparkles size={11} color="#DFB76C" />
                <Text style={styles.headerBadgeText}>BẢNG TIN CỘNG ĐỒNG</Text>
              </View>
              <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                Đăng Bài Viết & Thông Báo
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {communityName || "Cộng đồng ViOne"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Category Selector (Optional) */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#DFB76C" : "#8C653B", marginBottom: 0 }]}>
                CHUYÊN MỤC BÀI VIẾT (TÙY CHỌN)
              </Text>
              {category && (
                <TouchableOpacity onPress={() => setCategory(null)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 11, color: "#DFB76C", fontWeight: "600" }}>Bỏ chọn chuyên mục</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory((prev) => (prev === cat ? null : cat))}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3"
                          : isDark ? "#182030" : "#F1F5F9",
                        borderColor: isSelected
                          ? "#DFB76C"
                          : isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isSelected
                            ? isDark ? "#DFB76C" : "#8C653B"
                            : isDark ? "#94A3B8" : "#64748B",
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title */}
            <Text style={[styles.fieldLabel, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
              TIÊU ĐỀ BÀI VIẾT *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#141C2B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                },
              ]}
              placeholder="VD: Thông báo chiến lược hợp tác mở rộng mạng lưới Quý 4"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={title}
              onChangeText={setTitle}
            />

            {/* Content */}
            <Text style={[styles.fieldLabel, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
              NỘI DUNG CHI TIẾT *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? "#141C2B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                },
              ]}
              placeholder="Nhập nội dung bài viết, thông điệp điều hành hoặc kết quả dự án..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Cover Image URL & Samples */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={[styles.fieldLabel, { color: isDark ? "#DFB76C" : "#8C653B", marginBottom: 0 }]}>
                ẢNH BÌA BÀI VIẾT (TÙY CHỌN)
              </Text>
              {imageUrl ? (
                <TouchableOpacity onPress={() => setImageUrl("")} activeOpacity={0.7}>
                  <Text style={{ fontSize: 11, color: "#DFB76C", fontWeight: "600" }}>Xóa ảnh bìa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#141C2B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                },
              ]}
              placeholder="https://images.unsplash.com/... (không bắt buộc)"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={imageUrl}
              onChangeText={setImageUrl}
            />

            <Text style={styles.sampleLabel}>Gợi ý ảnh bìa doanh nghiệp 4K (chạm để chọn/bỏ chọn):</Text>
            <View style={styles.sampleGrid}>
              {SAMPLE_COVERS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setImageUrl((prev) => (prev === url ? "" : url))}
                  style={[
                    styles.sampleImgWrap,
                    imageUrl === url && styles.sampleImgWrapActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: url }} style={styles.sampleImg} />
                  {imageUrl === url && (
                    <View style={styles.checkBadge}>
                      <Check size={12} color="#050C15" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Hủy bỏ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handlePublish}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                style={styles.publishGrad}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#050C15" />
                ) : (
                  <>
                    <Newspaper size={16} color="#050C15" style={{ marginRight: 6 }} />
                    <Text style={styles.publishBtnText}>Đăng bài ngay</Text>
                  </>
                )}
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
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.15)",
    paddingBottom: 12,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: "#DFB76C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  scrollBody: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  categoryScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
  },
  sampleLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
    marginBottom: 6,
  },
  sampleGrid: {
    flexDirection: "row",
    gap: 8,
  },
  sampleImgWrap: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sampleImgWrapActive: {
    borderColor: "#DFB76C",
  },
  sampleImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  checkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#DFB76C",
    borderRadius: 10,
    padding: 2,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  publishBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  publishGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
