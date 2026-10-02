import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { X, Camera, Image as ImageIcon, Sparkles, Check, Tag } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { StoryItemData } from "./StoryViewerModal";

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: StoryItemData) => void;
}

const SAMPLE_STORY_IMAGES = [
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
];

const STORY_TAGS = [
  "Cơ hội hợp tác",
  "Xúc tiến đầu tư",
  "Ký kết đối tác",
  "Bàn tròn CEO",
  "Gặp gỡ đối tác",
  "Sự kiện hôm nay",
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onStoryCreated,
}) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [selectedTag, setSelectedTag] = useState("Cơ hội hợp tác");
  const [selectedImage, setSelectedImage] = useState(SAMPLE_STORY_IMAGES[0]);

  const handlePost = () => {
    if (!caption.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung chia sẻ khoảnh khắc.");
      return;
    }

    const newStory: StoryItemData = {
      id: "story-" + Date.now(),
      authorName: user?.displayName || user?.name || "Doanh nhân ViOne",
      authorTitle: user?.title || "Chủ tịch & Tổng Giám Đốc",
      authorCompany: user?.company || "Tập đoàn Đầu tư & Công nghệ ViOne",
      authorAvatar: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      storyImage: selectedImage,
      storyCaption: caption.trim(),
      tag: selectedTag,
      timeAgo: "Vừa xong",
      viewsCount: 1,
    };

    onStoryCreated(newStory);
    Alert.alert("Thành công", "Đã đăng khoảnh khắc 24h lên mạng lưới doanh nhân ViOne.");
    setCaption("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Đăng Khoảnh Khắc 24h</Text>
              <Text style={styles.headerSubtitle}>
                Chia sẻ tin tức, cơ hội hợp tác, sự kiện giao thương
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Image Preview & Selector */}
            <Text style={styles.sectionLabel}>CHỌN ẢNH KHOẢNH KHẮC</Text>
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewTagBadge}>
                <Text style={styles.previewTagText}>{selectedTag}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
              {SAMPLE_STORY_IMAGES.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumbItem, selectedImage === img && styles.thumbItemActive]}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} />
                  {selectedImage === img && (
                    <View style={styles.thumbCheck}>
                      <Check size={12} color="#050C15" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input Caption */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>NỘI DUNG CHIA SẺ</Text>
            <TextInput
              style={styles.captionInput}
              multiline
              numberOfLines={3}
              placeholder="Chia sẻ cơ hội hợp tác kinh doanh, sự kiện kết nối hôm nay..."
              placeholderTextColor="#94A3B8"
              value={caption}
              onChangeText={setCaption}
            />

            {/* Tag Selection */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>CHỦ ĐỀ KHOẢNH KHẮC</Text>
            <View style={styles.tagsWrap}>
              {STORY_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagPillText, selectedTag === tag && styles.tagPillTextActive]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handlePost} activeOpacity={0.85}>
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Sparkles size={16} color="#050C15" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Đăng Khoảnh Khắc</Text>
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
    backgroundColor: "#12151F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  previewContainer: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewTagBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(10, 10, 11, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D8B282",
  },
  previewTagText: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "700",
  },
  thumbScroll: {
    marginTop: 10,
  },
  thumbItem: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  thumbItemActive: {
    borderColor: "#D8B282",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#D8B282",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  captionInput: {
    backgroundColor: "#181D2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 70,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tagPillActive: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderColor: "#D8B282",
  },
  tagPillText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },
  tagPillTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelBtnText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  submitBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "700",
  },
});
